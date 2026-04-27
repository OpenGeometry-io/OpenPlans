import * as THREE from "three";
import { Polygon, Solid, Vector3 } from "opengeometry";

import { IShape } from "../../shapes/base-type";
import { ElementType } from "../base-type";
import { OPElement } from "../op-element";
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

export class Opening extends OPElement implements IShape {
  ogType = ElementType.OPENING;
  ogid: string;
  
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
    for (const [key, obj] of this.subElements3D.entries()) {
      if (key === 'hole-base-3d') {
        // 3D extrusion seed; never rendered.
        obj.visible = false;
      } else {
        obj.visible = value;
      }
    }
  }

  get opening2D(): Polygon {
    return this.subElements2D.get(this.ogid + '-2d') as Polygon;
  }

  get opening3D(): Solid {
    return this.subElements3D.get(this.ogid + '-3d') as Solid;
  }

  constructor(openingConfig?: Partial<OpeningOptions>) {
    super();
    this.ogid = openingConfig?.ogid ?? crypto.randomUUID();

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
   * are interpreted as wall-local (alongWall, acrossWall, elevation) and
   * transformed to world on demand. Pass `null` to unhost the opening — its
   * geometry then renders in identity coordinates (alongWall→x, elevation→y,
   * acrossWall→z).
   */
  bindHostFrame(frame: WallFrame | null): void {
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
  }

  setOPGeometry(): void {
    this.dispose();

    const worldPoints = this.toWorldPoints();
    if (worldPoints.length < 2) {
      return;
    }

    const start = worldPoints[0];
    const end   = worldPoints[1];
    const dir   = new THREE.Vector3(end.x - start.x, end.y - start.y, end.z - start.z).normalize();
    const perp  = new THREE.Vector3(0, 1, 0).cross(dir);
    const t2    = this.propertySet.thickness / 2;

    // Four polygon vertices — winding matches the old getOffset result:
    // [off1.start, off1.end, off2.end, off2.start]
    const elevatedFootprint: Vector3[] = [
      new Vector3(start.x + perp.x * t2, start.y + perp.y * t2, start.z + perp.z * t2),
      new Vector3(end.x   + perp.x * t2, end.y   + perp.y * t2, end.z   + perp.z * t2),
      new Vector3(end.x   - perp.x * t2, end.y   - perp.y * t2, end.z   - perp.z * t2),
      new Vector3(start.x - perp.x * t2, start.y - perp.y * t2, start.z - perp.z * t2),
    ];

    // ── 2D polygon at floor level (Y=0) ──────────────────────────────────────
    // Coplanar with the wall's floor polygon so boolean subtraction works
    // even when the opening's points carry a non-zero elevation.
    const footprint2D: Vector3[] = elevatedFootprint.map(
      (p) => new Vector3(p.x, 0, p.z),
    );
    const polygon2D = new Polygon({
      ogid: this.ogid + '-2d',
      vertices: footprint2D,
      color: 0xffcccc,
    });
    this.subElements2D.set(polygon2D.ogid, polygon2D);
    polygon2D.outline = true;
    polygon2D.outlineColor = 0x4466ff;
    this.add(polygon2D);

    // ── 3D extrusion seed at the line's actual elevation ────────────────────
    // Extruded vertically by `height` so the resulting solid spans
    // [lineElevation, lineElevation + height] for boolean subtraction from
    // the wall's volume.
    const polygon3DBase = new Polygon({
      vertices: elevatedFootprint,
      color: 0xffcccc,
    });
    polygon3DBase.outline = false;
    polygon3DBase.visible = false;     // never rendered; just an extrusion seed.
    this.subElements3D.set('hole-base-3d', polygon3DBase);
    this.add(polygon3DBase);

    const extrudedShape = polygon3DBase.extrude(this.propertySet.height);
    extrudedShape.ogid = this.ogid + '-3d';
    this.subElements3D.set(extrudedShape.ogid, extrudedShape);
    this.add(extrudedShape);

    this.onOpeningUpdated.trigger(null);
  }

  setOPMaterial(): void {
    
  }
}
