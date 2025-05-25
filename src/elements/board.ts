import * as THREE from 'three';
import { Polygon, Vector3D } from '../../kernel/dist';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export interface OPBoard {
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
  private labelDivMesh: CSS2DObject | null = null;
  
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
    this.boardSet.dimensions.width = value;
    this.calculateCoordinatesByConfig();
  }

  get width() {
    return this.boardSet.dimensions.width;
  }

  set height(value: number) {
    this.boardSet.dimensions.height = value;
    this.calculateCoordinatesByConfig();
  }

  get height() {
    return this.boardSet.dimensions.height;
  }

  set start(value: { x: number; y: number; z: number }) {
    this.boardSet.dimensions.start.x = value.x;
    this.boardSet.dimensions.start.y = value.y;
    this.calculateCoordinatesByConfig();
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



  constructor(boardConfig: OPBoard) {
    super();

    if (boardConfig) {
      this.setConfig(boardConfig);
    }

    this.calculateCoordinatesByConfig();

    // If we create XZ plane, the polygon has normals facing downwards, so trick as of now is to create XY plane 
    // and then rotate it to face upwards
    this.rotateX(-Math.PI / 2);
    this.createLabelDivMesh();
  }

  private calculateCoordinatesByConfig() {
    const start = this.boardSet.dimensions.start;
    start.y = -start.y;

    const width = this.boardSet.dimensions.width;
    const height = this.boardSet.dimensions.height;
    
    this.boardSet.coordinates[0][0] = start.x;
    this.boardSet.coordinates[0][1] = start.y;
    this.boardSet.coordinates[1][0] = start.x;
    this.boardSet.coordinates[1][1] = start.y - height;
    this.boardSet.coordinates[2][0] = start.x + width;
    this.boardSet.coordinates[2][1] = start.y - height;
    this.boardSet.coordinates[3][0] = start.x + width;
    this.boardSet.coordinates[3][1] = start.y;

    // For renference only, not used in calculations
    // These two properties should not influence the coordinates, they are just for reference
    this.boardSet.center.x = start.x + width / 2;
    this.boardSet.center.y = start.y - height / 2;
    this.boardSet.center.z = start.z;
    this.boardSet.dimensions.end.x = start.x + width;
    this.boardSet.dimensions.end.y = start.y + height;

    this.setGeometry();
  }

  setConfig(boardSet: OPBoard) {
    this.boardSet = boardSet;
  }

  getConfig(): OPBoard {
    return this.boardSet;
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
  }

  private createLabelDivMesh() {
    const labelDiv = document.createElement('div');
    labelDiv.className = 'label';
    labelDiv.textContent = this.boardSet.labelName;

    this.labelDivMesh = new CSS2DObject(labelDiv);
    this.add(this.labelDivMesh);

    setTimeout(() => {
      if (!this.labelDivMesh) return;
      const width = labelDiv.clientWidth;
      const newWidth = width + width + 10;

      labelDiv.style.width = `${newWidth}px`;
      labelDiv.style.textAlign = 'right';

      const height = labelDiv.clientHeight;
      const newHeight = height + height + 10;

      labelDiv.style.height = `${newHeight}px`;
    
      this.labelDivMesh.position.set(
        this.boardSet.dimensions.start.x,
        this.boardSet.dimensions.start.y,
        0
      );
    }, 10);
  }
}