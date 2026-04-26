import * as THREE from "three";
import { IShape } from "../../shapes/base-type";
import { ElementType, DoorType } from "./../base-type";
import { Arc, Polygon, Solid, Sweep, Vector3 } from "opengeometry";
import type { Placement, PlanExportView, PlanVectorExportable } from "../../types";
import { Opening } from "./opening";
import { WallFrame, localToWorld } from "../solids/wall-frame";

export type ElementViewType = 'plan' | '3d';
export type SubElementType = 'frame' | 'finish' | 'swingArc' | 'panel';
type Door2DSubElementType = 'frame' | 'panelPivot' | 'panel' | 'swingArc' | 'door-opening';
type Door3DSubElementType = 'frame' | 'panelPivot' | 'panel' | 'door-opening';
export type DoorQuandrant = 1 | 2 | 3 | 4;

export enum DoorMaterialType {
  WOOD = 'WOOD',
  GLASS = 'GLASS',
  METAL = 'METAL',
  OTHER = 'OTHER',
}

export interface StationLocal {
  /** Distance along the wall from its start point. */
  alongWall: number;
  /** Vertical offset above the wall's base (typically 0 for doors). */
  elevation: number;
}

export interface DoorOptions {
  ogid?: string;
  labelName: string;
  type: ElementType.DOOR;
  hostWallId?: string;
  /**
   * Door insertion point in the host wall's local frame.
   *   alongWall — distance along the wall from its start
   *   elevation — vertical offset above wall base (typically 0)
   * The across-wall offset is always 0 (door sits centered on the wall plane).
   */
  stationLocal: StationLocal;
  panelDimensions: {
    width: number;
    thickness: number;
  };
  /**
   * Frame (door lining) dimensions.
   *   width      — the visible face of the lining along the wall
   *   thickness  — across-wall depth, used only when the door is unhosted.
   *                When hosted, the lining depth auto-matches the host wall's
   *                thickness so the lining fills the opening front-to-back.
   */
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
  /**
   * How far the panel is swung open, in degrees.
   *   0  — closed (panel lies along the wall, in the opening plane)
   *   90 — fully open (panel perpendicular to the wall)
   * Applied in both 2D plan view and 3D. The swing arc in plan view
   * always shows the full 90° range regardless of this value.
   */
  swingAngleDegrees: number;
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
      width: 0.05,        // Visible face of the lining: 50 mm
      thickness: 0.15,    // Across-wall depth fallback for unhosted doors
    },
    stationLocal: { alongWall: 0, elevation: 0 },
    doorType: DoorType.WOOD,
    doorHeight: 2.1,
    doorColor: 0xF0EDE6,     // Off-white — standard painted door
    frameColor: 0xD4D0CB,    // Light warm gray — standard painted frame
    panelMaterial: DoorMaterialType.WOOD,
    doorRotation: 1.5,
    doorQuadrant: 1,
    swingAngleDegrees: 90,   // Default to fully open; matches the plan-view convention.
    placement: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
  };

  // Door overrides Opening's view state (doors are visible by default in both views).
  private _doorProfileView: boolean = true;
  private _doorModelView: boolean = true;

  // Profile View Outline is enabled. Only Model View Outline is toggleable via the `outline` property; it is enabled by default.
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

    // Door positions itself with `station` (single insertion point), not start/end.
    // The inherited Line setters from Opening would mutate propertySet.points
    // without affecting the rendered door, which is misleading. Replace them
    // with no-op getters/setters that warn once. Done via defineProperty so
    // we don't trigger the accessor-variance issue with TS class inheritance.
    let warningEmitted = false;
    const warnAndIgnore = () => {
      if (!warningEmitted) {
        console.warn(
          "Door.start / Door.end are read-only. Use `door.station = { alongWall, elevation }` to position the door.",
        );
        warningEmitted = true;
      }
    };
    Object.defineProperty(this, 'start', {
      configurable: true,
      get: () => {
        const { stationLocal, panelDimensions } = this.propertySet;
        return [stationLocal.alongWall - panelDimensions.width / 2, 0, stationLocal.elevation];
      },
      set: warnAndIgnore,
    });
    Object.defineProperty(this, 'end', {
      configurable: true,
      get: () => {
        const { stationLocal, panelDimensions } = this.propertySet;
        return [stationLocal.alongWall + panelDimensions.width / 2, 0, stationLocal.elevation];
      },
      set: warnAndIgnore,
    });

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
  get doorQuadrant() { return this.propertySet.doorQuadrant; }

  set swingAngleDegrees(value: number) {
    const clamped = Math.max(0, Math.min(180, value));
    this.propertySet.swingAngleDegrees = clamped;
    this.setOPGeometry();
  }
  get swingAngleDegrees() { return this.propertySet.swingAngleDegrees; }

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
      if (key === this.ogid + '-3d' || key === 'panel-base' || key === 'hole-base-3d') {
        // Hole solid (CSG-only), panel-base (panel extrusion seed), and
        // hole-base-3d (hole extrusion seed) never render.
        obj.visible = false;
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
   * Transform a wall-local (alongWall, acrossWall, elevation) point to world
   * coordinates. If no host frame is bound, use an identity frame
   * (alongWall→x, elevation→y, acrossWall→z) so an unhosted door still
   * renders sensibly in world space.
   */
  private worldFromLocal(alongWall: number, acrossWall: number, elevation: number): Vector3 {
    const frame = this.hostFrame;
    if (!frame) {
      return new Vector3(alongWall, elevation, acrossWall);
    }
    return localToWorld(frame, alongWall, acrossWall, elevation);
  }

  /**
   * Resolve the across-wall depth used for the lining and the cut hole.
   * When hosted, this is the host wall's thickness (so the lining exactly
   * fills the opening front-to-back). When unhosted, fall back to the
   * `frameDimensions.thickness` field.
   */
  private resolveWallThickness(): number {
    return this.hostFrame?.thickness ?? this.propertySet.frameDimensions.thickness;
  }

  /**
   * Compute the panel's hinge anchor and rotated local axes in wall-local
   * (alongWall, acrossWall) coordinates for the current quadrant + swing angle.
   *
   * The panel is treated as a rectangle pivoting around a vertical axis at
   * the hinge anchor. The anchor sits at the inside corner of the jamb on
   * the swing-out face of the wall, so:
   *   - At swing 0° (closed): the panel lies in the wall thickness, parallel
   *     to the wall axis.
   *   - At swing 90° (open):  the panel sits perpendicular to the wall, its
   *     thickness extending into the opening (NOT into the jamb), and its
   *     width extending out into the room on the swing side.
   *
   * Returns the anchor + the panel's local axes in wall-local space:
   *   xAxis = panel "width" direction (from hinge corner toward the handle)
   *   yAxis = panel "thickness" direction (perpendicular to xAxis, on the
   *           non-swing side at swing 0°, on the open-into-opening side at 90°)
   * The four panel corners are derived by:
   *   corner0 = anchor                                          (hinge corner)
   *   corner1 = anchor + panelWidth     × xAxis                 (far hinge edge)
   *   corner2 = anchor + panelWidth × xAxis + panelThickness × yAxis
   *   corner3 = anchor + panelThickness × yAxis                 (anchor opposite face)
   */
  private computePanelAnchorAndAxes(swingRadians: number): {
    anchorAlongWall:  number;
    anchorAcrossWall: number;
    xAxisAlongWall:   number;
    xAxisAcrossWall:  number;
    yAxisAlongWall:   number;
    yAxisAcrossWall:  number;
  } {
    const { panelDimensions, stationLocal, doorQuadrant } = this.propertySet;
    const halfPanelWidth    = panelDimensions.width / 2;
    const wallThickness     = this.resolveWallThickness();
    const halfWallThickness = wallThickness / 2;

    // Hinge along-wall position: the inner edge of the chosen jamb.
    //   Q1, Q3 → hinge on the LEFT jamb  (alongWall = station − halfPanelWidth)
    //   Q2, Q4 → hinge on the RIGHT jamb (alongWall = station + halfPanelWidth)
    const hingeOnLeft = doorQuadrant === 1 || doorQuadrant === 3;
    const anchorAlongWall = hingeOnLeft
      ? stationLocal.alongWall - halfPanelWidth
      : stationLocal.alongWall + halfPanelWidth;

    // Hinge across-wall position: the wall face on the SWING-OUT side.
    //   Q1, Q2 swing toward +acrossWall → hinge sits at +halfWallThickness
    //   Q3, Q4 swing toward −acrossWall → hinge sits at −halfWallThickness
    const swingFaceSign = (doorQuadrant === 1 || doorQuadrant === 2) ? +1 : -1;
    const anchorAcrossWall = swingFaceSign * halfWallThickness;

    // Closed-position panel-X angle (in the wall-local floor plane,
    // measured CCW from +alongWall):
    //   Q1, Q3 (hinge left)  → X points +alongWall when closed → angle 0
    //   Q2, Q4 (hinge right) → X points −alongWall when closed → angle π
    const closedXAngle = (doorQuadrant === 2 || doorQuadrant === 4) ? Math.PI : 0;

    // Rotation direction the panel sweeps as swingRadians grows from 0 → π/2:
    //   Q1, Q4 → CCW (rotationSign = +1) so the panel-thickness corner moves
    //            into the opening (not back into the jamb).
    //   Q2, Q3 → CW  (rotationSign = −1) for the same reason on the mirrored hand.
    const rotationSign = (doorQuadrant === 1 || doorQuadrant === 4) ? +1 : -1;

    const panelXAngle = closedXAngle + rotationSign * swingRadians;
    const xAxisAlongWall  = Math.cos(panelXAngle);
    const xAxisAcrossWall = Math.sin(panelXAngle);

    // yAxis = xAxis rotated by (−rotationSign × π/2) — keeps the panel-Y axis
    // pointing AWAY from the jamb so the panel-thickness corner ends up inside
    // the opening at swing 90°. Derived by trig identity from the rotation:
    //   yAxisAlongWall  =  rotationSign · sin(panelXAngle)
    //   yAxisAcrossWall = −rotationSign · cos(panelXAngle)
    const yAxisAlongWall  =  rotationSign * Math.sin(panelXAngle);
    const yAxisAcrossWall = -rotationSign * Math.cos(panelXAngle);

    return {
      anchorAlongWall, anchorAcrossWall,
      xAxisAlongWall,  xAxisAcrossWall,
      yAxisAlongWall,  yAxisAcrossWall,
    };
  }

  /**
   * Return the panel's four floor-plane corners in CCW winding (in the
   * right-handed (alongWall, acrossWall) plane viewed from above), in
   * wall-local coordinates, for a given swing angle.
   *
   * opengeometry's Polygon expects CCW input to produce an outward-facing
   * normal. The natural corner order anchor → +X → +X+Y → +Y is CCW only
   * when (X, Y) form a right-handed basis. For Q1/Q4 the basis is left-
   * handed (Y is CW from X), so we swap c1 and c3 to recover CCW winding.
   */
  private computePanelCornersCCW(swingRadians: number): Array<[number, number]> {
    const panel = this.computePanelAnchorAndAxes(swingRadians);
    const { panelDimensions, doorQuadrant } = this.propertySet;
    const widthValue     = panelDimensions.width;
    const thicknessValue = panelDimensions.thickness;

    const corner0: [number, number] = [
      panel.anchorAlongWall,
      panel.anchorAcrossWall,
    ];
    const cornerXOnly: [number, number] = [
      panel.anchorAlongWall  + panel.xAxisAlongWall  * widthValue,
      panel.anchorAcrossWall + panel.xAxisAcrossWall * widthValue,
    ];
    const cornerXY: [number, number] = [
      panel.anchorAlongWall  + panel.xAxisAlongWall  * widthValue + panel.yAxisAlongWall  * thicknessValue,
      panel.anchorAcrossWall + panel.xAxisAcrossWall * widthValue + panel.yAxisAcrossWall * thicknessValue,
    ];
    const cornerYOnly: [number, number] = [
      panel.anchorAlongWall  + panel.yAxisAlongWall  * thicknessValue,
      panel.anchorAcrossWall + panel.yAxisAcrossWall * thicknessValue,
    ];

    const yIsCWFromX = doorQuadrant === 1 || doorQuadrant === 4;
    return yIsCWFromX
      ? [corner0, cornerYOnly, cornerXY, cornerXOnly]   // CCW for left-handed (X,Y)
      : [corner0, cornerXOnly, cornerXY, cornerYOnly];  // CCW for right-handed (X,Y)
  }

  /**
   * Override of Opening.setOPGeometry. We build:
   *   - The hole polygon/solid at keys `ogid + '-2d'` and `ogid + '-3d'` (what CSG subtracts)
   *   - Panel, frame, swing arc under keys 'panel', 'frame', 'swingArc'
   * Everything is computed in wall-local (alongWall, acrossWall, elevation)
   * and transformed via worldFromLocal.
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
   * A rectangular slab centered on the door station, spanning:
   *   alongWall:  [station - halfTotalWidth, station + halfTotalWidth]
   *   acrossWall: [-halfWallThickness, +halfWallThickness]
   *   elevation:  [station.elevation, station.elevation + totalHeight]
   *
   * Two polygons are built so the same hole drives both CSG passes correctly:
   *   - The `'-2d'` polygon lives at floor elevation (0) so it is coplanar
   *     with the wall's floor polygon for 2D boolean subtraction.
   *   - A separate 3D-base polygon lives at the hole's actual base elevation
   *     and is extruded vertically into the `'-3d'` solid that gets
   *     subtracted from the wall's volume.
   */
  private buildHole(): void {
    const { panelDimensions, frameDimensions, doorHeight, stationLocal } = this.propertySet;
    const tolerance = 0.001;
    const wallThickness = this.resolveWallThickness();

    const halfTotalWidthAlongWall = panelDimensions.width / 2 + frameDimensions.width + tolerance;
    const totalHeightElevation    = doorHeight + frameDimensions.width + tolerance;
    const halfWallThicknessSlab   = wallThickness / 2 + tolerance;

    const startAlongWall = stationLocal.alongWall - halfTotalWidthAlongWall;
    const endAlongWall   = stationLocal.alongWall + halfTotalWidthAlongWall;
    const baseElevation  = stationLocal.elevation;

    // ── 2D footprint at floor level (coplanar with the wall) ─────────────────
    const footprint2D: Vector3[] = [
      this.worldFromLocal(startAlongWall, -halfWallThicknessSlab, 0),
      this.worldFromLocal(endAlongWall,   -halfWallThicknessSlab, 0),
      this.worldFromLocal(endAlongWall,   +halfWallThicknessSlab, 0),
      this.worldFromLocal(startAlongWall, +halfWallThicknessSlab, 0),
    ];
    const polygon2D = new Polygon({
      ogid: this.ogid + '-2d',
      vertices: footprint2D,
      color: 0xffcccc,
    });
    polygon2D.outline = false;
    this.subElements2D.set(polygon2D.ogid, polygon2D);
    this.add(polygon2D);

    // ── 3D extrusion seed at the hole's actual base elevation ───────────────
    const footprint3D: Vector3[] = [
      this.worldFromLocal(startAlongWall, -halfWallThicknessSlab, baseElevation),
      this.worldFromLocal(endAlongWall,   -halfWallThicknessSlab, baseElevation),
      this.worldFromLocal(endAlongWall,   +halfWallThicknessSlab, baseElevation),
      this.worldFromLocal(startAlongWall, +halfWallThicknessSlab, baseElevation),
    ];
    const polygon3DBase = new Polygon({
      vertices: footprint3D,
      color: 0xffcccc,
    });
    polygon3DBase.outline = false;
    polygon3DBase.visible = false;     // never rendered; just an extrusion seed.
    this.subElements3D.set('hole-base-3d', polygon3DBase);
    this.add(polygon3DBase);

    const solid = polygon3DBase.extrude(totalHeightElevation);
    solid.ogid = this.ogid + '-3d';
    this.subElements3D.set(solid.ogid, solid);
    this.add(solid);
  }

  private build3D(): void {
    const {
      panelDimensions, frameDimensions, doorHeight, doorColor, frameColor,
      stationLocal,
    } = this.propertySet;

    const halfPanelWidth     = panelDimensions.width / 2;
    const frameVisibleWidth  = frameDimensions.width;
    const wallThickness      = this.resolveWallThickness();
    const halfWallThickness  = wallThickness / 2;

    const stationAlongWall   = stationLocal.alongWall;
    const stationElevation   = stationLocal.elevation;

    // ── Frame: single U-sweep (left jamb → head → right jamb) ────────────────
    // Profile is a rectangle: visible-face-width (along-wall) × wall-thickness
    // (across-wall), so the lining exactly fills the opening front-to-back.
    const frameProfile = [
      this.worldFromLocal(-frameVisibleWidth / 2, -halfWallThickness, 0),
      this.worldFromLocal(-frameVisibleWidth / 2, +halfWallThickness, 0),
      this.worldFromLocal(+frameVisibleWidth / 2, +halfWallThickness, 0),
      this.worldFromLocal(+frameVisibleWidth / 2, -halfWallThickness, 0),
      this.worldFromLocal(-frameVisibleWidth / 2, -halfWallThickness, 0),
    ];

    const leftJambAlongWall  = stationAlongWall - halfPanelWidth - frameVisibleWidth / 2;
    const rightJambAlongWall = stationAlongWall + halfPanelWidth + frameVisibleWidth / 2;
    const headElevation      = stationElevation + doorHeight + frameVisibleWidth / 2;

    const frameSweep = new Sweep({
      path: [
        this.worldFromLocal(leftJambAlongWall,  0, stationElevation),
        this.worldFromLocal(leftJambAlongWall,  0, headElevation),
        this.worldFromLocal(rightJambAlongWall, 0, headElevation),
        this.worldFromLocal(rightJambAlongWall, 0, stationElevation),
      ],
      profile: frameProfile,
      color: frameColor,
    });

    this.subElements3D.set('frame', frameSweep);
    this.add(frameSweep);

    // ── Panel: rectangle pivoting around the hinge anchor ────────────────────
    // We build the panel's floor footprint (using the anchor + axes helper) and
    // extrude it vertically by doorHeight. The polygon vertices already encode
    // the swing rotation, so the resulting solid is correctly oriented at any
    // swingAngleDegrees value — no Three.js rotation needed.
    const swingRadians = (this.propertySet.swingAngleDegrees ?? 90) * Math.PI / 180;
    const panelFootprint: Vector3[] = this.computePanelCornersCCW(swingRadians).map(
      ([alongWall, acrossWall]) =>
        this.worldFromLocal(alongWall, acrossWall, stationElevation),
    );

    const panelBasePolygon = new Polygon({
      ogid:     this.ogid + '-panel-base',
      vertices: panelFootprint,
      color:    doorColor,
    });
    panelBasePolygon.outline = false;
    panelBasePolygon.visible = false;     // base polygon is just an extrusion seed; never rendered.
    this.subElements3D.set('panel-base', panelBasePolygon);
    this.add(panelBasePolygon);

    const panelSolid = panelBasePolygon.extrude(doorHeight);
    panelSolid.ogid = this.ogid + '-panel';
    this.subElements3D.set('panel', panelSolid);
    this.add(panelSolid);
  }

  private build2D(): void {
    const { panelDimensions, frameDimensions, stationLocal, doorQuadrant } = this.propertySet;
    const halfPanelWidth     = panelDimensions.width / 2;
    const frameVisibleWidth  = frameDimensions.width;
    const wallThickness      = this.resolveWallThickness();
    const halfWallThickness  = wallThickness / 2;

    const stationAlongWall = stationLocal.alongWall;
    const stationElevation = stationLocal.elevation;
    const quadrant = doorQuadrant;

    // ── Frame jambs: filled rectangles on each side of the opening ──────────
    // Plan view shows the lining as two jamb cross-sections at floor level
    // (the head sits up at door height and is not in the floor cut plane).
    const frameLeftPolygon = new Polygon({
      vertices: [
        this.worldFromLocal(stationAlongWall - halfPanelWidth - frameVisibleWidth, -halfWallThickness, stationElevation),
        this.worldFromLocal(stationAlongWall - halfPanelWidth - frameVisibleWidth, +halfWallThickness, stationElevation),
        this.worldFromLocal(stationAlongWall - halfPanelWidth,                     +halfWallThickness, stationElevation),
        this.worldFromLocal(stationAlongWall - halfPanelWidth,                     -halfWallThickness, stationElevation),
      ],
      color: this.propertySet.frameColor,
    });

    const frameRightPolygon = new Polygon({
      vertices: [
        this.worldFromLocal(stationAlongWall + halfPanelWidth + frameVisibleWidth, -halfWallThickness, stationElevation),
        this.worldFromLocal(stationAlongWall + halfPanelWidth + frameVisibleWidth, +halfWallThickness, stationElevation),
        this.worldFromLocal(stationAlongWall + halfPanelWidth,                     +halfWallThickness, stationElevation),
        this.worldFromLocal(stationAlongWall + halfPanelWidth,                     -halfWallThickness, stationElevation),
      ],
      color: this.propertySet.frameColor,
    });

    const frameGroup = new THREE.Group();
    frameGroup.add(frameLeftPolygon);
    frameGroup.add(frameRightPolygon);

    this.subElements2D.set('frame', frameGroup);
    this.add(frameGroup);

    // ── Door panel: rectangle pivoting around the hinge anchor ──────────────
    // Anchor at the inside corner of the chosen jamb on the swing-out face of
    // the wall. The four corners come from `computePanelCornersCCW`, which
    // ensures the panel always extends INTO the opening (never back into the
    // jamb) at any swing angle from 0 (closed) through 90° (fully open).
    const swingRadians = (this.propertySet.swingAngleDegrees ?? 90) * Math.PI / 180;
    const panel = this.computePanelAnchorAndAxes(swingRadians);

    const panelPolygon = new Polygon({
      vertices: this.computePanelCornersCCW(swingRadians).map(
        ([alongWall, acrossWall]) =>
          this.worldFromLocal(alongWall, acrossWall, stationElevation),
      ),
      color: this.propertySet.doorColor,
    });

    this.subElements2D.set('panel', panelPolygon);
    this.add(panelPolygon);

    // ── Swing arc: quarter-circle tracing the door's full 0→90° sweep ───────
    // Always rendered for the full architectural 90° range, regardless of the
    // current swingAngleDegrees value (so users can see the door's footprint).
    // Angles are in the horizontal (XZ) plane, measured from +X counterclockwise
    // (standard math convention, consistent with opengeometry Arc).
    //
    // For an unhosted door: alongWall→X, acrossWall→+Z → acrossWallAngle = π/2,
    // wallAngle = 0. For a wall-hosted door: angles derived from the wall frame.
    const frame = this.hostFrame;
    const wallAngle = frame
      ? Math.atan2(frame.alongWallAxis.z, frame.alongWallAxis.x)
      : 0;
    const acrossWallAngle = frame
      ? Math.atan2(frame.acrossWallAxis.z, frame.acrossWallAxis.x)
      : Math.PI / 2;

    // Direction from anchor toward panel handle when CLOSED (panel-X at 0°).
    const arcClosedAngle = (quadrant === 2 || quadrant === 4) ? wallAngle + Math.PI : wallAngle;
    // Direction from anchor toward panel handle when OPEN (panel-X at 90°).
    const arcOpenAngle   = (quadrant === 3 || quadrant === 4) ? acrossWallAngle + Math.PI : acrossWallAngle;

    // Choose start/end so the arc is always a counterclockwise π/2 sweep.
    const angleDifference = ((arcOpenAngle - arcClosedAngle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    let arcStart: number;
    let arcEnd: number;
    if (Math.abs(angleDifference - Math.PI / 2) < 0.01) {
      arcStart = arcClosedAngle;
      arcEnd   = arcClosedAngle + Math.PI / 2;
    } else {
      arcStart = arcOpenAngle;
      arcEnd   = arcOpenAngle + Math.PI / 2;
    }

    const swingArc = new Arc({
      center: this.worldFromLocal(panel.anchorAlongWall, panel.anchorAcrossWall, stationElevation),
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

    const panel3D = this.subElements3D.get('panel') as Solid | undefined;
    if (panel3D) panel3D.color = doorColor;
  }
}
