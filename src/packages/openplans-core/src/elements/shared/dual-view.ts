import * as THREE from "three";
import { Cuboid, Cylinder, Polygon, Polyline, Vector3 } from "opengeometry";

import type { Placement, PlanExportView, PlanVectorExportable } from "../../types";
import { IShape } from "../../shapes/base-type";

type VectorLike =
  | [number, number, number]
  | { x: number; y: number; z: number }
  | undefined;

export interface DualViewOptions {
  ogid?: string;
  labelName: string;
  placement?: Placement;
  position?: { x: number; y: number; z: number };
  stairPosition?: { x: number; y: number; z: number } | [number, number, number];
  slabPosition?: [number, number, number];
}

export const DEFAULT_PLACEMENT: Placement = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
};

export function toColorNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    if (normalized.startsWith("#")) {
      const parsed = Number.parseInt(normalized.slice(1), 16);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }

    if (normalized.startsWith("0x") || normalized.startsWith("0X")) {
      const parsed = Number.parseInt(normalized.slice(2), 16);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }

  return fallback;
}

function toVectorArray(vector: VectorLike): [number, number, number] {
  if (!vector) {
    return [0, 0, 0];
  }

  if (Array.isArray(vector)) {
    return [
      vector[0] ?? 0,
      vector[1] ?? 0,
      vector[2] ?? 0,
    ];
  }

  return [vector.x, vector.y, vector.z];
}

export function normalizePlacement(
  config: Partial<DualViewOptions> | undefined,
  fallback?: Placement,
): Placement {
  if (config?.placement) {
    return {
      position: [...config.placement.position],
      rotation: [...config.placement.rotation],
      scale: [...config.placement.scale],
    };
  }

  const legacyPosition = config?.position ?? config?.stairPosition ?? config?.slabPosition;
  return {
    position: legacyPosition ? [...toVectorArray(legacyPosition)] : [...(fallback?.position ?? DEFAULT_PLACEMENT.position)],
    rotation: [...(fallback?.rotation ?? DEFAULT_PLACEMENT.rotation)],
    scale: [...(fallback?.scale ?? DEFAULT_PLACEMENT.scale)],
  };
}

export function applyPlacement(target: THREE.Object3D, placement: Placement) {
  const [x, y, z] = placement.position;
  const [rotationX, rotationY, rotationZ] = placement.rotation;
  const [scaleX, scaleY, scaleZ] = placement.scale;

  target.position.set(x, y, z);
  target.rotation.set(rotationX, rotationY, rotationZ);
  target.scale.set(scaleX, scaleY, scaleZ);
}

export function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    const disposable = child as THREE.Object3D & {
      discardGeometry?: () => void;
      dispose?: () => void;
      geometry?: { dispose?: () => void };
      material?:
        | { dispose?: () => void }
        | Array<{ dispose?: () => void }>;
    };

    disposable.discardGeometry?.();
    disposable.dispose?.();
    disposable.geometry?.dispose?.();

    if (Array.isArray(disposable.material)) {
      disposable.material.forEach((material) => material?.dispose?.());
    } else {
      disposable.material?.dispose?.();
    }
  });

  object.removeFromParent();
}

export function clearObjectMap(map: Map<string, THREE.Object3D>) {
  map.forEach((object) => disposeObject(object));
  map.clear();
}

export function setMapVisibility(map: Map<string, THREE.Object3D>, visible: boolean) {
  map.forEach((object) => {
    object.visible = visible;
  });
}

export function setObjectColor(object: THREE.Object3D | undefined, color: number) {
  if (!object || !("color" in object)) {
    return;
  }

  (object as unknown as { color: number }).color = color;
}

export function syncCombinedSubElements(
  target: Map<string, THREE.Object3D>,
  ...sources: Array<Map<string, THREE.Object3D>>
) {
  target.clear();
  sources.forEach((source) => {
    source.forEach((value, key) => target.set(key, value));
  });
}

export function orderedRoots(
  view: PlanExportView,
  source2D: Map<string, THREE.Object3D>,
  source3D: Map<string, THREE.Object3D>,
  keys2D?: readonly string[],
  keys3D?: readonly string[],
): THREE.Object3D[] {
  const source = view === "top" ? source2D : source3D;
  const keys = view === "top" ? keys2D : keys3D;

  if (!keys || keys.length === 0) {
    return Array.from(source.values());
  }

  return keys
    .map((key) => source.get(key))
    .filter((root): root is THREE.Object3D => Boolean(root));
}

interface PolygonOptions {
  key: string;
  color: number;
  vertices: Vector3[];
  outline?: boolean;
  position?: [number, number, number];
  rotationY?: number;
}

interface BoxOptions {
  key: string;
  color: number;
  width: number;
  height: number;
  depth: number;
  center?: [number, number, number];
}

interface CylinderOptions {
  key: string;
  color: number;
  radius: number;
  height: number;
  center?: [number, number, number];
  segments?: number;
}

export abstract class DualViewPolylineElement<TOptions extends DualViewOptions>
  extends Polyline
  implements IShape, PlanVectorExportable {
  ogType = "ELEMENT";

  subElements: Map<string, THREE.Object3D> = new Map();
  protected subElements2D: Map<string, THREE.Object3D> = new Map();
  protected subElements3D: Map<string, THREE.Object3D> = new Map();

  selected = false;
  edit = false;
  locked = false;

  protected topExportKeys: readonly string[] = [];
  protected isometricExportKeys: readonly string[] = [];

  private isProfileView = true;
  private isModelView = true;

  propertySet: TOptions;

  protected constructor(defaults: TOptions, config?: Partial<TOptions>) {
    super({
      ogid: config?.ogid,
      points: [],
      color: 0,
    });

    this.propertySet = {
      ...defaults,
      ...config,
      placement: normalizePlacement(config, defaults.placement),
    } as TOptions;

    this.propertySet.ogid = this.ogid;
  }

  get labelName() {
    return this.propertySet.labelName;
  }

  set labelName(value: string) {
    this.propertySet.labelName = value;
  }

  get profileView() {
    return this.isProfileView;
  }

  set profileView(value: boolean) {
    this.isProfileView = value;
    setMapVisibility(this.subElements2D, value);
  }

  get modelView() {
    return this.isModelView;
  }

  set modelView(value: boolean) {
    this.isModelView = value;
    setMapVisibility(this.subElements3D, value);
  }

  getExportRoots(view: PlanExportView): THREE.Object3D[] {
    return orderedRoots(
      view,
      this.subElements2D,
      this.subElements3D,
      this.topExportKeys,
      this.isometricExportKeys,
    );
  }

  setOPConfig(config: Partial<TOptions>) {
    this.propertySet = {
      ...this.propertySet,
      ...config,
      placement: normalizePlacement(config, this.propertySet.placement),
    } as TOptions;

    this.setOPGeometry();
  }

  getOPConfig(): TOptions {
    return this.propertySet;
  }

  dispose() {
    clearObjectMap(this.subElements2D);
    clearObjectMap(this.subElements3D);
    this.subElements.clear();
    this.discardGeometry?.();
    this.removeFromParent();
  }

  abstract setOPGeometry(): void;

  abstract setOPMaterial(): void;

  protected rebuildViews() {
    clearObjectMap(this.subElements2D);
    clearObjectMap(this.subElements3D);

    this.build2D();
    this.build3D();
    this.applyCurrentPlacement();
    setMapVisibility(this.subElements2D, this.isProfileView);
    setMapVisibility(this.subElements3D, this.isModelView);
    syncCombinedSubElements(this.subElements, this.subElements2D, this.subElements3D);
  }

  protected register2D(key: string, object: THREE.Object3D) {
    this.subElements2D.set(key, object);
    this.add(object);
  }

  protected register3D(key: string, object: THREE.Object3D) {
    this.subElements3D.set(key, object);
    this.add(object);
  }

  protected createPlanPolygon(options: PolygonOptions) {
    const polygon = new Polygon({
      vertices: options.vertices,
      color: options.color,
    });
    polygon.outline = options.outline ?? true;
    if (options.position) {
      polygon.position.set(...options.position);
    }
    if (options.rotationY !== undefined) {
      polygon.rotation.y = options.rotationY;
    }
    this.register2D(options.key, polygon);
    return polygon;
  }

  protected createPlanGroup(key: string, objects: THREE.Object3D[], position?: [number, number, number]) {
    const group = new THREE.Group();
    objects.forEach((object) => group.add(object));
    if (position) {
      group.position.set(...position);
    }
    this.register2D(key, group);
    return group;
  }

  protected createModelBox(options: BoxOptions) {
    const center = options.center ?? [0, options.height / 2, 0];
    const box = new Cuboid({
      center: new Vector3(center[0], center[1], center[2]),
      width: options.width,
      height: options.height,
      depth: options.depth,
      color: options.color,
    });
    this.register3D(options.key, box);
    return box;
  }

  protected createModelCylinder(options: CylinderOptions) {
    const center = options.center ?? [0, options.height / 2, 0];
    const cylinder = new Cylinder({
      center: new Vector3(center[0], center[1], center[2]),
      radius: options.radius,
      height: options.height,
      segments: options.segments ?? 24,
      angle: Math.PI * 2,
      color: options.color,
    });
    this.register3D(options.key, cylinder);
    return cylinder;
  }

  protected createExtrudedFootprint(
    key: string,
    vertices: Vector3[],
    height: number,
    color: number,
    yOffset = 0,
  ) {
    const polygon = new Polygon({
      vertices,
      color,
    });
    const extruded = polygon.extrude(-height);
    extruded.position.y = yOffset;
    extruded.color = color;
    this.register3D(key, extruded);
    polygon.dispose();
    return extruded;
  }

  protected applyCurrentPlacement() {
    this.propertySet.placement = normalizePlacement(this.propertySet, this.propertySet.placement);
    applyPlacement(this, this.propertySet.placement);
  }

  protected abstract build2D(): void;

  protected abstract build3D(): void;
}
