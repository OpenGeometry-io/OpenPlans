/**
 * Refer to Base Element Readme
 */
import * as THREE from 'three';
export type OPWallType = 'concrete' | 'wood' | 'brick';

export interface OPWall {
  id: number;
  position: {
    x: number;
    y: number;
    z: number;
  },
  color: number;
  type: OPWallType;
  anchor: {
    start: {
      x: number;
      y: number;
      z: number;
    },
    end: {
      x: number;
      y: number;
      z: number;
    }
  },
  thickness: number;
  halfThickness: number;
}

export interface OPWallMesh {
  shadowMesh: THREE.Mesh;
  cosmeticMesh: THREE.Group;
}