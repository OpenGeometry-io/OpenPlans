import * as THREE from "three";
import type { ControlHandleType } from "../types";

export const HANDLE_COLOR_BY_TYPE: Record<ControlHandleType, number> = {
  move: 0x2d6cdf,
  rotate: 0xf97316,
  vertex: 0x16a34a,
  edge: 0x0ea5e9,
  width: 0x8b5cf6,
  depth: 0x7c3aed,
  radius: 0xdc2626,
  angle: 0xf59e0b,
  "scale-axis": 0x14b8a6,
};

export const HANDLE_HOVER_EMISSIVE = 0xffffff;

export function createHandleMaterial(color: number): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    opacity: 0.95,
  });
}
