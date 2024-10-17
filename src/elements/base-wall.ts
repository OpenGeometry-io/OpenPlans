import {
  Vector3D,
  BasePoly,
} from '../../kernel/dist';
import * as THREE from 'three';
import { Pencil } from '../../kernel/dist/src/pencil';

const WallSet = {
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
}

interface WallSetMesh {
  id: number;
  shadowMesh: THREE.Mesh;
  startSphere: THREE.Mesh;
  endSphere: THREE.Mesh;
}


export class BaseWall extends BasePoly {
  public color: number;
  mesh: BasePoly | null = null;
  wallSet = WallSet;
  private wallSetMesh: { [key: string]: THREE.Mesh } = {};

  activeSphere: string | undefined;
  isEditing = false;
  activeId: string | undefined;

  constructor(color: number, private pencil: Pencil) {
    super();
    this.color = color;
    this.setupSet();
    this.setGeometry();
    this.setupEvents();
  }

  /**
   * If A User Has A Wall Set, We Will Use It
   */
  setupSet() {
    if (!this.wallSet) return;
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

    console.log(startLeft, startRight, endLeft, endRight);
    // this.material = new THREE.MeshBasicMaterial({ color: this.color });

    this.name = `wall`+this.ogid;
    console.log('this.name', this.name);
    this.pencil.pencilMeshes.push(this);

    const sphereGeometry = new THREE.SphereGeometry(0.05, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const sSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sSphere.name = `start`+this.ogid;
    sSphere.position.set(
      this.wallSet.anchor.start.x,
      this.wallSet.anchor.start.y,
      this.wallSet.anchor.start.z
    )
    this.add(sSphere);

    const eSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    eSphere.name = `end`+this.ogid;
    eSphere.position.set(
      this.wallSet.anchor.end.x,
      this.wallSet.anchor.end.y,
      this.wallSet.anchor.end.z
    )
    this.add(eSphere);

    this.pencil.pencilMeshes.push(sSphere);
    this.pencil.pencilMeshes.push(eSphere);

    const shadowGeom = this.generateShadowGeometry(
      new THREE.Vector3(
        this.wallSet.anchor.start.x,
        this.wallSet.anchor.start.y,
        this.wallSet.anchor.start.z
      ),
      new THREE.Vector3(
        this.wallSet.anchor.end.x,
        this.wallSet.anchor.end.y,
        this.wallSet.anchor.end.z
      ),
      this.wallSet.halfThickness
    );
    const shadowMaterial = new THREE.MeshToonMaterial({ color: 0xff0000 });
    const shadowMesh = new THREE.Mesh(shadowGeom, shadowMaterial);
    shadowMesh.name = `wall`+this.ogid;
    this.add(shadowMesh);

    this.wallSetMesh[sSphere.name] = sSphere;
    this.wallSetMesh[eSphere.name] = eSphere;
    this.wallSetMesh[shadowMesh.name] = shadowMesh;

    // OG Kernel Wall
    this.material = new THREE.MeshToonMaterial({ wireframe: true, color: 0x000000 });
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
      this.wallSetMesh[this.activeId].position.set(worldToLocal.x, 0, worldToLocal.z);
    }

    const startSphere = `start`+this.ogid;
    const endSphere = `end`+this.ogid;
    
    this.wallSet.anchor.start.x = this.wallSetMesh[startSphere].position.x;
    this.wallSet.anchor.start.y = this.wallSetMesh[startSphere].position.y;
    this.wallSet.anchor.start.z = this.wallSetMesh[startSphere].position.z;
    this.wallSet.anchor.end.x = this.wallSetMesh[endSphere].position.x;
    this.wallSet.anchor.end.y = this.wallSetMesh[endSphere].position.y;
    this.wallSet.anchor.end.z = this.wallSetMesh[endSphere].position.z;

    const shadowMesh = this.wallSetMesh[`wall`+this.ogid];
    shadowMesh.geometry.dispose();
    shadowMesh.geometry = this.generateShadowGeometry(
      this.wallSetMesh[startSphere].position,
      this.wallSetMesh[endSphere].position,
      this.wallSet.halfThickness
    );
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
        this.isEditing = false;
        this.activeId = undefined;
        this.pencil.mode = "select";
        if (!this.wallSetMesh) return;

        const startSphere = `start`+this.ogid;
        const endSphere = `end`+this.ogid;

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
        this.material = new THREE.MeshToonMaterial({ wireframe: true, color: 0x000000 });
      }, 100);
    });
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
