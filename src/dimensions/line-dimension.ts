import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { ILineOptions, Line, Vector3 } from "../kernel/";
import * as THREE from "three";
import { IPrimitive } from "../primitives/base-type";

export interface LengthDimensionOptions {
  ogid?: string;
  startPoint: Array<number>;
  endPoint: Array<number>;
  color: number;
  witnessLineLength: number;
  // Value can is is auto calculated
  value: number;
}

export class LineDimension extends Line implements IPrimitive {
  ogType: string = 'LineDimension';
  subNodes: Map<string, THREE.Object3D>;

  selected: boolean = false;
  edit: boolean = false;

  propertySet: LengthDimensionOptions = {
    startPoint: [0, 0, 0],
    endPoint: [2, 0, 0],
    color: 0x000000,
    witnessLineLength: 1,
    value: 1,
  };

  set startPoint(value: Array<number>) {
    this.propertySet.startPoint = value;

    this.setOPGeometry();
  }

  get startPoint(): Array<number> {
    return this.propertySet.startPoint;
  }

  set endPoint(value: Array<number>) {
    this.propertySet.endPoint = value;

    this.setOPGeometry();
  }

  get endPoint(): Array<number> {
    return this.propertySet.endPoint;
  }

  set witnessLineLength(value: number) {
    this.propertySet.witnessLineLength = value;
  }

  get witnessLineLength(): number {
    return this.propertySet.witnessLineLength;
  }

  set lineColor(value: number) {
    this.propertySet.color = value;

    this.color = value;
  }

  get lineColor(): number {
    return this.propertySet.color;
  }

  constructor(lineDimensionConfig?: LengthDimensionOptions) {
    super({
      ogid: lineDimensionConfig?.ogid,
      start: new Vector3(...(lineDimensionConfig?.startPoint || [0, 0, 0])),
      end: new Vector3(...(lineDimensionConfig?.endPoint || [1, 0, 0])),
      color: lineDimensionConfig?.color || 0x000000,
    });

    this.subNodes = new Map<string, THREE.Object3D>();

    if (lineDimensionConfig) {
      this.propertySet = { ...this.propertySet, ...lineDimensionConfig };
    }

    this.propertySet.ogid = this.ogid;
    this.setOPGeometry();
  }

  setOPConfig(config: LengthDimensionOptions): void {

  }

  getOPConfig(): LengthDimensionOptions {
    return this.propertySet;
  }

  setOPGeometry(): void {
    this.setConfig({
      start: new Vector3(...this.propertySet.startPoint),
      end: new Vector3(...this.propertySet.endPoint),
      color: this.propertySet.color,
    });
    console.log("test")
    this.createCrossHairs();
  }

  createCrossHairs() {
    if (this.subNodes.has("witnessLineLeft")) {
      const witnessLineLeft = this.subNodes.get("witnessLineLeft") as Line;
      witnessLineLeft.removeFromParent();
      witnessLineLeft.discardGeometry();
    }

    if (this.subNodes.has("witnessLineRight")) {
      const witnessLineRight = this.subNodes.get("witnessLineRight") as Line;
      witnessLineRight.removeFromParent();
      witnessLineRight.discardGeometry();
    }

    const { startPoint, endPoint, witnessLineLength } = this.propertySet;

    const direction = new Vector3(...endPoint).subtract(new Vector3(...startPoint)).normalize();
    const perpendicularLeft = new Vector3(
      direction.z,
      0,
      -direction.x
    ).normalize();

    // Create witness line for End Point
    const wOneStart = new Vector3(endPoint[0], endPoint[1], endPoint[2]);
    const wOneEnd = new Vector3(endPoint[0], endPoint[1], endPoint[2]).add(
      perpendicularLeft.multiply_scalar(witnessLineLength)
    );

    const witnessLineLeft = new Line({
      start: wOneStart,
      end: wOneEnd,
      color: 0xff00ff,
    });

    this.add(witnessLineLeft);
    this.subNodes.set("witnessLineLeft", witnessLineLeft);

    // Create witness line for Start Point
    const wTwoStart = new Vector3(startPoint[0], startPoint[1], startPoint[2]);

    const wTwoEnd = new Vector3(startPoint[0], startPoint[1], startPoint[2]).add(
      perpendicularLeft.multiply_scalar(witnessLineLength)
    );

    const witnessLineRight = new Line({
      start: wTwoStart,
      end: wTwoEnd,
      color: 0xff00ff,
    });

    this.add(witnessLineRight);
    this.subNodes.set("witnessLineRight", witnessLineRight);
  }

  setOPMaterial(): void {
  }
}
