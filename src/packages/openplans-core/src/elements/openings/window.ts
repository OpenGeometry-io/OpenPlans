import * as THREE from "three";
import { IShape } from "../../shapes/base-type";
import { ElementType, WindowType } from "./../base-type";
import { Polygon, Solid, Sweep, Vector3 } from "opengeometry";
import type { Placement, PlanExportView, PlanVectorExportable } from "../../types";
import { Opening } from "./opening";
import { localToWorld } from "../solids/wall-frame";

export interface WindowStationLocal {
  /** Distance along the wall from its start point. */
  alongWall: number;
  /**
   * World Y of the floor this window belongs to (default 0).
   * Used only for the 2D plan symbol — the 3D geometry derives its vertical
   * position from `sillHeight` instead. Set this to the storey's floor
   * elevation so the plan stamp is coplanar with the correct wall polygon.
   */
  elevation?: number;
}

export interface WindowOptions {
  ogid?: string;
  labelName: string;
  type: ElementType.WINDOW;
  hostWallId?: string;
  /**
   * Window center in the host wall's local frame. `alongWall` positions the
   * window centre along the wall; `elevation` (optional, default 0) sets the
   * floor Y for the 2D plan symbol so it sits on the correct storey's polygon.
   */
  stationLocal: WindowStationLocal;
  windowDimensions: {
    width: number;
    /** Across-wall depth of the glass pane (e.g. 0.04 m for a double-glazed unit). */
    thickness: number;
  };
  frameDimensions: {
    /** Visible frame reveal on the wall face (jamb width). */
    width: number;
    /** Across-wall frame depth. Used only when unhosted; when hosted the lining auto-fills the host wall's thickness. */
    thickness: number;
  };
  windowType: WindowType;
  /** Clear height of the glass opening. */
  windowHeight: number;
  /** Height of the bottom of the glass opening above floor level. */
  sillHeight: number;
  frameColor: number;
  glassColor: number;
  placement: Placement;
}

/**
 * Window IS an Opening — the hole it cuts in the host wall is carried on
 * `subElements2D/3D` at keys `ogid + '-2d'` and `ogid + '-3d'` (read by the
 * inherited `opening2D` / `opening3D` accessors). Frame and glass are extra
 * decoration on top.
 */
export class Window extends Opening implements IShape, PlanVectorExportable {
  // @ts-ignore — WindowOptions doesn't extend OpeningOptions (different `type` literal).
  propertySet: WindowOptions = {
    type: ElementType.WINDOW,
    labelName: "Simple Window",
    hostWallId: undefined,
    stationLocal: { alongWall: 0 },
    windowDimensions: {
      width: 1.5,
      thickness: 0.04,
    },
    frameDimensions: {
      width: 0.05,
      thickness: 0.15,
    },
    windowType: WindowType.CASEMENT,
    windowHeight: 1.2,
    sillHeight: 0.9,
    frameColor: 0xD4D0CB,
    glassColor: 0x87ceeb,
    placement: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
  };

  private _windowProfileView: boolean = true;
  private _windowModelView: boolean = true;
  private _windowOutlineEnabled: boolean = true;

  constructor(baseWindowConfig?: WindowOptions) {
    super();

    this.ogType = ElementType.WINDOW;
    this.subElements2D = new Map<string, THREE.Object3D>();
    this.subElements3D = new Map<string, THREE.Object3D>();

    if (baseWindowConfig) {
      this.propertySet = { ...this.propertySet, ...baseWindowConfig };
    }

    this.propertySet.ogid = this.ogid;

    // Window positions itself via `station` + `sillHeight`, not start/end.
    // Replace the inherited Line setters with read-only getters that warn once.
    let warningEmitted = false;
    const warnAndIgnore = () => {
      if (!warningEmitted) {
        console.warn(
          "Window.start / Window.end are read-only. " +
          "Use `window.station` and `window.sillHeight` to position the window.",
        );
        warningEmitted = true;
      }
    };
    Object.defineProperty(this, 'start', {
      configurable: true,
      get: () => {
        const { stationLocal, windowDimensions } = this.propertySet;
        return [stationLocal.alongWall - windowDimensions.width / 2, 0, this.propertySet.sillHeight];
      },
      set: warnAndIgnore,
    });
    Object.defineProperty(this, 'end', {
      configurable: true,
      get: () => {
        const { stationLocal, windowDimensions } = this.propertySet;
        return [stationLocal.alongWall + windowDimensions.width / 2, 0, this.propertySet.sillHeight];
      },
      set: warnAndIgnore,
    });

    this.setOPGeometry();
  }

  get outline() { return this._windowOutlineEnabled; }
  set outline(value: boolean) {
    this._windowOutlineEnabled = value;
    const applyOutline = (obj: THREE.Object3D) => {
      if (obj instanceof THREE.Group) {
        for (const child of obj.children) applyOutline(child);
      } else {
        // @ts-ignore
        obj.outline = value;
      }
    };
    for (const obj of this.subElements2D.values()) applyOutline(obj);
    for (const obj of this.subElements3D.values()) applyOutline(obj);
  }

  get hostObject() { return this.propertySet.hostWallId || null; }
  set hostObject(value: string | null) { this.propertySet.hostWallId = value || undefined; }

  get station(): WindowStationLocal { return this.propertySet.stationLocal; }
  set station(value: WindowStationLocal) {
    this.propertySet.stationLocal = value;
    this.setOPGeometry();
  }

  /** World Y of the floor this window belongs to (2D plan symbol only). */
  get planElevation(): number { return this.propertySet.stationLocal.elevation ?? 0; }
  set planElevation(value: number) {
    this.propertySet.stationLocal = { ...this.propertySet.stationLocal, elevation: value };
    this.setOPGeometry();
  }

  get labelName() { return this.propertySet.labelName; }
  set labelName(value: string) { this.propertySet.labelName = value; }

  get hostWallId() { return this.propertySet.hostWallId; }
  set hostWallId(value: string | undefined) { this.propertySet.hostWallId = value; }

  set windowWidth(value: number) {
    this.propertySet.windowDimensions.width = value;
    this.setOPGeometry();
  }
  get windowWidth() { return this.propertySet.windowDimensions.width; }

  set windowThickness(value: number) {
    this.propertySet.windowDimensions.thickness = value;
    this.setOPGeometry();
  }
  get windowThickness() { return this.propertySet.windowDimensions.thickness; }

  set windowHeight(value: number) {
    this.propertySet.windowHeight = value;
    this.setOPGeometry();
  }
  get windowHeight() { return this.propertySet.windowHeight; }

  set sillHeight(value: number) {
    this.propertySet.sillHeight = value;
    this.setOPGeometry();
  }
  get sillHeight() { return this.propertySet.sillHeight; }

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

  set glassColor(value: number) {
    this.propertySet.glassColor = value;
    this.setOPMaterial();
  }
  get glassColor() { return this.propertySet.glassColor; }

  set frameColor(value: number) {
    this.propertySet.frameColor = value;
    this.setOPMaterial();
  }
  get frameColor() { return this.propertySet.frameColor; }

  set profileView(value: boolean) {
    this._windowProfileView = value;
    for (const [key, obj] of this.subElements2D.entries()) {
      // The hole polygon is CSG-only; never visible.
      obj.visible = key === this.ogid + '-2d' ? false : value;
    }
  }
  get profileView() { return this._windowProfileView; }

  set modelView(value: boolean) {
    this._windowModelView = value;
    for (const [key, obj] of this.subElements3D.entries()) {
      // Hole solid + extrusion-seed polygons are never visible.
      const seedKey = key === this.ogid + '-3d' || key === 'hole-base-3d' || key === 'glass-base';
      obj.visible = seedKey ? false : value;
    }
  }
  get modelView() { return this._windowModelView; }

  /**
   * Window IS the opening — return self. Kept for compatibility with wall attachers.
   *
   * The cast bypasses TS's structural check on `propertySet` (WindowOptions does
   * not extend OpeningOptions because the `type` literal differs). At runtime a
   * Window is a real Opening subclass and exposes every accessor a wall expects.
   */
  get opening(): Opening { return this as unknown as Opening; }

  // @ts-ignore — returning WindowOptions where Opening returns OpeningOptions.
  getOPConfig(): WindowOptions { return this.propertySet; }

  // @ts-ignore — accepting WindowOptions where Opening accepts OpeningOptions.
  setOPConfig(config: WindowOptions): void {
    this.propertySet = { ...this.propertySet, ...config };
    this.setOPGeometry();
    this.setOPMaterial();
  }

  getExportRoots(view: PlanExportView): THREE.Object3D[] {
    if (view === "top") {
      return [this.subElements2D.get("frame"), this.subElements2D.get("glass")].filter(
        (root): root is THREE.Object3D => Boolean(root),
      );
    }
    return [this.subElements3D.get("frame"), this.subElements3D.get("glass")].filter(
      (root): root is THREE.Object3D => Boolean(root),
    );
  }

  dispose() {
    for (const obj of this.subElements2D.values()) this.disposeObject(obj);
    for (const obj of this.subElements3D.values()) this.disposeObject(obj);
    this.subElements2D.clear();
    this.subElements3D.clear();
    this.discardGeometry();
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

  /** Transform wall-local (u, v, h) to world coordinates. Identity frame when unhosted. */
  private worldFromLocal(u: number, v: number, h: number): Vector3 {
    const frame = this.hostFrame;
    if (!frame) return new Vector3(u, h, v);
    return localToWorld(frame, u, v, h);
  }

  /**
   * Wall thickness: host wall's actual thickness when hosted, or fallback to
   * `frameDimensions.thickness` when the window is placed without a host wall.
   */
  private resolveWallThickness(): number {
    return this.hostFrame?.thickness ?? this.propertySet.frameDimensions.thickness;
  }

  setOPGeometry(): void {
    // Guard: when super() is running, propertySet is still Opening's defaults
    // (WindowOptions fields not yet initialized). Window constructor calls us again.
    if (!this.propertySet?.windowDimensions) return;

    this.dispose();
    this.buildHole();
    this.build3D();
    this.build2D();

    this.outline = this._windowOutlineEnabled;
    this.profileView = this._windowProfileView;
    this.modelView = this._windowModelView;

    this.onOpeningUpdated.trigger(null);
  }

  /**
   * Build the hole that gets subtracted from the wall. Two polygons are built
   * because the same hole drives both CSG passes:
   *   - `'-2d'` polygon at floor elevation (Y=0) so it is coplanar with the
   *     wall's floor polygon for 2D boolean subtraction.
   *   - A separate `'hole-base-3d'` polygon at the hole's actual base elevation,
   *     extruded vertically into the `'-3d'` solid that gets subtracted from
   *     the wall's volume — leaving wall material above and below the window.
   *
   * Tolerance is applied only across-wall (±wallThickness/2 ± 0.001 m). The CSG
   * kernel snaps coincident faces when the cutter lies within 1 mm of a cuttee
   * face. Adding tolerance along-wall or vertically would leave a bare-wall gap
   * at the jambs and head/sill, so only the across-wall direction gets it.
   */
  private buildHole(): void {
    const { windowDimensions, frameDimensions, windowHeight, sillHeight, stationLocal } = this.propertySet;
    const acrossWallTolerance = 0.001;
    const wallThickness = this.resolveWallThickness();

    const halfTotalWidth        = windowDimensions.width / 2 + frameDimensions.width;
    const totalHeight           = windowHeight + frameDimensions.width * 2;
    const halfWallThicknessSlab = wallThickness / 2 + acrossWallTolerance;

    const u0           = stationLocal.alongWall - halfTotalWidth;
    const u1           = stationLocal.alongWall + halfTotalWidth;
    const baseElevation = sillHeight - frameDimensions.width;

    // ── 2D footprint at floor level (coplanar with the wall) ─────────────────
    const footprint2D: Vector3[] = [
      this.worldFromLocal(u0, -halfWallThicknessSlab, 0),
      this.worldFromLocal(u1, -halfWallThicknessSlab, 0),
      this.worldFromLocal(u1, +halfWallThicknessSlab, 0),
      this.worldFromLocal(u0, +halfWallThicknessSlab, 0),
    ];
    const polygon2D = new Polygon({
      ogid: this.ogid + '-2d',
      vertices: footprint2D,
      color: 0xffcccc,
    });
    polygon2D.outline = false;
    this.subElements2D.set(polygon2D.ogid, polygon2D);
    this.add(polygon2D);

    // ── 3D extrusion seed at the hole's actual base elevation ────────────────
    const footprint3D: Vector3[] = [
      this.worldFromLocal(u0, -halfWallThicknessSlab, baseElevation),
      this.worldFromLocal(u1, -halfWallThicknessSlab, baseElevation),
      this.worldFromLocal(u1, +halfWallThicknessSlab, baseElevation),
      this.worldFromLocal(u0, +halfWallThicknessSlab, baseElevation),
    ];
    const polygon3DBase = new Polygon({ vertices: footprint3D, color: 0xffcccc });
    polygon3DBase.outline = false;
    polygon3DBase.visible = false;     // extrusion seed; never rendered.
    this.subElements3D.set('hole-base-3d', polygon3DBase);
    this.add(polygon3DBase);

    const solid = polygon3DBase.extrude(totalHeight);
    solid.ogid = this.ogid + '-3d';
    this.subElements3D.set(solid.ogid, solid);
    this.add(solid);
  }

  private build3D(): void {
    const {
      windowDimensions, frameDimensions, windowHeight, sillHeight, glassColor, frameColor, stationLocal,
    } = this.propertySet;
    const halfWindowWidth   = windowDimensions.width / 2;
    const frameVisibleWidth = frameDimensions.width;
    const halfWallThickness = this.resolveWallThickness() / 2;
    const u = stationLocal.alongWall;

    // Frame: closed sweep loop (left jamb → head → right jamb → sill). The
    // profile spans the full wall thickness so the lining fills the opening.
    const frameProfile = [
      this.worldFromLocal(-frameVisibleWidth / 2, -halfWallThickness, 0),
      this.worldFromLocal(-frameVisibleWidth / 2, +halfWallThickness, 0),
      this.worldFromLocal(+frameVisibleWidth / 2, +halfWallThickness, 0),
      this.worldFromLocal(+frameVisibleWidth / 2, -halfWallThickness, 0),
      this.worldFromLocal(-frameVisibleWidth / 2, -halfWallThickness, 0),
    ];
    const frameSweep = new Sweep({
      path: [
        this.worldFromLocal(u - halfWindowWidth - frameVisibleWidth / 2, 0, sillHeight - frameVisibleWidth / 2),
        this.worldFromLocal(u - halfWindowWidth - frameVisibleWidth / 2, 0, sillHeight + windowHeight + frameVisibleWidth / 2),
        this.worldFromLocal(u + halfWindowWidth + frameVisibleWidth / 2, 0, sillHeight + windowHeight + frameVisibleWidth / 2),
        this.worldFromLocal(u + halfWindowWidth + frameVisibleWidth / 2, 0, sillHeight - frameVisibleWidth / 2),
        this.worldFromLocal(u - halfWindowWidth - frameVisibleWidth / 2, 0, sillHeight - frameVisibleWidth / 2),
      ],
      profile: frameProfile,
      color: frameColor,
    });
    this.subElements3D.set('frame', frameSweep);
    this.add(frameSweep);

    // Glass: extrude a wall-aligned footprint polygon vertically. This correctly
    // orients the pane with rotated host walls. A Cuboid is always world-axis-
    // aligned, so it would skew off-axis when the wall is not axis-aligned.
    const halfGlassThick = windowDimensions.thickness / 2;
    const glassFootprint: Vector3[] = [
      this.worldFromLocal(u - halfWindowWidth, -halfGlassThick, sillHeight),
      this.worldFromLocal(u + halfWindowWidth, -halfGlassThick, sillHeight),
      this.worldFromLocal(u + halfWindowWidth, +halfGlassThick, sillHeight),
      this.worldFromLocal(u - halfWindowWidth, +halfGlassThick, sillHeight),
    ];
    const glassBasePolygon = new Polygon({ vertices: glassFootprint, color: glassColor });
    glassBasePolygon.outline = false;
    glassBasePolygon.visible = false;  // extrusion seed; never rendered.
    this.subElements3D.set('glass-base', glassBasePolygon);
    this.add(glassBasePolygon);

    const glassSolid = glassBasePolygon.extrude(windowHeight);
    glassSolid.ogid = this.ogid + '-glass';
    this.subElements3D.set('glass', glassSolid);
    this.add(glassSolid);
  }

  private build2D(): void {
    const { windowDimensions, frameDimensions, stationLocal } = this.propertySet;
    const halfWindowWidth   = windowDimensions.width / 2;
    const frameVisibleWidth = frameDimensions.width;
    const halfWallThickness = this.resolveWallThickness() / 2;
    const u = stationLocal.alongWall;
    // h = floor elevation of this storey (default 0). 2D plan symbol must be
    // coplanar with the host wall polygon, which lives at this Y level.
    const h = stationLocal.elevation ?? 0;

    // Plan view: two jamb cross-sections (left and right lining).
    const frameLeftPolygon = new Polygon({
      vertices: [
        this.worldFromLocal(u - halfWindowWidth - frameVisibleWidth, -halfWallThickness, h),
        this.worldFromLocal(u - halfWindowWidth - frameVisibleWidth, +halfWallThickness, h),
        this.worldFromLocal(u - halfWindowWidth,                     +halfWallThickness, h),
        this.worldFromLocal(u - halfWindowWidth,                     -halfWallThickness, h),
      ],
      color: this.propertySet.frameColor,
    });
    const frameRightPolygon = new Polygon({
      vertices: [
        this.worldFromLocal(u + halfWindowWidth + frameVisibleWidth, -halfWallThickness, h),
        this.worldFromLocal(u + halfWindowWidth + frameVisibleWidth, +halfWallThickness, h),
        this.worldFromLocal(u + halfWindowWidth,                     +halfWallThickness, h),
        this.worldFromLocal(u + halfWindowWidth,                     -halfWallThickness, h),
      ],
      color: this.propertySet.frameColor,
    });

    const frameGroup = new THREE.Group();
    frameGroup.add(frameLeftPolygon);
    frameGroup.add(frameRightPolygon);
    this.subElements2D.set('frame', frameGroup);
    this.add(frameGroup);

    // Two Slit
    const slitThick  = halfWallThickness; // 12 mm per slit
    const slitOffset = (halfWallThickness + slitThick / 2) / 3; // equal-zone spacing
    const glassColor = this.propertySet.glassColor;

    const makeSlit = (vCentre: number): Polygon =>
      new Polygon({
        vertices: [
          this.worldFromLocal(u - halfWindowWidth, vCentre - slitThick / 2, h),
          this.worldFromLocal(u - halfWindowWidth, vCentre + slitThick / 2, h),
          this.worldFromLocal(u + halfWindowWidth, vCentre + slitThick / 2, h),
          this.worldFromLocal(u + halfWindowWidth, vCentre - slitThick / 2, h),
        ],
        color: glassColor,
      });

    const glassGroup = new THREE.Group();
    glassGroup.add(makeSlit(-slitOffset));
    glassGroup.add(makeSlit(+slitOffset));
    this.subElements2D.set('glass', glassGroup);
    this.add(glassGroup);
  }

  setOPMaterial(): void {
    const { glassColor, frameColor } = this.propertySet;

    const frameGroup2D = this.subElements2D.get('frame') as THREE.Group | undefined;
    if (frameGroup2D) {
      const leftFrame  = frameGroup2D.children[0] as Polygon | undefined;
      const rightFrame = frameGroup2D.children[1] as Polygon | undefined;
      if (leftFrame)  leftFrame.color  = frameColor;
      if (rightFrame) rightFrame.color = frameColor;
    }

    const glassGroup2D = this.subElements2D.get('glass') as THREE.Group | undefined;
    if (glassGroup2D) {
      for (const child of glassGroup2D.children) {
        (child as Polygon).color = glassColor;
      }
    }

    const frame3D = this.subElements3D.get('frame') as Sweep | undefined;
    if (frame3D) frame3D.color = frameColor;

    const glass3D = this.subElements3D.get('glass') as Solid | undefined;
    if (glass3D) glass3D.color = glassColor;
  }
}
