import * as THREE from 'three'

export interface ITheme {
  background: string
  color: string
  gridColor: number
}

export type activeTheme = 'darkBlue' | 'light' | 'dark'

export interface ICanvasTheme {
  darkBlue: ITheme,
  light: ITheme,
  dark: ITheme,
}

export type IBaseWallType = 'exterior' | 'interior' | 'partition' | 'curtain';
export type IBaseWallMaterial = 'concrete' | 'brick' | 'wood' | 'glass' | 'metal' | 'other';

export interface IBaseWall {
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
  wallType: IBaseWallType;
  wallHeight: number;
  wallThickness: number;
  wallMaterial: IBaseWallMaterial;
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