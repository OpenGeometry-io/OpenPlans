import * as THREE from "three";
import { Line, Polygon, Solid, Vector3 } from "opengeometry";

import { IShape } from "../../shapes/base-type";
import { ElementType } from "../base-type";
import { Placement } from "../../types";
import { Event } from "../../../../../utils/event";
import { WallFrame, localToWorld } from "../solids/wall-frame";

export interface OpeningOptions {
  ogid?: string;
  labelName: string;
  type: ElementType.OPENING;
  hostWallId?: string;
  thickness: number;
  height: number;
  baseHeight: number;
  // Wall-local coordinates. +Y up; walls live in the XZ plane.
  //   points[i] = [u, v, h] where
  //     u — distance along the wall from its start,
  //     v — perpendicular offset in the XZ plane (normal to the wall),
  //     h — vertical offset above the wall's base.
  // When no host frame has been bound, points are interpreted as world
  // (x, y, z) — the unhosted/legacy path.
  length?: number; // Optional length property for convenience, can be derived from points if not provided

  points: [number, number, number][];
  placement: Placement;
}

export class Opening extends Line implements IShape {
  ogType = ElementType.OPENING;
  
  subElements2D: Map<string, THREE.Object3D> = new Map();
  private isProfileView: boolean = false;

  subElements3D: Map<string, THREE.Object3D> = new Map();
  private isModelView: boolean = false;

  selected = false;
  edit = false;
  locked = false;

  _outlineEnabled: boolean = false;
  onOpeningUpdated: Event<null> = new Event();

  /** Host wall's local coordinate frame. Null until bound via bindHostFrame. */
  protected hostFrame: WallFrame | null = null;

  // Semantic Properties
  propertySet: OpeningOptions = {
    labelName: "Standard Opening",
    type: ElementType.OPENING,
    thickness: 0.3,
    height: 1,
    baseHeight: 0,
    // Wall-local (u, v, h). Interpreted as world (x, y, z) until bindHostFrame is called.
    points: [
      [0, 0, 0],
      [1.5, 0, 0],
    ],
    // TODO: Fix placement, something is wrong.
    placement: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
  };

  get outline() { return this._outlineEnabled; }
  set outline(value: boolean) {
    this._outlineEnabled = value;
    for (const obj of this.subElements2D.values()) {
      // @ts-ignore
      obj.outline = value;
    }
    for (const obj of this.subElements3D.values()) {
      // @ts-ignore
      obj.outline = value;
    }
  }

  get labelName() { return this.propertySet.labelName; }
  set labelName(value: string) {
    this.propertySet.labelName = value;
  }

  get thickness() { return this.propertySet.thickness; }
  set thickness(value: number) {
    this.propertySet.thickness = Math.max(0.1, value);
    this.setOPGeometry();
  }

  get height() { return this.propertySet.height; }
  set height(value: number) {
    this.propertySet.height = Math.max(0.1, value);
    this.setOPGeometry();
  }

  get baseHeight() { return this.propertySet.baseHeight; }
  set baseHeight(value: number) {
    this.propertySet.baseHeight = Math.max(0, value);
    this.setOPGeometry();
  }
  
  get start() { return this.propertySet.points[0]; }
  set start(value: [number, number, number]) {
    this.propertySet.points[0] = value;
    this.setOPGeometry();
  }

  get end() { return this.propertySet.points[1]; }
  set end(value: [number, number, number]) {
    this.propertySet.points[1] = value;
    this.setOPGeometry();
  }

  get profileView() { return this.isProfileView; }
  set profileView(value: boolean) {
    this.isProfileView = value;
    for (const obj of this.subElements2D.values()) {
      obj.visible = value;
    }
  }

  get modelView() { return this.isModelView; }
  set modelView(value: boolean) {
    this.isModelView = value;
    for (const obj of this.subElements3D.values()) {
      obj.visible = value;
    }
  }

  get opening2D(): Polygon {
    return this.subElements2D.get(this.ogid + '-2d') as Polygon;
  }

  get opening3D(): Solid {
    return this.subElements3D.get(this.ogid + '-3d') as Solid;
  }

  constructor(openingConfig?: Partial<OpeningOptions>) {
    super({
      start: new Vector3(0, 0, 0),
      end: new Vector3(1.5, 0, 1.5),
      color: 0xffcccc,
    });

    this.subElements2D = new Map<string, THREE.Object3D>();
    this.subElements3D = new Map<string, THREE.Object3D>();
    
    if (openingConfig) {
      this.propertySet = {
        ...this.propertySet,
        ...openingConfig
      };
    }

    this.propertySet.ogid = this.ogid;
    this.setOPGeometry();
  }

  setOPConfig(config: OpeningOptions): void {
    this.dispose();

    this.propertySet = {
      ...this.propertySet,
      ...config,
    };

    this.setOPGeometry();
    this.setOPMaterial();
  }

  getOPConfig(): OpeningOptions {
    return this.propertySet;
  }

  /**
   * Bind this opening to its host wall's frame. After binding, propertySet.points
   * are interpreted as wall-local (u, v, h) and transformed to world on demand.
   */
  bindHostFrame(frame: WallFrame): void {
    this.hostFrame = frame;
    this.setOPGeometry();
  }

  /**
   * Convert stored points to world-space Vector3s.
   * If a host frame is bound: points are (u, v, h) local → world.
   * Otherwise: points are already world (x, y, z).
   */
  toWorldPoints(): Vector3[] {
    const frame = this.hostFrame;
    if (!frame) {
      return this.propertySet.points.map(
        ([x, y, z]) => new Vector3(x, y, z),
      );
    }
    return this.propertySet.points.map(
      ([u, v, h]) => localToWorld(frame, u, v, h),
    );
  }

  dispose() {
    for (const obj of this.subElements2D.values()) {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(mat => mat.dispose());
      } else if (mesh.material) {
        mesh.material.dispose();
      }

      mesh.removeFromParent();
    }
    for (const obj of this.subElements3D.values()) {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(mat => mat.dispose());
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

    const worldPoints = this.toWorldPoints();
    if (worldPoints.length < 2) {
      return;
    }

    this.setConfig({
      start: worldPoints[0],
      end: worldPoints[1],
    });

    const offset1 = this.getOffset(this.propertySet.thickness / 2);
    const offset2 = this.getOffset(-this.propertySet.thickness / 2);

    // Use loop later
    const points: Vector3[] = [
      // Start point with positive offset
      offset1.points[0].clone(),
      // End point with positive offset
      offset1.points[1].clone(),
      // End point with negative offset
      offset2.points[1].clone(),
      // Start point with negative offset
      offset2.points[0].clone(),
    ];

    // We will use these points to generate the 2D and 3D geometry for the wall, and keep them in sync with the line geometry.
    // 2D Polygon
    const polygon = new Polygon({
      ogid: this.ogid + '-2d',
      vertices: points,
      color: 0xffcccc,
    });
    this.subElements2D.set(polygon.ogid, polygon);
    // polygon.visible = false;
    polygon.outline = true;
    polygon.outlineColor = 0x4466ff;
    this.add(polygon);

    // 3D Extrusion
    const height = this.propertySet.height; // Default height if not set
    const extrudedShape = polygon.extrude(height);
    extrudedShape.ogid = this.ogid + '-3d';
    this.subElements3D.set(extrudedShape.ogid, extrudedShape);
    this.add(extrudedShape);

    this.onOpeningUpdated.trigger(null);
  }

  setOPMaterial(): void {
    
  }
}
