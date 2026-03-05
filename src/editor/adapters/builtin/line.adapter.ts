import * as THREE from "three";
import { LinePrimitive } from "../../../primitives/line";
import type { AdapterContext, AdapterSession, DragUpdate, EditableEntity, EditorAdapter, EditorHandle } from "../../types";
import { addPlanarMoveHandle, safeConfig } from "./shared";

interface LineConfig {
  startPoint: [number, number, number];
  endPoint: [number, number, number];
}

function toVector(point: [number, number, number]): THREE.Vector3 {
  return new THREE.Vector3(point[0], point[1], point[2]);
}

function toTuple(vec: THREE.Vector3): [number, number, number] {
  return [vec.x, vec.y, vec.z];
}

export const lineAdapter: EditorAdapter = {
  id: "builtin-line",
  priority: 90,
  match(target: EditableEntity): boolean {
    return target instanceof LinePrimitive;
  },
  getDragSpace(): "planar" {
    return "planar";
  },
  getHandles(target: EditableEntity, _ctx: AdapterContext): EditorHandle[] {
    const config = safeConfig(target) as LineConfig;
    const start = toVector(config.startPoint);
    const end = toVector(config.endPoint);
    const mid = start.clone().add(end).multiplyScalar(0.5);
    const targetId = String(target.ogid ?? target.id);

    return [
      addPlanarMoveHandle(target, targetId),
      {
        id: `${targetId}-vertex-0`,
        targetId,
        type: "vertex",
        axis: "xz",
        dragSpace: "planar",
        position: start,
        metadata: { index: 0 },
      },
      {
        id: `${targetId}-vertex-1`,
        targetId,
        type: "vertex",
        axis: "xz",
        dragSpace: "planar",
        position: end,
        metadata: { index: 1 },
      },
      {
        id: `${targetId}-edge-0`,
        targetId,
        type: "edge",
        axis: "xz",
        dragSpace: "planar",
        position: mid,
        metadata: { index: 0 },
      },
    ];
  },
  beginSession(target: EditableEntity): AdapterSession {
    return {
      before: safeConfig(target),
    };
  },
  applyDrag(target: EditableEntity, handle: EditorHandle, session: AdapterSession, update: DragUpdate): void {
    if (!(target instanceof LinePrimitive)) {
      return;
    }

    const config = session.before as LineConfig;
    const start = toVector(config.startPoint);
    const end = toVector(config.endPoint);

    if (handle.type === "move" || handle.type === "edge") {
      const nextStart = start.clone().add(update.delta);
      const nextEnd = end.clone().add(update.delta);
      target.startPoint = toTuple(nextStart);
      target.endPoint = toTuple(nextEnd);
      return;
    }

    if (handle.type === "vertex") {
      const index = handle.metadata?.index;
      if (index === 0) {
        target.startPoint = toTuple(update.snapped.point);
      } else {
        target.endPoint = toTuple(update.snapped.point);
      }
    }
  },
  getSnapPoints(target: EditableEntity): THREE.Vector3[] {
    if (!(target instanceof LinePrimitive)) {
      return [];
    }

    const config = safeConfig(target) as LineConfig;
    const start = toVector(config.startPoint);
    const end = toVector(config.endPoint);
    return [start, end, start.clone().add(end).multiplyScalar(0.5)];
  },
};
