import { Vector3D } from "../kernel/dist";
import { PolygonShape } from "../shape";
import * as THREE from "three";
import { Event } from "../utils/event";
import { Pencil } from "../kernel/dist/src/pencil";
import { OpenPlans } from "..";

export interface IGenericPropertySet {
  id?: string;
  labelName: string;
  dimensions: {
    rotation: number;
    position: {
      x: number;
      y: number;
      z: number;
    },
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
  };
  type: string;
  readonly coordinates: Array<[number, number, number]>;
  [key: string]: any;
}

// TODO: We will create a future package for this
// This generic builder can be used to create blocks as well.

export class GenericBuilder extends PolygonShape {
  ogType: string = 'genericBuilder';
  
  subNodes: Map<string, THREE.Object3D> = new Map();
  childNodes: Map<string, any> = new Map();

  // Editor
  polygonButton: HTMLElement | null = null;
  initialCursorPos: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  brepRaw: string | null = null;
  activeElement: HTMLElement | null = null;

  _selected: boolean = false;
  _pencil: Pencil | null = null;

  onPropertyUpdate: Event<void> = new Event();

  propertySet: IGenericPropertySet = {
    labelName: 'Generic Builder',
    dimensions: {
      rotation: 0,
      position: {
        x: 0,
        y: 0,
        z: 0,
      },
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
    },
    type: 'genericBuilder',
    coordinates: [
      [-0.5, 0.01, -0.5],
      [-0.5, 0.01, 0.5],
      [0.5, 0.01, 0.5],
      [0.5, 0.01, -0.5]
    ],
  }

  set pencil(pencil: Pencil) {
    this._pencil = pencil;
    
    this.pencil.onCursorMove.add((coords) => {
      this.handlePencilCursorMove(coords);
    });

    this.pencil.onCursorDown.add((coords) => {
      this.initialCursorPos = coords;
    });
  }

  get pencil() {
    if (this._pencil) {
      return this._pencil
    } else {
      throw new Error("Pencil is not set for this PolyLine.");
    }
  }

  set builderPosition(arrData: [number, number, number]) {
    this.propertySet.dimensions.position = {
      x: arrData[0],
      y: arrData[1],
      z: arrData[2],
    };
    this.position.set(arrData[0], arrData[1], arrData[2]);

    this.onPropertyUpdate.trigger();
  }

  set builderRotation(value: number) {
    this.propertySet.dimensions.rotation = value;
    this.rotation.set(0, value, 0);
  }

  set selected(value: boolean) {
    if (value) {
      this.outlineColor = 0x4460FF;
      this.addDivOverlay();
    } else {
      this.outlineColor = 0x000000;
      this.removeOverlay();
    }
    this._selected = value;
  }

  constructor(config?: IGenericPropertySet) {
    super();
    if (config) {
      this.setOPConfig(config);
    } else {
      this.propertySet.id = this.ogid;
    }

    this.setOPGeometry();
    this.setOPMaterial();
  }

  setOPConfig(config: IGenericPropertySet): void {
    for (const key in config) {
      if (Object.prototype.hasOwnProperty.call(config, key)) {
        this.propertySet[key] = config[key];
      }
    }
  }

  getOPConfig(): Record<string, any> {
    return this.propertySet;
  }

  setOPGeometry(): void {
    this.resetVertices();
    this.outline = false;

    const coordinates = this.propertySet.coordinates;
    const points: Vector3D[] = [];
    for (let i = 0; i < coordinates.length; i++) {
      const point = new Vector3D(
        coordinates[i][0],
        coordinates[i][1],
        coordinates[i][2]
      );
      points.push(point);
    }
    this.addVertices(points);
    // this.getBrepData();
    this.setOPMaterial();
    this.outline = true;
  }

  setOPMaterial(): void {
    const material = new THREE.MeshBasicMaterial({
      color: 0x44460FF,
      side: THREE.DoubleSide,
    });
    this.material = material;
  }

  insertChild(child: any) {
    if (this.childNodes.has(child.ogid)) {
      console.warn(`Child with ogid ${child.ogid} already exists.`);
      return;
    }
    this.childNodes.set(child.ogid, child);
    this.add(child);
  }

  // TODO: Add this to Base class later
  dispose() {
    // Dispose Child Nodes and Remove from Parent
    // Disposing Child Nodes Should Dispose It's Geometry and Editor as well
    for (const child of this.childNodes.values()) {
      console.log(`Disposing child: ${child.ogid}`);
      child.removeFromParent();
      child.dispose();
    }

    this.geometry.dispose();
    (this.material as THREE.Material).dispose();
    // Disposing OG - Polygon
    super.dispose();
  }

  // Editor
  removeOverlay() {
    if (this.polygonButton) {
      this.polygonButton.removeEventListener('mousedown', this.mouseDown);
      this.polygonButton.removeEventListener('mouseup', this.mouseUp);
      document.body.removeChild(this.polygonButton);
      this.polygonButton = null;
    }
  }

  addDivOverlay() {
    if (this.polygonButton) {
      this.polygonButton.remove();
    }

    this.polygonButton = document.createElement('div');
    this.polygonButton.className = 'polygon-button';
    this.polygonButton.style.position = 'absolute';

    const center = OpenPlans.toScreenPosition(new THREE.Vector3(
      this.propertySet.dimensions.position.x,
      this.propertySet.dimensions.position.y,
      this.propertySet.dimensions.position.z
    ));
    
    const min = OpenPlans.toScreenPosition(new THREE.Vector3(
      this.propertySet.coordinates[0][0],
      this.propertySet.coordinates[0][1],
      this.propertySet.coordinates[0][2]
    ));
    const max = OpenPlans.toScreenPosition(new THREE.Vector3(
      this.propertySet.coordinates[2][0],
      this.propertySet.coordinates[2][1],
      this.propertySet.coordinates[2][2]
    ));
    const width = Math.abs(max.x - min.x);
    const height = Math.abs(max.y - min.y);

    this.polygonButton.style.left = `${center.x - width / 2}px`;
    this.polygonButton.style.top = `${center.y - height / 2}px`;

    this.polygonButton.style.width = `${width}px`;
    this.polygonButton.style.height = `${height}px`;

    const style = document.createElement('style');
    style.textContent = `
      .polygon-button {
        background:rgb(255, 68, 68);
      }
      
      .polygon-button:hover {
        cursor: grab;
      }
    `;

    // Events
    this.polygonButton.addEventListener('mousedown', (event) => {
      event.preventDefault();
      this.mouseDown(event);
    });
    this.polygonButton.addEventListener('mouseup', (event) => {
      event.preventDefault();
      this.mouseUp(event);
    });

    document.head.appendChild(style);
    document.body.appendChild(this.polygonButton);
  }

  mouseDown(event: MouseEvent) {
    this.activeElement = this.polygonButton;
  }

  mouseUp(event: MouseEvent) {
    if (this.activeElement) {
      this.activeElement = null;
    }
  }

  handlePencilCursorMove(coords: THREE.Vector3) {
    if (!this.activeElement) {
      return;
    }
    this.builderPosition = [
      coords.x - this.initialCursorPos.x,
      coords.y - this.initialCursorPos.y,
      coords.z - this.initialCursorPos.z
    ];

    this.recalculateOverlay();
  }

  recalculateOverlay() {
    if (!this.polygonButton) {
      return;
    }

    const center = OpenPlans.toScreenPosition(new THREE.Vector3(
      this.propertySet.dimensions.position.x,
      this.propertySet.dimensions.position.y,
      this.propertySet.dimensions.position.z
    ));
    
    const min = OpenPlans.toScreenPosition(new THREE.Vector3(
      this.propertySet.coordinates[0][0],
      this.propertySet.coordinates[0][1],
      this.propertySet.coordinates[0][2]
    ));
    const max = OpenPlans.toScreenPosition(new THREE.Vector3(
      this.propertySet.coordinates[2][0],
      this.propertySet.coordinates[2][1],
      this.propertySet.coordinates[2][2]
    ));
    const width = Math.abs(max.x - min.x);
    const height = Math.abs(max.y - min.y);

    this.polygonButton.style.left = `${center.x - width / 2}px`;
    this.polygonButton.style.top = `${center.y - height / 2}px`;

    this.polygonButton.style.width = `${width}px`;
    this.polygonButton.style.height = `${height}px`;

    this.polygonButton.style.transform = `rotate(${-this.propertySet.dimensions.rotation}rad)`;
  }
}