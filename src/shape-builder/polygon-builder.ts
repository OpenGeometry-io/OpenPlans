import * as THREE from 'three';
import { Vector3D } from '../../kernel/dist';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { generateUUID } from 'three/src/math/MathUtils.js';
import { Pencil } from '../../kernel/dist/src/pencil';
import { OpenPlans } from '..';
import { OPPolygonMesh } from '../elements/element-mesh';
import { getKeyByValue } from '../utils/map-helper';

export interface IPolygonBuilder {
  id?: string;
  center: {
    x: number;
    y: number;
    z: number;
  };
  color: number;
  type: 'polygon';
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

export class PolygonBuilder extends OPPolygonMesh {
  ogType = 'polygon';

  // Editing Properties
  subNodes: Map<string, THREE.Object3D> = new Map();
  subEdges: Map<string, HTMLDivElement> = new Map();

  editorNodes: Map<string, number> = new Map();
  editorEdges: Map<string, number> = new Map();
  activeNode: string | null = null;
  activeEdge: string | null = null;

  // remodel
  initialCursorPos: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  brepRaw: string | null = null;

  // Properties that can be set externally start with an #, provides tight encapsulation and prevents accidental access
  _selected = false;
  _pencil: Pencil | null = null;

  propertySet: IPolygonBuilder = {
    center: {
      x: 0,
      y: 0,
      z: 0,
    },
    color: 0xcccccc,
    type: 'polygon',
    /*
      Anti-clockwise coordinates of the board, starting from top left corner.
      Ends in top right corner.
      The coordinates are in the XY plane, so Z is always 0.
    */
    coordinates: [],
    labelName: 'Polygon',
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
      // this.material = new THREE.LineBasicMaterial({ color: this.propertySet.color });

      this.addAnchorPointsOnSelection();
      this.addAnchorEdgesOnSelection();
    }
    // else {
    //   this.material = new THREE.LineBasicMaterial({ color: this.propertySet.color });
    //   this.clearAnchorPoints();
    //   this.clearAnchorEdges();
    // }
    this._selected = value;
  }

  get selected() {
    return this._selected;
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

  constructor(polygonConfig?: IPolygonBuilder) {
    super();

    if (polygonConfig) {
      this.setOPConfig(polygonConfig);
    } else {
      this.propertySet.id = this.ogid;
    }

    this.calculateCoordinatesByConfig();

    // If we create XZ plane, the polygon has normals facing downwards, so trick as of now is to create XY plane 
    // and then rotate it to face upwards
    // this.rotateX(-Math.PI / 2);
    
    // Not Needed for Polygon
    // this.createLabelDivMesh();
  }

  insertMultiplePoints(points: Array<[number, number, number]>) {
    for (const point of points) {
      this.propertySet.coordinates.push([point[0], point[1], point[2]]);
    }
    this.calculateCoordinatesByConfig();
  }

  insertPoint(x: number, y: number, z: number ) {
    this.propertySet.coordinates.push([x, y, z]);
    this.calculateCoordinatesByConfig();
  }

  private calculateCoordinatesByConfig() {

    const coordinates = this.propertySet.coordinates;

    if (coordinates.length < 3) return;

    this.setOPGeometry();
  }

  setOPConfig(propertySet: IPolygonBuilder) {
    this.propertySet = propertySet;
  }

  getOPConfig(): IPolygonBuilder {
    return this.propertySet;
  }

  setOPGeometry() {
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
    this.getBrepData();
    this.setOPMaterial();
    this.outline = true;
  }

  setOPMaterial() {
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    });
    this.material = material;
  }

  // Editor
  addAnchorPointsOnSelection() {
    for (const coord of this.propertySet.coordinates) {
      const anchorId = `pointAnchor${generateUUID()}`;
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

  addAnchorEdgesOnSelection() {
    const brep_raw = this.getBrepData();
    if (!brep_raw) return;
    this.brepRaw = brep_raw;
    const brep = JSON.parse(brep_raw);

    const edges_index = brep.edges;
    const brep_points = brep.vertices;

    for (let i = 0; i < edges_index.length; i++) {
      const edge = edges_index[i];
      const startPoint = brep_points[edge[0]];
      const endPoint = brep_points[edge[1]];

      const anchorEdgeId = `edgeAnchor${generateUUID()}`;
      this.editorEdges.set(anchorEdgeId, i);

      const anchorEdgeDiv = document.createElement('div');
      anchorEdgeDiv.id = anchorEdgeId;
      anchorEdgeDiv.className = 'anchor-edge';
      anchorEdgeDiv.style.position = 'absolute';

      anchorEdgeDiv.addEventListener('mousedown', (event) => this.onMouseDown(event));
      anchorEdgeDiv.addEventListener('mouseup', (event) => this.onMouseUp(event));
      anchorEdgeDiv.addEventListener('mousemove', (event) => this.onMouseMove(event));
      anchorEdgeDiv.addEventListener('mouseover', (event) => this.onMouseHover(event));
      
      const screenPointX = OpenPlans.toScreenPosition(new THREE.Vector3(startPoint.x, startPoint.y, startPoint.z));
      const screenPointY = OpenPlans.toScreenPosition(new THREE.Vector3(endPoint.x, endPoint.y, endPoint.z));

      const dx = screenPointY.x - screenPointX.x;
      const dy = screenPointY.y - screenPointX.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;

      anchorEdgeDiv.style.width = `${length}px`;
      anchorEdgeDiv.style.left = `${screenPointX.x}px`;
      anchorEdgeDiv.style.top = `${screenPointX.y}px`;
      anchorEdgeDiv.style.transform = `rotate(${angle}deg)`;
      anchorEdgeDiv.style.transformOrigin = '0 0';

      const edgeStyle = document.createElement('style');
      edgeStyle.textContent = `
        .anchor-edge {
          border-top: 1px solid rgb(0, 81, 255);
        }
        .anchor-edge:hover {
          border-top: 1px solid rgba(0, 213, 64, 0.84);
          cursor: col-resize;
        }
      `;
      document.head.appendChild(edgeStyle);

      document.body.appendChild(anchorEdgeDiv);
      this.subEdges.set(anchorEdgeId, anchorEdgeDiv);
    }
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

  calculateAnchor(force: boolean = false) {
    if (this.activeNode) {
      const index = this.editorNodes.get(this.activeNode);
      if (index !== undefined) {
        const anchorMesh = this.subNodes.get(this.activeNode);
        if (anchorMesh) {
          const coords = this.propertySet.coordinates[index];
          if (coords) {
            anchorMesh.position.set(coords[0], 0, coords[2]);
          }
        }
      }
    }

    if (force) {
      for (const [nodeId, index] of this.editorNodes.entries()) {
        const anchorMesh = this.subNodes.get(nodeId);
        if (anchorMesh) {
          const coords = this.propertySet.coordinates[index];
          if (coords) {
            anchorMesh.position.set(coords[0], 0, coords[2]);
          }
        }
      }
    }
  }

  calulateAnchorEdges(force: boolean = false) {
    // Do not update the active edge but the ones that are connected to it
    if (this.activeEdge) {
      const index = this.editorEdges.get(this.activeEdge);
      if (index === undefined) return;
      const brep_raw = this.brepRaw;
      if (!brep_raw) return;
      const brep = JSON.parse(brep_raw);
      const edges_index = brep.edges;
      const edgeStart = index-1;
      const edgeEnd = index+1;

      // If edge start is 0, it means we are at the first edge
      if (edgeStart > -1) {
        const startCoord = this.propertySet.coordinates[edges_index[edgeStart][0]];
        const endCoord = this.propertySet.coordinates[edges_index[edgeStart][1]];
        
        const startPoint = new THREE.Vector3(startCoord[0], startCoord[1], startCoord[2]);
        const endPoint = new THREE.Vector3(endCoord[0], endCoord[1], endCoord[2]);
        const screenPointX = OpenPlans.toScreenPosition(new THREE.Vector3(startPoint.x, startPoint.y, startPoint.z));
        const screenPointY = OpenPlans.toScreenPosition(new THREE.Vector3(endPoint.x, endPoint.y, endPoint.z));
        const dx = screenPointY.x - screenPointX.x;
        const dy = screenPointY.y - screenPointX.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        const edgeAnchorId = getKeyByValue(this.editorEdges, edgeStart);
        if (!edgeAnchorId) return;
        const edgeDiv = this.subEdges.get(edgeAnchorId);
        if (!edgeDiv) return;

        edgeDiv.style.width = `${length}px`;
        edgeDiv.style.left = `${screenPointX.x}px`;
        edgeDiv.style.top = `${screenPointX.y}px`;
        edgeDiv.style.transform = `rotate(${angle}deg)`;
        edgeDiv.style.transformOrigin = '0 0';
      }

      if (edgeEnd < edges_index.length) {
        const startCoord = this.propertySet.coordinates[edges_index[edgeEnd][0]];
        const endCoord = this.propertySet.coordinates[edges_index[edgeEnd][1]];
        
        const startPoint = new THREE.Vector3(startCoord[0], startCoord[1], startCoord[2]);
        const endPoint = new THREE.Vector3(endCoord[0], endCoord[1], endCoord[2]);
        const screenPointX = OpenPlans.toScreenPosition(new THREE.Vector3(startPoint.x, startPoint.y, startPoint.z));
        const screenPointY = OpenPlans.toScreenPosition(new THREE.Vector3(endPoint.x, endPoint.y, endPoint.z));
        const dx = screenPointY.x - screenPointX.x;
        const dy = screenPointY.y - screenPointX.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        const edgeAnchorId = getKeyByValue(this.editorEdges, edgeEnd);
        if (!edgeAnchorId) return;
        const edgeDiv = this.subEdges.get(edgeAnchorId);
        if (!edgeDiv) return;

        edgeDiv.style.width = `${length}px`;
        edgeDiv.style.left = `${screenPointX.x}px`;
        edgeDiv.style.top = `${screenPointX.y}px`;
        edgeDiv.style.transform = `rotate(${angle}deg)`;
        edgeDiv.style.transformOrigin = '0 0';
      }
    }

    if (force) {
      for (const [edgeId, index] of this.editorEdges.entries()) {
        const edgeDiv = this.subEdges.get(edgeId);
        if (edgeDiv) {
          const brep_raw = this.brepRaw;
          if (!brep_raw) return;
          const brep = JSON.parse(brep_raw);
          const edges_index = brep.edges;
          const edge = edges_index[index];

          const start = this.propertySet.coordinates[edge[0]];
          const end = this.propertySet.coordinates[edge[1]];

          const startP = new Vector3D(start[0], start[1], start[2]);
          const endP = new Vector3D(end[0], end[1], end[2]);
          const startPoint = new THREE.Vector3(startP.x, startP.y, startP.z);
          const endPoint = new THREE.Vector3(endP.x, endP.y, endP.z);

          const screenPointX = OpenPlans.toScreenPosition(new THREE.Vector3(startPoint.x, startPoint.y, startPoint.z));
          const screenPointY = OpenPlans.toScreenPosition(new THREE.Vector3(endPoint.x, endPoint.y, endPoint.z));

          const dx = screenPointY.x - screenPointX.x;
          const dy = screenPointY.y - screenPointX.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * 180 / Math.PI;

          edgeDiv.style.width = `${length}px`;
          edgeDiv.style.left = `${screenPointX.x}px`;
          edgeDiv.style.top = `${screenPointX.y}px`;
          edgeDiv.style.transform = `rotate(${angle}deg)`;
        }
      }
    }
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
    this.activeNode = null;
  }

  // Editor Mouse Events
  onMouseHover(event: MouseEvent) {
    const anchorId = (event.target as HTMLElement).id;
    if (!anchorId.startsWith('pointAnchor')) return;
  }

  onMouseDown(event: MouseEvent) {
    const anchorId = (event.target as HTMLElement).id;
    if (anchorId.startsWith('pointAnchor')) {
      this.activeNode = anchorId;
    }
    else if (anchorId.startsWith('edgeAnchor')) {
      this.activeEdge = anchorId;
      this.pencil.fireCursor(event);
    }
    else {
      this.activeNode = null;
      this.activeEdge = null;
    }
  }

  onMouseUp(event: MouseEvent) {
    if (!this.activeNode && !this.activeEdge) return;
    this.activeNode = null;
    this.activeEdge = null;

    this.brepRaw = this.getBrepData();
  }

  onMouseMove(event: MouseEvent) {
    if (!this.activeNode) return;
  }

  handlePencilCursorMove(coords: THREE.Vector3) {
    if (this.activeNode) {
      const index = this.editorNodes.get(this.activeNode);
      if (index !== undefined) {
        this.propertySet.coordinates[index] = [coords.x, 0, coords.z];
        this.calculateCoordinatesByConfig();

        this.calculateAnchor();
        this.calulateAnchorEdges(true);
      }
    }

    if (this.activeEdge) {
      const index = this.editorEdges.get(this.activeEdge);
      if (index !== undefined) {
        const edgeDiv = this.subEdges.get(this.activeEdge);
        if (edgeDiv) {
          const brep_raw = this.brepRaw;
          if (!brep_raw) return;
          const brep = JSON.parse(brep_raw);
          const edges_index = brep.edges;
          const brep_points = brep.vertices;
          const edge = edges_index[index];
          const startP = brep_points[edge[0]];
          const endP = brep_points[edge[1]];

          const startPoint = new THREE.Vector3(startP.x, startP.y, startP.z);
          const endPoint = new THREE.Vector3(endP.x, endP.y, endP.z);

          const dragDelta = new THREE.Vector3().subVectors(coords, this.initialCursorPos);
          const newStartPoint = new THREE.Vector3().addVectors(startPoint, dragDelta);
          const newEndPoint   = new THREE.Vector3().addVectors(endPoint, dragDelta);

          if (startPoint && endPoint) {
            const screenPointX = OpenPlans.toScreenPosition(new THREE.Vector3(newStartPoint.x, newStartPoint.y, newStartPoint.z));
            const screenPointY = OpenPlans.toScreenPosition(new THREE.Vector3(newEndPoint.x, newEndPoint.y, newEndPoint.z));

            const dx = screenPointY.x - screenPointX.x;
            const dy = screenPointY.y - screenPointX.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;

            edgeDiv.style.width = `${length}px`;
            edgeDiv.style.left = `${screenPointX.x}px`;
            edgeDiv.style.top = `${screenPointX.y}px`;
            edgeDiv.style.transform = `rotate(${angle}deg)`;
          }

          this.propertySet.coordinates[edge[0]] = [newStartPoint.x, newStartPoint.y, newStartPoint.z];
          this.propertySet.coordinates[edge[1]] = [newEndPoint.x, newEndPoint.y, newEndPoint.z];
          this.calculateCoordinatesByConfig();

          this.calulateAnchorEdges();
          this.calculateAnchor(true);
        }
      }
    }
  }
}