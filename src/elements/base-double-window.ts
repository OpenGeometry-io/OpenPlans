import * as THREE from 'three';

import { Cuboid, Line, Opening, Vector3 } from "../kernel/";
import { ElementType, WindowType } from "./base-type";
import { IShape } from '../shapes/base-type';

export interface OPDoubleWindow {
  ogid?: string;
  labelName: string;
  type: ElementType.WINDOW;
  dimensions: {
    start: {
      x: number;
      y: number;
      z: number;
    };
    end: {
      x: number;
      y: number;
      z: number;
    };
    length: number;
  };
  windowPosition: [number, number, number];
  windowType: WindowType;
  windowHeight: number;
  windowThickness: number;
  frameThickness: number;
  frameColor: number;
  windowColor: number;
  leftWindowRotation: number;
  rightWindowRotation: number;
  windowQuadrant: number;
  sillHeight: number; // Height from floor to window bottom
  mullionWidth: number; // Width of the center divider
  coordinates: Array<[number, number, number]>;
}

export type ElementViewType = 'plan' | '3d';
export type SubElementType = 'frame' | 'finish' | 'opening' | 'panel' | 'leftPanel' | 'rightPanel' | 'mullion';
export type WindowQuadrant = 1 | 2 | 3 | 4;

export class BaseDoubleWindow extends Opening implements IShape {
  ogType: string = ElementType.WINDOW;

  skeleton: Line;
  subElements: Map<SubElementType, THREE.Object3D> = new Map();

  selected: boolean = false;
  edit: boolean = false;

  // By Default the Plan View is Mid Section View
  // If needed Plan view can be overridden to add some other geometry
  views: Map<ElementViewType, THREE.Object3D> = new Map();

  propertySet: OPDoubleWindow = {
    type: ElementType.WINDOW,
    labelName: 'Double Window',
    dimensions: {
      start: { x: -1, y: 0, z: 0 },
      end: { x: 1, y: 0, z: 0 },
      length: 2,
    },
    windowPosition: [0, 0, 0],
    windowType: WindowType.CASEMENT,
    windowHeight: 1.2,
    windowThickness: 0.05,
    frameThickness: 0.15,
    windowColor: 0x87CEEB,
    frameColor: 0x000000,
    leftWindowRotation: 1.5,
    rightWindowRotation: 1.5,
    windowQuadrant: 1,
    sillHeight: 0.9,
    mullionWidth: 0.05,
    // Coordinates is a calulated property, not set by user
    coordinates: [],
  };

  set labelName(value: string) {
    this.propertySet.labelName = value;
  }

  get labelName() {
    return this.propertySet.labelName;
  }

  set leftWindowRotation(value: number) {
    this.propertySet.leftWindowRotation = value;

    const leftWindowGroup = this.subElements.get('leftPanel');
    if (!leftWindowGroup) return;
    if (value < 1 || value > 2) return;
    
    switch (this.propertySet.windowQuadrant) {
      case 1:
        leftWindowGroup.rotation.y = Math.PI + (Math.PI / -value);
        break;
      case 2:
        leftWindowGroup.rotation.y = Math.PI +  (Math.PI / value);
        break;
      case 3:
        leftWindowGroup.rotation.y = Math.PI +  (Math.PI / -value);
        break;
      case 4:
        leftWindowGroup.rotation.y = Math.PI +  (Math.PI / value);
        break;
    }
  }

  set rightWindowRotation(value: number) {
    this.propertySet.rightWindowRotation = value;

    const rightWindowGroup = this.subElements.get('rightPanel');
    if (!rightWindowGroup) return;
    if (value < 1 || value > 2) return;
    
    switch (this.propertySet.windowQuadrant) {
      case 1:
        rightWindowGroup.rotation.y = Math.PI + (Math.PI / -value);
        break;
      case 2:
        rightWindowGroup.rotation.y = Math.PI +  (Math.PI / value);
        break;
      case 3:
        rightWindowGroup.rotation.y = Math.PI +  (Math.PI / -value);
        break;
      case 4:
        rightWindowGroup.rotation.y = Math.PI +  (Math.PI / value);
        break;
    }
  }

  set windowQuadrant(value: number) {
    if (value < 1 || value > 4) return;
    this.propertySet.windowQuadrant = value;
    this.setOPGeometry();
  }

  set windowPosition(point: [number, number, number]) {
    this.propertySet.windowPosition = point;
    this.position.set(point[0], point[1], point[2]);
    // TODO: We need to update the Position at Kernel Level as well
  }

  set windowLength(value: number) {
    this.propertySet.dimensions.length = value;

    // Later make this according to the direction of the line
    this.propertySet.dimensions.start.x = -value / 2;
    this.propertySet.dimensions.start.y = 0;
    this.propertySet.dimensions.start.z = 0;

    this.propertySet.dimensions.end.x = value / 2;
    this.propertySet.dimensions.end.y = 0;
    this.propertySet.dimensions.end.z = 0;

    this.setOPGeometry();
    this.setConfig({
      depth: this.propertySet.windowThickness * 1.1,
      height: this.propertySet.windowHeight * 1.1,
      width: value * 1.1,
      center: new Vector3(0, this.propertySet.sillHeight + this.propertySet.windowHeight / 2, 0),
      color: this.propertySet.windowColor,
    });
  }

  set windowThickness(value: number) {
    this.propertySet.windowThickness = value;

    this.setOPGeometry();
    this.setConfig({
      depth: value * 1.1,
      height: this.propertySet.windowHeight * 1.1,
      width: this.propertySet.dimensions.length * 1.1,
      center: new Vector3(0, this.propertySet.sillHeight + this.propertySet.windowHeight / 2, 0),
      color: this.propertySet.windowColor,
    });
  }

  constructor(baseWindowConfig?: OPDoubleWindow) {
    // Call the parent class (Opening) constructor
    super();
    this.skeleton = new Line();
    this.add(this.skeleton);

    this.subElements = new Map<SubElementType, THREE.Object3D>();
    
    if (baseWindowConfig) {
      this.propertySet = { ...baseWindowConfig, ...this.options };
    }

    this.setOPGeometry();
  }

  private createDoubleWindow() {
    const smallGapOffset = 0.01;
    const panelWidth = (this.propertySet.dimensions.length - 0.2 - this.propertySet.mullionWidth) / 2 - smallGapOffset;

    // Left Window Panel
    const leftWindowPanel = new Cuboid({
      center: new Vector3(0, this.propertySet.sillHeight + this.propertySet.windowHeight / 2, 0),
      width: panelWidth,
      height: this.propertySet.windowHeight - 0.1 - smallGapOffset,
      depth: this.propertySet.windowThickness,
      color: this.propertySet.windowColor,
    });

    const leftFrameClipMesh = new THREE.SphereGeometry(0.01, 32, 32);
    const leftFrameClipMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftFrameClip = new THREE.Mesh(leftFrameClipMesh, leftFrameClipMat);

    // Right Window Panel
    const rightWindowPanel = new Cuboid({
      center: new Vector3(0, this.propertySet.sillHeight + this.propertySet.windowHeight / 2, 0),
      width: panelWidth,
      height: this.propertySet.windowHeight - 0.1 - smallGapOffset,
      depth: this.propertySet.windowThickness,
      color: this.propertySet.windowColor,
    });

    const rightFrameClipMesh = new THREE.SphereGeometry(0.01, 32, 32);
    const rightFrameClipMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const rightFrameClip = new THREE.Mesh(rightFrameClipMesh, rightFrameClipMat);

    const leftPanelOffset = -(this.propertySet.mullionWidth / 2 + panelWidth / 2);
    const rightPanelOffset = this.propertySet.mullionWidth / 2 + panelWidth / 2;

    switch (this.propertySet.windowQuadrant) {
      case 1:
        leftFrameClip.position.set(-this.propertySet.mullionWidth / 2 - 0.05, this.propertySet.sillHeight, this.propertySet.frameThickness / 2);
        leftWindowPanel.position.set(leftPanelOffset + 0.05, 0, -this.propertySet.windowThickness / 2);
        
        rightFrameClip.position.set(this.propertySet.mullionWidth / 2 + 0.05, this.propertySet.sillHeight, this.propertySet.frameThickness / 2);
        rightWindowPanel.position.set(rightPanelOffset - 0.05, 0, -this.propertySet.windowThickness / 2);
        break;
      case 2:
        leftFrameClip.position.set(-this.propertySet.mullionWidth / 2 - 0.05, this.propertySet.sillHeight, this.propertySet.frameThickness / 2);
        leftWindowPanel.position.set(leftPanelOffset + 0.05, 0, -this.propertySet.windowThickness / 2);
        
        rightFrameClip.position.set(this.propertySet.mullionWidth / 2 + 0.05, this.propertySet.sillHeight, this.propertySet.frameThickness / 2);
        rightWindowPanel.position.set(rightPanelOffset - 0.05, 0, -this.propertySet.windowThickness / 2);
        break;
      case 3:
        leftFrameClip.position.set(-this.propertySet.mullionWidth / 2 - 0.05, this.propertySet.sillHeight, -this.propertySet.frameThickness / 2);
        leftWindowPanel.position.set(leftPanelOffset + 0.05, 0, this.propertySet.windowThickness / 2);
        
        rightFrameClip.position.set(this.propertySet.mullionWidth / 2 + 0.05, this.propertySet.sillHeight, -this.propertySet.frameThickness / 2);
        rightWindowPanel.position.set(rightPanelOffset - 0.05, 0, this.propertySet.windowThickness / 2);
        break;
      case 4:
        leftFrameClip.position.set(-this.propertySet.mullionWidth / 2 - 0.05, this.propertySet.sillHeight, -this.propertySet.frameThickness / 2);
        leftWindowPanel.position.set(leftPanelOffset + 0.05, 0, this.propertySet.windowThickness / 2);
        
        rightFrameClip.position.set(this.propertySet.mullionWidth / 2 + 0.05, this.propertySet.sillHeight, -this.propertySet.frameThickness / 2);
        rightWindowPanel.position.set(rightPanelOffset - 0.05, 0, this.propertySet.windowThickness / 2);
        break;
      default:
        break;
    }

    leftFrameClip.add(leftWindowPanel);
    this.add(leftFrameClip);
    this.subElements.set('leftPanel', leftFrameClip);

    rightFrameClip.add(rightWindowPanel);
    this.add(rightFrameClip);
    this.subElements.set('rightPanel', rightFrameClip);
  }

  private createMullion() {
    // Center mullion (vertical divider between two windows)
    const mullion = new Cuboid({
      center: new Vector3(0, this.propertySet.sillHeight + this.propertySet.windowHeight / 2, 0),
      width: this.propertySet.mullionWidth,
      height: this.propertySet.windowHeight,
      depth: this.propertySet.frameThickness,
      color: this.propertySet.frameColor,
    });

    this.add(mullion);
    this.subElements.set('mullion', mullion);
  }

  // TODO: We will later replace this with SweepedSolid along a path with a Sketch Profile
  private createFrame() {
    // Left Side Frame using Cuboid
    const leftFrame = new Cuboid({
      center: new Vector3(this.propertySet.dimensions.start.x, this.propertySet.sillHeight + this.propertySet.windowHeight / 2, 0),
      width: 0.1,
      height: this.propertySet.windowHeight,
      depth: this.propertySet.frameThickness,
      color: this.propertySet.frameColor,
    });

    // Right Side Frame using Cuboid
    const rightFrame = new Cuboid({
      center: new Vector3(this.propertySet.dimensions.end.x, this.propertySet.sillHeight + this.propertySet.windowHeight / 2, 0),
      width: 0.1,
      height: this.propertySet.windowHeight,
      depth: this.propertySet.frameThickness,
      color: this.propertySet.frameColor,
    });

    // Top Frame using Cuboid
    const topFrame = new Cuboid({
      center: new Vector3(0, this.propertySet.sillHeight + this.propertySet.windowHeight, 0),
      width: this.propertySet.dimensions.length + 0.1,
      height: 0.1,
      depth: this.propertySet.frameThickness,
      color: this.propertySet.frameColor,
    });

    // Bottom Frame (Sill) using Cuboid
    const sillFrame = new Cuboid({
      center: new Vector3(0, this.propertySet.sillHeight, 0),
      width: this.propertySet.dimensions.length + 0.1,
      height: 0.1,
      depth: this.propertySet.frameThickness,
      color: this.propertySet.frameColor,
    });

    console.log(this.children.length + ' children in the double window after creating frame.');
    const frameGroup = new THREE.Group();
    frameGroup.add(leftFrame);
    frameGroup.add(rightFrame);
    frameGroup.add(topFrame);
    frameGroup.add(sillFrame);

    this.add(frameGroup);

    this.subElements.set('frame', frameGroup);
  }

  setOPConfig(config: OPDoubleWindow): void {
    this.discardGeometry();
    this.propertySet = config;
  }

  getOPConfig(): OPDoubleWindow {
    return this.propertySet;
  }

  setOPGeometry(): void {
    // Implement geometry update logic here if needed
    if (this.children.length > 1) {
      this.remove(...this.children.slice(1));
    }

    this.createFrame();
    this.createMullion();
    this.createDoubleWindow();
  }

  setOPMaterial(): void {
    // Implement material update logic here
  }

  // TODO: Add pure profile setter for elements/primitives where only Line rendering is needed
  showProfileView(status: boolean): void {
    for (const element of this.subElements.values()) {
      if (element.children.length > 0) {
        for (const child of element.children) {
          // @ts-ignore
          child.material.opacity = status ? 0.0 : 1.0;
          // @ts-ignore
          child.outline = status;
        }
      }
    }
  }
}
