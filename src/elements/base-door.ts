// import {
//   Vector3
// } from '../kernel/dist';
import * as THREE from 'three';
// import { Pencil } from '../kernel/dist/src/pencil';
// import { PolyLineShape } from '../primitives/polyline';
// import { PolygonBuilder } from '../shape-builder/polygon-builder';
// import { generateUUID } from 'three/src/math/MathUtils.js';
// import { OpenPlans } from '..';

import { Cuboid, Line, Opening, Vector3 } from "../kernel/";
import { DoorType, ElementType } from "./base-type";
import { IShape } from '../shapes/base-type';

export interface OPDoor {
  ogid?: string;
  labelName: string;
  type: ElementType.DOOR;
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
  doorHeight: number; // Height of the door panel
  doorThickness: number; // Panel thickness
  frameThickness: number;
  frameColor: number;
  // doorMaterial: string;
  doorColor: number;
  doorRotation: number;
  doorQuadrant: number;
  coordinates: Array<[number, number, number]>;
}

// export class BaseDoor extends PolyLineShape {
export class BaseDoor extends Opening implements IShape {
  ogType: string = ElementType.DOOR;

  skeleton: Line;
  subNodes: Map<string, THREE.Object3D> = new Map();

  selected: boolean = false;
  edit: boolean = false;

//   subNodes: Map<string, THREE.Object3D> = new Map();
//   subEdges: Map<string, HTMLDivElement> = new Map();

//   editorNodes: Map<string, number> = new Map();
//   editorEdges: Map<string, number> = new Map();
//   activeNode: string | null = null;
//   activeEdge: string | null = null;

//   initialCursorPos: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
//   brepRaw: string | null = null;

//   _pencil: Pencil | null = null;

  propertySet: OPDoor = {
    type: ElementType.DOOR,
    labelName: 'Simple Door',
    dimensions: {
      start: { x: -0.5, y: 0, z: 0 },
      end: { x: 0.5, y: 0, z: 0 },
      length: 1,
    },
    doorPosition: [0, 0, 0],
    doorType: DoorType.WOOD,
    doorHeight: 2.1,
    doorThickness: 0.1,
    frameThickness: 0.2,
    doorColor: 0x8B4513,
    frameColor: 0x000000,
    doorRotation: 1.5,
    doorQuadrant: 1,
    // Coordinates is a calulated property, not set by user
    coordinates: [],
  };

//   set selected(value: boolean) {
//     if (value) {
//       this.material = new THREE.LineBasicMaterial({ color: 0x4460FF, depthWrite: false });
//       this.addAnchorEdgesOnSelection();
//     }
//     else {
//       this.material = new THREE.LineBasicMaterial({ color: 0x000000, depthWrite: false });
//       this.clearAnchorEdges();
//     }
//     this._selected = value;
//   }

//   get selected() {
//     return this._selected;
//   }

  set labelName(value: string) {
    this.propertySet.labelName = value;
  }

  get labelName() {
    return this.propertySet.labelName;
  }

//   set doorColor(value: number) {
//     this.propertySet.doorColor = value;
//     const doorPolygon = this.subChild.get('doorPolygon');
//     if (doorPolygon && doorPolygon instanceof PolygonBuilder) {
//       const material = new THREE.MeshBasicMaterial({
//         color: value,
//         side: THREE.DoubleSide,
//         depthWrite: false,
//       });
//       doorPolygon.material = material;
//     }
//   }

//   set doorRotation(value: number) {
//     this.propertySet.doorRotation = value;

//     const doorGroup = this.subChild.get('doorGroup');
//     if (!doorGroup) return;
//     if (value < 1 || value > 2) return;
//     doorGroup.rotation.y = Math.PI + (Math.PI / -value);

//     this.createHingeDoorArc();
//   }

//   set doorQuadrant(value: number) {
//     if (value < 1 || value > 4) return;
//     this.propertySet.doorQuadrant = value;

//     switch (value) {
//       case 1:
//         this.rotation.set(0, 0, 0);
//         break;
//       case 2:
//         this.rotation.set(0, 0, 0);
//         this.rotateZ(Math.PI);
//         break;
//       case 3:
//         this.rotation.set(0, 0, 0);
//         this.rotateY(Math.PI);
//         this.rotateZ(Math.PI / 2);
//         break;
//       case 4:
//         this.rotation.set(0, 0, 0);
//         this.rotateX(Math.PI);
//         break;
//       default:
//         break;
//     }
//   }

//   set hingeColor(value: number) {
//     this.propertySet.hingeColor = value;
//   }

  set doorPosition(point: [number, number, number]) {
    this.propertySet.doorPosition = point;
    this.position.set(point[0], point[1], point[2]);

    // this.set_position(new Vector3(point[0], point[1], point[2]));

    // this.brepRaw = this.getBrepData();
  }

//   set pencil(pencil: Pencil) {
//     this._pencil = pencil;
//     this.pencil.onCursorMove.add((coords) => {
//       this.handlePencilCursorMove(coords);
//     });

//     this.pencil.onCursorDown.add((coords) => {
//       this.initialCursorPos = coords;
//     });
//   }

//   get pencil() {
//     if (!this._pencil) {
//       throw new Error('Pencil is not set for BaseDoor');
//     }
//     return this._pencil;
//   }

  set doorLength(value: number) {
    this.propertySet.dimensions.length = value;

    // Later make this according to the direction of the line
    this.propertySet.dimensions.start.x = -value / 2;
    this.propertySet.dimensions.start.y = 0;
    this.propertySet.dimensions.start.z = 0;

    this.propertySet.dimensions.end.x = value / 2;
    this.propertySet.dimensions.end.y = 0;
    this.propertySet.dimensions.end.z = 0;

    this.setOPGeometry();
    this.setConfig({
      depth: this.propertySet.doorThickness * 1.1,
      height: this.propertySet.doorHeight * 1.1,
      width: value * 1.1,
      center: new Vector3(0, this.propertySet.doorHeight / 2, 0),
      color: this.propertySet.doorColor,
    });
  }

  set doorThickness(value: number) {
    this.propertySet.doorThickness = value;

    this.setOPGeometry();
    this.setConfig({
      depth: value * 1.1,
      height: this.propertySet.doorHeight * 1.1,
      width: this.propertySet.dimensions.length * 1.1,
      center: new Vector3(0, this.propertySet.doorHeight / 2, 0),
      color: this.propertySet.doorColor,
    });
  }

  constructor(baseDoorConfig?: OPDoor) {
    // Call the parent class (Opening) constructor
    super();
    this.skeleton = new Line();
    this.add(this.skeleton);
    
    this.subNodes = new Map<string, THREE.Object3D>();
    // this.selected = false;
    // this.edit = false;
    
    if (baseDoorConfig) {
      this.propertySet = { ...baseDoorConfig, ...this.options };
    } else {
      // this.propertySet = this.options;
    }

    this.setOPGeometry();
  }

  private createDoor() {
    const smallGapOffset = 0.01;
    const door = new Cuboid({
      center: new Vector3(0, this.propertySet.doorHeight / 2, 0),
      width: this.propertySet.dimensions.length - 0.1 - smallGapOffset,
      height: this.propertySet.doorHeight - 0.1 - smallGapOffset,
      depth: this.propertySet.doorThickness,
      color: this.propertySet.doorColor,
    });
    this.add(door);
  }

  // TODO: We will later replace this with SweepedSolid along a path with a Sketch Profile
  private createFrame() {
    // Left Side Frame using Cuboid
    const leftFrame = new Cuboid({
      center: new Vector3(this.propertySet.dimensions.start.x, this.propertySet.doorHeight / 2, 0),
      width: 0.1,
      height: this.propertySet.doorHeight,
      depth: this.propertySet.frameThickness,
      color: this.propertySet.frameColor,
    });
    this.add(leftFrame);

    // Right Side Frame using Cuboid
    const rightFrame = new Cuboid({
      center: new Vector3(this.propertySet.dimensions.end.x, this.propertySet.doorHeight / 2, 0),
      width: 0.1,
      height: this.propertySet.doorHeight,
      depth: this.propertySet.frameThickness,
      color: this.propertySet.frameColor,
    });
    this.add(rightFrame);

    // Top Frame using Cuboid
    const topFrame = new Cuboid({
      center: new Vector3(0, this.propertySet.doorHeight, 0),
      width: this.propertySet.dimensions.length + 0.1,
      height: 0.1,
      depth: this.propertySet.frameThickness,
      color: this.propertySet.frameColor,
    });
    this.add(topFrame);

    console.log(this.children.length  + ' children in the door after creating frame.');
  }

  setOPConfig(config: OPDoor): void {
    this.discardGeometry();
    this.propertySet = config;

    // Set Config in the parent Opening class
    // this.setConfig(config);
  }

  getOPConfig(): OPDoor {
    return this.propertySet;
  }

  setOPGeometry(): void {
    // Implement geometry update logic here if needed
    if (this.children.length > 1) {
      this.remove(...this.children.slice(1));
    }

    this.createFrame();
    this.createDoor();
  }

  setOPMaterial(): void {
    // Implement material update logic here
    // const line = this.subNodes.get('arcLine') as THREE.Line;
    // if (line) {
    //   (line.material as THREE.LineBasicMaterial).color.set(0x0000ff);
    // }
  }

  // TODO: Add pure profile setter for elements/primitives where only Line rendering is needed
  showProfileView(status: boolean): void {
    this.children.forEach((child) => {
      // @ts-ignore
      child.material.opacity = status ? 0.0 : 1.0;
      // @ts-ignore
      child.outline = status;
    });
  }

//       this.createDoorAndHinge();

//       this.doorPosition = this.propertySet.doorPosition;
//       this.doorQuadrant = this.propertySet.doorQuadrant;
//     } else {
//       this.propertySet.id = this.ogid;
//       this.calculateCoordinatesByConfig();

//       this.brepRaw = this.getBrepData();
//       this.createDoorAndHinge();
//     }
//   }

//   calculateCoordinatesByConfig() {
//     this.propertySet.dimensions.start.x = -this.propertySet.dimensions.length / 2;
//     this.propertySet.dimensions.start.y = 0;
//     this.propertySet.dimensions.start.z = 0;

//     this.propertySet.dimensions.end.x = this.propertySet.dimensions.length / 2;
//     this.propertySet.dimensions.end.y = 0;
//     this.propertySet.dimensions.end.z = 0;

//     // Clear previous coordinates
//     this.propertySet.coordinates = [];
//     this.propertySet.coordinates.push(
//       [this.propertySet.dimensions.start.x, this.propertySet.dimensions.start.y, this.propertySet.dimensions.start.z],
//       [this.propertySet.dimensions.end.x, this.propertySet.dimensions.end.y, this.propertySet.dimensions.end.z],
//     );

//     this.setOPGeometry();
//     this.setOPMaterial();
//   }

//   private createHingeDoorArc() {
//     const hingeArc = this.subChild.get('hingeArc');
//     if (hingeArc && hingeArc instanceof THREE.Line) {
//       hingeArc.geometry.dispose();
//       hingeArc.material.dispose();
//       hingeArc.removeFromParent();
//       this.subChild.delete('hingeArc');
//     }

//     const { start, end } = this.propertySet.dimensions;
//     const thickness = this.propertySet.doorThickness / 2;

//     const arc = new THREE.EllipseCurve(
//       0, 0, 
//       start.x - end.x, start.x - end.x - thickness,
//       Math.PI, Math.PI / this.propertySet.doorRotation,
//       true
//     );
//     const arcMat = new THREE.LineBasicMaterial({ color: 0x000000 });
//     const arcGeo = new THREE.BufferGeometry().setFromPoints(arc.getPoints(32));
//     const arcMesh = new THREE.Line(arcGeo, arcMat);
//     arcMesh.position.set(0, 0, -thickness);
//     arcMesh.rotateX(Math.PI / 2);
//     this.subChild.set('hingeArc', arcMesh);
    
//     const hingeLeft = this.subChild.get('hingeLeftPolygon');
//     hingeLeft?.add(arcMesh);
//   }

//   private createClipMesh() {
//     if (this.subChild.has('hingeClipMesh')) {
//       const existingHingeClip = this.subChild.get('hingeClipMesh');
//       if (existingHingeClip instanceof THREE.Mesh) {
//         existingHingeClip.geometry.dispose();
//         existingHingeClip.material.dispose();
//         existingHingeClip.removeFromParent();
//         this.subChild.delete('hingeClipMesh');
//       }
//     }
//     const hingeClip = new THREE.SphereGeometry(0.01, 32, 32);
//     const hingeClipMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
//     const hingeClipMesh = new THREE.Mesh(hingeClip, hingeClipMat);
//     hingeClipMesh.position.set(0, 0, -this.propertySet.doorThickness);
//     this.subChild.set('hingeClipMesh', hingeClipMesh);
//     return hingeClipMesh;
//   }

//   private createDoorAndHinge() {
//     const { start, end } = this.propertySet.dimensions;
//     const { hingeLeft, hingeRight } = this.createHingePolygon();
//     hingeLeft.position.set(start.x, start.y, start.z);
//     hingeRight.position.set(end.x, end.y, end.z);

//     const hingeClipMesh = this.createClipMesh();
//     hingeLeft.add(hingeClipMesh);

//     const doorPolygon = this.createDoorPolygon();

//     const length = this.propertySet.dimensions.length;
//     const thickness = this.propertySet.doorThickness / 2;

//     doorPolygon.position.set(length / 2, 0, thickness);

//     // flip
//     // doorPolygon.rotation.y = Math.PI;
    
//     if (this.subChild.has('doorGroup')) {
//       const existingDoorGroup = this.subChild.get('doorGroup');
//       if (existingDoorGroup instanceof THREE.Group) {
//         existingDoorGroup.removeFromParent();
//         this.subChild.delete('doorGroup');
//       }
//     }

//     const doorGroup = new THREE.Group();
//     hingeClipMesh.add(doorGroup);
//     doorGroup.add(doorPolygon);
//     doorGroup.rotation.y = Math.PI + (Math.PI / -this.propertySet.doorRotation);
//     this.subChild.set('doorGroup', doorGroup);
//     this.createHingeDoorArc();
//   }

//   private createHingePolygon() {
//     if (this.subChild.has('hingeLeftPolygon')) {
//       const existingHingeLeft = this.subChild.get('hingeLeftPolygon');
//       if (existingHingeLeft instanceof PolygonBuilder) {
//         existingHingeLeft.removeFromParent();
//         existingHingeLeft.dispose();
//         this.subChild.delete('hingeLeftPolygon');
//       }
//     }
//     if (this.subChild.has('hingeRightPolygon')) {
//       const existingHingeRight = this.subChild.get('hingeRightPolygon');
//       if (existingHingeRight instanceof PolygonBuilder) {
//         existingHingeRight.removeFromParent();
//         existingHingeRight.dispose();
//         this.subChild.delete('hingeRightPolygon');
//       }
//     }

//     const doorThickness = this.propertySet.doorThickness;
//     const halfDoorThickness = doorThickness / 2;
//     const points: Array<[number, number, number]> = [];
//     points.push(
//       [-halfDoorThickness, 0, -doorThickness],
//       [-halfDoorThickness, 0, doorThickness],
//       [halfDoorThickness, 0, doorThickness],
//       [halfDoorThickness, 0, 0],
//       [0, 0, 0],
//       [0, 0, -doorThickness]
//     )
//     const hingePolygon = new PolygonBuilder();
//     hingePolygon.insertMultiplePoints(points);
//     hingePolygon.material = new THREE.MeshBasicMaterial({
//       color: this.propertySet.hingeColor,
//       side: THREE.DoubleSide,
//       depthWrite: true
//     });
//     this.subChild.set('hingeLeftPolygon', hingePolygon);
//     this.add(hingePolygon);

//     const hingeRight = hingePolygon.clone().rotateZ(Math.PI);
//     this.subChild.set('hingeRightPolygon', hingeRight);
//     this.add(hingeRight);

//     return {
//       hingeLeft: hingePolygon,
//       hingeRight: hingeRight,
//     };
//   }

//   private createDoorPolygon() {
//     if (this.subChild.has('doorPolygon')) {
//       const existingDoorPolygon = this.subChild.get('doorPolygon');
//       if (existingDoorPolygon instanceof PolygonBuilder) {
//         existingDoorPolygon.dispose();
//       }
//     }
    
//     const length = this.propertySet.dimensions.length;
//     const thickness = this.propertySet.doorThickness / 2;
//     const points: Array<[number, number, number]> = [];
//     // points.push(
//     //   [start.x + thickness, start.y, start.z - thickness],
//     //   [start.x + thickness, start.y, start.z + thickness],
//     //   [end.x - thickness, end.y, end.z + thickness],
//     //   [end.x - thickness, end.y, end.z - thickness]
//     // );
//     points.push(
//       [length / 2, 0, -thickness],
//       [length / 2, 0, thickness],
//       [-length / 2, 0, thickness],
//       [-length / 2, 0, -thickness]
//     );

//     const doorPolygon = new PolygonBuilder();
//     doorPolygon.insertMultiplePoints(points);
//     doorPolygon.material = new THREE.MeshBasicMaterial({
//       color: 0xffffff,
//       side: THREE.DoubleSide,
//       depthWrite: true,
//     });
//     this.subChild.set('doorPolygon', doorPolygon);
    
//     return doorPolygon;
//   }

//   setOPConfig(config: OPDoor): void {
//     this.propertySet = config;
//   }

//   getOPConfig(): OPDoor {
//     return this.propertySet;
//   }

//   setOPGeometry(): void {
//     const { coordinates } = this.propertySet;
//     const points = coordinates.map(coord => new Vector3(coord[0], coord[1], coord[2]));
//     this.addMultiplePoints(points);
//   }

//   setOPMaterial() {
//     this.material = new THREE.LineBasicMaterial({ color: 0x000000, depthWrite: false });
//     this.renderOrder = 1;
//   }

//   set wallMaterial(material: DoorMaterial) {
//     this.propertySet.doorMaterial = material;
//   }

//   // Editor APIs
//   addAnchorEdgesOnSelection() {
//     const brep_raw = this.getBrepData();

//     if (!brep_raw) return;
//     this.brepRaw = brep_raw;
//     const brep = JSON.parse(brep_raw);

//     const edges_index = brep.edges;
//     const brep_points = brep.vertices;

//     if (edges_index.length === 0) {
//       console.warn('No edges found in the brep data.');
//       return;
//     }

//     const startPoint = brep_points[edges_index[0][0]];
//     const endPoint = brep_points[edges_index[0][1]];

//     const anchorEdgeId = `edgeAnchor${generateUUID()}`;
//     this.editorEdges.set(anchorEdgeId, 0);

//     const anchorEdgeDiv = document.createElement('div');
//     anchorEdgeDiv.id = anchorEdgeId;
//     anchorEdgeDiv.className = 'anchor-edge';
//     anchorEdgeDiv.style.position = 'absolute';

//     anchorEdgeDiv.addEventListener('mousedown', (event) => this.onMouseDown(event));
//     anchorEdgeDiv.addEventListener('mouseup', (event) => this.onMouseUp(event));
//     anchorEdgeDiv.addEventListener('mousemove', (event) => this.onMouseMove(event));
//     anchorEdgeDiv.addEventListener('mouseover', (event) => this.onMouseHover(event));
  
//     const screenPointX = OpenPlans.toScreenPosition(new THREE.Vector3(startPoint.x, startPoint.y, startPoint.z));
//     const screenPointY = OpenPlans.toScreenPosition(new THREE.Vector3(endPoint.x, endPoint.y, endPoint.z));

//     const dx = screenPointY.x - screenPointX.x;
//     const dy = screenPointY.y - screenPointX.y;
//     const length = Math.sqrt(dx * dx + dy * dy);
//     const angle = Math.atan2(dy, dx) * 180 / Math.PI;

//     anchorEdgeDiv.style.width = `${length}px`;
//     anchorEdgeDiv.style.left = `${screenPointX.x}px`;
//     anchorEdgeDiv.style.top = `${screenPointX.y}px`;
//     anchorEdgeDiv.style.transform = `rotate(${angle}deg)`;
//     anchorEdgeDiv.style.transformOrigin = '0 0';

//     const edgeStyle = document.createElement('style');
//     edgeStyle.textContent = `
//       .anchor-edge {
//         border-top: 1px solid rgb(0, 81, 255);
//       }
//       .anchor-edge:hover {
//         border-top: 1px solid rgba(0, 213, 64, 0.84);
//         cursor: col-resize;
//       }
//     `;
//     document.head.appendChild(edgeStyle);

//     document.body.appendChild(anchorEdgeDiv);
//     this.subEdges.set(anchorEdgeId, anchorEdgeDiv);
//   }

//   onMouseHover(event: MouseEvent) {
//     const anchorId = (event.target as HTMLElement).id;
//     if (!anchorId.startsWith('pointAnchor')) return;
//   }

//   onMouseDown(event: MouseEvent) {
//     const anchorId = (event.target as HTMLElement).id;
//     if (anchorId.startsWith('pointAnchor')) {
//       this.activeNode = anchorId;
//     }
//     else if (anchorId.startsWith('edgeAnchor')) {
//       this.activeEdge = anchorId;
//       this.pencil.fireCursor(event);
//     }
//     else {
//       this.activeNode = null;
//       this.activeEdge = null;
//     }
//   }

//   onMouseUp(event: MouseEvent) {
//     if (!this.activeNode && !this.activeEdge) return;
//     this.activeNode = null;
//     this.activeEdge = null;

//     this.brepRaw = this.getBrepData();
//     // this.createWallAroundLine(true);
//   }

//   onMouseMove(event: MouseEvent) {
//     if (!this.activeNode && !this.activeEdge) return;
//   }

//   handlePencilCursorMove(coords: THREE.Vector3) {
//     if (this.activeEdge) {
//       this.doorPosition = [coords.x, coords.y, coords.z];
//       this.calulateAnchorEdges();
//     }
//   }

//   calulateAnchorEdges(force: boolean = false) {
//     // Do not update the active edge but the ones that are connected to it
//     if (force) {
//       for (const [edgeId, index] of this.editorEdges.entries()) {
//         const edgeDiv = this.subEdges.get(edgeId);
//         if (edgeDiv) {
//           const brep_raw = this.brepRaw;
//           if (!brep_raw) return;
//           const brep = JSON.parse(brep_raw);
//           const edges_index = brep.edges;
//           const edge = edges_index[index];

//           const start = brep.vertices[edge[0]];
//           const end = brep.vertices[edge[1]];

//           const startPoint = new THREE.Vector3(start.x, start.y, start.z);
//           const endPoint = new THREE.Vector3(end.x, end.y, end.z);

//           const screenPointX = OpenPlans.toScreenPosition(new THREE.Vector3(startPoint.x, startPoint.y, startPoint.z));
//           const screenPointY = OpenPlans.toScreenPosition(new THREE.Vector3(endPoint.x, endPoint.y, endPoint.z));

//           const dx = screenPointY.x - screenPointX.x;
//           const dy = screenPointY.y - screenPointX.y;
//           const length = Math.sqrt(dx * dx + dy * dy);
//           const angle = Math.atan2(dy, dx) * 180 / Math.PI;

//           edgeDiv.style.width = `${length}px`;
//           edgeDiv.style.left = `${screenPointX.x}px`;
//           edgeDiv.style.top = `${screenPointX.y}px`;
//           edgeDiv.style.transform = `rotate(${angle}deg)`;
//         }
//       }
//     }
//   }

//   clearAnchorEdges() {
//     for (const [edgeId, edgeDiv] of this.subEdges.entries()) {
//       edgeDiv.removeEventListener('mousedown', (event) => this.onMouseDown(event));
//       edgeDiv.removeEventListener('mouseup', (event) => this.onMouseUp(event));
//       edgeDiv.removeEventListener('mousemove', (event) => this.onMouseMove(event));
//       edgeDiv.removeEventListener('mouseover', (event) => this.onMouseHover(event));
      
//       edgeDiv.remove();
//       this.editorEdges.delete(edgeId);
//     }
//     this.subEdges.clear();
//     this.activeEdge = null;
//   }


//   dispose() {
//     this.clearAnchorEdges();

//     this.geometry.dispose();
//     this.clear();
//     this.subChild.forEach((child) => {
//       if (child instanceof PolygonBuilder) {
//         child.dispose();
//       }

//       if (child instanceof THREE.Mesh) {
//         child.geometry.dispose();
//         child.material.dispose();
//       }
//       this.remove(child);
//     });
//     this.subChild.clear();
//     this.removeFromParent();

//     super.dispose();
//   }
}
