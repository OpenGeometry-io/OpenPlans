import * as THREE from 'three';
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { OpenGeometry } from '../../kernel/dist';

/**
 * Note: If Camera Controls is being used, it adds cursor default property to `app` remove it
 */

interface GlyphNodesOptions {
  geometry: THREE.ShapeGeometry;
  color: string;
  text: string;
  staticZoom: boolean;
}

class BoundingMesh extends THREE.Mesh {
  private textMesh: THREE.Mesh;
  helperRegionsBox: THREE.Mesh[] = [];

  constructor(textMesh: THREE.Mesh, private glyph: GlyphNode) {
    super();
    this.createBoundingMesh(textMesh);
    this.textMesh = textMesh;
    this.enableEditing = false;
  }

  set enableEditing(edit: boolean) {
    this.visible = edit;
  }

  get enableEditing() {
    return this.visible;
  }

  recomputeBoundingMesh() {
    this.remove(...this.children);
    this.createBoundingMesh(this.textMesh);
  }

  createBoundingMesh(mesh: THREE.Mesh) {
    const box = new THREE.Box3().setFromObject(mesh);
    box.expandByScalar(0.1);

    const points = new Float32Array ([
      box.min.x, box.max.y, 0,
      box.max.x, box.max.y, 0,

      box.min.x, box.min.y, 0,
      box.max.x, box.min.y, 0,

      box.min.x, box.min.y, 0,
      box.min.x, box.max.y, 0,

      box.max.x, box.min.y, 0,
      box.max.x, box.max.y, 0,
    ]);

    // Top Line
    const topLine = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(points[0], points[1], points[2]),
      new THREE.Vector3(points[3], points[4], points[5]),
    ]);
    const topLineMesh = new THREE.Line(topLine, new THREE.LineBasicMaterial({ color: 0x1D24CA }));
    this.add(topLineMesh);

    // Bottom Line
    const bottomLine = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(points[6], points[7], points[8]),
      new THREE.Vector3(points[9], points[10], points[11]),
    ]);
    const bottomLineMesh = new THREE.Line(bottomLine, new THREE.LineBasicMaterial({ color: 0x1D24CA }));
    this.add(bottomLineMesh);

    // Left Line
    const leftLine = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(points[12], points[13], points[14]),
      new THREE.Vector3(points[15], points[16], points[17]),
    ]);
    const leftLineMesh = new THREE.Line(leftLine, new THREE.LineBasicMaterial({ color: 0x1D24CA }));
    this.add(leftLineMesh);

    // Right Line
    const rightLine = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(points[18], points[19], points[20]),
      new THREE.Vector3(points[21], points[22], points[23]),
    ]);
    const rightLineMesh = new THREE.Line(rightLine, new THREE.LineBasicMaterial({ color: 0x1D24CA }));
    this.add(rightLineMesh);

    // Boxes for the Corners
    // Left Top
    const leftTopPlane = new THREE.PlaneGeometry(0.1, 0.1);
    const leftTopMesh = new THREE.Mesh(leftTopPlane, new THREE.MeshBasicMaterial({ color: 0x1D24CA })); 
    leftTopMesh.position.set(points[0], points[1], 0);
    leftTopMesh.name = 'left-top-corner';

    // Left Top Rot Region
    const leftTopRotRegion = new THREE.PlaneGeometry(0.2, 0.2);
    const leftTopRotMesh = new THREE.Mesh(leftTopRotRegion, new THREE.MeshBasicMaterial({ color: 0x1D24CA, wireframe: true }));
    leftTopRotMesh.name = 'left-top-rot-region';
    leftTopRotMesh.position.set(-0.1, 0.1, 0);
    leftTopRotMesh.userData = { glyphNode: this.glyph };
    this.helperRegionsBox.push(leftTopRotMesh);
    leftTopMesh.add(leftTopRotMesh);

    this.add(leftTopMesh);

    // Right Top
    const rightTopPlane = new THREE.PlaneGeometry(0.1, 0.1);
    const rightTopMesh = new THREE.Mesh(rightTopPlane, new THREE.MeshBasicMaterial({ color: 0x1D24CA }));
    rightTopMesh.position.set(points[3], points[4], 0);
    rightTopMesh.name = 'right-top-corner';

    // Right Top Rot Region
    const rightTopRotRegion = new THREE.PlaneGeometry(0.2, 0.2);
    const rightTopRotMesh = new THREE.Mesh(rightTopRotRegion, new THREE.MeshBasicMaterial({ color: 0x1D24CA, wireframe: true }));
    rightTopRotMesh.name = 'right-top-rot-region';
    rightTopRotMesh.position.set(0.1, 0.1, 0);
    rightTopRotMesh.userData = { glyphNode: this.glyph };
    this.helperRegionsBox.push(rightTopRotMesh);
    rightTopMesh.add(rightTopRotMesh);

    this.add(rightTopMesh);

    // Left Bottom
    const leftBottomPlane = new THREE.PlaneGeometry(0.1, 0.1);
    const leftBottomMesh = new THREE.Mesh(leftBottomPlane, new THREE.MeshBasicMaterial({ color: 0x1D24CA }));
    leftBottomMesh.position.set(points[6], points[7], 0);
    leftBottomMesh.name = 'left-bottom-corner';

    // Left Bottom Rot Region
    const leftBottomRotRegion = new THREE.PlaneGeometry(0.2, 0.2);
    const leftBottomRotMesh = new THREE.Mesh(leftBottomRotRegion, new THREE.MeshBasicMaterial({ color: 0x1D24CA, wireframe: true }));
    leftBottomRotMesh.name = 'left-bottom-rot-region';
    leftBottomRotMesh.position.set(-0.1, -0.1, 0);
    leftBottomRotMesh.userData = { glyphNode: this.glyph };
    this.helperRegionsBox.push(leftBottomRotMesh);
    leftBottomMesh.add(leftBottomRotMesh);

    this.add(leftBottomMesh);

    // Right Bottom
    const rightBottomPlane = new THREE.PlaneGeometry(0.1, 0.1);
    const rightBottomMesh = new THREE.Mesh(rightBottomPlane, new THREE.MeshBasicMaterial({ color: 0x1D24CA }));
    rightBottomMesh.position.set(points[9], points[10], 0);
    rightBottomMesh.name = 'right-bottom-corner';

    // Right Bottom Rot Region
    const rightBottomRotRegion = new THREE.PlaneGeometry(0.2, 0.2);
    const rightBottomRotMesh = new THREE.Mesh(rightBottomRotRegion, new THREE.MeshBasicMaterial({ color: 0x1D24CA, wireframe: true }));
    rightBottomRotMesh.name = 'right-bottom-rot-region';
    rightBottomRotMesh.position.set(0.1, -0.1, 0);
    rightBottomRotMesh.userData = { glyphNode: this.glyph };
    this.helperRegionsBox.push(rightBottomRotMesh);
    rightBottomMesh.add(rightBottomRotMesh);

    this.add(rightBottomMesh);
  }
}

export class GlyphNode extends THREE.Group {
  staticZoom: boolean = true;
  baseRotation: number = 0;
  isDragging: boolean = false;
  
  private text: string;
  fontSize: number = 1;

  // Meshes and Helper Mesh
  textMesh: THREE.Mesh;
  boundMesh: BoundingMesh;
  helperRegionsBox: THREE.Mesh[] = [];

  constructor(private options: GlyphNodesOptions) {
    super();

    this.text = options.text;
    const textGeometry = options.geometry;
    textGeometry.computeBoundingBox();
    this.staticZoom = options.staticZoom;
    
    if (!textGeometry.boundingBox) {
      throw new Error('BoundingBox is null');
    }

    const xMid = -0.5 * (textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x);
    const yMid = -0.5 * (textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y);
    const zMid = -0.5 * (textGeometry.boundingBox.max.z - textGeometry.boundingBox.min.z);
    textGeometry.translate( xMid, yMid, zMid );
    const material = new THREE.MeshBasicMaterial({ color: options.color, side: THREE.DoubleSide });
    this.textMesh = new THREE.Mesh(textGeometry, material);
    textGeometry.computeBoundingBox();

    this.boundMesh = new BoundingMesh(this.textMesh, this);
    this.add(this.boundMesh);
    this.add(this.textMesh);
  }

  updateText(textGeometry: THREE.ShapeGeometry, text: string) {
    this.text = text;
    this.remove(this.textMesh);
    this.remove(this.boundMesh);

    textGeometry.computeBoundingBox();
    if (!textGeometry.boundingBox) {
      throw new Error('BoundingBox is null');
    }
    
    const xMid = -0.5 * (textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x);
    const yMid = -0.5 * (textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y);
    const zMid = -0.5 * (textGeometry.boundingBox.max.z - textGeometry.boundingBox.min.z);
    textGeometry.translate( xMid, yMid, zMid );

    const material = new THREE.MeshBasicMaterial({ color: this.options.color, side: THREE.DoubleSide });
    this.textMesh = new THREE.Mesh(textGeometry, material);
    textGeometry.computeBoundingBox();

    this.boundMesh = new BoundingMesh(this.textMesh, this);
    this.add(this.textMesh);
    this.add(this.boundMesh);
  }
}

class _GlyphManager {
  private _scene: THREE.Scene | null = null;
  private _camera: THREE.PerspectiveCamera | null = null;
  private _openGeometry: OpenGeometry | null = null;

  private loader: FontLoader = new FontLoader();

  private _glyphNodes: Map<string, GlyphNode> = new Map();

  private _currentFont: Font | null = null;
  private _selectorBox: THREE.Group = new THREE.Group();

  private selectorBoxes: THREE.Mesh[] = [];

  private _selectedGlyph: GlyphNode | null = null;
  private _tempDirection: THREE.Vector3 = new THREE.Vector3();
  private _selectedRotRegion: string = '';
  private _tempAngle: number = 0;

  private cameraDistance: number = 0;

  // Editor Tools
  private _isEditing: boolean = false;

  private _glyphSelectorHelper = {
    nodeCenter: new THREE.Vector3(),
    center: new THREE.Vector3(),
    direction: new THREE.Vector3(),
    angle: 0,
    baseAngleLine: new THREE.LineSegments(),
    debugMesh: new THREE.Group(),
    bounds: {
      min: new THREE.Vector3(),
      max: new THREE.Vector3()
    }
  }

  private glyphCaster = new THREE.Raycaster();

  set scene(scene: THREE.Scene) {
    this._scene = scene;

    this._scene.add(this._selectorBox);
    this._scene.add(this._glyphSelectorHelper.debugMesh);

    // Delete This Later
    const debugNodeCenter = new THREE.Mesh(new THREE.SphereGeometry(0.01), new THREE.MeshBasicMaterial({ color: 0x0000ff }));
    debugNodeCenter.name = 'debug-node-center';
    this._glyphSelectorHelper.debugMesh.add(debugNodeCenter);
    
    const debugDirectionSphere = new THREE.Mesh(new THREE.SphereGeometry(0.01), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
    debugDirectionSphere.name = 'debug-direction-sphere';
    this._glyphSelectorHelper.debugMesh.add(debugDirectionSphere);

    const lineAC = new THREE.BufferGeometry().setFromPoints([this._glyphSelectorHelper.center, this._glyphSelectorHelper.direction]);
    const lineACMesh = new THREE.LineSegments(lineAC, new THREE.LineBasicMaterial({ color: 0x0000ff }));
    lineACMesh.name = 'debug-line-ac';
    const lineAB = new THREE.BufferGeometry().setFromPoints([this._glyphSelectorHelper.center, this._glyphSelectorHelper.center]);
    const lineABMesh = new THREE.LineSegments(lineAB, new THREE.LineBasicMaterial({ color: 0xff0000 }));
    lineABMesh.name = 'debug-line-ab';
    this._glyphSelectorHelper.debugMesh.add(lineABMesh);
    this._glyphSelectorHelper.debugMesh.add(lineACMesh);
  }

  set camera(camera: THREE.PerspectiveCamera) {
    this._camera = camera;

    this.setupEvents();
  }

  set openGeometry(openGeometry: OpenGeometry) {
    this._openGeometry = openGeometry;
  }

  get openGeometry() {
    if (!this._openGeometry) {
      throw new Error('OpenGeometry not assigned');
    }
    return this._openGeometry;
  }

  constructor() {
    this.loader.load('./Imprima_Regular.json', (font) => {
      this._currentFont = font;
    });
  }

  setupEvents() {
    console.log('Setting up events');
    this.setupTransformation();
  }

  private checkAssigmnet() {
    if (this._scene === null) {
      throw new Error('Scene not assigned');
    }
  }

  updateSelectorBox(minEnd = new THREE.Vector3(-1, 0, -1), maxEnd = new THREE.Vector3(1, 0, 1)) {
    this.checkAssigmnet();

    if (this._selectorBox) {
      this._selectorBox.visible = false;
      this._selectorBox.children = [];
    }

    const points = new Float32Array ([
      minEnd.x, 0, minEnd.z,
      maxEnd.x, 0, minEnd.z,

      minEnd.x, 0, maxEnd.z,
      maxEnd.x, 0, maxEnd.z,

      minEnd.x, 0, minEnd.z,
      minEnd.x, 0, maxEnd.z,

      maxEnd.x, 0, minEnd.z,
      maxEnd.x, 0, maxEnd.z,
    ]);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(points, 3));
    const lineMesh = new THREE.LineSegments(lineGeometry, 
      new THREE.LineBasicMaterial({ color: 0x1D24CA })
    );
    lineMesh.userData = { type: 'glyph-box-lines' };
    this._selectorBox.add(lineMesh);

    if (this._selectorBox) this._selectorBox.visible = true;
  }

  get glyphNodes() {
    return this._glyphNodes;
  }

  addGlyph(text: string, size: number, color: string, staticZoom: boolean = true) {
    this.checkAssigmnet();

    const shape = this._currentFont?.generateShapes(text, size * 0.1);
    const geometry = new THREE.ShapeGeometry(shape);

    const glyphNodes = new GlyphNode({
      geometry: geometry,
      text: text,
      color: color,
      staticZoom: staticZoom
    });

    // It is important to set the size of the glyph node, so that it can be used for scaling and editing later
    glyphNodes.fontSize = size;

    glyphNodes.rotation.x = -(Math.PI / 2);
    glyphNodes.updateMatrixWorld(true);
    this._scene?.add(glyphNodes);
    this._glyphNodes.set(glyphNodes.uuid, glyphNodes);

    for (const region of glyphNodes.boundMesh.helperRegionsBox) {
      this.selectorBoxes.push(region);
    }

    return glyphNodes;
  }

  updateGlyphText(id: string, text: string) {
    this.checkAssigmnet();

    const glyphNode = this._glyphNodes.get(id);
    if (!glyphNode) throw new Error('Glyph Node not found');

    // remove selector boxes
    for (const region of glyphNode.boundMesh.helperRegionsBox) {
      this.selectorBoxes = this.selectorBoxes.filter((box) => box.uuid !== region.uuid);
    }

    const isEditingActive = glyphNode.boundMesh.enableEditing;

    const shape = this._currentFont?.generateShapes(text, glyphNode.fontSize * 0.1);
    const geometry = new THREE.ShapeGeometry(shape);
    glyphNode.updateText(geometry, text);

    // Add Selector Boxes
    for (const region of glyphNode.boundMesh.helperRegionsBox) {
      this.selectorBoxes.push(region);
    }

    // If Editing is Active, re-enable it
    if (isEditingActive) {
      this.selectGlyph(id);
    }
  }

  setupTransformation() {

    // For Changing Cursor
    window.addEventListener("mousemove", (event) => {
      const pointer = new THREE.Vector2();
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

      if (!this._camera || !this._scene) return;
      this.glyphCaster.setFromCamera(pointer, this._camera);

      const intersects = this.glyphCaster.intersectObjects(this.selectorBoxes);
      if (intersects.length > 0) {
        const object = intersects[0].object;

        // If Glyph is not selected, disable mousemove
        if (object.userData.glyphNode.uuid !== this._selectedGlyph?.uuid) {
          document.body.style.cursor = "default";
          return;
        }

        if (object.name === 'left-top-rot-region' || object.name === 'right-top-rot-region' || object.name === 'left-bottom-rot-region' || object.name === 'right-bottom-rot-region') {
          document.body.style.cursor = `url('https://opengeometry-43705.web.app/Open-Plans-Resources/${object.name}-cursor.png') 10 10, default`;
          this._selectedRotRegion = object.name;
        }
      } else {
        document.body.style.cursor = "default";
      }

      // If Editing is Enabled
      if (!this._isEditing) return;

      const intersectsGround = this.glyphCaster.intersectObjects([this._scene.getObjectByName('pencil-ground') as THREE.Mesh]);
      if (intersectsGround.length > 0) {
        document.body.style.cursor = `url('https://opengeometry-43705.web.app/Open-Plans-Resources/${this._selectedRotRegion}-cursor.png') 10 10, default`;
        const point = intersectsGround[0].point;
        console.log(point);

        // Direction Mesh
        const rotMesh = this._selectedGlyph?.boundMesh.helperRegionsBox.find((mesh) => mesh.name === this._selectedRotRegion);
        if (!rotMesh) return;

        const rotMeshWorldPosition = this._tempDirection;
        const directionMesh = this._glyphSelectorHelper.debugMesh.getObjectByName('debug-direction-sphere') as THREE.Mesh;
        directionMesh.position.copy(rotMeshWorldPosition);
        
        const debugLineAB = this._glyphSelectorHelper.debugMesh.getObjectByName('debug-line-ab') as THREE.LineSegments;
        const lineABGeometry = new THREE.BufferGeometry().setFromPoints([this._glyphSelectorHelper.center, point]);
        debugLineAB.geometry = lineABGeometry;

        const debugLineAC = this._glyphSelectorHelper.debugMesh.getObjectByName('debug-line-ac') as THREE.LineSegments;
        const lineACGeometry = new THREE.BufferGeometry().setFromPoints([this._glyphSelectorHelper.center, rotMeshWorldPosition]);
        debugLineAC.geometry = lineACGeometry;

        const lineAB = point.clone().sub(this._glyphSelectorHelper.center).normalize();
        const lineAC = rotMeshWorldPosition.clone().sub(this._glyphSelectorHelper.center).normalize();
        const angle = ((lineAB.clone().cross(lineAC).y < 0 ? 1 : -1) * Math.acos(lineAB.dot(lineAC)) * 180 / Math.PI);

        const baseAngle = this._selectedGlyph?.baseRotation as number;
        console.log(`Base Angle: ${baseAngle}`);
        this._tempAngle = angle;
        this.rotateGlyph(this._selectedGlyph?.uuid as string, baseAngle + angle);
      }
    });

    window.addEventListener("mousedown", (event) => {
      const pointer = new THREE.Vector2();
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

      if (!this._camera || !this._scene) return;
      this.glyphCaster.setFromCamera(pointer, this._camera);

      const intersects = this.glyphCaster.intersectObjects(this.selectorBoxes);
      if (intersects.length > 0) {
        const object = intersects[0].object;

        // If Glyph is not selected, disable mousedown
        if (object.userData.glyphNode.uuid !== this._selectedGlyph?.uuid) {
          document.body.style.cursor = "default";
          return;
        }

        if (object.name === 'left-top-rot-region' || object.name === 'right-top-rot-region' || object.name === 'left-bottom-rot-region' || object.name === 'right-bottom-rot-region') {
          this._isEditing = true;
          this._selectedGlyph = object.userData.glyphNode;

          const rotMesh = this._selectedGlyph?.boundMesh.helperRegionsBox.find((mesh) => mesh.name === object.name);
          if (!rotMesh) return;

          const rotMeshWorldPosition = new THREE.Vector3();
          rotMesh.getWorldPosition(rotMeshWorldPosition);
          this._tempDirection.copy(rotMeshWorldPosition);

          if (this._selectedGlyph) this._selectedGlyph.isDragging = true;
        }
      }
    });

    window.addEventListener("mouseup", (event) => {
      this._isEditing = false;
      document.body.style.cursor = "default";

      if (this._selectedGlyph) {
        this._selectedGlyph.isDragging = false;
        this._selectedGlyph.baseRotation += this._tempAngle;
        this._tempAngle = 0;
        console.log(`Base Angle: ${this._selectedGlyph.baseRotation}`);
      }

    });
  }

  /**
   * Create a Boundary around the Glyph Text
   */
  selectGlyph(id: string) {
    const glyphNode = this._glyphNodes.get(id);
    if (!glyphNode) throw new Error('Glyph Node not found');

    this._selectedGlyph = glyphNode;
    glyphNode.boundMesh.enableEditing = true;

    const box = new THREE.Box3().setFromObject(glyphNode);
    const center = new THREE.Vector3();
    box.getCenter(center);
    this._glyphSelectorHelper.center = center;
    this._glyphSelectorHelper.debugMesh.getObjectByName('debug-node-center')?.position.copy(center);
  }

  /**
   * Clear All Selections
   */
  clearSelection() {
    if (this._selectedGlyph) {
      this._selectedGlyph.boundMesh.enableEditing = false;
      this._selectedGlyph = null;
      console.log('Cleared Selection');
      console.log(this._selectedGlyph);
    }
  }

  updateManager(camera: THREE.PerspectiveCamera) {
    const cameraDistance = camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
    if (!(cameraDistance > this.cameraDistance + 1 || cameraDistance < this.cameraDistance - 1)) return;
    
    for (const [, glyphNode] of this._glyphNodes) {
      if (!glyphNode.staticZoom) {
        const rawScale = (camera.position).distanceTo(glyphNode.position) * 0.135 ;
        for (const child of glyphNode.boundMesh.children) {
          if (child.name === 'left-top-corner' || child.name === 'right-top-corner' || child.name === 'left-bottom-corner' || child.name === 'right-bottom-corner') {
            child.scale.set(rawScale, rawScale, rawScale);
          }
        }
      }
    }
  }

  /**
   * 
   * @param id ID of the Glyph Node
   * @param angle Rotation Angle in Degrees
   */
  rotateGlyph(id: string, angle: number) {
    const glyphNode = this._glyphNodes.get(id);
    if (!glyphNode) throw new Error('Glyph Node not found');
    
    const radians = angle * Math.PI / 180;
    glyphNode.rotation.z = radians;
  }

  getGlyph(id: string): GlyphNode | undefined {
    return this._glyphNodes.get(id);
  }
}

let glyphManager: _GlyphManager | null = null;

export const Glyphs = (() => {
  if (!glyphManager) {
    glyphManager = new _GlyphManager();
  }
  return glyphManager;
})();
