import type { PlanAppearance, Point3D } from "./types";

let semanticCounter = 0;

export function createSemanticId(prefix: string) {
  semanticCounter += 1;
  return `${prefix}-${semanticCounter}`;
}

export function clonePoint(point: Point3D): Point3D {
  return { x: point.x, y: point.y, z: point.z };
}

export function hexColor(value?: number) {
  if (value === undefined || Number.isNaN(value)) {
    return undefined;
  }

  return `#${value.toString(16).padStart(6, "0")}`;
}

export function buildAppearanceMetadata(appearance: PlanAppearance) {
  const entries: Record<string, string> = {};

  const wallColor = hexColor(appearance.wallColor);
  const doorColor = hexColor(appearance.doorColor);
  const frameColor = hexColor(appearance.frameColor);
  const glassColor = hexColor(appearance.glassColor);

  if (wallColor) {
    entries.WallColor = wallColor;
  }
  if (doorColor) {
    entries.DoorColor = doorColor;
  }
  if (frameColor) {
    entries.FrameColor = frameColor;
  }
  if (glassColor) {
    entries.GlassColor = glassColor;
  }
  if (appearance.materialLabel) {
    entries.MaterialLabel = appearance.materialLabel;
  }

  return entries;
}
