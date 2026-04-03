import { Vector3 } from "opengeometry";

import type { Placement } from "../../types";
import { ElementType } from "../base-type";
import { normalizePlacement } from "../shared/dual-view";
import type { StraightWallFrame, WallAttachment, WallPoint } from "./wall-geometry";

export type { WallAttachment, WallPoint } from "./wall-geometry";

export enum WallMaterial {
  CONCRETE = "CONCRETE",
  BRICK = "BRICK",
  WOOD = "WOOD",
  GLASS = "GLASS",
  OTHER = "OTHER",
}

export type WallJoinType = "L" | "T" | "X";
export type WallJoinCapStyle = "capped" | "uncapped";
export type WallJoinBehavior = "auto";
export type WallSectionLayerRole = "core";

export interface WallSectionLayer {
  role: WallSectionLayerRole;
  thickness: number;
  material: WallMaterial | string;
  color?: number;
}

export interface WallSection {
  layers: [WallSectionLayer];
}

export interface WallOpeningBinding {
  openingId: string;
  attachment: WallAttachment;
}

export interface WallDefinition {
  ogid?: string;
  labelName: string;
  type: ElementType.WALL;
  path: [WallPoint, WallPoint];
  section: WallSection;
  height: number;
  placement: Placement;
  joinBehavior: WallJoinBehavior;
  openings: WallOpeningBinding[];
}

export interface LegacyWallOptions {
  ogid?: string;
  labelName?: string;
  type?: ElementType.WALL;
  points?: WallPoint[];
  wallColor?: number;
  wallThickness?: number;
  wallHeight?: number;
  wallMaterial?: WallMaterial | string;
  placement?: Placement;
}

export type WallInput = Partial<WallDefinition> & LegacyWallOptions;

export interface WallPlanEdge {
  start: Vector3;
  end: Vector3;
}

export interface WallPlanArtifact {
  polygon: Vector3[];
  visibleEdges: WallPlanEdge[];
  renderOrder: number;
}

export interface WallJoinNode {
  id: string;
  type: WallJoinType;
  capStyle: WallJoinCapStyle;
  primaryWallId: string;
  location: Vector3;
  wallIds: [string, string];
}

export interface ResolvedWallArtifacts {
  planArtifacts: WallPlanArtifact[];
  modelPolygons: Vector3[][];
  joinNodes: WallJoinNode[];
}

export interface WallModelDisplayAssignment {
  mode: "individual" | "merged-owner" | "merged-hidden";
  memberWallIds?: string[];
}

export interface WallResolvedSource {
  wallId: string;
  labelName: string;
  definition: WallDefinition;
  frame: StraightWallFrame;
  creationOrder: number;
}

export interface WallJoinParticipant {
  wallId: string;
  endpoint: "start" | "end" | null;
  t: number;
  kind: "endpoint" | "interior";
}

export interface WallTopologyNode extends WallJoinNode {
  participants: [WallJoinParticipant, WallJoinParticipant];
}

export interface WallSystemOptions {
  endpointTolerance?: number;
  segmentTolerance?: number;
  parallelTolerance?: number;
  capStyle?: WallJoinCapStyle;
}

const DEFAULT_PATH: [WallPoint, WallPoint] = [
  { x: 0, y: 0, z: 0 },
  { x: 4, y: 0, z: 0 },
];

const DEFAULT_PLACEMENT: Placement = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
};

function clonePoint(point: WallPoint): WallPoint {
  return { x: point.x, y: point.y, z: point.z };
}

function clonePlacement(placement: Placement): Placement {
  return {
    position: [...placement.position],
    rotation: [...placement.rotation],
    scale: [...placement.scale],
  };
}

function normalizePath(
  path: readonly WallPoint[] | undefined,
  fallback: readonly WallPoint[] = DEFAULT_PATH,
): [WallPoint, WallPoint] {
  const source = path ?? fallback;
  if (source.length !== 2) {
    throw new Error("Wall v1 supports exactly two path points.");
  }

  return [clonePoint(source[0]), clonePoint(source[1])];
}

function normalizeSection(
  section: Partial<WallSection> | undefined,
  legacy: LegacyWallOptions,
  fallback: WallSection,
): WallSection {
  const candidateLayer = section?.layers?.[0];
  const legacyThickness = legacy.wallThickness ?? fallback.layers[0].thickness;
  const legacyMaterial = legacy.wallMaterial ?? fallback.layers[0].material;
  const legacyColor = legacy.wallColor ?? fallback.layers[0].color;

  const layer: WallSectionLayer = {
    role: "core",
    thickness: Math.max(0.05, candidateLayer?.thickness ?? legacyThickness),
    material: candidateLayer?.material ?? legacyMaterial,
    color: candidateLayer?.color ?? legacyColor,
  };

  return {
    layers: [layer],
  };
}

function normalizeOpenings(
  openings: WallOpeningBinding[] | undefined,
  fallback: WallOpeningBinding[],
): WallOpeningBinding[] {
  return (openings ?? fallback).map((entry) => ({
    openingId: entry.openingId,
    attachment: { ...entry.attachment },
  }));
}

export function normalizeWallDefinition(input?: WallInput, existing?: WallDefinition): WallDefinition {
  const fallback = existing ?? {
    labelName: "Wall",
    type: ElementType.WALL,
    path: DEFAULT_PATH,
    section: {
      layers: [{
        role: "core",
        thickness: 0.2,
        material: WallMaterial.CONCRETE,
        color: 0xcccccc,
      }],
    },
    height: 3,
    placement: DEFAULT_PLACEMENT,
    joinBehavior: "auto" as const,
    openings: [],
  };

  const legacyPath = input?.points;
  const path = normalizePath(input?.path ?? legacyPath, fallback.path);
  const section = normalizeSection(input?.section, input ?? {}, fallback.section);
  const placement = normalizePlacement(input, fallback.placement);

  return {
    ogid: input?.ogid ?? fallback.ogid,
    labelName: input?.labelName ?? fallback.labelName,
    type: ElementType.WALL,
    path,
    section,
    height: Math.max(0.1, input?.height ?? input?.wallHeight ?? fallback.height),
    placement,
    joinBehavior: input?.joinBehavior ?? fallback.joinBehavior ?? "auto",
    openings: normalizeOpenings(input?.openings, fallback.openings),
  };
}

export function cloneWallDefinition(definition: WallDefinition): WallDefinition {
  return {
    ogid: definition.ogid,
    labelName: definition.labelName,
    type: definition.type,
    path: normalizePath(definition.path),
    section: {
      layers: definition.section.layers.map((layer) => ({
        role: layer.role,
        thickness: layer.thickness,
        material: layer.material,
        color: layer.color,
      })) as [WallSectionLayer],
    },
    height: definition.height,
    placement: clonePlacement(definition.placement),
    joinBehavior: definition.joinBehavior,
    openings: normalizeOpenings(definition.openings, []),
  };
}

export function mergeWallDefinition(current: WallDefinition, update: WallInput): WallDefinition {
  const merged = normalizeWallDefinition(update, current);
  return {
    ...merged,
    ogid: current.ogid ?? merged.ogid,
    openings: update.openings !== undefined ? normalizeOpenings(update.openings, current.openings) : normalizeOpenings(current.openings, []),
  };
}

export function clonePlanEdge(edge: WallPlanEdge): WallPlanEdge {
  return {
    start: new Vector3(edge.start.x, edge.start.y, edge.start.z),
    end: new Vector3(edge.end.x, edge.end.y, edge.end.z),
  };
}

export function cloneResolvedWallArtifacts(artifacts: ResolvedWallArtifacts): ResolvedWallArtifacts {
  return {
    planArtifacts: artifacts.planArtifacts.map((artifact) => ({
      polygon: artifact.polygon.map((vertex) => new Vector3(vertex.x, vertex.y, vertex.z)),
      visibleEdges: artifact.visibleEdges.map(clonePlanEdge),
      renderOrder: artifact.renderOrder,
    })),
    modelPolygons: artifacts.modelPolygons.map((polygon) =>
      polygon.map((vertex) => new Vector3(vertex.x, vertex.y, vertex.z))),
    joinNodes: artifacts.joinNodes.map((node) => ({
      ...node,
      wallIds: [...node.wallIds] as [string, string],
      location: new Vector3(node.location.x, node.location.y, node.location.z),
    })),
  };
}
