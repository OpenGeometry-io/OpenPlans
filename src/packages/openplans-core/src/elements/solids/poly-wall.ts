import * as THREE from "three";
import { BooleanResult, Polygon, Polyline, Solid, Vector3 } from "opengeometry";

import { IShape } from "../../shapes/base-type";
import { ElementType } from "../base-type";
import { Door, Window } from "../openings";
import { Opening } from "../openings/opening";
import { WallMaterial, WallOptions } from "./wall-types";
import { WallFrame, computeWallFrame } from "./wall-frame";

/** Optional hosting placement for PolyWall.attach* — offset is total arc-length along the polyline. */
export interface PolyWallHostPlacement {
  offset?: number;
  baseHeight?: number;
}

/** Resolution of a polyline arc-length offset into a specific segment. */
export interface PolyWallSegmentResolution {
  segmentIndex: number;
  localU: number;
  frame: WallFrame;
}

type WallPoint = [number, number, number];

type GeometryState = {
  points: WallPoint[];
  thickness: number;
  footprint: Vector3[];
};

type GeometryStateResult =
  | { state: GeometryState }
  | { error: string };

const DEFAULT_POINTS: WallPoint[] = [
  [0, 0, 0],
  [1.5, 0, 0],
  [2.5, 0, 1.5],
];

const GEOMETRY_EPSILON = 1e-6;
const FOOTPRINT_AREA_EPSILON = 1e-6;
const PLAN_RENDER_ORDER = 20;

function clonePoint(point: WallPoint): WallPoint {
  return [point[0], point[1], point[2]];
}

function clonePoints(points: WallPoint[]): WallPoint[] {
  return points.map((point) => clonePoint(point));
}

function cloneVector(point: Vector3): Vector3 {
  return new Vector3(point.x, point.y, point.z);
}

function isFinitePoint(point: WallPoint): boolean {
  return Number.isFinite(point[0]) && Number.isFinite(point[1]) && Number.isFinite(point[2]);
}

function pointsMatch(a: WallPoint, b: WallPoint, epsilon = GEOMETRY_EPSILON): boolean {
  return (
    Math.abs(a[0] - b[0]) <= epsilon &&
    Math.abs(a[1] - b[1]) <= epsilon &&
    Math.abs(a[2] - b[2]) <= epsilon
  );
}

function vectorsMatch(a: Vector3, b: Vector3, epsilon = GEOMETRY_EPSILON): boolean {
  return (
    Math.abs(a.x - b.x) <= epsilon &&
    Math.abs(a.y - b.y) <= epsilon &&
    Math.abs(a.z - b.z) <= epsilon
  );
}

function pointDistanceSquared(a: WallPoint, b: WallPoint): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return dx * dx + dy * dy + dz * dz;
}

function signedAreaXZ(vertices: Vector3[]): number {
  let area = 0;
  for (let index = 0; index < vertices.length; index += 1) {
    const current = vertices[index];
    const next = vertices[(index + 1) % vertices.length];
    area += current.x * next.z - next.x * current.z;
  }
  return area / 2;
}

function sanitizeFootprintVertices(vertices: Vector3[]): Vector3[] {
  const sanitized: Vector3[] = [];

  for (const vertex of vertices) {
    const lastVertex = sanitized[sanitized.length - 1];
    if (!lastVertex || !vectorsMatch(lastVertex, vertex)) {
      sanitized.push(cloneVector(vertex));
    }
  }

  if (sanitized.length > 1 && vectorsMatch(sanitized[0], sanitized[sanitized.length - 1])) {
    sanitized.pop();
  }

  return sanitized;
}

function orientationXZ(a: Vector3, b: Vector3, c: Vector3): number {
  return (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x);
}

function onSegmentXZ(a: Vector3, b: Vector3, point: Vector3, epsilon = GEOMETRY_EPSILON): boolean {
  return (
    point.x <= Math.max(a.x, b.x) + epsilon &&
    point.x >= Math.min(a.x, b.x) - epsilon &&
    point.z <= Math.max(a.z, b.z) + epsilon &&
    point.z >= Math.min(a.z, b.z) - epsilon
  );
}

function segmentsIntersectXZ(a1: Vector3, a2: Vector3, b1: Vector3, b2: Vector3): boolean {
  const o1 = orientationXZ(a1, a2, b1);
  const o2 = orientationXZ(a1, a2, b2);
  const o3 = orientationXZ(b1, b2, a1);
  const o4 = orientationXZ(b1, b2, a2);

  const o1Zero = Math.abs(o1) <= GEOMETRY_EPSILON;
  const o2Zero = Math.abs(o2) <= GEOMETRY_EPSILON;
  const o3Zero = Math.abs(o3) <= GEOMETRY_EPSILON;
  const o4Zero = Math.abs(o4) <= GEOMETRY_EPSILON;

  if (o1Zero && onSegmentXZ(a1, a2, b1)) {
    return true;
  }
  if (o2Zero && onSegmentXZ(a1, a2, b2)) {
    return true;
  }
  if (o3Zero && onSegmentXZ(b1, b2, a1)) {
    return true;
  }
  if (o4Zero && onSegmentXZ(b1, b2, a2)) {
    return true;
  }

  return (o1 > 0) !== (o2 > 0) && (o3 > 0) !== (o4 > 0);
}

function hasSelfIntersectionXZ(vertices: Vector3[]): boolean {
  const edgeCount = vertices.length;

  for (let firstIndex = 0; firstIndex < edgeCount; firstIndex += 1) {
    const firstStart = vertices[firstIndex];
    const firstEnd = vertices[(firstIndex + 1) % edgeCount];

    for (let secondIndex = firstIndex + 1; secondIndex < edgeCount; secondIndex += 1) {
      const firstSharesStart = secondIndex === firstIndex;
      const firstSharesEnd = secondIndex === (firstIndex + 1) % edgeCount;
      const wrapsBackToStart = firstIndex === 0 && secondIndex === edgeCount - 1;
      if (firstSharesStart || firstSharesEnd || wrapsBackToStart) {
        continue;
      }

      const secondStart = vertices[secondIndex];
      const secondEnd = vertices[(secondIndex + 1) % edgeCount];

      if (segmentsIntersectXZ(firstStart, firstEnd, secondStart, secondEnd)) {
        return true;
      }
    }
  }

  return false;
}

function discardGeometry(shape: { discardGeometry?: () => void } | null | undefined): void {
  shape?.discardGeometry?.();
}

function buildFootprint(points: WallPoint[], thickness: number): GeometryStateResult {
  const sourceLine = new Polyline({
    points: points.map((point) => new Vector3(point[0], point[1], point[2])),
    color: 0xffffff,
  });

  try {
    const positiveOffset = sourceLine.getOffset(thickness / 2, 50, true);
    const negativeOffset = sourceLine.getOffset(-thickness / 2, 50, true);

    console.log(positiveOffset.points);
    console.log(negativeOffset.points);


    const footprint = sanitizeFootprintVertices([
      ...positiveOffset.points.map((point) => cloneVector(point)),
      ...negativeOffset.points.slice().reverse().map((point) => cloneVector(point)),
    ]);

    if (footprint.length < 3) {
      return {
        error: "Invalid polyline wall geometry: Offset footprint must contain at least three unique vertices.",
      };
    }

    if (hasSelfIntersectionXZ(footprint)) {
      return {
        error:
          "Invalid polyline wall geometry: Offset footprint self-intersects. Reduce the wall thickness or simplify the path.",
      };
    }

    const area = signedAreaXZ(footprint);
    if (Math.abs(area) <= FOOTPRINT_AREA_EPSILON) {
      return {
        error: "Invalid polyline wall geometry: Offset footprint area is too small to build a stable wall.",
      };
    }

    const normalizedFootprint = area > 0 ? footprint.slice().reverse() : footprint;

    return {
      state: {
        points: clonePoints(points),
        thickness,
        footprint: normalizedFootprint.map((point) => cloneVector(point)),
      },
    };
  } catch (error) {
    return {
      error: `Invalid polyline wall geometry: Failed to compute wall footprint${
        error instanceof Error && error.message ? ` (${error.message})` : "."
      }`,
    };
  } finally {
    discardGeometry(sourceLine);
  }
}

function prepareGeometryState(points: WallPoint[], thickness: number): GeometryStateResult {
  if (!Number.isFinite(thickness) || thickness <= 0) {
    return {
      error: "Invalid polyline wall geometry: Wall thickness must be a positive finite number.",
    };
  }

  if (points.length < 2) {
    return {
      error: "Invalid polyline wall geometry: A polyline wall requires at least two points.",
    };
  }

  const clonedPoints = clonePoints(points);
  const baseY = clonedPoints[0][1];

  for (let index = 0; index < clonedPoints.length; index += 1) {
    const point = clonedPoints[index];
    if (!isFinitePoint(point)) {
      return {
        error: `Invalid polyline wall geometry: Point ${index} must contain finite numbers.`,
      };
    }

    if (Math.abs(point[1] - baseY) > GEOMETRY_EPSILON) {
      return {
        error:
          "Invalid polyline wall geometry: Polyline walls currently support only horizontal paths, so all point Y values must match.",
      };
    }

    if (index > 0 && pointDistanceSquared(clonedPoints[index - 1], point) <= GEOMETRY_EPSILON * GEOMETRY_EPSILON) {
      return {
        error: `Invalid polyline wall geometry: Consecutive points at index ${index - 1} and ${index} cannot define a zero-length segment.`,
      };
    }
  }

  if (pointsMatch(clonedPoints[0], clonedPoints[clonedPoints.length - 1])) {
    return {
      error: "Invalid polyline wall geometry: First and last points cannot be the same.",
    };
  }

  return buildFootprint(clonedPoints, thickness);
}

function disposeObject(obj: THREE.Object3D): void {
  const mesh = obj as THREE.Mesh;
  if (mesh.geometry) {
    mesh.geometry.dispose();
  }
  if (Array.isArray(mesh.material)) {
    mesh.material.forEach((material) => material.dispose());
  } else if (mesh.material) {
    mesh.material.dispose();
  }
  obj.removeFromParent();
}

export class PolyWall extends Polyline implements IShape {
  ogType = ElementType.WALL;

  subElements2D: Map<string, THREE.Object3D> = new Map();
  private isProfileView = true;

  subElements3D: Map<string, THREE.Object3D> = new Map();
  private isModelView = true;

  private openings: Opening[] = [];

  selected = false;
  edit = false;
  locked = false;

  /** Whether to keep this as pure line and not convert to 2D and 3D meshes. */
  isLineWall = false;

  _outlineEnabled = false;

  propertySet: WallOptions = {
    labelName: "Standard Polyline Wall",
    thickness: 0.3,
    material: WallMaterial.CONCRETE,
    color: 0xcccccc,
    height: 3,
    points: clonePoints(DEFAULT_POINTS),
    placement: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
    openings: [],
  };

  get outline() {
    return this._outlineEnabled;
  }

  set outline(value: boolean) {
    this._outlineEnabled = value;
    this.applyRenderStyles();
  }

  get labelName() {
    return this.propertySet.labelName;
  }

  set labelName(value: string) {
    this.propertySet.labelName = value;
  }

  get wallThickness() {
    return this.propertySet.thickness;
  }

  set wallThickness(value: number) {
    const nextThickness = Math.max(0.1, value);
    const geometryState = this.resolveGeometryState(this.propertySet.points, nextThickness);
    if (!geometryState) {
      return;
    }

    this.propertySet.thickness = nextThickness;
    this.setOPGeometry(geometryState);
  }

  get wallMaterial() {
    return this.propertySet.material;
  }

  set wallMaterial(value: WallMaterial | string) {
    this.propertySet.material = value;
  }

  get wallColor() {
    return this.propertySet.color;
  }

  set wallColor(value: number) {
    this.propertySet.color = value;
    this.setOPMaterial();
  }

  get wallHeight() {
    return this.propertySet.height;
  }

  set wallHeight(value: number) {
    this.propertySet.height = Math.max(0.1, value);
    this.setOPGeometry();
  }

  get points(): WallPoint[] {
    return clonePoints(this.propertySet.points);
  }

  get start() {
    return this.propertySet.points[0];
  }

  set start(value: WallPoint) {
    this.updatePoint(0, value);
  }

  get end() {
    return this.propertySet.points[this.propertySet.points.length - 1];
  }

  set end(value: WallPoint) {
    this.updatePoint(this.propertySet.points.length - 1, value);
  }

  get profileView() {
    return this.isProfileView;
  }

  set profileView(value: boolean) {
    this.isProfileView = value;
    this.syncViewVisibility();
  }

  get modelView() {
    return this.isModelView;
  }

  set modelView(value: boolean) {
    this.isModelView = value;
    this.syncViewVisibility();
  }

  constructor(wallConfig?: Partial<WallOptions>) {
    const requestedThickness = Math.max(0.1, wallConfig?.thickness ?? 0.3);
    const requestedState = prepareGeometryState(clonePoints(wallConfig?.points ?? DEFAULT_POINTS), requestedThickness);
    const fallbackState = prepareGeometryState(clonePoints(DEFAULT_POINTS), 0.3);
    if ("error" in fallbackState) {
      throw new Error(fallbackState.error);
    }

    const initialState = "state" in requestedState ? requestedState.state : fallbackState.state;

    if ("error" in requestedState) {
      console.error(`${requestedState.error} Falling back to the default polyline wall path.`);
    }

    super({
      ogid: wallConfig?.ogid,
      points: initialState.points.map((point) => new Vector3(point[0], point[1], point[2])),
      color: wallConfig?.color ?? 0xcccccc,
    });

    this.subElements2D = new Map<string, THREE.Object3D>();
    this.subElements3D = new Map<string, THREE.Object3D>();

    if (wallConfig) {
      this.propertySet = {
        ...this.propertySet,
        ...wallConfig,
        openings: [...(wallConfig.openings ?? this.propertySet.openings)],
      };
    }

    this.propertySet.points = clonePoints(initialState.points);
    this.propertySet.thickness = initialState.thickness;
    this.propertySet.ogid = this.ogid;

    this.setOPGeometry(initialState);
  }

  setOPConfig(config: WallOptions): void {
    const nextThickness = Math.max(0.1, config.thickness ?? this.propertySet.thickness);
    const nextPoints = clonePoints(config.points ?? this.propertySet.points);
    const geometryState = this.resolveGeometryState(nextPoints, nextThickness);
    if (!geometryState) {
      return;
    }

    this.propertySet = {
      ...this.propertySet,
      ...config,
      thickness: nextThickness,
      points: clonePoints(geometryState.points),
      openings: [...(config.openings ?? this.propertySet.openings)],
    };

    this.setOPGeometry(geometryState);
    this.setOPMaterial();
  }

  getOPConfig(): WallOptions {
    return this.propertySet;
  }

  setPoints(points: WallPoint[]): boolean {
    const geometryState = this.resolveGeometryState(points, this.propertySet.thickness);
    if (!geometryState) {
      return false;
    }

    this.propertySet.points = clonePoints(geometryState.points);
    this.setOPGeometry(geometryState);
    return true;
  }

  appendPoint(point: WallPoint): boolean {
    const nextPoints = this.points;
    nextPoints.push(clonePoint(point));
    return this.setPoints(nextPoints);
  }

  insertPoint(index: number, point: WallPoint): boolean {
    if (index < 0 || index > this.propertySet.points.length) {
      console.error("Invalid polyline wall geometry: Insert index is out of range.");
      return false;
    }

    const nextPoints = this.points;
    nextPoints.splice(index, 0, clonePoint(point));
    return this.setPoints(nextPoints);
  }

  updatePoint(index: number, point: WallPoint): boolean {
    if (index < 0 || index >= this.propertySet.points.length) {
      console.error("Invalid polyline wall geometry: Point index is out of range.");
      return false;
    }

    const nextPoints = this.points;
    nextPoints[index] = clonePoint(point);
    return this.setPoints(nextPoints);
  }

  removePoint(index: number): boolean {
    if (index < 0 || index >= this.propertySet.points.length) {
      console.error("Invalid polyline wall geometry: Point index is out of range.");
      return false;
    }

    const nextPoints = this.points;
    nextPoints.splice(index, 1);
    return this.setPoints(nextPoints);
  }

  /**
   * Resolve an arc-length offset along the polyline into the segment that
   * owns it, plus the wall-local u distance within that segment and the
   * segment's WallFrame. Throws if the polyline has fewer than 2 points
   * or the offset is out of range.
   */
  getFrameForOffset(offset: number): PolyWallSegmentResolution {
    const pts = this.propertySet.points;
    if (pts.length < 2) {
      throw new Error("PolyWall.getFrameForOffset: polyline must have at least 2 points.");
    }

    let remaining = offset;
    for (let i = 0; i < pts.length - 1; i += 1) {
      const a = new Vector3(pts[i][0], pts[i][1], pts[i][2]);
      const b = new Vector3(pts[i + 1][0], pts[i + 1][1], pts[i + 1][2]);
      const segLength = a.clone().subtract(b).length();
      if (remaining <= segLength || i === pts.length - 2) {
        const frame = computeWallFrame(a, b);
        const localU = Math.max(0, Math.min(remaining, segLength));
        return { segmentIndex: i, localU, frame };
      }
      remaining -= segLength;
    }

    throw new Error("PolyWall.getFrameForOffset: unreachable offset resolution.");
  }

  private applyHostPlacement(element: Door | Window | Opening, placement?: PolyWallHostPlacement): WallFrame {
    const offset = placement?.offset ?? 0;
    const baseHeight = placement?.baseHeight ?? 0;
    const resolution = this.getFrameForOffset(offset);

    if (element instanceof Door) {
      element.station = { u: resolution.localU, h: baseHeight };
    } else if (element instanceof Window) {
      element.station = { u: resolution.localU };
    }

    element.bindHostFrame(resolution.frame);
    return resolution.frame;
  }

  attachDoor(doorElement: Door, placement?: PolyWallHostPlacement) {
    doorElement.hostWallId = this.ogid;
    this.applyHostPlacement(doorElement, placement);

    const openingFromDoor = doorElement.opening as Opening;
    if (!openingFromDoor) {
      console.error("Door element does not have a valid opening configuration.");
      return;
    }

    openingFromDoor.profileView = false;
    openingFromDoor.modelView = false;

    this.openings.push(openingFromDoor);
    const openingConfig = openingFromDoor.getOPConfig();
    this.propertySet.openings.push(openingConfig.ogid!);
    this.resolveOpenings();

    openingFromDoor.onOpeningUpdated.add(() => {
      this.resolveOpenings();
    });
  }

  attachWindow(windowElement: Window, placement?: PolyWallHostPlacement) {
    windowElement.hostWallId = this.ogid;
    this.applyHostPlacement(windowElement, placement);

    const openingFromWindow = windowElement.opening as Opening;
    if (!openingFromWindow) {
      console.error("Window element does not have a valid opening configuration.");
      return;
    }

    openingFromWindow.profileView = false;
    openingFromWindow.modelView = false;

    this.openings.push(openingFromWindow);
    const openingConfig = openingFromWindow.getOPConfig();
    this.propertySet.openings.push(openingConfig.ogid!);
    this.resolveOpenings();

    openingFromWindow.onOpeningUpdated.add(() => {
      this.resolveOpenings();
    });
  }

  attachOpening(openingElement: Opening, placement?: PolyWallHostPlacement) {
    this.applyHostPlacement(openingElement, placement);

    openingElement.profileView = false;
    openingElement.modelView = false;

    this.openings.push(openingElement);
    const openingConfig = openingElement.getOPConfig();
    this.propertySet.openings.push(openingConfig.ogid!);
    this.resolveOpenings();

    openingElement.onOpeningUpdated.add(() => {
      this.resolveOpenings();
    });
  }

  detachOpening(ogid: string) {
    const index = this.openings.findIndex((opening) => opening.ogid === ogid);
    if (index === -1) {
      return;
    }

    this.openings.splice(index, 1);
    this.propertySet.openings = this.propertySet.openings.filter((openingId) => openingId !== ogid);
    this.resolveOpenings();
  }

  getHostedOpenings() {
    return this.openings;
  }

  resolveOpenings() {
    const wall2D = this.subElements2D.get(this.ogid + "-2d-base") as Polygon | undefined;
    const wall3D = this.subElements3D.get(this.ogid + "-3d-base") as Solid | undefined;

    this.clearResolvedElement(this.subElements2D, this.ogid + "-2d-resolved");
    this.clearResolvedElement(this.subElements3D, this.ogid + "-3d-resolved");

    const all2DOpenings = this.openings
      .map((opening) => opening.opening2D)
      .filter((opening): opening is Polygon => Boolean(opening));
    const all3DOpenings = this.openings
      .map((opening) => opening.opening3D)
      .filter((opening): opening is Solid => Boolean(opening));

    if (wall2D && all2DOpenings.length > 0) {
      const result2D = wall2D.subtract(all2DOpenings, {
        color: this.propertySet.color,
        outline: this._outlineEnabled,
      }) as BooleanResult;

      this.subElements2D.set(this.ogid + "-2d-resolved", result2D);
      this.add(result2D);
    }

    if (wall3D && all3DOpenings.length > 0) {
      const result3D = wall3D.subtract(all3DOpenings, {
        color: this.propertySet.color,
        outline: this._outlineEnabled,
      }) as BooleanResult;

      this.subElements3D.set(this.ogid + "-3d-resolved", result3D);
      this.add(result3D);
    }

    all2DOpenings.forEach((opening2D) => {
      opening2D.visible = false;
    });
    all3DOpenings.forEach((opening3D) => {
      opening3D.visible = false;
    });

    this.applyRenderStyles();
    this.syncViewVisibility();
  }

  dispose() {
    for (const obj of this.subElements2D.values()) {
      disposeObject(obj);
    }

    for (const obj of this.subElements3D.values()) {
      disposeObject(obj);
    }

    this.subElements2D.clear();
    this.subElements3D.clear();
    this.discardGeometry();
  }

  setOPGeometry(prevalidatedGeometry?: GeometryState): void {
    const geometryState = prevalidatedGeometry ?? this.resolveGeometryState(this.propertySet.points, this.propertySet.thickness);
    if (!geometryState) {
      return;
    }

    this.dispose();

    this.setConfig({
      points: geometryState.points.map((point) => new Vector3(point[0], point[1], point[2])),
      color: this.propertySet.color,
    });

    if (this.isLineWall) {
      return;
    }

    const polygon = new Polygon({
      ogid: this.ogid + "-2d-base",
      vertices: geometryState.footprint.map((point) => cloneVector(point)),
      color: this.propertySet.color,
    });
    this.subElements2D.set(polygon.ogid, polygon);
    this.add(polygon);

    const extrudedShape = polygon.extrude(this.propertySet.height);
    extrudedShape.ogid = this.ogid + "-3d-base";
    extrudedShape.color = this.propertySet.color;
    this.subElements3D.set(extrudedShape.ogid, extrudedShape);
    this.add(extrudedShape);

    this.resolveOpenings();
    this.applyRenderStyles();
    this.syncViewVisibility();
  }

  setOPMaterial(): void {
    this.color = this.propertySet.color;
    this.applyRenderStyles();
  }

  private resolveGeometryState(points: WallPoint[], thickness: number): GeometryState | null {
    const result = prepareGeometryState(points, thickness);
    if ("error" in result) {
      console.error(result.error);
      return null;
    }

    return result.state;
  }

  private clearResolvedElement(store: Map<string, THREE.Object3D>, key: string): void {
    const existing = store.get(key);
    if (!existing) {
      return;
    }

    disposeObject(existing);
    store.delete(key);
  }

  private syncViewVisibility(): void {
    const resolved2DKey = this.ogid + "-2d-resolved";
    const resolved3DKey = this.ogid + "-3d-resolved";
    const hasResolved2D = this.subElements2D.has(resolved2DKey);
    const hasResolved3D = this.subElements3D.has(resolved3DKey);

    for (const [key, obj] of this.subElements2D.entries()) {
      obj.visible = this.isProfileView && (!hasResolved2D || key === resolved2DKey);
    }

    for (const [key, obj] of this.subElements3D.entries()) {
      obj.visible = this.isModelView && (!hasResolved3D || key === resolved3DKey);
    }
  }

  private applyRenderStyles(): void {
    for (const obj of this.subElements2D.values()) {
      this.apply2DRenderStyle(obj);
    }

    for (const obj of this.subElements3D.values()) {
      this.apply3DRenderStyle(obj);
    }
  }

  private apply2DRenderStyle(obj: THREE.Object3D): void {
    if ("outline" in obj) {
      (obj as Polygon | BooleanResult).outline = this._outlineEnabled;
    }

    obj.renderOrder = PLAN_RENDER_ORDER;
    this.applyObjectColor(obj, this.propertySet.color);
    this.forEachMaterial(obj, (material) => {
      material.depthWrite = false;
      material.depthTest = false;
      material.transparent = true;
      material.opacity = 1;
      if ("side" in material) {
        material.side = THREE.DoubleSide;
      }
      material.needsUpdate = true;
    });
  }

  private apply3DRenderStyle(obj: THREE.Object3D): void {
    if ("outline" in obj) {
      (obj as Solid | BooleanResult).outline = this._outlineEnabled;
    }

    obj.renderOrder = 0;
    this.applyObjectColor(obj, this.propertySet.color);
    this.forEachMaterial(obj, (material) => {
      material.depthWrite = true;
      material.depthTest = true;
      material.transparent = true;
      material.opacity = 0.6;
      if ("side" in material) {
        material.side = THREE.FrontSide;
      }
      material.needsUpdate = true;
    });
  }

  private applyObjectColor(obj: THREE.Object3D, color: number): void {
    if ("color" in obj && typeof (obj as { color?: unknown }).color === "number") {
      (obj as Polygon | Solid).color = color;
    }

    this.forEachMaterial(obj, (material) => {
      if ("color" in material && material.color) {
        material.color.set(color);
      }
    });
  }

  private forEachMaterial(
    obj: THREE.Object3D,
    callback: (material: THREE.Material & { color?: THREE.Color; opacity: number; transparent: boolean; depthWrite: boolean; depthTest: boolean; side?: THREE.Side; needsUpdate: boolean }) => void,
  ): void {
    if (!(obj instanceof THREE.Mesh)) {
      return;
    }

    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
    materials.forEach((material) => {
      callback(
        material as THREE.Material & {
          color?: THREE.Color;
          opacity: number;
          transparent: boolean;
          depthWrite: boolean;
          depthTest: boolean;
          side?: THREE.Side;
          needsUpdate: boolean;
        },
      );
    });
  }
}
