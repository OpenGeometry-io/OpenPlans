import * as OG from './../../../OpenGeometry-Kernel/dist/';
import * as THREE from 'three';

export class BaseWall extends THREE.Mesh {
  public color: number;

  constructor(color: number) {
    super();
    this.color = color;
    this.setGeometry();
  }

  public setGeometry() {
    const vertices = [
      new OG.Vector3D(0, 0, 0),
      new OG.Vector3D(10, 0, 0),
      new OG.Vector3D(10, 10, 0),
      new OG.Vector3D(0, 10, 0),
    ];
    new OG.BasePoly(vertices);
  }
}
