import {
  Vector3D,
  BasePoly,
} from '../../kernel/dist';
import * as THREE from 'three';
import { OPWall, OPWallMesh, OPWallType } from './base-types';
import { Pencil } from '../../kernel/dist/src/pencil';
import { BaseElement, BaseGeometrySet } from './base-element';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

// move this to base type later
interface BaseWall2Set extends BaseGeometrySet {
  thickness: number;
  halfThickness: number;
  color: number;
}

export class BaseWall2 extends BaseElement {
  ogType = 'wall';
  geometrySet: BaseWall2Set;
  visibleMesh: THREE.Group = new THREE.Group();

  private wallSetMesh: { [key: string]: THREE.Mesh | THREE.Line | CSS2DObject } = {};

  isEditing = false;
  private activeId: string | undefined;

  /**
   * Set Wall Color
   * @param color: The Color of The Wall
   * @description The wall already has some opacity, so the color will be a bit transparent
   */
  set wallColor(color: THREE.Color) {
    this.material = new THREE.MeshStandardMaterial({ color: color, side: THREE.DoubleSide, opacity: 0.2, transparent: true });
  }

  /**
   * Set Wall Type
   * @param type: The Type of The Wall
   * @description The wall type will determine the texture of the wall
   */
  // set wallType(type: OPWallType) {
  //   this.wallSet.type = type;
  // }

  // get wallAnchor() {
  //   return {
  //     start: this.localToWorld(new THREE.Vector3(this.wallSet.anchor.start.x, this.wallSet.anchor.start.y, this.wallSet.anchor.start.z)),
  //     end: this.localToWorld(new THREE.Vector3(this.wallSet.anchor.end.x, this.wallSet.anchor.end.y, this.wallSet.anchor.end.z)),
  //   }
  // }

  set length(value: number) {
    if (value === this.geometrySet.length) return;
    
    this.geometrySet.length = value;
    this.adjustAnchors(value);
    this.geometry.dispose();

    const allMeshes = Object.values(this.wallSetMesh);
    for (const mesh of allMeshes) {
      this.visibleMesh.remove(mesh);
    }

    this.resetVertices();
    this.setupGeometry();
  }

  // TODO: Create Types for Acceptable Materials
  set wallMaterial(material: string) {
    this.geometrySet.material = material;
    const wallSurface = this.wallSetMesh[`wallSurface`+this.ogid];
    if (!(wallSurface instanceof THREE.Mesh)) return;

    // TODO: Host the Textures in the Public Folder
    switch (material) {
      case 'concrete':
        const texture = this.createTexture('./../public/wallCrossTexture.jpg');
        wallSurface.material = new THREE.MeshStandardMaterial({ map: texture, color: this.geometrySet.color, side: THREE.DoubleSide });
        break;
      case 'brick':
        const brickTexture = this.createTexture('./../public/wallDotTexture.jpg');
        wallSurface.material = new THREE.MeshStandardMaterial({ map: brickTexture, color: this.geometrySet.color, side: THREE.DoubleSide });
        break;
      default:
        wallSurface.material = new THREE.MeshStandardMaterial({ color: this.geometrySet.color, side: THREE.DoubleSide });
        break;
    }
  }

  set edit(value: boolean) {
    this.isEditing = value;
    if (value) {
      this.onMakeSelection();
    } else {
      this.removeSelection();
    }
  }

  // TODO: Since we need Pencil for every element, how to make it global/Singleton?
  constructor(private pencil: Pencil, initialWallSet?: BaseWall2Set) {
    super();
    
    if (initialWallSet) {
      if (!this.verifyGeometrySet(initialWallSet)) {
        throw new Error('Invalid Geometry Set');
      }
      this.geometrySet = initialWallSet;
    } else {
      this.geometrySet = {
        type: this.ogType,
        id: this.ogid,
        position: new Vector3D(0, 0, 0),
        length: 2,
        material: 'concrete',
        thickness: 0.25,
        halfThickness: 0.125,
        color: 0xffffff,
      }
    }

    this.setupGeometry();
    this.setupEvents();

    this.add(this.visibleMesh);
  }

  private createTexture(url: string) {
    const texture = new THREE.TextureLoader().load(
      url,
      (tex) => {
        // console.log("Texture Loaded", tex);
      },
      undefined, // Optional: onProgress callback
      (err) => {
        console.error("Texture failed to load", err);
      }
    );
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.set(
      this.geometrySet.length * 4,
      1
    );
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = false;
    return texture;
  }

  /**
   * Update Wall Geometry Set
   * @param wallSet
   */
  updateGeometrySet(wallSet: BaseWall2Set) {
    this.geometrySet = wallSet;
    // this.setGeometry();
  }

  setupGeometry() {
    if (!this.geometrySet) return;

    // NOTE
    // If Anchors are not set, use the length to set the anchors
    // When we are creating a new wall, we will set the anchors based on the length
    // If we are updating an existing wall, we will set the anchors based on the existing anchors and length
    if (this.geometrySet.anchor === undefined) {
      this.adjustAnchors(this.geometrySet.length);
    }

    if (this.geometrySet.anchor === undefined) {
      throw new Error('Invalid Anchor Points');
    }
  
    const { startLeft, startRight, endLeft, endRight } = this.getOuterCoordinates(
      this.geometrySet.anchor.start,
      this.geometrySet.anchor.end,
      this.geometrySet.halfThickness
    );

    const vertices = [
      new Vector3D(startLeft.x, startLeft.y, startLeft.z),
      new Vector3D(startRight.x, startRight.y, startRight.z),
      new Vector3D(endRight.x, endRight.y, endRight.z),
      new Vector3D(endLeft.x, endLeft.y, endLeft.z),
    ];
    this.addVertices(vertices);
    
    // this.name = `wall`+this.ogid;
    this.geometry.computeVertexNormals();

    // Here visibleMesh is same as shadowMesh, but that's not always the case
    const wallGeom = this.geometry.clone();
    const uvs = new Float32Array([
      0, 0,
      1, 0,
      1, 1,
      1, 1,
      0, 1,
      0, 0 
    ]);
    wallGeom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    wallGeom.attributes.uv.needsUpdate = true;
    

    const wallMesh = new THREE.Mesh(wallGeom);
    wallMesh.name = `wallSurface`+this.ogid;
    this.visibleMesh.add(wallMesh);
    this.wallSetMesh[wallMesh.name] = wallMesh;
    this.wallMaterial = this.geometrySet.material;

    const wallBlockEdgeGeom = new THREE.EdgesGeometry(wallGeom);
    const wallBlockEdgeMesh = new THREE.LineSegments(wallBlockEdgeGeom, new THREE.LineBasicMaterial({ color: 0xff0000 }));
    wallBlockEdgeMesh.name = `wallBlockEdge`+this.ogid;
    this.visibleMesh.add(wallBlockEdgeMesh);
    this.wallSetMesh[wallBlockEdgeMesh.name] = wallBlockEdgeMesh; 

    this.pencil.pencilMeshes.push(this);
  }

  private onMakeSelection() {
    if (this.geometrySet.anchor === undefined) {
      throw new Error('Invalid Anchor Points');
    }

    const sphereGeometry = new THREE.SphereGeometry(0.035, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const sSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sSphere.name = `wallStart`+this.ogid;
    sSphere.position.copy(this.geometrySet.anchor.start);
    this.visibleMesh.add(sSphere);
    this.wallSetMesh[sSphere.name] = sSphere;

    const sphereDiv = document.createElement('div');
    sphereDiv.style.width = '10px';
    sphereDiv.style.height = '10px';
    sphereDiv.style.backgroundColor = 'red';
    sphereDiv.style.position = 'absolute';
    sphereDiv.style.top = '0';
    sphereDiv.style.left = '0';
    const sSphereLabel = new CSS2DObject(sphereDiv);
    sSphereLabel.position.copy(this.geometrySet.anchor.start);
    sSphereLabel.name = `wallStartLabel`+this.ogid;
    this.visibleMesh.add(sSphereLabel);
    this.wallSetMesh[sSphereLabel.name] = sSphereLabel;

    const eSphereDiv = document.createElement('div');
    eSphereDiv.style.width = '10px';
    eSphereDiv.style.height = '10px';
    eSphereDiv.style.backgroundColor = 'red';
    eSphereDiv.style.position = 'absolute';
    eSphereDiv.style.top = '0';
    eSphereDiv.style.left = '0';
    const eSphereLabel = new CSS2DObject(eSphereDiv);
    eSphereLabel.position.copy(this.geometrySet.anchor.end);
    eSphereLabel.name = `wallEndLabel`+this.ogid;
    this.visibleMesh.add(eSphereLabel);
    this.wallSetMesh[eSphereLabel.name] = eSphereLabel;

    const eSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    eSphere.name = `wallEnd`+this.ogid;
    eSphere.position.copy(this.geometrySet.anchor.end);
    this.visibleMesh.add(eSphere);
    this.wallSetMesh[eSphere.name] = eSphere;
  }

  private removeSelection() {
    const startSphere = `wallStart`+this.ogid;
    const endSphere = `wallEnd`+this.ogid;
    const startLabel = `wallStartLabel`+this.ogid;
    const endLabel = `wallEndLabel`+this.ogid;

    this.visibleMesh.remove(this.wallSetMesh[startSphere]);
    this.visibleMesh.remove(this.wallSetMesh[endSphere]);
    this.visibleMesh.remove(this.wallSetMesh[startLabel]);
    this.visibleMesh.remove(this.wallSetMesh[endLabel]);
  }

  private handleElementSelected(mesh: THREE.Mesh) {
    this.isEditing = true;
    console.log(`Selected: ${mesh.name}`);

    // Manipulate The Wall Start and End
    if (mesh.name === 'wallStart'+this.ogid || mesh.name === 'wallEnd'+this.ogid) {
      console.log(`Selected: ${mesh.name}`);
      this.activeId = mesh.name;
      this.pencil.mode = "cursor";
    }
    
    // Manipulate The Entire Wall 
    if (mesh.name === 'wall'+this.ogid) {
      // TODO: 
    }
  }

  private handleCursorMove(cursorPosition: THREE.Vector3) {
    if (!this.isEditing) return;

    if (this.geometrySet.anchor === undefined) return;

    if (this.activeId) {
      const worldToLocal = this.worldToLocal(cursorPosition);
      this.wallSetMesh[this.activeId].position.set(worldToLocal.x, 0, worldToLocal.z);
    }

    const startSphere = `wallStart`+this.ogid;
    const endSphere = `wallEnd`+this.ogid;

    console.log(this.wallSetMesh[startSphere].position, this.wallSetMesh[endSphere].position);
    
    this.geometrySet.anchor.start.x = this.wallSetMesh[startSphere].position.x;
    this.geometrySet.anchor.start.y = this.wallSetMesh[startSphere].position.y;
    this.geometrySet.anchor.start.z = this.wallSetMesh[startSphere].position.z;
    this.geometrySet.anchor.end.x = this.wallSetMesh[endSphere].position.x;
    this.geometrySet.anchor.end.y = this.wallSetMesh[endSphere].position.y;
    this.geometrySet.anchor.end.z = this.wallSetMesh[endSphere].position.z;

    const wallBlockEdgeMesh = this.wallSetMesh[`wallBlockEdge`+this.ogid] as THREE.LineSegments;
    wallBlockEdgeMesh.geometry.dispose();
    const wallBlockGeom = this.generateShadowGeometry(
      this.wallSetMesh[startSphere].position,
      this.wallSetMesh[endSphere].position,
      this.geometrySet.halfThickness
    );
    const wallBlockEdgeGeom = new THREE.EdgesGeometry(wallBlockGeom);
    wallBlockEdgeMesh.geometry = wallBlockEdgeGeom;
  }

  setupEvents() {
    this.pencil.onElementSelected.add((mesh) => {
      // if (mesh.name === 'wall'+this.ogid || mesh.name === 'wallStart'+this.ogid || mesh.name === 'wallEnd'+this.ogid) {
        this.handleElementSelected(mesh);
      // }
    });

    // this.pencil.onElementHover.add((mesh) => {
    //   if (mesh.name === 'wall'+this.ogid || mesh.name === 'start'+this.ogid || mesh.name === 'end'+this.ogid) {
    //     // TODO: Change Cursor Colors on Hover
    //   }
    // });

    this.pencil.onCursorMove.add((point) => {
      console.log(point);
      this.handleCursorMove(point);
    });

    // this.pencil.onCursorDown.add((point) => {
    //   if (!this.isEditing) return;
    //   setTimeout(() => {
    //     this.isEditing = false;
    //     this.activeId = undefined;
    //     this.pencil.mode = "select";
    //     if (!this.wallSetMesh) return;

    //     const startSphere = `wallStart`+this.ogid;
    //     const endSphere = `wallEnd`+this.ogid;

    //     const { startLeft, startRight, endLeft, endRight } = this.getOuterCoordinates(
    //       this.wallSetMesh[startSphere].position,
    //       this.wallSetMesh[endSphere].position,
    //       this.wallSet.halfThickness
    //     );

    //     const vertices = [
    //       new Vector3D(startLeft.x, startLeft.y, startLeft.z),
    //       new Vector3D(startRight.x, startRight.y, startRight.z),
    //       new Vector3D(endRight.x, endRight.y, endRight.z),
    //       new Vector3D(endLeft.x, endLeft.y, endLeft.z),
    //     ];

    //     this.resetVertices();
    //     this.addVertices(vertices);
    //     // this.material = new THREE.MeshToonMaterial({ wireframe: true, color: 0x000000 });
    //   }, 100);
    // });
  }

  // set halfThickness(value: number) {
  //   this.wallSet.halfThickness = value;
  // }

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

  get area() {
    const wallDim = {
      area: 4,
      perimeter: 0
    };

    return wallDim.area;
  }

  updateGeometry(): void {
      
  }
}
