// import {
//   Vector3,
//   BasePoly,
// } from '../kernel/dist';
// import * as THREE from 'three';
// import { Pencil } from '../kernel/dist/src/pencil';

// const WindowSet = {
//   position: {
//     x: 0,
//     y: 0,
//     z: 0,
//   },
//   anchor: {
//     start: {
//       x: -2,
//       y: 0,
//       z: 0,
//     },
//     end: {
//       x: 2,
//       y: 0,
//       z: 0,
//     }
//   },
//   thickness: 0.25 / 2,
//   halfThickness: 0.125 / 2,
//   hingeColor: 0x212529,
//   hingeThickness: 0.125,
//   windowColor: 0x343A40,
// }

// interface ShadowMesh {
//   hinge: THREE.Mesh;
//   window: THREE.Mesh;
// }

// interface WindowSetMesh {
//   id: number;
//   shadowMesh: ShadowMesh;
//   startSphere: THREE.Mesh;
//   endSphere: THREE.Mesh;
// }
 
// export class DoubleWindow extends BasePoly {
//   public ogType = 'window';
//   mesh: BasePoly | null = null;
//   windowSet = WindowSet;
//   private windowSetMesh: WindowSetMesh = {} as WindowSetMesh;

//   private windowMesh : { [key: string]: THREE.Mesh | THREE.Line } = {};

//   activeSphere: string | undefined;
//   isEditing = false;
//   activeId: string | undefined;

//   constructor(private pencil: Pencil) {
//     super();
//     // this.color = color;
//     // this.setupSet();
//     this.setGeometry();
//     // this.setupEvents();
//   }

//   /**
//    * If User Has A Window Set, We Will Use It
//    */
//   setupSet() {
//     if (!this.windowSetMesh) return;
//   }

//   private setGeometry() {
//     if (!this.windowSetMesh) return;

//     const { start, end } = this.windowSet.anchor;
//     const hingeThickness = this.windowSet.hingeThickness;

//     const hingeGeo = new THREE.BufferGeometry().setFromPoints([
//       new THREE.Vector3(-hingeThickness, 0, -hingeThickness),
//       new THREE.Vector3(-hingeThickness, 0, hingeThickness),
//       new THREE.Vector3(hingeThickness, 0, hingeThickness ),
//       new THREE.Vector3(hingeThickness, 0, -hingeThickness),
//     ]);
//     hingeGeo.setIndex([
//       0, 1, 2,
//       0, 2, 3,
//     ]);
//     hingeGeo.computeVertexNormals();
//     const hingeMat = new THREE.MeshBasicMaterial({ color: this.windowSet.hingeColor, side: THREE.DoubleSide });
//     const hinge = new THREE.Mesh(hingeGeo, hingeMat);
//     hinge.position.set(start.x + hingeThickness, start.y, start.z);
//     hinge.name = 'hingeStart';
//     this.add(hinge);

//     // Hinge End
//     const hingeEnd = hinge.clone().rotateZ(Math.PI);
//     hingeEnd.position.set(end.x - hingeThickness, end.y, end.z);
//     hingeEnd.name = 'hingeEnd';
//     this.add(hingeEnd);

//     const hingeClip = new THREE.SphereGeometry(0.01, 32, 32);
//     const hingeClipMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
//     const hingeClipMesh = new THREE.Mesh(hingeClip, hingeClipMat);
//     hingeClipMesh.name = 'hingeClip';
//     hingeClipMesh.position.set(hingeThickness, 0, -hingeThickness);
//     hinge.add(hingeClipMesh);

//     // Window
//     const windowGroup = new THREE.Group();
//     windowGroup.position.set(0, 0, 0);
//     windowGroup.name = 'windowGroup';
//     windowGroup.rotation.y = Math.PI;
//     hingeClipMesh.add(windowGroup);

//     const windowThickness = this.windowSet.thickness / 2;
//     const windowGeo = new THREE.BufferGeometry().setFromPoints([
//       new THREE.Vector3(start.x / 2 + hingeThickness * 2, start.y, start.z - windowThickness),
//       new THREE.Vector3(start.x / 2 + hingeThickness * 2, start.y, start.z + windowThickness),
//       new THREE.Vector3(end.x / 2, end.y, end.z + windowThickness),
//       new THREE.Vector3(end.x / 2, end.y, end.z - windowThickness),
//     ]);
//     windowGeo.setIndex([ 0, 1, 2, 0, 2, 3 ]);
//     windowGeo.computeVertexNormals();
//     windowGeo.computeBoundingBox();
//     const windowMat = new THREE.MeshBasicMaterial({ color: 0xDEE2E6, side: THREE.DoubleSide });
//     const windowLeft = new THREE.Mesh(windowGeo, windowMat);
//     windowLeft.position.set(start.x / 2, start.y, start.z - windowThickness);
//     windowGroup.add(windowLeft);

//     const windowEdge = new THREE.EdgesGeometry(windowGeo);
//     const windowEdgeMat = new THREE.LineBasicMaterial({ color: 0x000000 });
//     const windowEdgeMesh = new THREE.LineSegments(windowEdge, windowEdgeMat);
//     windowEdgeMesh.name = 'windowEdge';
//     windowLeft.add(windowEdgeMesh);

//     // const windowArcStart = new THREE.SphereGeometry(0.01, 32, 32);
//     // const windowArcStartMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
//     // const windowArcStartMesh = new THREE.Mesh(windowArcStart, windowArcStartMat);
//     // windowArcStartMesh.position.set(hingeThickness, 0, 0);
//     // windowArcStartMesh.name = 'windowArcStart';
//     // hingeEnd.add(windowArcStartMesh);

//     // Arc Geometry
//     const startVec = new THREE.Vector3(start.x, start.y, start.z);
//     const endVec = new THREE.Vector3(end.x, end.y, end.z);
//     const anchorDistance = startVec.distanceTo(endVec);
//     const doorDistance = anchorDistance - hingeThickness * 4;

//     const windowBaseGeom = new THREE.BufferGeometry().setFromPoints([
//       new THREE.Vector3(start.x + hingeThickness * 2, start.y, start.z - windowThickness),
//       new THREE.Vector3(start.x + hingeThickness * 2, start.y, start.z + windowThickness),
//       new THREE.Vector3(end.x - hingeThickness * 2, end.y, end.z + windowThickness),
//       new THREE.Vector3(end.x - hingeThickness * 2, end.y, end.z - windowThickness),
//     ]);
//     windowBaseGeom.setIndex([ 0, 1, 2, 0, 2, 3 ]);
//     const windowBase = new THREE.Mesh(windowBaseGeom, windowMat);
//     windowBase.material = new THREE.MeshBasicMaterial({ color: 0x495057 });
//     windowBase.position.set(-start.x - hingeThickness, start.y, start.z + windowThickness);
//     windowBase.name = 'windowBase';
//     hinge.add(windowBase);
    
//     const lineGeom = new THREE.BufferGeometry().setFromPoints([
//       new THREE.Vector3(0, 0, 0),
//       new THREE.Vector3(0, 0, -doorDistance / 2),
//     ]);
//     const lineMat = new THREE.LineDashedMaterial({ 
//       color: 0x343A40, 
//       dashSize: 0.1, 
//       gapSize: 0.1
//      });
//     const line = new THREE.Line(lineGeom, lineMat);
//     line.computeLineDistances();
//     line.name = 'windowArcPerpendicular';
//     // line.position.set();
//     hingeClipMesh.add(line);


//     const circle = new THREE.EllipseCurve(
//       hingeClipMesh.position.x, hingeClipMesh.position.z,
//       -doorDistance / 2, -doorDistance / 2,
//       Math.PI, Math.PI / 2,
//       true
//     );
//     const circleMat = new THREE.LineDashedMaterial({
//       color: 0x343A40,
//       dashSize: 0.1,
//       gapSize: 0.1,
//     });
//     const circleGeo = new THREE.BufferGeometry().setFromPoints(circle.getPoints(32));
//     const circleMesh = new THREE.Line(circleGeo, circleMat);
//     circleMesh.computeLineDistances();
//     // circleMesh.position.set(0, 0, -hingeThickness);
//     circleMesh.rotateX(Math.PI / 2);
//     hinge.add(circleMesh);

//     this.windowMesh['circle'] = circleMesh;
//     this.windowMesh['windowLeft'] = windowLeft;
//     this.windowMesh['hinge'] = hinge;
//     this.windowMesh['hingeEnd'] = hingeEnd;

//     // Right Window
//     const rightHingeClipMesh = hingeClipMesh.clone();
//     rightHingeClipMesh.position.set(hingeThickness, 0, -hingeThickness);
//     rightHingeClipMesh.name = 'rightHingeClip';
//     hingeEnd.add(rightHingeClipMesh);

//     const windowArcRight = new THREE.SphereGeometry(0.01, 32, 32);
//     const windowArcRightMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
//     const windowArcRightMesh = new THREE.Mesh(windowArcRight, windowArcRightMat);
//     windowArcRightMesh.position.set(hingeThickness, 0, 0);
//     windowArcRightMesh.name = 'windowArcRight';
//     hingeEnd.add(windowArcRightMesh);

//     const rightCircle = new THREE.EllipseCurve(
//       rightHingeClipMesh.position.x, rightHingeClipMesh.position.z,
//       -doorDistance / 2, -doorDistance / 2,
//       Math.PI, Math.PI / 2,
//       true
//     );
//     const rightCircleGeo = new THREE.BufferGeometry().setFromPoints(rightCircle.getPoints(32));
//     const rightCircleMesh = new THREE.Line(rightCircleGeo, circleMat);
//     rightCircleMesh.computeLineDistances();
//     rightCircleMesh.rotateX(Math.PI / 2);
//     hingeEnd.add(rightCircleMesh);
    

//     // this.name = `door`+this.ogid;
//   }

//   set windowRotation(value: number) {
//     const door = this.getObjectByName('windowGroup');
//     if (!door) return;
//     if (value < 1 || value > 2) return;
//     door.rotation.y = -Math.PI / value;

//     const rightDoor = this.getObjectByName('rightHingeClip');
//     if (!rightDoor) return;
//     const rightDoorGroup = rightDoor.getObjectByName('windowGroup');
//     if (!rightDoorGroup) return;
//     rightDoorGroup.rotation.y = Math.PI + Math.PI / value;
//   }

//   set windowLength(value: number) {
//     if (value < 4 || value > 8) return;

//     const hinge = this.windowMesh['hinge'];
//     if (!hinge) return;

//     const hingeEnd = this.windowMesh['hingeEnd'];
//     if (!hingeEnd) return;

//     const windowLeft = this.windowMesh['windowLeft'];
//     if (!windowLeft) return;

//     const circle = this.windowMesh['circle'] as THREE.Line;
//     if (!circle) return;

//     this.windowSet.anchor.start.x = -value / 2;
//     this.windowSet.anchor.end.x = value / 2;

//     hinge.position.set(
//       this.windowSet.anchor.start.x + this.windowSet.hingeThickness,
//       this.windowSet.anchor.start.y,
//       this.windowSet.anchor.start.z,
//     );

//     hingeEnd.position.set(
//       this.windowSet.anchor.end.x - this.windowSet.hingeThickness,
//       this.windowSet.anchor.end.y,
//       this.windowSet.anchor.end.z,
//     );

//     const hingeClipMesh = hinge.getObjectByName('hingeClip') as THREE.Mesh;
//     if (!hingeClipMesh) return;

//     hingeClipMesh.position.set(this.windowSet.hingeThickness, 0, -this.windowSet.hingeThickness);

//     const leftWindowGeom = new THREE.BufferGeometry().setFromPoints([
//       new THREE.Vector3(this.windowSet.anchor.start.x / 2 + this.windowSet.hingeThickness * 2, this.windowSet.anchor.start.y, this.windowSet.anchor.start.z - this.windowSet.thickness / 2),
//       new THREE.Vector3(this.windowSet.anchor.start.x / 2 + this.windowSet.hingeThickness * 2, this.windowSet.anchor.start.y, this.windowSet.anchor.start.z + this.windowSet.thickness / 2),
//       new THREE.Vector3(this.windowSet.anchor.end.x / 2, this.windowSet.anchor.end.y, this.windowSet.anchor.end.z + this.windowSet.thickness / 2),
//       new THREE.Vector3(this.windowSet.anchor.end.x / 2, this.windowSet.anchor.end.y, this.windowSet.anchor.end.z - this.windowSet.thickness / 2),
//     ]);
//     leftWindowGeom.setIndex([ 0, 1, 2, 0, 2, 3 ]);
//     leftWindowGeom.computeVertexNormals();
//     leftWindowGeom.computeBoundingBox();
//     windowLeft.geometry.dispose();
//     windowLeft.geometry = leftWindowGeom;
//     windowLeft.position.set(
//       this.windowSet.anchor.start.x / 2,
//       this.windowSet.anchor.start.y,
//       this.windowSet.anchor.start.z - this.windowSet.thickness / 2,
//     );

//     const leftWindowEdge = new THREE.EdgesGeometry(leftWindowGeom);
//     const leftWindowEdgeMesh = windowLeft.getObjectByName('windowEdge') as THREE.LineSegments;
//     if (!leftWindowEdgeMesh) return;
//     leftWindowEdgeMesh.geometry.dispose();
//     leftWindowEdgeMesh.geometry = leftWindowEdge;

//     const leftWindowArc = hinge.getObjectByName('windowArcPerpendicular') as THREE.Line;
//     leftWindowArc.geometry.dispose();
//     leftWindowArc.geometry = new THREE.BufferGeometry().setFromPoints([
//       new THREE.Vector3(0, 0, 0),
//       new THREE.Vector3(0, 0, -this.windowSet.hingeThickness * 4),
//     ]);
//     leftWindowArc.computeLineDistances();



//     // const windowGeom = new THREE.BufferGeometry().setFromPoints([
//     //   new THREE.Vector3(this.windowSet.anchor.start.x + this.windowSet.hingeThickness * 4, this.windowSet.anchor.start.y, this.windowSet.anchor.start.z - this.windowSet.thickness / 2),
//     //   new THREE.Vector3(this.windowSet.anchor.start.x + this.windowSet.hingeThickness * 4, this.windowSet.anchor.start.y, this.windowSet.anchor.start.z + this.windowSet.thickness / 2),
//     //   new THREE.Vector3(this.windowSet.anchor.end.x, this.windowSet.anchor.end.y, this.windowSet.anchor.end.z + this.windowSet.thickness / 2),
//     //   new THREE.Vector3(this.windowSet.anchor.end.x, this.windowSet.anchor.end.y, this.windowSet.anchor.end.z - this.windowSet.thickness / 2),
//     // ]);
//     // windowGeom.setIndex([ 0, 1, 2, 0, 2, 3 ]);
//     // windowGeom.computeVertexNormals();
//     // windowGeom.computeBoundingBox();
//     // windowLeft.geometry.dispose();
//     // windowLeft.geometry = windowGeom;
//     // windowLeft.position.set(
//     //   this.windowSet.anchor.start.x,
//     //   this.windowSet.anchor.start.y,
//     //   this.windowSet.anchor.start.z - this.windowSet.thickness / 2,
//     // );

//     // const windowEdge = new THREE.EdgesGeometry(windowGeom);
//     // const windowEdgeMesh = windowLeft.getObjectByName('windowEdge') as THREE.LineSegments;
//     // if (!windowEdgeMesh) return;
//     // windowEdgeMesh.geometry.dispose();
//     // windowEdgeMesh.geometry = windowEdge;

//     // const startVec = new THREE.Vector3(this.windowSet.anchor.start.x, this.windowSet.anchor.start.y, this.windowSet.anchor.start.z);
//     // const endVec = new THREE.Vector3(this.windowSet.anchor.end.x, this.windowSet.anchor.end.y, this.windowSet.anchor.end.z);
//     // const anchorDistance = startVec.distanceTo(endVec);
//     // const doorDistance = anchorDistance - this.windowSet.hingeThickness * 4;

//     // const line = hinge.getObjectByName('windowArcPerpendicular') as THREE.Line;
//     // line.geometry.dispose();
//     // line.geometry = new THREE.BufferGeometry().setFromPoints([
//     //   new THREE.Vector3(0, 0, 0),
//     //   new THREE.Vector3(0, 0, -doorDistance),
//     // ]);
//     // line.computeLineDistances();
    
//     // const hingeClipMesh = hinge.getObjectByName('hingeClip') as THREE.Mesh;
//     // const circleGeo = new THREE.EllipseCurve(
//     //   hingeClipMesh.position.x, hingeClipMesh.position.z,
//     //   -doorDistance, -doorDistance,
//     //   Math.PI, Math.PI / 2,
//     //   true
//     // );
//     // circle.geometry.dispose();
//     // circle.geometry = new THREE.BufferGeometry().setFromPoints(circleGeo.getPoints(32));
//     // circle.computeLineDistances();
//     // // circle.rotateX(Math.PI / 2);

//     // const windowBase = this.getObjectByName('windowBase') as THREE.Mesh;
//     // if (!windowBase) return;
//     // windowBase.geometry.dispose();
//     // windowBase.geometry = windowLeft.geometry.clone();
//     // windowBase.position.set(
//     //   this.windowSet.anchor.start.x + doorDistance / 2,
//     //   this.windowSet.anchor.start.y,
//     //   this.windowSet.anchor.start.z + this.windowSet.thickness / 2,
//     // );
    
//   }

//   set windowColor(value: number) {
//     const window = this.windowMesh['window'];
//     if (!window) return;
//     (window.material as THREE.MeshBasicMaterial).color.set(value);
//   }

//   set windowQudrant(value: number) {
//     if (value < 1 || value > 4) return;
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
//         this.rotateX(Math.PI);
//         this.rotateZ(Math.PI);
//         break;
//       case 4:
//         this.rotation.set(0, 0, 0);
//         this.rotateX(Math.PI);
//         break;
//       default:
//         break;
//     }
//   }

//   private handleElementSelected(mesh: THREE.Mesh) {
//     this.isEditing = true;
//     if (mesh.name === 'start'+this.ogid || mesh.name === 'end'+this.ogid) {
//       this.activeId = mesh.name;
//     }
//     this.pencil.mode = "cursor";
//   }

//   private handleCursorMove(cursorPosition: THREE.Vector3) {
//     if (!this.isEditing) return;

//     if (this.activeId) {
//       const worldToLocal = this.worldToLocal(cursorPosition);
//       // this.wallSetMesh[this.activeId].position.set(worldToLocal.x, 0, worldToLocal.z);
//     }
//   }

//   setupEvents() {
//     // this.pencil.onElementSelected.add((mesh) => {
//     //   if (mesh.name === 'wall'+this.ogid || mesh.name === 'start'+this.ogid || mesh.name === 'end'+this.ogid) {
//     //     this.handleElementSelected(mesh);
//     //   }
//     // });

//     // this.pencil.onElementHover.add((mesh) => {
//     //   console.log('hovered', mesh.name);
//     //   if (mesh.name === 'wall'+this.ogid || mesh.name === 'start'+this.ogid || mesh.name === 'end'+this.ogid) {
//     //     // TODO: Change Cursor Colors on Hover
//     //   }
//     // });

//     // this.pencil.onCursorMove.add((point) => {
//     //   this.handleCursorMove(point);
//     // });

//     // this.pencil.onCursorDown.add((point) => {
//     //   if (!this.isEditing) return;
//     //   setTimeout(() => {
//     //     // this.isEditing = false;
//     //     // this.activeId = undefined;
//     //     // this.pencil.mode = "select";
//     //     // if (!this.wallSetMesh) return;

//     //     // const startSphere = `start`+this.ogid;
//     //     // const endSphere = `end`+this.ogid;

//     //     // const { startLeft, startRight, endLeft, endRight } = this.getOuterCoordinates(
//     //     //   this.wallSetMesh[startSphere].position,
//     //     //   this.wallSetMesh[endSphere].position,
//     //     //   this.wallSet.halfThickness
//     //     // );

//     //     // const vertices = [
//     //     //   new Vector3(startLeft.x, startLeft.y, startLeft.z),
//     //     //   new Vector3(startRight.x, startRight.y, startRight.z),
//     //     //   new Vector3(endRight.x, endRight.y, endRight.z),
//     //     //   new Vector3(endLeft.x, endLeft.y, endLeft.z),
//     //     // ];

//     //     // this.resetVertices();
//     //     // this.addVertices(vertices);
//     //     // this.material = new THREE.MeshToonMaterial({ wireframe: true, color: 0x000000 });
//     //   }, 100);
//     // });
//   }

//   set halfThickness(value: number) {
    
//   }

//   generateShadowGeometry(start: THREE.Vector3, end: THREE.Vector3, halfThickness: number) {
//     const { startLeft, startRight, endLeft, endRight } = this.getOuterCoordinates(start, end, halfThickness);

//     const geometry = new THREE.BufferGeometry();
//     geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
//       startRight.x, startRight.y, startRight.z,
//       startLeft.x, startLeft.y, startLeft.z,
//       endRight.x, endRight.y, endRight.z,

//       startLeft.x, startLeft.y, startLeft.z,
//       endLeft.x, endLeft.y, endLeft.z,
//       endRight.x, endRight.y, endRight.z,
//     ]), 3));
//     geometry.computeVertexNormals();
//     // TODO: Add UVs
//     geometry.attributes.uv = new THREE.BufferAttribute(new Float32Array([
//       0, 0,
//       1, 0,
//       0, 1,
//       1, 0,
//       1, 1,
//       0, 1,
//     ]), 2);
//     geometry.attributes.uv.needsUpdate = true;
//     return geometry;
//   }

//   getOuterCoordinates(start: THREE.Vector3, end: THREE.Vector3, halfThickness: number) {
//     const perpendicular = this.getPerpendicularVector(start, end);
//     const startLeft = start.clone().add(perpendicular.clone().multiplyScalar(halfThickness));
//     const startRight = start.clone().add(perpendicular.clone().multiplyScalar(-halfThickness));
//     const endLeft = end.clone().add(perpendicular.clone().multiplyScalar(halfThickness));
//     const endRight = end.clone().add(perpendicular.clone().multiplyScalar(-halfThickness));
//     return {
//       startLeft,
//       startRight,
//       endLeft,
//       endRight,
//     };
//   }

//   getPerpendicularVector(start: THREE.Vector3, end: THREE.Vector3) {
//     const vector = new THREE.Vector3().subVectors(end, start);
//     const perpendicular = new THREE.Vector3().crossVectors(vector, new THREE.Vector3(0, 1, 0));
//     return perpendicular.normalize();
//   }

//   get area() {
//     const wallDim = {
//       area: 4,
//       perimeter: 0
//     };

//     return wallDim.area;
//   }
// }
