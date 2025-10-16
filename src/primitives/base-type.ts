import * as THREE from 'three';

export interface IPrimitive {
  ogType: string;
  subNodes: Map<string, THREE.Object3D>;
  selected: boolean;
  edit: boolean;
  propertySet: Record<string, any>;
  setOPConfig(config: Record<string, any>): void;
  getOPConfig(): Record<string, any>;
  setOPGeometry(): void;
  setOPMaterial(): void;
}