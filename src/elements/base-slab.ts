import * as THREE from 'three';
import { Cuboid, Vector3 } from "../kernel/";
import { ElementType } from "./base-type";
import { IShape } from '../shapes/base-type';

export interface OPSlab {
  ogid?: string;
  labelName: string;
  type: ElementType.SLAB;
  dimensions: {
    start: {
      x: number;
      y: number;
      z: number;
    };
    end: {
      x: number;
      y: number;
      z: number;
    };
    width: number;
    length: number;
  };
  slabPosition: [number, number, number];
  slabThickness: number; // Thickness of the slab
  slabColor: number;
  slabMaterial: string;
  coordinates: Array<[number, number, number]>;
}

export type ElementViewType = 'plan' | '3d';
export type SubElementType = 'body' | 'finish' | 'reinforcement';

export class BaseSlab extends Cuboid implements IShape {
  ogType: string = ElementType.SLAB;

  subElements: Map<SubElementType, THREE.Object3D> = new Map();

  selected: boolean = false;
  edit: boolean = false;

  // By Default the Plan View is Top View
  // If needed Plan view can be overridden to add some other geometry
  views: Map<ElementViewType, THREE.Object3D> = new Map();

  propertySet: OPSlab = {
    type: ElementType.SLAB,
    labelName: 'Simple Slab',
    dimensions: {
      start: { x: -2.5, y: 0, z: -2.5 },
      end: { x: 2.5, y: 0, z: 2.5 },
      width: 5,
      length: 5,
    },
    slabPosition: [0, 0, 0],
    slabThickness: 0.2,
    slabColor: 0xCCCCCC,
    slabMaterial: 'concrete',
    // Coordinates is a calculated property, not set by user
    coordinates: [],
  };

  set labelName(value: string) {
    this.propertySet.labelName = value;
  }

  get labelName() {
    return this.propertySet.labelName;
  }

  set slabColor(value: number) {
    this.propertySet.slabColor = value;
    const slabBody = this.subElements.get('body');
    if (slabBody && slabBody instanceof Cuboid) {
      slabBody.setConfig({
        ...slabBody.options,
        color: value,
      });
    }
  }

  set slabMaterial(value: string) {
    this.propertySet.slabMaterial = value;
    // Material changes can be implemented here
  }

  set slabPosition(point: [number, number, number]) {
    this.propertySet.slabPosition = point;
    this.position.set(point[0], point[1], point[2]);
  }

  set slabWidth(value: number) {
    this.propertySet.dimensions.width = value;

    // Update start and end points based on width
    this.propertySet.dimensions.start.x = -value / 2;
    this.propertySet.dimensions.end.x = value / 2;

    this.setOPGeometry();
    this.setConfig({
      depth: this.propertySet.dimensions.length,
      height: this.propertySet.slabThickness,
      width: value,
      center: new Vector3(0, -this.propertySet.slabThickness / 2, 0),
      color: this.propertySet.slabColor,
    });
  }

  set slabLength(value: number) {
    this.propertySet.dimensions.length = value;

    // Update start and end points based on length
    this.propertySet.dimensions.start.z = -value / 2;
    this.propertySet.dimensions.end.z = value / 2;

    this.setOPGeometry();
    this.setConfig({
      depth: value,
      height: this.propertySet.slabThickness,
      width: this.propertySet.dimensions.width,
      center: new Vector3(0, -this.propertySet.slabThickness / 2, 0),
      color: this.propertySet.slabColor,
    });
  }

  set slabThickness(value: number) {
    this.propertySet.slabThickness = value;

    this.setOPGeometry();
    this.setConfig({
      depth: this.propertySet.dimensions.length,
      height: value,
      width: this.propertySet.dimensions.width,
      center: new Vector3(0, -value / 2, 0),
      color: this.propertySet.slabColor,
    });
  }

  constructor(baseSlabConfig?: OPSlab) {
    // Call the parent class (Cuboid) constructor
    super();
    
    this.subElements = new Map<SubElementType, THREE.Object3D>();
    
    if (baseSlabConfig) {
      this.propertySet = { ...baseSlabConfig };
    }

    this.calculateCoordinatesByConfig();
    this.setOPGeometry();
  }

  private calculateCoordinatesByConfig() {
    // Clear previous coordinates
    this.propertySet.coordinates = [];
    
    // Define the four corners of the slab
    const startX = this.propertySet.dimensions.start.x;
    const startZ = this.propertySet.dimensions.start.z;
    const endX = this.propertySet.dimensions.end.x;
    const endZ = this.propertySet.dimensions.end.z;
    const y = this.propertySet.dimensions.start.y;

    // Add corner coordinates (clockwise from top-left)
    this.propertySet.coordinates.push(
      [startX, y, startZ], // Bottom-left
      [endX, y, startZ],   // Bottom-right
      [endX, y, endZ],     // Top-right
      [startX, y, endZ],   // Top-left
    );
  }

  private createSlabBody() {
    // Remove existing body if it exists
    const existingBody = this.subElements.get('body');
    if (existingBody) {
      this.remove(existingBody);
      this.subElements.delete('body');
    }

    // Create the main slab body using Cuboid
    const slabBody = new Cuboid({
      center: new Vector3(0, -this.propertySet.slabThickness / 2, 0),
      width: this.propertySet.dimensions.width,
      height: this.propertySet.slabThickness,
      depth: this.propertySet.dimensions.length,
      color: this.propertySet.slabColor,
    });

    this.add(slabBody);
    this.subElements.set('body', slabBody);
  }

  setOPConfig(config: OPSlab): void {
    this.discardGeometry();
    this.propertySet = config;
    this.calculateCoordinatesByConfig();
    this.setOPGeometry();
  }

  getOPConfig(): OPSlab {
    return this.propertySet;
  }

  setOPGeometry(): void {
    // Implement geometry update logic here
    if (this.children.length > 0) {
      this.remove(...this.children.slice(0));
    }

    this.createSlabBody();
    
    // Update the parent Cuboid configuration
    this.setConfig({
      depth: this.propertySet.dimensions.length,
      height: this.propertySet.slabThickness,
      width: this.propertySet.dimensions.width,
      center: new Vector3(0, -this.propertySet.slabThickness / 2, 0),
      color: this.propertySet.slabColor,
    });
  }

  setOPMaterial(): void {
    // Implement material update logic here
    const slabBody = this.subElements.get('body');
    if (slabBody && slabBody instanceof Cuboid) {
      // Material updates can be applied here
      // For example, texture mapping or material properties
    }
  }

  // Show profile view for technical drawings
  showProfileView(status: boolean): void {
    // Handle the BaseSlab itself (which extends Cuboid and has material)
    // @ts-ignore
    if (this.material) {
      // @ts-ignore
      this.material.opacity = status ? 0.0 : 1.0;
      // @ts-ignore
      this.material.transparent = true;
      // @ts-ignore
      this.outline = status;
    }

    // Handle sub-elements (like the body Cuboid)
    for (const [, element] of this.subElements.entries()) {
      // Check if the element itself has a material (like Cuboid)
      // @ts-ignore
      if (element.material) {
        // @ts-ignore
        element.material.opacity = status ? 0.0 : 1.0;
        // @ts-ignore
        element.material.transparent = true;
        // @ts-ignore
        element.outline = status;
      }
      
      // Also check children in case of grouped elements
      if (element.children && element.children.length > 0) {
        for (const child of element.children) {
          // @ts-ignore
          if (child.material) {
            // @ts-ignore
            child.material.opacity = status ? 0.0 : 1.0;
            // @ts-ignore
            child.material.transparent = true;
            // @ts-ignore
            child.outline = status;
          }
        }
      }
    }
  }

  dispose() {
    // Clean up geometry and materials
    this.subElements.forEach((element) => {
      if (element instanceof Cuboid) {
        element.discardGeometry();
      }
      this.remove(element);
    });
    this.subElements.clear();
    this.discardGeometry();
    this.removeFromParent();
  }
}
