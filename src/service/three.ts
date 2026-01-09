import * as THREE from 'three'
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { PlanCamera } from './plancamera'
import { activeTheme, ICanvasTheme } from '../base-type'

import { ShapeSelector } from '../selector/shape-selector.ts'
// import { ShapeEditor } from '../selector/shape-editor.ts'

import * as OpenGrid from '../helpers/OpenGridHelper.ts'

import CameraControls from 'camera-controls'

export class OpenThree {
  scene: THREE.Scene
  renderer: THREE.WebGLRenderer
  labelRenderer: CSS2DRenderer | undefined
  planCamera: PlanCamera
  threeCamera: THREE.PerspectiveCamera
  container: HTMLElement
  theme!: ICanvasTheme
  activeTheme: activeTheme = 'light'
  // planGrid: PlanGrid
  openGrid: THREE.GridHelper | undefined

  constructor(container: HTMLElement, private callback: any) {
    CameraControls.install({THREE: THREE})
    this.generateTheme()

    this.container = container
    this.scene = new THREE.Scene()
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      logarithmicDepthBuffer: true
    })

    this.threeCamera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 1, 1000)
    this.planCamera = new PlanCamera(this.threeCamera, container)
    
    this.setup()
  }

  // accept a theme with type
  generateTheme() {
    this.theme = {
      darkBlue: {
        background: '#5b6676',
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
    // this.scene.background = new THREE.Color(0xff00ff)
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
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
    // const openGrid = new OpenGrid.Grid("xzy", gridColor, 50, 25, true)
    
    this.openGrid = new THREE.GridHelper(100, 100);
    this.scene.add(this.openGrid);

    // Remove this later
    ShapeSelector.scene = this.scene;
    // ShapeEditor.scene = this.scene;
  }

  toggleGrid(show: boolean) {
    if (this.openGrid) {
      if (show) {
        this.scene.add(this.openGrid)
      } else {
        this.scene.remove(this.openGrid)
      }
    } else {
      console.warn('OpenGrid is not initialized')
    }
  }

  hexToRgb(hex: number) {
    const color = new THREE.Color(hex)
    return new THREE.Vector3(color.r, color.g, color.b)
  }

  animate() {
    this.renderer.render(this.scene, this.threeCamera)
    this.planCamera.update()
    // console.log('OpenThree animate')
    this.callback()
    ShapeSelector.update();
    // ShapeEditor.update(this.threeCamera, this.renderer);

    requestAnimationFrame(() => this.animate())
  }
}