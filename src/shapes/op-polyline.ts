/**
 * Simple PolyLine class from Kernel
 */
import * as THREE from 'three';
import { OPLineMesh } from "../elements/element-line";
import { Vector3D } from '../../kernel/dist';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export interface OPPolyLine {
  id?: string;
  labelName: string;
  type: 'polyline';
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
  coordinates: Array<[number, number, number]>;
}

export class PolyLine extends OPLineMesh {
  ogType: string = "OPPolyLine";

  subNodes: Map<string, THREE.Object3D> = new Map();
  editorNodes: Map<string, THREE.Object3D> = new Map();

  _selected: boolean = false;

  propertySet: OPPolyLine = {
    type: 'polyline',
    labelName: 'Poly Line',
    dimensions: {
      start: {
        x: 0,
        y: 0,
        z: 0,
      },
      end: {
        x: 1,
        y: 0,
        z: 0,
      },
      width: 1,
    },
    color: 0x000000,
    coordinates: []
  };

  set selected(value: boolean) {
    if (value) {
      this.material = new THREE.LineBasicMaterial({ color: 0x4460FF });
      this.addAnchorPointsOnSelection();
    }
    else {
      this.material = new THREE.LineBasicMaterial({ color: this.propertySet.color });
    }
    this._selected = value;
  }

  get selected() {
    return this._selected;
  }

  set labelName(value: string) {
    this.propertySet.labelName = value;
  }

  get labelName() {
    return this.propertySet.labelName;
  }

  constructor(polylineConfig?: OPPolyLine) {
    super();

    if (polylineConfig) {
      this.setOPConfig(polylineConfig);
    } else {
      this.propertySet.id = this.ogid;
    }

    this.calculateCoordinatesByConfig();
  }

  insertPoint(x: number, y: number, z: number ) {
    this.propertySet.coordinates.push([x, y, z]);
    this.calculateCoordinatesByConfig();
  }

  private calculateCoordinatesByConfig() {
    if (this.propertySet.coordinates.length <= 0) return;
    this.propertySet.dimensions.end.x = this.propertySet.coordinates[this.propertySet.coordinates.length - 1][0];
    this.propertySet.dimensions.end.y = this.propertySet.coordinates[this.propertySet.coordinates.length - 1][1];
    this.propertySet.dimensions.end.z = this.propertySet.coordinates[this.propertySet.coordinates.length - 1][2];

    this.setOPGeometry();
  }

  setOPConfig(config: OPPolyLine) {
    this.propertySet = config;
  }

  getOPConfig(): OPPolyLine {
    return this.propertySet;
  }

  setOPGeometry() {
    const { coordinates } = this.propertySet;

    const points = coordinates.map(coord => new Vector3D(coord[0], coord[1], coord[2]));
    console.log(points);

    this.addMultiplePoints(points);
  }

  setOPMaterial() {
    this.material = new THREE.LineBasicMaterial({ color: this.propertySet.color });
  }

  addAnchorPointsOnSelection() {
    // WIP
    for (const coord of this.propertySet.coordinates) {
      const anchorPointDiv = document.createElement('div');
      anchorPointDiv.className = 'anchor-point';
      anchorPointDiv.style.backgroundColor = '#FF0000';
      anchorPointDiv.style.width = '10px';
      anchorPointDiv.style.height = '10px';

      const anchorPoint = new CSS2DObject(anchorPointDiv);
      anchorPoint.position.set(coord[0], coord[1], coord[2]);
      this.editorNodes.set(`anchor-${coord[0]}-${coord[1]}-${coord[2]}`, anchorPoint);
      this.add(anchorPoint);
    }
  }

  clearAnchorPoints() {}
}
