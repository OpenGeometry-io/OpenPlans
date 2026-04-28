import * as THREE from "three";
import { IShape } from "../../shapes/base-type";
import { ElementType, DoorType } from "./../base-type";
import { Arc, Polygon, Solid, Sweep, Vector3 } from "opengeometry";
import type { Placement } from "../../types";
import { Opening } from "./opening";
import { localToWorld } from "../solids/wall-frame";

// 1 µm inset keeps hole edges strictly inside the wall boundary.
// Without this, hole edges coincide exactly with the outer polygon's face edges
// when an opening is fully contained within a wall segment, causing the WASM
// polygon-with-holes triangulator to produce empty/incorrect 2D geometry.
const HOLE_2D_TOLERANCE = 1e-6;

export enum DoorMaterialType {
  WOOD = 'WOOD',
  GLASS = 'GLASS',
  METAL = 'METAL',
  OTHER = 'OTHER',
}

export interface StationLocal {
  alongWall: number;
  elevation: number;
}

export interface DoorOptions {
  ogid?: string;
  labelName: string;
  type: ElementType.DOOR;
  hostWallId?: string;
  stationLocal: StationLocal;
  panelDimensions: { width: number; thickness: number };
  /** `thickness` is the across-wall depth used only when the door is unhosted; when hosted, the lining auto-matches the host wall's thickness. */
  frameDimensions: { width: number; thickness: number };
  doorType: DoorType;
  doorHeight: number;
  frameColor: number;
  panelMaterial: DoorMaterialType;
  doorColor: number;
  doorRotation: number;
  doorQuadrant: number;
  /** 0 = closed, 90 = fully open. Applied to both 2D and 3D. */
  swingAngleDegrees: number;
  placement: Placement;
}

export class Door extends Opening implements IShape {
  // @ts-ignore — DoorOptions doesn't extend OpeningOptions (different `type` literal).
  propertySet: DoorOptions = {
    type: ElementType.DOOR,
    labelName: 'Simple Door',
    hostWallId: undefined,
    panelDimensions: { width: 1, thickness: 0.04 },
    frameDimensions: { width: 0.05, thickness: 0.15 },
    stationLocal: { alongWall: 0, elevation: 0 },
    doorType: DoorType.WOOD,
    doorHeight: 2.1,
    doorColor: 0xF0EDE6,
    frameColor: 0xD4D0CB,
    panelMaterial: DoorMaterialType.WOOD,
    doorRotation: 1.5,
    doorQuadrant: 1,
    swingAngleDegrees: 90,
    placement: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
  };

  private _doorProfileView: boolean = true;
  private _doorModelView: boolean = true;
  private _doorOutlineEnabled: boolean = true;

  constructor(baseDoorConfig?: DoorOptions) {
    super();

    this.ogType = ElementType.DOOR;
    this.subElements2D = new Map<string, THREE.Object3D>();
    this.subElements3D = new Map<string, THREE.Object3D>();

    if (baseDoorConfig) {
      this.propertySet = { ...this.propertySet, ...baseDoorConfig };
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

  get hostObject() { return this.propertySet.hostWallId || null; }
  set hostObject(value: string | null) { this.propertySet.hostWallId = value || undefined; }

  get station(): StationLocal { return this.propertySet.stationLocal; }
  set station(value: StationLocal) {
    this.propertySet.stationLocal = value;
    this.setOPGeometry();
  }

  get labelName() { return this.propertySet.labelName; }
  set labelName(value: string) { this.propertySet.labelName = value; }

  get hostWallId() { return this.propertySet.hostWallId; }
  set hostWallId(value: string | undefined) { this.propertySet.hostWallId = value; }

  set doorRotation(value: number) { this.propertySet.doorRotation = value; }

  set doorQuadrant(value: number) {
    if (value < 1 || value > 4) return;
    this.propertySet.doorQuadrant = value;
    this.setOPGeometry();
  }
  get doorQuadrant() { return this.propertySet.doorQuadrant; }

  set swingAngleDegrees(value: number) {
    this.propertySet.swingAngleDegrees = Math.max(0, Math.min(180, value));
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
    for (const obj of this.subElements2D.values()) {
      obj.visible = value;
    }
  }
  get profileView() { return this._doorProfileView; }

  set modelView(value: boolean) {
    this._doorModelView = value;
    for (const [key, obj] of this.subElements3D.entries()) {
      // Hole solid + extrusion-seed polygons are never visible.
      const seedKey = key === this.ogid + '-3d' || key === 'panel-base' || key === 'hole-base-3d';
      obj.visible = seedKey ? false : value;
    }
  }
  get modelView() { return this._doorModelView; }

  // Cast bypasses TS's structural check on `propertySet` (DoorOptions has a
  // different `type` literal than OpeningOptions). At runtime Door IS an Opening.
  get opening(): Opening { return this as unknown as Opening; }

  /** Plan-view hole loop (Vector3[] at Y=0). The 1 µm across-wall inset (HOLE_2D_TOLERANCE) keeps
   *  hole edges strictly inside the outer polygon so the WASM triangulator handles them correctly. */
  get holeLoop2D(): Vector3[] {
    const { panelDimensions, frameDimensions, stationLocal } = this.propertySet;
    if (!panelDimensions) return [];
    const wallThickness           = this.resolveWallThickness();
    const halfTotalWidthAlongWall = panelDimensions.width / 2 + frameDimensions.width;
    const halfWallThicknessSlab   = wallThickness / 2 - HOLE_2D_TOLERANCE;

    const startAlongWall = stationLocal.alongWall - halfTotalWidthAlongWall;
    const endAlongWall   = stationLocal.alongWall + halfTotalWidthAlongWall;

    const v0 = this.worldFromLocal(startAlongWall, -halfWallThicknessSlab, 0);
    const v1 = this.worldFromLocal(endAlongWall,   -halfWallThicknessSlab, 0);
    const v2 = this.worldFromLocal(endAlongWall,   +halfWallThicknessSlab, 0);
    const v3 = this.worldFromLocal(startAlongWall, +halfWallThicknessSlab, 0);
    return [
      new Vector3(v0.x, 0, v0.z),
      new Vector3(v1.x, 0, v1.z),
      new Vector3(v2.x, 0, v2.z),
      new Vector3(v3.x, 0, v3.z),
    ];
  }

  // @ts-ignore — DoorOptions vs OpeningOptions return shape mismatch.
  getOPConfig(): DoorOptions { return this.propertySet; }

  // @ts-ignore — DoorOptions vs OpeningOptions parameter shape mismatch.
  setOPConfig(config: DoorOptions): void {
    this.propertySet = { ...this.propertySet, ...config };
    this.setOPGeometry();
    this.setOPMaterial();
  }

  dispose() {
    for (const obj of this.subElements2D.values()) this.disposeObject(obj);
    for (const obj of this.subElements3D.values()) this.disposeObject(obj);
    this.subElements2D.clear();
    this.subElements3D.clear();
  }

  private disposeObject(obj: THREE.Object3D): void {
    obj.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
      else if (mesh.material) mesh.material.dispose();
    });
    obj.removeFromParent();
  }

  // Identity frame for unhosted doors (alongWall→x, elevation→y, acrossWall→z).
  private worldFromLocal(alongWall: number, acrossWall: number, elevation: number): Vector3 {
    const frame = this.hostFrame;
    if (!frame) return new Vector3(alongWall, elevation, acrossWall);
    return localToWorld(frame, alongWall, acrossWall, elevation);
  }

  private resolveWallThickness(): number {
    return this.hostFrame?.thickness ?? this.propertySet.frameDimensions.thickness;
  }

  /**
   * Compute the panel's hinge anchor and rotated local axes for the current
   * quadrant + swing angle. The panel is a rectangle pivoting around a vertical
   * axis at the hinge anchor (inside corner of the chosen jamb on the swing-out
   * face). xAxis runs hinge → handle; yAxis is perpendicular, on the
   * non-swing-side at 0° / into-the-opening side at 90°.
   */
  private computePanelAnchorAndAxes(swingRadians: number): {
    anchorAlongWall: number; anchorAcrossWall: number;
    xAxisAlongWall: number;  xAxisAcrossWall: number;
    yAxisAlongWall: number;  yAxisAcrossWall: number;
  } {
    const { panelDimensions, stationLocal, doorQuadrant } = this.propertySet;
    const halfPanelWidth    = panelDimensions.width / 2;
    const halfWallThickness = this.resolveWallThickness() / 2;

    // Q1, Q3 hinge LEFT; Q2, Q4 hinge RIGHT.
    const hingeOnLeft = doorQuadrant === 1 || doorQuadrant === 3;
    const anchorAlongWall = hingeOnLeft
      ? stationLocal.alongWall - halfPanelWidth
      : stationLocal.alongWall + halfPanelWidth;

    // Q1, Q2 swing toward +acrossWall; Q3, Q4 toward −acrossWall.
    const swingFaceSign = (doorQuadrant === 1 || doorQuadrant === 2) ? +1 : -1;
    const anchorAcrossWall = swingFaceSign * halfWallThickness;

    // X angle (CCW from +alongWall): 0 when hinge left, π when hinge right.
    const closedXAngle = (doorQuadrant === 2 || doorQuadrant === 4) ? Math.PI : 0;
    // Q1/Q4 sweep CCW; Q2/Q3 sweep CW. Picked so the panel-thickness corner
    // ends up inside the opening at swing 90° (not back into the jamb).
    const rotationSign = (doorQuadrant === 1 || doorQuadrant === 4) ? +1 : -1;

    const panelXAngle = closedXAngle + rotationSign * swingRadians;
    const xAxisAlongWall  = Math.cos(panelXAngle);
    const xAxisAcrossWall = Math.sin(panelXAngle);
    // yAxis = xAxis rotated by (−rotationSign × π/2). Trig identity:
    const yAxisAlongWall  =  rotationSign * Math.sin(panelXAngle);
    const yAxisAcrossWall = -rotationSign * Math.cos(panelXAngle);

    return {
      anchorAlongWall, anchorAcrossWall,
      xAxisAlongWall,  xAxisAcrossWall,
      yAxisAlongWall,  yAxisAcrossWall,
    };
  }

  /**
   * Panel corners in CCW winding (right-handed (alongWall, acrossWall) plane).
   * opengeometry's Polygon needs CCW for the outward-facing normal. The natural
   * order anchor → +X → +X+Y → +Y is CCW only when (X, Y) is right-handed; for
   * Q1/Q4 the basis is left-handed, so we swap c1 and c3.
   */
  private computePanelCornersCCW(swingRadians: number): Array<[number, number]> {
    const panel = this.computePanelAnchorAndAxes(swingRadians);
    const { panelDimensions, doorQuadrant } = this.propertySet;
    const w = panelDimensions.width;
    const t = panelDimensions.thickness;

    const c0:  [number, number] = [panel.anchorAlongWall, panel.anchorAcrossWall];
    const cX:  [number, number] = [
      panel.anchorAlongWall  + panel.xAxisAlongWall  * w,
      panel.anchorAcrossWall + panel.xAxisAcrossWall * w,
    ];
    const cXY: [number, number] = [
      panel.anchorAlongWall  + panel.xAxisAlongWall  * w + panel.yAxisAlongWall  * t,
      panel.anchorAcrossWall + panel.xAxisAcrossWall * w + panel.yAxisAcrossWall * t,
    ];
    const cY:  [number, number] = [
      panel.anchorAlongWall  + panel.yAxisAlongWall  * t,
      panel.anchorAcrossWall + panel.yAxisAcrossWall * t,
    ];

    const yIsCWFromX = doorQuadrant === 1 || doorQuadrant === 4;
    return yIsCWFromX ? [c0, cY, cXY, cX] : [c0, cX, cXY, cY];
  }

  setOPGeometry(): void {
    // Guard: when super() is running, propertySet is still Opening's defaults
    // (DoorOptions fields not yet initialized). Door constructor calls us again.
    if (!this.propertySet?.panelDimensions) return;

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
   * Build the hole that gets subtracted from the wall. Two polygons are built
   * because the same hole drives both CSG passes:
   *   - `'-2d'` polygon at floor elevation (Y=0) so it is coplanar with the
   *     wall's floor polygon for 2D boolean subtraction.
   *   - A separate `'hole-base-3d'` polygon at the hole's actual base elevation,
   *     extruded vertically into the `'-3d'` solid that gets subtracted from
   *     the wall's volume.
   */
  private buildHole(): void {
    const { panelDimensions, frameDimensions, doorHeight, stationLocal } = this.propertySet;
    // Across-wall tolerance only: cutter and wall faces coincide at
    // ±wallThickness/2; the kernel produces a "degenerate triangle" when a
    // cutter face falls inside its snap window of a cuttee face. 1 mm is the
    // smallest value that clears the window without making the cutter wider
    // than thin walls (which would trigger out-of-bounds → non-manifold).
    // No tolerance on alongWall / elevation: frame jambs end exactly at
    // ±(panelWidth/2 + frameWidth) and the frame head at doorHeight + frameWidth,
    // so adding tolerance there would leave a visible bare-wall gap.
    const acrossWallTolerance = 0.001;
    const wallThickness = this.resolveWallThickness();

    const halfTotalWidthAlongWall = panelDimensions.width / 2 + frameDimensions.width;
    const totalHeightElevation    = doorHeight + frameDimensions.width;
    const halfWallThicknessSlab   = wallThickness / 2 + acrossWallTolerance;

    const startAlongWall = stationLocal.alongWall - halfTotalWidthAlongWall;
    const endAlongWall   = stationLocal.alongWall + halfTotalWidthAlongWall;
    const baseElevation  = stationLocal.elevation;

    const footprint3D: Vector3[] = [
      this.worldFromLocal(startAlongWall, -halfWallThicknessSlab, baseElevation),
      this.worldFromLocal(endAlongWall,   -halfWallThicknessSlab, baseElevation),
      this.worldFromLocal(endAlongWall,   +halfWallThicknessSlab, baseElevation),
      this.worldFromLocal(startAlongWall, +halfWallThicknessSlab, baseElevation),
    ];
    const polygon3DBase = new Polygon({ vertices: footprint3D, color: 0xffcccc });
    polygon3DBase.outline = false;
    polygon3DBase.visible = false;     // extrusion seed; never rendered.
    this.subElements3D.set('hole-base-3d', polygon3DBase);
    this.add(polygon3DBase);

    const solid = polygon3DBase.extrude(totalHeightElevation);
    solid.ogid = this.ogid + '-3d';
    this.subElements3D.set(solid.ogid, solid);
    this.add(solid);
  }

  private build3D(): void {
    const {
      panelDimensions, frameDimensions, doorHeight, doorColor, frameColor, stationLocal,
    } = this.propertySet;
    const halfPanelWidth    = panelDimensions.width / 2;
    const frameVisibleWidth = frameDimensions.width;
    const halfWallThickness = this.resolveWallThickness() / 2;
    const stationAlongWall  = stationLocal.alongWall;
    const stationElevation  = stationLocal.elevation;

    // Frame: single U-sweep (left jamb → head → right jamb). Profile is a
    // visibleWidth × wallThickness rectangle so the lining fills the opening.
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

    // Panel: extrude the swing-rotated footprint vertically. Polygon vertices
    // already encode the rotation, so no Three.js rotation needed.
    const swingRadians = (this.propertySet.swingAngleDegrees ?? 90) * Math.PI / 180;
    const panelFootprint: Vector3[] = this.computePanelCornersCCW(swingRadians).map(
      ([alongWall, acrossWall]) => this.worldFromLocal(alongWall, acrossWall, stationElevation),
    );
    const panelBasePolygon = new Polygon({
      ogid: this.ogid + '-panel-base',
      vertices: panelFootprint,
      color: doorColor,
    });
    panelBasePolygon.outline = false;
    panelBasePolygon.visible = false;     // extrusion seed; never rendered.
    this.subElements3D.set('panel-base', panelBasePolygon);
    this.add(panelBasePolygon);

    const panelSolid = panelBasePolygon.extrude(doorHeight);
    panelSolid.ogid = this.ogid + '-panel';
    this.subElements3D.set('panel', panelSolid);
    this.add(panelSolid);
  }

  private build2D(): void {
    const { panelDimensions, frameDimensions, stationLocal, doorQuadrant } = this.propertySet;
    const halfPanelWidth    = panelDimensions.width / 2;
    const frameVisibleWidth = frameDimensions.width;
    const halfWallThickness = this.resolveWallThickness() / 2;
    const stationAlongWall  = stationLocal.alongWall;
    const stationElevation  = stationLocal.elevation;
    const quadrant          = doorQuadrant;

    // Plan view shows the lining as two jamb cross-sections at floor level
    // (head sits at door height, not in the floor cut plane).
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

    const swingRadians = (this.propertySet.swingAngleDegrees ?? 90) * Math.PI / 180;
    const panel = this.computePanelAnchorAndAxes(swingRadians);

    const panelPolygon = new Polygon({
      vertices: this.computePanelCornersCCW(swingRadians).map(
        ([alongWall, acrossWall]) => this.worldFromLocal(alongWall, acrossWall, stationElevation),
      ),
      color: this.propertySet.doorColor,
    });
    this.subElements2D.set('panel', panelPolygon);
    this.add(panelPolygon);

    // Swing arc: full 0→90° quarter-circle regardless of swingAngleDegrees, so
    // the door's swept footprint is always visible. Angles in the world XZ
    // plane CCW from +X. Unhosted: alongWall→X, acrossWall→+Z.
    const frame = this.hostFrame;
    const wallAngle       = frame ? Math.atan2(frame.alongWallAxis.z,  frame.alongWallAxis.x)  : 0;
    const acrossWallAngle = frame ? Math.atan2(frame.acrossWallAxis.z, frame.acrossWallAxis.x) : Math.PI / 2;
    const arcClosedAngle  = (quadrant === 2 || quadrant === 4) ? wallAngle + Math.PI       : wallAngle;
    const arcOpenAngle    = (quadrant === 3 || quadrant === 4) ? acrossWallAngle + Math.PI : acrossWallAngle;

    // Pick start/end so the arc is always a CCW π/2 sweep (Arc convention).
    const angleDifference = ((arcOpenAngle - arcClosedAngle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    const arcStart = Math.abs(angleDifference - Math.PI / 2) < 0.01 ? arcClosedAngle : arcOpenAngle;
    const arcEnd   = arcStart + Math.PI / 2;

    const swingArc = new Arc({
      center: this.worldFromLocal(panel.anchorAlongWall, panel.anchorAcrossWall, stationElevation),
      radius: panelDimensions.width,
      startAngle: arcStart,
      endAngle:   arcEnd,
      color: 0x606060,
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

    const frame3D = this.subElements3D.get('frame') as Sweep | undefined;
    if (frame3D) frame3D.color = frameColor;
    const panel3D = this.subElements3D.get('panel') as Solid | undefined;
    if (panel3D) panel3D.color = doorColor;
  }
}
