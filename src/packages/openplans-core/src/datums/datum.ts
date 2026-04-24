import * as THREE from "three";
import { Line, Vector3 } from "opengeometry";

import { IShape } from "../shapes/base-type";
import { ElementType } from "../elements/base-type";
import { Event } from "../../../../utils/event";
import {
  DatumOptionsBase,
  DatumType,
  DatumVisibility,
  DEFAULT_DATUM_VISIBILITY,
  DEFAULT_PLACEMENT,
  DATUM_COLORS,
} from "./base-type";

/**
 * Abstract base for every datum. Mirrors the element pattern used by
 * `Opening` (see src/packages/openplans-core/src/elements/openings/opening.ts):
 *
 *   - extends `Line` from opengeometry so it participates in the scene
 *     graph the same way elements do,
 *   - implements {@link IShape} so editors / selectors can treat it
 *     uniformly,
 *   - keeps all state in `propertySet` for round-trip serialization,
 *   - carries parallel `subElements2D` / `subElements3D` maps so a
 *     datum can render differently in plan and model views.
 *
 * Subclasses override {@link setOPGeometry} to build their specific
 * lines / bubbles / symbols and {@link setOPMaterial} for colour
 * updates.
 */
export abstract class Datum extends Line implements IShape {
  ogType: string = ElementType.DATUM;

  subElements2D: Map<string, THREE.Object3D> = new Map();
  subElements3D: Map<string, THREE.Object3D> = new Map();

  selected = false;
  edit = false;
  locked = false;

  onDatumUpdated: Event<null> = new Event();

  protected _profileView = true;
  protected _modelView = true;

  propertySet: DatumOptionsBase = {
    labelName: "Datum",
    type: ElementType.DATUM,
    datumType: DatumType.REFERENCE_PLANE,
    placement: { ...DEFAULT_PLACEMENT },
    color: DATUM_COLORS.NEUTRAL,
    lineWidth: 1,
    visibility: { ...DEFAULT_DATUM_VISIBILITY },
  };

  constructor(datumConfig?: Partial<DatumOptionsBase>) {
    super({
      start: new Vector3(0, 0, 0),
      end: new Vector3(1, 0, 0),
      color: DATUM_COLORS.NEUTRAL,
    });

    if (datumConfig) {
      this.propertySet = {
        ...this.propertySet,
        ...datumConfig,
        visibility: {
          ...this.propertySet.visibility,
          ...(datumConfig.visibility ?? {}),
        },
      };
    }

    this.propertySet.ogid = this.ogid;
  }

  get labelName(): string {
    return this.propertySet.labelName;
  }
  set labelName(value: string) {
    this.propertySet.labelName = value;
    this.setOPGeometry();
  }

  get datumType(): DatumType {
    return this.propertySet.datumType;
  }

  get profileView(): boolean {
    return this._profileView;
  }
  set profileView(value: boolean) {
    this._profileView = value;
    for (const obj of this.subElements2D.values()) {
      obj.visible = value;
    }
  }

  get modelView(): boolean {
    return this._modelView;
  }
  set modelView(value: boolean) {
    this._modelView = value;
    for (const obj of this.subElements3D.values()) {
      obj.visible = value;
    }
  }

  /**
   * Merge a new partial configuration, then rebuild geometry and
   * materials. Matches Opening.setOPConfig lifecycle.
   */
  setOPConfig(config: Partial<DatumOptionsBase>): void {
    this.dispose();
    this.propertySet = {
      ...this.propertySet,
      ...config,
      visibility: {
        ...this.propertySet.visibility,
        ...(config.visibility ?? {}),
      },
    };
    this.setOPGeometry();
    this.setOPMaterial();
  }

  getOPConfig(): DatumOptionsBase {
    return this.propertySet;
  }

  /**
   * Remove every sub-element and release GPU resources. Called before
   * rebuilding geometry and by consumers when the datum is removed.
   */
  dispose(): void {
    for (const map of [this.subElements2D, this.subElements3D]) {
      for (const obj of map.values()) {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat) => mat.dispose());
        } else if (mesh.material) {
          (mesh.material as THREE.Material).dispose();
        }
        mesh.removeFromParent();
      }
      map.clear();
    }
  }

  abstract setOPGeometry(): void;

  setOPMaterial(): void {
    // Intentionally empty — matches the pattern in SingleWall, Opening
    // and Door. All property changes flow through setOPGeometry which
    // disposes and rebuilds. Calling setOPGeometry from here would
    // double every setOPConfig call.
  }

  /**
   * Draws a closed circle (or polyline arc if `endAngle < 2π`) as a
   * single `THREE.Line` — one geometry, one material, one draw call.
   * Replaces the naive "32 individual line segments" tessellation and
   * keeps datum rebuilds cheap.
   */
  protected buildCircleLine(
    center: { x: number; y: number; z: number },
    radius: number,
    color: number,
    segments: number = 48,
    startAngle: number = 0,
    endAngle: number = Math.PI * 2,
  ): THREE.Line {
    const points = new Float32Array((segments + 1) * 3);
    const span = endAngle - startAngle;
    for (let i = 0; i <= segments; i++) {
      const a = startAngle + (i / segments) * span;
      const base = i * 3;
      points[base] = center.x + Math.cos(a) * radius;
      points[base + 1] = center.y;
      points[base + 2] = center.z + Math.sin(a) * radius;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(points, 3));
    const material = new THREE.LineBasicMaterial({ color });
    return new THREE.Line(geometry, material);
  }

  /**
   * Packs a dashed straight edge into a single `THREE.LineSegments`
   * draw. `dashLength` and `gap` are in world units.
   */
  protected buildDashedSegments(
    start: { x: number; y: number; z: number },
    end: { x: number; y: number; z: number },
    color: number,
    dashLength: number,
    gap: number,
  ): THREE.LineSegments {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dz = end.z - start.z;
    const total = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({ color });
    if (total === 0) {
      geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(0), 3));
      return new THREE.LineSegments(geometry, material);
    }
    const ux = dx / total;
    const uy = dy / total;
    const uz = dz / total;
    const stride = dashLength + gap;
    const pairs: number[] = [];
    let dist = 0;
    while (dist < total) {
      const segLen = Math.min(dashLength, total - dist);
      pairs.push(
        start.x + ux * dist,
        start.y + uy * dist,
        start.z + uz * dist,
        start.x + ux * (dist + segLen),
        start.y + uy * (dist + segLen),
        start.z + uz * (dist + segLen),
      );
      dist += stride;
    }
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(pairs, 3));
    return new THREE.LineSegments(geometry, material);
  }

  protected applyVisibility(): void {
    const vis: Required<DatumVisibility> = {
      ...DEFAULT_DATUM_VISIBILITY,
      ...(this.propertySet.visibility ?? {}),
    };
    this._profileView = vis.plan;
    this._modelView = vis.model;
    for (const obj of this.subElements2D.values()) obj.visible = vis.plan;
    for (const obj of this.subElements3D.values()) obj.visible = vis.model;
  }
}
