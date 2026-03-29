import { OpenGeometry } from 'opengeometry';
import * as THREE from 'three';
import { OpenThree } from './packages/openplans-three/src/three';
import { CameraMode, PlanCamera } from './packages/openplans-three/src/plancamera';

import { RectanglePrimitive, RectangleOptions, ArcPrimitive, ArcOptions, PolylinePrimitive, PolylineOptions, LineOptions, LinePrimitive  } from './packages/openplans-core/src/primitives';
import { CuboidOptions, CuboidShape, CylinderOptions, CylinderShape } from './packages/openplans-core/src/shapes';
import { Wall, WallOptions } from './packages/openplans-core/src/elements/solids/wall';

import { Event } from './utils/event';
import { Door, DoorOptions, Window, WindowOptions } from './packages/openplans-core/src/elements/openings';

// Camera Modes
export { CameraMode } from './packages/openplans-three/src/plancamera';
export * from './packages/openplans-core/src';
export { Door, Window, Wall };
export type { DoorOptions, WindowOptions, WallOptions };

export class OpenPlans {
  // private container: HTMLElement;
  private openThree: OpenThree;
  private planCamera: PlanCamera;

  private elements: Array<THREE.Object3D> = [];
  
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

  arc(config?: ArcOptions) {
    const arc = new ArcPrimitive(config);
    this.openThree.scene.add(arc);
    this.elements.push(arc);
    return arc;
  }

  rectangle(config?: RectangleOptions) {
    const rectangle = new RectanglePrimitive(config);
    this.openThree.scene.add(rectangle);
    this.elements.push(rectangle);
    return rectangle;
  }

  polyline(config?: PolylineOptions) {
    const polyline = new PolylinePrimitive(config);
    this.openThree.scene.add(polyline);
    this.elements.push(polyline);
    return polyline;
  }

  line(config?: LineOptions) {
    const line = new LinePrimitive(config);
    this.openThree.scene.add(line);
    this.elements.push(line);
    return line;
  }

  // Shapes
  cuboid(config?: CuboidOptions) {
    const cuboid = new CuboidShape(config);
    this.openThree.scene.add(cuboid);
    this.elements.push(cuboid);
    return cuboid;
  }

  cylinder(config?: CylinderOptions) {
    const cylinder = new CylinderShape(config);
    this.openThree.scene.add(cylinder);
    this.elements.push(cylinder);
    return cylinder;
  }

  // Elements
  wall(config?: WallOptions) {
    const wall = new Wall(config);
    this.openThree.scene.add(wall);
    this.elements.push(wall);
    return wall;
  }

  door(config?: DoorOptions) {
    const door = new Door(config);
    this.openThree.scene.add(door);
    this.elements.push(door);
    return door;
  }

  window(config?: WindowOptions) {
    const window = new Window(config);
    this.openThree.scene.add(window);
    this.elements.push(window);
    return window;
  }
}
