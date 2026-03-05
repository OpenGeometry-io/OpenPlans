import * as THREE from "three";
import type { AdapterContext, AdapterSession, DragUpdate, EditableEntity, EditorAdapter, EditorHandle } from "../../types";
import { addPlanarMoveHandle, addPlanarRotateHandle } from "./shared";
import { computeEntityCenter } from "../../math/Bounds";

export const genericTransformAdapter: EditorAdapter = {
  id: "builtin-generic-transform",
  priority: -100,
  match(target: EditableEntity): boolean {
    return !!target && target.visible !== false;
  },
  getDragSpace(_target: EditableEntity, _handle: EditorHandle): "planar" | "spatial" {
    return "planar";
  },
  getHandles(target: EditableEntity, ctx: AdapterContext): EditorHandle[] {
    const targetId = String(target.ogid ?? target.id);

    const moveHandle =
      ctx.mode === "plan"
        ? addPlanarMoveHandle(target, targetId)
        : {
            id: `${targetId}-move`,
            targetId,
            type: "move" as const,
            axis: "free" as const,
            dragSpace: "spatial" as const,
            position: computeEntityCenter(target),
          };

    const rotateHandle = addPlanarRotateHandle(target, targetId);
    return [moveHandle, rotateHandle];
  },
  beginSession(target: EditableEntity): AdapterSession {
    return {
      before: {},
      startPosition: target.position.clone(),
      startRotationY: target.rotation.y,
    };
  },
  applyDrag(target: EditableEntity, handle: EditorHandle, session: AdapterSession, update: DragUpdate): void {
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
    }
  },
  getSnapPoints(target: EditableEntity): THREE.Vector3[] {
    return [computeEntityCenter(target)];
  },
};
