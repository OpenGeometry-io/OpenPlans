import * as THREE from 'three'
import { PlanCamera } from './plancamera'
import CameraControls from 'camera-controls'
import { activeTheme, ICanvasTheme } from '../base-type'
import { PlanGrid } from './plangrid'
import * as OpenGrid from './../../OpenGridHelper.ts'
import { BaseWall } from '../elements/base-wall.ts'
import { OpenGeometry } from '../../kernel/dist/index'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { PencilMode } from '../../kernel/dist/src/pencil'
import * as OGLiner from './../helpers/OpenOutliner';
import { BaseDoor } from '../elements/base-door.ts'

export class OpenThree {
  
  private ogElements:any = [];

  scene: THREE.Scene
  renderer: THREE.WebGLRenderer
  planCamera: PlanCamera
  threeCamera: THREE.PerspectiveCamera
  container: HTMLElement
  theme!: ICanvasTheme
  activeTheme: activeTheme = 'light'
  openGeometry: OpenGeometry | undefined
  // planGrid: PlanGrid

  constructor(container: HTMLElement) {
    console.log('OpenThree constructor')
    CameraControls.install({THREE: THREE});
    this.generateTheme()

    this.container = container
    this.scene = new THREE.Scene()
    this.renderer = new THREE.WebGLRenderer({
      antialias: true
    })
    this.threeCamera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 100)
    
    this.planCamera = new PlanCamera(this.threeCamera, this.renderer)
    
    // this.planGrid = new PlanGrid(this.scene, this.theme, this.activeTheme)
    
    this.setup().then(() => {
      this.addWalls()
      this.addDoors()

      this.addGUI()
    })
  }

  // accept a theme with type
  generateTheme() {
    this.theme = {
      darkBlue: {
        background: '#003ca0',
        color: '#fff',
        gridColor: 0xffffff
      },
      light: {
        background: '#ebdbcc',
        color: '#003ca0',
        gridColor: 0x003ca0
      },
      dark: {
        background: '#242b2f',
        color: '#fff',
        gridColor: 0xffffff
      }
    }
  }

  toggleTheme(name: activeTheme) {
    if (!this.theme[name]) {
      return
    }
    this.activeTheme = name
    this.scene.background = new THREE.Color(this.theme[this.activeTheme].background)
    // this.planGrid.applyTheme(this.activeTheme)
    const gridColor = this.hexToRgb(this.theme[this.activeTheme].gridColor)
    OpenGrid.Shader.uniforms.lineColor.value = gridColor
  }

  async setup() {
    this.openGeometry = new OpenGeometry(this.container, this.scene, this.threeCamera);
    await this.openGeometry.setup();
    // this.openGeometry.pencil?.onCursorDown.add((event) => {
    //   console.log('cursor down', event);
    // });

    // this.scene.background = new THREE.Color(0xff00ff)
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.container.appendChild(this.renderer.domElement)
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
    this.scene.add(directionalLight)

    this.scene.background = new THREE.Color(this.theme[this.activeTheme].background)

    window.addEventListener('resize', () => {
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
      this.threeCamera.aspect = this.container.clientWidth / this.container.clientHeight
      this.threeCamera.updateProjectionMatrix()
    })
    this.animate()

    // Utils like Grid, Lights and Etc
    const gridColor = this.hexToRgb(this.theme[this.activeTheme].gridColor)
    const openGrid = new OpenGrid.Grid("xzy", gridColor, 50, 25, true)
    // @ts-ignore
    this.scene.add(openGrid)
  }

  hexToRgb(hex: number) {
    const color = new THREE.Color(hex)
    return new THREE.Vector3(color.r, color.g, color.b)
  }

  animate() {
    requestAnimationFrame(() => this.animate())
    this.renderer.render(this.scene, this.threeCamera)
    this.openGeometry?.update(this.scene, this.threeCamera)
    this.planCamera.update()
  }

  addWalls() {
    // const geometry = new THREE.BoxGeometry()
    // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    // const cube = new THREE.Mesh(geometry, material)
    // this.scene.add(cube)
    // this.dummyMesh = cube
    if (!this.openGeometry?.pencil) return;
    const wall = new BaseWall(0x00ff00, this.openGeometry.pencil);
    wall.position.set(0, 0, -3);
    wall.updateMatrixWorld();
    this.scene.add(wall);
    this.ogElements.push(wall);

    const wall2 = new BaseWall(0xff0000, this.openGeometry.pencil);
    this.scene.add(wall2);
    wall2.position.set(0, 0, 3);
    wall2.rotateY(Math.PI / 2);
    this.ogElements.push(wall2);

    // const planeMesh = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.25), new THREE.RawShaderMaterial({ 
    //   vertexShader: OGLiner.vertexShader(),
    //   fragmentShader: OGLiner.fragmentShader(),
    //   side: THREE.DoubleSide,
    //   uniforms: OGLiner.shader.uniforms,
    //   name: OGLiner.shader.name,
    // }));
    // console.log(planeMesh.geometry);
    // planeMesh.rotateX(-Math.PI / 2);
    // this.scene.add(planeMesh);
  }

  addDoors() {
    if (!this.openGeometry?.pencil) return;
    const door = new BaseDoor(this.openGeometry.pencil);
    this.scene.add(door);
    this.ogElements.push(door);
  }

  getEntitiesByType(type: string) {
    const entities = [];
    for (const entity of this.ogElements) {
      console.log(entity);
      if (entity.ogType === type) {
        entities.push(entity);
      }
    }
    return entities;
  }

  addGUI() {
    const gui = new GUI();
    const wallFolder = gui.addFolder('Wall');
    const wallControls = {
      'thickness': 0.25,
      'color': '#00ff00',
    };
    const walls = this.getEntitiesByType('wall');
    console.log(walls);
    walls.forEach((wall: BaseWall) => {
      const subWall = wallFolder.addFolder(wall.name);
      subWall.add(wallControls, 'thickness', 0.1, 1).name('Thickness').onChange((value) => {
        wall.halfThickness = value / 2;
      });
    });

    const doorFolder = gui.addFolder('Door');
    const doorControls = {
      'rotation': 1,
      'quadrant': 1,
    };
    const doors = this.getEntitiesByType('door');
    doors.forEach((door: BaseDoor) => {
      const subDoor = doorFolder.addFolder(door.name);
      subDoor.add(doorControls, 'rotation', 1, 2).name('Rotation').onChange((value) => {
        door.doorRotation = value;
      });
      subDoor.add(doorControls, 'quadrant', [1, 2, 3, 4]).name('Quadrant').onChange((value) => {
        door.doorQudrant = value;
      });
    });

    const pencil = gui.addFolder('Pencil');
    const pencilControls = {
      'mode': "cursor",
    };
    pencil.add(pencilControls, 'mode', ["select", "cursor"]).name('Mode').onChange((value) => {
      if (!this.openGeometry?.pencil) return;
      this.openGeometry.pencil.mode = value as PencilMode;
    });
  }
}