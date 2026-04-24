import * as THREE from "three";
import { IShape } from "../../shapes/base-type";
import { ElementType, DoorType } from "./../base-type";
import { Arc, Cuboid, Line, Polygon, Sweep, Vector3 } from "opengeometry";
import type { Placement, PlanExportView, PlanVectorExportable } from "../../types";
import { Opening } from "./opening";

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

export interface DoorOptions {
  ogid?: string;
  labelName: string;
  type: ElementType.DOOR;
  hostWallId?: string;
  // Station point is the reference point for the door's position and rotation, defined in the local coordinate system of the host wall. It can be used to determine the door's placement along the wall and its swing direction. If not provided, it will default to the center of the door panel.
  stationPoint: [number, number, number];
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
export class Door extends Line implements IShape
  //, PlanVectorExportable 
  {
  ogType: string = ElementType.DOOR;

  subElements2D: Map<Door2DSubElementType, THREE.Object3D> = new Map();
  private isProfileView = true;
  subElements3D: Map<Door3DSubElementType, THREE.Object3D> = new Map();
  private isModelView = true;

  private _outlineEnabled: boolean = true;

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
    stationPoint: [0, 0, 0],
    doorType: DoorType.WOOD,
    doorHeight: 2.1,
    doorColor: 0xcc7a00,
    frameColor: 0x654321,
    panelMaterial: DoorMaterialType.WOOD,
    doorRotation: 1.5,
    doorQuadrant: 1,
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
  }

  get station() { return this.propertySet.stationPoint; }
  set station(value: [number, number, number]) {
    this.propertySet.stationPoint = value;
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
    this.propertySet.doorColor = value;
    this.setOPMaterial();
  }

  get doorColor() {
    return this.propertySet.doorColor;
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
      if (key === 'door-opening') {
        obj.visible = false; // The opening geometry is used for boolean operations and as a reference for the door's position, so it should be invisible in both 2D and 3D views.
      } else {
        obj.visible = value;
      }
    }
  }

  get modelView() {
    return this.isModelView;
  }

  get opening() {
    return this.subElements3D.get('door-opening') as Opening;
  }

  // getExportRoots(view: PlanExportView): THREE.Object3D[] {
  //   return orderedRoots(
  //     view,
  //     this.subElements2D,
  //     this.subElements3D,
  //     ["frame", "swingArc", "panel", "door-opening"],
  //     ["frame", "panel", "door-opening"],
  //   );
  // }

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
      };
    }

    this.propertySet.ogid = this.ogid;
    this.setOPGeometry();
  }

  setOPConfig(config: DoorOptions): void {
    this.propertySet = {
      ...this.propertySet,
      ...config,
    };

    this.setOPGeometry();
    this.setOPMaterial();
  }

  getOPConfig(): DoorOptions {
    return this.propertySet;
  }

  dispose() {
    for (const obj of this.subElements2D.values()) {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(mat => mat.dispose());
      } else if (mesh.material) {
        mesh.material.dispose();
      }

      mesh.removeFromParent();
    }
    for (const obj of this.subElements3D.values()) {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(mat => mat.dispose());
      } else if (mesh.material) {
        mesh.material.dispose();
      }

      mesh.removeFromParent();
    }

    this.subElements2D.clear();
    this.subElements3D.clear();
    this.discardGeometry();
  }

  setOPGeometry(): void {
    this.dispose();

    // Station point is the reference point for the door's position and rotation, defined in the local coordinate system of the host wall. It can be used to determine the door's placement along the wall and its swing direction. If not provided, it will default to the center of the door panel.
    const station = this.propertySet.hostWallId ? new Vector3(...this.propertySet.stationPoint) : new Vector3(0, 0, 0);

    // Set Parent Geometry (Line) based on the panel width
    const halfPanelWidth = this.propertySet.panelDimensions.width / 2 + this.propertySet.frameDimensions.width;
    this.setConfig({
      start: new Vector3(-halfPanelWidth + station.x, station.y, station.z),
      end: new Vector3(halfPanelWidth + station.x, station.y, station.z),
    });
    this.renderOrder = 1;

    this.create2D();
    this.create3D();

    // Create 2D and 3D Opening Geometry based on the door dimensions and type
    this.createOpening();

    // Retaining same outline and visibility settings for new geometry
    this.outline = this._outlineEnabled;
    this.profileView = this.isProfileView;
    this.modelView = this.isModelView;
  }

  // TODO: Do something about tolerances
  private createOpening(): void {
    const station = this.propertySet.hostWallId ? new Vector3(...this.propertySet.stationPoint) : new Vector3(0, 0, 0);

    const { panelDimensions, frameDimensions, doorHeight } = this.propertySet;
    const totalWidth = panelDimensions.width + frameDimensions.width * 2;
    // Add a small tolerance to the width and height to ensure the opening fully encompasses the door panel and frame, preventing z-fighting issues in 3D view and ensuring clear visibility of the opening in 2D view.
    const halfTotalWidth = totalWidth / 2 + 0.001; // Add a small tolerance to ensure the opening fully encompasses the door panel and frame
    const totalHeight = doorHeight + frameDimensions.width + 0.001; // Add a small tolerance to ensure the opening fully encompasses the door panel and frame
    const opening = new Opening({
      labelName: this.propertySet.labelName + " Opening",
      thickness: frameDimensions.thickness + 0.001, // Add a small tolerance to ensure the opening fully encompasses the door frame
      height: totalHeight,
      baseHeight: 0,
      points: [
        [-halfTotalWidth + station.x, station.y, station.z],
        [halfTotalWidth + station.x, station.y, station.z],
      ],
      // placement: {
      //   position: [0 + station.x, 0 + station.y, 0 + station.z],
      //   rotation: [0, 0, 0],
      //   scale: [1, 1, 1],
      // },
    });
    opening.outline = true;
    this.subElements3D.set('door-opening', opening);
    this.add(opening);
  }

  private create3D(): void {
    const station = this.propertySet.hostWallId ? new Vector3(...this.propertySet.stationPoint) : new Vector3(0, 0, 0);

    const { panelDimensions, frameDimensions, doorHeight, doorColor, frameColor } = this.propertySet;
    const halfPanelWidth = panelDimensions.width / 2;
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
        new Vector3(-(halfPanelWidth + frameWidth / 2) + station.x, station.y, station.z),
        new Vector3(-(halfPanelWidth + frameWidth / 2) + station.x, doorHeight + frameWidth / 2 + station.y, station.z),
        new Vector3(halfPanelWidth + frameWidth / 2 + station.x, doorHeight + frameWidth / 2 + station.y, station.z),
        new Vector3(halfPanelWidth + frameWidth / 2 + station.x, station.y, station.z)
      ],
      profile: frameProfile,
      color: frameColor,
    });

    this.subElements3D.set("frame", frameSweep);
    this.add(frameSweep);

    const panelCuboid = new Cuboid({
      center: new Vector3(0 + station.x, doorHeight / 2 + station.y, 0 + station.z),
      width: panelDimensions.width,
      height: doorHeight,
      depth: panelDimensions.thickness,
      color: doorColor,
    });

    this.subElements3D.set("panel", panelCuboid);
    this.add(panelCuboid);
  }

  // TODO: Later disable Y placement for 2D view elements
  private create2D(): void {
    const { panelDimensions, frameDimensions } = this.propertySet;

    const station = this.propertySet.hostWallId ? new Vector3(...this.propertySet.stationPoint) : new Vector3(0, 0, 0);

    const halfPanelWidth = panelDimensions.width / 2;
    const frameWidth = frameDimensions.width;

    // Create 2D Frame using Polygon
    const frameLeftPolyline = new Polygon({
      vertices: [
        new Vector3(-(halfPanelWidth + frameWidth) + station.x, station.y, -frameDimensions.thickness / 2 + station.z),
        new Vector3(-(halfPanelWidth + frameWidth) + station.x, station.y, frameDimensions.thickness / 2 + station.z),
        new Vector3(-(halfPanelWidth) + station.x, station.y, frameDimensions.thickness / 2 + station.z),
        new Vector3(-(halfPanelWidth) + station.x, station.y, -frameDimensions.thickness / 2 + station.z)
      ],
      color: this.propertySet.frameColor
    });

    const frameRightPolyline = new Polygon({
      vertices: [
        new Vector3(halfPanelWidth + frameWidth + station.x, station.y, -frameDimensions.thickness / 2 + station.z),
        new Vector3(halfPanelWidth + frameWidth + station.x, station.y, frameDimensions.thickness / 2 + station.z),
        new Vector3(halfPanelWidth + station.x, station.y, frameDimensions.thickness / 2 + station.z),
        new Vector3(halfPanelWidth + station.x, station.y, -frameDimensions.thickness / 2 + station.z),
        new Vector3(halfPanelWidth + frameWidth + station.x, station.y, -frameDimensions.thickness / 2 + station.z),
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
        new Vector3(-halfPanelWidth + station.x, station.y, -panelDimensions.thickness / 2 + station.z),
        new Vector3(-halfPanelWidth + station.x, station.y, panelDimensions.thickness / 2 + station.z),
        new Vector3(halfPanelWidth + station.x, station.y, panelDimensions.thickness / 2 + station.z),
        new Vector3(halfPanelWidth + station.x, station.y, -panelDimensions.thickness / 2 + station.z),
      ],
      color: this.propertySet.doorColor
    });

    this.subElements2D.set('panel', panelPolygon);
    this.add(panelPolygon);

    // Create Door Swing Arc using Arc
    const swingRadius = panelDimensions.width;
    const swingArc = new Arc({
      center: new Vector3(-halfPanelWidth + station.x, station.y, station.z),
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
