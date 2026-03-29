import { LineDimension } from "./line-dimension";
import { AngleDimension } from "./angle-dimension";
import { RadiusDimension } from "./radius-dimension";
import * as THREE from "three";

export { LineDimension, AngleDimension, RadiusDimension };

export type DimensionType = 'length' | 'angle' | 'area' | 'radius' | 'diameter' | 'volume' | 'custom';

// export interface DimensionObjectToElementConstraint {
//   elementKey: THREE.Object3D,
//   constraint: 'start' | 'end' | 'midpoint' | 'center' | 'custom',
// } 

export class Dimensions {
  static instance: Dimensions;
  private scene: THREE.Scene | null = null;

  private store: Map<string, any>;

  static getInstance() {
    if (!Dimensions.instance) {
      Dimensions.instance = new Dimensions();
    }
    return Dimensions.instance;
  }

  constructor() {
    this.store = new Map<string, any>();
    Dimensions.instance = this;
  }

  // TODO: Add type safety, create interfaces for different dimension types
  set(key: string, value: any) {
    this.store.set(key, value);
  }

  set sceneRef(scene: THREE.Scene) {
    this.scene = scene;
  }

  get sceneRef() {
    if (!this.scene) {
      throw new Error("Scene not initialized");
    }
    return this.scene;
  }

  getDimensionsById(key: string) {
    return this.store.get(key);
  }

  // Dimensions that are attached to a particular OpenPlans Element
  // TODO
  // attachDimension()

  // Dimensions without constraint and not dependent on any Element
  createDimension(type: DimensionType): any {
    // Logic to create a new dimension based on the key and type
    switch (type) {
      case 'length':
        // Create a length dimension
        const lengthDimension = new LineDimension();
        console.log(this.sceneRef);
        this.sceneRef.add(lengthDimension);
        this.store.set(lengthDimension.uuid, lengthDimension);
        return lengthDimension;
      case 'angle':
        // Create an angle dimension
        const angleDimension = new AngleDimension();
        this.sceneRef.add(angleDimension);
        this.store.set(angleDimension.uuid, angleDimension);
        return angleDimension;
      case "radius":
        const radiusDimension = new RadiusDimension();
        this.sceneRef.add(radiusDimension);
        this.store.set(radiusDimension.uuid, radiusDimension);
        return radiusDimension;
      case 'area':
        // Create an area dimension
        break;
      case 'diameter':
        // Create a diameter dimension
        break;
      case 'volume':
        // Create a volume dimension
        break;
      case 'custom':
        // Create a custom dimension
        break;
    }
  }
}

export const DimensionTool = Dimensions.getInstance();


