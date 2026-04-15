import { OpenGeometry } from 'opengeometry';
import * as THREE from 'three';
import { OpenThree } from './packages/openplans-three/src/three';
import { CameraMode, PlanCamera } from './packages/openplans-three/src/plancamera';

import { RectanglePrimitive, RectangleOptions, ArcPrimitive, ArcOptions, PolylinePrimitive, PolylineOptions, LineOptions, LinePrimitive  } from './packages/openplans-core/src/primitives';
import { CuboidOptions, CuboidShape, CylinderOptions, CylinderShape } from './packages/openplans-core/src/shapes';
import {
  Bathtub,
  Bed,
  Bench,
  Bidet,
  Board,
  Cabinet,
  Chair,
  Counter,
  Desk,
  DiningTable,
  Dishwasher,
  Door,
  DoubleDoor,
  DoubleWindow,
  Fountain,
  Island,
  KitchenSink,
  Planter,
  Refrigerator,
  Sink,
  Shower,
  Slab,
  Sofa,
  Space,
  Stair,
  Stove,
  Shrub,
  Toilet,
  Tree,
  Urinal,
  SingleWall,
  PolyWall,
  // WallSystem,
  WallOpening,
  Washer,
  Window,
  Wardrobe,
} from './packages/openplans-core/src/elements';

import { ViewManager } from './packages/openplans-core/src/view-manager';

import { Event } from './utils/event';
import { Opening } from './packages/openplans-core/src/elements/openings/opening';

// Camera Modes
export { CameraMode } from './packages/openplans-three/src/plancamera';
export * from './packages/openplans-core/src';
export { Door, Window, SingleWall, PolyWall, WallOpening, /* WallSystem */  };

export type Theme = 'light' | 'dark' | 'darkBlue';

export class OpenPlans {
  // private container: HTMLElement;
  private openThree: OpenThree;
  private planCamera: PlanCamera;
  // private wallSystem: WallSystem;

  private elements: Array<THREE.Object3D> = [];
  
  // TODO: Make this optional later and lazy load when needed
  // Views and Layouts
  viewManager: ViewManager = new ViewManager();

  // Events
  onRender: Event<any> = new Event<any>();

  set CameraMode(mode: CameraMode) {
    this.planCamera.CameraMode = mode;
  }

  get CameraMode() {
    return this.planCamera.CameraMode;
  }

  constructor(container: HTMLElement) {
    // this.container = container
    this.openThree = new OpenThree(container, this.renderCallback)
    // OpenPlans.sOThree = this.openThree;
    this.planCamera = this.openThree.planCamera
    // this.wallSystem = new WallSystem();

    // this.openThree.planCamera.controls.addEventListener("update", () => {
    //   Glyphs.updateManager(this.openThree.threeCamera)
    // });

    // this.setuplabelRenderer();
    // this.setupEvent();
  }

  async setupOpenGeometry(wasmURL?: string) {
    await OpenGeometry.create({
      wasmURL: wasmURL
    });

    // await Glyphs.loadFaces('Edu_NSW_ACT_Foundation_Regular');
    // Glyphs.scene = this.openThree.scene
    // Glyphs.camera = this.openThree.threeCamera

    // const dimensionTool = DimensionTool;
    // dimensionTool.sceneRef = this.openThree.scene;

    // this.pencil?.onCursorDown.add((coords) => {
    //   console.log('Cursor Down', coords)
    // });

    // if (this.pencil) {
    //   ShapeSelector.pencil = this.pencil;
    //   // ShapeEditor.pencil = this.pencil;
    // }
  }

  private renderCallback = () => {
    this.onRender.trigger();
    // if (this.openThree && this.labelRenderer) {
    //   // console.log('Rendering labels');
    //   this.labelRenderer.render(this.openThree.scene, this.openThree.threeCamera);
    // }

    // if (this.profileViews.size > 0) {
    //   // console.log('Rendering 2D/Profile Views');
    //   this.profileViews.forEach(({ camera: profileCamera, renderer: profileRenderer }) => {
    //     profileRenderer.render(this.openThree.scene, profileCamera);
    //   });
    // }

    // const viewportBlocks = this.getEntitiesByType('VIEWPORT_BLOCK');
    // viewportBlocks.forEach((viewportBlock: ViewportBlock) => {
    //   viewportBlock.render(this.openThree.renderer, this.openThree.scene);
    // });
  }

  // /**
  //  * 
  //  * @param theme 
  //  */
  // theme(theme: Theme) {
  //   this.openThree.applyTheme(theme);
  // }

  fitToView(elements: THREE.Object3D[]) {
    const controls = this.planCamera.controls;
    const boundingBox = new THREE.Box3();
    elements.forEach((element) => {
      boundingBox.expandByObject(element);
    });
    controls.fitToSphere(boundingBox.getBoundingSphere(new THREE.Sphere()), true);
  }

  toggleGrid(show: boolean) {
    this.openThree.toggleGrid(show);
  }

  getWallSystem() {
    // return this.wallSystem;
  }

  private addElement<T extends THREE.Object3D>(element: T) {
    this.openThree.scene.add(element);
    this.elements.push(element);
    // if (element instanceof Wall) {
    //   this.wallSystem.register(element);
    // }
    return element;
  }

  getElementById(id: string) {
    return this.elements.find(el => el.userData.ogid === id);
  }

  getElementsByType<T extends THREE.Object3D>(type: new (...args: any[]) => T): T[] {
    return this.elements.filter(el => el instanceof type) as T[];
  }

  arc(config?: ArcOptions) {
    const arc = new ArcPrimitive(config);
    return this.addElement(arc);
  }

  rectangle(config?: RectangleOptions) {
    const rectangle = new RectanglePrimitive(config);
    return this.addElement(rectangle);
  }

  polyline(config?: PolylineOptions) {
    const polyline = new PolylinePrimitive(config);
    return this.addElement(polyline);
  }

  line(config?: LineOptions) {
    const line = new LinePrimitive(config);
    return this.addElement(line);
  }

  // Shapes
  cuboid(config?: CuboidOptions) {
    const cuboid = new CuboidShape(config);
    return this.addElement(cuboid);
  }

  cylinder(config?: CylinderOptions) {
    const cylinder = new CylinderShape(config);
    return this.addElement(cylinder);
  }

  // Elements
  opening(config?: ConstructorParameters<typeof Opening>[0]) {
    return this.addElement(new Opening(config));
  }

  singleWall(config?: ConstructorParameters<typeof SingleWall>[0]) {
    const singleWall = new SingleWall(config);
    return this.addElement(singleWall);
  }

  polyWall(config?: ConstructorParameters<typeof PolyWall>[0]) {
    return this.addElement(new PolyWall(config));
  }

  wallOpening(config?: ConstructorParameters<typeof WallOpening>[0]) {
    return this.addElement(new WallOpening(config));
  }

  door(config?: ConstructorParameters<typeof Door>[0]) {
    return this.addElement(new Door(config));
  }

  window(config?: ConstructorParameters<typeof Window>[0]) {
    return this.addElement(new Window(config));
  }

  // doubleDoor(config?: ConstructorParameters<typeof DoubleDoor>[0]) {
  //   return this.addElement(new DoubleDoor(config));
  // }

  // doubleWindow(config?: ConstructorParameters<typeof DoubleWindow>[0]) {
  //   return this.addElement(new DoubleWindow(config));
  // }

  // slab(config?: ConstructorParameters<typeof Slab>[0]) {
  //   return this.addElement(new Slab(config));
  // }

  // stair(config?: ConstructorParameters<typeof Stair>[0]) {
  //   return this.addElement(new Stair(config));
  // }

  // board(config?: ConstructorParameters<typeof Board>[0]) {
  //   return this.addElement(new Board(config));
  // }

  // space(config?: ConstructorParameters<typeof Space>[0]) {
  //   return this.addElement(new Space(config));
  // }

  // chair(config?: ConstructorParameters<typeof Chair>[0]) {
  //   return this.addElement(new Chair(config));
  // }

  // sofa(config?: ConstructorParameters<typeof Sofa>[0]) {
  //   return this.addElement(new Sofa(config));
  // }

  // bed(config?: ConstructorParameters<typeof Bed>[0]) {
  //   return this.addElement(new Bed(config));
  // }

  // wardrobe(config?: ConstructorParameters<typeof Wardrobe>[0]) {
  //   return this.addElement(new Wardrobe(config));
  // }

  // desk(config?: ConstructorParameters<typeof Desk>[0]) {
  //   return this.addElement(new Desk(config));
  // }

  // diningTable(config?: ConstructorParameters<typeof DiningTable>[0]) {
  //   return this.addElement(new DiningTable(config));
  // }

  // toilet(config?: ConstructorParameters<typeof Toilet>[0]) {
  //   return this.addElement(new Toilet(config));
  // }

  // sink(config?: ConstructorParameters<typeof Sink>[0]) {
  //   return this.addElement(new Sink(config));
  // }

  // shower(config?: ConstructorParameters<typeof Shower>[0]) {
  //   return this.addElement(new Shower(config));
  // }

  // bathtub(config?: ConstructorParameters<typeof Bathtub>[0]) {
  //   return this.addElement(new Bathtub(config));
  // }

  // bidet(config?: ConstructorParameters<typeof Bidet>[0]) {
  //   return this.addElement(new Bidet(config));
  // }

  // urinal(config?: ConstructorParameters<typeof Urinal>[0]) {
  //   return this.addElement(new Urinal(config));
  // }

  // refrigerator(config?: ConstructorParameters<typeof Refrigerator>[0]) {
  //   return this.addElement(new Refrigerator(config));
  // }

  // stove(config?: ConstructorParameters<typeof Stove>[0]) {
  //   return this.addElement(new Stove(config));
  // }

  // washer(config?: ConstructorParameters<typeof Washer>[0]) {
  //   return this.addElement(new Washer(config));
  // }

  // dishwasher(config?: ConstructorParameters<typeof Dishwasher>[0]) {
  //   return this.addElement(new Dishwasher(config));
  // }

  // kitchenSink(config?: ConstructorParameters<typeof KitchenSink>[0]) {
  //   return this.addElement(new KitchenSink(config));
  // }

  // counter(config?: ConstructorParameters<typeof Counter>[0]) {
  //   return this.addElement(new Counter(config));
  // }

  // cabinet(config?: ConstructorParameters<typeof Cabinet>[0]) {
  //   return this.addElement(new Cabinet(config));
  // }

  // island(config?: ConstructorParameters<typeof Island>[0]) {
  //   return this.addElement(new Island(config));
  // }

  // tree(config?: ConstructorParameters<typeof Tree>[0]) {
  //   return this.addElement(new Tree(config));
  // }

  // shrub(config?: ConstructorParameters<typeof Shrub>[0]) {
  //   return this.addElement(new Shrub(config));
  // }

  // planter(config?: ConstructorParameters<typeof Planter>[0]) {
  //   return this.addElement(new Planter(config));
  // }

  // fountain(config?: ConstructorParameters<typeof Fountain>[0]) {
  //   return this.addElement(new Fountain(config));
  // }

  // bench(config?: ConstructorParameters<typeof Bench>[0]) {
  //   return this.addElement(new Bench(config));
  // }
}
