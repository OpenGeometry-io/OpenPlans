import * as THREE from "three";
import { Polygon, Polyline, Solid, Vector3 } from "opengeometry";

import { IShape } from "../../shapes/base-type";
import { ElementType } from "../base-type";
import { Door, Window } from "../openings";
import { Opening } from "../openings/opening";
import { WallMaterial, WallOptions } from "./wall-types";

type WallPoint = [number, number, number];

function clonePoint(point: WallPoint): WallPoint {
  return [point[0], point[1], point[2]];
}

function clonePoints(points: WallPoint[]): WallPoint[] {
  return points.map((point) => clonePoint(point));
}

function pointsMatch(a: WallPoint, b: WallPoint): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

function isFinitePoint(point: WallPoint): boolean {
  return Number.isFinite(point[0]) && Number.isFinite(point[1]) && Number.isFinite(point[2]);
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
    points: [
      [0, 0, 0],
      [1.5, 0, 0],
      [2.5, 0, 1.5],
    ],
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
    for (const obj of this.subElements2D.values()) {
      if ("outline" in obj) {
        (obj as Polygon).outline = value;
      }
    }
    for (const obj of this.subElements3D.values()) {
      if ("outline" in obj) {
        (obj as Solid).outline = value;
      }
    }
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
    this.propertySet.thickness = Math.max(0.1, value);
    this.setOPGeometry();
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

    if (this.subElements2D.has(this.ogid + "-2d-resolved")) {
      const resolved2D = this.subElements2D.get(this.ogid + "-2d-resolved");
      if (resolved2D) {
        resolved2D.visible = value;
      }
      return;
    }

    for (const obj of this.subElements2D.values()) {
      obj.visible = value;
    }
  }

  get modelView() {
    return this.isModelView;
  }

  set modelView(value: boolean) {
    this.isModelView = value;

    if (this.subElements3D.has(this.ogid + "-3d-resolved")) {
      const resolved3D = this.subElements3D.get(this.ogid + "-3d-resolved");
      if (resolved3D) {
        resolved3D.visible = value;
      }
      return;
    }

    for (const obj of this.subElements3D.values()) {
      obj.visible = value;
    }
  }

  constructor(wallConfig?: Partial<WallOptions>) {
    super({
      ogid: wallConfig?.ogid,
      points: clonePoints(
        wallConfig?.points ?? [
          [0, 0, 0],
          [1.5, 0, 0],
          [2.5, 0, 1.5],
        ],
      ).map((point) => new Vector3(point[0], point[1], point[2])),
      color: wallConfig?.color ?? 0xcccccc,
    });

    this.subElements2D = new Map<string, THREE.Object3D>();
    this.subElements3D = new Map<string, THREE.Object3D>();

    if (wallConfig) {
      this.propertySet = {
        ...this.propertySet,
        ...wallConfig,
        points: clonePoints(wallConfig.points ?? this.propertySet.points),
        openings: [...(wallConfig.openings ?? this.propertySet.openings)],
      };
    }

    if (!this.validatePoints(this.propertySet.points)) {
      this.propertySet.points = [
        [0, 0, 0],
        [1.5, 0, 0],
        [2.5, 0, 1.5],
      ];
    }

    this.propertySet.ogid = this.ogid;
    this.setOPGeometry();
  }

  setOPConfig(config: WallOptions): void {
    const nextPoints = clonePoints(config.points ?? this.propertySet.points);
    if (!this.validatePoints(nextPoints)) {
      return;
    }

    this.propertySet = {
      ...this.propertySet,
      ...config,
      points: nextPoints,
      openings: [...(config.openings ?? this.propertySet.openings)],
    };

    this.setOPGeometry();
    this.setOPMaterial();
  }

  getOPConfig(): WallOptions {
    return this.propertySet;
  }

  setPoints(points: WallPoint[]): boolean {
    if (!this.validatePoints(points)) {
      return false;
    }

    this.propertySet.points = clonePoints(points);
    this.setOPGeometry();
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

  attachDoor(doorElement: Door) {
    const openingFromDoor = doorElement.opening as Opening;
    if (!openingFromDoor) {
      console.error("Door element does not have a valid opening configuration.");
      return;
    }

    this.openings.push(openingFromDoor);
    const openingConfig = openingFromDoor.getOPConfig();
    this.propertySet.openings.push(openingConfig.ogid!);
    this.resolveOpenings();

    openingFromDoor.onOpeningUpdated.add(() => {
      this.setOPGeometry();
    });
  }

  attachWindow(_windowElement: Window) {
    // Match current SingleWall behavior. Window hosting can be wired later.
  }

  attachOpening(openingElement: Opening) {
    this.openings.push(openingElement);
    const openingConfig = openingElement.getOPConfig();
    this.propertySet.openings.push(openingConfig.ogid!);
    this.resolveOpenings();

    openingElement.onOpeningUpdated.add(() => {
      this.setOPGeometry();
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
    if (!wall2D) {
      return;
    }

    const resolved2DKey = this.ogid + "-2d-resolved";
    const existingResolved2D = this.subElements2D.get(resolved2DKey);
    if (existingResolved2D) {
      existingResolved2D.removeFromParent();
      this.subElements2D.delete(resolved2DKey);
    }

    const all2DOpenings = this.openings
      .map((opening) => opening.opening2D)
      .filter((opening): opening is Polygon => Boolean(opening));

    if (all2DOpenings.length === 0) {
      wall2D.visible = this.isProfileView;
    } else {
      const result2D = wall2D.subtract(all2DOpenings) as THREE.Object3D;
      wall2D.visible = false;
      all2DOpenings.forEach((opening2D) => {
        opening2D.visible = false;
      });
      this.subElements2D.set(resolved2DKey, result2D);
      this.add(result2D);
    }

    const wall3D = this.subElements3D.get(this.ogid + "-3d-base") as Solid | undefined;
    if (!wall3D) {
      return;
    }

    const resolved3DKey = this.ogid + "-3d-resolved";
    const existingResolved3D = this.subElements3D.get(resolved3DKey);
    if (existingResolved3D) {
      existingResolved3D.removeFromParent();
      this.subElements3D.delete(resolved3DKey);
    }

    const all3DOpenings = this.openings
      .map((opening) => opening.opening3D)
      .filter((opening): opening is Solid => Boolean(opening));

    if (all3DOpenings.length === 0) {
      wall3D.visible = this.isModelView;
      return;
    }

    const result3D = wall3D.subtract(all3DOpenings) as THREE.Object3D;
    wall3D.visible = false;
    all3DOpenings.forEach((opening3D) => {
      opening3D.visible = false;
    });
    this.subElements3D.set(resolved3DKey, result3D);
    this.add(result3D);
  }

  dispose() {
    for (const obj of this.subElements2D.values()) {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((material) => material.dispose());
      } else if (mesh.material) {
        mesh.material.dispose();
      }
      mesh.removeFromParent();
    }

    for (const obj of this.subElements3D.values()) {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((material) => material.dispose());
      } else if (mesh.material) {
        mesh.material.dispose();
      }
      mesh.removeFromParent();
    }

    this.subElements2D.clear();
    this.subElements3D.clear();
    this.discardGeometry();
  }

  setOPGeometry(): void {
    this.dispose();

    this.setConfig({
      points: this.propertySet.points.map((point) => new Vector3(point[0], point[1], point[2])),
      color: this.propertySet.color,
    });

    if (this.isLineWall) {
      return;
    }

    const offset1 = this.getOffset(this.propertySet.thickness / 2);
    const offset2 = this.getOffset(-this.propertySet.thickness / 2);

    const footprint = this.sanitizeFootprintVertices([
      ...offset1.points.map((point) => point.clone()),
      ...offset2.points.slice().reverse().map((point) => point.clone()),
    ]);

    if (footprint.length < 3) {
      console.error("Invalid polyline wall geometry: Offset footprint must contain at least three unique vertices.");
      return;
    }

    const polygon = new Polygon({
      ogid: this.ogid + "-2d-base",
      vertices: footprint,
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

    this.outline = this._outlineEnabled;
    this.profileView = this.isProfileView;
    this.modelView = this.isModelView;
    this.setOPMaterial();
  }

  setOPMaterial(): void {
    this.color = this.propertySet.color;

    for (const obj of this.subElements2D.values()) {
      if ("color" in obj) {
        (obj as Polygon).color = this.propertySet.color;
      }
    }

    for (const obj of this.subElements3D.values()) {
      if ("color" in obj) {
        (obj as Solid).color = this.propertySet.color;
      }
    }
  }

  private validatePoints(points: WallPoint[]): boolean {
    if (points.length < 2) {
      console.error("Invalid polyline wall geometry: A polyline wall requires at least two points.");
      return false;
    }

    for (let index = 0; index < points.length; index += 1) {
      const point = points[index];
      if (!isFinitePoint(point)) {
        console.error(`Invalid polyline wall geometry: Point ${index} must contain finite numbers.`);
        return false;
      }

      if (index === 0) {
        continue;
      }

      if (!this.distanceChecker(points[index - 1], point)) {
        console.error(
          `Invalid polyline wall geometry: Consecutive points at index ${index - 1} and ${index} cannot define a zero-length segment.`,
        );
        return false;
      }
    }

    if (pointsMatch(points[0], points[points.length - 1])) {
      console.error("Invalid polyline wall geometry: First and last points cannot be the same.");
      return false;
    }

    return true;
  }

  private distanceChecker(start: WallPoint, end: WallPoint): boolean {
    const startVec = new Vector3(start[0], start[1], start[2]);
    const endVec = new Vector3(end[0], end[1], end[2]);
    return startVec.subtract(endVec).length() > 0;
  }

  private sanitizeFootprintVertices(points: Vector3[]): Vector3[] {
    const sanitized: Vector3[] = [];

    for (const point of points) {
      const lastPoint = sanitized[sanitized.length - 1];
      if (!lastPoint || !this.vectorMatches(lastPoint, point)) {
        sanitized.push(point);
      }
    }

    if (sanitized.length > 1 && this.vectorMatches(sanitized[0], sanitized[sanitized.length - 1])) {
      sanitized.pop();
    }

    return sanitized;
  }

  private vectorMatches(a: Vector3, b: Vector3): boolean {
    return a.x === b.x && a.y === b.y && a.z === b.z;
  }
}
