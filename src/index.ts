/**
 * OpenPlans - A 2D and 3D Library for Architectural, Engineering and Mechanical Design
 * Copyright (c) 2025 OpenGeometry
 * All rights reserved.
 *
 * Author: OpenGeometry Team | Vishwajeet Mane
 * Contact: info@opengeometry.io
 * License: MIT
 */

// External Packages
import { IArcOptions, ICuboidOptions, ICylinderOptions, ILineOptions, IPolylineOptions, IRectangleOptions, OpenGeometry } from './kernel/';
import * as THREE from 'three';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { GlyphNode, Glyphs } from '@opengeometry/openglyph';

// Generic Services
import { OpenThree } from './service/three';
import { PlanCamera } from './service/plancamera';
import convertToOGFormat from './parser/ImpleniaConverter';

// Primitives, 2D Elements and Shapes
import { ArcPrimitive } from './primitives/arc';
import { DimensionTool } from './dimensions';
import { PolylinePrimitive, RectanglePrimitive } from './primitives/index';
import { LinePrimitive } from './primitives/line';
import { CuboidShape } from './shapes/cuboid';
import { CylinderShape } from './shapes/cylinder';
import { BaseDoor, OPDoor } from './elements/base-door';
import { BaseSingleWindow, OPSingleWindow } from './elements/base-single-window';
import { BaseDoubleWindow, OPDoubleWindow } from './elements/base-double-window';
import { BaseSlab, OPSlab } from './elements/base-slab';
import { BaseStair, OPStair } from './elements/base-stair';

// Drawing and Layout
import { PaperFrame, PaperFrameOptions } from './layouts/';

// Utils
import { Event } from './utils/event';

// Elements
import { Board, BoardOptions } from './elements/board';

// Shapes
export * from "./primitives/index";

// Shape Builders
export * from "./shape-builder/index";
export * from './kernel/';

export class OpenPlans {
  private container: HTMLElement
  private openThree: OpenThree
  static sOThree: OpenThree;
 
  // private pencil: Pencil | undefined;
  
  private planCamera: PlanCamera

  private og: OpenGeometry | undefined
  private ogElements: any[] = [];

  private labelRenderer: CSS2DRenderer | undefined;

  private onRender: Event<void> = new Event<void>();


  // 2D Views and Profile Views
  private profileViews: Map<string, { camera: THREE.Camera; renderer: THREE.WebGLRenderer; container: HTMLElement }> = new Map();

  constructor(container: HTMLElement) {
    // this.renderCallback = this.renderCallback.bind(this)

    this.container = container
    this.openThree = new OpenThree(container, this.renderCallback)
    OpenPlans.sOThree = this.openThree;

    this.planCamera = this.openThree.planCamera
    
    this.openThree.planCamera.controls.addEventListener("update", () => {
      Glyphs.updateManager(this.openThree.threeCamera)
    });

    this.setuplabelRenderer();
    this.setupEvent();
  }


  // 2D Views and Profile Views
  // TODO: Create proper 2D view management system, where user can create multiple 2D views at different heights and that view will be rendered accordingly in given container
  // TODO: Using this system, we can create section views as well and get reference to those views which can be used to generate 2D drawings later
  // TODO: These views can be also saved as part of the Element Views
  
  /**
   * Create a 2D view in the given container.
   * @param container The HTML container element where the 2D view will be rendered.
   */
  create2DView(container: HTMLElement, sectionHeight: number = 0): { camera: THREE.Camera; renderer: THREE.WebGLRenderer } {
    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.OrthographicCamera(-aspect * 1.5 / 2, aspect * 1.5 / 2, 1.5 / 2, -1.5 / 2, 0.01, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // rotate camera to look down
    camera.position.set(0, 20, 0);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    const clippingPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), sectionHeight);
    renderer.clippingPlanes = [clippingPlane];
    renderer.localClippingEnabled = true;

    this.profileViews.set(container.id, { camera, renderer, container });

    return { camera, renderer  };
  }
  
  /**
   * Show or hide the 2D view.
   * @param show Whether to show or hide the 2D view
   * @param orthographic Whether to use orthographic projection
   * @param height The height of the 2D view
   */
  // toggle2DView(show: boolean, orthographic: boolean = true, height: number = 0) { 

  // set enablePencil(value: boolean) {
  //   if (value && !this.pencil) {
  //     if (!this.container || !this.scene) {
  //       throw new Error("Container or Scene is not defined");
  //     }
  //     this.pencil = new Pencil(this.container, this.scene, this.camera);
  //   } else if (!value && this.pencil) {
  //     // TODO: Disable The Pencil Usage and Dispose it
  //   }
  // }

  // TODO: Can this be handled inside the OpenGeometry class itself?
  /**
   * Updates the label renderer to render the scene with the given camera.
   * This method should be called in the animation loop or render loop of your application.
   * @param scene - The Three.js scene containing the objects to be rendered.
   * @param camera - The Three.js camera used for rendering the scene.
   */
  update(scene: THREE.Scene, camera: THREE.Camera) {
    this.labelRenderer?.render(scene, camera);
  }

  private setuplabelRenderer() {
    if (!this.container || !this.openThree.scene) {
      throw new Error("Container or Scene is not defined");
    }

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(this.container.clientWidth, this.container.clientHeight);
    labelRenderer.domElement.style.position = "absolute";
    labelRenderer.domElement.style.top = "0";
    this.container.appendChild(labelRenderer.domElement);
    this.labelRenderer = labelRenderer;
  }

  private setupEvent() {
    // NOTE: The responsibility to resize normal rendererer lies with the user
    // but the label renderer should be resized automatically
    window.addEventListener("resize", () => {
      if (!this.container) return;
      this.labelRenderer?.setSize(this.container?.clientWidth, this.container?.clientHeight);
    });
  }

  // This function is called on each animation frame, called from OpenThree class using callback
  private renderCallback = () => {
    if (this.openThree && this.labelRenderer) {
      // console.log('Rendering labels');
      this.labelRenderer.render(this.openThree.scene, this.openThree.threeCamera);
    }

    if (this.profileViews.size > 0) {
      // console.log('Rendering 2D/Profile Views');
      this.profileViews.forEach(({ camera: profileCamera, renderer: profileRenderer, container }) => {
        profileRenderer.render(this.openThree.scene, profileCamera);
      });
    }
  }

  //   for (const element of this.ogElements) {
  //     if (
  //       element.ogType === 'polyline' || 
  //       element.ogType === 'polygon' ||
  //       element.ogType === 'baseWall' ||
  //       element.ogType === 'baseDoor' ||
  //       element.ogType === 'baseWindow'
  //     ) {
  //       element.calulateAnchorEdges(true);
  //     }

  //     if (
  //       element.ogType === 'genericBuilder'
  //     ) {
  //       element.recalculateOverlay();
  //     }
  //   }

  //   this.onRender.trigger();
  // }

  async setupOpenGeometry(wasmURL?: string) {
    this.og = await OpenGeometry.create({ wasmURL });

    await Glyphs.loadFaces('Source_Code_Pro_Regular');
    Glyphs.scene = this.openThree.scene
    Glyphs.camera = this.openThree.threeCamera

    const dimensionTool = DimensionTool;
    dimensionTool.sceneRef = this.openThree.scene;

    // this.pencil?.onCursorDown.add((coords) => {
    //   console.log('Cursor Down', coords)
    // });
    
    // if (this.pencil) {
    //   ShapeSelector.pencil = this.pencil;
    //   // ShapeEditor.pencil = this.pencil;
    // }
  }

  disposeElement(ogid: string) {
    const element = this.ogElements.find((el) => el.ogid === ogid);
    if (element) {
      element.dispose();
      this.openThree.scene.remove(element);
      this.ogElements.splice(this.ogElements.indexOf(element), 1);
    } else {
      console.warn(`Element with ogid ${ogid} not found`);
    }
  }

  // Primitives
  line(config?: ILineOptions) {
    const line = new LinePrimitive(config);
    this.openThree.scene.add(line);
    this.ogElements.push(line);
    return line;
  }

  arc(config?: IArcOptions) {
    // if (!this.pencil) {
    //   throw new Error('Pencil not initialized')
    // }
    const arc = new ArcPrimitive(config);
    // arc.pencil = this.pencil;
    this.openThree.scene.add(arc);
    this.ogElements.push(arc);
    return arc;
  }

  rectangle(config?: IRectangleOptions) {
    const rectangle = new RectanglePrimitive(config);
    this.openThree.scene.add(rectangle);
    this.ogElements.push(rectangle);
    return rectangle;
  }

  polyline(config?: IPolylineOptions) {
    const polyline = new PolylinePrimitive(config);
    this.openThree.scene.add(polyline);
    this.ogElements.push(polyline);
    return polyline;
  }

  // Shapes
  cuboid(config?: ICuboidOptions) {
    const cuboid = new CuboidShape(config);
    this.openThree.scene.add(cuboid);
    this.ogElements.push(cuboid);
    return cuboid;
  }

  cylinder(config?: ICylinderOptions) {
    const cylinder = new CylinderShape(config);
    this.openThree.scene.add(cylinder);
    this.ogElements.push(cylinder);
    return cylinder;
  }

  // baseWall(config: IBaseWall): BaseWall {
  //   if (!this.pencil) {
  //     throw new Error('Pencil not initialized')
  //   }
  //   const wall = new BaseWall(config);
  //   wall.pencil = this.pencil;
  //   // this.openThree.scene.add(wall)
  //   this.ogElements.push(wall)
  //   return wall
  // }

  baseSingleWindow(config?: OPSingleWindow): BaseSingleWindow {
    const window = new BaseSingleWindow(config);
    this.openThree.scene.add(window)
    this.ogElements.push(window)
    return window
  }

  baseDoubleWindow(config?: OPDoubleWindow): BaseDoubleWindow {
    const window = new BaseDoubleWindow(config);
    this.openThree.scene.add(window)
    this.ogElements.push(window)
    return window
  }

  baseDoor(config?: OPDoor): BaseDoor {
    const door = new BaseDoor(config);
    this.openThree.scene.add(door)
    this.ogElements.push(door)
    return door
  }

  baseSlab(config?: OPSlab): BaseSlab {
    const slab = new BaseSlab(config);
    this.openThree.scene.add(slab)
    this.ogElements.push(slab)
    return slab
  }

  baseStair(config?: OPStair): BaseStair {
    const stair = new BaseStair(config);
    this.openThree.scene.add(stair)
    this.ogElements.push(stair)
    return stair
  }

  // space(): BaseSpace {
  //   if (!this.pencil) {
  //     throw new Error('Pencil not initialized')
  //   }
  //   const space = new BaseSpace(this.pencil)
  //   this.openThree.scene.add(space)
  //   this.ogElements.push(space)
  //   return space
  // }

  // doubleWindow(): DoubleWindow {
  //   if (!this.pencil) {
  //     throw new Error('Pencil not initialized')
  //   }
  //   const window = new DoubleWindow(this.pencil)
  //   // this.openThree.scene.add(window)
  //   this.ogElements.push(window)
  //   return window
  // }

  board(boardConfig?: BoardOptions): Board {
    // if (!this.pencil) {
    //   throw new Error('Pencil not initialized')
    // }
    const board = new Board(boardConfig)
    this.openThree.scene.add(board)
    this.ogElements.push(board)
    return board
  }

  /***** Shape Builders *****/

  /**
   * Create Polyline using Interactive Builder
   * @param polyLineConfig 
   * @returns 
   */
  // polylineBuilder(polyLineConfig?: IPolylineBuilder): PolylineBuilder {
  //   if (!this.pencil) {
  //     throw new Error('Pencil not initialized')
  //   }
  //   const polylineBuilder = new PolylineBuilder(polyLineConfig)
  //   polylineBuilder.pencil = this.pencil;
  //   // this.openThree.scene.add(polylineBuilder)
  //   this.ogElements.push(polylineBuilder)
  //   return polylineBuilder
  // }

  // polygonBuilder(polygonConfig?: IPolygonBuilder): PolygonBuilder {
  //   if (!this.pencil) {
  //     throw new Error('Pencil not initialized')
  //   }
  //   const polygonBuilder = new PolygonBuilder(polygonConfig)
  //   polygonBuilder.pencil = this.pencil;
  //   this.openThree.scene.add(polygonBuilder)
  //   this.ogElements.push(polygonBuilder)
  //   return polygonBuilder
  // }

  /***** Utilities *****/

  getEntitiesByType(type: string) {
    return this.ogElements.filter((el) => el.ogType === type)
  }

  fit(element: string) {
    if (!element) return
    const entities = this.getEntitiesByType(element)
    if (entities.length === 0) return
    this.planCamera.fitToElement(entities)
  }

  glyph(text: string, size: number, color: number, staticZoom: boolean = true) {
    const glyph = Glyphs.addGlyph(text, size, color, staticZoom)
    return glyph
  }

  getGlyph(id: string): GlyphNode {
    const glyph = Glyphs.getGlyph(id)
    if (!glyph) throw new Error('Glyph not found')
    return glyph
  }

  selectGlyph(id: string) {
    if (!id) throw new Error('ID not provided')
    Glyphs.selectGlyph(id)
  }

  rotateGlyph(id: string, angle: number) {
    if (!id) throw new Error('ID not provided')
    Glyphs.rotateGlyph(id, angle)
  }

  get glyphNodes() {
    return Glyphs.glyphNodes
  }

  clearGlyphSelection() {
    Glyphs.clearSelection()
  }

  updateGlyphText(id: string, text: string) {
    Glyphs.updateGlyphText(id, text)
  }

  convertImpleniaToOGFormat(sourceJson: any) {
    const ogJSON = convertToOGFormat(sourceJson);
    // this.generateGeometry(ogJSON);
  }

  public startEditingSpaces() {
    const spaces = this.getEntitiesByType('space');
    for (let i = 0; i < spaces.length; i++) {
      // change material to white
      const baseMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
      spaces[i].material = baseMaterial;

      spaces[i].isEditing = true;
    }
  }

  public stopEditingSpaces() {
    const spaces = this.getEntitiesByType('space');
    for (let i = 0; i < spaces.length; i++) {
      spaces[i].isEditing = false;
      spaces[i].material = new THREE.MeshBasicMaterial({ color: spaces[i].spaceSet.color, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
    }
  }

  public fitToSpace(spaceId: string) {
    const space = this.getEntitiesByType('space').find((s) => s.name === spaceId);
    if (!space) return;
    this.planCamera.fitToElement([space]);
  }

  public fitToAllSpaces() {
    const spaces = this.getEntitiesByType('space');
    this.planCamera.fitToElement(spaces);
  }

  public getSpaceData(spaceId: string) {
    const space = this.getEntitiesByType('space').find((s) => s.name === spaceId);
    if (!space) return;
    return space.spaceSet;
  }

  public getSpaceArea(spaceId: string) {
    const space = this.getEntitiesByType('space').find((s) => s.name === spaceId);
    if (!space) return;
    const spaceArea = space.area;
    return spaceArea;
  }

  public getElementArea(elementId: string) {
    const element = this.ogElements.find((el) => el.id === elementId);
    if (!element) return;
    const elementArea = element.area;
    return elementArea;
  }

  /**
   * Paper Creation and Frames
   */
  paperFrame(config: PaperFrameOptions) {
    // if (!this.pencil) {
    //   throw new Error('Pencil not initialized')
    // }
    const paperFrame = new PaperFrame(config)
    this.openThree.scene.add(paperFrame)
    this.ogElements.push(paperFrame)
    return paperFrame
  }

  // logoInfoBlock(options:LogoInfoBlockOptions) {
  //   const logoBlock = new LogoInfoBlock(options);
  //   this.openThree.scene.add(logoBlock);
  //   return logoBlock
  // }

  // rowInfoBlock(options: RowInfoBlockOptions) {
  //   const rowInfoBlock = new RowInfoBlock(options);
  //   this.openThree.scene.add(rowInfoBlock);
  //   return rowInfoBlock;
  // }

  static toScreenPosition(pos: THREE.Vector3): { x: number; y: number } {
    const vector = pos.clone().project(OpenPlans.sOThree.threeCamera);
  
    const halfWidth = OpenPlans.sOThree.renderer.domElement.clientWidth / 2;
    const halfHeight = OpenPlans.sOThree.renderer.domElement.clientHeight / 2;
  
    return {
      x: vector.x * halfWidth + halfWidth,
      y: -vector.y * halfHeight + halfHeight
    };
  }

  // THREE METHODS
  set showGrid(show: boolean) {
    this.openThree.toggleGrid(show);
  }

  // addCustomObject(genericObject: GenericBuilder) {
  //   if (!this.pencil) {
  //     throw new Error('Pencil not initialized');
  //   }

  //   this.openThree.scene.add(genericObject);
  //   genericObject.pencil = this.pencil;
  //   this.ogElements.push(genericObject);
  // }

  addImagePlane(dataURL: string) {
    // if (!this.pencil) {
    //   throw new Error('Pencil not initialized');
    // }
    
    // const link = document.createElement('a');
    // link.href = dataURL;
    // link.download = 'image.png'; // You can change the file name/format
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);

    const texture = new THREE.TextureLoader().load(dataURL, (texture) => {
      const geometry = new THREE.PlaneGeometry(
        texture.image.width,
        texture.image.height
      );
      const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geometry, material);
      
      // Set position and scale as needed
      mesh.position.set(0, -0.1, 0);
      mesh.scale.set(0.239, 0.239, 0.239); // Adjust scale as needed

      mesh.rotateX(-Math.PI / 2); // Rotate to face upwards

      this.openThree.scene.add(mesh);
      this.ogElements.push(mesh);
    });
  }
}


