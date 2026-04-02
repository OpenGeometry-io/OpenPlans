import * as THREE from "three";
import { Arc, Cuboid, Polygon, Vector3 } from "opengeometry";

import type { Placement } from "../../types";
import { ElementType, DoorType } from "../base-type";
import { DoorMaterialType } from "./door";
import {
  DualViewPolylineElement,
  DEFAULT_PLACEMENT,
  toColorNumber,
} from "../shared/dual-view";
import { rectVertices } from "../shared/geometry";

function closedRectPoints(width: number, depth: number) {
  const vertices = rectVertices(width, depth);
  return [...vertices, vertices[0]];
}

export interface DoubleDoorOptions {
  ogid?: string;
  labelName: string;
  type: ElementType.DOOR;
  doorType: DoorType;
  panelMaterial: DoorMaterialType;
  doorDimensions: {
    width: number;
    thickness: number;
  };
  frameDimensions: {
    width: number;
    thickness: number;
  };
  doorHeight: number;
  mullionWidth: number;
  leftSwingRotation: number;
  rightSwingRotation: number;
  doorColor: number;
  frameColor: number;
  placement?: Placement;
}

export class DoubleDoor extends DualViewPolylineElement<DoubleDoorOptions> {
  ogType = ElementType.DOOR;

  constructor(config?: Partial<DoubleDoorOptions>) {
    super({
      labelName: "Double Door",
      type: ElementType.DOOR,
      doorType: DoorType.DOUBLEDOOR,
      panelMaterial: DoorMaterialType.WOOD,
      doorDimensions: {
        width: 1.8,
        thickness: 0.08,
      },
      frameDimensions: {
        width: 0.18,
        thickness: 0.12,
      },
      doorHeight: 2.1,
      mullionWidth: 0.08,
      leftSwingRotation: Math.PI / 2,
      rightSwingRotation: Math.PI / 2,
      doorColor: 0x8b4513,
      frameColor: 0x5f4635,
      placement: DEFAULT_PLACEMENT,
    }, config);
    this.setOPGeometry();
  }

  get labelName() { return this.propertySet.labelName; }
  set labelName(value: string) { this.propertySet.labelName = value; }

  get doorDimensions() { return this.propertySet.doorDimensions; }
  set doorDimensions(value: { width: number; thickness: number }) { this.propertySet.doorDimensions = value; this.setOPGeometry(); }

  get doorWidth() { return this.propertySet.doorDimensions.width; }
  set doorWidth(value: number) {
    this.propertySet.doorDimensions = {
      ...this.propertySet.doorDimensions,
      width: Math.max(0.8, value),
    };
    this.setOPGeometry();
  }

  get doorThickness() { return this.propertySet.doorDimensions.thickness; }
  set doorThickness(value: number) {
    this.propertySet.doorDimensions = {
      ...this.propertySet.doorDimensions,
      thickness: Math.max(0.04, value),
    };
    this.setOPGeometry();
  }

  get frameDimensions() { return this.propertySet.frameDimensions; }
  set frameDimensions(value: { width: number; thickness: number }) { this.propertySet.frameDimensions = value; this.setOPGeometry(); }

  get frameWidth() { return this.propertySet.frameDimensions.width; }
  set frameWidth(value: number) {
    this.propertySet.frameDimensions = {
      ...this.propertySet.frameDimensions,
      width: Math.max(0.05, value),
    };
    this.setOPGeometry();
  }

  get frameThickness() { return this.propertySet.frameDimensions.thickness; }
  set frameThickness(value: number) {
    this.propertySet.frameDimensions = {
      ...this.propertySet.frameDimensions,
      thickness: Math.max(0.04, value),
    };
    this.setOPGeometry();
  }

  get doorHeight() { return this.propertySet.doorHeight; }
  set doorHeight(value: number) { this.propertySet.doorHeight = Math.max(1.6, value); this.setOPGeometry(); }

  get mullionWidth() { return this.propertySet.mullionWidth; }
  set mullionWidth(value: number) { this.propertySet.mullionWidth = Math.max(0.02, value); this.setOPGeometry(); }

  get leftSwingRotation() { return this.propertySet.leftSwingRotation; }
  set leftSwingRotation(value: number) { this.propertySet.leftSwingRotation = value; this.setOPGeometry(); }

  get rightSwingRotation() { return this.propertySet.rightSwingRotation; }
  set rightSwingRotation(value: number) { this.propertySet.rightSwingRotation = value; this.setOPGeometry(); }

  get doorColor() { return this.propertySet.doorColor; }
  set doorColor(value: number) { this.propertySet.doorColor = toColorNumber(value, this.propertySet.doorColor); this.setOPGeometry(); }

  get frameColor() { return this.propertySet.frameColor; }
  set frameColor(value: number) { this.propertySet.frameColor = toColorNumber(value, this.propertySet.frameColor); this.setOPGeometry(); }

  setOPGeometry() {
    const width = this.propertySet.doorDimensions.width + this.propertySet.frameDimensions.width * 2;
    const depth = Math.max(this.propertySet.doorDimensions.thickness, this.propertySet.frameDimensions.thickness);
    this.setConfig({
      points: closedRectPoints(width, depth),
      color: 0,
    });
    this.rebuildViews();
  }

  protected build2D() {
    const { doorDimensions, frameDimensions, mullionWidth } = this.propertySet;
    const panelHalfDepth = doorDimensions.thickness / 2;
    const halfWidth = doorDimensions.width / 2;
    const leafWidth = Math.max(0.2, (doorDimensions.width - mullionWidth) / 2);

    this.createPlanPolygon({
      key: "leftFrame",
      color: this.propertySet.frameColor,
      vertices: rectVertices(frameDimensions.width, frameDimensions.thickness),
      position: [-(halfWidth + frameDimensions.width / 2), 0.001, 0],
    });
    this.createPlanPolygon({
      key: "rightFrame",
      color: this.propertySet.frameColor,
      vertices: rectVertices(frameDimensions.width, frameDimensions.thickness),
      position: [halfWidth + frameDimensions.width / 2, 0.001, 0],
    });
    this.createPlanPolygon({
      key: "mullion",
      color: this.propertySet.frameColor,
      vertices: rectVertices(mullionWidth, frameDimensions.thickness),
      position: [0, 0.001, 0],
    });

    const leftPanelGroup = new THREE.Group();
    leftPanelGroup.position.set(-halfWidth, 0.002, 0);
    leftPanelGroup.rotation.y = this.propertySet.leftSwingRotation;
    leftPanelGroup.add(new Polygon({
      vertices: [
        new Vector3(0, 0, -panelHalfDepth),
        new Vector3(0, 0, panelHalfDepth),
        new Vector3(leafWidth, 0, panelHalfDepth),
        new Vector3(leafWidth, 0, -panelHalfDepth),
      ],
      color: this.propertySet.doorColor,
    }));
    this.register2D("leftPanel", leftPanelGroup);

    const rightPanelGroup = new THREE.Group();
    rightPanelGroup.position.set(halfWidth, 0.002, 0);
    rightPanelGroup.rotation.y = -this.propertySet.rightSwingRotation;
    rightPanelGroup.add(new Polygon({
      vertices: [
        new Vector3(0, 0, -panelHalfDepth),
        new Vector3(0, 0, panelHalfDepth),
        new Vector3(-leafWidth, 0, panelHalfDepth),
        new Vector3(-leafWidth, 0, -panelHalfDepth),
      ],
      color: this.propertySet.doorColor,
    }));
    this.register2D("rightPanel", rightPanelGroup);

    const leftArc = new Arc({
      center: new Vector3(-halfWidth, 0, 0),
      radius: leafWidth,
      startAngle: 0,
      endAngle: this.propertySet.leftSwingRotation,
      color: this.propertySet.frameColor,
      segments: 32,
    });
    this.register2D("leftArc", leftArc);

    const rightArc = new Arc({
      center: new Vector3(halfWidth, 0, 0),
      radius: leafWidth,
      startAngle: Math.PI,
      endAngle: Math.PI - this.propertySet.rightSwingRotation,
      color: this.propertySet.frameColor,
      segments: 32,
    });
    this.register2D("rightArc", rightArc);

    this.topExportKeys = [
      "leftFrame",
      "rightFrame",
      "mullion",
      "leftPanel",
      "rightPanel",
      "leftArc",
      "rightArc",
    ];
  }

  protected build3D() {
    const { doorDimensions, frameDimensions, mullionWidth, doorHeight } = this.propertySet;
    const halfWidth = doorDimensions.width / 2;
    const leafWidth = Math.max(0.2, (doorDimensions.width - mullionWidth) / 2);
    const frameDepth = frameDimensions.thickness;
    const jambHeight = doorHeight + frameDimensions.width;

    this.createModelBox({
      key: "leftFrame",
      color: this.propertySet.frameColor,
      width: frameDimensions.width,
      height: jambHeight,
      depth: frameDepth,
      center: [-(halfWidth + frameDimensions.width / 2), jambHeight / 2, 0],
    });
    this.createModelBox({
      key: "rightFrame",
      color: this.propertySet.frameColor,
      width: frameDimensions.width,
      height: jambHeight,
      depth: frameDepth,
      center: [halfWidth + frameDimensions.width / 2, jambHeight / 2, 0],
    });
    this.createModelBox({
      key: "headFrame",
      color: this.propertySet.frameColor,
      width: doorDimensions.width + frameDimensions.width * 2,
      height: frameDimensions.width,
      depth: frameDepth,
      center: [0, doorHeight + frameDimensions.width / 2, 0],
    });
    this.createModelBox({
      key: "mullion",
      color: this.propertySet.frameColor,
      width: mullionWidth,
      height: doorHeight,
      depth: frameDepth,
      center: [0, doorHeight / 2, 0],
    });

    const leftPanelGroup = new THREE.Group();
    leftPanelGroup.position.set(-halfWidth, 0, 0);
    leftPanelGroup.rotation.y = this.propertySet.leftSwingRotation;
    leftPanelGroup.add(new Cuboid({
      center: new Vector3(leafWidth / 2, doorHeight / 2, 0),
      width: leafWidth,
      height: doorHeight,
      depth: doorDimensions.thickness,
      color: this.propertySet.doorColor,
    }));
    this.register3D("leftPanel", leftPanelGroup);

    const rightPanelGroup = new THREE.Group();
    rightPanelGroup.position.set(halfWidth, 0, 0);
    rightPanelGroup.rotation.y = -this.propertySet.rightSwingRotation;
    rightPanelGroup.add(new Cuboid({
      center: new Vector3(-leafWidth / 2, doorHeight / 2, 0),
      width: leafWidth,
      height: doorHeight,
      depth: doorDimensions.thickness,
      color: this.propertySet.doorColor,
    }));
    this.register3D("rightPanel", rightPanelGroup);

    this.isometricExportKeys = [
      "leftFrame",
      "rightFrame",
      "headFrame",
      "mullion",
      "leftPanel",
      "rightPanel",
    ];
  }

  setOPMaterial() {}
}
