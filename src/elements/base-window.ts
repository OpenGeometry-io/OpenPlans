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
  hingeColor: 0x212529,
  hingeThickness: 0.125,
  windowColor: 0x343A40,
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
      new THREE.Vector3(hingeThickness, 0, hingeThickness ),
      new THREE.Vector3(hingeThickness, 0, -hingeThickness),
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

    const hingeClip = new THREE.SphereGeometry(0.01, 32, 32);
    const hingeClipMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const hingeClipMesh = new THREE.Mesh(hingeClip, hingeClipMat);
    hingeClipMesh.name = 'hingeClip';
    hingeClipMesh.position.set(hingeThickness, 0, -hingeThickness);
    hinge.add(hingeClipMesh);

    // Window
    const windowGroup = new THREE.Group();
    windowGroup.position.set(0, 0, 0);
    windowGroup.name = 'windowGroup';
    windowGroup.rotation.y = Math.PI;
    hingeClipMesh.add(windowGroup);

    const windowThickness = this.windowSet.thickness / 2;
    const windowGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(start.x + hingeThickness * 4, start.y, start.z - windowThickness),
      new THREE.Vector3(start.x + hingeThickness * 4, start.y, start.z + windowThickness),
      new THREE.Vector3(end.x, end.y, end.z + windowThickness),
      new THREE.Vector3(end.x, end.y, end.z - windowThickness),
    ]);
    windowGeo.setIndex([ 0, 1, 2, 0, 2, 3 ]);
    windowGeo.computeVertexNormals();
    windowGeo.computeBoundingBox();
    const windowMat = new THREE.MeshBasicMaterial({ color: 0xDEE2E6, side: THREE.DoubleSide });
    const window = new THREE.Mesh(windowGeo, windowMat);
    window.position.set(start.x, start.y, start.z - windowThickness);
    windowGroup.add(window);

    const windowEdge = new THREE.EdgesGeometry(windowGeo);
    const windowEdgeMat = new THREE.LineBasicMaterial({ color: 0x000000 });
    const windowEdgeMesh = new THREE.LineSegments(windowEdge, windowEdgeMat);
    windowEdgeMesh.name = 'windowEdge';
    window.add(windowEdgeMesh);

    const windowArcStart = new THREE.SphereGeometry(0.01, 32, 32);
    const windowArcStartMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const windowArcStartMesh = new THREE.Mesh(windowArcStart, windowArcStartMat);
    windowArcStartMesh.position.set(hingeThickness, 0, 0);
    windowArcStartMesh.name = 'windowArcStart';
    hingeEnd.add(windowArcStartMesh);

    // Arc Geometry
    const startVec = new THREE.Vector3(start.x, start.y, start.z);
    const endVec = new THREE.Vector3(end.x, end.y, end.z);
    const anchorDistance = startVec.distanceTo(endVec);
    const doorDistance = anchorDistance - hingeThickness * 4;

    const windowBaseGeom = window.geometry.clone();
    const windowBase = new THREE.Mesh(windowBaseGeom, windowMat);
    windowBase.material = new THREE.MeshBasicMaterial({ color: 0x495057 });
    windowBase.position.set(start.x + doorDistance / 2, start.y, start.z + windowThickness);
    windowBase.name = 'windowBase';
    this.add(windowBase);
    
    const lineGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -doorDistance),
    ]);
    const lineMat = new THREE.LineDashedMaterial({ 
      color: 0x343A40, 
      dashSize: 0.1, 
      gapSize: 0.1
     });
    const line = new THREE.Line(lineGeom, lineMat);
    line.computeLineDistances();
    line.name = 'windowArcPerpendicular';
    // line.position.set();
    hingeClipMesh.add(line);


    const circle = new THREE.EllipseCurve(
      hingeClipMesh.position.x, hingeClipMesh.position.z,
      -doorDistance, -doorDistance,
      Math.PI, Math.PI / 2,
      true
    );
    const circleMat = new THREE.LineDashedMaterial({
      color: 0x343A40,
      dashSize: 0.1,
      gapSize: 0.1,
    });
    const circleGeo = new THREE.BufferGeometry().setFromPoints(circle.getPoints(32));
    const circleMesh = new THREE.Line(circleGeo, circleMat);
    circleMesh.computeLineDistances();
    // circleMesh.position.set(0, 0, -hingeThickness);
    circleMesh.rotateX(Math.PI / 2);
    hinge.add(circleMesh);

    this.windowMesh['circle'] = circleMesh;
    this.windowMesh['window'] = window;
    this.windowMesh['hinge'] = hinge;
    this.windowMesh['hingeEnd'] = hingeEnd;

    // this.name = `door`+this.ogid;
  }

  set windowRotation(value: number) {
    const door = this.getObjectByName('windowGroup');
    if (!door) return;
    if (value < 1 || value > 2) return;
    door.rotation.y = -Math.PI / value;

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

  set windowLength(value: number) {
    if (value < 2 || value > 5) return;

    const hinge = this.windowMesh['hinge'];
    if (!hinge) return;

    const hingeEnd = this.windowMesh['hingeEnd'];
    if (!hingeEnd) return;

    const window = this.windowMesh['window'];
    if (!window) return;

    const circle = this.windowMesh['circle'] as THREE.Line;
    if (!circle) return;

    this.windowSet.anchor.start.x = -value / 2;
    this.windowSet.anchor.end.x = value / 2;

    hinge.position.set(
      this.windowSet.anchor.start.x + this.windowSet.hingeThickness,
      this.windowSet.anchor.start.y,
      this.windowSet.anchor.start.z,
    );

    hingeEnd.position.set(
      this.windowSet.anchor.end.x - this.windowSet.hingeThickness,
      this.windowSet.anchor.end.y,
      this.windowSet.anchor.end.z,
    );

    const windowGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(this.windowSet.anchor.start.x + this.windowSet.hingeThickness * 4, this.windowSet.anchor.start.y, this.windowSet.anchor.start.z - this.windowSet.thickness / 2),
      new THREE.Vector3(this.windowSet.anchor.start.x + this.windowSet.hingeThickness * 4, this.windowSet.anchor.start.y, this.windowSet.anchor.start.z + this.windowSet.thickness / 2),
      new THREE.Vector3(this.windowSet.anchor.end.x, this.windowSet.anchor.end.y, this.windowSet.anchor.end.z + this.windowSet.thickness / 2),
      new THREE.Vector3(this.windowSet.anchor.end.x, this.windowSet.anchor.end.y, this.windowSet.anchor.end.z - this.windowSet.thickness / 2),
    ]);
    windowGeom.setIndex([ 0, 1, 2, 0, 2, 3 ]);
    windowGeom.computeVertexNormals();
    windowGeom.computeBoundingBox();
    window.geometry.dispose();
    window.geometry = windowGeom;
    window.position.set(
      this.windowSet.anchor.start.x,
      this.windowSet.anchor.start.y,
      this.windowSet.anchor.start.z - this.windowSet.thickness / 2,
    );

    const windowEdge = new THREE.EdgesGeometry(windowGeom);
    const windowEdgeMesh = window.getObjectByName('windowEdge') as THREE.LineSegments;
    if (!windowEdgeMesh) return;
    windowEdgeMesh.geometry.dispose();
    windowEdgeMesh.geometry = windowEdge;

    const startVec = new THREE.Vector3(this.windowSet.anchor.start.x, this.windowSet.anchor.start.y, this.windowSet.anchor.start.z);
    const endVec = new THREE.Vector3(this.windowSet.anchor.end.x, this.windowSet.anchor.end.y, this.windowSet.anchor.end.z);
    const anchorDistance = startVec.distanceTo(endVec);
    const doorDistance = anchorDistance - this.windowSet.hingeThickness * 4;

    const line = hinge.getObjectByName('windowArcPerpendicular') as THREE.Line;
    line.geometry.dispose();
    line.geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -doorDistance),
    ]);
    line.computeLineDistances();
    
    const hingeClipMesh = hinge.getObjectByName('hingeClip') as THREE.Mesh;
    const circleGeo = new THREE.EllipseCurve(
      hingeClipMesh.position.x, hingeClipMesh.position.z,
      -doorDistance, -doorDistance,
      Math.PI, Math.PI / 2,
      true
    );
    circle.geometry.dispose();
    circle.geometry = new THREE.BufferGeometry().setFromPoints(circleGeo.getPoints(32));
    circle.computeLineDistances();
    // circle.rotateX(Math.PI / 2);

    const windowBase = this.getObjectByName('windowBase') as THREE.Mesh;
    if (!windowBase) return;
    windowBase.geometry.dispose();
    windowBase.geometry = window.geometry.clone();
    windowBase.position.set(
      this.windowSet.anchor.start.x + doorDistance / 2,
      this.windowSet.anchor.start.y,
      this.windowSet.anchor.start.z + this.windowSet.thickness / 2,
    );
    
  }

  set windowColor(value: number) {
    const window = this.windowMesh['window'];
    if (!window) return;
    (window.material as THREE.MeshBasicMaterial).color.set(value);
  }

  set windowQudrant(value: number) {
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
    }
    this.pencil.mode = "cursor";
  }

  private handleCursorMove(cursorPosition: THREE.Vector3) {
    if (!this.isEditing) return;

    if (this.activeId) {
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
