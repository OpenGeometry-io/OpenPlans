import * as THREE from "three";
import { IShape } from "../../shapes/base-type";
import { ElementType, DoorType } from "./../base-type";
import { Arc, Cuboid, Line, Polygon, Sweep, Vector3 } from "opengeometry";
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


export type ElementViewType = 'plan' | '3d';
export type SubElementType = 'frame' | 'finish' | 'swingArc' | 'panel';
type Door2DSubElementType = 'frame' | 'panelPivot' | 'panel' | 'swingArc';
type Door3DSubElementType = 'frame' | 'panelPivot' | 'panel';
export type DoorQuandrant = 1 | 2 | 3 | 4;

export enum DoorMaterialType {
  WOOD = 'WOOD',
  GLASS = 'GLASS',
  METAL = 'METAL',
  OTHER = 'OTHER',
}

export interface DoorOptions {
  ogid?: string;
  labelName: string;
  type: ElementType.DOOR;
  hostWallId?: string;
  panelDimensions: {
    width: number;
    thickness: number;
  };
  frameDimensions: {
    width: number;
    thickness: number;
  };
  doorType: DoorType;
  doorHeight: number; // Height of the door panel
  frameColor: number;
  panelMaterial: DoorMaterialType;
  doorColor: number;
  doorRotation: number;
  doorQuadrant: number;
  placement: Placement;
}

// export class BaseDoor extends Opening implements IShape {
export class Door extends Line implements IShape, PlanVectorExportable {
  ogType: string = ElementType.DOOR;

  // TODO remove this later from IShape
  subElements: Map<string, THREE.Object3D<THREE.Object3DEventMap>> = new Map();

  private subElements2D: Map<Door2DSubElementType, THREE.Object3D> = new Map();
  private isProfileView = true;
  private subElements3D: Map<Door3DSubElementType, THREE.Object3D> = new Map();
  private isModelView = true;

  selected: boolean = false;
  edit: boolean = false;
  locked: boolean = false;

  propertySet: DoorOptions = {
    type: ElementType.DOOR,
    labelName: 'Simple Door',
    hostWallId: undefined,
    panelDimensions: {
      width: 1,
      thickness: 0.2,
    },
    frameDimensions: {
      width: 0.2,
      thickness: 0.2,
    },
    doorType: DoorType.WOOD,
    doorHeight: 2.1,
    doorColor: 0x8B4513,
    frameColor: 0xff0000,
    panelMaterial: DoorMaterialType.WOOD,
    doorRotation: 1.5,
    doorQuadrant: 1,
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

  get panelWidth() {
    return this.propertySet.panelDimensions.width;
  }

  set panelThickness(value: number) {
    this.propertySet.panelDimensions.thickness = value;
    this.setOPGeometry();
  }

  get panelThickness() {
    return this.propertySet.panelDimensions.thickness;
  }

  set doorHeight(value: number) {
    this.propertySet.doorHeight = value;
    this.setOPGeometry();
  }

  get doorHeight() {
    return this.propertySet.doorHeight;
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

  set doorColor(value: number) {
    this.propertySet.doorColor = toColorNumber(value, this.propertySet.doorColor);
    this.setOPMaterial();
  }

  get doorColor() {
    return this.propertySet.doorColor;
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
      ["frame", "swingArc", "panel"],
      ["frame", "panel"],
    );
  }

  constructor(baseDoorConfig?: DoorOptions) {
    // Call the parent class (Opening) constructor
    super({
      start: new Vector3(0, 0, 0),
      end: new Vector3(1, 0, 0),
      color: 0x00ff00,
    });

    this.subElements2D = new Map<Door2DSubElementType, THREE.Object3D>();
    this.subElements3D = new Map<Door3DSubElementType, THREE.Object3D>();
    
    if (baseDoorConfig) {
      this.propertySet = {
        ...this.propertySet,
        ...baseDoorConfig,
        placement: normalizePlacement(baseDoorConfig, this.propertySet.placement),
      };
    }

    this.propertySet.ogid = this.ogid;
    this.setOPGeometry();
  }

  setOPConfig(config: DoorOptions): void {
    this.propertySet = {
      ...this.propertySet,
      ...config,
      placement: normalizePlacement(config, this.propertySet.placement),
    };
    this.setOPGeometry();
  }

  getOPConfig(): DoorOptions {
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
    // Set Parent Geometry (Line) based on the panel width
    const halfPanelWidth = this.propertySet.panelDimensions.width / 2 + this.propertySet.frameDimensions.width;
    this.setConfig({
      start: new Vector3(-halfPanelWidth, 0, 0),
      end: new Vector3(halfPanelWidth, 0, 0),
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
    const { panelDimensions, frameDimensions, doorHeight, doorColor, frameColor } = this.propertySet;
    const halfPanelWidth = panelDimensions.width / 2;
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
        new Vector3(-(halfPanelWidth + frameWidth / 2), 0, 0),
        new Vector3(-(halfPanelWidth + frameWidth / 2), doorHeight + frameWidth / 2, 0),
        new Vector3(halfPanelWidth + frameWidth / 2, doorHeight + frameWidth / 2, 0),
        new Vector3(halfPanelWidth + frameWidth / 2, 0, 0)
      ],
      profile: frameProfile,
      color: frameColor,
    });

    this.subElements3D.set("frame", frameSweep);
    this.add(frameSweep);

    const panelCuboid = new Cuboid({
      center: new Vector3(0, doorHeight / 2, 0),
      width: panelDimensions.width,
      height: doorHeight,
      depth: panelDimensions.thickness,
      color: doorColor,
    });

    this.subElements3D.set("panel", panelCuboid);
    this.add(panelCuboid);
  }

  private create2D(): void {
    const { panelDimensions, frameDimensions } = this.propertySet;

    const halfPanelWidth = panelDimensions.width / 2;
    const frameWidth = frameDimensions.width;
    clearObjectMap(this.subElements2D);

    // Create 2D Frame using Polygon
    const frameLeftPolyline = new Polygon({
      vertices: [
        new Vector3(-(halfPanelWidth + frameWidth), 0, -frameDimensions.thickness / 2),
        new Vector3(-(halfPanelWidth + frameWidth), 0, frameDimensions.thickness / 2),
        new Vector3(-(halfPanelWidth), 0, frameDimensions.thickness / 2),
        new Vector3(-(halfPanelWidth), 0, -frameDimensions.thickness / 2)
      ],
      color: this.propertySet.frameColor
    });

    const frameRightPolyline = new Polygon({
      vertices: [
        new Vector3(halfPanelWidth + frameWidth, 0, -frameDimensions.thickness / 2),
        new Vector3(halfPanelWidth + frameWidth, 0, frameDimensions.thickness / 2),
        new Vector3(halfPanelWidth, 0, frameDimensions.thickness / 2),
        new Vector3(halfPanelWidth, 0, -frameDimensions.thickness / 2),
        new Vector3(halfPanelWidth + frameWidth, 0, -frameDimensions.thickness / 2),
      ],
      color: this.propertySet.frameColor
    });

    const frameGroup = new THREE.Group();
    frameGroup.add(frameLeftPolyline);
    frameGroup.add(frameRightPolyline);

    this.subElements2D.set('frame', frameGroup);
    this.add(frameGroup);

    const panelPolygon = new Polygon({
      vertices: [
        new Vector3(-halfPanelWidth, 0, -panelDimensions.thickness / 2),
        new Vector3(-halfPanelWidth, 0, panelDimensions.thickness / 2),
        new Vector3(halfPanelWidth, 0, panelDimensions.thickness / 2),
        new Vector3(halfPanelWidth, 0, -panelDimensions.thickness / 2),
      ],
      color: this.propertySet.doorColor
    });

    this.subElements2D.set('panel', panelPolygon);
    this.add(panelPolygon);

    // Create Door Swing Arc using Arc
    const swingRadius = panelDimensions.width;
    const swingArc = new Arc({
      center: new Vector3(-halfPanelWidth, 0, 0),
      radius: swingRadius,
      startAngle: 0,
      endAngle: Math.PI / 2,
      color: 0x0000ff,
      segments: 32,
    });

    this.subElements2D.set('swingArc', swingArc);
    this.add(swingArc);
  }

  setOPMaterial(): void {
    const { doorColor, frameColor } = this.propertySet;

    const frameGroup2D = this.subElements2D.get('frame') as THREE.Group | undefined;
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

    const panel2D = this.subElements2D.get('panel') as Polygon | undefined;
    if (panel2D) {
      panel2D.color = doorColor;
    }

    const frame3D = this.subElements3D.get('frame') as Sweep | undefined;
    if (frame3D) {
      frame3D.color = frameColor;
    }

    const panel3D = this.subElements3D.get('panel') as Cuboid | undefined;
    if (panel3D) {
      panel3D.color = doorColor;
    }
  }

}
