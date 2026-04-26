import * as THREE from "three";
import { IShape } from "../../shapes/base-type";
import { ElementType, WindowType } from "./../base-type";
import { Cuboid, Polygon, Sweep, Vector3 } from "opengeometry";
import type { Placement, PlanExportView, PlanVectorExportable } from "../../types";
import { Opening } from "./opening";
import { WallFrame, localToWorld } from "../solids/wall-frame";

type Window2DSubElementType = "frame" | "glass" | "window-opening";
type Window3DSubElementType = "frame" | "glass" | "window-opening";

export interface WindowStationLocal {
  /** Distance along the wall from its start point. */
  alongWall: number;
}

export interface WindowOptions {
  ogid?: string;
  labelName: string;
  type: ElementType.WINDOW;
  hostWallId?: string;
  /**
   * Window center in the host wall's local frame. Only u (along-wall) is
   * needed — vertical position comes from sillHeight, and v is always 0.
   */
  stationLocal: WindowStationLocal;
  windowDimensions: {
    width: number;
    thickness: number;
  };
  frameDimensions: {
    width: number;
    thickness: number;
  };
  windowType: WindowType;
  windowHeight: number;
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
  // @ts-ignore — Window's propertySet is WindowOptions (shaped differently than base OpeningOptions).
  propertySet: WindowOptions = {
    type: ElementType.WINDOW,
    labelName: "Simple Window",
    hostWallId: undefined,
    stationLocal: { alongWall: 0 },
    windowDimensions: {
      width: 1.5,
      thickness: 0.2,
    },
    frameDimensions: {
      width: 0.2,
      thickness: 0.2,
    },
    windowType: WindowType.CASEMENT,
    windowHeight: 1.2,
    sillHeight: 0.9,
    frameColor: 0x2f2f2f,
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
      this.propertySet = {
        ...this.propertySet,
        ...baseWindowConfig,
      };
    }

    this.propertySet.ogid = this.ogid;
    this.setOPGeometry();
  }

  get outline() { return this._windowOutlineEnabled; }
  set outline(value: boolean) {
    this._windowOutlineEnabled = value;
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
    this.setOPGeometry();
  }

  get station(): WindowStationLocal { return this.propertySet.stationLocal; }
  set station(value: WindowStationLocal) {
    this.propertySet.stationLocal = value;
    this.setOPGeometry();
  }

  get labelName() { return this.propertySet.labelName; }
  set labelName(value: string) { this.propertySet.labelName = value; }

  get hostWallId() { return this.propertySet.hostWallId; }
  set hostWallId(value: string | undefined) {
    this.propertySet.hostWallId = value;
    this.setOPGeometry();
  }

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
      if (key === this.ogid + '-2d') {
        obj.visible = false;
      } else {
        obj.visible = value;
      }
    }
  }
  get profileView() { return this._windowProfileView; }

  set modelView(value: boolean) {
    this._windowModelView = value;
    for (const [key, obj] of this.subElements3D.entries()) {
      if (key === this.ogid + '-3d' || key === 'hole-base-3d') {
        // Hole solid (CSG-only) and the 3D extrusion seed never render.
        obj.visible = false;
      } else {
        obj.visible = value;
      }
    }
  }
  get modelView() { return this._windowModelView; }

  /** Window IS the opening — return self. Kept for back-compat with wall attachers. */
  get opening(): Opening {
    return this;
  }

  // @ts-ignore — returning WindowOptions where Opening returns OpeningOptions.
  getOPConfig(): WindowOptions {
    return this.propertySet;
  }

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
   * Transform a wall-local (u, v, h) point to world coordinates. Identity
   * frame (u->x, h->y, v->z) when unhosted.
   */
  private worldFromLocal(u: number, v: number, h: number): Vector3 {
    const frame = this.hostFrame;
    if (!frame) {
      return new Vector3(u, h, v);
    }
    return localToWorld(frame, u, v, h);
  }

  setOPGeometry(): void {
    // Guard against super-constructor dispatch before WindowOptions fields initialize.
    if (!this.propertySet?.windowDimensions) {
      return;
    }

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
   * Hole: a rectangular slab centered on stationLocal.alongWall, spanning the
   * full outer frame footprint (width + 2*frameWidth) and height (windowHeight
   * + 2*frameWidth). Base of the hole = sillHeight - frameWidth.
   *
   * Two polygons are built so the same hole drives both CSG passes correctly:
   *   - The `'-2d'` polygon lives at floor elevation (0) so it is coplanar
   *     with the wall's floor polygon for 2D boolean subtraction.
   *   - A separate 3D-base polygon lives at the hole's actual base elevation
   *     and is extruded vertically to produce the `'-3d'` solid that gets
   *     subtracted from the wall's volume — leaving wall material above and
   *     below the window.
   */
  private buildHole(): void {
    const { windowDimensions, frameDimensions, windowHeight, sillHeight, stationLocal } = this.propertySet;
    const tol = 0.001;
    const halfTotalWidth = windowDimensions.width / 2 + frameDimensions.width + tol;
    const totalHeight = windowHeight + frameDimensions.width * 2 + tol;
    const halfThickness = frameDimensions.thickness / 2 + tol;

    const u0 = stationLocal.alongWall - halfTotalWidth;
    const u1 = stationLocal.alongWall + halfTotalWidth;
    const baseElevation = sillHeight - frameDimensions.width;

    // ── 2D footprint at floor level (coplanar with the wall) ─────────────────
    const footprint2D: Vector3[] = [
      this.worldFromLocal(u0, -halfThickness, 0),
      this.worldFromLocal(u1, -halfThickness, 0),
      this.worldFromLocal(u1, +halfThickness, 0),
      this.worldFromLocal(u0, +halfThickness, 0),
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
      this.worldFromLocal(u0, -halfThickness, baseElevation),
      this.worldFromLocal(u1, -halfThickness, baseElevation),
      this.worldFromLocal(u1, +halfThickness, baseElevation),
      this.worldFromLocal(u0, +halfThickness, baseElevation),
    ];
    const polygon3DBase = new Polygon({
      vertices: footprint3D,
      color: 0xffcccc,
    });
    polygon3DBase.outline = false;
    polygon3DBase.visible = false;     // never rendered; just an extrusion seed.
    this.subElements3D.set('hole-base-3d', polygon3DBase);
    this.add(polygon3DBase);

    const solid = polygon3DBase.extrude(totalHeight);
    solid.ogid = this.ogid + '-3d';
    this.subElements3D.set(solid.ogid, solid);
    this.add(solid);
  }

  private build3D(): void {
    const { windowDimensions, frameDimensions, windowHeight, sillHeight, glassColor, frameColor, stationLocal } = this.propertySet;
    const halfWindowWidth = windowDimensions.width / 2;
    const frameWidth = frameDimensions.width;
    const frameThickness = frameDimensions.thickness;
    const u = stationLocal.alongWall;

    // Closed frame loop (includes top + bottom, unlike doors).
    const frameProfile = [
      this.worldFromLocal(-frameWidth / 2, -frameThickness / 2, 0),
      this.worldFromLocal(-frameWidth / 2, +frameThickness / 2, 0),
      this.worldFromLocal(+frameWidth / 2, +frameThickness / 2, 0),
      this.worldFromLocal(+frameWidth / 2, -frameThickness / 2, 0),
      this.worldFromLocal(-frameWidth / 2, -frameThickness / 2, 0),
    ];

    const frameSweep = new Sweep({
      path: [
        this.worldFromLocal(u - halfWindowWidth - frameWidth / 2, 0, sillHeight - frameWidth / 2),
        this.worldFromLocal(u - halfWindowWidth - frameWidth / 2, 0, sillHeight + windowHeight + frameWidth / 2),
        this.worldFromLocal(u + halfWindowWidth + frameWidth / 2, 0, sillHeight + windowHeight + frameWidth / 2),
        this.worldFromLocal(u + halfWindowWidth + frameWidth / 2, 0, sillHeight - frameWidth / 2),
        this.worldFromLocal(u - halfWindowWidth - frameWidth / 2, 0, sillHeight - frameWidth / 2),
      ],
      profile: frameProfile,
      color: frameColor,
    });

    this.subElements3D.set("frame", frameSweep);
    this.add(frameSweep);

    const glassCenter = this.worldFromLocal(u, 0, sillHeight + windowHeight / 2);
    const glassPanel = new Cuboid({
      center: glassCenter,
      width: windowDimensions.width,
      height: windowHeight,
      depth: windowDimensions.thickness,
      color: glassColor,
    });

    this.subElements3D.set("glass", glassPanel);
    this.add(glassPanel);
  }

  private build2D(): void {
    const { windowDimensions, frameDimensions, sillHeight, stationLocal } = this.propertySet;
    const halfWindowWidth = windowDimensions.width / 2;
    const frameWidth = frameDimensions.width;
    const halfT = frameDimensions.thickness / 2;
    const u = stationLocal.alongWall;
    const h = sillHeight;

    const frameLeftPolygon = new Polygon({
      vertices: [
        this.worldFromLocal(u - halfWindowWidth - frameWidth, -halfT, h),
        this.worldFromLocal(u - halfWindowWidth - frameWidth, +halfT, h),
        this.worldFromLocal(u - halfWindowWidth,              +halfT, h),
        this.worldFromLocal(u - halfWindowWidth,              -halfT, h),
      ],
      color: this.propertySet.frameColor,
    });

    const frameRightPolygon = new Polygon({
      vertices: [
        this.worldFromLocal(u + halfWindowWidth + frameWidth, -halfT, h),
        this.worldFromLocal(u + halfWindowWidth + frameWidth, +halfT, h),
        this.worldFromLocal(u + halfWindowWidth,              +halfT, h),
        this.worldFromLocal(u + halfWindowWidth,              -halfT, h),
        this.worldFromLocal(u + halfWindowWidth + frameWidth, -halfT, h),
      ],
      color: this.propertySet.frameColor,
    });

    const frameGroup = new THREE.Group();
    frameGroup.add(frameLeftPolygon);
    frameGroup.add(frameRightPolygon);

    this.subElements2D.set("frame", frameGroup);
    this.add(frameGroup);

    const glassPolygon = new Polygon({
      vertices: [
        this.worldFromLocal(u - halfWindowWidth, -windowDimensions.thickness / 2, h),
        this.worldFromLocal(u - halfWindowWidth, +windowDimensions.thickness / 2, h),
        this.worldFromLocal(u + halfWindowWidth, +windowDimensions.thickness / 2, h),
        this.worldFromLocal(u + halfWindowWidth, -windowDimensions.thickness / 2, h),
      ],
      color: this.propertySet.glassColor,
    });

    this.subElements2D.set("glass", glassPolygon);
    this.add(glassPolygon);
  }

  setOPMaterial(): void {
    const { glassColor, frameColor } = this.propertySet;

    const frameGroup2D = this.subElements2D.get("frame") as THREE.Group | undefined;
    if (frameGroup2D) {
      const leftFrame = frameGroup2D.children[0] as Polygon | undefined;
      const rightFrame = frameGroup2D.children[1] as Polygon | undefined;
      if (leftFrame) leftFrame.color = frameColor;
      if (rightFrame) rightFrame.color = frameColor;
    }

    const glass2D = this.subElements2D.get("glass") as Polygon | undefined;
    if (glass2D) glass2D.color = glassColor;

    const frame3D = this.subElements3D.get("frame") as Sweep | undefined;
    if (frame3D) frame3D.color = frameColor;

    const glass3D = this.subElements3D.get("glass") as Cuboid | undefined;
    if (glass3D) glass3D.color = glassColor;
  }
}
