import * as THREE from "three";
import { Vector3 } from "../../../kernel";
import { ArcPrimitive } from "../../../primitives/arc";
import type { AdapterContext, AdapterSession, DragUpdate, EditableEntity, EditorAdapter, EditorHandle } from "../../types";
import { addPlanarMoveHandle, safeConfig } from "./shared";
import { clampMin } from "../../math/GizmoMath";

interface ArcConfig {
  center: [number, number, number];
  radius: number;
  startAngle: number;
  endAngle: number;
}

function handlePositionFromAngle(center: THREE.Vector3, radius: number, angle: number): THREE.Vector3 {
  return new THREE.Vector3(
    center.x + Math.cos(angle) * radius,
    center.y,
    center.z + Math.sin(angle) * radius,
  );
}

export const arcAdapter: EditorAdapter = {
  id: "builtin-arc",
  priority: 65,
  match(target: EditableEntity): boolean {
    return target instanceof ArcPrimitive;
  },
  getDragSpace(): "planar" {
    return "planar";
  },
  getHandles(target: EditableEntity, _ctx: AdapterContext): EditorHandle[] {
    const arc = target as unknown as ArcPrimitive;
    const config = safeConfig(arc) as ArcConfig;
    const center = new THREE.Vector3(...config.center);
    const targetId = String(target.ogid ?? target.id);

    return [
      addPlanarMoveHandle(target, targetId),
      {
        id: `${targetId}-radius`,
        targetId,
        type: "radius",
        axis: "xz",
        dragSpace: "planar",
        position: handlePositionFromAngle(center, config.radius + 0.15, (config.startAngle + config.endAngle) * 0.5),
      },
      {
        id: `${targetId}-angle-start`,
        targetId,
        type: "angle",
        axis: "xz",
        dragSpace: "planar",
        position: handlePositionFromAngle(center, config.radius, config.startAngle),
        metadata: { which: "start" },
      },
      {
        id: `${targetId}-angle-end`,
        targetId,
        type: "angle",
        axis: "xz",
        dragSpace: "planar",
        position: handlePositionFromAngle(center, config.radius, config.endAngle),
        metadata: { which: "end" },
      },
    ];
  },
  beginSession(target: EditableEntity): AdapterSession {
    return {
      before: safeConfig(target),
      startPosition: target.position.clone(),
    };
  },
  applyDrag(target: EditableEntity, handle: EditorHandle, session: AdapterSession, update: DragUpdate): void {
    if (!(target instanceof ArcPrimitive)) {
      return;
    }

    const before = session.before as ArcConfig;
    const center = new THREE.Vector3(...before.center);

    if (handle.type === "move") {
      const nextCenter = center.clone().add(update.delta);
      target.arcCenter = new Vector3(nextCenter.x, nextCenter.y, nextCenter.z);
      return;
    }

    if (handle.type === "radius") {
      const radius = clampMin(update.snapped.point.clone().setY(0).distanceTo(center.clone().setY(0)), 0.05);
      target.arcRadius = radius;
      return;
    }

    if (handle.type === "angle") {
      const angle = Math.atan2(update.snapped.point.z - center.z, update.snapped.point.x - center.x);
      if (handle.metadata?.which === "start") {
        target.arcStartAngle = angle;
      } else {
        target.arcEndAngle = angle;
      }
    }
  },
  getSnapPoints(target: EditableEntity): THREE.Vector3[] {
    if (!(target instanceof ArcPrimitive)) {
      return [];
    }

    const config = safeConfig(target) as ArcConfig;
    const center = new THREE.Vector3(...config.center);

    return [
      center,
      handlePositionFromAngle(center, config.radius, config.startAngle),
      handlePositionFromAngle(center, config.radius, config.endAngle),
    ];
  },
};
