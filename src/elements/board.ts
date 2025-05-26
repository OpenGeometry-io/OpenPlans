import * as THREE from 'three';
import { Polygon, Vector3D } from '../../kernel/dist';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { OPPolygonMesh } from './element-mesh';

export interface OPBoard {
  id?: string;
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

export class Board extends OPPolygonMesh {
  public ogType = 'board';

  // Properties that cannot be set externally should be just private, can be accessed at runtime
  subNodes: Map<string, THREE.Object3D> = new Map();
  private labelDivMesh: CSS2DObject | null = null;

  // Properties that can be set externally start with an #, provides tight encapsulation and prevents accidental access
  #selected = false;

  propertySet: OPBoard = {
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
    this.propertySet.dimensions.width = value;
    this.calculateCoordinatesByConfig();
  }

  get width() {
    return this.propertySet.dimensions.width;
  }

  set height(value: number) {
    this.propertySet.dimensions.height = value;
    this.calculateCoordinatesByConfig();
  }

  get height() {
    return this.propertySet.dimensions.height;
  }

  set start(value: { x: number; y: number; z: number }) {
    this.propertySet.dimensions.start.x = value.x;
    this.propertySet.dimensions.start.y = value.y;

    this.calculateCoordinatesByConfig();
  }

  set labelName(value: string) {
    this.propertySet.labelName = value;
  }

  get labelName() {
    return this.propertySet.labelName;
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
    } else {
      this.propertySet.id = this.ogid;
    }

    this.calculateCoordinatesByConfig();

    // If we create XZ plane, the polygon has normals facing downwards, so trick as of now is to create XY plane 
    // and then rotate it to face upwards
    this.rotateX(-Math.PI / 2);
    this.createLabelDivMesh();
  }

  private calculateCoordinatesByConfig() {
    const start = this.propertySet.dimensions.start;
    // start.y = -start.y; // find out if we need to use this, this is how figma works 

    const width = this.propertySet.dimensions.width;
    const height = this.propertySet.dimensions.height;
    
    this.propertySet.coordinates[0][0] = start.x;
    this.propertySet.coordinates[0][1] = start.y;
    this.propertySet.coordinates[1][0] = start.x;
    this.propertySet.coordinates[1][1] = start.y - height;
    this.propertySet.coordinates[2][0] = start.x + width;
    this.propertySet.coordinates[2][1] = start.y - height;
    this.propertySet.coordinates[3][0] = start.x + width;
    this.propertySet.coordinates[3][1] = start.y;

    // For renference only, not used in calculations
    // These two properties should not influence the coordinates, they are just for reference
    this.propertySet.center.x = start.x + width / 2;
    this.propertySet.center.y = start.y - height / 2;
    this.propertySet.center.z = start.z;
    this.propertySet.dimensions.end.x = start.x + width;
    this.propertySet.dimensions.end.y = start.y + height;

    this.setGeometry();
  }

  setConfig(propertySet: OPBoard) {
    this.propertySet = propertySet;
  }

  getConfig(): OPBoard {
    return this.propertySet;
  }

  setGeometry() {
    this.resetVertices();
    this.outline = false;

    const points = [
      new Vector3D(this.propertySet.coordinates[0][0], this.propertySet.coordinates[0][1], 0),
      new Vector3D(this.propertySet.coordinates[1][0], this.propertySet.coordinates[1][1], 0),
      new Vector3D(this.propertySet.coordinates[2][0], this.propertySet.coordinates[2][1], 0),
      new Vector3D(this.propertySet.coordinates[3][0], this.propertySet.coordinates[3][1], 0),
    ];
    this.addVertices(points);

    // this.getBrepData();
    this.setMaterial();
    this.outline = true;

    this.labelDivMesh?.position.set(
      this.propertySet.dimensions.start.x,
      this.propertySet.dimensions.start.y,
      this.propertySet.dimensions.start.z
    );
  }

  setMaterial() {
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    this.material = material;
  }

  private createLabelDivMesh() {
    const labelDiv = document.createElement('div');
    labelDiv.textContent = this.propertySet.labelName;
    labelDiv.style.fontSize = '12px';

    this.labelDivMesh = new CSS2DObject(labelDiv);
    this.add(this.labelDivMesh);

    setTimeout(() => {
      this.setLabelPosition();
    }, 100);
  }

  private setLabelPosition() {
    const labelDiv = this.labelDivMesh?.element;
    if (!labelDiv) return;
    
    const width = labelDiv.clientWidth;
    const newWidth = width + width + 10;

    labelDiv.style.width = `${newWidth}px`;
    labelDiv.style.textAlign = 'right';

    const height = labelDiv.clientHeight;
    const newHeight = height + height + 10;

    labelDiv.style.height = `${newHeight}px`;
    
    this.labelDivMesh?.position.set(
      this.propertySet.dimensions.start.x,
      this.propertySet.dimensions.start.y,
      0
    );
  }
}