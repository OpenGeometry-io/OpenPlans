// import {
//   Vector3
// } from '../kernel/dist';
// import * as THREE from 'three';
// import { Pencil } from '../kernel/dist/src/pencil';
// import { PolyLineShape } from '../primitives/polyline';
// import { PolygonBuilder } from '../shape-builder/polygon-builder';
// import { generateUUID } from 'three/src/math/MathUtils.js';
// import { OpenPlans } from '..';

// export interface OPWindow {
//   id?: string;
//   labelName: string;
//   type: 'simpleWindow';
//   dimensions: {
//     start: {
//       x: number;
//       y: number;
//       z: number;
//     };
//     end: {
//       x: number;
//       y: number;
//       z: number;
//     };
//     length: number;
//   };
//   windowPosition: [number, number, number];
//   windowHeight: number;
//   windowThickness: number;
//   hingeThickness: number;
//   windowColor: number;
//   hingeColor: number;
//   coordinates: Array<[number, number, number]>;
// }

// export class BaseWindow extends PolyLineShape {
//   ogType: string = 'baseWindow';

//   subChild: Map<string, THREE.Object3D> = new Map();

//   subNodes: Map<string, THREE.Object3D> = new Map();
//   subEdges: Map<string, HTMLDivElement> = new Map();

//   editorNodes: Map<string, number> = new Map();
//   editorEdges: Map<string, number> = new Map();
//   activeNode: string | null = null;
//   activeEdge: string | null = null;

//   initialCursorPos: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
//   brepRaw: string | null = null;
  
//   _selected: boolean = false;
//   _pencil: Pencil | null = null;

//   propertySet: OPWindow = {
//     type: 'simpleWindow',
//     labelName: 'Simple Single Window',
//     dimensions: {
//       start: { x: 0, y: 0, z: 0 },
//       end: { x: 0, y: 0, z: 0 },
//       length: 2,
//     },
//     windowPosition: [0, 0, 0],
//     windowHeight: 0,
//     windowThickness: 0.4,
//     hingeThickness: 0.1,
//     windowColor: 0xFFFFFF,
//     hingeColor: 0x000000,
//     // Coordinates is a calulated property, not set by user
//     coordinates: [],
//   };

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

//   set labelName(value: string) {
//     this.propertySet.labelName = value;
//   }

//   get labelName() {
//     return this.propertySet.labelName;
//   }

//   set windowThickness(value: number) {
//     this.propertySet.windowThickness = value;

//     this.calculateCoordinatesByConfig();
//     this.brepRaw = this.getBrepData();
//     this.createDoorAndHinge();
//   }

//   set hingeThickness(value: number) {
//     this.propertySet.hingeThickness = value;
    
//     this.calculateCoordinatesByConfig();
//     this.brepRaw = this.getBrepData();
//     this.createDoorAndHinge();
//   }

//   set windowColor(value: number) {
//     this.propertySet.windowColor = value;
//     const windowPolygon = this.subChild.get('windowPolygon');
//     if (windowPolygon && windowPolygon instanceof PolygonBuilder) {
//       const material = new THREE.MeshBasicMaterial({
//         color: value,
//         side: THREE.DoubleSide,
//         depthWrite: false,
//       });
//       windowPolygon.material = material;
//     }
//   }

//   set hingeColor(value: number) {
//     this.propertySet.hingeColor = value;
//   }

//   set windowPosition(point: [number, number, number]) {
//     this.propertySet.windowPosition = point;
//     this.position.set(point[0], point[1], point[2]);

//     this.set_position(new Vector3(point[0], point[1], point[2]));

//     this.brepRaw = this.getBrepData();
//   }

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
//       throw new Error('Pencil is not set for BaseSingleWindow');
//     }
//     return this._pencil;
//   }

//   set windowLength(value: number) {
//     this.propertySet.dimensions.length = value;

//     this.calculateCoordinatesByConfig();
//     this.brepRaw = this.getBrepData();
//     this.createDoorAndHinge();
//   }

//   constructor(baseWindowConfig?: OPWindow) {
//     super();
//     if (baseWindowConfig) {
//       this.setOPConfig(baseWindowConfig);
//       this.calculateCoordinatesByConfig();

//       this.brepRaw = this.getBrepData();
//       this.createDoorAndHinge();

//       this.windowPosition = this.propertySet.windowPosition;
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

//   private createDoorAndHinge() {
//     const { start, end } = this.propertySet.dimensions;
//     const { hingeLeft, hingeRight } = this.createHingePolygon();

//     const hingeThickness = this.propertySet.hingeThickness / 2;
//     hingeLeft.position.set(start.x - hingeThickness, start.y, start.z);
//     hingeRight.position.set(end.x + hingeThickness, end.y, end.z);

//     const windowPolygon = this.createwindowPolygon();
//     this.add(windowPolygon);
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

//     const hingeThickness = this.propertySet.hingeThickness / 2;
//     console.log('Hinge Thickness:', hingeThickness);
//     const windowThickness = this.propertySet.windowThickness / 2;

//     const points: Array<[number, number, number]> = [];
//     points.push(
//       [-hingeThickness, 0, -windowThickness],
//       [-hingeThickness, 0, windowThickness],
//       [hingeThickness, 0, windowThickness],
//       [hingeThickness, 0, -windowThickness]
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

//   private createwindowPolygon() {
//     if (this.subChild.has('windowPolygon')) {
//       const existingwindowPolygon = this.subChild.get('windowPolygon');
//       if (existingwindowPolygon instanceof PolygonBuilder) {
//         existingwindowPolygon.removeFromParent();
//         existingwindowPolygon.dispose();
//       }
//     }
    
//     const length = this.propertySet.dimensions.length;
//     const thickness = this.propertySet.windowThickness / 2;
//     const points: Array<[number, number, number]> = [];

//     points.push(
//       [length / 2, 0, -thickness],
//       [length / 2, 0, thickness],
//       [-length / 2, 0, thickness],
//       [-length / 2, 0, -thickness]
//     );

//     const windowPolygon = new PolygonBuilder();
//     windowPolygon.insertMultiplePoints(points);
//     windowPolygon.material = new THREE.MeshBasicMaterial({
//       color: this.propertySet.windowColor,
//       side: THREE.DoubleSide,
//       depthWrite: true,
//     });
//     this.subChild.set('windowPolygon', windowPolygon);
    
//     return windowPolygon;
//   }

//   // TODO: Should we add a hard check on FE to ensure that the config is valid?
//   setOPConfig(config: OPWindow): void {
//     for (const key in config) {
//       if (Object.prototype.hasOwnProperty.call(config, key)) {
//         // @ts-ignore
//         this.propertySet[key] = config[key];
//       }
//     }
//   }

//   getOPConfig(): OPWindow {
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

//   // set wallMaterial(material: WindowMaterial) {
//   //   this.propertySet.windowMaterial = material;
//   // }

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
//       this.windowPosition = [coords.x, coords.y, coords.z];
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
// }
