import * as THREE from 'three';
import { Cuboid, Vector3 } from "../kernel/";
import { ElementType } from "./base-type";
import { IShape } from '../shapes/base-type';

export enum StairType {
  STRAIGHT = 'STRAIGHT',
  LSHAPED = 'LSHAPED',
  USHAPED = 'USHAPED',
  SPIRAL = 'SPIRAL',
  WINDER = 'WINDER',
}

export interface OPStair {
  ogid?: string;
  labelName: string;
  type: ElementType.STAIR;
  stairType: StairType;
  dimensions: {
    width: number;        // Width of the staircase
    totalHeight: number;  // Total vertical rise
    totalLength: number;  // Total horizontal run
  };
  stairPosition: [number, number, number];
  riserHeight: number;    // Height of each step (rise)
  treadDepth: number;     // Depth of each step (run)
  numberOfSteps: number;  // Total number of steps
  stairColor: number;
  stairMaterial: string;
  coordinates: Array<[number, number, number]>;
}

export type ElementViewType = 'plan' | '3d';
export type SubElementType = 'steps' | 'landing';

export class BaseStair extends THREE.Group implements IShape {
  ogType: string = ElementType.STAIR;

  subElements: Map<SubElementType, THREE.Object3D> = new Map();

  selected: boolean = false;
  edit: boolean = false;

  // By Default the Plan View is Top View
  views: Map<ElementViewType, THREE.Object3D> = new Map();

  // Store the actual riser height used for rendering (calculated from total height)
  private actualRiserHeight: number = 0.17;

  propertySet: OPStair = {
    type: ElementType.STAIR,
    labelName: 'Simple Stair',
    stairType: StairType.STRAIGHT,
    dimensions: {
      width: 1.2,
      totalHeight: 3.0,
      totalLength: 4.5,
    },
    stairPosition: [0, 0, 0],
    riserHeight: 0.17,      // Standard riser height ~17cm
    treadDepth: 0.28,       // Standard tread depth ~28cm
    numberOfSteps: 15,      // Will be calculated based on height
    stairColor: 0x8B7355,
    stairMaterial: 'wood',
    coordinates: [],
  };

  set labelName(value: string) {
    this.propertySet.labelName = value;
  }

  get labelName() {
    return this.propertySet.labelName;
  }

  set stairColor(value: number) {
    this.propertySet.stairColor = value;
    this.updateStepColors();
  }

  set stairMaterial(value: string) {
    this.propertySet.stairMaterial = value;
  }

  set stairPosition(point: [number, number, number]) {
    this.propertySet.stairPosition = point;
    this.position.set(point[0], point[1], point[2]);
  }

  set stairWidth(value: number) {
    this.propertySet.dimensions.width = value;
    this.setOPGeometry();
  }

  set totalHeight(value: number) {
    this.propertySet.dimensions.totalHeight = value;
    this.calculateSteps();
    this.setOPGeometry();
  }

  set riserHeight(value: number) {
    this.propertySet.riserHeight = value;
    this.calculateSteps();
    this.setOPGeometry();
  }

  set treadDepth(value: number) {
    this.propertySet.treadDepth = value;
    this.calculateSteps();
    this.setOPGeometry();
  }

  constructor(baseStairConfig?: OPStair) {
    super();
    
    this.subElements = new Map<SubElementType, THREE.Object3D>();
    
    if (baseStairConfig) {
      this.propertySet = { ...baseStairConfig };
    }

    this.calculateSteps();
    this.calculateCoordinatesByConfig();
    this.setOPGeometry();
  }

  private calculateSteps() {
    // Calculate number of steps based on total height and desired riser height
    const calculatedSteps = Math.ceil(
      this.propertySet.dimensions.totalHeight / this.propertySet.riserHeight
    );
    
    // Use at least 2 steps
    this.propertySet.numberOfSteps = Math.max(2, calculatedSteps);
    
    // Calculate actual riser height to distribute evenly across all steps
    // This is what we'll use for rendering, but we don't modify propertySet.riserHeight
    this.actualRiserHeight = 
      this.propertySet.dimensions.totalHeight / this.propertySet.numberOfSteps;
    
    // Calculate total length based on number of steps and tread depth
    this.propertySet.dimensions.totalLength = 
      (this.propertySet.numberOfSteps - 1) * this.propertySet.treadDepth;
  }

  private calculateCoordinatesByConfig() {
    // Clear previous coordinates
    this.propertySet.coordinates = [];
    
    // Define the four corners of the staircase footprint
    const width = this.propertySet.dimensions.width;
    const length = this.propertySet.dimensions.totalLength;
    
    // Add corner coordinates (clockwise from bottom-left)
    this.propertySet.coordinates.push(
      [0, 0, 0],                    // Start bottom-left
      [length, 0, 0],               // Start bottom-right
      [length, 0, width],           // Start top-right
      [0, 0, width],                // Start top-left
    );
  }

  private createSteps() {
    // Remove existing steps if they exist
    const existingSteps = this.subElements.get('steps');
    if (existingSteps) {
      this.remove(existingSteps);
      this.subElements.delete('steps');
    }

    const stepsGroup = new THREE.Group();
    const stepThickness = 0.05; // Thickness of each tread

    for (let i = 0; i < this.propertySet.numberOfSteps; i++) {
      // Use actualRiserHeight for positioning (the calculated value)
      const stepHeight = i * this.actualRiserHeight;
      const stepPosition = i * this.propertySet.treadDepth;
      
      // Create tread (horizontal part)
      const tread = new Cuboid({
        center: new Vector3(
          stepPosition + this.propertySet.treadDepth / 2,
          stepHeight + stepThickness / 2,
          this.propertySet.dimensions.width / 2
        ),
        width: this.propertySet.treadDepth,
        height: stepThickness,
        depth: this.propertySet.dimensions.width,
        color: this.propertySet.stairColor,
      });

      stepsGroup.add(tread);

      // Create riser (vertical part) - skip for the last step
      if (i < this.propertySet.numberOfSteps - 1) {
        const riserHeight = this.actualRiserHeight - stepThickness;
        const riser = new Cuboid({
          center: new Vector3(
            stepPosition + this.propertySet.treadDepth,
            stepHeight + stepThickness + riserHeight / 2,
            this.propertySet.dimensions.width / 2
          ),
          width: 0.02, // Thin riser
          height: riserHeight,
          depth: this.propertySet.dimensions.width,
          color: this.propertySet.stairColor,
        });

        stepsGroup.add(riser);
      }
    }

    this.add(stepsGroup);
    this.subElements.set('steps', stepsGroup);
  }

  private updateStepColors() {
    const stepsGroup = this.subElements.get('steps');
    if (stepsGroup) {
      stepsGroup.children.forEach((child) => {
        if (child instanceof Cuboid) {
          child.setConfig({
            ...child.options,
            color: this.propertySet.stairColor,
          });
        }
      });
    }
  }

  setOPConfig(config: OPStair): void {
    this.propertySet = config;
    this.calculateSteps();
    this.calculateCoordinatesByConfig();
    this.setOPGeometry();
  }

  getOPConfig(): OPStair {
    return this.propertySet;
  }

  setOPGeometry(): void {
    // Clear all children
    this.clear();
    this.subElements.clear();

    this.createSteps();
  }

  setOPMaterial(): void {
    // Implement material update logic here
    this.updateStepColors();
  }

  // Show profile view for technical drawings
  showProfileView(status: boolean): void {
    // Handle all sub-elements
    for (const [, element] of this.subElements.entries()) {
      if (element instanceof THREE.Group) {
        element.children.forEach((child) => {
          // Handle Cuboid elements
          if (child instanceof Cuboid) {
            // @ts-ignore
            if (child.material) {
              // @ts-ignore
              child.material.opacity = status ? 0.0 : 0.6;
              // @ts-ignore
              child.material.transparent = true;
              // @ts-ignore
              child.outline = status;
            }
          } 
          // Handle regular meshes (handrails)
          else if (child instanceof THREE.Mesh) {
            // @ts-ignore
            if (child.material) {
              // @ts-ignore
              child.material.opacity = status ? 0.0 : 0.8;
              // @ts-ignore
              child.material.transparent = true;
            }
          }
        });
      }
    }
  }

  dispose() {
    // Clean up geometry and materials
    this.subElements.forEach((element) => {
      if (element instanceof THREE.Group) {
        element.children.forEach((child) => {
          if (child instanceof Cuboid) {
            child.discardGeometry();
          } else if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
      this.remove(element);
    });
    this.subElements.clear();
    this.clear();
    this.removeFromParent();
  }
}
