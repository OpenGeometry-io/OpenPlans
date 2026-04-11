import * as THREE from 'three';

export interface IShape {
  ogType: string;
  
  subElements2D: Map<string, THREE.Object3D>;
  subElements3D: Map<string, THREE.Object3D>;

  selected: boolean;
  edit: boolean;
  locked: boolean;

  propertySet: Record<string, any>;
  
  setOPConfig(config: Record<string, any>): void;
  getOPConfig(): Record<string, any>;
  setOPGeometry(): void;
  setOPMaterial(): void;
}