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

export class BoundingMesh extends THREE.Mesh {
  constructor() {
    super();
  }

  createBoundingMesh(mesh: THREE.Mesh) {
    const boundingMesh = new THREE.Mesh();
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
    boundingMesh.add(topLineMesh);

    // Bottom Line
    const bottomLine = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(points[6], points[7], points[8]),
      new THREE.Vector3(points[9], points[10], points[11]),
    ]);
    const bottomLineMesh = new THREE.Line(bottomLine, new THREE.LineBasicMaterial({ color: 0x1D24CA }));
    boundingMesh.add(bottomLineMesh);

    // Left Line
    const leftLine = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(points[12], points[13], points[14]),
      new THREE.Vector3(points[15], points[16], points[17]),
    ]);
    const leftLineMesh = new THREE.Line(leftLine, new THREE.LineBasicMaterial({ color: 0x1D24CA }));
    boundingMesh.add(leftLineMesh);

    // Right Line
    const rightLine = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(points[18], points[19], points[20]),
      new THREE.Vector3(points[21], points[22], points[23]),
    ]);
    const rightLineMesh = new THREE.Line(rightLine, new THREE.LineBasicMaterial({ color: 0x1D24CA }));
    boundingMesh.add(rightLineMesh);

    // Boxes for the Corners
    // Left Top
    const leftTopPlane = new THREE.PlaneGeometry(0.1, 0.1);
    const leftTopMesh = new THREE.Mesh(leftTopPlane, new THREE.MeshBasicMaterial({ color: 0x1D24CA })); 
    leftTopMesh.position.set(points[0], points[1], 0);
    leftTopMesh.name = 'left-top-corner';
    boundingMesh.add(leftTopMesh);

    // Right Top
    const rightTopPlane = new THREE.PlaneGeometry(0.1, 0.1);
    const rightTopMesh = new THREE.Mesh(rightTopPlane, new THREE.MeshBasicMaterial({ color: 0x1D24CA }));
    rightTopMesh.position.set(points[3], points[4], 0);
    rightTopMesh.name = 'right-top-corner';
    boundingMesh.add(rightTopMesh);

    // Left Bottom
    const leftBottomPlane = new THREE.PlaneGeometry(0.1, 0.1);
    const leftBottomMesh = new THREE.Mesh(leftBottomPlane, new THREE.MeshBasicMaterial({ color: 0x1D24CA }));
    leftBottomMesh.position.set(points[6], points[7], 0);
    leftBottomMesh.name = 'left-bottom-corner';
    boundingMesh.add(leftBottomMesh);

    // Right Bottom
    const rightBottomPlane = new THREE.PlaneGeometry(0.1, 0.1);
    const rightBottomMesh = new THREE.Mesh(rightBottomPlane, new THREE.MeshBasicMaterial({ color: 0x1D24CA }));
    rightBottomMesh.position.set(points[9], points[10], 0);
    rightBottomMesh.name = 'right-bottom-corner';
    boundingMesh.add(rightBottomMesh);

    return boundingMesh;
  }
}

export class GlyphNode extends THREE.Group {
  staticZoom: boolean = true;
  
  private text: string;

  // Meshes and Helper Mesh
  private textMesh: THREE.Mesh;
  boundMesh: THREE.Mesh;
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

    this.boundMesh = this.createBoundingMesh(this.textMesh);
    this.boundMesh.add(this.textMesh);
    this.boundMesh.visible = false;
    this.add(this.boundMesh);
  }

  /**
   * Rotate the actual text mesh
   * @param angle Angle in Radians
   */
  // rotateOnY(angle: number) {
  //   this.textMesh.rotation.z = angle;
  // }

  private createBoundingMesh(mesh: THREE.Mesh) {
    const boundingMesh = new THREE.Mesh();
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
    boundingMesh.add(topLineMesh);

    // Bottom Line
    const bottomLine = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(points[6], points[7], points[8]),
      new THREE.Vector3(points[9], points[10], points[11]),
    ]);
    const bottomLineMesh = new THREE.Line(bottomLine, new THREE.LineBasicMaterial({ color: 0x1D24CA }));
    boundingMesh.add(bottomLineMesh);

    // Left Line
    const leftLine = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(points[12], points[13], points[14]),
      new THREE.Vector3(points[15], points[16], points[17]),
    ]);
    const leftLineMesh = new THREE.Line(leftLine, new THREE.LineBasicMaterial({ color: 0x1D24CA }));
    boundingMesh.add(leftLineMesh);

    // Right Line
    const rightLine = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(points[18], points[19], points[20]),
      new THREE.Vector3(points[21], points[22], points[23]),
    ]);
    const rightLineMesh = new THREE.Line(rightLine, new THREE.LineBasicMaterial({ color: 0x1D24CA }));
    boundingMesh.add(rightLineMesh);

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
    leftTopRotMesh.userData = { glyphNode: this };
    this.helperRegionsBox.push(leftTopRotMesh);
    leftTopMesh.add(leftTopRotMesh);

    boundingMesh.add(leftTopMesh);

    // // Right Top
    // // const rightTopPlane = new THREE.PlaneGeometry(0.1, 0.1);
    // // const rightTopMesh = new THREE.Mesh(rightTopPlane, new THREE.MeshBasicMaterial({ color: 0x1D24CA }));
    // // rightTopMesh.position.set(points[3], points[4], 0);
    // // rightTopMesh.name = 'right-top-corner';
    // // boundingMesh.add(rightTopMesh);
    // const rightTopDiv = document.createElement('div');
    // rightTopDiv.className = 'helper-region';
    // rightTopDiv.style.backgroundColor = 'red';
    // rightTopDiv.style.width = '20px';
    // rightTopDiv.style.height = '20px';
    // rightTopDiv.style.position = 'absolute';
    // // rightTopDiv.style.top = '0';
    // // rightTopDiv.style.right = '0';
    // // rightTopDiv.style.cursor = 'pointer';
    // // rightTopDiv.style.zIndex = '100';
    // const rightTopDivMesh = new CSS2DObject(rightTopDiv);
    // rightTopDivMesh.position.set(points[3], points[4], 0);
    // boundingMesh.add(rightTopDivMesh);

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
    leftBottomRotMesh.userData = { glyphNode: this };
    this.helperRegionsBox.push(leftBottomRotMesh);
    leftBottomMesh.add(leftBottomRotMesh);

    boundingMesh.add(leftBottomMesh);

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
    rightBottomRotMesh.userData = { glyphNode: this };
    this.helperRegionsBox.push(rightBottomRotMesh);
    rightBottomMesh.add(rightBottomRotMesh);

    boundingMesh.add(rightBottomMesh);

    return boundingMesh;
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
    const debugNodeCenter = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial({ color: 0x0000ff }));
    debugNodeCenter.name = 'debug-node-center';
    this._glyphSelectorHelper.debugMesh.add(debugNodeCenter);
    
    // const debugCenterSphere = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    // debugCenterSphere.name = 'debug-center-sphere';
    // this._glyphSelectorHelper.debugMesh.add(debugCenterSphere);
    // const debugDirectionSphere = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
    // debugDirectionSphere.name = 'debug-direction-sphere';
    // this._glyphSelectorHelper.debugMesh.add(debugDirectionSphere);

    // const lineAC = new THREE.BufferGeometry().setFromPoints([this._glyphSelectorHelper.center, this._glyphSelectorHelper.direction]);
    // const lineACMesh = new THREE.LineSegments(lineAC, new THREE.LineBasicMaterial({ color: 0x0000ff }));
    // lineACMesh.name = 'debug-line-ac';
    // const lineAB = new THREE.BufferGeometry().setFromPoints([this._glyphSelectorHelper.center, this._glyphSelectorHelper.center]);
    // const lineABMesh = new THREE.LineSegments(lineAB, new THREE.LineBasicMaterial({ color: 0xff0000 }));
    // lineABMesh.name = 'debug-line-ab';

    // this._glyphSelectorHelper.debugMesh.add(lineABMesh);
    // this._glyphSelectorHelper.debugMesh.add(lineACMesh);

    console.log(this._scene);

    // this.updateSelectorBox();
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

    glyphNodes.rotation.x = -(Math.PI / 2);
    this._scene?.add(glyphNodes);
    this._glyphNodes.set(glyphNodes.uuid, glyphNodes);

    for (const region of glyphNodes.helperRegionsBox) {
      this.selectorBoxes.push(region);
    }

    return glyphNodes;
  }

  setupTransformation() {
    window.addEventListener("mousemove", (event) => {
      console.log('Moving');
      const pointer = new THREE.Vector2();
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

      if (!this._camera || !this._scene) return;
      this.glyphCaster.setFromCamera(pointer, this._camera);

      const intersects = this.glyphCaster.intersectObjects(this.selectorBoxes);
      if (intersects.length > 0) {
        const object = intersects[0].object;
        if (object.name === 'left-top-rot-region' || object.name === 'right-top-rot-region' || object.name === 'left-bottom-rot-region' || object.name === 'right-bottom-rot-region') {
          document.body.style.cursor = `url('https://opengeometry-43705.web.app/Open-Plans-Resources/${object.name}-cursor.png') 10 10, default`;
        }
      } else {
        document.body.style.cursor = "default";
      }
    });

    // Below Logic Needs to be refined or deleted
    // window.addEventListener("mousemove", (event) => {
    //   if (!this._isEditing) return;
    //   console.log('Editing');

    //   const pointer = new THREE.Vector2();
    //   pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    //   pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

    //   if (!this._camera || !this._scene) return;
    //   this.glyphCaster.setFromCamera(pointer, this._camera);
      
    //   const pencilPlane = this._scene.getObjectByName('pencil-ground') as THREE.Mesh;
    //   console.log(this._scene);
    //   const intersects = this.glyphCaster.intersectObjects([pencilPlane]);
    //   if (intersects.length > 0) {
    //     const point = intersects[0].point;

    //     const lineAB = point.clone().sub(this._glyphSelectorHelper.center).normalize();
    //     const debugLineAB = this._glyphSelectorHelper.debugMesh.getObjectByName('debug-line-ab') as THREE.LineSegments;
    //     const lineABGeometry = new THREE.BufferGeometry().setFromPoints([this._glyphSelectorHelper.center, point]);
    //     debugLineAB.geometry = lineABGeometry;

    //     const lineAC = this._glyphSelectorHelper.direction.clone().sub(this._glyphSelectorHelper.center).normalize();
    //     const debugLineAC = this._glyphSelectorHelper.debugMesh.getObjectByName('debug-line-ac') as THREE.LineSegments;
    //     const lineACGeometry = new THREE.BufferGeometry().setFromPoints([this._glyphSelectorHelper.center, this._glyphSelectorHelper.direction]);
    //     debugLineAC.geometry = lineACGeometry;
        
    //     const angle = ((lineAB.clone().cross(lineAC).y < 0 ? 1 : -1)*Math.acos(lineAB.dot(lineAC))*180/Math.PI);
    //     // // cross product
    //     // console.log(angle);
    //     // glyphManager?.rotateGlyph(this._selectedGlyph?.uuid as string, angle);

    //     const radAngle = angle * Math.PI / 180;
    //     this._selectorBox.rotation.y = radAngle;
    //     // this._selectorBox.position.copy(this._glyphSelectorHelper.nodeCenter);
    //   }
    // });

    // window.addEventListener("mouseup", (event) => {
    //   this._isEditing = false;
    // });
  }

  /**
   * Create a Boundary around the Glyph Text
   */
  selectGlyph(id: string) {
    // console.log(id);

    const glyphNode = this._glyphNodes.get(id);
    if (!glyphNode) throw new Error('Glyph Node not found');

    this._selectedGlyph = glyphNode;

    glyphNode.boundMesh.visible = true;

    // const box = new THREE.Box3().setFromObject(glyphNode);

    // const center = new THREE.Vector3();
    // box.getCenter(center);
    // this._glyphSelectorHelper.center = center;
    // this._glyphSelectorHelper.debugMesh.getObjectByName('debug-node-center')?.position.copy(center);

    // // box.expandByScalar(0.2);
    // this.updateSelectorBox(box.min, box.max);
  }

  updateManager(camera: THREE.PerspectiveCamera) {
    // const cameraDistance = camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
    // if (!(cameraDistance > this.cameraDistance + 1 || cameraDistance < this.cameraDistance - 1)) return;
    
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
    glyphNode.boundMesh.rotation.z = radians;
  }
}

let glyphManager: _GlyphManager | null = null;

export const Glyphs = (() => {
  if (!glyphManager) {
    glyphManager = new _GlyphManager();
  }
  return glyphManager;
})();
