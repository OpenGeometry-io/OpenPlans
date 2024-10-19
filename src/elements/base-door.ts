import {
  Vector3D,
  BasePoly,
} from '../../kernel/dist';
import * as THREE from 'three';
import { Pencil } from '../../kernel/dist/src/pencil';
import * as OGLiner from './../helpers/OpenOutliner';

const DoorSet = {
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
  hingeColor: 0x000000,
  hingeThickness: 0.125,
  doorColor: 0x000000,
}

interface ShadowMesh {
  hinge: THREE.Mesh;
  door: THREE.Mesh;
}

interface DoorSetMesh {
  id: number;
  shadowMesh: ShadowMesh;
  startSphere: THREE.Mesh;
  endSphere: THREE.Mesh;
}


export class BaseDoor extends BasePoly {
  public ogType = 'window';
  mesh: BasePoly | null = null;
  doorSet = DoorSet;
  private doorSetMesh: DoorSetMesh = {} as DoorSetMesh;

  private doorMesh : { [key: string]: THREE.Mesh | THREE.Line } = {};

  activeSphere: string | undefined;
  isEditing = false;
  activeId: string | undefined;

  constructor(private pencil: Pencil) {
    super();
    console.log(this.doorSetMesh);
    // this.color = color;
    // this.setupSet();
    this.setGeometry();
    // this.setupEvents();
  }

  /**
   * If A User Has A Wall Set, We Will Use It
   */
  setupSet() {
    if (!this.doorSetMesh) return;
  }

  private setGeometry() {
    if (!this.doorSetMesh) return;

    const { start, end } = this.doorSet.anchor;
    const hingeThickness = this.doorSet.hingeThickness;

    const hingeGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-hingeThickness, 0, -hingeThickness),
      new THREE.Vector3(-hingeThickness, 0, hingeThickness),
      new THREE.Vector3(hingeThickness, 0, hingeThickness),
      new THREE.Vector3(hingeThickness, 0, -hingeThickness),
    ]);
    hingeGeo.setIndex([ 0, 1, 2, 0, 2, 3 ]);
    hingeGeo.computeVertexNormals();
    const hingeMat = new THREE.MeshBasicMaterial({ color: this.doorSet.hingeColor });
    const hinge = new THREE.Mesh(hingeGeo, hingeMat);
    hinge.position.set(start.x + hingeThickness, start.y, start.z);
    hinge.name = 'hingeStart';
    this.add(hinge);

    // Hinge End
    const hingeEnd = hinge.clone();
    hingeEnd.position.set(end.x - hingeThickness, end.y, end.z);
    hingeEnd.name = 'hingeEnd';
    this.add(hingeEnd);

    // Door
    const doorThickness = this.doorSet.thickness / 2;
    const doorGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(start.x, start.y, start.z - doorThickness),
      new THREE.Vector3(start.x, start.y, start.z + doorThickness),
      new THREE.Vector3(end.x, end.y, end.z + doorThickness),
      new THREE.Vector3(end.x, end.y, end.z - doorThickness),
    ]);
    doorGeo.setIndex([ 0, 1, 2, 0, 2, 3 ]);
    doorGeo.computeVertexNormals();
    doorGeo.computeBoundingBox();
    const doorMat = new THREE.MeshBasicMaterial({ color: this.doorSet.doorColor, wireframe: true });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.rotateY(Math.PI / 3);

    // door.position.set(start.x, start.y, start.z);
    // if (door.geometry.boundingBox)

    // door.position.set(door.position.x + this.doorSet.thickness / 2, door.position.y, door.position.z + door.geometry.boundingBox.min.x - this.doorSet.thickness / 2);
    // door.name = 'door';
    this.add(door);
  }

  private handleElementSelected(mesh: THREE.Mesh) {
    this.isEditing = true;
    if (mesh.name === 'start'+this.ogid || mesh.name === 'end'+this.ogid) {
      this.activeId = mesh.name;
      console.log('activeId', this.activeId);
    }
    this.pencil.mode = "cursor";
  }

  private handleCursorMove(cursorPosition: THREE.Vector3) {
    if (!this.isEditing) return;

    if (this.activeId) {
      console.log('activeId', this.activeId);
      const worldToLocal = this.worldToLocal(cursorPosition);
      // this.wallSetMesh[this.activeId].position.set(worldToLocal.x, 0, worldToLocal.z);
    }

    const startSphere = `start`+this.ogid;
    const endSphere = `end`+this.ogid;
    
    // this.wallSet.anchor.start.x = this.wallSetMesh[startSphere].position.x;
    // this.wallSet.anchor.start.y = this.wallSetMesh[startSphere].position.y;
    // this.wallSet.anchor.start.z = this.wallSetMesh[startSphere].position.z;
    // this.wallSet.anchor.end.x = this.wallSetMesh[endSphere].position.x;
    // this.wallSet.anchor.end.y = this.wallSetMesh[endSphere].position.y;
    // this.wallSet.anchor.end.z = this.wallSetMesh[endSphere].position.z;

    // const shadowMesh = this.wallSetMesh[`wall`+this.ogid];
    // shadowMesh.geometry.dispose();
    // shadowMesh.geometry = this.generateShadowGeometry(
    //   this.wallSetMesh[startSphere].position,
    //   this.wallSetMesh[endSphere].position,
    //   this.wallSet.halfThickness
    // );
  }

  setupEvents() {
    this.pencil.onElementSelected.add((mesh) => {
      if (mesh.name === 'wall'+this.ogid || mesh.name === 'start'+this.ogid || mesh.name === 'end'+this.ogid) {
        this.handleElementSelected(mesh);
      }
    });

    this.pencil.onElementHover.add((mesh) => {
      console.log('hovered', mesh.name);
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
        // this.isEditing = false;
        // this.activeId = undefined;
        // this.pencil.mode = "select";
        // if (!this.wallSetMesh) return;

        // const startSphere = `start`+this.ogid;
        // const endSphere = `end`+this.ogid;

        // const { startLeft, startRight, endLeft, endRight } = this.getOuterCoordinates(
        //   this.wallSetMesh[startSphere].position,
        //   this.wallSetMesh[endSphere].position,
        //   this.wallSet.halfThickness
        // );

        // const vertices = [
        //   new Vector3D(startLeft.x, startLeft.y, startLeft.z),
        //   new Vector3D(startRight.x, startRight.y, startRight.z),
        //   new Vector3D(endRight.x, endRight.y, endRight.z),
        //   new Vector3D(endLeft.x, endLeft.y, endLeft.z),
        // ];

        // this.resetVertices();
        // this.addVertices(vertices);
        // this.material = new THREE.MeshToonMaterial({ wireframe: true, color: 0x000000 });
      }, 100);
    });
  }

  set halfThickness(value: number) {
    
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
