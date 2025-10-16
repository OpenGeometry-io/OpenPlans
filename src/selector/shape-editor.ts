// import { Pencil } from "../kernel/dist/src/pencil";
// import * as THREE from "three";
// import { PolygonShape, PolyLineShape } from "../primitives";
// import { generateUUID } from "three/src/math/MathUtils.js";
// import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";

// /**
//  * This class will handle the editing of shapes, including adding, removing, and modifying anchor points.
//  * It will also handle the editing of edges and other properties of the shape.
//  */
// export class _ShapeEditor {
//   activeShape: PolygonShape | PolyLineShape | null = null;

//   private editorMesh: THREE.Mesh = new THREE.Mesh();

//   #scene: THREE.Scene | null = null;
//   private _pencil: Pencil | null = null;

//   initialCursorPos: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

//   subNodes: Map<string, THREE.Object3D> = new Map();
//   subEdges: Map<string, HTMLDivElement> = new Map();

//   editorNodes: Map<string, number> = new Map();
//   editorEdges: Map<string, number> = new Map();

//   constructor() {}

//   set pencil(pencil: Pencil) {
//     this._pencil = pencil;

//     this.pencil.onCursorMove.add((coords) => {
//       // this.handlePencilCursorMove(coords);
//     });

//     this.pencil.onCursorDown.add((coords) => {
//       console.log('Cursor Down', coords);
//       this.initialCursorPos = coords;
//     });
//   }

//   get pencil() {
//     if (this._pencil) {
//       return this._pencil
//     } else {
//       throw new Error("Pencil is not set for this PolyLine.");
//     }
//   }

//   set scene(scene: THREE.Scene) {
//     this.#scene = scene;
//   }

//   get scene() {
//     if (!this.#scene) {
//       throw new Error("Scene is not set. Please set the scene before accessing it.");
//     }
//     return this.#scene;
//   }

//   set shape(shape: PolygonShape | PolyLineShape | null) {
//     if (!shape) {
//       console.warn("Shape is null, clearing active shape.");
//       // Remove Actor Points from the scene
//       this.subNodes.forEach((node, id) => {
//         if (node instanceof CSS2DObject) {
//           this.activeShape?.remove(node);
//         }
//         this.subNodes.delete(id);
//       });
//       this.editorNodes.clear();
//       this.subEdges.clear();
//       this.editorEdges.clear();
//       this.activeShape = null;

//       return;
//     }

//     if (this.activeShape) {
//       this.activeShape._edit = false;
//       this.activeShape = null;
//     }

//     this.activeShape = shape;
//     this.activeShape._edit = true;

//     this.addAchorPointsToShape();
//   }

//   addAchorPointsToShape() {
//     if (!this.activeShape) {
//       console.warn("No active shape to add anchor points to.");
//       return;
//     }

//     this.editorMesh.position.copy(this.activeShape.position);

//     const coordinates = this.activeShape.propertySet.coordinates;
//     for (const coord of coordinates) {
//       console.log('Adding Anchor Point:', coord);
//       const anchorId = `pointAnchor${generateUUID()}`;
//       this.editorNodes.set(anchorId, coordinates.indexOf(coord));

//       const anchorMesh = new THREE.Mesh(
//         new THREE.CircleGeometry(1, 32),
//         new THREE.MeshBasicMaterial({ color: 0x4460FF })
//       );
//       anchorMesh.rotateX(-Math.PI / 2);
//       anchorMesh.name = anchorId;
//       anchorMesh.renderOrder = 1;
      
//       const anchorPointPosition = new THREE.Vector3(coord[0], 0.001, coord[2]).applyMatrix4(this.activeShape.matrixWorld);
//       const anchorLocal = this.activeShape.worldToLocal(anchorPointPosition.clone());
//       anchorMesh.position.copy(anchorLocal);

//       this.editorMesh.add(anchorMesh);
//       this.subNodes.set(anchorId, anchorMesh);
//     }

//     this.scene.add(this.editorMesh);

//     this.editorMesh.rotation.set(0, 0, 0);
//     // Apply yaw to the editor mesh if the active shape has a yaw property
//     if (this.activeShape instanceof PolygonShape) {
//       this.editorMesh.rotation.y = THREE.MathUtils.degToRad(this.activeShape.yaw);
//     }

//     // Adjusting the final position of the editor mesh
//     const boxFromEditor = new THREE.Box3().setFromObject(this.editorMesh);
//     const center = boxFromEditor.getCenter(new THREE.Vector3());
//     const offset = this.activeShape.position.clone().sub(center);
//     this.editorMesh.position.add(offset);
//   }

//   addAnchorStyles() {

//   }

//   update(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
//     if (!this.activeShape) return;

//     const screenSize = new THREE.Vector2();
//     renderer.getSize(screenSize);

//     const desiredPixelSize = 7; // how big each anchor should look in pixels
//     const tempV = new THREE.Vector3();

//     const ndcToWorld = (nodePos: THREE.Vector3, pixelSize: number) => {
//       // Project world position to NDC space
//       const ndc = nodePos.clone().project(camera);

//       // Offset in NDC for the given pixel size
//       const ndcOffset = ndc.clone();
//       ndcOffset.x += (pixelSize / screenSize.x) * 2;

//       // Convert back to world space
//       const worldOffset = ndcOffset.unproject(camera);

//       // World distance for the given pixel offset
//       return nodePos.distanceTo(worldOffset);
//     };

//     this.subNodes.forEach((node) => {
//       node.getWorldPosition(tempV);

//       // Compute correct scale in world units for fixed pixel size
//       const scaleWorldUnits = ndcToWorld(tempV, desiredPixelSize);
//       node.scale.setScalar(scaleWorldUnits);
//     });

//     // // Apply yaw to the editor mesh
//     // if (this.activeShape instanceof PolygonShape) {
//     //   this.editorMesh.rotation.set(0, 0, 0);
//     //   this.editorMesh.rotation.y = THREE.MathUtils.degToRad(this.activeShape.yaw);
//     // }
//   }
// }


// export const ShapeEditor = {
//   _instance: null as _ShapeEditor | null,

//   set scene(scene: THREE.Scene) {
//     if (!this._instance) {
//       this._instance = new _ShapeEditor();
//     }
//     this._instance.scene = scene;
//   },

//   set pencil(pencil: Pencil) {
//     if (!this._instance) {
//       this._instance = new _ShapeEditor();
//     }
//     this._instance.pencil = pencil;
//   },

//   set activeShape(shape: PolygonShape | PolyLineShape | null) {
//     if (!this._instance) {
//       this._instance = new _ShapeEditor();
//     }
//     this._instance.shape = shape;
//   },

//   update(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
//     if (this._instance) {
//       this._instance.update(camera, renderer);
//     }
//   }
// }
