import * as THREE from 'three';
import { Line, Vector3 } from 'opengeometry';
import { IPrimitive } from './base-type';

export interface LineOptions {
  ogid?: string;
  startPoint: Array<number>;
  endPoint: Array<number>;
  color: number;
  fatLines: boolean;
  width: number;
}

/*
 * Line Primitive Class
 * Extends the Line class from the kernel and implements the IPrimitive interface.
 * Manages properties, sub-nodes, selection, and editing states.
 */
export class LinePrimitive extends Line implements IPrimitive {
  ogType: string = 'LinePrimitive';
  subNodes: Map<string, THREE.Object3D>;

  selected: boolean = false;
  edit: boolean = false;

  propertySet: LineOptions = {
    startPoint: [0, 0, 0],
    endPoint: [1, 0, 0],
    color: 0x000000,
    fatLines: true,
    width: 4,
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

  set lineColor(value: number) {
    this.propertySet.color = value;

    this.color = value;
  }

  get lineColor(): number {
    return this.propertySet.color;
  }

  constructor(lineConfig?: LineOptions) {
    super({
      ogid: lineConfig?.ogid,
      start: new Vector3(lineConfig?.startPoint ? lineConfig.startPoint[0] : 0, lineConfig?.startPoint ? lineConfig.startPoint[1] : 0, lineConfig?.startPoint ? lineConfig.startPoint[2] : 0),
      end: new Vector3(lineConfig?.endPoint ? lineConfig.endPoint[0] : 1, lineConfig?.endPoint ? lineConfig.endPoint[1] : 0, lineConfig?.endPoint ? lineConfig.endPoint[2] : 0),
      color: lineConfig?.color || 0x000000,
    });

    this.subNodes = new Map<string, THREE.Object3D>();

    if (lineConfig) {
      this.propertySet = { ...this.propertySet, ...lineConfig };
    }

    this.propertySet.ogid = this.ogid;
    this.setOPGeometry();
  }

  setOPConfig(_config: LineOptions): void {

  }

  getOPConfig(): LineOptions {
    return this.propertySet;
  }

  setOPGeometry(): void {
    this.setConfig({
      start: new Vector3(this.propertySet.startPoint[0], this.propertySet.startPoint[1], this.propertySet.startPoint[2]),
      end: new Vector3(this.propertySet.endPoint[0], this.propertySet.endPoint[1], this.propertySet.endPoint[2]),
      color: this.propertySet.color,
    });
  }

  setOPMaterial(): void {
  }
}
