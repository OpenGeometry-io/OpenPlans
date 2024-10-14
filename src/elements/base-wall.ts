import {
  Vector3D,
  BasePoly,
} from './../../kernel-dist';
import * as THREE from 'three';

export class BaseWall {
  public color: number;
  mesh: BasePoly | null = null;

  constructor(color: number) {
    this.color = color;
    this.setGeometry();
  }

  public setGeometry() {
    const vertices = [
      new Vector3D(0, 0, 0),
      new Vector3D(10, 0, 0),
      new Vector3D(10, 10, 0),
      new Vector3D(0, 10, 0),
    ];
    this.mesh = new BasePoly(vertices);
  }

  public getMesh() {
    return this.mesh;
  }
}
