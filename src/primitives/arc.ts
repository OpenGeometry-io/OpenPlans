import * as THREE from 'three';
import { Arc, Vector3 } from '../kernel/';
import { IPrimitive } from './base-type';
import { DimensionTool } from '../dimensions';

export interface ArcOptions {
  ogid?: string;
  center: Array<number>;
  radius: number;
  startAngle: number;
  endAngle: number;
  segments: number;
  color: number;
}

/**
 * If any element start moves, cast a ray and check if it interesects with the board.
 * Add the element to the board if it does.
 * If the element is moved outside the board, remove it from the board.
 */

export class ArcPrimitive extends Arc implements IPrimitive {
  ogType: string = 'ArcPrimitive';
  subNodes: Map<string, THREE.Object3D>;
  
  selected: boolean = false;
  edit: boolean = false;

  propertySet: ArcOptions = {
    center: [0, 0, 0],
    radius: 1,
    startAngle: 0,
    endAngle: Math.PI,
    segments: 16,
    color: 0x000000,
  };

  set arcCenter(value: Vector3) {
    this.propertySet.center = [value.x, value.y, value.z];

    this.setOPGeometry();
  }

  set arcRadius(value: number) {
    this.propertySet.radius = value;
    this.setOPGeometry();
  }

  set arcStartAngle(value: number) {
    this.propertySet.startAngle = value;
    this.setOPGeometry();
  }

  set arcEndAngle(value: number) {
    this.propertySet.endAngle = value;
    this.setOPGeometry();
  }

  set arcSegments(value: number) {
    this.propertySet.segments = value;
    this.setOPGeometry();
  }

  set arcColor(value: number) {
    this.propertySet.color = value;

    this.color = value;
  }

  constructor(arcConfig?: ArcOptions) {
    super({
      ogid: arcConfig?.ogid,
      center: new Vector3(...(arcConfig?.center || [0, 0, 0])),
      radius: arcConfig?.radius || 1,
      startAngle: arcConfig?.startAngle || 0,
      endAngle: arcConfig?.endAngle || Math.PI,
      segments: arcConfig?.segments || 16,
      color: arcConfig?.color || 0x000000,
    });
    
    this.subNodes = new Map<string, THREE.Object3D>();

    if (arcConfig) {
      this.propertySet = { ...this.propertySet, ...arcConfig };
    }

    this.propertySet.ogid = this.ogid;

    // this.setDimensions();
    // this.listenKeyboardEvents();
  }

  // private setDimensions() {
  //   for (const property in this.propertySet) {
  //     // TODO: Create Enums for properties
  //     if (property === 'radius') {
  //       const radiusDimension = DimensionTool.createDimension(
  //         this.ogid + '-radius',
  //         'length',
  //       );
  //       this.activeProperty = 'radius';
  //     }
  //   }
  // }

  // private listenKeyboardEvents() {
  //   window.addEventListener('keypress', (event) => {
  //     console.log(`Key pressed: ${event.key}`);

  //     // Number keys to set radius
  //     if (event.key >= '0' && event.key <= '9') {
  //       const num = parseInt(event.key);
  //       if (this.activeProperty === 'radius') {
  //         this.options.radius = num;
  //         // @ts-ignore
  //         const radiusDimId = this.ogid + '-radius';
  //         const radiusDimension = DimensionTool.getDimensionsById(radiusDimId);
  //         radiusDimension.setDimensionData(this.options, num);
  //       }
  //     }

  //     // Enter to confirm
  //     if (event.key === 'Enter') {
  //       console.log('Finalizing property:', this.activeProperty);
  //       this.activeProperty = null;
  //       this.setOPConfig(this.options);
  //     }
  //   });
  // }

  setOPConfig(config: ArcOptions): void {

  }

  getOPConfig(): ArcOptions {
    return this.propertySet;
  }

  setOPGeometry(): void {
    this.setConfig({
      center: new Vector3(...this.propertySet.center),
      radius: this.propertySet.radius,
      startAngle: this.propertySet.startAngle,
      endAngle: this.propertySet.endAngle,
      segments: this.propertySet.segments,
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