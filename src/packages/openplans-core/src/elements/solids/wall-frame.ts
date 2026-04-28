import { Vector3 } from "opengeometry";

/**
 * Wall-local coordinate frame.
 *
 * Convention: +Y up. Walls live in the XZ plane.
 *   alongWall  — along the wall (start → end), distance from start
 *   acrossWall — perpendicular to the wall in the XZ plane (normal)
 *   elevation  — vertical (world Y)
 */
export interface WallFrame {
  origin: Vector3;
  alongWallAxis: Vector3;
  acrossWallAxis: Vector3;
  verticalAxis: Vector3;
  length: number;
  /** Host wall thickness. Populated when the frame comes from a wall; undefined for unhosted use. */
  thickness?: number;
}

export type LocalPoint = [alongWall: number, acrossWall: number, elevation: number];

function crossV(a: Vector3, b: Vector3): Vector3 {
  return new Vector3(
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x,
  );
}

export function computeWallFrame(start: Vector3, end: Vector3, thickness?: number): WallFrame {
  const delta = end.clone().subtract(start);
  const length = delta.length();

  if (length < 1e-6) {
    throw new Error(
      "computeWallFrame: degenerate wall (start and end points coincide).",
    );
  }

  const alongWallAxis = delta.clone().normalize();
  const verticalAxis = new Vector3(0, 1, 0);
  const acrossWallAxis = crossV(verticalAxis, alongWallAxis).normalize();

  return {
    origin: start.clone(),
    alongWallAxis,
    acrossWallAxis,
    verticalAxis,
    length,
    thickness,
  };
}

export function localToWorld(
  frame: WallFrame,
  alongWall: number,
  acrossWall: number,
  elevation: number,
): Vector3 {
  return new Vector3(
    frame.origin.x
      + frame.alongWallAxis.x  * alongWall
      + frame.acrossWallAxis.x * acrossWall
      + frame.verticalAxis.x   * elevation,
    frame.origin.y
      + frame.alongWallAxis.y  * alongWall
      + frame.acrossWallAxis.y * acrossWall
      + frame.verticalAxis.y   * elevation,
    frame.origin.z
      + frame.alongWallAxis.z  * alongWall
      + frame.acrossWallAxis.z * acrossWall
      + frame.verticalAxis.z   * elevation,
  );
}

export function localToWorldPoints(
  frame: WallFrame,
  points: LocalPoint[],
): Vector3[] {
  return points.map(([alongWall, acrossWall, elevation]) =>
    localToWorld(frame, alongWall, acrossWall, elevation),
  );
}
