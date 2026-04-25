import * as THREE from 'three';
import { Cuboid, Vector3 } from 'opengeometry';
import { IShape } from './base-type';
import { Placement } from '../types';
  
/**
 * If any element start moves, cast a ray and check if it interesects with the board.
 * Add the element to the board if it does.
 * If the element is moved outside the board, remove it from the board.
 */

export interface CuboidOptions {
  ogid?: string;
  center: Array<number>;
  width: number;
  height: number;
  depth: number;
  color: number;
  placement: Placement;
}

export class CuboidShape extends Cuboid implements IShape {
  ogType: string = 'CuboidShape';
  
  selected: boolean = false;
  edit: boolean = false;
  locked: boolean = false;

  subElements2D: Map<string, THREE.Object3D<THREE.Object3DEventMap>>;
  subElements3D: Map<string, THREE.Object3D<THREE.Object3DEventMap>>;

  propertySet: CuboidOptions = {
    center: [0, 0, 0],
    width: 1,
    height: 1,
    depth: 1,
    color: 0x00ff00,
    placement: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1]
    }
  };

  constructor(properties?: CuboidOptions) {
    super({
      ogid: properties?.ogid,
      center: new Vector3(properties?.center[0] || 0, properties?.center[1] || 0, properties?.center[2] || 0),
      width: properties?.width || 1,
      height: properties?.height || 1,
      depth: properties?.depth || 1,
      color: properties?.color || 0x00ff00,
      translation: new Vector3(properties?.placement?.position[0] || 0, properties?.placement?.position[1] || 0, properties?.placement?.position[2] || 0),
      rotation: new Vector3(properties?.placement?.rotation[0] || 0, properties?.placement?.rotation[1] || 0, properties?.placement?.rotation[2] || 0),
      scale: new Vector3(properties?.placement?.scale[0] || 1, properties?.placement?.scale[1] || 1, properties?.placement?.scale[2] || 1),
    });

    this.subElements2D = new Map<string, THREE.Object3D>();
    this.subElements3D = new Map<string, THREE.Object3D>();
    
    if (properties) {
      this.propertySet = { ...this.propertySet, ...properties };
    }

    this.propertySet.ogid = this.ogid;
    this.setOPGeometry();
  }

  setOPConfig(config: CuboidOptions): void {
    this.discardGeometry();
    this.propertySet = { ...this.propertySet, ...config };
    this.setOPGeometry();
  }

  getOPConfig(): CuboidOptions {
    return this.propertySet;
  }

  setOPGeometry(): void {
    this.setConfig({
      center: new Vector3(this.propertySet.center[0], this.propertySet.center[1], this.propertySet.center[2]),
      width: this.propertySet.width,
      height: this.propertySet.height,
      depth: this.propertySet.depth,
      color: this.propertySet.color,
    });
  }

  setOPPlacement(placement: Placement): void {
    this.setPlacement({
      translation: new Vector3(placement.position[0], placement.position[1], placement.position[2]),
      rotation: new Vector3(placement.rotation[0], placement.rotation[1], placement.rotation[2]),
      scale: new Vector3(placement.scale[0], placement.scale[1], placement.scale[2]),
    });
  }

  setOPMaterial(): void {
    // Implement material update logic here
    // const line = this.subNodes.get('arcLine') as THREE.Line;
    // if (line) {
    //   (line.material as THREE.LineBasicMaterial).color.set(0x0000ff);
    // }
  }
}
