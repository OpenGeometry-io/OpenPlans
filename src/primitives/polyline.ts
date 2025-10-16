import * as THREE from 'three';
import { Polyline, IArcOptions, Vector3, IPolylineOptions } from '../kernel/dist';
import { IPrimitive } from './base-type';
import { DimensionTool } from '../dimensions';

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

  propertySet: IPolylineOptions;
  dimensionsSet: Map<string, THREE.Object3D> = new Map<string, THREE.Object3D>();

  private activeProperty: string | null = null;

  constructor(properties?: IPolylineOptions) {
    super(properties);
    this.subNodes = new Map<string, THREE.Object3D>();
    this.selected = false;
    this.edit = false;
    
    if (properties) {
      this.propertySet = { ...properties, ...this.options };
    } else {
      // Default properties from the Arc class/Kernel
      this.propertySet = this.options;
    }
  }

  setOPConfig(config: IPolylineOptions): void {
    this.discardGeometry();

    console.log('Setting Polyline Config:', config);
    this.propertySet = config;
    this.setConfig(config);
    console.log(this.geometry.attributes.position);
  }

  getOPConfig(): IPolylineOptions {
    return this.propertySet;
  }

  setOPGeometry(): void {
    // Implement geometry update logic here if needed
  }

  setOPMaterial(): void {
    // Implement material update logic here
    // const line = this.subNodes.get('arcLine') as THREE.Line;
    // if (line) {
    //   (line.material as THREE.LineBasicMaterial).color.set(0x0000ff);
    // }
  }
}