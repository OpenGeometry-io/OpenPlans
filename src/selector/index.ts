// import { OpenPlans } from "..";
// import { PolygonShape, PolyLineShape } from "../shape";
// import * as THREE from 'three';
// import { Pencil } from "../kernel/dist/src/pencil";

// // This class will handle the selection of shapes, including moving, resizing, and rotating them.
// export class _ShapeSelector {
//   // TODO: Allow selection of multiple shapes
//   activeShape: PolygonShape | PolyLineShape | null = null;
//   private bounds: THREE.Box3 | null = null;

//   #scene: THREE.Scene | null = null;
//   private _pencil: Pencil | null = null;

//   isTransforming: boolean = false;
//   initialCursorPos = new THREE.Vector3(0, 0, 0);
//   initialFirstPosition = new THREE.Vector3(0, 0, 0);

//   constructor() {
    
//   }

//   set pencil(pencil: Pencil) {
//     this._pencil = pencil;

//     this.pencil.onCursorMove.add((coords) => {
//       this.handlePencilCursorMove(coords);
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
//     // if (this.activeShape === shape) return; // No change in selection
//     if (!shape) {
//       if (this.activeShape) {
//         this.activeShape._selected = false; // Deselect the previously active shape
//       }
//       this.activeShape = null; // Clear the active shape
//       const controlsDiv = document.querySelector('.shape-controls-boundary') as HTMLDivElement;
//       if (controlsDiv) {
//         controlsDiv.remove(); // Remove the controls div if it exists
//       }
//       this.bounds = null; // Clear the bounds
//       this.initialFirstPosition.set(0, 0, 0); // Reset initial position
//       this.isTransforming = false; // Reset transforming state
//       console.log("Shape selection cleared");
//       return;
//     }


//     if (this.activeShape) {
//       this.activeShape._selected = false; // Deselect the previously active shape
//     }

//     this.activeShape = shape;
//     if (this.activeShape) {
//       this.activeShape._selected = true;
//     }

//     // Add Controls for the active shape
//     this.addControlsToActiveShape();
//   }

//   addControlsToActiveShape() {
//     if (!this.activeShape) return;

//     // Create a div with controls for the active shape
//     const controlsDiv = document.createElement('div');
//     document.body.appendChild(controlsDiv);
//     controlsDiv.className = 'shape-controls-boundary';
//     controlsDiv.style.position = 'absolute';

//     // Get bounding box of the active shape
//     const boundingBox = new THREE.Box3().setFromObject(this.activeShape);
//     const min = boundingBox.min;
//     const max = boundingBox.max;
//     this.bounds = boundingBox;
    
//     this.initialFirstPosition = this.activeShape.position.clone();
//     // Convert the center to screen coordinates
//     const leftTopScreenPos = OpenPlans.toScreenPosition(min);
//     const rightBottomScreenPos = OpenPlans.toScreenPosition(max);

//     controlsDiv.style.left = `${leftTopScreenPos.x - 15}px`;
//     controlsDiv.style.top = `${leftTopScreenPos.y - 15}px`;
//     controlsDiv.style.width = `${rightBottomScreenPos.x - leftTopScreenPos.x + 28}px`;
//     controlsDiv.style.height = `${rightBottomScreenPos.y - leftTopScreenPos.y + 28}px`;

//     // Translator Controls
//     const translatorDiv = document.createElement('div');
//     translatorDiv.className = 'shape-controls-translator';
//     translatorDiv.style.position = 'absolute';
//     translatorDiv.style.width = '100%';
//     translatorDiv.style.height = '100%';
//     translatorDiv.style.border = '1.5px solid #4460FF';
//     translatorDiv.style.pointerEvents = 'auto'; // Allow mouse events on the controls div
//     translatorDiv.style.cursor = 'move';
//     controlsDiv.appendChild(translatorDiv);

//     // Rotator Controls
//     const rotatorDiv = document.createElement('div');
//     rotatorDiv.className = 'shape-controls-rotator';
//     rotatorDiv.style.position = 'absolute';
//     rotatorDiv.style.width = '20px';
//     rotatorDiv.style.height = '20px';
//     rotatorDiv.style.backgroundColor = '#ffffff';
//     rotatorDiv.style.borderRadius = '50%';
//     rotatorDiv.style.border = '1px solid #4460FF';
//     rotatorDiv.style.bottom = '-40px'; // Position at the bottom of the controls
//     rotatorDiv.style.left = '50%'; // Position to the right of the controls
//     rotatorDiv.style.transform = 'translateY(-50%)'; // Adjust for centering
//     rotatorDiv.style.pointerEvents = 'auto'; // Allow mouse events on the rotator
//     rotatorDiv.style.cursor = 'alias';
//     controlsDiv.appendChild(rotatorDiv);

//     this.addEventListeners(controlsDiv);
//     this.addEventListenersToRotator(rotatorDiv);
//   }

//   addEventListenersToRotator(rotatorDiv: HTMLDivElement) {
//     rotatorDiv.addEventListener('mousedown', (event) => {
//       if (!this.activeShape) return;
//       this.isTransforming = true; // Start transforming the shape
//       console.log("Rotator mouse down on shape selector");
//     });

//     rotatorDiv.addEventListener('mousemove', (event) => {
//       if (!this.activeShape || !this.isTransforming) return;

//       // Calculate the rotation based on mouse movement
//       const deltaX = event.movementX;
//       const deltaY = event.movementY;
//       const rotationAngle = Math.atan2(deltaY, deltaX);

//       // Apply the rotation to the active shape
//       this.activeShape.rotation.y += rotationAngle;

//       // Update the bounds based on the new position
//       this.bounds = new THREE.Box3().setFromObject(this.activeShape);
//     });
//   }

//   addEventListeners(selectorDiv: HTMLDivElement) {
//     selectorDiv.addEventListener('mousedown', (event) => this.onMouseDown(event));
//     selectorDiv.addEventListener('mousemove', (event) => this.onMouseMove(event));
//     selectorDiv.addEventListener('mouseup', (event) => this.onMouseUp(event));
//   }

//   onMouseDown(event: MouseEvent) {
//     if (!this.activeShape) return;

//     // Start transforming the shape
//     this.isTransforming = true;
//     this.pencil.fireCursor(event);
//   }

//   onMouseMove(event: MouseEvent) {
//     if (!this.activeShape || !this.isTransforming) return;

//     this.pencil.fireCursorMove(event);
//   }

//   onMouseUp(event: MouseEvent) {
//     if (!this.activeShape || !this.isTransforming) return;

//     // Stop transforming the shape
//     this.isTransforming = false;
//     console.log("Mouse up on shape selector");
//     this.initialFirstPosition = this.activeShape.position.clone();

//     // Apply the transformation to the active shape, the vertices would change based on the transformation matrix
//     this.activeShape.saveTransformationToBREP();
//   }

//   handlePencilCursorMove(xzPlaneCoords: THREE.Vector3) {
//     if (!this.activeShape || !this.isTransforming) return;

//     // TODO: Add translateObject to all shapes
//     if (this.activeShape instanceof PolygonShape) {
//       // calculate offset from initial cursor position
//       const offset = xzPlaneCoords.clone().sub(this.initialCursorPos).add(this.initialFirstPosition);
//       // translate the shape by the offset
//       this.activeShape.position.copy(offset);
//       this.activeShape.placement(offset.x, offset.y, offset.z);

//       // Update the bounds based on the new position
//       this.bounds = new THREE.Box3().setFromObject(this.activeShape);
//       const min = this.bounds.min;
//       const max = this.bounds.max;

//       const leftTopScreenPos = OpenPlans.toScreenPosition(min);
//       const rightBottomScreenPos = OpenPlans.toScreenPosition(max);

//       const controlsDiv = document.querySelector('.shape-controls-boundary') as HTMLDivElement;
//       if (controlsDiv) {
//         controlsDiv.style.left = `${leftTopScreenPos.x - 15}px`;
//         controlsDiv.style.top = `${leftTopScreenPos.y - 15}px`;
//         controlsDiv.style.width = `${rightBottomScreenPos.x - leftTopScreenPos.x + 28}px`;
//         controlsDiv.style.height = `${rightBottomScreenPos.y - leftTopScreenPos.y + 28}px`;
//       }
//     }
//   }

//   update() {
//     if (!this.activeShape || this.isTransforming) return;

//     if (!this.bounds) {
//       this.bounds = new THREE.Box3().setFromObject(this.activeShape);
//     }

//     // Since the shape won't be in edit mode when it is selected, we can skip the bounding box calculation
//     // Update the controls position and size based on the active shape's bounding box
//     // const boundingBox = new THREE.Box3().setFromObject(this.activeShape);
//     // const min = boundingBox.min;
//     // const max = boundingBox.max;

//     // const minLocal = this.bounds.min;
//     // const maxLocal = this.bounds.max;

//     // const min = minLocal.clone().applyMatrix4(this.activeShape.matrixWorld);
//     // const max = maxLocal.clone().applyMatrix4(this.activeShape.matrixWorld);

//     const min = this.bounds.min;
//     const max = this.bounds.max;

//     const leftTopScreenPos = OpenPlans.toScreenPosition(min);
//     const rightBottomScreenPos = OpenPlans.toScreenPosition(max);

//     const controlsDiv = document.querySelector('.shape-controls-boundary') as HTMLDivElement;
//     if (controlsDiv) {
//       controlsDiv.style.left = `${leftTopScreenPos.x - 15}px`;
//       controlsDiv.style.top = `${leftTopScreenPos.y - 15}px`;
//       controlsDiv.style.width = `${rightBottomScreenPos.x - leftTopScreenPos.x + 28}px`;
//       controlsDiv.style.height = `${rightBottomScreenPos.y - leftTopScreenPos.y + 28}px`;
//     }


//     // Check for rotation of the active shape
//     if (this.activeShape.rotation.y !== 0) {
//       console.log("Active shape rotation:", this.activeShape.rotation.y);
//       const rotatorDiv = document.querySelector('.shape-controls-rotator') as HTMLDivElement;
//       if (rotatorDiv) {
//         // Update the position of the rotator based on the active shape's rotation
//         const center = this.activeShape.position.clone();
//         const offsetX = Math.cos(this.activeShape.rotation.y) * 20; // Adjust the distance as needed
//         const offsetZ = Math.sin(this.activeShape.rotation.y) * 20; // Adjust the distance as needed
//         rotatorDiv.style.left = `${OpenPlans.toScreenPosition(center).x + offsetX}px`;
//         rotatorDiv.style.top = `${OpenPlans.toScreenPosition(center).y + offsetZ}px`;
//       }
//     }
//   }
// };

// export const ShapeSelector = {
//   _instance: null as _ShapeSelector | null,

//   set scene(scene: THREE.Scene) {
//     if (this._instance) {
//       this._instance.scene = scene; // Set the scene for the existing instance
//     } else {
//       this._instance = new _ShapeSelector();
//       this._instance.scene = scene; // Create a new instance with the scene
//     }
//   },

//   set pencil(pencil: Pencil) {
//     if (this._instance) {
//       this._instance.pencil = pencil; // Set the pencil for the existing instance
//     } else {
//       this._instance = new _ShapeSelector();
//       this._instance.pencil = pencil; // Create a new instance with the pencil
//     }
//   },

//   update() {
//     if (this._instance) {
//       this._instance.update(); // Update the active shape's controls
//     }
//   },

//   select(shape: PolygonShape | PolyLineShape) {
//     if (this._instance) {
//       this._instance.shape = shape; // Set the new shape
//     } else {
//       console.log("Creating new ShapeSelector instance");
//       this._instance = new _ShapeSelector();
//       this._instance.shape = shape; // Set the initial shape
//     }
//   },

//   clearSelection() {
//     if (this._instance) {
//       this._instance.shape = null;
//     }
//   }
// };
