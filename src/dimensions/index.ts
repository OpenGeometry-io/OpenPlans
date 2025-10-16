import { LineDimension } from "./line-dimension";
import * as THREE from "three";

export type DimensionType = 'length' | 'angle' | 'area' | 'radius' | 'diameter' | 'volume' | 'custom';

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

  createDimension(key: string, type: DimensionType): any {
    // Logic to create a new dimension based on the key and type
    switch (type) {
      case 'length':
        // Create a length dimension
        const lengthDimension = new LineDimension();
        this.sceneRef.add(lengthDimension);
        this.store.set(key, lengthDimension);
        break;
      case 'angle':
        // Create an angle dimension
        break;
      case 'area':
        // Create an area dimension
        break;
      case 'radius':
        // Create a radius dimension
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


