import {
  Vector3D,
  BasePoly,
} from '../../kernel/dist';
import * as THREE from 'three';
import { Pencil } from '../../kernel/dist/src/pencil';

const WallSet = {
  id: 1,
  bounds: {
    x: 0.25,
    y: 0,
    z: 0.25,
  },
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
  thickness: 0.5,
  halfThickness: 0.25
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
  private wallSetMesh: WallSetMesh | null = null;

  activeSphere: string | undefined;
  isEditing = false;

  constructor(color: number, private pencil: Pencil) {
    super();
    this.color = color;
    this.setupSet();
    this.setGeometry();
  }

  /**
   * If A User Has A Wall Set, We Will Use It
   */
  setupSet() {
    if (!this.wallSet) return;
    this.wallSet.id = this.ogid;
  }

  private setGeometry() {
    if (!this.wallSet) return;
    const vertices = [
      new Vector3D(
        this.wallSet.anchor.start.x,
        this.wallSet.anchor.start.y,
        this.wallSet.anchor.start.z - this.wallSet.halfThickness
      ),
      new Vector3D(
        this.wallSet.anchor.start.x,
        this.wallSet.anchor.start.y,
        this.wallSet.anchor.start.z + this.wallSet.halfThickness
      ),
      new Vector3D(
        this.wallSet.anchor.end.x,
        this.wallSet.anchor.end.y,
        this.wallSet.anchor.end.z + this.wallSet.halfThickness
      ),
      new Vector3D(
        this.wallSet.anchor.end.x,
        this.wallSet.anchor.end.y,
        this.wallSet.anchor.end.z - this.wallSet.halfThickness
      ),
    ];
    this.addVertices(vertices);
    // this.material = new THREE.MeshBasicMaterial({ color: this.color });

    this.name = `wall`+this.wallSet.id;
    console.log('this.name', this.name);
    this.pencil.pencilMeshes.push(this);

    const sphereGeometry = new THREE.SphereGeometry(0.05, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const sSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sSphere.name = `start`+this.wallSet.id;
    sSphere.position.set(
      this.wallSet.anchor.start.x,
      this.wallSet.anchor.start.y,
      this.wallSet.anchor.start.z
    )
    this.add(sSphere);

    const eSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    eSphere.name = `end`+this.wallSet.id;
    eSphere.position.set(
      this.wallSet.anchor.end.x,
      this.wallSet.anchor.end.y,
      this.wallSet.anchor.end.z
    )
    this.add(eSphere);

    this.pencil.pencilMeshes.push(sSphere);
    this.pencil.pencilMeshes.push(eSphere);

    const shadowGeom = this.generateShadowMesh(
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
    const shadowMaterial = new THREE.MeshToonMaterial({ color: 0x000000, wireframe: true });
    const shadowMesh = new THREE.Mesh(shadowGeom, shadowMaterial);
    this.add(shadowMesh);

    this.wallSetMesh = {
      id: this.wallSet.id,
      shadowMesh: shadowMesh,
      startSphere: sSphere,
      endSphere: eSphere,
    }

    // console.log('wallSetMesh', this.wallSetMesh);

    this.pencil.onElementSelected.add((mesh) => {
      this.handleElementSelected(mesh);
    })

    this.pencil.onCursorMove.add((point) => {
      this.handleCursorMove(point);
    });

    this.pencil.onCursorDown.add((point) => {
      if (!this.isEditing) return;
      setTimeout(() => {
        this.isEditing = false;

        if (!this.wallSetMesh) return;

        // Update Vertices and Wall Main Mesh
        const vertices = [
          new Vector3D(
            this.wallSetMesh.startSphere.position.x,
            this.wallSetMesh.startSphere.position.y,
            this.wallSetMesh.startSphere.position.z - this.wallSet.halfThickness
          ),
          new Vector3D(
            this.wallSetMesh.startSphere.position.x,
            this.wallSetMesh.startSphere.position.y,
            this.wallSetMesh.startSphere.position.z + this.wallSet.halfThickness
          ),
          new Vector3D(
            this.wallSetMesh.endSphere.position.x,
            this.wallSetMesh.endSphere.position.y,
            this.wallSetMesh.endSphere.position.z + this.wallSet.halfThickness
          ),
          new Vector3D(
            this.wallSetMesh.endSphere.position.x,
            this.wallSetMesh.endSphere.position.y,
            this.wallSetMesh.endSphere.position.z - this.wallSet.halfThickness
          ),
        ];
        this.resetVertices();
        this.addVertices(vertices);

      }, 100);
    });
  }

  private handleElementSelected(mesh: THREE.Mesh) {
    if (!mesh.name || !(mesh.name !== this.name) || (mesh.parent?.name !== this.name)) return;
    
    console.log('handleElementSelected', mesh);
    console.log('wallsetid', this.wallSet.id);
    const startSphereName = `start`+this.wallSet.id;
    const endSphereName = `end`+this.wallSet.id;

    if (mesh.name === startSphereName && !this.isEditing) {
      console.log('startSphereName', mesh.name);
      this.isEditing = true;
      this.activeSphere = mesh.name;
    }

    if (mesh.name === endSphereName && !this.isEditing) {
      this.isEditing = true;
      this.activeSphere = mesh.name;
    }
  }

  private handleCursorMove(cursorPosition: THREE.Vector3) {
    if (!this.isEditing) return;
    if (!this.wallSetMesh) return;

    const startSphereName = `start`+this.wallSet.id;
    const endSphereName = `end`+this.wallSet.id;

    if (this.activeSphere === startSphereName) {
      const worldToLocal = this.worldToLocal(cursorPosition);
      this.wallSetMesh.startSphere.position.set(worldToLocal.x, 0, worldToLocal.z);
    }

    if (this.activeSphere === endSphereName) {
      const worldToLocal = this.worldToLocal(cursorPosition);
      this.wallSetMesh.endSphere.position.set(worldToLocal.x, 0, worldToLocal.z);
    }

    this.wallSet.anchor.start.x = this.wallSetMesh.startSphere.position.x;
    this.wallSet.anchor.start.z = this.wallSetMesh.startSphere.position.z;
    this.wallSet.anchor.end.x = this.wallSetMesh.endSphere.position.x;
    this.wallSet.anchor.end.z = this.wallSetMesh.endSphere.position.z;

    this.wallSetMesh.shadowMesh.geometry.dispose();
    this.wallSetMesh.shadowMesh.geometry = this.generateShadowMesh(
      this.wallSetMesh.startSphere.position,
      this.wallSetMesh.endSphere.position,
      this.wallSet.halfThickness
    );
  }

  generateShadowMesh(start: THREE.Vector3, end: THREE.Vector3, halfThickness: number) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
      start.x, start.y, start.z - halfThickness,
      start.x, start.y, start.z + halfThickness,
      end.x, end.y, end.z + halfThickness,

      end.x, end.y, end.z - halfThickness,
      start.x, start.y, start.z - halfThickness,
      end.x, end.y, end.z + halfThickness,
    ]), 3));
    geometry.computeVertexNormals();
    return geometry;
  }

}
