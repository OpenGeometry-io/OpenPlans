import * as THREE from "three";
import { Vector3 } from "../../../kernel";
import { computeBoundsSize, computeEntityCenter } from "../../math/Bounds";
import type { EditorHandle } from "../../types";

export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function safeConfig(target: any): Record<string, any> {
  if (typeof target.getOPConfig === "function") {
    return deepClone(target.getOPConfig());
  }

  if (target.propertySet) {
    return deepClone(target.propertySet);
  }

  return {};
}

export function applyConfig(target: any, config: Record<string, any>): void {
  const nextConfig = deepClone(config);
  if (
    nextConfig.center &&
    typeof nextConfig.center === "object" &&
    typeof nextConfig.center.x === "number" &&
    typeof nextConfig.center.y === "number" &&
    typeof nextConfig.center.z === "number" &&
    (target?.ogType === "CuboidShape" || target?.ogType === "CylinderShape")
  ) {
    nextConfig.center = new Vector3(nextConfig.center.x, nextConfig.center.y, nextConfig.center.z);
  }

  if (typeof target.setOPConfig === "function") {
    target.setOPConfig(nextConfig);
    return;
  }

  target.propertySet = nextConfig;
  if (typeof target.setOPGeometry === "function") {
    target.setOPGeometry();
  }
}

export function readPoints(config: Record<string, any>): Array<{ x: number; y: number; z: number }> {
  const raw = config.points;
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((point) => {
      if (Array.isArray(point)) {
        return { x: point[0], y: point[1] ?? 0, z: point[2] ?? 0 };
      }
      if (point && typeof point === "object") {
        return {
          x: (point as any).x,
          y: (point as any).y ?? 0,
          z: (point as any).z,
        };
      }
      return null;
    })
    .filter((point): point is { x: number; y: number; z: number } => point !== null);
}

export function writePointsAsObjects(config: Record<string, any>, points: Array<{ x: number; y: number; z: number }>): void {
  config.points = points.map((point) => ({
    x: point.x,
    y: point.y,
    z: point.z,
  }));
}

export function writePointsAsArrays(config: Record<string, any>, points: Array<{ x: number; y: number; z: number }>): void {
  config.points = points.map((point) => [point.x, point.y, point.z]);
}

export function addPlanarMoveHandle(target: THREE.Object3D, targetId: string): EditorHandle {
  return {
    id: `${targetId}-move`,
    targetId,
    type: "move",
    axis: "xz",
    dragSpace: "planar",
    position: computeEntityCenter(target),
  };
}

export function addPlanarRotateHandle(target: THREE.Object3D, targetId: string): EditorHandle {
  const center = computeEntityCenter(target);
  const size = computeBoundsSize(target);
  return {
    id: `${targetId}-rotate`,
    targetId,
    type: "rotate",
    axis: "y",
    dragSpace: "planar",
    position: center.add(new THREE.Vector3(0, 0.01, Math.max(size.z, size.x) * 0.6 + 0.35)),
  };
}

export function translatedPoints(
  points: Array<{ x: number; y: number; z: number }>,
  delta: THREE.Vector3,
): Array<{ x: number; y: number; z: number }> {
  return points.map((point) => ({
    x: point.x + delta.x,
    y: point.y + delta.y,
    z: point.z + delta.z,
  }));
}
