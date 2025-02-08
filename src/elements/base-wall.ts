import {
  Vector3D,
  BasePoly,
} from '../../kernel/dist';
import * as THREE from 'three';
import { OPWall, OPWallMesh, OPWallType } from './base-types';
import { Pencil } from '../../kernel/dist/src/pencil';
// TODO: Create Much Better Outlines
// import * as OGLiner from './../helpers/OpenOutliner';

export class BaseWall extends BasePoly {
  public ogType = 'wall';
  public color: number;
  mesh: BasePoly | null = null;
  private wallSet: OPWall;
  private wallSetMesh: { [key: string]: THREE.Mesh | THREE.Line } = {};
  private mainSetMesh: OPWallMesh | null = null;

  isEditing = false;
  private activeId: string | undefined;

  /**
   * Set Wall Color
   * @param color: The Color of The Wall
   * @description The wall already has some opacity, so the color will be a bit transparent
   */
  set wallColor(color: THREE.Color) {
    this.material = new THREE.MeshStandardMaterial({ color: color, side: THREE.DoubleSide, opacity: 0.2, transparent: true });
  }

  /**
   * Set Wall Type
   * @param type: The Type of The Wall
   * @description The wall type will determine the texture of the wall
   */
  set wallType(type: OPWallType) {
    this.wallSet.type = type;
  }

  get wallAnchor() {
    return {
      start: this.localToWorld(new THREE.Vector3(this.wallSet.anchor.start.x, this.wallSet.anchor.start.y, this.wallSet.anchor.start.z)),
      end: this.localToWorld(new THREE.Vector3(this.wallSet.anchor.end.x, this.wallSet.anchor.end.y, this.wallSet.anchor.end.z)),
    }
  }

  // TODO: Since we need Pencil for every element, how to make it global/Singleton?
  constructor(color: number, private pencil: Pencil, initialWallSet?: OPWall) {
    super();
    this.color = color;

    if (initialWallSet) {
      this.wallSet = initialWallSet;
    } else {
      this.wallSet = {
        position: {
          x: 0,
          y: 0,
          z: 0,
        },
        anchor: {
          start: {
            x: -1,
            y: 0,
            z: 0,
          },
          end: {
            x: 1,
            y: 0,
            z: 0,
          }
        },
        thickness: 0.25,
        halfThickness: 0.125,
        id: 0,
        color: 0,
        type: 'concrete',
      }
    }

    this.setupSet(this.wallSet);
    this.setGeometry();
    this.setupEvents();
  }

  // TODO: This can be used for API Calls
  /**
   * If A User Has A Wall Set, We Will Use It
   */
  setupSet(wallSet: OPWall) {
    this.wallSet = wallSet;
  }

  private setGeometry() {
    if (!this.wallSet) return;
    const { startLeft, startRight, endLeft, endRight } = this.getOuterCoordinates(
      new THREE.Vector3(this.wallSet.anchor.start.x, this.wallSet.anchor.start.y, this.wallSet.anchor.start.z),
      new THREE.Vector3(this.wallSet.anchor.end.x, this.wallSet.anchor.end.y, this.wallSet.anchor.end.z),
      this.wallSet.halfThickness
    );

    const vertices = [
      new Vector3D(startLeft.x, startLeft.y, startLeft.z),
      new Vector3D(startRight.x, startRight.y, startRight.z),
      new Vector3D(endRight.x, endRight.y, endRight.z),
      new Vector3D(endLeft.x, endLeft.y, endLeft.z),
    ];
    this.addVertices(vertices);
    
    this.name = `wall`+this.ogid;
    
    const wallGroup = new THREE.Group();
    
    const wallBlockGeom = this.generateShadowGeometry(
      new THREE.Vector3(this.wallSet.anchor.start.x, this.wallSet.anchor.start.y, this.wallSet.anchor.start.z),
      new THREE.Vector3(this.wallSet.anchor.end.x, this.wallSet.anchor.end.y, this.wallSet.anchor.end.z),
      this.wallSet.halfThickness
    );
    const wallBlockMesh = new THREE.Mesh(wallBlockGeom);
    wallBlockMesh.name = `wallBlock`+this.ogid;
    const wallBlockEdgeGeom = new THREE.EdgesGeometry(wallBlockGeom);
    const wallBlockEdgeMesh = new THREE.LineSegments(wallBlockEdgeGeom, new THREE.LineBasicMaterial({ color: 0x000000 }));
    wallBlockEdgeMesh.name = `wallBlockEdge`+this.ogid;
    wallGroup.add(wallBlockEdgeMesh);
    this.wallSetMesh[wallBlockEdgeMesh.name] = wallBlockEdgeMesh;  

    const sphereGeometry = new THREE.SphereGeometry(0.035, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const sSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sSphere.name = `wallStart`+this.ogid;
    sSphere.position.set(
      this.wallSet.anchor.start.x,
      this.wallSet.anchor.start.y,
      this.wallSet.anchor.start.z
    )
    wallGroup.add(sSphere);
    this.wallSetMesh[sSphere.name] = sSphere;

    const eSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    eSphere.name = `wallEnd`+this.ogid;
    eSphere.position.set(
      this.wallSet.anchor.end.x,
      this.wallSet.anchor.end.y,
      this.wallSet.anchor.end.z
    )
    wallGroup.add(eSphere);
    this.wallSetMesh[eSphere.name] = eSphere;

    this.add(wallGroup);
    this.pencil.pencilMeshes.push(this);
  }

  private handleElementSelected(mesh: THREE.Mesh) {
    this.isEditing = true;
    console.log('selected', mesh.name);
    // Manipulate The Wall Start and End
    if (mesh.name === 'wallStart'+this.ogid || mesh.name === 'wallEnd'+this.ogid) {
      this.activeId = mesh.name;
      console.log('activeId', this.activeId);
      this.pencil.mode = "cursor";
    }
    
    // Manipulate The Entire Wall 
    if (mesh.name === 'wall'+this.ogid) {
      // TODO: 
    }
  }

  private handleCursorMove(cursorPosition: THREE.Vector3) {
    if (!this.isEditing) return;

    if (this.activeId) {
      console.log('activeId', this.activeId);
      const worldToLocal = this.worldToLocal(cursorPosition);
      this.wallSetMesh[this.activeId].position.set(worldToLocal.x, 0, worldToLocal.z);
    }

    const startSphere = `wallStart`+this.ogid;
    const endSphere = `wallEnd`+this.ogid;
    
    this.wallSet.anchor.start.x = this.wallSetMesh[startSphere].position.x;
    this.wallSet.anchor.start.y = this.wallSetMesh[startSphere].position.y;
    this.wallSet.anchor.start.z = this.wallSetMesh[startSphere].position.z;
    this.wallSet.anchor.end.x = this.wallSetMesh[endSphere].position.x;
    this.wallSet.anchor.end.y = this.wallSetMesh[endSphere].position.y;
    this.wallSet.anchor.end.z = this.wallSetMesh[endSphere].position.z;

    const wallBlockEdgeMesh = this.wallSetMesh[`wallBlockEdge`+this.ogid];
    wallBlockEdgeMesh.geometry.dispose();
    const wallBlockGeom = this.generateShadowGeometry(
      this.wallSetMesh[startSphere].position,
      this.wallSetMesh[endSphere].position,
      this.wallSet.halfThickness
    );
    const wallBlockEdgeGeom = new THREE.EdgesGeometry(wallBlockGeom);
    wallBlockEdgeMesh.geometry = wallBlockEdgeGeom;
  }

  setupEvents() {
    this.pencil.onElementSelected.add((mesh) => {
      if (mesh.name === 'wall'+this.ogid || mesh.name === 'wallStart'+this.ogid || mesh.name === 'wallEnd'+this.ogid) {
        this.handleElementSelected(mesh);
      }
    });

    this.pencil.onElementHover.add((mesh) => {
      if (mesh.name === 'wall'+this.ogid || mesh.name === 'start'+this.ogid || mesh.name === 'end'+this.ogid) {
        // TODO: Change Cursor Colors on Hover
      }
    });

    this.pencil.onCursorMove.add((point) => {
      this.handleCursorMove(point);
    });

    this.pencil.onCursorDown.add((point) => {
      if (!this.isEditing) return;
      setTimeout(() => {
        this.isEditing = false;
        this.activeId = undefined;
        this.pencil.mode = "select";
        if (!this.wallSetMesh) return;

        const startSphere = `wallStart`+this.ogid;
        const endSphere = `wallEnd`+this.ogid;

        const { startLeft, startRight, endLeft, endRight } = this.getOuterCoordinates(
          this.wallSetMesh[startSphere].position,
          this.wallSetMesh[endSphere].position,
          this.wallSet.halfThickness
        );

        const vertices = [
          new Vector3D(startLeft.x, startLeft.y, startLeft.z),
          new Vector3D(startRight.x, startRight.y, startRight.z),
          new Vector3D(endRight.x, endRight.y, endRight.z),
          new Vector3D(endLeft.x, endLeft.y, endLeft.z),
        ];

        this.resetVertices();
        this.addVertices(vertices);
        // this.material = new THREE.MeshToonMaterial({ wireframe: true, color: 0x000000 });
      }, 100);
    });
  }

  set halfThickness(value: number) {
    this.wallSet.halfThickness = value;
    // regenerate geometry
    console.log('halfThickness', this.wallSet.halfThickness);
  }

  generateShadowGeometry(start: THREE.Vector3, end: THREE.Vector3, halfThickness: number) {
    const { startLeft, startRight, endLeft, endRight } = this.getOuterCoordinates(start, end, halfThickness);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
      startRight.x, startRight.y, startRight.z,
      startLeft.x, startLeft.y, startLeft.z,
      endRight.x, endRight.y, endRight.z,

      startLeft.x, startLeft.y, startLeft.z,
      endLeft.x, endLeft.y, endLeft.z,
      endRight.x, endRight.y, endRight.z,
    ]), 3));
    geometry.computeVertexNormals();
    // TODO: Add UVs
    geometry.attributes.uv = new THREE.BufferAttribute(new Float32Array([
      0, 0,
      1, 0,
      0, 1,
      1, 0,
      1, 1,
      0, 1,
    ]), 2);
    geometry.attributes.uv.needsUpdate = true;
    return geometry;
  }

  getOuterCoordinates(start: THREE.Vector3, end: THREE.Vector3, halfThickness: number) {
    const perpendicular = this.getPerpendicularVector(start, end);
    const startLeft = start.clone().add(perpendicular.clone().multiplyScalar(halfThickness));
    const startRight = start.clone().add(perpendicular.clone().multiplyScalar(-halfThickness));
    const endLeft = end.clone().add(perpendicular.clone().multiplyScalar(halfThickness));
    const endRight = end.clone().add(perpendicular.clone().multiplyScalar(-halfThickness));
    return {
      startLeft,
      startRight,
      endLeft,
      endRight,
    };
  }

  getPerpendicularVector(start: THREE.Vector3, end: THREE.Vector3) {
    const vector = new THREE.Vector3().subVectors(end, start);
    const perpendicular = new THREE.Vector3().crossVectors(vector, new THREE.Vector3(0, 1, 0));
    return perpendicular.normalize();
  }
}
