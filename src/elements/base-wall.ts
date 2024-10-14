import {
  Vector3D,
  BasePoly,
} from '../../kernel';
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
      new Vector3D(10, 0, 10),
      new Vector3D(0, 0, 10),
    ];
    this.mesh = new BasePoly(vertices);
  }

  public getMesh() {
    return this.mesh;
  }
}
