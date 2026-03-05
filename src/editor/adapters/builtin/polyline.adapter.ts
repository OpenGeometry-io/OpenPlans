import * as THREE from "three";
import { PolylinePrimitive } from "../../../primitives/polyline";
import type { AdapterContext, AdapterSession, DragUpdate, EditableEntity, EditorAdapter, EditorHandle } from "../../types";
import { addPlanarMoveHandle, readPoints, safeConfig, translatedPoints, writePointsAsArrays } from "./shared";

export const polylineAdapter: EditorAdapter = {
  id: "builtin-polyline",
  priority: 80,
  match(target: EditableEntity): boolean {
    return target instanceof PolylinePrimitive;
  },
  getDragSpace(): "planar" {
    return "planar";
  },
  getHandles(target: EditableEntity, _ctx: AdapterContext): EditorHandle[] {
    const config = safeConfig(target);
    const points = readPoints(config);
    const targetId = String(target.ogid ?? target.id);

    const handles: EditorHandle[] = [addPlanarMoveHandle(target, targetId)];

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
        position: new THREE.Vector3((start.x + end.x) * 0.5, (start.y + end.y) * 0.5, (start.z + end.z) * 0.5),
        metadata: { index: i },
      });
    }

    return handles;
  },
  beginSession(target: EditableEntity): AdapterSession {
    return {
      before: safeConfig(target),
    };
  },
  applyDrag(target: EditableEntity, handle: EditorHandle, session: AdapterSession, update: DragUpdate): void {
    if (!(target instanceof PolylinePrimitive)) {
      return;
    }

    const beforeConfig = session.before;
    const points = readPoints(beforeConfig);
      const nextConfig = safeConfig(target);

    if (handle.type === "move") {
      writePointsAsArrays(nextConfig, translatedPoints(points, update.delta));
      target.setOPConfig(nextConfig);
      return;
    }

    if (handle.type === "vertex") {
      const index = Number(handle.metadata?.index ?? -1);
      if (index < 0 || index >= points.length) {
        return;
      }
      points[index] = {
        x: update.snapped.point.x,
        y: update.snapped.point.y,
        z: update.snapped.point.z,
      };
      writePointsAsArrays(nextConfig, points);
      target.setOPConfig(nextConfig);
      return;
    }

    if (handle.type === "edge") {
      const edgeIndex = Number(handle.metadata?.index ?? -1);
      if (edgeIndex < 0 || edgeIndex >= points.length - 1) {
        return;
      }

      const translated = translatedPoints(points, new THREE.Vector3(0, 0, 0));
      translated[edgeIndex] = {
        x: points[edgeIndex].x + update.delta.x,
        y: points[edgeIndex].y + update.delta.y,
        z: points[edgeIndex].z + update.delta.z,
      };
      translated[edgeIndex + 1] = {
        x: points[edgeIndex + 1].x + update.delta.x,
        y: points[edgeIndex + 1].y + update.delta.y,
        z: points[edgeIndex + 1].z + update.delta.z,
      };

      writePointsAsArrays(nextConfig, translated);
      target.setOPConfig(nextConfig);
    }
  },
  getSnapPoints(target: EditableEntity): THREE.Vector3[] {
    if (!(target instanceof PolylinePrimitive)) {
      return [];
    }

    return readPoints(safeConfig(target)).map((point) => new THREE.Vector3(point.x, point.y, point.z));
  },
};
