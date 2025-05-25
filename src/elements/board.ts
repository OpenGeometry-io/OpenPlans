import * as THREE from 'three';
import { Polygon, Vector3D } from '../../kernel/dist';

interface OPBoard {
  center: {
    x: number;
    y: number;
    z: number;
  };
  color: number;
  type: 'board';
  coordinates: Array<[number, number, number]>;
  labelName: string;
  dimensions: {
    start: {
      x: number;
      y: number;
      z: number;
    },
    end: {
      x: number;
      y: number;
      z: number;
    },
    width: number;
    height: number;
  }
}

export class Board extends Polygon {
  public ogType = 'board';

  // Properties that cannot be set externally should be just private, can be accessed at runtime
  private subNodes: Map<string, THREE.Object3D> = new Map();
  
  // Properties that can be set externally start with an #, provides tight encapsulation and prevents accidental access
  #selected = false;

  private boardSet: OPBoard = {
    center: {
      x: 0,
      y: 0,
      z: 0,
    },
    color: 0xcccccc,
    type: 'board',
    /*
      Anti-clockwise coordinates of the board, starting from top left corner.
      Ends in top right corner.
      The coordinates are in the XY plane, so Z is always 0.
    */
    coordinates: [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ],
    labelName: 'Drawing Board',
    dimensions: {
      start: {
        x: 0,
        y: 0,
        z: 0
      },
      end: {
        x: 10,
        y: -10,
        z: 0,
      },
      width: 20,
      height: 20
    }
  };

  set selected(value: boolean) {
    if (value) {
      this.outlineColor = 0x4460FF;
    }
    else {
      this.outlineColor = 0x000000;
    }
    this.#selected = value;
  }

  get selected() {
    return this.#selected;
  }

  set width(value: number) {
    // const halfWidth = value / 2;
    this.boardSet.dimensions.width = value;

    // this.boardSet.coordinates[0][0] = -halfWidth;
    // this.boardSet.coordinates[1][0] = halfWidth;
    // this.boardSet.coordinates[2][0] = halfWidth;
    // this.boardSet.coordinates[3][0] = -halfWidth;

    // this.boardSet.dimensions.start.x = -halfWidth;
    // this.boardSet.dimensions.end.x = halfWidth;

    // this.setGeometry();
  }

  get width() {
    return this.boardSet.dimensions.width;
  }

  set height(value: number) {
    // const halfHeight = value / 2;
    this.boardSet.dimensions.height = value;

    // this.boardSet.coordinates[0][1] = -halfHeight;
    // this.boardSet.coordinates[1][1] = -halfHeight;
    // this.boardSet.coordinates[2][1] = halfHeight;
    // this.boardSet.coordinates[3][1] = halfHeight;

    // this.boardSet.dimensions.start.y = halfHeight;
    // this.boardSet.dimensions.end.y = -halfHeight;

    // this.setGeometry();
  }

  get height() {
    return this.boardSet.dimensions.height;
  }

  set start(value: { x: number; y: number; z: number }) {
    console.log(value);
    this.boardSet.dimensions.start.x = value.x;
    this.boardSet.dimensions.start.y = value.y;

    // Recalculate Coordinates based on start position
    // this.boardSet.coordinates[0][0] = value.x;
    // this.boardSet.coordinates[0][1] = value.y;
    // this.boardSet.coordinates[1][0] = value.x + this.width;
    // this.boardSet.coordinates[1][1] = value.y;
    // this.boardSet.coordinates[2][0] = value.x + this.width;
    // this.boardSet.coordinates[2][1] = value.y + this.height;
    // this.boardSet.coordinates[3][0] = value.x;
    // this.boardSet.coordinates[3][1] = value.y + this.height;

    // this.boardSet.position.end.x = value.x + this.width;
    // this.boardSet.position.end.y = value.y + this.height;

    // this.setGeometry();
  }

  set labelName(value: string) {
    this.boardSet.labelName = value;
  }

  get labelName() {
    return this.boardSet.labelName;
  }

  set color(value: number) {
    const material = new THREE.MeshBasicMaterial({
      color: value,
    });
    this.material = material;
  }

  get color() {
    return (this.material as THREE.MeshBasicMaterial).color.getHex();
  }



  constructor() {
    super();

    this.calculateCoordinatesByConfig();

    // If we create XZ plane, the polygon has normals facing downwards, so trick as of now is to create XY plane 
    // and then rotate it to face upwards
    this.rotateX(-Math.PI / 2);
  }

  private calculateCoordinatesByConfig() {
    const start = this.boardSet.dimensions.start;

    const width = this.boardSet.dimensions.width;
    const height = this.boardSet.dimensions.height;
    
    this.boardSet.coordinates[0][0] = start.x;
    this.boardSet.coordinates[0][1] = start.y;
    this.boardSet.coordinates[1][0] = start.x + width;
    this.boardSet.coordinates[1][1] = start.y;
    this.boardSet.coordinates[2][0] = start.x + width;
    this.boardSet.coordinates[2][1] = start.y + height;
    this.boardSet.coordinates[3][0] = start.x;
    this.boardSet.coordinates[3][1] = start.y + height;

    // For renference only, not used in calculations
    // These two properties should not influence the coordinates, they are just for reference
    this.boardSet.center.x = start.x + width / 2;
    this.boardSet.center.y = start.y + height / 2;
    this.boardSet.center.z = start.z;
    this.boardSet.dimensions.end.x = start.x + width;
    this.boardSet.dimensions.end.y = start.y + height;

    this.setGeometry();
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
    console.log(this.boardSet.coordinates);
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
  }
}