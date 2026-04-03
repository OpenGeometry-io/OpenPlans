import * as THREE from "three";
import { Opening as KernelOpening, Vector3 } from "opengeometry";

import { Door } from "../openings/door";
import { WallOpening } from "../openings/wall-opening";
import { Window } from "../openings/window";

export interface WallPoint {
  x: number;
  y: number;
  z: number;
}

export type WallEndpoint = "start" | "end";
export type WallAttachmentSide = "center" | "left" | "right";

export interface WallAttachment {
  offset: number;
  baseHeight?: number;
  side?: WallAttachmentSide;
  clearanceDepth?: number;
}

export interface WallCap {
  left: Vector3;
  right: Vector3;
}

export interface ResolvedStraightWallShape {
  start: WallCap;
  end: WallCap;
  polygons?: Vector3[][];
  planPolygons?: Vector3[][];
  planRenderOrder?: number;
}

export interface StraightWallFrame {
  start: Vector3;
  end: Vector3;
  direction: Vector3;
  normal: Vector3;
  length: number;
  halfThickness: number;
}

export interface HostedOpeningPlacement {
  center: Vector3;
  baseHeight: number;
  intrinsicBaseHeight: number;
  width: number;
  height: number;
  depth: number;
  rotationY: number;
  holeVertices: Vector3[];
  volume: KernelOpening;
}

export type HostedOpeningLike = Door | Window | WallOpening;

const EPSILON = 1e-6;

export function asVector3Points(points: WallPoint[]) {
  return points.map((point) => new Vector3(point.x, point.y, point.z));
}

export function isStraightWall(points: WallPoint[]) {
  return points.length === 2;
}

export function buildStraightWallFrame(points: WallPoint[], thickness: number): StraightWallFrame | null {
  if (!isStraightWall(points)) {
    return null;
  }

  const [startPoint, endPoint] = asVector3Points(points);
  const direction = new Vector3(endPoint.x - startPoint.x, 0, endPoint.z - startPoint.z);
  const length = Math.hypot(direction.x, direction.z);
  if (length < EPSILON) {
    return null;
  }

  direction.x /= length;
  direction.z /= length;

  return {
    start: startPoint,
    end: endPoint,
    direction,
    normal: new Vector3(-direction.z, 0, direction.x),
    length,
    halfThickness: thickness / 2,
  };
}

export function createDefaultResolvedShape(frame: StraightWallFrame): ResolvedStraightWallShape {
  const leftStart = addScaledVector(frame.start, frame.normal, frame.halfThickness);
  const rightStart = addScaledVector(frame.start, frame.normal, -frame.halfThickness);
  const leftEnd = addScaledVector(frame.end, frame.normal, frame.halfThickness);
  const rightEnd = addScaledVector(frame.end, frame.normal, -frame.halfThickness);

  return {
    start: {
      left: leftStart,
      right: rightStart,
    },
    end: {
      left: leftEnd,
      right: rightEnd,
    },
  };
}

export function cloneResolvedShape(shape: ResolvedStraightWallShape): ResolvedStraightWallShape {
  return {
    start: {
      left: cloneVector(shape.start.left),
      right: cloneVector(shape.start.right),
    },
    end: {
      left: cloneVector(shape.end.left),
      right: cloneVector(shape.end.right),
    },
    polygons: shape.polygons?.map((polygon) => polygon.map(cloneVector)),
    planPolygons: shape.planPolygons?.map((polygon) => polygon.map(cloneVector)),
    planRenderOrder: shape.planRenderOrder,
  };
}

export function straightWallVertices(shape: ResolvedStraightWallShape) {
  return [
    cloneVector(shape.start.left),
    cloneVector(shape.end.left),
    cloneVector(shape.end.right),
    cloneVector(shape.start.right),
  ];
}

export function resolvedShapePolygons(shape: ResolvedStraightWallShape) {
  if (shape.polygons && shape.polygons.length > 0) {
    return shape.polygons.map((polygon) => polygon.map(cloneVector));
  }

  return [straightWallVertices(shape)];
}

export function setResolvedShapePolygons(shape: ResolvedStraightWallShape, polygons: Vector3[][]) {
  shape.polygons = polygons.map((polygon) => polygon.map(cloneVector));
}

export function resolvedShapePlanPolygons(shape: ResolvedStraightWallShape) {
  if (shape.planPolygons && shape.planPolygons.length > 0) {
    return shape.planPolygons.map((polygon) => polygon.map(cloneVector));
  }

  return resolvedShapePolygons(shape);
}

export function setResolvedShapePlanPolygons(shape: ResolvedStraightWallShape, polygons: Vector3[][]) {
  shape.planPolygons = polygons.map((polygon) => polygon.map(cloneVector));
}

export function addScaledVector(origin: Vector3, direction: Vector3, scale: number) {
  return new Vector3(
    origin.x + direction.x * scale,
    origin.y + direction.y * scale,
    origin.z + direction.z * scale,
  );
}

export function cloneVector(vector: Vector3) {
  return new Vector3(vector.x, vector.y, vector.z);
}

export function boundaryPoint(
  frame: StraightWallFrame,
  endpoint: WallEndpoint,
  sideAway: -1 | 1,
) {
  const endpointPoint = endpoint === "start" ? frame.start : frame.end;
  const localSide = endpoint === "start" ? sideAway : -sideAway;
  return addScaledVector(endpointPoint, frame.normal, frame.halfThickness * localSide);
}

export function boundaryDirection(frame: StraightWallFrame, endpoint: WallEndpoint) {
  return endpoint === "start"
    ? cloneVector(frame.direction)
    : new Vector3(-frame.direction.x, 0, -frame.direction.z);
}

export function setEndpointCorner(
  shape: ResolvedStraightWallShape,
  endpoint: WallEndpoint,
  sideAway: -1 | 1,
  value: Vector3,
) {
  if (endpoint === "start") {
    if (sideAway === 1) {
      shape.start.left = value;
      return;
    }
    shape.start.right = value;
    return;
  }

  if (sideAway === 1) {
    shape.end.right = value;
    return;
  }

  shape.end.left = value;
}

export function lineIntersection2D(
  originA: Vector3,
  directionA: Vector3,
  originB: Vector3,
  directionB: Vector3,
) {
  const denominator = cross2D(directionA, directionB);
  if (Math.abs(denominator) < EPSILON) {
    return null;
  }

  const delta = new Vector3(originB.x - originA.x, 0, originB.z - originA.z);
  const distance = cross2D(delta, directionB) / denominator;
  return addScaledVector(originA, directionA, distance);
}

export function cross2D(a: Vector3, b: Vector3) {
  return a.x * b.z - a.z * b.x;
}

export function dot2D(a: Vector3, b: Vector3) {
  return a.x * b.x + a.z * b.z;
}

export function vectorBetween2D(from: Vector3, to: Vector3) {
  return new Vector3(to.x - from.x, 0, to.z - from.z);
}

export function distanceBetween2D(a: Vector3, b: Vector3) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

export function closestPointOnSegment2D(point: Vector3, start: Vector3, end: Vector3) {
  const segment = vectorBetween2D(start, end);
  const segmentLengthSquared = dot2D(segment, segment);
  if (segmentLengthSquared < EPSILON) {
    return {
      point: cloneVector(start),
      distance: distanceBetween2D(point, start),
      t: 0,
    };
  }

  const toPoint = vectorBetween2D(start, point);
  const rawT = dot2D(toPoint, segment) / segmentLengthSquared;
  const t = Math.max(0, Math.min(1, rawT));
  const closest = addScaledVector(start, segment, t);

  return {
    point: closest,
    distance: distanceBetween2D(point, closest),
    t,
  };
}

export function pointEquals2D(a: Vector3, b: Vector3, tolerance = 1e-5) {
  return distanceBetween2D(a, b) <= tolerance;
}

export function pointOnSegment2D(point: Vector3, start: Vector3, end: Vector3, tolerance = 1e-4) {
  const segment = vectorBetween2D(start, end);
  const toPoint = vectorBetween2D(start, point);
  if (Math.abs(cross2D(segment, toPoint)) > tolerance) {
    return false;
  }

  const dot = dot2D(toPoint, segment);
  if (dot < -EPSILON) {
    return false;
  }

  const segmentLengthSquared = dot2D(segment, segment);
  return dot <= segmentLengthSquared + EPSILON;
}

export function linePolygonIntersections2D(origin: Vector3, direction: Vector3, polygon: Vector3[]) {
  const intersections: Array<{ point: Vector3; offset: number }> = [];

  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    const edgeDirection = vectorBetween2D(current, next);
    const intersection = lineIntersection2D(origin, direction, current, edgeDirection);
    if (!intersection || !pointOnSegment2D(intersection, current, next)) {
      continue;
    }

    if (intersections.some((entry) => pointEquals2D(entry.point, intersection))) {
      continue;
    }

    intersections.push({
      point: intersection,
      offset: dot2D(vectorBetween2D(origin, intersection), direction),
    });
  }

  intersections.sort((a, b) => a.offset - b.offset);
  return intersections;
}

export function yawFromDirection(direction: Vector3) {
  return -Math.atan2(direction.z, direction.x);
}

export function normalizeOffset(offset: number, frame: StraightWallFrame) {
  return Math.max(0, Math.min(frame.length, offset));
}

export function resolveHostedOpeningPlacement(
  frame: StraightWallFrame,
  opening: HostedOpeningLike,
  attachment: WallAttachment,
  wallThickness: number,
) {
  const width = getHostedOpeningWidth(opening);
  const height = getHostedOpeningHeight(opening);
  const intrinsicBaseHeight = getHostedOpeningIntrinsicBaseHeight(opening);
  const baseHeight = attachment.baseHeight ?? intrinsicBaseHeight;
  const depth = Math.max(EPSILON, attachment.clearanceDepth ?? wallThickness);
  const offset = normalizeOffset(attachment.offset, frame);
  const lateralShift = resolveLateralShift(attachment.side, wallThickness, depth);
  const center = addScaledVector(
    addScaledVector(frame.start, frame.direction, offset),
    frame.normal,
    lateralShift,
  );
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const holeVertices = [
    new Vector3(
      center.x - frame.direction.x * halfWidth - frame.normal.x * halfDepth,
      0,
      center.z - frame.direction.z * halfWidth - frame.normal.z * halfDepth,
    ),
    new Vector3(
      center.x + frame.direction.x * halfWidth - frame.normal.x * halfDepth,
      0,
      center.z + frame.direction.z * halfWidth - frame.normal.z * halfDepth,
    ),
    new Vector3(
      center.x + frame.direction.x * halfWidth + frame.normal.x * halfDepth,
      0,
      center.z + frame.direction.z * halfWidth + frame.normal.z * halfDepth,
    ),
    new Vector3(
      center.x - frame.direction.x * halfWidth + frame.normal.x * halfDepth,
      0,
      center.z - frame.direction.z * halfWidth + frame.normal.z * halfDepth,
    ),
  ];

  return {
    center,
    baseHeight,
    intrinsicBaseHeight,
    width,
    height,
    depth,
    rotationY: yawFromDirection(frame.direction),
    holeVertices,
    volume: new KernelOpening({
      center: new Vector3(center.x, baseHeight + height / 2, center.z),
      width,
      height,
      depth,
      color: 0xffffff,
    }),
  } satisfies HostedOpeningPlacement;
}

function resolveLateralShift(
  side: WallAttachmentSide | undefined,
  wallThickness: number,
  clearanceDepth: number,
) {
  const shift = Math.max(0, (wallThickness - clearanceDepth) / 2);
  if (side === "left") {
    return shift;
  }
  if (side === "right") {
    return -shift;
  }
  return 0;
}

export function getHostedOpeningWidth(opening: HostedOpeningLike) {
  if (opening instanceof Door) {
    return opening.panelWidth;
  }

  if (opening instanceof Window) {
    return opening.windowWidth;
  }

  return opening.width;
}

export function getHostedOpeningHeight(opening: HostedOpeningLike) {
  if (opening instanceof Door) {
    return opening.doorHeight;
  }

  if (opening instanceof Window) {
    return opening.windowHeight;
  }

  return opening.height;
}

export function getHostedOpeningIntrinsicBaseHeight(opening: HostedOpeningLike) {
  if (opening instanceof Window) {
    return opening.sillHeight;
  }

  if (opening instanceof WallOpening) {
    return opening.baseHeight;
  }

  return 0;
}

export function isHostedOpeningLike(value: unknown): value is HostedOpeningLike {
  return value instanceof Door || value instanceof Window || value instanceof WallOpening;
}

export function isObject3D(value: unknown): value is THREE.Object3D {
  return value instanceof THREE.Object3D;
}

export function pointInPolygon2D(point: Vector3, vertices: Vector3[]) {
  let inside = false;

  for (let index = 0, previous = vertices.length - 1; index < vertices.length; previous = index, index += 1) {
    const current = vertices[index];
    const prior = vertices[previous];

    const intersects = ((current.z > point.z) !== (prior.z > point.z))
      && (point.x < ((prior.x - current.x) * (point.z - current.z)) / ((prior.z - current.z) || EPSILON) + current.x);

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

export function holeCenter(vertices: Vector3[]) {
  const sum = vertices.reduce((accumulator, vertex) => new Vector3(
    accumulator.x + vertex.x,
    0,
    accumulator.z + vertex.z,
  ), new Vector3(0, 0, 0));

  return new Vector3(sum.x / vertices.length, 0, sum.z / vertices.length);
}
