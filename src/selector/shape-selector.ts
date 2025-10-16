import { PolygonShape, PolyLineShape } from "../primitives";
import * as THREE from 'three';
import { Pencil } from "../kernel/dist/src/pencil";
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

// When dragging -> update the position of the overall shape '.applyTransform()'
// When dragging ends -> update the geometry of the shape '.updateGeometry()'

// This class will handle the selection of shapes, including moving, resizing, and rotating them.
export class _ShapeSelector {
  // TODO: Allow selection of multiple shapes
  activeShape: PolygonShape | PolyLineShape | null = null;

  private selectorMesh: THREE.Group = new THREE.Group();

  #scene: THREE.Scene | null = null;
  private _pencil: Pencil | null = null;

  isDragging: boolean = false;
  isHovering: boolean = false;
  isPicked: boolean = false;

  isTransforming: boolean = false;
  initialCursorPos = new THREE.Vector3(0, 0, 0);
  initialFirstPosition = new THREE.Vector3(0, 0, 0);

  private selectorBounds: { 
    min: THREE.Vector3; 
    max: THREE.Vector3;
    center: THREE.Vector3
  } | null = null;
  
  private selectorBoundsMeshs: { [key: string]: THREE.Mesh } = {};

  constructor() {
    
  }

  set pencil(pencil: Pencil) {
    this._pencil = pencil;

    this.pencil.onElementHover.add((data) => {
      const { mesh, point } = data;
      if (mesh.name !== this.activeShape?.ogid + '-overlay-selector') return

      // If Element is only hovered upon
      if (!this.isPicked) {
        this.isHovering = true; // Set hovering state
        //this.handleHover();
      }

      // If Element is picked, it would be used to move the shape
      if (this.isPicked) {
        this.isHovering = false; // Reset hovering state
        this.isDragging = true; // Set dragging state
        this.handleDrag(point);
      }

      // TODO: Do Dragging using Edge Selector
      // Use mesh.name === this.activeShape.ogid + '-edge-selector'
    });

    this.pencil.onElementSelected.add((data) => {
      const { mesh, point } = data;
      if (mesh.name === this.activeShape?.ogid + '-overlay-selector') {
        console.log('Selected active shape:', this.activeShape?.ogid);
        this.isPicked = true; // Set picked state to true
        this.initialCursorPos.copy(point); // Store the initial cursor position
        // TODO: Once the shape is selected, scale the selector mesh to the bounds of the shape
        // This will help with smoother dragging and won't loose the mouse drop
      }
    });

    this.pencil.onElementUnselected.add((data) => {
      const { mesh } = data;
      if (mesh.name === this.activeShape?.ogid + '-overlay-selector') {
        console.log('Unselected active shape:', this.activeShape?.ogid);
        
        this.isPicked = false; // Reset picked state
        this.isDragging = false; // Reset dragging state

        this.initialFirstPosition.copy(this.activeShape?.position || new THREE.Vector3(0, 0, 0)); // Reset initial position
      }
    });
  }

  get pencil() {
    if (this._pencil) {
      return this._pencil
    } else {
      throw new Error("Pencil is not set for this PolyLine.");
    }
  }

  set scene(scene: THREE.Scene) {
    this.#scene = scene;
  }

  get scene() {
    if (!this.#scene) {
      throw new Error("Scene is not set. Please set the scene before accessing it.");
    }
    return this.#scene;
  }

  set shape(shape: PolygonShape | PolyLineShape | null) {
    // if (this.activeShape === shape) return; // No change in selection
    if (!shape) {
      console.warn("Shape is null, clearing active shape.");
      // Remove Actor Points from the scene
      this.selectorMesh.removeFromParent();
      this.activeShape = null;
      this.isPicked = false;
      this.isDragging = false;
      this.isHovering = false;
      this.isTransforming = false;
      this.initialCursorPos.set(0, 0, 0);
      this.initialFirstPosition.set(0, 0, 0);
      return;
    }

    // TODO: Handle case where shape is already selected
    // if (this.activeShape) {
    //   this.activeShape._selected = false; // Deselect the previously active shape
    //   this.pencil.mode = 'select'; // Set pencil mode to select
    // }

    this.activeShape = shape;
    this.activeShape._selected = true;
    this.pencil.mode = 'select';

    // Add Controls for the active shape
    this.addControlsToActiveShape();
  }

  addControlsToActiveShape() {
    if (!this.activeShape) return;

    // Get bounding box of the active shape and minus the rotation as that affects the bounds
    // TODO: Or use OBB for more accurate bounds
    const activeClone = this.activeShape.clone();
    activeClone.rotation.set(0, 0, 0); // Reset rotation for accurate bounds calculation
    activeClone.updateMatrixWorld(); // Ensure the matrix is updated
    const boundingBox = new THREE.Box3().setFromObject(activeClone);
    const min = boundingBox.min;
    const max = boundingBox.max;
    
    this.initialFirstPosition = this.activeShape.position.clone();

    const minWithCenterAdjusted = min.clone().sub(this.activeShape.position).subScalar(0.05);
    const maxWithCenterAdjusted = max.clone().sub(this.activeShape.position).addScalar(0.05);
    const points = [
      minWithCenterAdjusted.x, 0, minWithCenterAdjusted.z,
      maxWithCenterAdjusted.x, 0, minWithCenterAdjusted.z,
      maxWithCenterAdjusted.x, 0, maxWithCenterAdjusted.z,
      minWithCenterAdjusted.x, 0, maxWithCenterAdjusted.z,
      minWithCenterAdjusted.x, 0, minWithCenterAdjusted.z,
      maxWithCenterAdjusted.x, 0, minWithCenterAdjusted.z,
      maxWithCenterAdjusted.x, 0, maxWithCenterAdjusted.z,
      minWithCenterAdjusted.x, 0, maxWithCenterAdjusted.z
    ]
    
    const linePoints = new Float32Array(points); 
    const lineGeometry = new LineGeometry().setPositions(linePoints);
    const material = new LineMaterial({
      color: 0x4460FF,
      linewidth: 2,
      resolution: new THREE.Vector2(window.innerWidth, window.innerHeight) // important for sizing
    });
    const line = new Line2(lineGeometry, material);
    line.computeLineDistances();
    line.name = this.activeShape.ogid + '-edge-selector';
    this.selectorMesh.add(line);

    // Overlay Mesh
    const overlayGeometry = new THREE.BoxGeometry(
      maxWithCenterAdjusted.x - minWithCenterAdjusted.x,
      0.0, // Slightly raised to avoid z-fighting
      maxWithCenterAdjusted.z - minWithCenterAdjusted.z
    );
    const overlayMaterial = new THREE.MeshBasicMaterial({
      color: 0x4460FF,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide
    });
    const overlayMesh = new THREE.Mesh(overlayGeometry, overlayMaterial);
    overlayMesh.name = this.activeShape.ogid + '-overlay-selector';
    this.selectorMesh.add(overlayMesh);

    this.pencil.pencilMeshes.push(this.selectorMesh);

    this.activeShape.add(this.selectorMesh);

    // Selector bounds
    this.selectorBounds = {
      min: minWithCenterAdjusted,
      max: maxWithCenterAdjusted,
      center: new THREE.Vector3((minWithCenterAdjusted.x + maxWithCenterAdjusted.x) / 2,
        0, // Y is always 0 for the selector bounds
        (minWithCenterAdjusted.z + maxWithCenterAdjusted.z) / 2)
    };

    const minBoundMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xFF0000 })
    );
    
    minBoundMesh.position.copy(minWithCenterAdjusted);
    minBoundMesh.name = this.activeShape.ogid + '-selector-min-bound';
    this.selectorBoundsMeshs['min'] = minBoundMesh;

    const maxBoundMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x00FF00 })
    );
    maxBoundMesh.position.copy(maxWithCenterAdjusted);
    maxBoundMesh.name = this.activeShape.ogid + '-selector-max-bound';
    this.selectorBoundsMeshs['max'] = maxBoundMesh;

    const centerBoundMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x0000FF })
    );
    centerBoundMesh.position.copy(this.selectorBounds.center);
    centerBoundMesh.name = this.activeShape.ogid + '-selector-center-bound';
    this.selectorBoundsMeshs['center'] = centerBoundMesh;

    this.selectorMesh.add(minBoundMesh);
    this.selectorMesh.add(maxBoundMesh);
    this.selectorMesh.add(centerBoundMesh);
  }

  handleDrag(xzPlaneCoords: THREE.Vector3) {
    if (!this.activeShape || !this.isDragging) return;

    // if (this.activeShape instanceof PolygonShape) {
      const offset = xzPlaneCoords.clone().sub(this.initialCursorPos).add(this.initialFirstPosition);
      this.activeShape.position.copy(offset);

      // console.log('Dragging active shape:', this.activeShape.ogid);
      // @ts-ignore
      this.activeShape.positionToPlacement();

      const centerPosition = this.activeShape.localToWorld(new THREE.Vector3(0, 0, 0));
      console.log('Selector Bounds Center Position:', centerPosition);
    // }
  }

  update() {
    // if (!this.activeShape || this.isTransforming) return;
    if (!this.activeShape) return;

    // console.log('Selector Bounds Position:');
    // const worldPositionBoundsMin = new THREE.Vector3();
    // this.selectorBoundsMeshs['min'].getWorldPosition(worldPositionBoundsMin);
    // console.log('Min Bound:', worldPositionBoundsMin.x, worldPositionBoundsMin.y, worldPositionBoundsMin.z);
  }
};

export const ShapeSelector = {
  _instance: null as _ShapeSelector | null,

  set scene(scene: THREE.Scene) {
    if (this._instance) {
      this._instance.scene = scene; // Set the scene for the existing instance
    } else {
      this._instance = new _ShapeSelector();
      this._instance.scene = scene; // Create a new instance with the scene
    }
  },

  set pencil(pencil: Pencil) {
    if (this._instance) {
      this._instance.pencil = pencil; // Set the pencil for the existing instance
    } else {
      this._instance = new _ShapeSelector();
      this._instance.pencil = pencil; // Create a new instance with the pencil
    }
  },

  update() {
    if (this._instance) {
      this._instance.update(); // Update the active shape's controls
    }
  },

  select(shape: PolygonShape | PolyLineShape) {
    if (this._instance) {
      this._instance.shape = shape; // Set the new shape
    } else {
      console.log("Creating new ShapeSelector instance");
      this._instance = new _ShapeSelector();
      this._instance.shape = shape; // Set the initial shape
    }
  },

  clearSelection() {
    if (this._instance) {
      this._instance.shape = null;
    }
  }
};
