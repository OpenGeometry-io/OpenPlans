import { Vector3 } from "opengeometry";

/**
 * Wall-local coordinate frame.
 *
 * Convention: +Y up. Walls live in the XZ plane.
 *   u — along the wall (start → end), distance from start
 *   v — perpendicular to the wall in the XZ plane (normal)
 *   h — vertical (world Y)
 *
 * Any opening hosted on a wall stores its geometry in this local basis;
 * the host transforms it into world coordinates via {@link localToWorld}.
 */
export interface WallFrame {
  origin: Vector3;
  uAxis: Vector3;
  vAxis: Vector3;
  wAxis: Vector3;
  length: number;
}

export type LocalPoint = [u: number, v: number, h: number];

function crossV(a: Vector3, b: Vector3): Vector3 {
  return new Vector3(
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x,
  );
}

export function computeWallFrame(start: Vector3, end: Vector3): WallFrame {
  const delta = end.clone().subtract(start);
  const length = delta.length();

  if (length < 1e-6) {
    throw new Error(
      "computeWallFrame: degenerate wall (start and end points coincide).",
    );
  }

  const uAxis = delta.clone().normalize();
  const wAxis = new Vector3(0, 1, 0);
  const vAxis = crossV(wAxis, uAxis).normalize();

  return {
    origin: start.clone(),
    uAxis,
    vAxis,
    wAxis,
    length,
  };
}

export function localToWorld(
  frame: WallFrame,
  u: number,
  v: number,
  h: number,
): Vector3 {
  return new Vector3(
    frame.origin.x + frame.uAxis.x * u + frame.vAxis.x * v + frame.wAxis.x * h,
    frame.origin.y + frame.uAxis.y * u + frame.vAxis.y * v + frame.wAxis.y * h,
    frame.origin.z + frame.uAxis.z * u + frame.vAxis.z * v + frame.wAxis.z * h,
  );
}

export function localToWorldPoints(
  frame: WallFrame,
  points: LocalPoint[],
): Vector3[] {
  return points.map(([u, v, h]) => localToWorld(frame, u, v, h));
}
