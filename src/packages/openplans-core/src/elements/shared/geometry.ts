import { Vector3 } from "opengeometry";

export function rectVertices(width: number, depth: number): Vector3[] {
  const halfWidth = width / 2;
  const halfDepth = depth / 2;

  return [
    new Vector3(-halfWidth, 0, -halfDepth),
    new Vector3(-halfWidth, 0, halfDepth),
    new Vector3(halfWidth, 0, halfDepth),
    new Vector3(halfWidth, 0, -halfDepth),
  ];
}

export function circleVertices(radius: number, segments = 24): Vector3[] {
  const vertices: Vector3[] = [];
  for (let index = 0; index <= segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2;
    vertices.push(new Vector3(
      Math.cos(angle) * radius,
      0,
      Math.sin(angle) * radius,
    ));
  }
  return vertices;
}

export function ovalVertices(width: number, depth: number, segments = 24): Vector3[] {
  const vertices: Vector3[] = [];
  for (let index = 0; index <= segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2;
    vertices.push(new Vector3(
      Math.cos(angle) * width / 2,
      0,
      Math.sin(angle) * depth / 2,
    ));
  }
  return vertices;
}

export function roundedRectVertices(
  width: number,
  depth: number,
  radius: number,
  cornerSegments = 6,
): Vector3[] {
  const vertices: Vector3[] = [];
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const resolvedRadius = Math.min(radius, halfWidth, halfDepth);

  const addCorner = (centerX: number, centerZ: number, startAngle: number) => {
    for (let index = 0; index <= cornerSegments; index += 1) {
      const angle = startAngle + (index / cornerSegments) * (Math.PI / 2);
      vertices.push(new Vector3(
        centerX + Math.cos(angle) * resolvedRadius,
        0,
        centerZ + Math.sin(angle) * resolvedRadius,
      ));
    }
  };

  addCorner(-halfWidth + resolvedRadius, -halfDepth + resolvedRadius, Math.PI);
  addCorner(halfWidth - resolvedRadius, -halfDepth + resolvedRadius, -Math.PI / 2);
  addCorner(halfWidth - resolvedRadius, halfDepth - resolvedRadius, 0);
  addCorner(-halfWidth + resolvedRadius, halfDepth - resolvedRadius, Math.PI / 2);

  return vertices;
}

export function ringVertices(innerRadius: number, outerRadius: number, segments = 24): Vector3[] {
  const vertices: Vector3[] = [];

  for (let index = 0; index <= segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2;
    vertices.push(new Vector3(
      Math.cos(angle) * outerRadius,
      0,
      Math.sin(angle) * outerRadius,
    ));
  }

  for (let index = segments; index >= 0; index -= 1) {
    const angle = (index / segments) * Math.PI * 2;
    vertices.push(new Vector3(
      Math.cos(angle) * innerRadius,
      0,
      Math.sin(angle) * innerRadius,
    ));
  }

  return vertices;
}

export function blobVertices(
  radiusX: number,
  radiusZ: number,
  segments = 24,
  wobbleCount = 6,
  wobbleAmount = 0.08,
): Vector3[] {
  const vertices: Vector3[] = [];
  for (let index = 0; index <= segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2;
    const wobble = 1 + Math.sin(angle * wobbleCount) * wobbleAmount;
    vertices.push(new Vector3(
      Math.cos(angle) * radiusX * wobble,
      0,
      Math.sin(angle) * radiusZ * wobble,
    ));
  }
  return vertices;
}

export function moveVertices(vertices: Vector3[], x = 0, y = 0, z = 0): Vector3[] {
  return vertices.map((vertex) => new Vector3(vertex.x + x, vertex.y + y, vertex.z + z));
}
