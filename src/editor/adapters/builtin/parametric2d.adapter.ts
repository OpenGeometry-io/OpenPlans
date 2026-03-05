import * as THREE from "three";
import { LinePrimitive } from "../../../primitives/line";
import { PolylinePrimitive } from "../../../primitives/polyline";
import { RectanglePrimitive } from "../../../primitives/rectangle";
import { ArcPrimitive } from "../../../primitives/arc";
import { CuboidShape } from "../../../shapes/cuboid";
import { CylinderShape } from "../../../shapes/cylinder";
import { Wall2D } from "../../../elements/planview/wall2D";
import { resolveParametricSchema } from "../schemas/builtin-schemas";
import type { AdapterContext, AdapterSession, DragUpdate, EditableEntity, EditorAdapter, EditorHandle } from "../../types";
import { addPlanarMoveHandle, addPlanarRotateHandle, applyConfig, safeConfig } from "./shared";
import { clampMin } from "../../math/GizmoMath";
import { computeEntityCenter, computeBoundsSize } from "../../math/Bounds";

function getByPath(target: Record<string, any>, path: string): any {
  return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), target);
}

function setByPath(target: Record<string, any>, path: string, value: any): void {
  const parts = path.split(".");
  let cursor = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (cursor[key] == null || typeof cursor[key] !== "object") {
      cursor[key] = {};
    }
    cursor = cursor[key];
  }
  cursor[parts[parts.length - 1]] = value;
}

function isExcluded(target: EditableEntity): boolean {
  return (
    target instanceof Wall2D ||
    target instanceof LinePrimitive ||
    target instanceof PolylinePrimitive ||
    target instanceof RectanglePrimitive ||
    target instanceof ArcPrimitive ||
    target instanceof CuboidShape ||
    target instanceof CylinderShape
  );
}

export const parametric2DAdapter: EditorAdapter = {
  id: "builtin-parametric2d",
  priority: 10,
  match(target: EditableEntity): boolean {
    if (isExcluded(target)) {
      return false;
    }

    const config = safeConfig(target);
    return resolveParametricSchema(config) !== null;
  },
  getDragSpace(): "planar" {
    return "planar";
  },
  getHandles(target: EditableEntity, _ctx: AdapterContext): EditorHandle[] {
    const config = safeConfig(target);
    const schema = resolveParametricSchema(config);
    const targetId = String(target.ogid ?? target.id);
    const center = computeEntityCenter(target);
    const bounds = computeBoundsSize(target);

    const handles: EditorHandle[] = [
      addPlanarMoveHandle(target, targetId),
      addPlanarRotateHandle(target, targetId),
    ];

    if (schema?.widthPath) {
      const width = Number(getByPath(config, schema.widthPath) ?? bounds.x);
      handles.push({
        id: `${targetId}-width`,
        targetId,
        type: "width",
        axis: "x",
        dragSpace: "planar",
        position: center.clone().add(new THREE.Vector3(width * 0.5 + 0.2, 0, 0)),
      });
    }

    if (schema?.depthPath) {
      const depth = Number(getByPath(config, schema.depthPath) ?? bounds.z);
      handles.push({
        id: `${targetId}-depth`,
        targetId,
        type: "depth",
        axis: "z",
        dragSpace: "planar",
        position: center.clone().add(new THREE.Vector3(0, 0, depth * 0.5 + 0.2)),
      });
    }

    if (schema?.radiusPath) {
      const radius = Number(getByPath(config, schema.radiusPath) ?? Math.max(bounds.x, bounds.z) * 0.5);
      handles.push({
        id: `${targetId}-radius`,
        targetId,
        type: "radius",
        axis: "xz",
        dragSpace: "planar",
        position: center.clone().add(new THREE.Vector3(radius + 0.2, 0, 0)),
      });
    }

    return handles;
  },
  beginSession(target: EditableEntity): AdapterSession {
    return {
      before: safeConfig(target),
      startPosition: target.position.clone(),
      startRotationY: target.rotation.y,
    };
  },
  applyDrag(target: EditableEntity, handle: EditorHandle, session: AdapterSession, update: DragUpdate): void {
    const beforeConfig = session.before as Record<string, any>;
    const schema = resolveParametricSchema(beforeConfig);

    if (!schema) {
      return;
    }

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

    const config = safeConfig(target);

    if (handle.type === "width" && schema.widthPath) {
      const base = Number(getByPath(beforeConfig, schema.widthPath) ?? 1);
      setByPath(config, schema.widthPath, clampMin(base + update.delta.x * 2, 0.05));
      applyConfig(target, config);
      return;
    }

    if (handle.type === "depth" && schema.depthPath) {
      const base = Number(getByPath(beforeConfig, schema.depthPath) ?? 1);
      setByPath(config, schema.depthPath, clampMin(base + update.delta.z * 2, 0.05));
      applyConfig(target, config);
      return;
    }

    if (handle.type === "radius" && schema.radiusPath) {
      const center = computeEntityCenter(target);
      const radius = clampMin(update.snapped.point.clone().setY(center.y).distanceTo(center), 0.05);
      setByPath(config, schema.radiusPath, radius);
      applyConfig(target, config);
    }
  },
  getSnapPoints(target: EditableEntity): THREE.Vector3[] {
    const center = computeEntityCenter(target);
    const size = computeBoundsSize(target);
    return [
      center,
      center.clone().add(new THREE.Vector3(size.x * 0.5, 0, 0)),
      center.clone().add(new THREE.Vector3(-size.x * 0.5, 0, 0)),
      center.clone().add(new THREE.Vector3(0, 0, size.z * 0.5)),
      center.clone().add(new THREE.Vector3(0, 0, -size.z * 0.5)),
    ];
  },
};
