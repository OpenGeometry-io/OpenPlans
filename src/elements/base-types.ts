/**
 * Refer to Base Element Readme
 */
import * as THREE from 'three';
export type OPWallType = 'concrete' | 'wood' | 'brick';

/**
 * These interfaces are for sets for creation of prexisting elements
 * Not to be confused with the interfaces in the parser
 */


export interface OPWall {
  id?: string;
  labelName: string;
  type: 'wall';
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
  };
  color: number;
  wallType: 'exterior' | 'interior' | 'partition' | 'curtain';
  wallHeight: number;
  wallThickness: number;
  wallMaterial: 'concrete' | 'brick' | 'wood' | 'glass' | 'metal' | 'other';
  coordinates: Array<[number, number, number]>;
}

export interface OPDoor {
  id: number;
  position: {
    x: number;
    y: number;
    z: number;
  },
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
  hingeColor: number;
  hingeThickness: number;
  doorColor: number;
}

export interface OPSpace {
  id: number;
  position: {
    x: number;
    y: number;
    z: number;
  },
  color: number;
  type: 'internal' | 'external';
  coordinates: Array<[number, number, number]>;
  labelName: string;
}

export interface OPWallMesh {
  shadowMesh: THREE.Mesh;
  cosmeticMesh: THREE.Group;
}