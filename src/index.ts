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
import { IArcOptions, ICuboidOptions, ICylinderOptions, ILineOptions, IPolylineOptions, IRectangleOptions, OGSceneManager, OpenGeometry } from './kernel/';
import * as THREE from 'three';
import { ElementType } from './elements/base-type';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { GlyphNode, Glyphs } from '@opengeometry/openglyph';

// Generic Services
import { OpenThree } from './service/three';
import { CameraMode, PlanCamera } from './service/plancamera';
import convertToOGFormat from './parser/ImpleniaConverter';

// Primitives, 2D Elements and Shapes
import { ArcPrimitive } from './primitives/arc';
import { DimensionTool, DimensionType, LineDimension, RadiusDimension, AngleDimension } from './dimensions';
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
import { Door2D, DoorMaterial, DoorOptions } from './elements/planview/door2D';
import { DoubleDoor2D, DoubleDoorOptions } from './elements/planview/doubleDoor2D';
import { Window2D, WindowOptions } from './elements/planview/window2D';
import { DoubleWindow2D, DoubleWindowOptions } from './elements/planview/doubleWindow2D';
import { Stair2D, StairOptions } from './elements/planview/stair2D';
import { Wall2D, WallOptions } from './elements/planview/wall2D';

// Fixtures (Bathroom)
import { Toilet2D, ToiletOptions } from './elements/planview/fixtures/toilet2D';
import { Sink2D, SinkOptions } from './elements/planview/fixtures/sink2D';
import { Bathtub2D, BathtubOptions } from './elements/planview/fixtures/bathtub2D';
import { Shower2D, ShowerOptions } from './elements/planview/fixtures/shower2D';
import { Bidet2D, BidetOptions } from './elements/planview/fixtures/bidet2D';
import { Urinal2D, UrinalOptions } from './elements/planview/fixtures/urinal2D';

// Furniture
import { Bed2D, BedOptions } from './elements/planview/furniture/bed2D';
import { Sofa2D, SofaOptions } from './elements/planview/furniture/sofa2D';
import { DiningTable2D, DiningTableOptions } from './elements/planview/furniture/diningTable2D';
import { Desk2D, DeskOptions } from './elements/planview/furniture/desk2D';
import { Chair2D, ChairOptions } from './elements/planview/furniture/chair2D';
import { Wardrobe2D, WardrobeOptions } from './elements/planview/furniture/wardrobe2D';

// Appliances
import { Refrigerator2D, RefrigeratorOptions } from './elements/planview/appliances/refrigerator2D';
import { Stove2D, StoveOptions } from './elements/planview/appliances/stove2D';
import { Washer2D, WasherOptions } from './elements/planview/appliances/washer2D';
import { Dishwasher2D, DishwasherOptions } from './elements/planview/appliances/dishwasher2D';

// Kitchen
import { KitchenSink2D, KitchenSinkOptions } from './elements/planview/kitchen/kitchenSink2D';
import { Counter2D, CounterOptions } from './elements/planview/kitchen/counter2D';
import { Cabinet2D, CabinetOptions } from './elements/planview/kitchen/cabinet2D';
import { Island2D, IslandOptions } from './elements/planview/kitchen/island2D';

// Landscape
import { Tree2D, TreeOptions } from './elements/planview/landscape/tree2D';
import { Shrub2D, ShrubOptions } from './elements/planview/landscape/shrub2D';
import { Planter2D, PlanterOptions } from './elements/planview/landscape/planter2D';
import { Fountain2D, FountainOptions } from './elements/planview/landscape/fountain2D';
import { Bench2D, BenchOptions } from './elements/planview/landscape/bench2D';
import { ViewportBlock, ViewportConfig } from './layouts/viewport-block';

// Camera Modes
export { CameraMode } from './service/plancamera';

// Shapes
export * from "./primitives/index";

// Shape Builders
export * from "./shape-builder/index";
export * from './kernel/';

// Exports from Planview Elements
export { Wall2D, type WallOptions } from './elements/planview/wall2D';



// NOTE IMP: This needs Kernel to have updated IFC codes
export type IfcSemanticClass =
  | 'IFCBUILDINGELEMENTPROXY'
  | 'IFCWALL'
  | 'IFCSLAB'
  | 'IFCCOLUMN'
  | 'IFCBEAM'
  | 'IFCMEMBER'
  | 'IFCDOOR'
  | 'IFCWINDOW'
  | 'IFCROOF'
  | 'IFCSTAIR'
  | 'IFCRAILING'
  | 'IFCFOOTING';

export interface IfcElementSemantics {
  ifc_class?: IfcSemanticClass;
  name?: string;
  description?: string;
  object_type?: string;
  tag?: string;
  property_sets?: Record<string, Record<string, string>>;
  quantity_sets?: Record<string, Record<string, number>>;
}

export interface OpenPlansIfcExportOptions {
  sceneName?: string;
  schema?: 'Ifc4Add2';
  errorPolicy?: 'Strict' | 'BestEffort';
  validateTopology?: boolean;
  requireClosedShell?: boolean;
  scale?: number;
  includeDefaultSemantics?: boolean;
}

export interface OpenPlansStepExportOptions {
  sceneName?: string;
  errorPolicy?: 'Strict' | 'BestEffort';
  validateTopology?: boolean;
  requireClosedShell?: boolean;
  scale?: number;
}

export interface OpenPlansIfcExportPayload {
  text: string;
  report: Record<string, unknown>;
  sceneId: string;
  semantics: Record<string, IfcElementSemantics>;
  addedEntities: number;
  skippedEntities: number;
}

export interface OpenPlansStepExportPayload {
  text: string;
  report: Record<string, unknown>;
  sceneId: string;
  addedEntities: number;
  skippedEntities: number;
}

export class OpenPlans {
  private container: HTMLElement
  private openThree: OpenThree
  static sOThree: OpenThree;

  // private pencil: Pencil | undefined;

  private planCamera: PlanCamera

  private og: OpenGeometry | undefined
  private ogElements: any[] = [];
  private ifcSemanticsByElementId: Map<string, IfcElementSemantics> = new Map();

  private labelRenderer: CSS2DRenderer | undefined;

  private onRender: Event<void> = new Event<void>();


  // 2D Views and Profile Views
  private profileViews: Map<string, { camera: THREE.Camera; renderer: THREE.WebGLRenderer; container: HTMLElement }> = new Map();

  set CameraMode(mode: CameraMode) {
    this.planCamera.CameraMode = mode;
  }

  get CameraMode() {
    return this.planCamera.CameraMode;
  }


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

    return { camera, renderer };
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

    const viewportBlocks = this.getEntitiesByType('VIEWPORT_BLOCK');
    viewportBlocks.forEach((viewportBlock: ViewportBlock) => {
      viewportBlock.render(this.openThree.renderer, this.openThree.scene);
    });
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

    await Glyphs.loadFaces('Edu_NSW_ACT_Foundation_Regular');
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
      this.ifcSemanticsByElementId.delete(ogid.trim());
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

  // Dimensions
  lineDimension(config?: any) {
    const dim = new LineDimension(config);
    this.openThree.scene.add(dim);
    this.ogElements.push(dim);
    return dim;
  }

  angleDimension(config?: any) {
    const dim = new AngleDimension(config);
    this.openThree.scene.add(dim);
    this.ogElements.push(dim);
    return dim;
  }

  radiusDimension(config?: any) {
    const dim = new RadiusDimension(config);
    this.openThree.scene.add(dim);
    this.ogElements.push(dim);
    return dim;
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

  /* 2D Elements */
  wall2D(config?: Partial<WallOptions>): Wall2D {
    const wall = new Wall2D(config);
    this.openThree.scene.add(wall);
    this.ogElements.push(wall);
    return wall;
  }

  door2D(config?: DoorOptions): Door2D {
    const door = new Door2D(config);
    this.openThree.scene.add(door);
    this.ogElements.push(door);
    return door;
  }

  doubleDoor2D(config?: DoubleDoorOptions): DoubleDoor2D {
    const door = new DoubleDoor2D(config);
    this.openThree.scene.add(door);
    this.ogElements.push(door);
    return door;
  }

  singleWindow2D(config?: WindowOptions): Window2D {
    const window = new Window2D(config);
    this.openThree.scene.add(window);
    this.ogElements.push(window);
    return window;
  }

  doubleWindow2D(config?: DoubleWindowOptions): DoubleWindow2D {
    const window = new DoubleWindow2D(config);
    this.openThree.scene.add(window);
    this.ogElements.push(window);
    return window;
  }

  stair2D(config?: StairOptions): Stair2D {
    const stair = new Stair2D(config);
    this.openThree.scene.add(stair);
    this.ogElements.push(stair);
    return stair;
  }

  /* Fixtures (Bathroom) */
  toilet2D(config?: Partial<ToiletOptions>): Toilet2D {
    const toilet = new Toilet2D(config);
    this.openThree.scene.add(toilet);
    this.ogElements.push(toilet);
    return toilet;
  }

  sink2D(config?: Partial<SinkOptions>): Sink2D {
    const sink = new Sink2D(config);
    this.openThree.scene.add(sink);
    this.ogElements.push(sink);
    return sink;
  }

  bathtub2D(config?: Partial<BathtubOptions>): Bathtub2D {
    const bathtub = new Bathtub2D(config);
    this.openThree.scene.add(bathtub);
    this.ogElements.push(bathtub);
    return bathtub;
  }

  shower2D(config?: Partial<ShowerOptions>): Shower2D {
    const shower = new Shower2D(config);
    this.openThree.scene.add(shower);
    this.ogElements.push(shower);
    return shower;
  }

  bidet2D(config?: Partial<BidetOptions>): Bidet2D {
    const bidet = new Bidet2D(config);
    this.openThree.scene.add(bidet);
    this.ogElements.push(bidet);
    return bidet;
  }

  urinal2D(config?: Partial<UrinalOptions>): Urinal2D {
    const urinal = new Urinal2D(config);
    this.openThree.scene.add(urinal);
    this.ogElements.push(urinal);
    return urinal;
  }

  /* Furniture */
  bed2D(config?: Partial<BedOptions>): Bed2D {
    const bed = new Bed2D(config);
    this.openThree.scene.add(bed);
    this.ogElements.push(bed);
    return bed;
  }

  sofa2D(config?: Partial<SofaOptions>): Sofa2D {
    const sofa = new Sofa2D(config);
    this.openThree.scene.add(sofa);
    this.ogElements.push(sofa);
    return sofa;
  }

  diningTable2D(config?: Partial<DiningTableOptions>): DiningTable2D {
    const table = new DiningTable2D(config);
    this.openThree.scene.add(table);
    this.ogElements.push(table);
    return table;
  }

  desk2D(config?: Partial<DeskOptions>): Desk2D {
    const desk = new Desk2D(config);
    this.openThree.scene.add(desk);
    this.ogElements.push(desk);
    return desk;
  }

  chair2D(config?: Partial<ChairOptions>): Chair2D {
    const chair = new Chair2D(config);
    this.openThree.scene.add(chair);
    this.ogElements.push(chair);
    return chair;
  }

  wardrobe2D(config?: Partial<WardrobeOptions>): Wardrobe2D {
    const wardrobe = new Wardrobe2D(config);
    this.openThree.scene.add(wardrobe);
    this.ogElements.push(wardrobe);
    return wardrobe;
  }

  /* Appliances */
  refrigerator2D(config?: Partial<RefrigeratorOptions>): Refrigerator2D {
    const fridge = new Refrigerator2D(config);
    this.openThree.scene.add(fridge);
    this.ogElements.push(fridge);
    return fridge;
  }

  stove2D(config?: Partial<StoveOptions>): Stove2D {
    const stove = new Stove2D(config);
    this.openThree.scene.add(stove);
    this.ogElements.push(stove);
    return stove;
  }

  washer2D(config?: Partial<WasherOptions>): Washer2D {
    const washer = new Washer2D(config);
    this.openThree.scene.add(washer);
    this.ogElements.push(washer);
    return washer;
  }

  dishwasher2D(config?: Partial<DishwasherOptions>): Dishwasher2D {
    const dishwasher = new Dishwasher2D(config);
    this.openThree.scene.add(dishwasher);
    this.ogElements.push(dishwasher);
    return dishwasher;
  }

  /* Kitchen */
  kitchenSink2D(config?: Partial<KitchenSinkOptions>): KitchenSink2D {
    const sink = new KitchenSink2D(config);
    this.openThree.scene.add(sink);
    this.ogElements.push(sink);
    return sink;
  }

  counter2D(config?: Partial<CounterOptions>): Counter2D {
    const counter = new Counter2D(config);
    this.openThree.scene.add(counter);
    this.ogElements.push(counter);
    return counter;
  }

  cabinet2D(config?: Partial<CabinetOptions>): Cabinet2D {
    const cabinet = new Cabinet2D(config);
    this.openThree.scene.add(cabinet);
    this.ogElements.push(cabinet);
    return cabinet;
  }

  island2D(config?: Partial<IslandOptions>): Island2D {
    const island = new Island2D(config);
    this.openThree.scene.add(island);
    this.ogElements.push(island);
    return island;
  }

  /* Landscape */
  tree2D(config?: Partial<TreeOptions>): Tree2D {
    const tree = new Tree2D(config);
    this.openThree.scene.add(tree);
    this.ogElements.push(tree);
    return tree;
  }

  shrub2D(config?: Partial<ShrubOptions>): Shrub2D {
    const shrub = new Shrub2D(config);
    this.openThree.scene.add(shrub);
    this.ogElements.push(shrub);
    return shrub;
  }

  planter2D(config?: Partial<PlanterOptions>): Planter2D {
    const planter = new Planter2D(config);
    this.openThree.scene.add(planter);
    this.ogElements.push(planter);
    return planter;
  }

  fountain2D(config?: Partial<FountainOptions>): Fountain2D {
    const fountain = new Fountain2D(config);
    this.openThree.scene.add(fountain);
    this.ogElements.push(fountain);
    return fountain;
  }

  bench2D(config?: Partial<BenchOptions>): Bench2D {
    const bench = new Bench2D(config);
    this.openThree.scene.add(bench);
    this.ogElements.push(bench);
    return bench;
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

  getEntityById(id: string) {
    return this.ogElements.find((el) => el.id === id)
  }

  async fit(elementId: string) {
    if (!elementId) return
    const entity = this.getEntityById(elementId)
    if (!entity) return
    await this.planCamera.fitToElement(entity)
  }

  setIfcSemantics(elementId: string, semantics: IfcElementSemantics) {
    const normalizedId = elementId.trim();
    if (!normalizedId) {
      throw new Error('Element ID is required to assign IFC semantics');
    }
    this.ifcSemanticsByElementId.set(normalizedId, { ...semantics });
  }

  setIfcClass(elementId: string, ifcClass: IfcSemanticClass) {
    const normalizedId = elementId.trim();
    if (!normalizedId) {
      throw new Error('Element ID is required to assign IFC class');
    }
    const existing = this.ifcSemanticsByElementId.get(normalizedId) ?? {};
    this.ifcSemanticsByElementId.set(normalizedId, { ...existing, ifc_class: ifcClass });
  }

  clearIfcSemantics(elementId?: string) {
    if (elementId) {
      this.ifcSemanticsByElementId.delete(elementId.trim());
      return;
    }
    this.ifcSemanticsByElementId.clear();
  }

  getIfcSemantics(elementId: string): IfcElementSemantics | undefined {
    const semantics = this.ifcSemanticsByElementId.get(elementId.trim());
    if (!semantics) {
      return undefined;
    }
    return { ...semantics };
  }

  getIfcSemanticsMap(): Record<string, IfcElementSemantics> {
    return Object.fromEntries(
      Array.from(this.ifcSemanticsByElementId.entries()).map(([key, value]) => [key, { ...value }]),
    );
  }

  exportSceneToIfc(options: OpenPlansIfcExportOptions = {}): OpenPlansIfcExportPayload {
    const sceneName = options.sceneName ?? 'OpenPlans IFC Export';
    const includeDefaultSemantics = options.includeDefaultSemantics ?? true;
    const {
      manager,
      sceneId,
      metadata,
      skippedEntities,
    } = this.buildSceneManagerFromElements(sceneName);

    if (metadata.length === 0) {
      manager.free();
      throw new Error('No exportable BREP entities found in current OpenPlans scene');
    }

    let result: { text: string; reportJson: string; free: () => void } | null = null;
    try {
      const semantics: Record<string, IfcElementSemantics> = {};
      for (const entry of metadata) {
        const explicit = this.ifcSemanticsByElementId.get(entry.elementId);
        let effectiveSemantics: IfcElementSemantics | undefined = explicit ? { ...explicit } : undefined;

        if (!effectiveSemantics && includeDefaultSemantics) {
          effectiveSemantics = {
            ifc_class: this.defaultIfcClassForType(entry.kind),
            name: entry.elementId,
            object_type: entry.kind,
          };
        }

        if (effectiveSemantics) {
          semantics[entry.sceneEntityId] = effectiveSemantics;
        }
      }

      const config = {
        schema: options.schema ?? 'Ifc4Add2',
        error_policy: options.errorPolicy ?? 'BestEffort',
        validate_topology: options.validateTopology ?? true,
        require_closed_shell: options.requireClosedShell ?? false,
        scale: options.scale ?? 1.0,
        semantics: Object.keys(semantics).length > 0 ? semantics : undefined,
      };

      result = manager.exportSceneToIfc(sceneId, JSON.stringify(config));
      const payload: OpenPlansIfcExportPayload = {
        text: result.text,
        report: JSON.parse(result.reportJson) as Record<string, unknown>,
        sceneId,
        semantics,
        addedEntities: metadata.length,
        skippedEntities,
      };
      return payload;
    } finally {
      if (result) {
        result.free();
      }
      manager.free();
    }
  }

  exportSceneToStep(options: OpenPlansStepExportOptions = {}): OpenPlansStepExportPayload {
    const sceneName = options.sceneName ?? 'OpenPlans STEP Export';
    const {
      manager,
      sceneId,
      metadata,
      skippedEntities,
    } = this.buildSceneManagerFromElements(sceneName);

    if (metadata.length === 0) {
      manager.free();
      throw new Error('No exportable BREP entities found in current OpenPlans scene');
    }

    let result: { text: string; reportJson: string; free: () => void } | null = null;
    try {
      const config = {
        schema: 'AutomotiveDesign',
        product_name: sceneName,
        error_policy: options.errorPolicy ?? 'BestEffort',
        validate_topology: options.validateTopology ?? true,
        require_closed_shell: options.requireClosedShell ?? false,
        scale: options.scale ?? 1.0,
      };

      result = manager.exportSceneToStep(sceneId, JSON.stringify(config));
      const payload: OpenPlansStepExportPayload = {
        text: result.text,
        report: JSON.parse(result.reportJson) as Record<string, unknown>,
        sceneId,
        addedEntities: metadata.length,
        skippedEntities,
      };
      return payload;
    } finally {
      if (result) {
        result.free();
      }
      manager.free();
    }
  }

  private buildSceneManagerFromElements(sceneName: string): {
    manager: OGSceneManager;
    sceneId: string;
    metadata: Array<{ sceneEntityId: string; elementId: string; kind: string }>;
    skippedEntities: number;
  } {
    const manager = new OGSceneManager();
    const sceneId = manager.createScene(sceneName);

    const seenEntityIds = new Set<string>();
    const metadata: Array<{ sceneEntityId: string; elementId: string; kind: string }> = [];
    let skippedEntities = 0;

    for (let i = 0; i < this.ogElements.length; i++) {
      const element = this.ogElements[i];
      const elementId = this.resolveElementRootId(element, i);
      const kind = this.resolveElementKind(element);
      const brepTargets = this.collectBrepTargetsFromElement(element);

      if (brepTargets.length === 0) {
        skippedEntities += 1;
        continue;
      }

      for (let partIndex = 0; partIndex < brepTargets.length; partIndex++) {
        const target = brepTargets[partIndex];
        const suffix = target.suffix
          ? `-${target.suffix}`
          : brepTargets.length > 1
            ? `-part-${partIndex + 1}`
            : '';

        let sceneEntityId = `${elementId}${suffix}`;
        let uniqueCounter = 1;
        while (seenEntityIds.has(sceneEntityId)) {
          uniqueCounter += 1;
          sceneEntityId = `${elementId}${suffix}-${uniqueCounter}`;
        }

        try {
          manager.addBrepEntityToScene(sceneId, sceneEntityId, kind, target.brepSerialized);
          seenEntityIds.add(sceneEntityId);
          metadata.push({ sceneEntityId, elementId, kind });
        } catch {
          skippedEntities += 1;
        }
      }
    }

    return {
      manager,
      sceneId,
      metadata,
      skippedEntities,
    };
  }

  private collectBrepTargetsFromElement(element: any): Array<{ suffix?: string; brepSerialized: string }> {
    const subTargets: Array<{ suffix: string; brepSerialized: string }> = [];
    const subElements = element?.subElements;
    if (subElements instanceof Map) {
      for (const [key, child] of subElements.entries()) {
        const brepSerialized = this.resolveSerializedBrep(child);
        if (!brepSerialized) {
          continue;
        }
        const suffix = String(key).replace(/[^A-Za-z0-9_-]/g, '-');
        subTargets.push({ suffix, brepSerialized });
      }
    }

    if (subTargets.length > 0) {
      return subTargets;
    }

    const directBrep = this.resolveSerializedBrep(element);
    if (!directBrep) {
      return [];
    }
    return [{ brepSerialized: directBrep }];
  }

  private resolveSerializedBrep(target: any): string | null {
    const accessors: Array<'get_brep_serialized' | 'getBrepData' | 'getBrep'> = [
      'get_brep_serialized',
      'getBrepData',
      'getBrep',
    ];

    for (const accessor of accessors) {
      const method = target?.[accessor];
      if (typeof method !== 'function') {
        continue;
      }
      try {
        const raw = method.call(target);
        if (typeof raw === 'string') {
          const trimmed = raw.trim();
          if (trimmed.length > 0) {
            return trimmed;
          }
          continue;
        }
        if (raw && typeof raw === 'object') {
          return JSON.stringify(raw);
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  private resolveElementRootId(element: any, index: number): string {
    const rawId = [element?.ogid, element?.id, element?.uuid]
      .find((candidate) => typeof candidate === 'string' && candidate.trim().length > 0);

    if (typeof rawId === 'string') {
      return rawId.trim().replace(/[^A-Za-z0-9_-]/g, '-');
    }

    return `entity-${index + 1}`;
  }

  private resolveElementKind(element: any): string {
    if (typeof element?.ogType === 'string' && element.ogType.trim().length > 0) {
      return element.ogType.trim();
    }
    return 'OpenPlansEntity';
  }

  private defaultIfcClassForType(kind: string): IfcSemanticClass {
    const normalizedKind = kind.toUpperCase();
    if (normalizedKind.includes('WALL')) {
      return 'IFCWALL';
    }
    if (normalizedKind.includes('WINDOW')) {
      return 'IFCWINDOW';
    }
    if (normalizedKind.includes('DOOR')) {
      return 'IFCDOOR';
    }
    if (normalizedKind.includes('SLAB')) {
      return 'IFCSLAB';
    }
    if (normalizedKind.includes('STAIR')) {
      return 'IFCSTAIR';
    }
    return 'IFCBUILDINGELEMENTPROXY';
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
    const paperFrame = new PaperFrame(config);
    paperFrame.renderer = this.openThree.renderer;
    paperFrame.scene = this.openThree.scene;
    this.openThree.scene.add(paperFrame);
    this.ogElements.push(paperFrame);
    return paperFrame;
  }

  viewportBlock(config?: Partial<ViewportConfig>): ViewportBlock {
    const fullConfig: ViewportConfig = {
      id: config?.id ?? `viewport-${Date.now()}`,
      ogType: 'VIEWPORT_BLOCK',
      size: config?.size ?? [10, 10],
      position: config?.position ?? [0, 0, 0],
      scale: config?.scale ?? 1,
      rotation: config?.rotation ?? 0,
      viewCamera: config?.viewCamera ?? 'top',
      viewCenter: config?.viewCenter ?? [0, 0, 0],
      viewSize: config?.viewSize ?? 20,
      viewportBackground: config?.viewportBackground,
    };
    const viewportBlock = new ViewportBlock(fullConfig);
    this.openThree.scene.add(viewportBlock);
    this.ogElements.push(viewportBlock);
    return viewportBlock;
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

  // // THREE METHODS
  // renderJSON(data: any) {
  //   if (!data || !data.floor_plan || !data.floor_plan.elements) return;

  //   data.floor_plan.elements.forEach((element: any) => {
  //     switch (element.type) {
  //       case 'wall':
  //         // Convert 2D points to 3D points (y=0)
  //         const points = element.points.map((p: number[]) => [p[0], 0, p[1]]);
  //         this.polyline({
  //           points: points,
  //           color: 0x000000 // Default black for walls
  //         });
  //         break;

  //       case 'door':
  //         const door = this.door2D({
  //           ogid: element.id,
  //           labelName: element.label || 'Door',
  //           type: ElementType.DOOR,
  //           doorPosition: { x: element.position[0], y: 0, z: element.position[1] },
  //           doorDimensions: { width: element.length, thickness: 0.2 },
  //           frameDimensions: { width: 0.1, thickness: 0.2 }, // Adjusted default frame width
  //           doorColor: 0xc7c7c7,
  //           frameColor: 0x000000,
  //           doorMaterial: DoorMaterial.WOOD,
  //           swingRotation: 0,
  //           isOpen: false,
  //         });

  //         door.position.set(element.position[0], 0, element.position[1]);

  //         if (element.orientation === 'vertical') {
  //           door.rotation.y = Math.PI / 2;
  //         }
  //         break;

  //       case 'window':
  //         const window = this.singleWindow2D({
  //           ogid: element.id,
  //           labelName: element.label || 'Window',
  //           type: ElementType.WINDOW,
  //           windowPosition: { x: element.position[0], y: 0, z: element.position[1] },
  //           windowDimensions: { width: element.length, thickness: 0.2 },
  //           frameDimensions: { width: 0.1, thickness: 0.2 },
  //           frameColor: 0x000000,
  //           glassColor: 0x87CEEB
  //         });

  //         window.position.set(element.position[0], 0, element.position[1]);

  //         if (element.orientation === 'vertical') {
  //           window.rotation.y = Math.PI / 2;
  //         }
  //         break;
  //     }
  //   });

  //   // Handle rooms if needed in future (skipped for now)
  // }

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

  /* Dimensions */
  createDimension(type: DimensionType) {
    return DimensionTool.createDimension(type);
  }
}
