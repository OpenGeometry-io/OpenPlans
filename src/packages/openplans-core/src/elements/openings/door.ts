import * as THREE from "three";
import { IShape } from "../../shapes/base-type";
import { ElementType, DoorType } from "./../base-type";
import { Arc, Cuboid, Polygon, Sweep, Vector3 } from "opengeometry";
import type { Placement, PlanExportView, PlanVectorExportable } from "../../types";
import { Opening } from "./opening";
import { WallFrame, localToWorld } from "../solids/wall-frame";

export type ElementViewType = 'plan' | '3d';
export type SubElementType = 'frame' | 'finish' | 'swingArc' | 'panel';
type Door2DSubElementType = 'frame' | 'panelPivot' | 'panel' | 'swingArc' | 'door-opening';
type Door3DSubElementType = 'frame' | 'panelPivot' | 'panel' | 'stop' | 'door-opening';
export type DoorQuandrant = 1 | 2 | 3 | 4;

export enum DoorMaterialType {
  WOOD = 'WOOD',
  GLASS = 'GLASS',
  METAL = 'METAL',
  OTHER = 'OTHER',
}

export interface StationLocal {
  /** Distance along the wall (wall-local u). */
  u: number;
  /** Vertical offset above wall base (wall-local h). */
  h: number;
}

export interface DoorOptions {
  ogid?: string;
  labelName: string;
  type: ElementType.DOOR;
  hostWallId?: string;
  /**
   * Door center in the host wall's local frame.
   *   u — distance along the wall from its start
   *   h — vertical offset above wall base (typically 0 for doors)
   * v is always 0 (door sits centered on the wall plane).
   */
  stationLocal: StationLocal;
  panelDimensions: {
    width: number;
    thickness: number;
  };
  frameDimensions: {
    width: number;
    thickness: number;
  };
  doorType: DoorType;
  doorHeight: number;
  frameColor: number;
  panelMaterial: DoorMaterialType;
  doorColor: number;
  doorRotation: number;
  doorQuadrant: number;
  placement: Placement;
}

/**
 * Door IS an Opening — the hole it cuts in its host wall is carried on
 * `subElements2D/3D` at keys `ogid + '-2d'` and `ogid + '-3d'` (inherited
 * accessors `opening2D` / `opening3D` read those keys). Panel, frame, and
 * swing arc geometry are extra decoration attached alongside.
 */
export class Door extends Opening implements IShape {
  // @ts-ignore — Door's propertySet is DoorOptions (shaped differently than base OpeningOptions).
  propertySet: DoorOptions = {
    type: ElementType.DOOR,
    labelName: 'Simple Door',
    hostWallId: undefined,
    panelDimensions: {
      width: 1,
      thickness: 0.04,    // Standard door leaf thickness: 40 mm
    },
    frameDimensions: {
      width: 0.1,         // Standard frame/architrave width: 100 mm
      thickness: 0.15,    // Standard frame depth matching typical wall thickness
    },
    stationLocal: { u: 0, h: 0 },
    doorType: DoorType.WOOD,
    doorHeight: 2.1,
    doorColor: 0xF0EDE6,     // Off-white — standard painted door
    frameColor: 0xD4D0CB,    // Light warm gray — standard painted frame
    panelMaterial: DoorMaterialType.WOOD,
    doorRotation: 1.5,
    doorQuadrant: 1,
    placement: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
  };

  // Door overrides Opening's view state (doors are visible by default in both views).
  private _doorProfileView: boolean = true;
  private _doorModelView: boolean = true;
  private _doorOutlineEnabled: boolean = true;

  constructor(baseDoorConfig?: DoorOptions) {
    super();

    this.ogType = ElementType.DOOR;
    this.subElements2D = new Map<string, THREE.Object3D>();
    this.subElements3D = new Map<string, THREE.Object3D>();

    if (baseDoorConfig) {
      this.propertySet = {
        ...this.propertySet,
        ...baseDoorConfig,
      };
    }

    this.propertySet.ogid = this.ogid;
    this.setOPGeometry();
  }

  get outline() { return this._doorOutlineEnabled; }
  set outline(value: boolean) {
    this._doorOutlineEnabled = value;
    for (const obj of this.subElements2D.values()) {
      // @ts-ignore
      obj.outline = value;
    }
    for (const obj of this.subElements3D.values()) {
      // @ts-ignore
      obj.outline = value;
    }
  }

  get hostObject() {
    return this.propertySet.hostWallId || null;
  }
  set hostObject(value: string | null) {
    this.propertySet.hostWallId = value || undefined;
  }

  get station(): StationLocal { return this.propertySet.stationLocal; }
  set station(value: StationLocal) {
    this.propertySet.stationLocal = value;
    this.setOPGeometry();
  }

  get labelName() { return this.propertySet.labelName; }
  set labelName(value: string) { this.propertySet.labelName = value; }

  get hostWallId() { return this.propertySet.hostWallId; }
  set hostWallId(value: string | undefined) { this.propertySet.hostWallId = value; }

  set doorRotation(value: number) {
    this.propertySet.doorRotation = value;
  }

  set doorQuadrant(value: number) {
    if (value < 1 || value > 4) return;
    this.propertySet.doorQuadrant = value;
    this.setOPGeometry();
  }

  set panelWidth(value: number) {
    this.propertySet.panelDimensions.width = value;
    this.setOPGeometry();
  }
  get panelWidth() { return this.propertySet.panelDimensions.width; }

  set panelThickness(value: number) {
    this.propertySet.panelDimensions.thickness = value;
    this.setOPGeometry();
  }
  get panelThickness() { return this.propertySet.panelDimensions.thickness; }

  set doorHeight(value: number) {
    this.propertySet.doorHeight = value;
    this.setOPGeometry();
  }
  get doorHeight() { return this.propertySet.doorHeight; }

  set frameThickness(value: number) {
    this.propertySet.frameDimensions.thickness = value;
    this.setOPGeometry();
  }
  get frameThickness() { return this.propertySet.frameDimensions.thickness; }

  set frameWidth(value: number) {
    this.propertySet.frameDimensions.width = value;
    this.setOPGeometry();
  }
  get frameWidth() { return this.propertySet.frameDimensions.width; }

  set doorColor(value: number) {
    this.propertySet.doorColor = value;
    this.setOPMaterial();
  }
  get doorColor() { return this.propertySet.doorColor; }

  set frameColor(value: number) {
    this.propertySet.frameColor = value;
    this.setOPMaterial();
  }
  get frameColor() { return this.propertySet.frameColor; }

  set profileView(value: boolean) {
    this._doorProfileView = value;
    for (const [key, obj] of this.subElements2D.entries()) {
      if (key === this.ogid + '-2d') {
        obj.visible = false; // The hole polygon is used for CSG only; never visible.
      } else {
        obj.visible = value;
      }
    }
  }
  get profileView() { return this._doorProfileView; }

  set modelView(value: boolean) {
    this._doorModelView = value;
    for (const [key, obj] of this.subElements3D.entries()) {
      if (key === this.ogid + '-3d') {
        obj.visible = false; // The hole solid is used for CSG only; never visible.
      } else {
        obj.visible = value;
      }
    }
  }
  get modelView() { return this._doorModelView; }

  /** Door IS the opening — return self. Kept for back-compat with wall attachers. */
  get opening(): Opening {
    return this;
  }

  // @ts-ignore — returning DoorOptions where Opening returns OpeningOptions.
  getOPConfig(): DoorOptions {
    return this.propertySet;
  }

  // @ts-ignore — accepting DoorOptions where Opening accepts OpeningOptions.
  setOPConfig(config: DoorOptions): void {
    this.propertySet = { ...this.propertySet, ...config };
    this.setOPGeometry();
    this.setOPMaterial();
  }

  dispose() {
    for (const obj of this.subElements2D.values()) {
      this.disposeObject(obj);
    }
    for (const obj of this.subElements3D.values()) {
      this.disposeObject(obj);
    }
    this.subElements2D.clear();
    this.subElements3D.clear();
    this.discardGeometry();
  }

  private disposeObject(obj: THREE.Object3D): void {
    obj.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else if (mesh.material) {
        mesh.material.dispose();
      }
    });
    obj.removeFromParent();
  }

  /**
   * Transform a wall-local (u, v, h) point to world coordinates.
   * If no host frame is bound, use an identity frame (u→x, h→y, v→z)
   * so an unhosted door still renders sensibly in world space.
   */
  private worldFromLocal(u: number, v: number, h: number): Vector3 {
    const frame = this.hostFrame;
    if (!frame) {
      return new Vector3(u, h, v);
    }
    return localToWorld(frame, u, v, h);
  }

  /**
   * Override of Opening.setOPGeometry. We build:
   *   - The hole polygon/solid at keys `ogid + '-2d'` and `ogid + '-3d'` (what CSG subtracts)
   *   - Panel, frame, swing arc under keys 'panel', 'frame', 'swingArc'
   * Everything is computed in wall-local (u, v, h) and transformed via worldFromLocal.
   */
  setOPGeometry(): void {
    // Guard: when super() is running, this.propertySet is still Opening's defaults
    // (DoorOptions fields not yet initialized). Skip; Door constructor calls us again.
    if (!this.propertySet?.panelDimensions) {
      return;
    }

    this.dispose();

    this.buildHole();
    this.build3D();
    this.build2D();

    this.outline = this._doorOutlineEnabled;
    this.profileView = this._doorProfileView;
    this.modelView = this._doorModelView;

    this.onOpeningUpdated.trigger(null);
  }

  /**
   * Build the hole (what gets subtracted from the wall).
   * A rectangular slab centered on stationLocal.u, spanning:
   *   u:  [u - halfTotalWidth, u + halfTotalWidth]
   *   v:  [-frameThickness/2, +frameThickness/2]   (wall thickness direction)
   *   h:  [stationLocal.h, stationLocal.h + totalHeight]
   */
  private buildHole(): void {
    const { panelDimensions, frameDimensions, doorHeight, stationLocal } = this.propertySet;
    const tol = 0.001;
    const halfTotalWidth = panelDimensions.width / 2 + frameDimensions.width + tol;
    const totalHeight = doorHeight + frameDimensions.width + tol;
    const halfThickness = frameDimensions.thickness / 2 + tol;

    const u0 = stationLocal.u - halfTotalWidth;
    const u1 = stationLocal.u + halfTotalWidth;
    const h0 = stationLocal.h;

    const footprint: Vector3[] = [
      this.worldFromLocal(u0, -halfThickness, h0),
      this.worldFromLocal(u1, -halfThickness, h0),
      this.worldFromLocal(u1, +halfThickness, h0),
      this.worldFromLocal(u0, +halfThickness, h0),
    ];

    const polygon = new Polygon({
      ogid: this.ogid + '-2d',
      vertices: footprint,
      color: 0xffcccc,
    });
    polygon.outline = false;
    this.subElements2D.set(polygon.ogid, polygon);
    this.add(polygon);

    const solid = polygon.extrude(totalHeight);
    solid.ogid = this.ogid + '-3d';
    this.subElements3D.set(solid.ogid, solid);
    this.add(solid);
  }

  private build3D(): void {
    const { panelDimensions, frameDimensions, doorHeight, doorColor, frameColor, stationLocal } = this.propertySet;
    const halfPanelWidth = panelDimensions.width / 2;
    const frameWidth = frameDimensions.width;
    const frameThickness = frameDimensions.thickness;

    const u = stationLocal.u;
    const h = stationLocal.h;

    // ── Frame: U-shaped sweep (left jamb → head → right jamb) ──────────────
    // Profile is a rectangular cross-section (frameWidth × frameThickness).
    const frameProfile = [
      this.worldFromLocal(-frameWidth / 2, -frameThickness / 2, 0),
      this.worldFromLocal(-frameWidth / 2, +frameThickness / 2, 0),
      this.worldFromLocal(+frameWidth / 2, +frameThickness / 2, 0),
      this.worldFromLocal(+frameWidth / 2, -frameThickness / 2, 0),
      this.worldFromLocal(-frameWidth / 2, -frameThickness / 2, 0),
    ];

    const frameSweep = new Sweep({
      path: [
        this.worldFromLocal(u - halfPanelWidth - frameWidth / 2, 0, h),
        this.worldFromLocal(u - halfPanelWidth - frameWidth / 2, 0, h + doorHeight + frameWidth / 2),
        this.worldFromLocal(u + halfPanelWidth + frameWidth / 2, 0, h + doorHeight + frameWidth / 2),
        this.worldFromLocal(u + halfPanelWidth + frameWidth / 2, 0, h),
      ],
      profile: frameProfile,
      color: frameColor,
    });

    this.subElements3D.set('frame', frameSweep);
    this.add(frameSweep);

    // ── Door stop: thin bead running along the panel-face of the frame ──────
    // Sits proud of the frame face at v = 0 (wall plane), preventing the panel
    // from swinging past the frame. Standard dimensions: 38 mm wide, 12 mm deep.
    const stopW = 0.038;
    const stopD = 0.012;

    const stopProfile = [
      this.worldFromLocal(-stopW / 2, -stopD / 2, 0),
      this.worldFromLocal(-stopW / 2, +stopD / 2, 0),
      this.worldFromLocal(+stopW / 2, +stopD / 2, 0),
      this.worldFromLocal(+stopW / 2, -stopD / 2, 0),
      this.worldFromLocal(-stopW / 2, -stopD / 2, 0),
    ];

    const stopSweep = new Sweep({
      path: [
        this.worldFromLocal(u - halfPanelWidth, 0, h),
        this.worldFromLocal(u - halfPanelWidth, 0, h + doorHeight),
        this.worldFromLocal(u + halfPanelWidth, 0, h + doorHeight),
        this.worldFromLocal(u + halfPanelWidth, 0, h),
      ],
      profile: stopProfile,
      color: frameColor,
    });

    this.subElements3D.set('stop', stopSweep);
    this.add(stopSweep);

    // ── Door panel: flat leaf, shown in closed (plumb) position ─────────────
    const panelCenter = this.worldFromLocal(u, 0, h + doorHeight / 2);
    const panelCuboid = new Cuboid({
      center: panelCenter,
      width: panelDimensions.width,
      height: doorHeight,
      depth: panelDimensions.thickness,
      color: doorColor,
    });

    this.subElements3D.set('panel', panelCuboid);
    this.add(panelCuboid);
  }

  private build2D(): void {
    const { panelDimensions, frameDimensions, stationLocal, doorQuadrant } = this.propertySet;
    const halfPanelWidth = panelDimensions.width / 2;
    const frameWidth = frameDimensions.width;
    const halfT = frameDimensions.thickness / 2;
    const u = stationLocal.u;
    const h = stationLocal.h;
    const q = doorQuadrant;

    // ── Frame jambs: filled rectangles at each side of the opening ──────────
    const frameLeftPolygon = new Polygon({
      vertices: [
        this.worldFromLocal(u - halfPanelWidth - frameWidth, -halfT, h),
        this.worldFromLocal(u - halfPanelWidth - frameWidth, +halfT, h),
        this.worldFromLocal(u - halfPanelWidth,              +halfT, h),
        this.worldFromLocal(u - halfPanelWidth,              -halfT, h),
      ],
      color: this.propertySet.frameColor,
    });

    const frameRightPolygon = new Polygon({
      vertices: [
        this.worldFromLocal(u + halfPanelWidth + frameWidth, -halfT, h),
        this.worldFromLocal(u + halfPanelWidth + frameWidth, +halfT, h),
        this.worldFromLocal(u + halfPanelWidth,              +halfT, h),
        this.worldFromLocal(u + halfPanelWidth,              -halfT, h),
        this.worldFromLocal(u + halfPanelWidth + frameWidth, -halfT, h),
      ],
      color: this.propertySet.frameColor,
    });

    const frameGroup = new THREE.Group();
    frameGroup.add(frameLeftPolygon);
    frameGroup.add(frameRightPolygon);

    this.subElements2D.set('frame', frameGroup);
    this.add(frameGroup);

    // ── Door panel: shown in OPEN position (90° to wall) from hinge ─────────
    // Q1/Q3 → hinge on left;  Q2/Q4 → hinge on right.
    // Q1/Q2 → opens in +v direction;  Q3/Q4 → opens in -v direction.
    const hingeU = (q === 1 || q === 3) ? u - halfPanelWidth : u + halfPanelWidth;
    const vSign  = (q === 1 || q === 2) ? 1 : -1;
    const halfPT = panelDimensions.thickness / 2;

    const panelPolygon = new Polygon({
      vertices: [
        this.worldFromLocal(hingeU - halfPT, 0,                              h),
        this.worldFromLocal(hingeU + halfPT, 0,                              h),
        this.worldFromLocal(hingeU + halfPT, vSign * panelDimensions.width,  h),
        this.worldFromLocal(hingeU - halfPT, vSign * panelDimensions.width,  h),
      ],
      color: this.propertySet.doorColor,
    });

    this.subElements2D.set('panel', panelPolygon);
    this.add(panelPolygon);

    // ── Swing arc: quarter-circle tracing the door's sweep path ─────────────
    // Angles are in the horizontal (XZ) plane, measured from +X counterclockwise
    // (standard math convention, consistent with opengeometry Arc).
    //
    // For an unhosted door: u→X, v→+Z  → vAngle = π/2, wallAngle = 0.
    // For a wall-hosted door: angles derived from the wall's local frame axes.
    const frame = this.hostFrame;
    const wallAngle = frame
      ? Math.atan2(frame.uAxis.z, frame.uAxis.x)
      : 0;
    const vAngle = frame
      ? Math.atan2(frame.vAxis.z, frame.vAxis.x)
      : Math.PI / 2;

    // Direction from hinge toward panel handle (the "closed" end of the arc).
    const closedAngle = (q === 2 || q === 4) ? wallAngle + Math.PI : wallAngle;
    // Direction from hinge perpendicular to wall (the "open" end of the arc).
    const openAngle   = (q === 3 || q === 4) ? vAngle   + Math.PI : vAngle;

    // Choose start/end so the arc is always a counterclockwise π/2 sweep.
    const diff = ((openAngle - closedAngle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    let arcStart: number;
    let arcEnd: number;
    if (Math.abs(diff - Math.PI / 2) < 0.01) {
      arcStart = closedAngle;
      arcEnd   = closedAngle + Math.PI / 2;
    } else {
      arcStart = openAngle;
      arcEnd   = openAngle + Math.PI / 2;
    }

    const swingArc = new Arc({
      center: this.worldFromLocal(hingeU, 0, h),
      radius: panelDimensions.width,
      startAngle: arcStart,
      endAngle:   arcEnd,
      color: 0x606060,   // Neutral gray — industry-standard swing indicator
      segments: 32,
    });

    this.subElements2D.set('swingArc', swingArc);
    this.add(swingArc);
  }

  setOPMaterial(): void {
    const { doorColor, frameColor } = this.propertySet;

    const frameGroup2D = this.subElements2D.get('frame') as THREE.Group | undefined;
    if (frameGroup2D) {
      const leftFrame  = frameGroup2D.children[0] as Polygon | undefined;
      const rightFrame = frameGroup2D.children[1] as Polygon | undefined;
      if (leftFrame)  leftFrame.color  = frameColor;
      if (rightFrame) rightFrame.color = frameColor;
    }

    const panel2D = this.subElements2D.get('panel') as Polygon | undefined;
    if (panel2D) panel2D.color = doorColor;

    // Swing arc stays neutral gray regardless of user color (architectural convention).

    const frame3D = this.subElements3D.get('frame') as Sweep | undefined;
    if (frame3D) frame3D.color = frameColor;

    const stop3D = this.subElements3D.get('stop') as Sweep | undefined;
    if (stop3D) stop3D.color = frameColor;

    const panel3D = this.subElements3D.get('panel') as Cuboid | undefined;
    if (panel3D) panel3D.color = doorColor;
  }
}
