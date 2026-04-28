import * as THREE from "three";
import { Cuboid, Polygon, Vector3 } from "opengeometry";
import { OPElement } from "../op-element";
import { IShape } from "../../shapes/base-type";
import type { Placement } from "../../types";

export const DEFAULT_PLACEMENT: Placement = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
};

/**
 * Coerce an incoming color value to a number. Falls back to the previous value
 * when the input is not a finite number (e.g. string hex from GUI).
 */
export function toColorNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return fallback;
}

interface PlanPolygonOptions {
  key: string;
  color: number;
  vertices: Vector3[];
  /** Local XYZ offset applied to the polygon mesh (useful for layering / z-fighting). */
  position?: [number, number, number];
  /** Y-axis rotation in radians applied to the polygon mesh. */
  rotationY?: number;
}

interface ModelBoxOptions {
  key: string;
  color: number;
  width: number;
  height: number;
  depth: number;
  /** Center of the box in local space. Defaults to [0, 0, 0]. */
  center?: [number, number, number];
}

/**
 * Abstract base for all dual-view (plan + model) catalog elements.
 *
 * Subclasses declare `ogType` and `setOPGeometry` / `build2D` / `build3D`.
 * The constructor accepts typed defaults and an optional partial override,
 * merging them into `propertySet`. Subclasses must call `this.setOPGeometry()`
 * at the end of their constructor.
 *
 * Kernel contract:
 *   - 2D plan geometry: flat Polygon meshes added via `createPlanPolygon()`
 *   - 3D model geometry: Cuboid meshes added via `createModelBox()`
 *   - For complex geometry (sweeps, curved faces) the kernel's Sweep/Solid
 *     classes should be used directly and added to subElements3D manually.
 */
export abstract class DualViewPolylineElement<
  T extends { ogid?: string; labelName?: string; placement?: Placement },
> extends OPElement implements IShape {
  abstract ogType: string;
  ogid: string = crypto.randomUUID();

  subElements2D: Map<string, THREE.Object3D> = new Map();
  subElements3D: Map<string, THREE.Object3D> = new Map();

  selected = false;
  edit = false;
  locked = false;

  propertySet: T;

  topExportKeys: string[] = [];
  isometricExportKeys: string[] = [];

  private _profileView = true;
  private _modelView = true;
  private _outlineEnabled = false;

  constructor(defaults: T, overrides?: Partial<T>) {
    super();
    this.propertySet = { ...defaults, ...(overrides ?? {}) } as T;
    if (!(this.propertySet as Record<string, unknown>).ogid) {
      (this.propertySet as Record<string, unknown>).ogid = this.ogid;
    }
  }

  get profileView() { return this._profileView; }
  set profileView(value: boolean) {
    this._profileView = value;
    this.subElements2D.forEach(obj => { obj.visible = value; });
  }

  get modelView() { return this._modelView; }
  set modelView(value: boolean) {
    this._modelView = value;
    this.subElements3D.forEach(obj => { obj.visible = value; });
  }

  get outline() { return this._outlineEnabled; }
  set outline(value: boolean) {
    this._outlineEnabled = value;
    this.subElements2D.forEach(obj => {
      // @ts-ignore — outline is a runtime property on kernel geometry objects
      if (typeof obj.outline !== "undefined") obj.outline = value;
    });
  }

  /**
   * Store the element's bounding polyline (used for selection / export).
   * Does not create any visible geometry — that is `build2D()`'s job.
   */
  setConfig(options: { points: Vector3[]; color: number }): void {
    // Intentionally stored but not rendered; subclasses use build2D/build3D for visuals.
    void options;
  }

  /**
   * Dispose all sub-element geometry and rebuild via `build2D()` and `build3D()`.
   */
  rebuildViews(): void {
    this.subElements2D.forEach(obj => { obj.removeFromParent(); });
    this.subElements3D.forEach(obj => { obj.removeFromParent(); });
    this.subElements2D.clear();
    this.subElements3D.clear();
    this.topExportKeys = [];
    this.isometricExportKeys = [];

    this.build2D();
    this.build3D();

    this.profileView = this._profileView;
    this.modelView = this._modelView;
  }

  protected abstract build2D(): void;
  protected abstract build3D(): void;

  /**
   * Create a flat plan-view Polygon, register it in subElements2D, and add it to the scene graph.
   * Returns the Polygon so callers can set additional properties (e.g. `outline`).
   */
  protected createPlanPolygon(options: PlanPolygonOptions): Polygon {
    const polygon = new Polygon({
      vertices: options.vertices,
      color: options.color,
    });

    if (options.position) {
      const [x, y, z] = options.position;
      polygon.position.set(x, y, z);
    }
    if (options.rotationY !== undefined) {
      polygon.rotation.y = options.rotationY;
    }

    this.subElements2D.set(options.key, polygon);
    this.add(polygon);
    return polygon;
  }

  /**
   * Create a 3D box (Cuboid), register it in subElements3D, and add it to the scene graph.
   */
  protected createModelBox(options: ModelBoxOptions): Cuboid {
    const [cx, cy, cz] = options.center ?? [0, 0, 0];
    const cuboid = new Cuboid({
      center: new Vector3(cx, cy, cz),
      width: options.width,
      height: options.height,
      depth: options.depth,
      color: options.color,
    });

    this.subElements3D.set(options.key, cuboid);
    this.add(cuboid);
    return cuboid;
  }

  setOPConfig(config: Record<string, unknown>): void {
    Object.assign(this.propertySet as Record<string, unknown>, config);
  }

  getOPConfig(): Record<string, unknown> {
    return this.propertySet as Record<string, unknown>;
  }

  abstract setOPGeometry(): void;
  abstract setOPMaterial(): void;
}
