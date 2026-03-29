import * as THREE from 'three';
import { ICylinderOptions, Cylinder, Vector3 } from 'opengeometry';
import { IShape } from './base-type';
import { Placement } from '../types';  

export interface CylinderOptions {
  ogid?: string;
  center: Array<number>;
  radius: number;
  height: number;
  segments: number;
  angle: number;
  color: number;
  placement: Placement;
}

export class CylinderShape extends Cylinder implements IShape {
  ogType: string = 'CylinderShape';
  subElements: Map<string, THREE.Object3D>;
  
  selected: boolean = false;
  edit: boolean = false;
  locked: boolean = false;

  propertySet: CylinderOptions = {
    center: [0, 0, 0],
    radius: 1,
    height: 1,
    segments: 16,
    angle: Math.PI * 2,
    color: 0x00ff00,
    placement: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1]
    }
  };

  constructor(properties?: CylinderOptions) {
    super({
      ogid: properties?.ogid,
      center: new Vector3(properties?.center[0] || 0, properties?.center[1] || 0, properties?.center[2] || 0),
      radius: properties?.radius || 1,
      height: properties?.height || 1,
      segments: properties?.segments || 16,
      angle: properties?.angle || Math.PI * 2,
      color: properties?.color || 0x00ff00,
      translation: new Vector3(properties?.placement?.position[0] || 0, properties?.placement?.position[1] || 0, properties?.placement?.position[2] || 0),
      rotation: new Vector3(properties?.placement?.rotation[0] || 0, properties?.placement?.rotation[1] || 0, properties?.placement?.rotation[2] || 0),
      scale: new Vector3(properties?.placement?.scale[0] || 1, properties?.placement?.scale[1] || 1, properties?.placement?.scale[2] || 1),
    });

    this.subElements = new Map<string, THREE.Object3D>();
    
    if (properties) {
      this.propertySet = { ...this.propertySet, ...properties };
    }

    this.propertySet.ogid = this.ogid;
    this.setOPGeometry();
  }

  setOPConfig(config: CylinderOptions): void {
    this.discardGeometry();
    this.propertySet = { ...this.propertySet, ...config };
    this.setOPGeometry();
  }

  getOPConfig(): CylinderOptions {
    return this.propertySet;
  }

  setOPGeometry(): void {
    this.setConfig({
      center: new Vector3(this.propertySet.center[0], this.propertySet.center[1], this.propertySet.center[2]),
      radius: this.propertySet.radius,
      height: this.propertySet.height,
      segments: this.propertySet.segments,
      angle: this.propertySet.angle,
      color: this.propertySet.color,
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
