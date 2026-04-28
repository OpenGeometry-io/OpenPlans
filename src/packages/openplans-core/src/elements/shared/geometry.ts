import { Vector3 } from "opengeometry";

/**
 * Four vertices of a rectangle centered at the origin in the XZ plane (Y=0).
 * Order: bottom-left, bottom-right, top-right, top-left (counter-clockwise when viewed from above).
 */
export function rectVertices(width: number, depth: number): Vector3[] {
  const hw = width / 2;
  const hd = depth / 2;
  return [
    new Vector3(-hw, 0, -hd),
    new Vector3( hw, 0, -hd),
    new Vector3( hw, 0,  hd),
    new Vector3(-hw, 0,  hd),
  ];
}

/**
 * N vertices of a circle centered at the origin in the XZ plane (Y=0).
 */
export function circleVertices(radius: number, segments: number): Vector3[] {
  return Array.from({ length: segments }, (_, i) => {
    const angle = (i / segments) * Math.PI * 2;
    return new Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
  });
}
