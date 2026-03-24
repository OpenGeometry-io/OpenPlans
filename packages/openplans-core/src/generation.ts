import {
  booleanSubtraction,
  OpenGeometry,
  OGSceneManager,
  Sweep,
  Vector3,
  type OGIfcExportResult,
} from "opengeometry";

import { PlanDocument } from "./document";
import type {
  DoorElement,
  GeneratedPlanDocument,
  GeneratedSemanticEntity,
  PlanStructure,
  Point3D,
  SemanticIfcEntityInput,
  SemanticIfcExportOptions,
  WallElement,
  WindowElement,
} from "./types";
import { buildAppearanceMetadata, clonePoint } from "./utils";

type HostSegment = {
  start: Point3D;
  end: Point3D;
  angle: number;
};

type BrepCarrier = {
  getBrepData?: () => Record<string, unknown> | null;
  getBrep?: () => Record<string, unknown> | null;
};

function computeOffsetPolygonVertices(points: Point3D[], thickness: number) {
  const halfThickness = thickness / 2;
  const count = points.length;
  const leftOffset: Vector3[] = [];
  const rightOffset: Vector3[] = [];

  for (let index = 0; index < count; index += 1) {
    const current = points[index];
    const prev = index > 0 ? points[index - 1] : current;
    const next = index < count - 1 ? points[index + 1] : current;

    let prevDx = current.x - prev.x;
    let prevDz = current.z - prev.z;
    let nextDx = next.x - current.x;
    let nextDz = next.z - current.z;

    if (index === 0) {
      prevDx = nextDx;
      prevDz = nextDz;
    }
    if (index === count - 1) {
      nextDx = prevDx;
      nextDz = prevDz;
    }

    const prevLength = Math.hypot(prevDx, prevDz) || 1;
    const nextLength = Math.hypot(nextDx, nextDz) || 1;

    const prevNx = -prevDz / prevLength;
    const prevNz = prevDx / prevLength;
    const nextNx = -nextDz / nextLength;
    const nextNz = nextDx / nextLength;

    let avgNx = prevNx + nextNx;
    let avgNz = prevNz + nextNz;
    const avgLength = Math.hypot(avgNx, avgNz) || 1;
    avgNx /= avgLength;
    avgNz /= avgLength;

    const dot = prevNx * nextNx + prevNz * nextNz;
    let miterFactor = 1;
    if (dot > -0.99) {
      miterFactor = 1 / Math.sqrt((1 + dot) / 2);
      if (miterFactor > 4) {
        miterFactor = 4;
      }
    }

    const offsetX = avgNx * halfThickness * miterFactor;
    const offsetZ = avgNz * halfThickness * miterFactor;

    leftOffset.push(new Vector3(current.x + offsetX, 0, current.z + offsetZ));
    rightOffset.push(new Vector3(current.x - offsetX, 0, current.z - offsetZ));
  }

  const polygonVertices = [...leftOffset];
  for (let index = count - 1; index >= 0; index -= 1) {
    polygonVertices.push(rightOffset[index]);
  }

  return polygonVertices;
}

function buildSweepFromProfile(
  profile: Vector3[],
  height: number,
  color: number,
  startY: number = 0,
) {
  return new Sweep({
    path: [new Vector3(0, startY, 0), new Vector3(0, startY + height, 0)],
    profile,
    color,
  });
}

function resolveBrepData(value: Sweep | BrepCarrier) {
  if ("getBrepData" in value && typeof value.getBrepData === "function") {
    return value.getBrepData();
  }

  if ("getBrep" in value && typeof value.getBrep === "function") {
    return value.getBrep();
  }

  return null;
}

function resolveHostSegment(points: Point3D[], target: Point3D): HostSegment {
  let best: HostSegment | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const lengthSq = dx * dx + dz * dz;
    if (lengthSq <= 0) {
      continue;
    }

    const t = Math.max(
      0,
      Math.min(1, ((target.x - start.x) * dx + (target.z - start.z) * dz) / lengthSq),
    );
    const projectedX = start.x + dx * t;
    const projectedZ = start.z + dz * t;
    const distance = Math.hypot(target.x - projectedX, target.z - projectedZ);

    if (distance < bestDistance) {
      bestDistance = distance;
      best = {
        start: clonePoint(start),
        end: clonePoint(end),
        angle: Math.atan2(dz, dx),
      };
    }
  }

  if (!best) {
    throw new Error("Unable to resolve host wall segment.");
  }

  return best;
}

function buildRectangleProfile(
  center: Point3D,
  width: number,
  depth: number,
  angle: number,
) {
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const localPoints = [
    { x: -halfWidth, z: -halfDepth },
    { x: halfWidth, z: -halfDepth },
    { x: halfWidth, z: halfDepth },
    { x: -halfWidth, z: halfDepth },
  ];

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return localPoints.map((point) => {
    const rotatedX = center.x + point.x * cos - point.z * sin;
    const rotatedZ = center.z + point.x * sin + point.z * cos;
    return new Vector3(rotatedX, 0, rotatedZ);
  });
}

function wallQuantities(wall: WallElement) {
  const length = wall.points.reduce((total, point, index) => {
    if (index === 0) {
      return total;
    }
    const prev = wall.points[index - 1];
    return total + Math.hypot(point.x - prev.x, point.z - prev.z);
  }, 0);

  return {
    BaseQuantities: {
      Length: Number(length.toFixed(6)),
      Height: wall.wallHeight,
      Thickness: wall.wallThickness,
    },
  };
}

function doorQuantities(door: DoorElement) {
  return {
    BaseQuantities: {
      Width: door.doorWidth,
      Height: door.doorHeight,
      Thickness: door.doorThickness,
    },
  };
}

function windowQuantities(window: WindowElement) {
  return {
    BaseQuantities: {
      Width: window.windowWidth,
      Height: window.windowHeight,
      Thickness: window.windowThickness,
      SillHeight: window.sillHeight,
    },
  };
}

function generateDoorOpening(door: DoorElement, host: WallElement) {
  const segment = resolveHostSegment(host.points, door.doorPosition);
  const profile = buildRectangleProfile(
    door.doorPosition,
    door.doorWidth,
    Math.max(host.wallThickness * 1.15, door.frameThickness),
    segment.angle,
  );

  return buildSweepFromProfile(profile, door.doorHeight, door.frameColor);
}

function generateWindowOpening(window: WindowElement, host: WallElement) {
  const segment = resolveHostSegment(host.points, window.windowPosition);
  const profile = buildRectangleProfile(
    window.windowPosition,
    window.windowWidth,
    Math.max(host.wallThickness * 1.15, window.windowThickness * 1.25),
    segment.angle,
  );

  return buildSweepFromProfile(
    profile,
    window.windowHeight,
    window.frameColor,
    window.sillHeight,
  );
}

function generateWallBrep(wall: WallElement, document: PlanDocument) {
  if (wall.points.length < 2) {
    throw new Error(`Wall '${wall.id}' requires at least two points.`);
  }

  const footprint = computeOffsetPolygonVertices(wall.points, wall.wallThickness);
  let wallResult: Sweep | BrepCarrier = buildSweepFromProfile(
    footprint,
    wall.wallHeight,
    wall.wallColor,
  );

  for (const door of document.listDoors().filter((item) => item.hostWallId === wall.id)) {
    const opening = generateDoorOpening(door, wall);
    wallResult = booleanSubtraction(wallResult, opening, { color: wall.wallColor, outline: true });
  }

  for (const window of document
    .listWindows()
    .filter((item) => item.hostWallId === wall.id)) {
    const opening = generateWindowOpening(window, wall);
    wallResult = booleanSubtraction(wallResult, opening, { color: wall.wallColor, outline: true });
  }

  const brepData = resolveBrepData(wallResult);

  if (!brepData) {
    throw new Error(`Wall '${wall.id}' did not generate a BRep.`);
  }

  return brepData;
}

function generateDoorBrep(door: DoorElement, document: PlanDocument) {
  const host = door.hostWallId ? document.getWall(door.hostWallId) : undefined;
  const angle = host ? resolveHostSegment(host.points, door.doorPosition).angle : 0;
  const profile = buildRectangleProfile(
    door.doorPosition,
    Math.max(door.doorWidth - 0.04, 0.05),
    Math.max(door.doorThickness, 0.02),
    angle,
  );
  return buildSweepFromProfile(profile, door.doorHeight, door.doorColor).getBrep();
}

function generateWindowBrep(window: WindowElement, document: PlanDocument) {
  const host = window.hostWallId ? document.getWall(window.hostWallId) : undefined;
  const angle = host ? resolveHostSegment(host.points, window.windowPosition).angle : 0;
  const profile = buildRectangleProfile(
    window.windowPosition,
    Math.max(window.windowWidth - 0.04, 0.05),
    Math.max(window.windowThickness, 0.02),
    angle,
  );

  return buildSweepFromProfile(
    profile,
    window.windowHeight,
    window.glassColor,
    window.sillHeight,
  ).getBrep();
}

function buildWallIfcInput(wall: WallElement, brep: Record<string, unknown>): SemanticIfcEntityInput {
  return {
    entity_id: wall.id,
    brep,
    kind: "OpenPlansWall",
    ifc_class: "IFCWALL",
    name: wall.labelName,
    description: wall.description,
    object_type: "Wall",
    tag: wall.tag ?? wall.id,
    property_sets: {
      Pset_OpenPlansAppearance: buildAppearanceMetadata(wall.appearance),
      Pset_OpenPlansWall: {
        WallMaterial: wall.wallMaterial,
      },
    },
    quantity_sets: wallQuantities(wall),
  };
}

function buildDoorIfcInput(door: DoorElement, brep: Record<string, unknown>): SemanticIfcEntityInput {
  return {
    entity_id: door.id,
    brep,
    kind: "OpenPlansDoor",
    ifc_class: "IFCDOOR",
    name: door.labelName,
    description: door.description,
    object_type: "Door",
    tag: door.tag ?? door.id,
    property_sets: {
      Pset_OpenPlansAppearance: buildAppearanceMetadata(door.appearance),
      Pset_OpenPlansDoor: {
        DoorMaterial: door.doorMaterial,
        HostWallId: door.hostWallId ?? "",
      },
    },
    quantity_sets: doorQuantities(door),
  };
}

function buildWindowIfcInput(
  window: WindowElement,
  brep: Record<string, unknown>,
): SemanticIfcEntityInput {
  return {
    entity_id: window.id,
    brep,
    kind: "OpenPlansWindow",
    ifc_class: "IFCWINDOW",
    name: window.labelName,
    description: window.description,
    object_type: "Window",
    tag: window.tag ?? window.id,
    property_sets: {
      Pset_OpenPlansAppearance: buildAppearanceMetadata(window.appearance),
      Pset_OpenPlansWindow: {
        WindowMaterial: window.windowMaterial,
        HostWallId: window.hostWallId ?? "",
      },
    },
    quantity_sets: windowQuantities(window),
  };
}

export async function ensureOpenGeometryReady(wasmURL?: string) {
  await OpenGeometry.create({ wasmURL });
}

export function buildIfcConfig(structure: PlanStructure, options?: SemanticIfcExportOptions) {
  return {
    schema: "Ifc4Add2",
    project_name: options?.projectName ?? structure.projectName,
    site_name: options?.siteName ?? structure.siteName,
    building_name: options?.buildingName ?? structure.buildingName,
    storey_name: options?.storeyName ?? structure.storeyName,
    scale: options?.scale ?? 1.0,
    error_policy: options?.errorPolicy ?? "BestEffort",
    validate_topology: options?.validateTopology ?? true,
    require_closed_shell: options?.requireClosedShell ?? true,
  };
}

export function generateDocument(document: PlanDocument): GeneratedPlanDocument {
  const entities: GeneratedSemanticEntity[] = [];

  for (const wall of document.listWalls()) {
    const brep = generateWallBrep(wall, document);
    entities.push({
      element: wall,
      brep,
      ifc: buildWallIfcInput(wall, brep),
    });
  }

  for (const door of document.listDoors()) {
    const brep = generateDoorBrep(door, document);
    entities.push({
      element: door,
      brep,
      ifc: buildDoorIfcInput(door, brep),
    });
  }

  for (const window of document.listWindows()) {
    const brep = generateWindowBrep(window, document);
    entities.push({
      element: window,
      brep,
      ifc: buildWindowIfcInput(window, brep),
    });
  }

  return {
    structure: { ...document.structure },
    entities,
  };
}

export async function exportIfc(
  document: PlanDocument,
  options?: SemanticIfcExportOptions & { wasmURL?: string },
): Promise<OGIfcExportResult> {
  await ensureOpenGeometryReady(options?.wasmURL);
  const generated = generateDocument(document);
  const manager = new OGSceneManager();

  const entitiesJson = JSON.stringify(generated.entities.map((entity) => entity.ifc));
  const configJson = JSON.stringify(buildIfcConfig(generated.structure, options));

  return manager.exportSemanticEntitiesToIfc(entitiesJson, configJson);
}
