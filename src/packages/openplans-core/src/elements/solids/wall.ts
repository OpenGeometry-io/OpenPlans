import * as THREE from "three";
import { Polygon, Vector3 } from "opengeometry";

import { IShape } from "../../shapes/base-type";
import type { PlanExportView, PlanVectorExportable } from "../../types";
import { ElementType } from "../base-type";
import { Door } from "../openings/door";
import { WallOpening } from "../openings/wall-opening";
import {
  applyPlacement,
  clearObjectMap,
  orderedRoots,
  setMapVisibility,
  syncCombinedSubElements,
  toColorNumber,
} from "../shared/dual-view";
import { buildResolvedWallArtifacts } from "./wall-artifact-builder";
import {
  buildStraightWallFrame,
  holeCenter,
  isHostedOpeningLike,
  isObject3D,
  pointInPolygon2D,
  resolveHostedOpeningPlacement,
  type HostedOpeningLike,
  type HostedOpeningPlacement,
  type WallAttachment,
} from "./wall-geometry";
import type { WallSystem } from "./wall-system";
import {
  WallMaterial,
  cloneResolvedWallArtifacts,
  cloneWallDefinition,
  mergeWallDefinition,
  normalizeWallDefinition,
  type ResolvedWallArtifacts,
  type WallDefinition,
  type WallInput,
  type WallPlanEdge,
  type WallPoint,
  type WallModelDisplayAssignment,
  type WallResolvedSource,
} from "./wall-types";

export type {
  ResolvedWallArtifacts,
  WallDefinition,
  WallInput,
  WallAttachment,
  WallPlanArtifact,
  WallPlanEdge,
} from "./wall-types";
export { WallMaterial } from "./wall-types";

export interface Point extends WallPoint {}

interface HostedOpeningEntry {
  opening: HostedOpeningLike;
  attachment: WallAttachment;
}

type OutlineCapable = THREE.Object3D & {
  outline?: boolean;
  outlineColor?: number;
  outlineWidth?: number;
  fatOutlines?: boolean;
  color?: number;
};

const PLAN_FILL_ELEVATION = 0.001;
const PLAN_EDGE_ELEVATION = 0.004;

function clonePoint(point: WallPoint): WallPoint {
  return { x: point.x, y: point.y, z: point.z };
}

function loopEdges(vertices: Vector3[]) {
  return vertices.map((vertex, index) => ({
    start: vertex,
    end: vertices[(index + 1) % vertices.length],
  }));
}

function darkenColor(color: number) {
  const source = new THREE.Color(color);
  return source.clone().multiplyScalar(0.32).getHex();
}

function applyModelOutline(object: THREE.Object3D) {
  const outlineCapable = object as OutlineCapable;
  outlineCapable.outline = true;
  outlineCapable.fatOutlines = true;
  outlineCapable.outlineWidth = 2;
  if ("outlineColor" in outlineCapable) {
    outlineCapable.outlineColor = 0x000000;
  }
}

function createLine(edge: WallPlanEdge, color: number, renderOrder: number) {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(edge.start.x, PLAN_EDGE_ELEVATION + renderOrder * 0.002, edge.start.z),
    new THREE.Vector3(edge.end.x, PLAN_EDGE_ELEVATION + renderOrder * 0.002, edge.end.z),
  ]);
  const material = new THREE.LineBasicMaterial({ color });
  const line = new THREE.Line(geometry, material);
  line.renderOrder = renderOrder * 10 + 1;
  line.userData.wallEdge = true;
  return line;
}

function ensureLoopOrientation(vertices: Vector3[], clockwise: boolean) {
  const points = vertices.map((vertex) => new THREE.Vector2(vertex.x, vertex.z));
  const isClockwise = THREE.ShapeUtils.isClockWise(points);
  return isClockwise === clockwise ? points : [...points].reverse();
}

function createFillMesh(vertices: Vector3[], holes: Vector3[][], color: number, renderOrder: number) {
  const shape = new THREE.Shape(ensureLoopOrientation(vertices, false));
  holes.forEach((holeVertices) => {
    shape.holes.push(new THREE.Path(ensureLoopOrientation(holeVertices, true)));
  });

  const geometry = new THREE.ShapeGeometry(shape);
  geometry.rotateX(Math.PI / 2);

  const material = new THREE.MeshBasicMaterial({
    color,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = PLAN_FILL_ELEVATION + renderOrder * 0.001;
  mesh.renderOrder = renderOrder * 10;
  mesh.userData.wallFill = true;
  return mesh;
}

function cloneHostedAttachment(entry: HostedOpeningEntry) {
  return {
    opening: entry.opening,
    attachment: { ...entry.attachment },
  };
}

export class Wall extends THREE.Group implements IShape, PlanVectorExportable {
  private static creationCounter = 0;

  ogType = ElementType.WALL;
  ogid: string;

  subElements: Map<string, THREE.Object3D> = new Map();

  private subElements2D: Map<string, THREE.Object3D> = new Map();
  private subElements3D: Map<string, THREE.Object3D> = new Map();
  private displaySubElements3D: Map<string, THREE.Object3D> = new Map();
  private hostedOpenings = new Map<string, HostedOpeningEntry>();
  private resolvedArtifacts: ResolvedWallArtifacts | null = null;
  private topExportKeys: string[] = [];
  private isometricExportKeys: string[] = [];
  private isProfileView = true;
  private isModelView = true;
  private readonly creationOrder: number;
  private boundWallSystem?: WallSystem;
  private modelDisplayAssignment: WallModelDisplayAssignment = { mode: "individual" };

  selected = false;
  edit = false;
  locked = false;

  propertySet: WallDefinition;

  get labelName() { return this.propertySet.labelName; }
  set labelName(value: string) {
    this.propertySet.labelName = value;
  }

  get wallThickness() { return this.propertySet.section.layers[0].thickness; }
  set wallThickness(value: number) {
    this.propertySet.section.layers[0].thickness = Math.max(0.05, value);
    this.requestWallUpdate();
  }

  get wallMaterial() { return this.propertySet.section.layers[0].material; }
  set wallMaterial(value: WallMaterial | string) {
    this.propertySet.section.layers[0].material = value;
  }

  get wallColor() { return this.propertySet.section.layers[0].color ?? 0xcccccc; }
  set wallColor(value: number) {
    this.propertySet.section.layers[0].color = toColorNumber(value, this.wallColor);
    this.setOPMaterial();
  }

  get wallHeight() { return this.propertySet.height; }
  set wallHeight(value: number) {
    this.propertySet.height = Math.max(0.1, value);
    this.requestWallUpdate();
  }

  get path() {
    return this.propertySet.path.map(clonePoint) as [WallPoint, WallPoint];
  }

  get wallAnchor() {
    const [start, end] = this.propertySet.path;
    return { start: clonePoint(start), end: clonePoint(end) };
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
    this.syncModelVisibility();
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

  set elementOutline(value: boolean) {
    this.subElements2D.forEach((root) => {
      root.traverse((object) => {
        if (object.userData.wallEdge) {
          object.visible = value;
        }
      });
    });

    this.subElements3D.forEach((root) => {
      root.traverse((object) => {
        if ("outline" in (object as OutlineCapable) && (object.userData.wallSolid || object === root)) {
          (object as OutlineCapable).outline = value;
        }
      });
    });

    this.displaySubElements3D.forEach((root) => {
      root.traverse((object) => {
        if ("outline" in (object as OutlineCapable) && (object.userData.wallSolid || object === root)) {
          (object as OutlineCapable).outline = value;
        }
      });
    });
  }

  constructor(config?: WallInput) {
    super();
    this.ogid = config?.ogid ?? crypto.randomUUID();
    this.creationOrder = Wall.creationCounter;
    Wall.creationCounter += 1;
    this.propertySet = normalizeWallDefinition({
      ...config,
      ogid: this.ogid,
    });
    this.setOPGeometry();
  }

  setOPConfig(config: WallInput): void {
    this.propertySet = mergeWallDefinition(this.propertySet, config);
    this.requestWallUpdate();
  }

  getOPConfig(): WallDefinition {
    return cloneWallDefinition(this.propertySet);
  }

  getResolvedArtifacts() {
    return this.resolvedArtifacts ? cloneResolvedWallArtifacts(this.resolvedArtifacts) : null;
  }

  getResolvedSource(): WallResolvedSource | null {
    const frame = buildStraightWallFrame(this.propertySet.path, this.wallThickness);
    if (!frame) {
      return null;
    }

    return {
      wallId: this.ogid,
      labelName: this.labelName,
      definition: cloneWallDefinition(this.propertySet),
      frame,
      creationOrder: this.creationOrder,
    };
  }

  getBoundWallSystem() {
    return this.boundWallSystem;
  }

  bindWallSystem(system: WallSystem) {
    this.boundWallSystem = system;
  }

  unbindWallSystem(rebuildDetached = true) {
    this.boundWallSystem = undefined;
    this.modelDisplayAssignment = { mode: "individual" };
    if (rebuildDetached) {
      this.setOPGeometry();
    }
  }

  applySystemArtifacts(artifacts: ResolvedWallArtifacts | null) {
    this.resolvedArtifacts = artifacts ? cloneResolvedWallArtifacts(artifacts) : null;
    this.rebuildGeometry();
  }

  applyModelDisplayAssignment(assignment: WallModelDisplayAssignment) {
    this.modelDisplayAssignment = {
      mode: assignment.mode,
      memberWallIds: assignment.memberWallIds ? [...assignment.memberWallIds] : undefined,
    };
    this.rebuildModelDisplayGeometry();
  }

  attachOpening(opening: HostedOpeningLike, attachment: WallAttachment) {
    if (!isHostedOpeningLike(opening)) {
      throw new Error("Wall.attachOpening only supports WallOpening, Door, or Window.");
    }

    this.hostedOpenings.set(opening.ogid, {
      opening,
      attachment: { ...attachment },
    });
    this.propertySet.openings = Array.from(this.hostedOpenings.values()).map((entry) => ({
      openingId: entry.opening.ogid,
      attachment: { ...entry.attachment },
    }));

    this.assignHostedOpeningToWall(opening);
    this.setHostedOpeningHostId(opening, this.ogid);
    this.requestWallUpdate();
    return opening;
  }

  detachOpening(ogid: string) {
    const entry = this.hostedOpenings.get(ogid);
    if (!entry) {
      return null;
    }

    this.hostedOpenings.delete(ogid);
    this.propertySet.openings = Array.from(this.hostedOpenings.values()).map((existing) => ({
      openingId: existing.opening.ogid,
      attachment: { ...existing.attachment },
    }));
    this.setHostedOpeningHostId(entry.opening, undefined);

    if (entry.opening.parent === this) {
      const worldPosition = new THREE.Vector3();
      const worldQuaternion = new THREE.Quaternion();
      const worldScale = new THREE.Vector3();

      entry.opening.updateWorldMatrix(true, false);
      entry.opening.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);

      this.remove(entry.opening);

      if (this.parent) {
        this.parent.add(entry.opening);
        entry.opening.position.copy(worldPosition);
        entry.opening.quaternion.copy(worldQuaternion);
        entry.opening.scale.copy(worldScale);
      }
    }

    this.requestWallUpdate();
    return entry.opening;
  }

  getHostedOpenings() {
    return Array.from(this.hostedOpenings.values()).map(cloneHostedAttachment);
  }

  dispose() {
    if (this.boundWallSystem) {
      const system = this.boundWallSystem;
      this.boundWallSystem = undefined;
      system.unregister(this, { rebuildDetached: false });
    }

    clearObjectMap(this.subElements2D);
    clearObjectMap(this.subElements3D);
    clearObjectMap(this.displaySubElements3D);
    for (const { opening } of this.hostedOpenings.values()) {
      if (opening.parent === this) {
        opening.removeFromParent();
      }
    }
    this.hostedOpenings.clear();
    this.subElements.clear();
    this.removeFromParent();
  }

  addPoint(point: Point): void {
    const nextPath = [...this.propertySet.path.map(clonePoint), clonePoint(point)];
    if (nextPath.length !== 2) {
      throw new Error("Wall v1 supports exactly two path points.");
    }

    this.updatePoints(nextPath);
  }

  updatePoints(points: Array<Point>): void {
    if (points.length !== 2) {
      throw new Error("Wall v1 supports exactly two path points.");
    }

    this.propertySet.path = [clonePoint(points[0]), clonePoint(points[1])];
    this.requestWallUpdate();
  }

  setOPGeometry(): void {
    const source = this.getResolvedSource();
    if (!source) {
      clearObjectMap(this.subElements2D);
      clearObjectMap(this.subElements3D);
      clearObjectMap(this.displaySubElements3D);
      this.topExportKeys = [];
      this.isometricExportKeys = [];
      syncCombinedSubElements(this.subElements, this.subElements2D, this.subElements3D, this.displaySubElements3D);
      return;
    }

    this.resolvedArtifacts = buildResolvedWallArtifacts([source], []).get(this.ogid) ?? null;
    this.rebuildGeometry();
  }

  setOPMaterial(): void {
    const fillColor = this.wallColor;
    const edgeColor = darkenColor(fillColor);

    this.subElements2D.forEach((root) => {
      root.traverse((object) => {
        if (object.userData.wallFill && object instanceof THREE.Mesh && object.material instanceof THREE.MeshBasicMaterial) {
          object.material.color.setHex(fillColor);
        }

        if (object.userData.wallEdge && object instanceof THREE.Line && object.material instanceof THREE.LineBasicMaterial) {
          object.material.color.setHex(edgeColor);
        }
      });
    });

    this.subElements3D.forEach((root) => {
      root.traverse((object) => {
        const solid = object as OutlineCapable;
        if ("color" in solid) {
          solid.color = fillColor;
        }

        if (object.userData.wallSolid || object === root) {
          applyModelOutline(object);
        }
      });
    });

    this.displaySubElements3D.forEach((root) => {
      root.traverse((object) => {
        const solid = object as OutlineCapable;
        if ("color" in solid) {
          solid.color = fillColor;
        }

        if (object.userData.wallMergedDisplay || object.userData.wallSolid || object === root) {
          applyModelOutline(object);
        }
      });
    });
  }

  private requestWallUpdate() {
    if (this.boundWallSystem) {
      this.boundWallSystem.requestResolve();
      return;
    }

    this.setOPGeometry();
  }

  private rebuildGeometry() {
    clearObjectMap(this.subElements2D);
    clearObjectMap(this.subElements3D);
    clearObjectMap(this.displaySubElements3D);
    this.topExportKeys = [];
    this.isometricExportKeys = [];

    const source = this.getResolvedSource();
    if (!source || !this.resolvedArtifacts) {
      syncCombinedSubElements(this.subElements, this.subElements2D, this.subElements3D, this.displaySubElements3D);
      return;
    }

    const hostedPlacements = this.resolveHostedOpeningPlacements(source);
    this.createPlanRoots(hostedPlacements);
    this.createModelRoots(hostedPlacements);
    this.rebuildModelDisplayGeometry();

    applyPlacement(this, this.propertySet.placement);
    setMapVisibility(this.subElements2D, this.isProfileView);
    this.syncModelVisibility();
    syncCombinedSubElements(this.subElements, this.subElements2D, this.subElements3D, this.displaySubElements3D);
    this.setOPMaterial();
  }

  private createPlanRoots(hostedPlacements: HostedOpeningPlacement[]) {
    if (!this.resolvedArtifacts) {
      return;
    }

    const edgeColor = darkenColor(this.wallColor);

    this.resolvedArtifacts.planArtifacts.forEach((artifact, index) => {
      const polygonHoles = hostedPlacements
        .filter((placement) => pointInPolygon2D(holeCenter(placement.holeVertices), artifact.polygon))
        .map((placement) => placement.holeVertices);

      const group = new THREE.Group();
      group.renderOrder = artifact.renderOrder * 10;
      group.add(createFillMesh(artifact.polygon, polygonHoles, this.wallColor, artifact.renderOrder));

      artifact.visibleEdges.forEach((edge) => {
        group.add(createLine(edge, edgeColor, artifact.renderOrder));
      });

      polygonHoles.forEach((hole) => {
        loopEdges(hole).forEach((edge) => {
          group.add(createLine(
            {
              start: edge.start,
              end: edge.end,
            },
            edgeColor,
            artifact.renderOrder,
          ));
        });
      });

      const key = this.resolvedArtifacts && this.resolvedArtifacts.planArtifacts.length === 1
        ? "wallPlan"
        : `wallPlan-${index}`;
      this.subElements2D.set(key, group);
      this.add(group);
      this.topExportKeys.push(key);
    });
  }

  private createModelRoots(hostedPlacements: HostedOpeningPlacement[]) {
    if (!this.resolvedArtifacts) {
      return;
    }

    this.resolvedArtifacts.modelPolygons.forEach((vertices, index) => {
      const polygon = new Polygon({
        vertices,
        color: this.wallColor,
      });

      let solid: THREE.Object3D = polygon.extrude(this.wallHeight);
      (solid as OutlineCapable).color = this.wallColor;
      applyModelOutline(solid);
      polygon.dispose?.();

      const openings = hostedPlacements.filter((placement) =>
        pointInPolygon2D(holeCenter(placement.holeVertices), vertices));

      openings.forEach((placement) => {
        solid = placement.volume.subtractFrom(solid as { getBrepSerialized?: () => string });
        (solid as OutlineCapable).color = this.wallColor;
        applyModelOutline(solid);
      });

      solid.userData.wallSolid = true;

      const key = this.resolvedArtifacts && this.resolvedArtifacts.modelPolygons.length === 1
        ? "wallSolid"
        : `wallSolid-${index}`;
      this.subElements3D.set(key, solid);
      this.add(solid);
      this.isometricExportKeys.push(key);
    });

    hostedPlacements.forEach((placement) => {
      placement.volume.discardGeometry();
    });
  }

  private rebuildModelDisplayGeometry() {
    clearObjectMap(this.displaySubElements3D);

    if (this.modelDisplayAssignment.mode !== "merged-owner") {
      this.syncModelVisibility();
      syncCombinedSubElements(this.subElements, this.subElements2D, this.subElements3D, this.displaySubElements3D);
      return;
    }

    const memberWallIds = this.modelDisplayAssignment.memberWallIds ?? [this.ogid];
    const memberWalls = memberWallIds
      .map((wallId) => this.boundWallSystem?.getWall(wallId))
      .filter((wall): wall is Wall => Boolean(wall));
    const memberRoots = memberWalls.flatMap((wall) => wall.getExportRoots("isometric"));
    const merged = this.buildMergedDisplaySolid(memberRoots);
    if (!merged) {
      this.syncModelVisibility();
      syncCombinedSubElements(this.subElements, this.subElements2D, this.subElements3D, this.displaySubElements3D);
      return;
    }

    merged.userData.wallMergedDisplay = true;
    this.displaySubElements3D.set("wallMergedDisplay", merged);
    this.add(merged);
    this.syncModelVisibility();
    syncCombinedSubElements(this.subElements, this.subElements2D, this.subElements3D, this.displaySubElements3D);
    this.setOPMaterial();
  }

  private buildMergedDisplaySolid(roots: THREE.Object3D[]) {
    const solidRoots = roots.filter((root): root is THREE.Object3D & { union?: Function } =>
      typeof (root as { getBrepSerialized?: unknown }).getBrepSerialized === "function");
    if (solidRoots.length === 0) {
      return null;
    }

    let merged = solidRoots[0] as THREE.Object3D & { union?: Function };
    try {
      for (const root of solidRoots.slice(1)) {
        if (typeof merged.union !== "function") {
          return merged;
        }

        merged = merged.union(root, {
          color: this.wallColor,
          outline: true,
          fatOutlines: true,
          outlineWidth: 2,
          kernel: {
            mergeCoplanarFaces: true,
          },
        }) as THREE.Object3D & { union?: Function };
      }
    } catch {
      return null;
    }

    (merged as OutlineCapable).color = this.wallColor;
    applyModelOutline(merged);
    return merged;
  }

  private syncModelVisibility() {
    const mergedDisplayReady = this.displaySubElements3D.size > 0;
    const showOwnRoots = this.isModelView && (
      this.modelDisplayAssignment.mode === "individual"
      || (this.modelDisplayAssignment.mode === "merged-owner" && !mergedDisplayReady)
    );
    const showMergedRoots = this.isModelView
      && this.modelDisplayAssignment.mode === "merged-owner"
      && mergedDisplayReady;
    setMapVisibility(this.subElements3D, showOwnRoots);
    setMapVisibility(this.displaySubElements3D, showMergedRoots);
  }

  private resolveHostedOpeningPlacements(source: WallResolvedSource) {
    const placements: HostedOpeningPlacement[] = [];

    this.hostedOpenings.forEach(({ opening, attachment }) => {
      const placement = resolveHostedOpeningPlacement(
        source.frame,
        opening,
        attachment,
        this.wallThickness,
      );
      placements.push(placement);
      this.syncHostedOpeningPlacement(opening, placement);
    });

    return placements;
  }

  private syncHostedOpeningPlacement(opening: HostedOpeningLike, placement: HostedOpeningPlacement) {
    this.setHostedOpeningHostId(opening, this.ogid);

    if (opening instanceof WallOpening) {
      opening.position.set(placement.center.x, placement.baseHeight, placement.center.z);
      opening.baseHeight = placement.baseHeight;
      return;
    }

    if (opening instanceof Door) {
      const config = opening.getOPConfig();
      opening.setOPConfig({
        ...config,
        hostWallId: this.ogid,
        placement: {
          position: [
            placement.center.x,
            placement.baseHeight - placement.intrinsicBaseHeight,
            placement.center.z,
          ],
          rotation: [0, placement.rotationY, 0],
          scale: [...config.placement.scale],
        },
      });
      return;
    }

    const config = opening.getOPConfig();
    opening.setOPConfig({
      ...config,
      hostWallId: this.ogid,
      placement: {
        position: [
          placement.center.x,
          placement.baseHeight - placement.intrinsicBaseHeight,
          placement.center.z,
        ],
        rotation: [0, placement.rotationY, 0],
        scale: [...config.placement.scale],
      },
    });
  }

  private assignHostedOpeningToWall(opening: HostedOpeningLike) {
    if (!isObject3D(opening)) {
      return;
    }

    if (opening.parent && opening.parent !== this) {
      opening.removeFromParent();
    }

    if (opening.parent !== this) {
      this.add(opening);
    }
  }

  private setHostedOpeningHostId(opening: HostedOpeningLike, hostWallId: string | undefined) {
    if (opening instanceof WallOpening) {
      opening.hostWallId = hostWallId;
      return;
    }

    if (opening instanceof Door) {
      const config = opening.getOPConfig();
      if (config.hostWallId === hostWallId) {
        return;
      }

      opening.setOPConfig({
        ...config,
        hostWallId,
      });
      return;
    }

    const config = opening.getOPConfig();
    if (config.hostWallId === hostWallId) {
      return;
    }

    opening.setOPConfig({
      ...config,
      hostWallId,
    });
  }
}
