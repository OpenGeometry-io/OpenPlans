import * as THREE from "three";
import {
  OGSceneManager,
  Polygon,
  Vector3,
  createFreeformGeometry,
} from "opengeometry";

import type {
  PlanExportView,
  PlanProjectionCamera,
  PlanProjectionHlr,
  PlanVectorBounds,
  PlanVectorColor,
  PlanVectorExportable,
  PlanVectorLine,
  PlanVectorPayload,
} from "../types";

const DEFAULT_ISOMETRIC_CAMERA: PlanProjectionCamera = {
  position: { x: 10, y: 10, z: 10 },
  target: { x: 0, y: 0, z: 0 },
  up: { x: 0, y: 1, z: 0 },
  near: 0.1,
  projection_mode: "Orthographic",
};

const DEFAULT_ISOMETRIC_HLR: PlanProjectionHlr = {
  hide_hidden_edges: true,
};

type BrepLikeObject = THREE.Object3D & {
  canConvertToFreeform?: () => boolean;
  toFreeform?: (id?: string) => {
    getLocalBrepSerialized?: () => string;
    getBrepSerialized?: () => string;
  };
  getLocalBrepSerialized?: () => string;
  getLocalBrepData?: () => unknown;
  getBrepSerialized?: () => string;
  getBrepData?: () => unknown;
  getBrep?: () => unknown;
  options?: {
    color?: number;
    outlineWidth?: number;
    width?: number;
    lineWidth?: number;
  };
  color?: number;
  outlineWidth?: number;
  material?: THREE.Material | THREE.Material[];
  polygon?: {
    get_outline_geometry_buffer?: () => Float64Array;
  };
};

/**
 * Returns library-agnostic vector payloads that callers can feed into their own
 * PDF pipeline. For example, a react-pdf caller can map `payload.lines` into
 * `<Svg><Line /></Svg>` nodes and then use `BlobProvider` or `pdf(doc).toBlob()`.
 */
export class PlanPDFGenerator {
  private entityCounter = 0;

  generate({
    elements,
    view = "top",
    camera,
    hlr,
  }: {
    elements: PlanVectorExportable[];
    view?: PlanExportView;
    camera?: PlanProjectionCamera;
    hlr?: PlanProjectionHlr;
  }): PlanVectorPayload {
    if (elements.length === 0) {
      throw new Error("PlanPDFGenerator.generate requires at least one exportable element.");
    }

    if (view === "top") {
      return this.generateTopPayload(elements);
    }

    return this.generateIsometricPayload(
      elements,
      camera ?? DEFAULT_ISOMETRIC_CAMERA,
      hlr ?? DEFAULT_ISOMETRIC_HLR,
    );
  }

  private generateTopPayload(elements: PlanVectorExportable[]): PlanVectorPayload {
    const lines: PlanVectorLine[] = [];

    for (const element of elements) {
      const roots = element.getExportRoots("top");
      for (const root of roots) {
        root.updateWorldMatrix(true, true);
        this.collectTopLines(root, lines);
      }
    }

    if (lines.length === 0) {
      throw new Error("Top-view export produced no vector lines.");
    }

    return {
      view: "top",
      units: "meters",
      bounds: this.computeBounds(lines),
      lines,
    };
  }

  private generateIsometricPayload(
    elements: PlanVectorExportable[],
    camera: PlanProjectionCamera,
    hlr: PlanProjectionHlr,
  ): PlanVectorPayload {
    const manager = new OGSceneManager();
    manager.createScene("PlanPDFGenerator");

    let addedEntities = 0;
    for (const element of elements) {
      const roots = element.getExportRoots("isometric");
      for (const root of roots) {
        root.updateWorldMatrix(true, true);
        addedEntities += this.addBrepEntities(manager, root);
      }
    }

    if (addedEntities === 0) {
      throw new Error("Isometric export found no 3D outline-capable geometry.");
    }

    const projectedJson = manager.projectCurrentTo2DLines(
      JSON.stringify(camera),
      JSON.stringify(hlr),
    );

    const parsed = JSON.parse(projectedJson) as { lines?: PlanVectorLine[] };
    const lines = parsed.lines ?? [];

    if (lines.length === 0) {
      throw new Error("Isometric export produced no projected vector lines.");
    }

    return {
      view: "isometric",
      units: "meters",
      bounds: this.computeBounds(lines),
      lines,
      camera,
      hlr,
    };
  }

  private collectTopLines(root: THREE.Object3D, lines: PlanVectorLine[]) {
    const stack: THREE.Object3D[] = [root];

    while (stack.length > 0) {
      const object = stack.pop();
      if (!object) {
        continue;
      }

      if (this.tryCollectPolygonOutline(object, lines)) {
        continue;
      }

      if (this.tryCollectLineGeometry(object, lines)) {
        continue;
      }

      for (const child of object.children) {
        stack.push(child);
      }
    }
  }

  private tryCollectPolygonOutline(object: THREE.Object3D, lines: PlanVectorLine[]) {
    if (!(object instanceof Polygon)) {
      return false;
    }

    const outlineBuffer = object.polygon?.get_outline_geometry_buffer?.();
    if (!outlineBuffer || outlineBuffer.length < 6) {
      return true;
    }

    this.pushSegmentPairs(
      Array.from(outlineBuffer),
      object.matrixWorld,
      this.resolveStrokeColor(object),
      this.resolveStrokeWidth(object),
      lines,
    );

    return true;
  }

  private tryCollectLineGeometry(object: THREE.Object3D, lines: PlanVectorLine[]) {
    if (!(object instanceof THREE.Line)) {
      return false;
    }

    const geometry = object.geometry;
    if (!(geometry instanceof THREE.BufferGeometry)) {
      return true;
    }

    const positions = geometry.getAttribute("position");
    if (!(positions instanceof THREE.BufferAttribute) || positions.count < 2) {
      return true;
    }

    const color = this.resolveStrokeColor(object as BrepLikeObject);
    const width = this.resolveStrokeWidth(object as BrepLikeObject);
    const isSegments = object instanceof THREE.LineSegments;
    const step = isSegments ? 2 : 1;

    for (let index = 0; index < positions.count - 1; index += step) {
      const nextIndex = isSegments ? index + 1 : index + 1;
      const start = new THREE.Vector3(
        positions.getX(index),
        positions.getY(index),
        positions.getZ(index),
      ).applyMatrix4(object.matrixWorld);
      const end = new THREE.Vector3(
        positions.getX(nextIndex),
        positions.getY(nextIndex),
        positions.getZ(nextIndex),
      ).applyMatrix4(object.matrixWorld);

      lines.push({
        start: this.toTopPoint(start),
        end: this.toTopPoint(end),
        stroke_color: color,
        stroke_width: width,
      });
    }

    return true;
  }

  private addBrepEntities(manager: OGSceneManager, root: THREE.Object3D): number {
    const source = this.resolveBrepSource(root as BrepLikeObject);
    if (source) {
      manager.addBrepEntityToCurrentScene(
        this.nextEntityId(),
        root.constructor.name,
        source,
      );
      return 1;
    }

    let added = 0;
    for (const child of root.children) {
      child.updateWorldMatrix(false, true);
      added += this.addBrepEntities(manager, child);
    }
    return added;
  }

  private resolveBrepSource(object: BrepLikeObject) {
    if (typeof object.toFreeform === "function" && object.canConvertToFreeform?.()) {
      const freeform = object.toFreeform(this.nextEntityId());
      const placed = createFreeformGeometry(freeform, {
        placement: this.matrixToPlacement(object.parent?.matrixWorld),
      });
      return placed.getBrepSerialized();
    }

    if (typeof object.getLocalBrepSerialized === "function" ||
        typeof object.getLocalBrepData === "function") {
      const placed = createFreeformGeometry(object, {
        placement: this.matrixToPlacement(object.parent?.matrixWorld),
      });
      return placed.getBrepSerialized();
    }

    if (typeof object.getBrepSerialized === "function") {
      return object.getBrepSerialized();
    }

    if (typeof object.getBrepData === "function") {
      const data = object.getBrepData();
      return data ? JSON.stringify(data) : null;
    }

    if (typeof object.getBrep === "function") {
      const data = object.getBrep();
      return data ? JSON.stringify(data) : null;
    }

    return null;
  }

  private pushSegmentPairs(
    positions: number[],
    matrixWorld: THREE.Matrix4,
    color: PlanVectorColor | undefined,
    width: number | undefined,
    lines: PlanVectorLine[],
  ) {
    for (let index = 0; index < positions.length - 5; index += 6) {
      const start = new THREE.Vector3(
        positions[index],
        positions[index + 1],
        positions[index + 2],
      ).applyMatrix4(matrixWorld);
      const end = new THREE.Vector3(
        positions[index + 3],
        positions[index + 4],
        positions[index + 5],
      ).applyMatrix4(matrixWorld);

      lines.push({
        start: this.toTopPoint(start),
        end: this.toTopPoint(end),
        stroke_color: color,
        stroke_width: width,
      });
    }
  }

  private resolveStrokeWidth(object: BrepLikeObject) {
    return object.options?.outlineWidth ??
      object.options?.width ??
      object.options?.lineWidth ??
      object.outlineWidth;
  }

  private resolveStrokeColor(object: BrepLikeObject) {
    const color = object.options?.color ??
      (typeof object.color === "number" ? object.color : undefined) ??
      this.resolveMaterialColor(object);

    if (color === undefined) {
      return undefined;
    }

    return [
      ((color >> 16) & 0xff) / 255,
      ((color >> 8) & 0xff) / 255,
      (color & 0xff) / 255,
    ] satisfies PlanVectorColor;
  }

  private resolveMaterialColor(object: BrepLikeObject) {
    const material = object.material;
    if (!material || Array.isArray(material) || !("color" in material)) {
      return undefined;
    }

    const color = material.color as { getHex?: () => number } | undefined;
    if (color && typeof color.getHex === "function") {
      return color.getHex();
    }

    return undefined;
  }

  private toTopPoint(point: THREE.Vector3) {
    return {
      x: point.x,
      y: -point.z,
    };
  }

  private computeBounds(lines: PlanVectorLine[]): PlanVectorBounds {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const line of lines) {
      minX = Math.min(minX, line.start.x, line.end.x);
      minY = Math.min(minY, line.start.y, line.end.y);
      maxX = Math.max(maxX, line.start.x, line.end.x);
      maxY = Math.max(maxY, line.start.y, line.end.y);
    }

    if (!Number.isFinite(minX) || !Number.isFinite(minY) ||
        !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
      throw new Error("Unable to compute vector bounds from the exported lines.");
    }

    return {
      min: { x: minX, y: minY },
      max: { x: maxX, y: maxY },
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  private matrixToPlacement(matrix?: THREE.Matrix4) {
    const resolvedMatrix = matrix ?? new THREE.Matrix4();
    const translation = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    resolvedMatrix.decompose(translation, rotation, scale);

    const euler = new THREE.Euler().setFromQuaternion(rotation, "XYZ");

    return {
      anchor: new Vector3(0, 0, 0),
      translation: new Vector3(translation.x, translation.y, translation.z),
      rotation: new Vector3(euler.x, euler.y, euler.z),
      scale: new Vector3(scale.x, scale.y, scale.z),
    };
  }

  private nextEntityId() {
    this.entityCounter += 1;
    return `plan-export-${this.entityCounter}`;
  }
}

export {
  DEFAULT_ISOMETRIC_CAMERA,
  DEFAULT_ISOMETRIC_HLR,
};
