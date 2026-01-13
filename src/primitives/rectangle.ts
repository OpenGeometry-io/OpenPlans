import * as THREE from 'three';
import { Rectangle, Vector3 } from '../kernel/';
import { IPrimitive } from './base-type';

export interface RectangleOptions {
  ogid?: string;
  center: Array<number>;
  width: number;
  breadth: number;
  color: number;
}

/**
 * If any element start moves, cast a ray and check if it interesects with the board.
 * Add the element to the board if it does.
 * If the element is moved outside the board, remove it from the board.
 */


/**
 * Rectangle Primitive Class
 * Represents a rectangular shape in 3D space.
 * Inherits from the Rectangle class and implements the IPrimitive interface.
 */
export class RectanglePrimitive extends Rectangle implements IPrimitive {
  ogType: string = 'RectanglePrimitive';
  subNodes: Map<string, THREE.Object3D>;

  selected: boolean = false;
  edit: boolean = false;

  // TODO: Property Set can be extended based on requirements
  // TODO: But do we need a separate propertySet for each primitive? Can't we use this.options directly?
  propertySet: RectangleOptions = {
    center: [0, 0, 0],
    width: 1,
    breadth: 1,
    color: 0x0000ff
  };
  // dimensionsSet: Map<string, THREE.Object3D> = new Map<string, THREE.Object3D>();

  set center(value: Array<number>) {
    this.propertySet.center = value;

    this.setOPGeometry();
  }

  get center(): Array<number> {
    return this.propertySet.center;
  }

  set width(value: number) {
    this.propertySet.width = value;

    this.setOPGeometry();
  }

  get width(): number {
    return this.propertySet.width;
  }

  set breadth(value: number) {
    this.propertySet.breadth = value;

    this.setOPGeometry();
  }

  get breadth(): number {
    return this.propertySet.breadth;
  }

  set rectangleColor(value: number) {
    this.propertySet.color = value;

    this.color = value;
  }

  get rectangleColor(): number {
    return this.propertySet.color;
  }

  constructor(rectangleConfig?: RectangleOptions) {
    super({
      ogid: rectangleConfig?.ogid,
      center: new Vector3(...(rectangleConfig?.center || [0, 0, 0])),
      width: rectangleConfig?.width || 1,
      breadth: rectangleConfig?.breadth || 1,
      color: rectangleConfig?.color || 0x0000ff
    });

    this.subNodes = new Map<string, THREE.Object3D>();
    
    if (rectangleConfig) {
      this.propertySet = { ...this.propertySet, ...rectangleConfig };
    }

    this.propertySet.ogid = this.ogid;
    this.setOPGeometry();

    // this.setDimensions();
    // this.listenKeyboardEvents();
  }

  setOPConfig(config: RectangleOptions): void {
  }

  getOPConfig(): RectangleOptions {
    return this.propertySet;
  }

  setOPGeometry(): void {
    this.setConfig({
      center: new Vector3(...this.propertySet.center),
      width: this.propertySet.width,
      breadth: this.propertySet.breadth,
      color: this.propertySet.color
    });
  }

  setOPMaterial(): void {
  }
}