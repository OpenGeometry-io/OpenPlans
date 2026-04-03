import { Vector3 } from "opengeometry";

import {
  closestPointOnSegment2D,
  cross2D,
  distanceBetween2D,
  lineIntersection2D,
  pointEquals2D,
  vectorBetween2D,
} from "./wall-geometry";
import type {
  WallJoinCapStyle,
  WallResolvedSource,
  WallSystemOptions,
  WallTopologyNode,
} from "./wall-types";

const DEFAULT_OPTIONS: Required<Pick<WallSystemOptions, "endpointTolerance" | "segmentTolerance" | "parallelTolerance" | "capStyle">> = {
  endpointTolerance: 1e-3,
  segmentTolerance: 1e-3,
  parallelTolerance: 1e-6,
  capStyle: "uncapped",
};

function resolvedOptions(options?: WallSystemOptions) {
  return {
    ...DEFAULT_OPTIONS,
    ...options,
  };
}

function endpointFromT(t: number, tolerance: number) {
  if (t <= tolerance) {
    return "start" as const;
  }

  if (t >= 1 - tolerance) {
    return "end" as const;
  }

  return null;
}

function selectPrimaryWallId(a: WallResolvedSource, b: WallResolvedSource) {
  if (Math.abs(a.frame.length - b.frame.length) > 1e-6) {
    return a.frame.length > b.frame.length ? a.wallId : b.wallId;
  }

  if (a.creationOrder !== b.creationOrder) {
    return a.creationOrder < b.creationOrder ? a.wallId : b.wallId;
  }

  return a.wallId <= b.wallId ? a.wallId : b.wallId;
}

function createNodeId(a: WallResolvedSource, b: WallResolvedSource, type: string) {
  const [first, second] = [a.wallId, b.wallId].sort();
  return `${type}:${first}:${second}`;
}

function buildLNode(
  a: WallResolvedSource,
  b: WallResolvedSource,
  endpointA: "start" | "end",
  endpointB: "start" | "end",
  capStyle: WallJoinCapStyle,
): WallTopologyNode {
  const locationA = endpointA === "start" ? a.frame.start : a.frame.end;
  const locationB = endpointB === "start" ? b.frame.start : b.frame.end;
  const location = new Vector3(
    (locationA.x + locationB.x) / 2,
    0,
    (locationA.z + locationB.z) / 2,
  );
  const primaryWallId = selectPrimaryWallId(a, b);

  return {
    id: createNodeId(a, b, "L"),
    type: "L",
    capStyle,
    primaryWallId,
    location,
    wallIds: [a.wallId, b.wallId],
    participants: [
      {
        wallId: a.wallId,
        endpoint: endpointA,
        t: endpointA === "start" ? 0 : 1,
        kind: "endpoint",
      },
      {
        wallId: b.wallId,
        endpoint: endpointB,
        t: endpointB === "start" ? 0 : 1,
        kind: "endpoint",
      },
    ],
  };
}

export function buildWallTopology(
  sources: WallResolvedSource[],
  options?: WallSystemOptions,
) {
  const resolved = resolvedOptions(options);
  const nodes: WallTopologyNode[] = [];

  for (let index = 0; index < sources.length; index += 1) {
    const current = sources[index];
    for (let otherIndex = index + 1; otherIndex < sources.length; otherIndex += 1) {
      const other = sources[otherIndex];

      if (Math.abs(cross2D(current.frame.direction, other.frame.direction)) < resolved.parallelTolerance) {
        continue;
      }

      const endpointPairs: Array<["start" | "end", "start" | "end"]> = [
        ["start", "start"],
        ["start", "end"],
        ["end", "start"],
        ["end", "end"],
      ];

      let endpointNode: WallTopologyNode | null = null;
      for (const [currentEndpoint, otherEndpoint] of endpointPairs) {
        const currentPoint = currentEndpoint === "start" ? current.frame.start : current.frame.end;
        const otherPoint = otherEndpoint === "start" ? other.frame.start : other.frame.end;
        if (distanceBetween2D(currentPoint, otherPoint) <= resolved.endpointTolerance) {
          endpointNode = buildLNode(current, other, currentEndpoint, otherEndpoint, resolved.capStyle);
          break;
        }
      }

      if (endpointNode) {
        nodes.push(endpointNode);
        continue;
      }

      const intersection = lineIntersection2D(
        current.frame.start,
        vectorBetween2D(current.frame.start, current.frame.end),
        other.frame.start,
        vectorBetween2D(other.frame.start, other.frame.end),
      );

      if (!intersection) {
        continue;
      }

      const currentClosest = closestPointOnSegment2D(intersection, current.frame.start, current.frame.end);
      const otherClosest = closestPointOnSegment2D(intersection, other.frame.start, other.frame.end);
      if (currentClosest.distance > resolved.segmentTolerance || otherClosest.distance > resolved.segmentTolerance) {
        continue;
      }

      const currentEndpoint = endpointFromT(currentClosest.t, resolved.endpointTolerance);
      const otherEndpoint = endpointFromT(otherClosest.t, resolved.endpointTolerance);

      if (currentEndpoint && otherEndpoint) {
        nodes.push(buildLNode(current, other, currentEndpoint, otherEndpoint, resolved.capStyle));
        continue;
      }

      if (currentEndpoint && !otherEndpoint) {
        nodes.push({
          id: createNodeId(current, other, "T"),
          type: "T",
          capStyle: resolved.capStyle,
          primaryWallId: other.wallId,
          location: new Vector3(intersection.x, 0, intersection.z),
          wallIds: [current.wallId, other.wallId],
          participants: [
            {
              wallId: current.wallId,
              endpoint: currentEndpoint,
              t: currentClosest.t,
              kind: "endpoint",
            },
            {
              wallId: other.wallId,
              endpoint: null,
              t: otherClosest.t,
              kind: "interior",
            },
          ],
        });
        continue;
      }

      if (!currentEndpoint && otherEndpoint) {
        nodes.push({
          id: createNodeId(current, other, "T"),
          type: "T",
          capStyle: resolved.capStyle,
          primaryWallId: current.wallId,
          location: new Vector3(intersection.x, 0, intersection.z),
          wallIds: [current.wallId, other.wallId],
          participants: [
            {
              wallId: current.wallId,
              endpoint: null,
              t: currentClosest.t,
              kind: "interior",
            },
            {
              wallId: other.wallId,
              endpoint: otherEndpoint,
              t: otherClosest.t,
              kind: "endpoint",
            },
          ],
        });
        continue;
      }

      if (
        !pointEquals2D(current.frame.start, intersection, resolved.segmentTolerance)
        && !pointEquals2D(current.frame.end, intersection, resolved.segmentTolerance)
        && !pointEquals2D(other.frame.start, intersection, resolved.segmentTolerance)
        && !pointEquals2D(other.frame.end, intersection, resolved.segmentTolerance)
      ) {
        const primaryWallId = selectPrimaryWallId(current, other);
        nodes.push({
          id: createNodeId(current, other, "X"),
          type: "X",
          capStyle: resolved.capStyle,
          primaryWallId,
          location: new Vector3(intersection.x, 0, intersection.z),
          wallIds: [current.wallId, other.wallId],
          participants: [
            {
              wallId: current.wallId,
              endpoint: null,
              t: currentClosest.t,
              kind: "interior",
            },
            {
              wallId: other.wallId,
              endpoint: null,
              t: otherClosest.t,
              kind: "interior",
            },
          ],
        });
      }
    }
  }

  return nodes;
}
