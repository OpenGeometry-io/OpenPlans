import {
  Vector3D,
  BasePoly,
} from '../../kernel/dist';
import * as THREE from 'three';

const WallSet = {
  id: 4,
  bounds: {
    x: 0.25,
    y: 0,
    z: 0.25,
  },
  position: {
    x: 0,
    y: 0,
    z: 0,
  },
  anchor: {
    start: {
      x: -1,
      y: 0,
      z: 0,
    },
    end: {
      x: 1,
      y: 0,
      z: 0,
    }
  },
  thickness: 0.5,
  halfThickness: 0.25
}


export class BaseWall {
  public color: number;
  mesh: BasePoly | null = null;
  wallSet = WallSet;

  constructor(color: number) {
    this.color = color;
    this.setupSet();
    this.setGeometry();
  }

  /**
   * If A User Has A Wall Set, We Will Use It
   */
  setupSet() {
    if (!this.wallSet) return;
    this.wallSet.id = 4;
  }

  private setGeometry() {
    console.log(this.wallSet);
    if (!this.wallSet) return;
    const vertices = [
      new Vector3D(
        this.wallSet.anchor.start.x - this.wallSet.halfThickness,
        this.wallSet.anchor.start.y,
        this.wallSet.anchor.start.z - this.wallSet.halfThickness
      ),
      new Vector3D(
        this.wallSet.anchor.start.x - this.wallSet.halfThickness,
        this.wallSet.anchor.start.y,
        this.wallSet.anchor.start.z + this.wallSet.halfThickness
      ),
      new Vector3D(
        this.wallSet.anchor.end.x + this.wallSet.halfThickness,
        this.wallSet.anchor.end.y,
        this.wallSet.anchor.end.z + this.wallSet.halfThickness
      ),
      new Vector3D(
        this.wallSet.anchor.end.x + this.wallSet.halfThickness,
        this.wallSet.anchor.end.y,
        this.wallSet.anchor.end.z - this.wallSet.halfThickness
      ),
    ];
    console.log(vertices);
    
    this.mesh = new BasePoly(vertices);
  }

  public getMesh() {
    return this.mesh;
  }
}
