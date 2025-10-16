import * as THREE from 'three';
import { Line, ILineOptions } from '../kernel/dist';
import { IPrimitive } from './base-type';

/*
 * Line Primitive Class
 * Extends the Line class from the kernel and implements the IPrimitive interface.
 * Manages properties, sub-nodes, selection, and editing states.
 */

export class LinePrimitive extends Line implements IPrimitive {
  ogType: string = 'LinePrimitive';
  subNodes: Map<string, THREE.Object3D>;
  selected: boolean;
  edit: boolean;

  propertySet: ILineOptions;

  constructor(properties?: ILineOptions) {
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

  setOPConfig(config: ILineOptions): void {
    this.discardGeometry();

    console.log('Setting Line Config:', config);
    this.propertySet = config;
    this.setConfig(config);
    console.log(this.geometry.attributes.position);
  }

  getOPConfig(): ILineOptions {
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