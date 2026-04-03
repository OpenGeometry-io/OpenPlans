import * as THREE from "three";
import { IShape } from "../../shapes/base-type";
import { ElementType, WindowType } from "./../base-type";
import { Cuboid, Line, Polygon, Sweep, Vector3 } from "opengeometry";
import type { Placement, PlanExportView, PlanVectorExportable } from "../../types";
import {
  applyPlacement,
  clearObjectMap,
  normalizePlacement,
  orderedRoots,
  setMapVisibility,
  syncCombinedSubElements,
  toColorNumber,
} from "../shared/dual-view";

type Window2DSubElementType = "frame" | "glass";
type Window3DSubElementType = "frame" | "glass";

export interface WindowOptions {
  ogid?: string;
  labelName: string;
  type: ElementType.WINDOW;
  hostWallId?: string;
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

  // TODO remove this later from IShape
  subElements: Map<string, THREE.Object3D<THREE.Object3DEventMap>> = new Map();

  private subElements2D: Map<Window2DSubElementType, THREE.Object3D> = new Map();
  private subElements3D: Map<Window3DSubElementType, THREE.Object3D> = new Map();

  private isProfileView = true;
  private isModelView = true;

  selected: boolean = false;
  edit: boolean = false;
  locked: boolean = false;

  propertySet: WindowOptions = {
    type: ElementType.WINDOW,
    labelName: "Simple Window",
    hostWallId: undefined,
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
    glassColor: 0x87CEEB,
    frameColor: 0xff0000,
    placement: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
  };

  get labelName() { return this.propertySet.labelName; }
  set labelName(value: string) { this.propertySet.labelName = value; }

  get hostWallId() { return this.propertySet.hostWallId; }
  set hostWallId(value: string | undefined) { this.propertySet.hostWallId = value; }

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
    this.propertySet.glassColor = toColorNumber(value, this.propertySet.glassColor);
    this.setOPMaterial();
  }

  get glassColor() {
    return this.propertySet.glassColor;
  }

  set frameColor(value: number) {
    this.propertySet.frameColor = toColorNumber(value, this.propertySet.frameColor);
    this.setOPMaterial();
  }

  get frameColor() {
    return this.propertySet.frameColor;
  }

  set profileView(value: boolean) {
    this.isProfileView = value;
    setMapVisibility(this.subElements2D, value);
  }

  get profileView() {
    return this.isProfileView;
  }

  set modelView(value: boolean) {
    this.isModelView = value;
    setMapVisibility(this.subElements3D, value);
  }

  get modelView() {
    return this.isModelView;
  }

  getExportRoots(view: PlanExportView): THREE.Object3D[] {
    return orderedRoots(
      view,
      this.subElements2D,
      this.subElements3D,
      ["frame", "glass"],
      ["frame", "glass"],
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
        placement: normalizePlacement(baseWindowConfig, this.propertySet.placement),
      };
    }

    this.propertySet.ogid = this.ogid;
    this.setOPGeometry();
  }

  setOPConfig(config: WindowOptions): void {
    this.propertySet = {
      ...this.propertySet,
      ...config,
      placement: normalizePlacement(config, this.propertySet.placement),
    };
    this.setOPGeometry();
  }

  getOPConfig(): WindowOptions {
    return this.propertySet;
  }

  dispose() {
    clearObjectMap(this.subElements2D);
    clearObjectMap(this.subElements3D);
    this.subElements.clear();
    this.discardGeometry();
    this.removeFromParent();
  }

  setOPGeometry(): void {
    const halfWindowWidth = this.propertySet.windowDimensions.width / 2 + this.propertySet.frameDimensions.width;
    this.setConfig({
      start: new Vector3(-halfWindowWidth, 0, 0),
      end: new Vector3(halfWindowWidth, 0, 0),
    });
    this.renderOrder = 1;

    this.create2D();
    this.create3D();
    applyPlacement(this, this.propertySet.placement);
    setMapVisibility(this.subElements2D, this.isProfileView);
    setMapVisibility(this.subElements3D, this.isModelView);
    syncCombinedSubElements(this.subElements, this.subElements2D, this.subElements3D);
  }

  private create3D(): void {
    const { windowDimensions, frameDimensions, windowHeight, sillHeight, glassColor, frameColor } = this.propertySet;
    const halfWindowWidth = windowDimensions.width / 2;
    const frameWidth = frameDimensions.width;
    const frameThickness = frameDimensions.thickness;

    clearObjectMap(this.subElements3D);

    const frameProfile = [
      new Vector3(-frameWidth / 2, 0, -frameThickness / 2),
      new Vector3(-frameWidth / 2, 0, frameThickness / 2),
      new Vector3(frameWidth / 2, 0, frameThickness / 2),
      new Vector3(frameWidth / 2, 0, -frameThickness / 2),
      new Vector3(-frameWidth / 2, 0, -frameThickness / 2),
    ];

    const frameSweep = new Sweep({
      path: [
        new Vector3(-(halfWindowWidth + frameWidth / 2), sillHeight - frameWidth / 2, 0),
        new Vector3(-(halfWindowWidth + frameWidth / 2), sillHeight + windowHeight + frameWidth / 2, 0),
        new Vector3(halfWindowWidth + frameWidth / 2, sillHeight + windowHeight + frameWidth / 2, 0),
        new Vector3(halfWindowWidth + frameWidth / 2, sillHeight - frameWidth / 2, 0),
        new Vector3(-(halfWindowWidth + frameWidth / 2), sillHeight - frameWidth / 2, 0),
      ],
      profile: frameProfile,
      color: frameColor,
    });

    this.subElements3D.set("frame", frameSweep);
    this.add(frameSweep);

    const glassPanel = new Cuboid({
      center: new Vector3(0, sillHeight + windowHeight / 2, 0),
      width: windowDimensions.width,
      height: windowHeight,
      depth: windowDimensions.thickness,
      color: glassColor,
    });

    this.subElements3D.set("glass", glassPanel);
    this.add(glassPanel);
  }

  private create2D(): void {
    const { windowDimensions, frameDimensions } = this.propertySet;
    const halfWindowWidth = windowDimensions.width / 2;
    const frameWidth = frameDimensions.width;

    clearObjectMap(this.subElements2D);

    const frameLeftPolygon = new Polygon({
      vertices: [
        new Vector3(-(halfWindowWidth + frameWidth), 0, -frameDimensions.thickness / 2),
        new Vector3(-(halfWindowWidth + frameWidth), 0, frameDimensions.thickness / 2),
        new Vector3(-halfWindowWidth, 0, frameDimensions.thickness / 2),
        new Vector3(-halfWindowWidth, 0, -frameDimensions.thickness / 2),
      ],
      color: this.propertySet.frameColor,
    });

    const frameRightPolygon = new Polygon({
      vertices: [
        new Vector3(halfWindowWidth + frameWidth, 0, -frameDimensions.thickness / 2),
        new Vector3(halfWindowWidth + frameWidth, 0, frameDimensions.thickness / 2),
        new Vector3(halfWindowWidth, 0, frameDimensions.thickness / 2),
        new Vector3(halfWindowWidth, 0, -frameDimensions.thickness / 2),
        new Vector3(halfWindowWidth + frameWidth, 0, -frameDimensions.thickness / 2),
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
        new Vector3(-halfWindowWidth, 0, -windowDimensions.thickness / 2),
        new Vector3(-halfWindowWidth, 0, windowDimensions.thickness / 2),
        new Vector3(halfWindowWidth, 0, windowDimensions.thickness / 2),
        new Vector3(halfWindowWidth, 0, -windowDimensions.thickness / 2),
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
