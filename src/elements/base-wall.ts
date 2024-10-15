import {
  Vector3D,
  BasePoly,
} from '../../kernel/dist';
import * as THREE from 'three';
import { Pencil } from '../../kernel/dist/src/pencil';

const WallSet = {
  id: 4,
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
  line: THREE.Line;
  sphere: THREE.Mesh;
  sphere2: THREE.Mesh;
}


export class BaseWall {
  public color: number;
  mesh: BasePoly | null = null;
  wallSet = WallSet;
  isEditing = false;
  isSolid = true;
  sphere: THREE.Mesh | null = null;

  private wallSetMesh: WallSetMesh | null = null;
  activeSphere: string | undefined;

  constructor(color: number, private pencil: Pencil) {
    this.color = color;
    this.setupSet();
    this.setGeometry();
  }

  /**
   * If A User Has A Wall Set, We Will Use It
   */
  setupSet() {
    if (!this.wallSet) return;
    this.wallSet.id = 4;
  }

  private setGeometry() {
    if (!this.wallSet) return;
    const vertices = [
      new Vector3D(
        this.wallSet.anchor.start.x - this.wallSet.halfThickness,
        this.wallSet.anchor.start.y,
        this.wallSet.anchor.start.z - this.wallSet.halfThickness
      ),
      new Vector3D(
        this.wallSet.anchor.start.x - this.wallSet.halfThickness,
        this.wallSet.anchor.start.y,
        this.wallSet.anchor.start.z + this.wallSet.halfThickness
      ),
      new Vector3D(
        this.wallSet.anchor.end.x + this.wallSet.halfThickness,
        this.wallSet.anchor.end.y,
        this.wallSet.anchor.end.z + this.wallSet.halfThickness
      ),
      new Vector3D(
        this.wallSet.anchor.end.x + this.wallSet.halfThickness,
        this.wallSet.anchor.end.y,
        this.wallSet.anchor.end.z - this.wallSet.halfThickness
      ),
    ];
    
    this.mesh = new BasePoly(vertices);

    const sphereGeometry = new THREE.SphereGeometry(0.05, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    this.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    this.sphere.name = 'start';
    this.sphere.position.set(
      this.wallSet.anchor.start.x,
      this.wallSet.anchor.start.y,
      this.wallSet.anchor.start.z
    )
    this.mesh.add(this.sphere);

    const sphere2 = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere2.name = 'end';
    sphere2.position.set(
      this.wallSet.anchor.end.x,
      this.wallSet.anchor.end.y,
      this.wallSet.anchor.end.z
    )
    this.mesh.add(sphere2);


    const lineMaterial = new THREE.LineBasicMaterial({ color: this.color });
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(
        this.wallSet.anchor.start.x,
        this.wallSet.anchor.start.y,
        this.wallSet.anchor.start.z
      ),
      new THREE.Vector3(
        this.wallSet.anchor.end.x,
        this.wallSet.anchor.end.y,
        this.wallSet.anchor.end.z
      )
    ]);
    const line = new THREE.Line(lineGeometry, lineMaterial);
    this.mesh.add(line);

    this.pencil.pencilMeshes.push(this.sphere);
    this.pencil.pencilMeshes.push(sphere2);

    this.wallSetMesh = {
      line: line,
      sphere: this.sphere,
      sphere2: sphere2,
    }

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
      }, 100);
    });
  }

  private handleElementSelected(mesh: THREE.Mesh) {
    if (mesh.name === 'start' && !this.isEditing) {
      this.isEditing = true;
      this.activeSphere = mesh.name;
    }

    if (mesh.name === 'end' && !this.isEditing) {
      this.isEditing = true;
      this.activeSphere = mesh.name;
    }
  }

  private handleCursorMove(cursorPosition: THREE.Vector3) {
    if (!this.isEditing) return;
    if (!this.wallSetMesh) return;

    if (this.activeSphere === 'start') {
      this.wallSetMesh.sphere.position.set(cursorPosition.x, cursorPosition.y, cursorPosition.z);
    }

    if (this.activeSphere === 'end') {
      this.wallSetMesh.sphere2.position.set(cursorPosition.x, cursorPosition.y, cursorPosition.z);
    }

    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      this.wallSetMesh.sphere.position,
      this.wallSetMesh.sphere2.position
    ]);

    this.wallSetMesh.line.geometry = lineGeometry;
  }

  public getMesh() {
    return this.mesh;
  }
}
