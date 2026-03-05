import * as THREE from "three";
import { RectanglePrimitive } from "../../../primitives/rectangle";
import type { AdapterContext, AdapterSession, DragUpdate, EditableEntity, EditorAdapter, EditorHandle } from "../../types";
import { addPlanarMoveHandle, addPlanarRotateHandle, safeConfig } from "./shared";
import { clampMin } from "../../math/GizmoMath";

interface RectangleConfig {
  center: [number, number, number];
  width: number;
  breadth: number;
}

export const rectangleAdapter: EditorAdapter = {
  id: "builtin-rectangle",
  priority: 70,
  match(target: EditableEntity): boolean {
    return target instanceof RectanglePrimitive;
  },
  getDragSpace(): "planar" {
    return "planar";
  },
  getHandles(target: EditableEntity, _ctx: AdapterContext): EditorHandle[] {
    const config = safeConfig(target) as RectangleConfig;
    const center = new THREE.Vector3(...config.center);
    const targetId = String(target.ogid ?? target.id);

    return [
      addPlanarMoveHandle(target, targetId),
      addPlanarRotateHandle(target, targetId),
      {
        id: `${targetId}-width`,
        targetId,
        type: "width",
        axis: "x",
        dragSpace: "planar",
        position: center.clone().add(new THREE.Vector3(config.width * 0.5 + 0.2, 0, 0)),
      },
      {
        id: `${targetId}-depth`,
        targetId,
        type: "depth",
        axis: "z",
        dragSpace: "planar",
        position: center.clone().add(new THREE.Vector3(0, 0, config.breadth * 0.5 + 0.2)),
      },
    ];
  },
  beginSession(target: EditableEntity): AdapterSession {
    return {
      before: safeConfig(target),
      startPosition: target.position.clone(),
      startRotationY: target.rotation.y,
    };
  },
  applyDrag(target: EditableEntity, handle: EditorHandle, session: AdapterSession, update: DragUpdate): void {
    if (!(target instanceof RectanglePrimitive)) {
      return;
    }

    const before = session.before as RectangleConfig;

    if (handle.type === "move") {
      target.position.copy((session.startPosition as THREE.Vector3).clone().add(update.delta));
      return;
    }

    if (handle.type === "rotate") {
      const center = target.position.clone();
      const startVector = handle.position.clone().sub(center);
      const nowVector = update.snapped.point.clone().sub(center);
      const startAngle = Math.atan2(startVector.z, startVector.x);
      const nowAngle = Math.atan2(nowVector.z, nowVector.x);
      target.rotation.y = (session.startRotationY as number) + (nowAngle - startAngle);
      return;
    }

    if (handle.type === "width") {
      target.width = clampMin(before.width + update.delta.x * 2, 0.05);
      return;
    }

    if (handle.type === "depth") {
      target.breadth = clampMin(before.breadth + update.delta.z * 2, 0.05);
    }
  },
  getSnapPoints(target: EditableEntity): THREE.Vector3[] {
    if (!(target instanceof RectanglePrimitive)) {
      return [];
    }

    const config = safeConfig(target) as RectangleConfig;
    const center = new THREE.Vector3(...config.center);
    const hw = config.width * 0.5;
    const hd = config.breadth * 0.5;

    return [
      center.clone().add(new THREE.Vector3(-hw, 0, -hd)),
      center.clone().add(new THREE.Vector3(-hw, 0, hd)),
      center.clone().add(new THREE.Vector3(hw, 0, hd)),
      center.clone().add(new THREE.Vector3(hw, 0, -hd)),
      center,
    ];
  },
};
