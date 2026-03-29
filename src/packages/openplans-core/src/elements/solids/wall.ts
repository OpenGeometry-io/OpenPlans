import * as THREE from "three";
import { IShape } from "../../shapes/base-type";
import { ElementType } from "./../base-type";
import { ExtrudedShape, Polygon, Polyline, Vector3 } from "opengeometry";
import type { Placement, PlanExportView, PlanVectorExportable } from "../../types";

export interface Point {
  x: number;
  y: number;
  z: number;
}

export enum WallMaterial {
  CONCRETE = 'CONCRETE',
  BRICK = 'BRICK',
  WOOD = 'WOOD',
  GLASS = 'GLASS',
  OTHER = 'OTHER',
}

export interface WallOptions {
  ogid?: string;
  labelName: string;
  type: ElementType.WALL;
  points: Array<Point>;
  wallColor: number;
  wallThickness: number;
  wallHeight: number;
  wallMaterial: WallMaterial;
  placement: Placement
}

export class Wall extends Polyline implements IShape, PlanVectorExportable {
  ogType: string = ElementType.WALL;

  // TODO remove this later from IShape
  subElements: Map<string, THREE.Object3D<THREE.Object3DEventMap>> = new Map();

  private subElements2D: Map<string, THREE.Object3D> = new Map();
  private subElements3D: Map<string, THREE.Object3D> = new Map();

  private isProfileView = true;
  private isModelView = true;
  
  selected: boolean = false;
  edit: boolean = false;
  locked: boolean = false;

  propertySet: WallOptions = {
    labelName: "Wall",
    type: ElementType.WALL,
    points: [],
    wallColor: 0xcccccc,
    wallThickness: 0.2,
    wallHeight: 3.0,
    wallMaterial: WallMaterial.CONCRETE,
    placement: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1]
    }
  };

  get labelName() { return this.propertySet.labelName; }
  set labelName(value: string) { this.propertySet.labelName = value; }

  get wallThickness() { return this.propertySet.wallThickness; }
  set wallThickness(value: number) {
    this.propertySet.wallThickness = value;
    this.setOPGeometry();
  }

  get wallHeight() { return this.propertySet.wallHeight; }
  set wallHeight(value: number) { 
    this.propertySet.wallHeight = value; 
    this.setOPGeometry();
  }

  set profileView(value: boolean) {
    this.isProfileView = value;
    for (const subElement of this.subElements2D.values()) {
      subElement.visible = value;
    }
  }

  get profileView() {
    return this.isProfileView;
  }

  set modelView(value: boolean) {
    this.isModelView = value;
    for (const subElement of this.subElements3D.values()) {
      subElement.visible = value;
    }
  }

  get modelView() {
    return this.isModelView;
  }

  getExportRoots(view: PlanExportView): THREE.Object3D[] {
    const key = view === "top" ? "wallPolygon" : "wallExtrude";
    const root = (view === "top" ? this.subElements2D : this.subElements3D).get(key);
    return root ? [root] : [];
  }

  set elementOutline(value: boolean) {
    for (const subElement of this.subElements2D.values()) {
      if (subElement instanceof Polygon) {
        subElement.outline = value;
      }
    }
    for (const subElement of this.subElements3D.values()) {
      if (subElement instanceof ExtrudedShape) {
        subElement.outline = value;
      }
    }
  }

  constructor(wallConfig?: WallOptions) {
    const initialVectorPoints = wallConfig?.points
      ? wallConfig.points.map((p: any) => new Vector3(p.x, p.y, p.z))
      : [];

    super({
      ogid: wallConfig?.ogid,
      points: initialVectorPoints,
      color: wallConfig?.wallColor !== undefined ? wallConfig.wallColor : 0x0000ff
    });

    if (wallConfig) {
      this.propertySet = { ...this.propertySet, ...wallConfig };
    }

    this.propertySet.ogid = this.ogid;
    this.setOPGeometry();
  }

  setOPConfig(config: WallOptions): void {
    this.discardGeometry();
    this.propertySet = { ...this.propertySet, ...config };
    this.setOPGeometry();
  }

  getOPConfig(): WallOptions { 
    return this.propertySet; 
  }

  addPoint(point: Point): void {
    const vectorPoint = new Vector3(point.x, point.y, point.z);
    super.addPoint(vectorPoint);
    this.propertySet.points.push(point);
    this.setOPGeometry();
  }

  updatePoints(points: Array<Point>): void {
    this.propertySet.points = points;
    this.setConfig({
      points: points.map(p => new Vector3(p.x, p.y, p.z)),
      color: this.color
    });
    this.setOPGeometry();
  }

  setOPGeometry(): void {
    this.setConfig({
      points: this.propertySet.points.map(p => new Vector3(p.x, p.y, p.z)),
      color: this.propertySet.wallColor
    });
    this.renderOrder = 1; // Ensure walls render above other elements

    this.create2D();
    this.create3D();

    // keep outline always enabled
    this.elementOutline = true;
  }

  private create3D(): void {
    const points = this.propertySet.points;
    if (!points || points.length < 2) {
      return;
    }

    // Extrude the 2D wall polygon to create a 3D wall
    const polygon = this.subElements2D.get("wallPolygon") as Polygon;
    if (!polygon) {
      return;
    }

    if (this.subElements3D.has("wallExtrude")) {
      const existingExtrude = this.subElements3D.get("wallExtrude") as ExtrudedShape;
      existingExtrude.removeFromParent();
      this.subElements3D.delete("wallExtrude");
    }

    const polygonExtrude = polygon.extrude(-this.propertySet.wallHeight);
    polygonExtrude.color = this.propertySet.wallColor;
    this.subElements3D.set("wallExtrude", polygonExtrude);
    this.add(polygonExtrude);
  }

  private create2D(): void {
    const points = this.propertySet.points;
    if (!points || points.length < 2) {
      return;
    }

    const vectorPoints = points.map(p => new Vector3(p.x, p.y, p.z));
    const polygonVertices = this.computeOffsetPolygonVertices(vectorPoints, this.propertySet.wallThickness);

    if (this.subElements2D.has("wallPolygon")) {
      const wallPolygon = this.subElements2D.get("wallPolygon") as Polygon;
      wallPolygon.removeFromParent();
      wallPolygon.dispose();
      this.subElements2D.delete("wallPolygon");
    }

    const wallPolygon = new Polygon({
      vertices: polygonVertices,
      color: this.propertySet.wallColor
    });

    this.subElements2D.set("wallPolygon", wallPolygon);
    this.add(wallPolygon);
  }

  private computeOffsetPolygonVertices(points: Vector3[], thickness: number): Vector3[] {
    const halfThickness = thickness / 2;
    const n = points.length;
    const leftOffset: Vector3[] = [];
    const rightOffset: Vector3[] = [];

    const threePoints = points.map(p => new THREE.Vector3(p.x, p.y, p.z));

    for (let i = 0; i < n; i++) {
      const current = threePoints[i];
      const prev = (i > 0) ? threePoints[i - 1] : current;
      const next = (i < n - 1) ? threePoints[i + 1] : current;

      let dirPrev = new THREE.Vector3().subVectors(current, prev).normalize();
      let dirNext = new THREE.Vector3().subVectors(next, current).normalize();

      if (i === 0) dirPrev = dirNext.clone();
      if (i === n - 1) dirNext = dirPrev.clone();

      // Normal in XZ plane: (-dz, 0, dx)
      const normalPrev = new THREE.Vector3(-dirPrev.z, 0, dirPrev.x).normalize();
      const normalNext = new THREE.Vector3(-dirNext.z, 0, dirNext.x).normalize();

      // Average normal for miter joint
      const avgNormal = new THREE.Vector3().addVectors(normalPrev, normalNext).normalize();

      let miterFactor = 1;
      const dot = normalPrev.dot(normalNext);
      if (dot > -0.99) {
        miterFactor = 1 / Math.sqrt((1 + dot) / 2);
        if (miterFactor > 4) miterFactor = 4; // limit spike
      }

      const offsetVec = avgNormal.multiplyScalar(halfThickness * miterFactor);

      const left = new THREE.Vector3().addVectors(current, offsetVec);
      const right = new THREE.Vector3().subVectors(current, offsetVec);

      leftOffset.push(new Vector3(left.x, left.y, left.z));
      rightOffset.push(new Vector3(right.x, right.y, right.z));
    }

    const polygonVertices = [...leftOffset];
    for (let i = n - 1; i >= 0; i--) {
      polygonVertices.push(rightOffset[i]);
    }
    return polygonVertices;
  }

  setOPMaterial(): void { }
}
