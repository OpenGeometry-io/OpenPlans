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
import { Door2D, DoorOptions } from './elements/planview/door2D';
import { DoubleDoor2D, DoubleDoorOptions } from './elements/planview/doubleDoor2D';
import { Window2D, WindowOptions } from './elements/planview/window2D';
import { DoubleWindow2D, DoubleWindowOptions } from './elements/planview/doubleWindow2D';
import { Stair2D, StairOptions } from './elements/planview/stair2D';

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

  /* 2D Elements */
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


