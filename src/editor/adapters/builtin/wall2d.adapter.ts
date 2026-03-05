import * as THREE from "three";
import { Vector3 } from "../../../kernel";
import { Wall2D } from "../../../elements/planview/wall2D";
import type { AdapterContext, AdapterSession, DragUpdate, EditableEntity, EditorAdapter, EditorHandle } from "../../types";
import { addPlanarMoveHandle, addPlanarRotateHandle, readPoints, safeConfig } from "./shared";

function pointArrayToVectors(points: Array<{ x: number; y: number; z: number }>): Vector3[] {
  return points.map((point) => new Vector3(point.x, point.y, point.z));
}

export const wall2DAdapter: EditorAdapter = {
  id: "builtin-wall2d",
  priority: 100,
  match(target: EditableEntity): boolean {
    return target instanceof Wall2D;
  },
  getDragSpace(): "planar" {
    return "planar";
  },
  getHandles(target: EditableEntity, _ctx: AdapterContext): EditorHandle[] {
    const wall = target as unknown as Wall2D;
    const points = readPoints(safeConfig(wall));
    const targetId = String(wall.ogid ?? wall.id);

    const handles: EditorHandle[] = [
      addPlanarMoveHandle(wall, targetId),
      addPlanarRotateHandle(wall, targetId),
    ];

    points.forEach((point, index) => {
      handles.push({
        id: `${targetId}-vertex-${index}`,
        targetId,
        type: "vertex",
        axis: "xz",
        dragSpace: "planar",
        position: new THREE.Vector3(point.x, point.y, point.z),
        metadata: { index },
      });
    });

    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      handles.push({
        id: `${targetId}-edge-${i}`,
        targetId,
        type: "edge",
        axis: "xz",
        dragSpace: "planar",
        position: new THREE.Vector3((start.x + end.x) * 0.5, 0, (start.z + end.z) * 0.5),
        metadata: { index: i },
      });
    }

    if (points.length >= 2) {
      const first = new THREE.Vector3(points[0].x, points[0].y, points[0].z);
      const second = new THREE.Vector3(points[1].x, points[1].y, points[1].z);
      const direction = second.clone().sub(first).normalize();
      const normal = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
      const middle = first.clone().add(second).multiplyScalar(0.5);
      const offset = normal.multiplyScalar(wall.wallThickness * 0.5 + 0.25);
      handles.push({
        id: `${targetId}-width-0`,
        targetId,
        type: "width",
        axis: "xz",
        dragSpace: "planar",
        position: middle.add(offset),
        metadata: {
          normal: [normal.x, normal.y, normal.z],
        },
      });
    }

    return handles;
  },
  beginSession(target: EditableEntity, handle: EditorHandle): AdapterSession {
    const wall = target as unknown as Wall2D;
    const session: AdapterSession = {
      before: safeConfig(wall),
      startPosition: wall.position.clone(),
      startRotationY: wall.rotation.y,
    };

    if (handle.type === "width") {
      const normal = handle.metadata?.normal as [number, number, number] | undefined;
      if (normal) {
        session.normal = new THREE.Vector3(normal[0], normal[1], normal[2]);
      }
      session.beforeThickness = wall.wallThickness;
    }

    if (handle.type === "rotate") {
      session.rotatePivot = target.position.clone();
      session.rotateStartVector = handle.position.clone().sub(target.position);
    }

    return session;
  },
  applyDrag(target: EditableEntity, handle: EditorHandle, session: AdapterSession, update: DragUpdate): void {
    if (!(target instanceof Wall2D)) {
      return;
    }

    const beforeConfig = session.before;
    const beforePoints = readPoints(beforeConfig);

    if (handle.type === "move") {
      target.position.copy((session.startPosition as THREE.Vector3).clone().add(update.delta));
      return;
    }

    if (handle.type === "rotate") {
      const pivot = (session.rotatePivot as THREE.Vector3) ?? target.position;
      const startVector = (session.rotateStartVector as THREE.Vector3) ?? new THREE.Vector3(1, 0, 0);
      const nowVector = update.snapped.point.clone().sub(pivot);
      const startAngle = Math.atan2(startVector.z, startVector.x);
      const nowAngle = Math.atan2(nowVector.z, nowVector.x);
      target.rotation.y = (session.startRotationY as number) + (nowAngle - startAngle);
      return;
    }

    if (handle.type === "vertex") {
      const index = Number(handle.metadata?.index ?? -1);
      if (index < 0 || index >= beforePoints.length) {
        return;
      }

      const points = [...beforePoints];
      points[index] = {
        x: update.snapped.point.x,
        y: update.snapped.point.y,
        z: update.snapped.point.z,
      };
      target.updatePoints(pointArrayToVectors(points));
      return;
    }

    if (handle.type === "edge") {
      const edgeIndex = Number(handle.metadata?.index ?? -1);
      if (edgeIndex < 0 || edgeIndex >= beforePoints.length - 1) {
        return;
      }

      const points = beforePoints.map((point) => ({ ...point }));
      points[edgeIndex].x += update.delta.x;
      points[edgeIndex].z += update.delta.z;
      points[edgeIndex + 1].x += update.delta.x;
      points[edgeIndex + 1].z += update.delta.z;
      target.updatePoints(pointArrayToVectors(points));
      return;
    }

    if (handle.type === "width") {
      const normal = session.normal as THREE.Vector3 | undefined;
      if (!normal) {
        return;
      }

      const projection = update.delta.dot(normal);
      const startThickness = Number(session.beforeThickness ?? target.wallThickness);
      target.wallThickness = Math.max(0.05, startThickness + projection * 2);
    }
  },
  getSnapPoints(target: EditableEntity): THREE.Vector3[] {
    if (!(target instanceof Wall2D)) {
      return [];
    }

    const points = readPoints(safeConfig(target));
    return points.map((point) => new THREE.Vector3(point.x, point.y, point.z));
  },
};
