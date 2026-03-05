import * as THREE from "three";
import { CuboidShape } from "../../../shapes/cuboid";
import type { AdapterContext, AdapterSession, DragUpdate, EditableEntity, EditorAdapter, EditorHandle } from "../../types";
import { safeConfig, applyConfig } from "./shared";
import { clampMin } from "../../math/GizmoMath";

interface CuboidConfig {
  center: { x: number; y: number; z: number };
  width: number;
  height: number;
  depth: number;
  color: number;
}

export const cuboidAdapter: EditorAdapter = {
  id: "builtin-cuboid",
  priority: 60,
  match(target: EditableEntity): boolean {
    return target instanceof CuboidShape;
  },
  getDragSpace(_target: EditableEntity, handle: EditorHandle): "planar" | "spatial" {
    if (handle.type === "scale-axis") {
      return "spatial";
    }
    return "spatial";
  },
  getHandles(target: EditableEntity, _ctx: AdapterContext): EditorHandle[] {
    const config = safeConfig(target) as CuboidConfig;
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
        id: `${targetId}-scale-x`,
        targetId,
        type: "scale-axis",
        axis: "x",
        dragSpace: "spatial",
        position: center.clone().add(new THREE.Vector3(config.width * 0.5 + 0.1, 0, 0)),
      },
      {
        id: `${targetId}-scale-y`,
        targetId,
        type: "scale-axis",
        axis: "y",
        dragSpace: "spatial",
        position: center.clone().add(new THREE.Vector3(0, config.height * 0.5 + 0.1, 0)),
      },
      {
        id: `${targetId}-scale-z`,
        targetId,
        type: "scale-axis",
        axis: "z",
        dragSpace: "spatial",
        position: center.clone().add(new THREE.Vector3(0, 0, config.depth * 0.5 + 0.1)),
      },
    ];
  },
  beginSession(target: EditableEntity): AdapterSession {
    return {
      before: safeConfig(target),
    };
  },
  applyDrag(target: EditableEntity, handle: EditorHandle, session: AdapterSession, update: DragUpdate): void {
    if (!(target instanceof CuboidShape)) {
      return;
    }

    const before = session.before as CuboidConfig;
    const config = safeConfig(target) as CuboidConfig;

    if (handle.type === "move") {
      config.center = {
        x: before.center.x + update.delta.x,
        y: before.center.y + update.delta.y,
        z: before.center.z + update.delta.z,
      };
      applyConfig(target, config);
      return;
    }

    if (handle.type === "scale-axis") {
      if (handle.axis === "x") {
        config.width = clampMin(before.width + update.delta.x * 2, 0.05);
      } else if (handle.axis === "y") {
        config.height = clampMin(before.height + update.delta.y * 2, 0.05);
      } else if (handle.axis === "z") {
        config.depth = clampMin(before.depth + update.delta.z * 2, 0.05);
      }
      applyConfig(target, config);
    }
  },
  getSnapPoints(target: EditableEntity): THREE.Vector3[] {
    if (!(target instanceof CuboidShape)) {
      return [];
    }

    const config = safeConfig(target) as CuboidConfig;
    return [new THREE.Vector3(config.center.x, config.center.y, config.center.z)];
  },
};
