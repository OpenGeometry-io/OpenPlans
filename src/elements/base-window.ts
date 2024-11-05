import {
  Vector3D,
  BasePoly,
} from '../../kernel/dist';
import * as THREE from 'three';
import { Pencil } from '../../kernel/dist/src/pencil';

const WindowSet = {
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
  thickness: 0.25 / 2,
  halfThickness: 0.125 / 2,
  hingeColor: 0x000000,
  hingeThickness: 0.125,
  windowColor: 0x000000,
}

interface ShadowMesh {
  hinge: THREE.Mesh;
  window: THREE.Mesh;
}

interface WindowSetMesh {
  id: number;
  shadowMesh: ShadowMesh;
  startSphere: THREE.Mesh;
  endSphere: THREE.Mesh;
}
 
export class BaseWindow extends BasePoly {
  public ogType = 'window';
  mesh: BasePoly | null = null;
  windowSet = WindowSet;
  private windowSetMesh: WindowSetMesh = {} as WindowSetMesh;

  private windowMesh : { [key: string]: THREE.Mesh | THREE.Line } = {};

  activeSphere: string | undefined;
  isEditing = false;
  activeId: string | undefined;

  constructor(private pencil: Pencil) {
    super();
    console.log(this.windowSetMesh);
    // this.color = color;
    // this.setupSet();
    this.setGeometry();
    // this.setupEvents();
  }

  /**
   * If User Has A Window Set, We Will Use It
   */
  setupSet() {
    if (!this.windowSetMesh) return;
  }

  private setGeometry() {
    if (!this.windowSetMesh) return;

    const { start, end } = this.windowSet.anchor;
    const hingeThickness = this.windowSet.hingeThickness;

    const hingeGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-hingeThickness, 0, -hingeThickness),
      new THREE.Vector3(-hingeThickness, 0, hingeThickness),
      new THREE.Vector3(hingeThickness / 2, 0, hingeThickness ),
      new THREE.Vector3(hingeThickness / 2, 0, -hingeThickness),
    ]);
    hingeGeo.setIndex([
      0, 1, 2,
      0, 2, 3,
    ]);
    hingeGeo.computeVertexNormals();
    const hingeMat = new THREE.MeshBasicMaterial({ color: this.windowSet.hingeColor, side: THREE.DoubleSide });
    const hinge = new THREE.Mesh(hingeGeo, hingeMat);
    hinge.position.set(start.x + hingeThickness, start.y, start.z);
    hinge.name = 'hingeStart';
    this.add(hinge);

    // Hinge End
    const hingeEnd = hinge.clone().rotateZ(Math.PI);
    hingeEnd.position.set(end.x - hingeThickness, end.y, end.z);
    hingeEnd.name = 'hingeEnd';
    this.add(hingeEnd);

    // Window
    const windowThickness = this.windowSet.thickness / 2;
    const windowGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(start.x, start.y, start.z - windowThickness),
      new THREE.Vector3(start.x, start.y, start.z + windowThickness),
      new THREE.Vector3(end.x, end.y, end.z + windowThickness),
      new THREE.Vector3(end.x, end.y, end.z - windowThickness),
    ]);
    windowGeo.setIndex([ 0, 1, 2, 0, 2, 3 ]);
    windowGeo.computeVertexNormals();
    windowGeo.computeBoundingBox();
    const windowMat = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });
    const window = new THREE.Mesh(windowGeo, windowMat);
    window.position.set(start.x + windowThickness * 2, start.y, start.z - windowThickness);

    // this.add(window);

    // const hingeClip = new THREE.SphereGeometry(0.001, 32, 32);
    // const hingeClipMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    // const hingeClipMesh = new THREE.Mesh(hingeClip, hingeClipMat);
    // hingeClipMesh.position.set(0, 0, -hingeThickness);
    // hinge.add(hingeClipMesh);

    // const windowGroup = new THREE.Group();
    // windowGroup.position.set(0, 0, 0);
    // hingeClipMesh.add(windowGroup);
    // windowGroup.add(window);
    // windowGroup.rotation.y = Math.PI;
    // windowGroup.name = 'doorGroup';
    
    // // this.add(door);
    // // door.name = 'doorGroup';

    // const doorEdge = new THREE.EdgesGeometry(doorGeo);
    // const doorEdgeMat = new THREE.LineBasicMaterial({ color: 0x000000 });
    // const doorEdgeMesh = new THREE.LineSegments(doorEdge, doorEdgeMat);
    // doorEdgeMesh.name = 'doorEdge';
    // door.add(doorEdgeMesh);

    // const doorArcStart = new THREE.SphereGeometry(0.01, 32, 32);
    // const doorArcStartMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    // const doorArcStartMesh = new THREE.Mesh(doorArcStart, doorArcStartMat);
    // // doorArcStartMesh.position.set(end.x - doorThickness * 2, start.y, start.z);
    // doorArcStartMesh.name = 'doorArcStart';
    // // hingeEnd.add(doorArcStartMesh);

    // const doorArcEnd = new THREE.SphereGeometry(0.02, 32, 32);
    // const doorArcEndMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    // const doorArcEndMesh = new THREE.Mesh(doorArcEnd, doorArcEndMat);
    // doorArcEndMesh.position.set(start.x + doorThickness * 2, start.y, start.z - doorThickness);
    // // door.add(doorArcEndMesh);
    
    // const circle = new THREE.EllipseCurve(
    //   0, 0, 
    //   hinge.position.x - hingeEnd.position.x, hinge.position.x - hingeEnd.position.x,
    //   Math.PI, Math.PI / 1.2,
    //   true
    // );
    // const circleMat = new THREE.LineBasicMaterial({ color: 0x000000 });
    // const circleGeo = new THREE.BufferGeometry().setFromPoints(circle.getPoints(32));
    // const circleMesh = new THREE.Line(circleGeo, circleMat);
    // circleMesh.position.set(0, 0, -hingeThickness);
    // circleMesh.rotateX(Math.PI / 2);
    // hinge.add(circleMesh);
    // this.windowMesh['circle'] = circleMesh;
    // this.windowMesh['door'] = door;
    // this.windowMesh['hinge'] = hinge;
    // this.windowMesh['hingeEnd'] = hingeEnd;

    // this.name = `door`+this.ogid;
  }

  set doorRotation(value: number) {
    // const door = this.getObjectByName('doorGroup');
    // if (!door) return;
    // if (value < 1 || value > 2) return;
    // door.rotation.y = -Math.PI / value;

    // const circle = this.doorMesh['circle'];
    // if (!circle) return;

    // const circleGeo = new THREE.EllipseCurve(
    //   0, 0, 
    //   this.doorMesh['hinge'].position.x - this.doorMesh['hingeEnd'].position.x, this.doorMesh['hinge'].position.x - this.doorMesh['hingeEnd'].position.x,
    //   Math.PI, Math.PI / value,
    //   true,
    // );
    // circle.geometry.dispose();
    // circle.geometry = new THREE.BufferGeometry().setFromPoints(circleGeo.getPoints(32));
  }

  set doorColor(value: number) {
    // const door = this.doorMesh['door'];
    // if (!door) return;
    // (door.material as THREE.MeshBasicMaterial).color.set(value);
  }

  set doorQudrant(value: number) {
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
  }

  setupEvents() {
    // this.pencil.onElementSelected.add((mesh) => {
    //   if (mesh.name === 'wall'+this.ogid || mesh.name === 'start'+this.ogid || mesh.name === 'end'+this.ogid) {
    //     this.handleElementSelected(mesh);
    //   }
    // });

    // this.pencil.onElementHover.add((mesh) => {
    //   console.log('hovered', mesh.name);
    //   if (mesh.name === 'wall'+this.ogid || mesh.name === 'start'+this.ogid || mesh.name === 'end'+this.ogid) {
    //     // TODO: Change Cursor Colors on Hover
    //   }
    // });

    // this.pencil.onCursorMove.add((point) => {
    //   this.handleCursorMove(point);
    // });

    // this.pencil.onCursorDown.add((point) => {
    //   if (!this.isEditing) return;
    //   setTimeout(() => {
    //     // this.isEditing = false;
    //     // this.activeId = undefined;
    //     // this.pencil.mode = "select";
    //     // if (!this.wallSetMesh) return;

    //     // const startSphere = `start`+this.ogid;
    //     // const endSphere = `end`+this.ogid;

    //     // const { startLeft, startRight, endLeft, endRight } = this.getOuterCoordinates(
    //     //   this.wallSetMesh[startSphere].position,
    //     //   this.wallSetMesh[endSphere].position,
    //     //   this.wallSet.halfThickness
    //     // );

    //     // const vertices = [
    //     //   new Vector3D(startLeft.x, startLeft.y, startLeft.z),
    //     //   new Vector3D(startRight.x, startRight.y, startRight.z),
    //     //   new Vector3D(endRight.x, endRight.y, endRight.z),
    //     //   new Vector3D(endLeft.x, endLeft.y, endLeft.z),
    //     // ];

    //     // this.resetVertices();
    //     // this.addVertices(vertices);
    //     // this.material = new THREE.MeshToonMaterial({ wireframe: true, color: 0x000000 });
    //   }, 100);
    // });
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
