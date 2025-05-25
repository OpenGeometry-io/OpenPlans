import * as THREE from 'three';
import { Polygon, Vector3D } from '../../kernel/dist';

interface OPBoard {
  position: {
    x: number;
    y: number;
    z: number;
  };
  color: number;
  type: 'board';
  coordinates: Array<[number, number, number]>;
  labelName: string;
}

export class Board extends Polygon {
  public ogType = 'board';

  // Properties that cannot be set externally should be just private, can be accessed at runtime
  private subNodes: Map<string, THREE.Object3D> = new Map();
  
  // Properties that can be set externally start with an #, provides tight encapsulation and prevents accidental access
  #selected = false;

  private boardSet: OPBoard = {
    position: {
      x: 0,
      y: 0,
      z: 0,
    },
    color: 0xcccccc,
    type: 'board',
    coordinates: [
      [-10, -10, 0],
      [10, -10, 0],
      [10, 10, 0],
      [-10, 10, 0],
    ],
    labelName: 'Drawing Board',
  };

  set selected(value: boolean) {
    if (value) {
      this.outlineColor = 0x4460FF;
    }
    else {
      this.outlineColor = 0x000000;
    }
    console.log(`Board selected: ${value}`);
    this.#selected = value;
  }

  get selected() {
    return this.#selected;
  }

  set width(value: number) {
    const halfWidth = value / 2;
    this.boardSet.coordinates[0][0] = -halfWidth;
    this.boardSet.coordinates[1][0] = halfWidth;
    this.boardSet.coordinates[2][0] = halfWidth;
    this.boardSet.coordinates[3][0] = -halfWidth;
    this.setGeometry();
  }

  get width() {
    return this.boardSet.coordinates[1][0] * 2;
  }

  set height(value: number) {
    const halfHeight = value / 2;
    this.boardSet.coordinates[0][1] = -halfHeight;
    this.boardSet.coordinates[1][1] = -halfHeight;
    this.boardSet.coordinates[2][1] = halfHeight;
    this.boardSet.coordinates[3][1] = halfHeight;
    this.setGeometry();
  }

  get height() {
    return this.boardSet.coordinates[2][1] * 2;
  }

  set labelName(value: string) {
    this.boardSet.labelName = value;
  }
  
  get labelName() {
    return this.boardSet.labelName;
  }

  constructor() {
    super();

    this.setGeometry();

    // If we create XZ plane, the polygon has normals facing downwards, so trick as of now is to create XY plane 
    // and then rotate it to face upwards
    this.rotateX(-Math.PI / 2);
  }

  setConfig(boardSet: OPBoard) {
    this.boardSet = boardSet;
  }

  private setGeometry() {
    this.resetVertices();
    this.outline = false;

    const points = [
      new Vector3D(this.boardSet.coordinates[0][0], this.boardSet.coordinates[0][1], 0),
      new Vector3D(this.boardSet.coordinates[1][0], this.boardSet.coordinates[1][1], 0),
      new Vector3D(this.boardSet.coordinates[2][0], this.boardSet.coordinates[2][1], 0),
      new Vector3D(this.boardSet.coordinates[3][0], this.boardSet.coordinates[3][1], 0),
    ];

    this.addVertices(points);

    // this.getBrepData();
    this.setMaterial();

    this.outline = true;
  }

  private setMaterial() {
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    this.material = material;

    // this.outlineColor = 0x4460FF;
  }
}