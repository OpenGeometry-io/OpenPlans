import type {
  PlanAppearance,
  PlanStructure,
  Point3D,
  SemanticIfcExportOptions,
} from "./types";

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

const DEFAULT_PLAN_STRUCTURE: PlanStructure = {
  projectName: "OpenPlans Project",
  siteName: "Default Site",
  buildingName: "Default Building",
  storeyName: "Ground Floor",
};

export function buildIfcConfig(
  structure: Partial<PlanStructure> = {},
  overrides: SemanticIfcExportOptions = {},
) {
  const projectName = overrides.projectName ?? structure.projectName ?? DEFAULT_PLAN_STRUCTURE.projectName;
  const siteName = overrides.siteName ?? structure.siteName ?? DEFAULT_PLAN_STRUCTURE.siteName;
  const buildingName = overrides.buildingName ?? structure.buildingName ?? DEFAULT_PLAN_STRUCTURE.buildingName;
  const storeyName = overrides.storeyName ?? structure.storeyName ?? DEFAULT_PLAN_STRUCTURE.storeyName;

  const config: Record<string, string | number | boolean> = {
    schema: "Ifc4Add2",
    project_name: projectName,
    site_name: siteName,
    building_name: buildingName,
    storey_name: storeyName,
    scale: overrides.scale ?? 1,
    error_policy: overrides.errorPolicy ?? "BestEffort",
    validate_topology: overrides.validateTopology ?? false,
    require_closed_shell: overrides.requireClosedShell ?? false,
  };

  return config;
}
