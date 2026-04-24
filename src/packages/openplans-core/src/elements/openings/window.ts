import * as THREE from "three";
import { IShape } from "../../shapes/base-type";
import { ElementType, WindowType } from "./../base-type";
import { Cuboid, Line, Polygon, Sweep, Vector3 } from "opengeometry";
import type { Placement, PlanExportView, PlanVectorExportable } from "../../types";
import { Opening } from "./opening";
import type { OpeningOptions } from "./opening";

type Window2DSubElementType = "frame" | "glass" | "window-opening";
type Window3DSubElementType = "frame" | "glass" | "window-opening";

export interface WindowOptions {
  ogid?: string;
  labelName: string;
  type: ElementType.WINDOW;
  hostWallId?: string;
  stationPoint: [number, number, number];
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

export class Window extends Line implements IShape, PlanVectorExportable {
  ogType: string = ElementType.WINDOW;

  subElements2D: Map<Window2DSubElementType, THREE.Object3D> = new Map();
  private isProfileView = true;
  subElements3D: Map<Window3DSubElementType, THREE.Object3D> = new Map();
  private isModelView = true;

  private _outlineEnabled = true;
  private openingElement: Opening | null = null;

  selected: boolean = false;
  edit: boolean = false;
  locked: boolean = false;

  propertySet: WindowOptions = {
    type: ElementType.WINDOW,
    labelName: "Simple Window",
    hostWallId: undefined,
    stationPoint: [0, 0, 0],
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

  get outline() { return this._outlineEnabled; }
  set outline(value: boolean) {
    this._outlineEnabled = value;
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

  get station() { return this.propertySet.stationPoint; }
  set station(value: [number, number, number]) {
    this.propertySet.stationPoint = value;
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

  get windowWidth() {
    return this.propertySet.windowDimensions.width;
  }

  set windowThickness(value: number) {
    this.propertySet.windowDimensions.thickness = value;
    this.setOPGeometry();
  }

  get windowThickness() {
    return this.propertySet.windowDimensions.thickness;
  }

  set windowHeight(value: number) {
    this.propertySet.windowHeight = value;
    this.setOPGeometry();
  }

  get windowHeight() {
    return this.propertySet.windowHeight;
  }

  set sillHeight(value: number) {
    this.propertySet.sillHeight = value;
    this.setOPGeometry();
  }

  get sillHeight() {
    return this.propertySet.sillHeight;
  }

  set frameThickness(value: number) {
    this.propertySet.frameDimensions.thickness = value;
    this.setOPGeometry();
  }

  get frameThickness() {
    return this.propertySet.frameDimensions.thickness;
  }

  set frameWidth(value: number) {
    this.propertySet.frameDimensions.width = value;
    this.setOPGeometry();
  }

  get frameWidth() {
    return this.propertySet.frameDimensions.width;
  }

  set glassColor(value: number) {
    this.propertySet.glassColor = value;
    this.setOPMaterial();
  }

  get glassColor() {
    return this.propertySet.glassColor;
  }

  set frameColor(value: number) {
    this.propertySet.frameColor = value;
    this.setOPMaterial();
  }

  get frameColor() {
    return this.propertySet.frameColor;
  }

  set profileView(value: boolean) {
    this.isProfileView = value;
    for (const obj of this.subElements2D.values()) {
      obj.visible = value;
    }
  }

  get profileView() {
    return this.isProfileView;
  }

  set modelView(value: boolean) {
    this.isModelView = value;
    for (const [key, obj] of this.subElements3D.entries()) {
      if (key === "window-opening") {
        obj.visible = false;
      } else {
        obj.visible = value;
      }
    }
  }

  get modelView() {
    return this.isModelView;
  }

  get opening() {
    return this.openingElement ?? this.subElements3D.get("window-opening") as Opening;
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

  constructor(baseWindowConfig?: WindowOptions) {
    super({
      start: new Vector3(0, 0, 0),
      end: new Vector3(1, 0, 0),
      color: 0x00ff00,
    });

    this.subElements2D = new Map<Window2DSubElementType, THREE.Object3D>();
    this.subElements3D = new Map<Window3DSubElementType, THREE.Object3D>();

    if (baseWindowConfig) {
      this.propertySet = {
        ...this.propertySet,
        ...baseWindowConfig,
      };
    }

    this.propertySet.ogid = this.ogid;
    this.setOPGeometry();
  }

  setOPConfig(config: WindowOptions): void {
    this.propertySet = {
      ...this.propertySet,
      ...config,
    };

    this.setOPGeometry();
    this.setOPMaterial();
  }

  getOPConfig(): WindowOptions {
    return this.propertySet;
  }

  dispose() {
    this.clearVisualSubElements();

    if (this.openingElement) {
      this.openingElement.dispose();
      this.openingElement.removeFromParent();
      this.openingElement = null;
    }

    this.subElements2D.clear();
    this.subElements3D.clear();
    this.discardGeometry();
  }

  setOPGeometry(): void {
    this.clearVisualSubElements();

    const station = this.propertySet.hostWallId
      ? new Vector3(...this.propertySet.stationPoint)
      : new Vector3(0, 0, 0);

    const halfWindowWidth = this.propertySet.windowDimensions.width / 2 + this.propertySet.frameDimensions.width;
    this.setConfig({
      start: new Vector3(-halfWindowWidth + station.x, station.y, station.z),
      end: new Vector3(halfWindowWidth + station.x, station.y, station.z),
    });
    this.renderOrder = 1;

    this.create2D();
    this.create3D();
    this.createOpening();

    this.outline = this._outlineEnabled;
    this.profileView = this.isProfileView;
    this.modelView = this.isModelView;
  }

  private clearVisualSubElements(): void {
    for (const obj of this.subElements2D.values()) {
      this.disposeObject(obj);
    }
    this.subElements2D.clear();

    for (const [key, obj] of this.subElements3D.entries()) {
      if (key === "window-opening") {
        continue;
      }
      this.disposeObject(obj);
      this.subElements3D.delete(key);
    }

    this.discardGeometry();
  }

  private disposeObject(obj: THREE.Object3D): void {
    obj.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((material) => material.dispose());
      } else if (mesh.material) {
        mesh.material.dispose();
      }
    });

    obj.removeFromParent();
  }

  private createOpening(): void {
    const station = this.propertySet.hostWallId
      ? new Vector3(...this.propertySet.stationPoint)
      : new Vector3(0, 0, 0);

    const { windowDimensions, frameDimensions, windowHeight, sillHeight } = this.propertySet;
    const totalWidth = windowDimensions.width + frameDimensions.width * 2;
    const halfTotalWidth = totalWidth / 2 + 0.001;
    // The closed-loop sweep now preserves the full outer frame height, which extends
    // one frame width below the glass sill and one frame width above the glass head.
    const totalHeight = windowHeight + frameDimensions.width * 2 + 0.001;
    const openingBaseHeight = sillHeight - frameDimensions.width + station.y;

    const openingConfig: OpeningOptions = {
      labelName: this.propertySet.labelName + " Opening",
      type: ElementType.OPENING,
      thickness: frameDimensions.thickness + 0.001,
      height: totalHeight,
      baseHeight: openingBaseHeight,
      points: [
        [-halfTotalWidth + station.x, openingBaseHeight, station.z],
        [halfTotalWidth + station.x, openingBaseHeight, station.z],
      ] as [number, number, number][],
      placement: {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      } as Placement,
    };

    if (this.openingElement) {
      this.openingElement.setOPConfig({
        ...this.openingElement.getOPConfig(),
        ...openingConfig,
      });
    } else {
      this.openingElement = new Opening(openingConfig);
      this.add(this.openingElement);
    }

    this.openingElement.outline = true;
    this.openingElement.profileView = false;
    this.openingElement.modelView = false;

    if (this.openingElement.parent !== this) {
      this.add(this.openingElement);
    }

    this.subElements3D.set("window-opening", this.openingElement);
  }

  private create3D(): void {
    const station = this.propertySet.hostWallId
      ? new Vector3(...this.propertySet.stationPoint)
      : new Vector3(0, 0, 0);

    const { windowDimensions, frameDimensions, windowHeight, sillHeight, glassColor, frameColor } = this.propertySet;
    const halfWindowWidth = windowDimensions.width / 2;
    const frameWidth = frameDimensions.width;
    const frameThickness = frameDimensions.thickness;

    const frameProfile = [
      new Vector3(-frameWidth / 2 + station.x, station.y, -frameThickness / 2 + station.z),
      new Vector3(-frameWidth / 2 + station.x, station.y, frameThickness / 2 + station.z),
      new Vector3(frameWidth / 2 + station.x, station.y, frameThickness / 2 + station.z),
      new Vector3(frameWidth / 2 + station.x, station.y, -frameThickness / 2 + station.z),
      new Vector3(-frameWidth / 2 + station.x, station.y, -frameThickness / 2 + station.z),
    ];

    const frameSweep = new Sweep({
      path: [
        new Vector3(-(halfWindowWidth + frameWidth / 2) + station.x, sillHeight - frameWidth / 2 + station.y, station.z),
        new Vector3(-(halfWindowWidth + frameWidth / 2) + station.x, sillHeight + windowHeight + frameWidth / 2 + station.y, station.z),
        new Vector3(halfWindowWidth + frameWidth / 2 + station.x, sillHeight + windowHeight + frameWidth / 2 + station.y, station.z),
        new Vector3(halfWindowWidth + frameWidth / 2 + station.x, sillHeight - frameWidth / 2 + station.y, station.z),
        new Vector3(-(halfWindowWidth + frameWidth / 2) + station.x, sillHeight - frameWidth / 2 + station.y, station.z),
      ],
      profile: frameProfile,
      color: frameColor,
    });

    this.subElements3D.set("frame", frameSweep);
    this.add(frameSweep);

    const glassPanel = new Cuboid({
      center: new Vector3(0 + station.x, sillHeight + windowHeight / 2 + station.y, 0 + station.z),
      width: windowDimensions.width,
      height: windowHeight,
      depth: windowDimensions.thickness,
      color: glassColor,
    });

    this.subElements3D.set("glass", glassPanel);
    this.add(glassPanel);
  }

  private create2D(): void {
    const station = this.propertySet.hostWallId
      ? new Vector3(...this.propertySet.stationPoint)
      : new Vector3(0, 0, 0);

    const { windowDimensions, frameDimensions } = this.propertySet;
    const halfWindowWidth = windowDimensions.width / 2;
    const frameWidth = frameDimensions.width;

    const frameLeftPolygon = new Polygon({
      vertices: [
        new Vector3(-(halfWindowWidth + frameWidth) + station.x, station.y, -frameDimensions.thickness / 2 + station.z),
        new Vector3(-(halfWindowWidth + frameWidth) + station.x, station.y, frameDimensions.thickness / 2 + station.z),
        new Vector3(-halfWindowWidth + station.x, station.y, frameDimensions.thickness / 2 + station.z),
        new Vector3(-halfWindowWidth + station.x, station.y, -frameDimensions.thickness / 2 + station.z),
      ],
      color: this.propertySet.frameColor,
    });

    const frameRightPolygon = new Polygon({
      vertices: [
        new Vector3(halfWindowWidth + frameWidth + station.x, station.y, -frameDimensions.thickness / 2 + station.z),
        new Vector3(halfWindowWidth + frameWidth + station.x, station.y, frameDimensions.thickness / 2 + station.z),
        new Vector3(halfWindowWidth + station.x, station.y, frameDimensions.thickness / 2 + station.z),
        new Vector3(halfWindowWidth + station.x, station.y, -frameDimensions.thickness / 2 + station.z),
        new Vector3(halfWindowWidth + frameWidth + station.x, station.y, -frameDimensions.thickness / 2 + station.z),
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
        new Vector3(-halfWindowWidth + station.x, station.y, -windowDimensions.thickness / 2 + station.z),
        new Vector3(-halfWindowWidth + station.x, station.y, windowDimensions.thickness / 2 + station.z),
        new Vector3(halfWindowWidth + station.x, station.y, windowDimensions.thickness / 2 + station.z),
        new Vector3(halfWindowWidth + station.x, station.y, -windowDimensions.thickness / 2 + station.z),
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
      if (leftFrame) {
        leftFrame.color = frameColor;
      }
      if (rightFrame) {
        rightFrame.color = frameColor;
      }
    }

    const glass2D = this.subElements2D.get("glass") as Polygon | undefined;
    if (glass2D) {
      glass2D.color = glassColor;
    }

    const frame3D = this.subElements3D.get("frame") as Sweep | undefined;
    if (frame3D) {
      frame3D.color = frameColor;
    }

    const glass3D = this.subElements3D.get("glass") as Cuboid | undefined;
    if (glass3D) {
      glass3D.color = glassColor;
    }
  }
}
