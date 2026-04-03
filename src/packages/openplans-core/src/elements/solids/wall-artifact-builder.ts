import { Vector3 } from "opengeometry";

import {
  boundaryDirection,
  boundaryPoint,
  createDefaultResolvedShape,
  dot2D,
  linePolygonIntersections2D,
  lineIntersection2D,
  setEndpointCorner,
  straightWallVertices,
  type ResolvedStraightWallShape,
} from "./wall-geometry";
import type {
  ResolvedWallArtifacts,
  WallPlanArtifact,
  WallPlanEdge,
  WallResolvedSource,
  WallSystemOptions,
  WallTopologyNode,
} from "./wall-types";

interface WallArtifactState {
  source: WallResolvedSource;
  shape: ResolvedStraightWallShape;
  planArtifacts: WallPlanArtifact[];
  modelPolygons: Vector3[][];
  joinNodes: WallTopologyNode[];
}

const DEFAULT_OPTIONS: Required<Pick<WallSystemOptions, "segmentTolerance" | "capStyle">> = {
  segmentTolerance: 1e-3,
  capStyle: "uncapped",
};

function resolvedOptions(options?: WallSystemOptions) {
  return {
    ...DEFAULT_OPTIONS,
    ...options,
  };
}

function cloneVector(vertex: Vector3) {
  return new Vector3(vertex.x, vertex.y, vertex.z);
}

function clonePolygon(vertices: Vector3[]) {
  return vertices.map(cloneVector);
}

function createPlanEdge(start: Vector3, end: Vector3): WallPlanEdge {
  return {
    start: cloneVector(start),
    end: cloneVector(end),
  };
}

function polygonEdges(vertices: Vector3[], openAtStart = false, openAtEnd = false) {
  const [startLeft, endLeft, endRight, startRight] = vertices;
  const edges: WallPlanEdge[] = [
    createPlanEdge(startLeft, endLeft),
    createPlanEdge(endLeft, endRight),
    createPlanEdge(endRight, startRight),
  ];

  if (!openAtStart) {
    edges.push(createPlanEdge(startRight, startLeft));
  }

  if (openAtEnd) {
    return [edges[0], edges[2], edges[3]].filter((edge): edge is WallPlanEdge => Boolean(edge));
  }

  return edges;
}

function buildPlanArtifact(
  polygon: Vector3[],
  renderOrder: number,
  openAtStart = false,
  openAtEnd = false,
): WallPlanArtifact {
  return {
    polygon: clonePolygon(polygon),
    visibleEdges: polygonEdges(polygon, openAtStart, openAtEnd),
    renderOrder,
  };
}

function createDefaultState(source: WallResolvedSource): WallArtifactState {
  const shape = createDefaultResolvedShape(source.frame);
  const polygon = straightWallVertices(shape);

  return {
    source,
    shape,
    modelPolygons: [clonePolygon(polygon)],
    planArtifacts: [buildPlanArtifact(polygon, 0)],
    joinNodes: [],
  };
}

function syncSingleShapeState(
  state: WallArtifactState,
  renderOrder: number,
  openAtStart = false,
  openAtEnd = false,
) {
  const polygon = straightWallVertices(state.shape);
  state.modelPolygons = [clonePolygon(polygon)];
  state.planArtifacts = [buildPlanArtifact(polygon, renderOrder, openAtStart, openAtEnd)];
}

function markJoin(state: WallArtifactState, node: WallTopologyNode) {
  state.joinNodes.push(node);
}

function firstPositiveIntersection(
  polygon: Vector3[],
  origin: Vector3,
  direction: Vector3,
  tolerance: number,
) {
  const intersections = linePolygonIntersections2D(origin, direction, polygon)
    .filter((entry) => entry.offset > tolerance);
  return intersections[0]?.point ?? null;
}

function trimWallEndpointToHostPolygon(
  state: WallArtifactState,
  endpoint: "start" | "end",
  hostPolygon: Vector3[],
  tolerance: number,
) {
  const direction = boundaryDirection(state.source.frame, endpoint);

  for (const sideAway of [1, -1] as const) {
    const origin = boundaryPoint(state.source.frame, endpoint, sideAway);
    const intersection = firstPositiveIntersection(hostPolygon, origin, direction, tolerance);
    if (!intersection) {
      return false;
    }

    setEndpointCorner(state.shape, endpoint, sideAway, intersection);
  }

  return true;
}

function applyButtLikeJoin(
  primary: WallArtifactState,
  secondary: WallArtifactState,
  node: WallTopologyNode,
  tolerance: number,
) {
  const participant = node.participants.find((entry) => entry.wallId === secondary.source.wallId);
  if (!participant?.endpoint) {
    return;
  }

  const hostPolygon = primary.modelPolygons[0];
  const openAtStart = node.capStyle === "uncapped" && participant.endpoint === "start";
  const openAtEnd = node.capStyle === "uncapped" && participant.endpoint === "end";

  if (!trimWallEndpointToHostPolygon(secondary, participant.endpoint, hostPolygon, tolerance)) {
    if (node.type !== "L") {
      return;
    }

    syncSingleShapeState(secondary, 0, openAtStart, openAtEnd);
    syncSingleShapeState(primary, 1);
    return;
  }

  syncSingleShapeState(secondary, 0, openAtStart, openAtEnd);
  syncSingleShapeState(primary, 1);
}

function applyTJoin(
  primary: WallArtifactState,
  secondary: WallArtifactState,
  node: WallTopologyNode,
) {
  const participant = node.participants.find((entry) => entry.wallId === secondary.source.wallId);
  if (!participant?.endpoint) {
    return;
  }

  const branchDirection = boundaryDirection(secondary.source.frame, participant.endpoint);
  const hostFacing = Math.sign(dot2D(branchDirection, primary.source.frame.normal)) || 1;
  const hostBoundaryOrigin = hostFacing === 1
    ? primary.shape.start.left
    : primary.shape.start.right;
  const hostBoundaryEnd = hostFacing === 1
    ? primary.shape.end.left
    : primary.shape.end.right;
  const hostBoundaryDirection = new Vector3(
    hostBoundaryEnd.x - hostBoundaryOrigin.x,
    0,
    hostBoundaryEnd.z - hostBoundaryOrigin.z,
  );

  for (const sideAway of [1, -1] as const) {
    const branchBoundaryPoint = boundaryPoint(secondary.source.frame, participant.endpoint, sideAway);
    const intersection = lineIntersection2D(
      branchBoundaryPoint,
      branchDirection,
      hostBoundaryOrigin,
      hostBoundaryDirection,
    );

    if (!intersection) {
      return;
    }

    setEndpointCorner(secondary.shape, participant.endpoint, sideAway, intersection);
  }

  const openAtStart = node.capStyle === "uncapped" && participant.endpoint === "start";
  const openAtEnd = node.capStyle === "uncapped" && participant.endpoint === "end";
  syncSingleShapeState(primary, 0);
  syncSingleShapeState(secondary, 2, openAtStart, openAtEnd);
}

function applyXJoin(
  primary: WallArtifactState,
  secondary: WallArtifactState,
  node: WallTopologyNode,
  tolerance: number,
) {
  const hostPolygon = primary.modelPolygons[0];
  const leftIntersections = linePolygonIntersections2D(
    boundaryPoint(secondary.source.frame, "start", 1),
    secondary.source.frame.direction,
    hostPolygon,
  ).filter((entry) =>
    entry.offset > tolerance && entry.offset < secondary.source.frame.length - tolerance);
  const rightIntersections = linePolygonIntersections2D(
    boundaryPoint(secondary.source.frame, "start", -1),
    secondary.source.frame.direction,
    hostPolygon,
  ).filter((entry) =>
    entry.offset > tolerance && entry.offset < secondary.source.frame.length - tolerance);

  if (leftIntersections.length < 2 || rightIntersections.length < 2) {
    return;
  }

  const firstPolygon = [
    secondary.shape.start.left,
    leftIntersections[0].point,
    rightIntersections[0].point,
    secondary.shape.start.right,
  ];
  const secondPolygon = [
    leftIntersections[leftIntersections.length - 1].point,
    secondary.shape.end.left,
    secondary.shape.end.right,
    rightIntersections[rightIntersections.length - 1].point,
  ];

  secondary.modelPolygons = [clonePolygon(firstPolygon), clonePolygon(secondPolygon)];
  secondary.planArtifacts = [
    buildPlanArtifact(firstPolygon, 0, false, node.capStyle === "uncapped"),
    buildPlanArtifact(secondPolygon, 0, node.capStyle === "uncapped", false),
  ];
  syncSingleShapeState(primary, 1);
}

function stateMapToArtifacts(states: Map<string, WallArtifactState>) {
  const artifacts = new Map<string, ResolvedWallArtifacts>();

  states.forEach((state, wallId) => {
    artifacts.set(wallId, {
      planArtifacts: state.planArtifacts.map((artifact) => ({
        polygon: clonePolygon(artifact.polygon),
        visibleEdges: artifact.visibleEdges.map((edge) => createPlanEdge(edge.start, edge.end)),
        renderOrder: artifact.renderOrder,
      })),
      modelPolygons: state.modelPolygons.map(clonePolygon),
      joinNodes: state.joinNodes.map((node) => ({
        ...node,
        wallIds: [...node.wallIds] as [string, string],
        location: cloneVector(node.location),
      })),
    });
  });

  return artifacts;
}

export function buildResolvedWallArtifacts(
  sources: WallResolvedSource[],
  topology: WallTopologyNode[],
  options?: WallSystemOptions,
) {
  const resolved = resolvedOptions(options);
  const states = new Map<string, WallArtifactState>();

  sources.forEach((source) => {
    states.set(source.wallId, createDefaultState(source));
  });

  const orderedNodes = [...topology].sort((a, b) => {
    const priority = { L: 0, T: 1, X: 2 } as const;
    return priority[a.type] - priority[b.type];
  });

  for (const node of orderedNodes) {
    const primary = states.get(node.primaryWallId);
    const secondary = states.get(node.wallIds[0] === node.primaryWallId ? node.wallIds[1] : node.wallIds[0]);
    if (!primary || !secondary) {
      continue;
    }

    if (node.type === "X") {
      applyXJoin(primary, secondary, node, resolved.segmentTolerance);
    } else if (node.type === "T") {
      applyTJoin(primary, secondary, node);
    } else {
      applyButtLikeJoin(primary, secondary, node, resolved.segmentTolerance);
    }

    markJoin(primary, node);
    markJoin(secondary, node);
  }

  return stateMapToArtifacts(states);
}
