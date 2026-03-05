import * as THREE from "three";
import { Door2D } from "../../../elements/planview/door2D";
import { DoubleDoor2D } from "../../../elements/planview/doubleDoor2D";
import { Window2D } from "../../../elements/planview/window2D";
import { DoubleWindow2D } from "../../../elements/planview/doubleWindow2D";
import { Stair2D } from "../../../elements/planview/stair2D";
import { Tree2D } from "../../../elements/planview/landscape/tree2D";
import { Fountain2D } from "../../../elements/planview/landscape/fountain2D";
import type { AdapterContext, AdapterSession, DragUpdate, EditableEntity, EditorAdapter, EditorHandle } from "../../types";
import { computeBoundsSize, computeEntityCenter } from "../../math/Bounds";
import { clampMin } from "../../math/GizmoMath";
import { addPlanarMoveHandle, addPlanarRotateHandle, applyConfig, safeConfig } from "./shared";

function rotateInPlan(target: EditableEntity, handle: EditorHandle, session: AdapterSession, update: DragUpdate): void {
  const center = target.position.clone();
  const startVector = handle.position.clone().sub(center);
  const nowVector = update.snapped.point.clone().sub(center);
  const startAngle = Math.atan2(startVector.z, startVector.x);
  const nowAngle = Math.atan2(nowVector.z, nowVector.x);
  target.rotation.y = (session.startRotationY as number) + (nowAngle - startAngle);
}

function getCenterAndBounds(target: EditableEntity): { center: THREE.Vector3; bounds: THREE.Vector3; targetId: string } {
  return {
    center: computeEntityCenter(target),
    bounds: computeBoundsSize(target),
    targetId: String(target.ogid ?? target.id),
  };
}

function edgeSnapPoints(target: EditableEntity): THREE.Vector3[] {
  const center = computeEntityCenter(target);
  const size = computeBoundsSize(target);
  const hx = size.x * 0.5;
  const hz = size.z * 0.5;

  return [
    center,
    center.clone().add(new THREE.Vector3(hx, 0, 0)),
    center.clone().add(new THREE.Vector3(-hx, 0, 0)),
    center.clone().add(new THREE.Vector3(0, 0, hz)),
    center.clone().add(new THREE.Vector3(0, 0, -hz)),
    center.clone().add(new THREE.Vector3(hx, 0, hz)),
    center.clone().add(new THREE.Vector3(hx, 0, -hz)),
    center.clone().add(new THREE.Vector3(-hx, 0, hz)),
    center.clone().add(new THREE.Vector3(-hx, 0, -hz)),
  ];
}

function isSpecialPlanview(target: EditableEntity): boolean {
  return (
    target instanceof Door2D ||
    target instanceof DoubleDoor2D ||
    target instanceof Window2D ||
    target instanceof DoubleWindow2D ||
    target instanceof Stair2D ||
    target instanceof Tree2D ||
    target instanceof Fountain2D
  );
}

export const specialPlanviewAdapter: EditorAdapter = {
  id: "builtin-special-planview",
  priority: 35,
  match(target: EditableEntity): boolean {
    return isSpecialPlanview(target);
  },
  getDragSpace(): "planar" {
    return "planar";
  },
  getHandles(target: EditableEntity, _ctx: AdapterContext): EditorHandle[] {
    const { center, bounds, targetId } = getCenterAndBounds(target);
    const handles: EditorHandle[] = [
      addPlanarMoveHandle(target, targetId),
      addPlanarRotateHandle(target, targetId),
    ];

    if (target instanceof Tree2D) {
      const config = safeConfig(target);
      const radius = Number(config.canopyRadius ?? Math.max(bounds.x, bounds.z) * 0.5);
      handles.push({
        id: `${targetId}-radius`,
        targetId,
        type: "radius",
        axis: "xz",
        dragSpace: "planar",
        position: center.clone().add(new THREE.Vector3(radius + 0.2, 0, 0)),
      });
      return handles;
    }

    if (target instanceof Fountain2D) {
      const config = safeConfig(target);
      const radius = Number(config.radius ?? Math.max(bounds.x, bounds.z) * 0.5);
      handles.push({
        id: `${targetId}-radius`,
        targetId,
        type: "radius",
        axis: "xz",
        dragSpace: "planar",
        position: center.clone().add(new THREE.Vector3(radius + 0.2, 0, 0)),
      });
      return handles;
    }

    handles.push({
      id: `${targetId}-width`,
      targetId,
      type: "width",
      axis: "x",
      dragSpace: "planar",
      position: center.clone().add(new THREE.Vector3(bounds.x * 0.5 + 0.2, 0, 0)),
    });
    handles.push({
      id: `${targetId}-depth`,
      targetId,
      type: "depth",
      axis: "z",
      dragSpace: "planar",
      position: center.clone().add(new THREE.Vector3(0, 0, bounds.z * 0.5 + 0.2)),
    });

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
    if (handle.type === "move") {
      target.position.copy((session.startPosition as THREE.Vector3).clone().add(update.delta));
      return;
    }

    if (handle.type === "rotate") {
      rotateInPlan(target, handle, session, update);
      return;
    }

    const config = safeConfig(target);
    const before = session.before as Record<string, any>;

    if (target instanceof Door2D) {
      if (handle.type === "width") {
        config.doorDimensions.width = clampMin(Number(before.doorDimensions?.width ?? 1) + update.delta.x * 2, 0.05);
        applyConfig(target, config);
        return;
      }
      if (handle.type === "depth") {
        config.doorDimensions.thickness = clampMin(Number(before.doorDimensions?.thickness ?? 0.2) + update.delta.z * 2, 0.02);
        applyConfig(target, config);
      }
      return;
    }

    if (target instanceof DoubleDoor2D) {
      if (handle.type === "width") {
        config.doorDimensions.width = clampMin(Number(before.doorDimensions?.width ?? 0.75) + update.delta.x, 0.05);
        applyConfig(target, config);
        return;
      }
      if (handle.type === "depth") {
        config.doorDimensions.thickness = clampMin(Number(before.doorDimensions?.thickness ?? 0.2) + update.delta.z * 2, 0.02);
        applyConfig(target, config);
      }
      return;
    }

    if (target instanceof Window2D) {
      if (handle.type === "width") {
        config.windowDimensions.width = clampMin(Number(before.windowDimensions?.width ?? 1) + update.delta.x * 2, 0.05);
        applyConfig(target, config);
        return;
      }
      if (handle.type === "depth") {
        config.windowDimensions.thickness = clampMin(Number(before.windowDimensions?.thickness ?? 0.2) + update.delta.z * 2, 0.02);
        applyConfig(target, config);
      }
      return;
    }

    if (target instanceof DoubleWindow2D) {
      if (handle.type === "width") {
        config.windowDimensions.width = clampMin(Number(before.windowDimensions?.width ?? 0.6) + update.delta.x, 0.05);
        applyConfig(target, config);
        return;
      }
      if (handle.type === "depth") {
        config.windowDimensions.thickness = clampMin(Number(before.windowDimensions?.thickness ?? 0.2) + update.delta.z * 2, 0.02);
        applyConfig(target, config);
      }
      return;
    }

    if (target instanceof Stair2D) {
      if (handle.type === "width") {
        config.stairDimensions.length = clampMin(Number(before.stairDimensions?.length ?? 1) + update.delta.x * 2, 0.2);
        applyConfig(target, config);
        return;
      }
      if (handle.type === "depth") {
        config.stairDimensions.width = clampMin(Number(before.stairDimensions?.width ?? 1) + update.delta.z * 2, 0.2);
        applyConfig(target, config);
      }
      return;
    }

    if (target instanceof Tree2D && handle.type === "radius") {
      const center = computeEntityCenter(target);
      config.canopyRadius = clampMin(update.snapped.point.clone().setY(center.y).distanceTo(center), 0.05);
      applyConfig(target, config);
      return;
    }

    if (target instanceof Fountain2D && handle.type === "radius") {
      const center = computeEntityCenter(target);
      config.radius = clampMin(update.snapped.point.clone().setY(center.y).distanceTo(center), 0.05);
      applyConfig(target, config);
    }
  },
  getSnapPoints(target: EditableEntity): THREE.Vector3[] {
    if (target instanceof Tree2D) {
      const config = safeConfig(target);
      const center = computeEntityCenter(target);
      const radius = Number(config.canopyRadius ?? 1);
      return [
        center,
        center.clone().add(new THREE.Vector3(radius, 0, 0)),
        center.clone().add(new THREE.Vector3(-radius, 0, 0)),
        center.clone().add(new THREE.Vector3(0, 0, radius)),
        center.clone().add(new THREE.Vector3(0, 0, -radius)),
      ];
    }

    if (target instanceof Fountain2D) {
      const config = safeConfig(target);
      const center = computeEntityCenter(target);
      const radius = Number(config.radius ?? 1);
      return [
        center,
        center.clone().add(new THREE.Vector3(radius, 0, 0)),
        center.clone().add(new THREE.Vector3(-radius, 0, 0)),
        center.clone().add(new THREE.Vector3(0, 0, radius)),
        center.clone().add(new THREE.Vector3(0, 0, -radius)),
      ];
    }

    return edgeSnapPoints(target);
  },
};
