import * as THREE from 'three';
import { ICylinderOptions, Cylinder } from '../kernel/';
import { IShape } from './base-type';
  
/**
 * If any element start moves, cast a ray and check if it interesects with the board.
 * Add the element to the board if it does.
 * If the element is moved outside the board, remove it from the board.
 */
  
export class CylinderShape extends Cylinder implements IShape {
  ogType: string = 'CylinderShape';
  subNodes: Map<string, THREE.Object3D>;
  selected: boolean;
  edit: boolean;

  // TODO: Property Set can be extended based on requirements
  // TODO: But do we need a separate propertySet for each primitive? Can't we use this.options directly?
  propertySet: ICylinderOptions;
  // dimensionsSet: Map<string, THREE.Object3D> = new Map<string, THREE.Object3D>();

  constructor(properties?: ICylinderOptions) {
    super(properties);
    this.subNodes = new Map<string, THREE.Object3D>();
    this.selected = false;
    this.edit = false;
    
    if (properties) {
      // TODO: Deep Merge, currently shallow merge
      // TODO: Add this to all primitives
      this.propertySet = { ...properties, ...this.options };
    } else {
      this.propertySet = this.options;
    }

    // this.setDimensions();
    // this.listenKeyboardEvents();
  }

  setOPConfig(config: ICylinderOptions): void {
    this.discardGeometry();
    this.propertySet = config;
    this.setConfig(config);
  }

  getOPConfig(): ICylinderOptions {
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