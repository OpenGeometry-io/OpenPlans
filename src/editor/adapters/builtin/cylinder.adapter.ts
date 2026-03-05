import * as THREE from "three";
import { CylinderShape } from "../../../shapes/cylinder";
import type { AdapterContext, AdapterSession, DragUpdate, EditableEntity, EditorAdapter, EditorHandle } from "../../types";
import { applyConfig, safeConfig } from "./shared";
import { clampMin } from "../../math/GizmoMath";

interface CylinderConfig {
  center: { x: number; y: number; z: number };
  radius: number;
  height: number;
  segments: number;
  angle: number;
  color: number;
}

export const cylinderAdapter: EditorAdapter = {
  id: "builtin-cylinder",
  priority: 55,
  match(target: EditableEntity): boolean {
    return target instanceof CylinderShape;
  },
  getDragSpace(): "spatial" {
    return "spatial";
  },
  getHandles(target: EditableEntity, _ctx: AdapterContext): EditorHandle[] {
    const config = safeConfig(target) as CylinderConfig;
    const center = new THREE.Vector3(config.center.x, config.center.y, config.center.z);
    const targetId = String(target.ogid ?? target.id);

    return [
      {
        id: `${targetId}-move`,
        targetId,
        type: "move",
        axis: "free",
        dragSpace: "spatial",
        position: center.clone(),
      },
      {
        id: `${targetId}-radius`,
        targetId,
        type: "radius",
        axis: "xz",
        dragSpace: "spatial",
        position: center.clone().add(new THREE.Vector3(config.radius + 0.15, 0, 0)),
      },
      {
        id: `${targetId}-height`,
        targetId,
        type: "scale-axis",
        axis: "y",
        dragSpace: "spatial",
        position: center.clone().add(new THREE.Vector3(0, config.height * 0.5 + 0.1, 0)),
      },
    ];
  },
  beginSession(target: EditableEntity): AdapterSession {
    return {
      before: safeConfig(target),
    };
  },
  applyDrag(target: EditableEntity, handle: EditorHandle, session: AdapterSession, update: DragUpdate): void {
    if (!(target instanceof CylinderShape)) {
      return;
    }

    const before = session.before as CylinderConfig;
    const config = safeConfig(target) as CylinderConfig;

    if (handle.type === "move") {
      config.center = {
        x: before.center.x + update.delta.x,
        y: before.center.y + update.delta.y,
        z: before.center.z + update.delta.z,
      };
      applyConfig(target, config);
      return;
    }

    if (handle.type === "radius") {
      const center = new THREE.Vector3(before.center.x, before.center.y, before.center.z);
      config.radius = clampMin(update.snapped.point.clone().setY(center.y).distanceTo(center), 0.05);
      applyConfig(target, config);
      return;
    }

    if (handle.type === "scale-axis") {
      config.height = clampMin(before.height + update.delta.y * 2, 0.05);
      applyConfig(target, config);
    }
  },
  getSnapPoints(target: EditableEntity): THREE.Vector3[] {
    if (!(target instanceof CylinderShape)) {
      return [];
    }

    const config = safeConfig(target) as CylinderConfig;
    return [new THREE.Vector3(config.center.x, config.center.y, config.center.z)];
  },
};
