import * as THREE from "three";
import {
  createFreeformGeometry,
  OGSceneManager,
  Vector3,
} from "opengeometry";

import { ElementType } from "../elements/base-type";
import { buildIfcConfig } from "../utils";
import type {
  PlanIfcExportable,
  PlanIfcExportResult,
  SemanticIfcExportOptions,
} from "../types";

type PlacementLike = {
  anchor?: { x: number; y: number; z: number };
  translation?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
};

type BrepLikeObject = THREE.Object3D & {
  ogid?: string;
  getPlacement?: () => PlacementLike;
  canConvertToFreeform?: () => boolean;
  toFreeform?: (id?: string) => {
    getPlacement?: () => PlacementLike;
    getLocalBrepData?: () => unknown;
    getLocalBrepSerialized?: () => string;
    getBrepSerialized?: () => string;
  };
  getLocalBrepSerialized?: () => string;
  getLocalBrepData?: () => unknown;
  getBrepSerialized?: () => string;
  getBrepData?: () => unknown;
  getBrep?: () => unknown;
  get_local_brep_serialized?: () => string;
  get_brep_serialized?: () => string;
};

type BrepVertex = {
  id: number;
  position: { x: number; y: number; z: number };
  outgoing_halfedge: number;
};

type BrepHalfedge = {
  id: number;
  from: number;
  to: number;
  twin: number;
  next: number;
  prev: number;
  edge: number;
  face: number;
  loop_ref: number | null;
  wire_ref: number | null;
};

type BrepEdge = {
  id: number;
  halfedge: number;
  twin_halfedge: number;
};

type BrepLoop = {
  id: number;
  halfedge: number;
  face: number;
  is_hole: boolean;
};

type BrepFace = {
  id: number;
  normal: { x: number; y: number; z: number };
  outer_loop: number;
  inner_loops: number[];
  shell_ref: number;
};

type BrepShell = {
  id: number;
  faces: number[];
  is_closed: boolean;
};

type BrepData = {
  id: string;
  vertices: BrepVertex[];
  halfedges: BrepHalfedge[];
  edges: BrepEdge[];
  loops: BrepLoop[];
  faces: BrepFace[];
  wires?: unknown[];
  shells: BrepShell[];
};

export class IFCExporter {
  private entityCounter = 0;

  generate({
    elements,
    options,
  }: {
    elements: PlanIfcExportable[];
    options?: SemanticIfcExportOptions;
  }): PlanIfcExportResult {
    if (elements.length === 0) {
      throw new Error("IFCExporter.generate requires at least one exportable element.");
    }

    const manager = new OGSceneManager();
    manager.createScene("IFCExporter");

    for (const element of elements) {
      const roots = element.getExportRoots("isometric");
      if (roots.length === 0) {
        throw new Error(`IFC export found no 3D export roots for ${element.labelName}.`);
      }

      const brepSources: string[] = [];
      for (const root of roots) {
        root.updateWorldMatrix(true, true);
        brepSources.push(...this.collectBrepSources(root));
      }

      if (brepSources.length === 0) {
        throw new Error(`IFC export found no 3D BRep geometry for ${element.labelName}.`);
      }

      manager.addBrepEntityToCurrentScene(
        this.resolveEntityId(element),
        this.resolveIfcClass(element),
        this.mergeElementBreps(brepSources, element.labelName),
      );
    }

    const result = manager.exportCurrentSceneToIfc(
      JSON.stringify(buildIfcConfig({}, options)),
    );

    return {
      text: result.text,
      reportJson: result.reportJson,
    };
  }

  private collectBrepSources(root: THREE.Object3D): string[] {
    const source = this.resolveBrepSource(root as BrepLikeObject);
    if (source) {
      return [source];
    }

    const collected: string[] = [];
    for (const child of root.children) {
      child.updateWorldMatrix(false, true);
      collected.push(...this.collectBrepSources(child));
    }

    return collected;
  }

  private mergeElementBreps(sources: string[], labelName: string) {
    if (sources.length === 1) {
      return sources[0];
    }

    const breps = sources.map((source) => JSON.parse(source) as BrepData);
    if (breps.some((brep) => (brep.wires?.length ?? 0) > 0)) {
      throw new Error(`IFC export does not support wire-based BRep merge for ${labelName}.`);
    }

    const merged: BrepData = {
      id: breps[0]?.id ?? this.nextEntityId(),
      vertices: [],
      halfedges: [],
      edges: [],
      loops: [],
      faces: [],
      wires: [],
      shells: [],
    };

    let vertexOffset = 0;
    let halfedgeOffset = 0;
    let edgeOffset = 0;
    let loopOffset = 0;
    let faceOffset = 0;
    let shellOffset = 0;

    for (const brep of breps) {
      merged.vertices.push(
        ...brep.vertices.map((vertex) => ({
          ...vertex,
          id: vertex.id + vertexOffset,
          outgoing_halfedge: vertex.outgoing_halfedge + halfedgeOffset,
        })),
      );

      merged.halfedges.push(
        ...brep.halfedges.map((halfedge) => ({
          ...halfedge,
          id: halfedge.id + halfedgeOffset,
          from: halfedge.from + vertexOffset,
          to: halfedge.to + vertexOffset,
          twin: halfedge.twin + halfedgeOffset,
          next: halfedge.next + halfedgeOffset,
          prev: halfedge.prev + halfedgeOffset,
          edge: halfedge.edge + edgeOffset,
          face: halfedge.face + faceOffset,
          loop_ref: halfedge.loop_ref === null ? null : halfedge.loop_ref + loopOffset,
          wire_ref: halfedge.wire_ref,
        })),
      );

      merged.edges.push(
        ...brep.edges.map((edge) => ({
          ...edge,
          id: edge.id + edgeOffset,
          halfedge: edge.halfedge + halfedgeOffset,
          twin_halfedge: edge.twin_halfedge + halfedgeOffset,
        })),
      );

      merged.loops.push(
        ...brep.loops.map((loop) => ({
          ...loop,
          id: loop.id + loopOffset,
          halfedge: loop.halfedge + halfedgeOffset,
          face: loop.face + faceOffset,
        })),
      );

      merged.faces.push(
        ...brep.faces.map((face) => ({
          ...face,
          id: face.id + faceOffset,
          outer_loop: face.outer_loop + loopOffset,
          inner_loops: face.inner_loops.map((loopId) => loopId + loopOffset),
          shell_ref: face.shell_ref + shellOffset,
        })),
      );

      merged.shells.push(
        ...brep.shells.map((shell) => ({
          ...shell,
          id: shell.id + shellOffset,
          faces: shell.faces.map((faceId) => faceId + faceOffset),
        })),
      );

      vertexOffset += brep.vertices.length;
      halfedgeOffset += brep.halfedges.length;
      edgeOffset += brep.edges.length;
      loopOffset += brep.loops.length;
      faceOffset += brep.faces.length;
      shellOffset += brep.shells.length;
    }

    const serialized = JSON.stringify(merged);
    if (!serialized) {
      throw new Error(`IFC export could not merge geometry for ${labelName}.`);
    }

    return serialized;
  }

  private resolveEntityId(element: PlanIfcExportable) {
    const labelPrefix = this.slugify(element.labelName);
    const baseId = element.ogid ?? this.nextEntityId();
    return labelPrefix ? `${labelPrefix}-${baseId}` : baseId;
  }

  private resolveIfcClass(element: PlanIfcExportable) {
    switch (element.ogType) {
      case ElementType.WALL:
        return "IFCWALL";
      case ElementType.DOOR:
        return "IFCDOOR";
      case ElementType.WINDOW:
        return "IFCWINDOW";
      default:
        throw new Error(`IFC export does not support element type ${element.ogType}.`);
    }
  }

  private resolveBrepSource(object: BrepLikeObject) {
    const directSource = this.resolveDirectBrepSource(object);
    if (directSource) {
      return this.applyPlacementToSerializedBrep(
        directSource,
        this.matrixToPlacement(object.parent?.matrixWorld),
      );
    }

    const localSource = this.resolveLocalBrepSource(object);
    if (localSource) {
      return this.applyPlacementToSerializedBrep(
        localSource.serialized,
        this.combinePlacements(
          this.matrixToPlacement(object.parent?.matrixWorld),
          localSource.placement,
        ),
      );
    }

    return null;
  }

  private resolveDirectBrepSource(object: BrepLikeObject) {
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

    if (typeof object.get_brep_serialized === "function") {
      return object.get_brep_serialized();
    }

    return null;
  }

  private resolveLocalBrepSource(object: BrepLikeObject) {
    if (typeof object.toFreeform === "function" && object.canConvertToFreeform?.()) {
      const freeform = object.toFreeform(this.nextEntityId());
      const serialized = this.resolveLocalSerializedSource(freeform);
      if (serialized) {
        return {
          serialized,
          placement: freeform.getPlacement?.(),
        };
      }
    }

    const serialized = this.resolveLocalSerializedSource(object);
    if (serialized) {
      return {
        serialized,
        placement: object.getPlacement?.(),
      };
    }

    return null;
  }

  private resolveLocalSerializedSource(source: {
    getLocalBrepData?: () => unknown;
    getLocalBrepSerialized?: () => string;
    get_local_brep_serialized?: () => string;
  }) {
    if (typeof source.getLocalBrepSerialized === "function") {
      return source.getLocalBrepSerialized();
    }

    if (typeof source.getLocalBrepData === "function") {
      const data = source.getLocalBrepData();
      return data ? JSON.stringify(data) : null;
    }

    if (typeof source.get_local_brep_serialized === "function") {
      return source.get_local_brep_serialized();
    }

    return null;
  }

  private applyPlacementToSerializedBrep(
    source: string,
    placement: ReturnType<IFCExporter["combinePlacements"]>,
  ) {
    if (this.isIdentityPlacement(placement)) {
      return source;
    }

    const placed = createFreeformGeometry(source, { placement });
    return placed.getBrepSerialized();
  }

  private combinePlacements(
    parentPlacement?: ReturnType<IFCExporter["matrixToPlacement"]>,
    childPlacement?: PlacementLike,
  ) {
    if (!parentPlacement && !childPlacement) {
      return undefined;
    }

    const combinedMatrix = this.placementToMatrix(parentPlacement);
    if (childPlacement) {
      combinedMatrix.multiply(this.placementToMatrix(childPlacement));
    }

    return this.matrixToPlacement(combinedMatrix);
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

  private placementToMatrix(placement?: PlacementLike) {
    const translation = this.toThreeVector(placement?.translation, 0);
    const rotation = this.toThreeVector(placement?.rotation, 0);
    const scale = this.toThreeVector(placement?.scale, 1);
    const anchor = this.toThreeVector(placement?.anchor, 0);
    const composed = new THREE.Matrix4().compose(
      translation,
      new THREE.Quaternion().setFromEuler(new THREE.Euler(rotation.x, rotation.y, rotation.z, "XYZ")),
      scale,
    );

    if (anchor.lengthSq() === 0) {
      return composed;
    }

    return new THREE.Matrix4()
      .makeTranslation(anchor.x, anchor.y, anchor.z)
      .multiply(composed)
      .multiply(new THREE.Matrix4().makeTranslation(-anchor.x, -anchor.y, -anchor.z));
  }

  private toThreeVector(
    value: { x: number; y: number; z: number } | undefined,
    fallback: number,
  ) {
    return new THREE.Vector3(
      value?.x ?? fallback,
      value?.y ?? fallback,
      value?.z ?? fallback,
    );
  }

  private isIdentityPlacement(placement?: ReturnType<IFCExporter["matrixToPlacement"]>) {
    if (!placement) {
      return true;
    }

    return placement.translation.x === 0 &&
      placement.translation.y === 0 &&
      placement.translation.z === 0 &&
      placement.rotation.x === 0 &&
      placement.rotation.y === 0 &&
      placement.rotation.z === 0 &&
      placement.scale.x === 1 &&
      placement.scale.y === 1 &&
      placement.scale.z === 1;
  }

  private nextEntityId() {
    this.entityCounter += 1;
    return `ifc-export-${this.entityCounter}`;
  }

  private slugify(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}
