/**
 * Simple PolyLine class from Kernel
 */
import * as THREE from 'three';
import { OPLineMesh } from "../elements/element-line";
import { Vector3D } from '../../kernel/dist';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { generateUUID } from 'three/src/math/MathUtils.js';
import { Pencil } from '../../kernel/dist/src/pencil';

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

  /**
   * This map is used to store editor nodes, such as anchor points.
   * The key is a string identifier for the node, and the value is index of the node in the coordinates array.
   */
  editorNodes: Map<string, number> = new Map();
  activateNode: string | null = null;

  _selected: boolean = false;
  _pencil: Pencil | null = null;

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
      this.clearAnchorPoints();
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

  set pencil(pencil: Pencil) {
    this._pencil = pencil;

    this.pencil.onCursorMove.add((coords) => {
      this.handlePencilCursorMove(coords);
    })
  }

  get pencil() {
    if (this._pencil) {
      return this._pencil
    } else {
      throw new Error("Pencil is not set for this PolyLine.");
    }
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
      const anchorId = `anchor${generateUUID()}`;
      this.editorNodes.set(anchorId, this.propertySet.coordinates.indexOf(coord));

      const anchorPointDiv = document.createElement('div');
      anchorPointDiv.id = anchorId;
      anchorPointDiv.className = 'anchor-point';

      anchorPointDiv.addEventListener('mousedown', (event) => this.onMouseDown(event));
      anchorPointDiv.addEventListener('mouseup', (event) => this.onMouseUp(event));
      anchorPointDiv.addEventListener('mousemove', (event) => this.onMouseMove(event));
      anchorPointDiv.addEventListener('mouseover', (event) => this.onMouseHover(event));

      const anchorPoint = new CSS2DObject(anchorPointDiv);
      anchorPoint.position.set(coord[0], coord[1], coord[2]);
      this.add(anchorPoint);

      this.subNodes.set(anchorId, anchorPoint);
    }

    this.addAnchorStyles();
  }

  addAnchorStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .anchor-point {
        border-radius: 50%;
        cursor: pointer;
        width: 7px;
        height: 7px;
        background-color: rgba(0, 81, 255, 0.31);
        border: 1px solid rgb(0, 0, 0);
        transition: background-color 0.1s ease;
      }

      .anchor-point:hover {
        background-color:rgb(59, 255, 118);
      }
    `;
    document.head.appendChild(style);
  }

  clearAnchorPoints() {
    this.subNodes.forEach((anchorMesh, anchorId) => {
      anchorMesh.removeFromParent();
      this.editorNodes.delete(anchorId);

      const anchorDiv = document.getElementById(anchorId);
      if (anchorDiv) {
        anchorDiv.removeEventListener('mousedown', (event) => this.onMouseDown(event));
        anchorDiv.removeEventListener('mouseup', (event) => this.onMouseUp(event));
        anchorDiv.removeEventListener('mousemove', (event) => this.onMouseMove(event));
        anchorDiv.removeEventListener('mouseover', (event) => this.onMouseHover(event));
      }
    });
    this.subNodes.clear();
    this.activateNode = null;
  }

  onMouseHover(event: MouseEvent) {
    const anchorId = (event.target as HTMLElement).id;
    if (!anchorId.startsWith('anchor')) return;
  }

  onMouseDown(event: MouseEvent) {
    const anchorId = (event.target as HTMLElement).id;
    if (!anchorId.startsWith('anchor')) return;
    this.activateNode = anchorId;
  }

  onMouseUp(event: MouseEvent) {
    if (!this.activateNode) return;
    this.activateNode = null;
  }

  onMouseMove(event: MouseEvent) {
    if (!this.activateNode) return;
    console.log(`Mouse move on anchor point: ${event.target}`);
  }

  calculateAnchor() {
    if (this.activateNode) {
      const index = this.editorNodes.get(this.activateNode);
      if (index !== undefined) {
        const anchorMesh = this.subNodes.get(this.activateNode);
        if (anchorMesh) {
          const coords = this.propertySet.coordinates[index];
          if (coords) {
            anchorMesh.position.set(coords[0], coords[1], coords[2]);
          }
        }
      }
    }
  }

  handlePencilCursorMove(coords: THREE.Vector3) {
    if (this.activateNode) {
      const index = this.editorNodes.get(this.activateNode);
      if (index !== undefined) {
        this.propertySet.coordinates[index] = [coords.x, coords.y, coords.z];
        this.calculateCoordinatesByConfig();
        this.calculateAnchor();
      }
    }
  }
}
