import * as THREE from 'three';
import { Polyline, Vector3 } from '../kernel/';
import { IPrimitive } from './base-type';
// import { DimensionTool } from '../dimensions';

export interface PolylineOptions {
  ogid?: string;
  points: Array<Array<number>>;
  color: number;
}

// TODO: Add a method to modify individual points, this will provide the ability to drag the points and move them
// TODO: Either implement modifying all points directly or provide a way to access and modify them through the API.

/**
 * Polyline Primitive Class
 * Extends the Polyline class from the kernel and implements the IPrimitive interface.
 * Manages properties, sub-nodes, selection, and editing states.
 */

export class PolylinePrimitive extends Polyline implements IPrimitive {
  ogType: string = 'PolylinePrimitive';
  subNodes: Map<string, THREE.Object3D>;
  
  selected: boolean;
  edit: boolean;

  propertySet: PolylineOptions = {
    points: [[0, 0, 0], [1, 0, 0], [1, 0, 1]],
    color: 0x0000ff
  };

  //dimensionsSet: Map<string, THREE.Object3D> = new Map<string, THREE.Object3D>();
  // private activeProperty: string | null = null;

  set lineColor(value: number) {
    this.propertySet.color = value;

    this.color = value;
  }

  get lineColor(): number {
    return this.propertySet.color;
  }

  constructor(polylineConfig?: PolylineOptions) {
    super({
      ogid: polylineConfig?.ogid,
      points: [...(polylineConfig?.points || [[0, 0, 0], [1, 0, 0], [1, 0, 1]])].map(point => new Vector3(...point)),
      color: polylineConfig?.color || 0x0000ff
    });

    this.subNodes = new Map<string, THREE.Object3D>();
    
    this.selected = false;
    this.edit = false;

    if (polylineConfig) {
      this.propertySet = { ...this.propertySet, ...polylineConfig };
    }

    this.propertySet.ogid = this.ogid;
    this.setOPGeometry();
  }

  setOPConfig(config: PolylineOptions): void {
  }

  getOPConfig(): PolylineOptions {
    return this.propertySet;
  }

  setOPGeometry(): void {

    const pointsArray: Array<Vector3> = this.propertySet.points.map(point => new Vector3(...point));
    
    this.setConfig({
      points: pointsArray,
      color: this.propertySet.color
    });
  }

  setOPMaterial(): void { 
  }

  attachPoint(point: Array<number>): void {
    this.propertySet.points.push(point);
    this.setOPGeometry();
  }
}