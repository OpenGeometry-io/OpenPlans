import { Polygon, Vector3 } from "../kernel/";
import * as THREE from 'three';
import { IShape } from "../shapes/base-type";
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export interface BoardOptions {
  ogid?: string;
  center: {
    x: number;
    y: number;
    z: number;
  };
  color: number;
  type: 'BOARD';
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
  },
  // A Board can have multiple layers which are used to organize elements on the board
  // For example, a board can have a layer for walls, a layer for furniture, etc.
  layers?: string[];
}

// TODO: Use Polygon Shape instead of Polygon Mesh, which will provide us with editing capabilities
export class Board extends Polygon implements IShape {
  ogType = 'BOARD';

  subElements: Map<string, THREE.Object3D> = new Map();
    
  private labelDivMesh: CSS2DObject | null = null;

  // Properties that can be set externally start with an #, provides tight encapsulation and prevents accidental access
  selected: boolean = false;
  edit: boolean = false;

  propertySet: BoardOptions = {
    center: {
      x: 0,
      y: 0,
      z: 0,
    },
    color: 0xffffff,
    type: 'BOARD',
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

  // set selected(value: boolean) {
  //   if (value) {
  //     this.outlineColor = 0x4460FF;
  //   }
  //   else {
  //     this.outlineColor = 0x000000;
  //   }
  //   this._selected = value;
  // }

  // get selected() {
  //   return this._selected;
  // }

  set width(value: number) {
    this.propertySet.dimensions.width = value;

    this.setOPGeometry();
  }

  get width() {
    return this.propertySet.dimensions.width;
  }

  set height(value: number) {
    this.propertySet.dimensions.height = value;

    this.setOPGeometry();
  }

  get height() {
    return this.propertySet.dimensions.height;
  }

  set start(value: { x: number; y: number; z: number }) {
    this.propertySet.dimensions.start.x = value.x;
    this.propertySet.dimensions.start.y = value.y;

    this.setOPGeometry();
  }

  set labelName(value: string) {
    this.propertySet.labelName = value;

    const labelDiv = this.labelDivMesh?.element;
    if (labelDiv) {
      labelDiv.textContent = value;
    }
  }

  get labelName() {
    return this.propertySet.labelName;
  }

  set boardColor(value: number) {
    this.propertySet.color = value;
    this.color = value;
  }

  get boardColor() {
    return (this.material as THREE.MeshBasicMaterial).color.getHex();
  }

  constructor(boardConfig?: BoardOptions) {
    super({
      ogid: boardConfig?.ogid,
      vertices: [],
      color: 0
    });

    if (boardConfig) {
      this.propertySet = { ...this.propertySet, ...boardConfig  };
    }

    this.propertySet.ogid = this.ogid;
    this.setOPGeometry();
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

    // For reference only, not used in calculations
    // These two properties should not influence the coordinates, they are just for reference
    this.propertySet.center.x = start.x + width / 2;
    this.propertySet.center.y = start.y - height / 2;
    this.propertySet.center.z = start.z;
    this.propertySet.dimensions.end.x = start.x + width;
    this.propertySet.dimensions.end.y = start.y + height;
  }

  setOPConfig(propertySet: BoardOptions) {
    this.propertySet = propertySet;
  }

  getOPConfig(): BoardOptions {
    return this.propertySet;
  }

  setOPGeometry() {

    this.calculateCoordinatesByConfig();
    // If we create XZ plane, the polygon has normals facing downwards, so trick as of now is to create XY plane 
    // and then rotate it to face upwards

    this.outline = false;

    const points = [
      new Vector3(this.propertySet.coordinates[0][0], this.propertySet.coordinates[0][1], 0),
      new Vector3(this.propertySet.coordinates[1][0], this.propertySet.coordinates[1][1], 0),
      new Vector3(this.propertySet.coordinates[2][0], this.propertySet.coordinates[2][1], 0),
      new Vector3(this.propertySet.coordinates[3][0], this.propertySet.coordinates[3][1], 0),
    ];
    
    this.setConfig({
      vertices: points,
      color: this.propertySet.color
    });

    this.rotation.x = -Math.PI / 2; // Rotate to face the camera
    this.position.y = -0.01;

    this.outline = true;

    if (this.labelDivMesh) {
      this.setLabelPosition();
    }
  }

  dispose() {
    this.geometry.dispose();
    this.labelDivMesh?.element.remove();
    this.labelDivMesh = null;
    this.clear();
    this.subElements.clear();
    this.removeFromParent();
  }

  setOPMaterial() {
    // this.color = this.propertySet.color;
  }

  private createLabelDivMesh() {
    const labelDiv = document.createElement('div');
    labelDiv.textContent = this.propertySet.labelName;
    labelDiv.style.fontSize = '12px';

    this.labelDivMesh = new CSS2DObject(labelDiv);
    this.add(this.labelDivMesh);

    this.setLabelPosition();

    setTimeout(() => {
      const width = labelDiv.clientWidth;
      const newWidth = width + width + 10;

      labelDiv.style.width = `${newWidth}px`;
      labelDiv.style.textAlign = 'right';

      const height = labelDiv.clientHeight;
      const newHeight = height + height + 10;

      labelDiv.style.height = `${newHeight}px`;
    }, 100);
  }

  private setLabelPosition() {    
    this.labelDivMesh?.position.set(
      this.propertySet.dimensions.start.x,
      this.propertySet.dimensions.start.y,
      this.propertySet.dimensions.start.z
    );
  }
}