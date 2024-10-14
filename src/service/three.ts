import * as THREE from 'three'
import { PlanCamera } from './plancamera'
import CameraControls from 'camera-controls'
import { activeTheme, ICanvasTheme } from '../base-type'
import { PlanGrid } from './plangrid'
import * as OpenGrid from './../../OpenGridHelper.ts'
import { BaseWall } from '../elements/base-wall.ts'
import { OpenGeometry } from '../../kernel/index'

export class OpenThree {
  scene: THREE.Scene
  renderer: THREE.WebGLRenderer
  planCamera: PlanCamera
  threeCamera: THREE.PerspectiveCamera
  container: HTMLElement
  theme!: ICanvasTheme
  activeTheme: activeTheme = 'light'

  dummyMesh!: THREE.Mesh
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
      this.addCube()
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
    const openGeometry = new OpenGeometry(this.container, this.scene, this.threeCamera);
    await openGeometry.setup();
    console.log(openGeometry);

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

    this.planCamera.update()
  }

  addCube() {
    // const geometry = new THREE.BoxGeometry()
    // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    // const cube = new THREE.Mesh(geometry, material)
    // this.scene.add(cube)
    // this.dummyMesh = cube

    const wall = new BaseWall(0x00ff00);
    const wallMesh = wall.getMesh();
    if (wallMesh)
    this.scene.add(wallMesh);
  }
}