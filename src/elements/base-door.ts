import {
  Polygon,
  Vector3D
} from '../../kernel/dist';
import * as THREE from 'three';
import { Pencil } from '../../kernel/dist/src/pencil';
import { PolyLineShape } from '../shape/polyline-shape';
import { PolygonBuilder } from '../shape-builder/polygon-builder';

export type DoorType = 'GLASS' | 'WOOD' | 'DOUBLEDOOR' | 'SLIDING' | 'FOLDING' | 'DOUBLEACTION' | 'OTHER';
export type DoorMaterial = 'GLASS' | 'WOOD' | 'METAL' | 'PLASTIC' | 'COMPOSITE' | 'OTHER';

export interface OPDoor {
  id?: string;
  labelName: string;
  type: 'door';
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
    length: number;
  };
  doorPosition: [number, number, number];
  doorType: DoorType;
  doorHeight: number;
  doorThickness: number;
  doorMaterial: string;
  doorColor: number;
  hingeColor: number;
  doorRotation: number;
  doorQuadrant: number;
  coordinates: Array<[number, number, number]>;
}

export class BaseDoor extends PolyLineShape {
  ogType: string = 'baseDoor';

  subChild: Map<string, THREE.Object3D> = new Map();

  subNodes: Map<string, THREE.Object3D> = new Map();
  subEdges: Map<string, THREE.Object3D> = new Map();

  editorNodes: Map<string, number> = new Map();
  editorEdges: Map<string, number> = new Map();
  activeNode: string | null = null;
  activeEdge: string | null = null;

  initialCursorPos: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  brepRaw: string | null = null;
  
  _selected: boolean = false;
  _pencil: Pencil | null = null;

  propertySet: OPDoor = {
    type: 'door',
    labelName: 'Simple Door',
    dimensions: {
      start: { x: 0, y: 0, z: 0 },
      end: { x: 0, y: 0, z: 0 },
      length: 2,
    },
    doorPosition: [0, 0, 0],
    doorType: 'WOOD',
    doorHeight: 0,
    doorThickness: 0.2,
    doorMaterial: 'WOOD',
    doorColor: 0x8B4513,
    hingeColor: 0x000000,
    doorRotation: 1.5,
    doorQuadrant: 1,
    // Coordinates is a calulated property, not set by user
    coordinates: [],
  };

  set selected(value: boolean) {
    // if (value) {
    //   this.material = new THREE.LineBasicMaterial({ color: 0x4460FF });
    //   this.addAnchorPointsOnSelection();
    //   this.addAnchorEdgesOnSelection();
    // }
    // else {
    //   this.material = new THREE.LineBasicMaterial({ color: this.propertySet.color });
    //   this.clearAnchorPoints();
    //   this.clearAnchorEdges();
    // }
    // this._selected = value;
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

  set doorThickness(value: number) {
    this.propertySet.doorThickness = value;
  }

  set doorColor(value: number) {
    this.propertySet.doorColor = value;
    const doorPolygon = this.subChild.get('doorPolygon');
    if (doorPolygon && doorPolygon instanceof PolygonBuilder) {
      const material = new THREE.MeshBasicMaterial({
        color: value,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      doorPolygon.material = material;
    }
  }

  set doorRotation(value: number) {
    this.propertySet.doorRotation = value;

    const doorGroup = this.subChild.get('doorGroup');
    if (!doorGroup) return;
    if (value < 1 || value > 2) return;
    doorGroup.rotation.y = Math.PI / -value;

    // const hingeArc = this.subChild.get('hingeArc');
    // if (!hingeArc) return;

    this.createHingeDoorArc();
  }

  set doorQuadrant(value: number) {
    if (value < 1 || value > 4) return;
    switch (value) {
      case 1:
        this.rotation.set(0, 0, 0);
        break;
      case 2:
        this.rotation.set(0, 0, 0);
        this.rotateZ(Math.PI);
        break;
      case 3:
        this.rotation.set(0, 0, 0);
        this.rotateX(Math.PI);
        this.rotateZ(Math.PI);
        break;
      case 4:
        this.rotation.set(0, 0, 0);
        this.rotateX(Math.PI);
        break;
      default:
        break;
    }
  }

  set hingeColor(value: number) {
    this.propertySet.hingeColor = value;
  }

  set doorPosition(point: [number, number, number]) {
    this.propertySet.doorPosition = point;
    this.position.set(point[0], point[1], point[2]);
  }

  set pencil(pencil: Pencil) {
    // this._pencil = pencil;

    // this.pencil.onCursorMove.add((coords) => {
    //   this.handlePencilCursorMove(coords);
    // });

    // this.pencil.onCursorDown.add((coords) => {
    //   this.initialCursorPos = coords;
    // });
  }

  constructor(baseDoorConfig?: OPDoor) {
    super();
    if (baseDoorConfig) {
      this.setOPConfig(baseDoorConfig);
      this.calculateCoordinatesByConfig();

      this.brepRaw = this.getBrepData();
      this.createDoorAndHinge();

      this.doorPosition = this.propertySet.doorPosition;
      this.doorQuadrant = this.propertySet.doorQuadrant;
    } else {
      this.propertySet.id = this.ogid;
      this.calculateCoordinatesByConfig();

      this.brepRaw = this.getBrepData();
      this.createDoorAndHinge();
    }
  }

  calculateCoordinatesByConfig() {
    this.propertySet.dimensions.start.x = -this.propertySet.dimensions.length / 2;
    this.propertySet.dimensions.start.y = 0;
    this.propertySet.dimensions.start.z = 0;

    this.propertySet.dimensions.end.x = this.propertySet.dimensions.length / 2;
    this.propertySet.dimensions.end.y = 0;
    this.propertySet.dimensions.end.z = 0;

    // Clear previous coordinates
    this.propertySet.coordinates = [];
    this.propertySet.coordinates.push(
      [this.propertySet.dimensions.start.x, this.propertySet.dimensions.start.y, this.propertySet.dimensions.start.z],
      [this.propertySet.dimensions.end.x, this.propertySet.dimensions.end.y, this.propertySet.dimensions.end.z],
    );

    this.setOPGeometry();
    this.setOPMaterial();
  }

  private createHingeDoorArc() {
    const hingeArc = this.subChild.get('hingeArc');
    if (hingeArc) {
      hingeArc.removeFromParent();
      this.subChild.delete('hingeArc');
    }

    const { start, end } = this.propertySet.dimensions;
    const thickness = this.propertySet.doorThickness / 2;

    const arc = new THREE.EllipseCurve(
      0, 0, 
      start.x - end.x, start.x - end.x - thickness,
      Math.PI, Math.PI / this.propertySet.doorRotation,
      true
    );
    const arcMat = new THREE.LineBasicMaterial({ color: 0x000000 });
    const arcGeo = new THREE.BufferGeometry().setFromPoints(arc.getPoints(32));
    const arcMesh = new THREE.Line(arcGeo, arcMat);
    arcMesh.position.set(0, 0, -thickness);
    arcMesh.rotateX(Math.PI / 2);
    this.subChild.set('hingeArc', arcMesh);
    
    const hingeLeft = this.subChild.get('hingeLeftPolygon');
    hingeLeft?.add(arcMesh);
  }

  private createDoorAndHinge() {
    const { start, end } = this.propertySet.dimensions;

    const { hingeLeft, hingeRight } = this.createHingePolygon();
    hingeLeft.position.set(start.x, start.y, start.z);
    hingeRight.position.set(end.x, end.y, end.z);

    const hingeClip = new THREE.SphereGeometry(0.01, 32, 32);
    const hingeClipMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const hingeClipMesh = new THREE.Mesh(hingeClip, hingeClipMat);
    hingeClipMesh.position.set(0, 0, -this.propertySet.doorThickness);
    this.subChild.set('hingeClipMesh', hingeClipMesh);
    hingeLeft.add(hingeClipMesh);

    const doorPolygon = this.createDoorPolygon();
    doorPolygon.position.set(start.x, start.y, start.z - this.propertySet.doorThickness / 2);
    
    const doorGroup = new THREE.Group();
    doorGroup.position.set(0, 0, 0);
    hingeClipMesh.add(doorGroup);
    doorGroup.add(doorPolygon);
    doorGroup.rotation.y = Math.PI / -this.propertySet.doorRotation;
    this.subChild.set('doorGroup', doorGroup);

    this.createHingeDoorArc();
  }

  private createHingePolygon() {
    const doorThickness = this.propertySet.doorThickness;
    const halfDoorThickness = doorThickness / 2;
    const points: Array<[number, number, number]> = [];
    points.push(
      [-halfDoorThickness, 0, -doorThickness],
      [-halfDoorThickness, 0, doorThickness],
      [halfDoorThickness, 0, doorThickness],
      [halfDoorThickness, 0, 0],
      [0, 0, 0],
      [0, 0, -doorThickness]
    )
    const hingePolygon = new PolygonBuilder();
    hingePolygon.insertMultiplePoints(points);
    hingePolygon.material = new THREE.MeshBasicMaterial({
      color: this.propertySet.hingeColor,
      side: THREE.DoubleSide,
      depthWrite: true
    });
    this.subChild.set('hingeLeftPolygon', hingePolygon);
    this.add(hingePolygon);

    const hingeRight = hingePolygon.clone().rotateZ(Math.PI);
    this.subChild.set('hingeRightPolygon', hingeRight);
    this.add(hingeRight);

    return {
      hingeLeft: hingePolygon,
      hingeRight: hingeRight,
    };
  }

  private createDoorPolygon() {
    const { start, end } = this.propertySet.dimensions;
    const thickness = this.propertySet.doorThickness / 2;
    const points: Array<[number, number, number]> = [];
    // points.push(
    //   [start.x + thickness, start.y, start.z - thickness],
    //   [start.x + thickness, start.y, start.z + thickness],
    //   [end.x - thickness, end.y, end.z + thickness],
    //   [end.x - thickness, end.y, end.z - thickness]
    // );
    points.push(
      [start.x, start.y, start.z - thickness],
      [start.x, start.y, start.z + thickness],
      [end.x, end.y, end.z + thickness],
      [end.x, end.y, end.z - thickness]
    );

    console.log('Door points:', points);
    
    const doorPolygon = new PolygonBuilder();
    doorPolygon.insertMultiplePoints(points);
    doorPolygon.material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      depthWrite: true,
    });
    this.subChild.set('doorPolygon', doorPolygon);
    
    this.add(doorPolygon);
    
    return doorPolygon;
  }

  setOPConfig(config: OPDoor): void {
    this.propertySet = config;
  }

  getOPConfig(): OPDoor {
    return this.propertySet;
  }

  setOPGeometry(): void {
    const { coordinates } = this.propertySet;
    const points = coordinates.map(coord => new Vector3D(coord[0], coord[1], coord[2]));
    this.addMultiplePoints(points);
  }

  setOPMaterial() {
    this.material = new THREE.LineBasicMaterial({ color: 0x000000, depthWrite: false });
    this.renderOrder = 1;
  }

  set wallMaterial(material: DoorMaterial) {
    this.propertySet.doorMaterial = material;
  }

  dispose() {
    this.geometry.dispose();
    this.clear();
    this.subChild.forEach((child) => {
      if (child instanceof PolygonBuilder) {
        child.dispose();
      }

      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        child.material.dispose();
      }
      this.remove(child);
    });
    this.subChild.clear();
    this.removeFromParent();

    super.dispose();
  }
}
