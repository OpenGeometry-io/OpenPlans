import * as THREE from 'three'

interface ITheme {
  background: string
  color: string
}

export type activeTheme = 'darkBlue' | 'light' | 'dark'

interface ICanvasTheme {
  darkBlue: ITheme,
  light: ITheme,
  dark: ITheme,
}

export class OpenThree {
  scene: THREE.Scene
  renderer: THREE.WebGLRenderer
  camera: THREE.PerspectiveCamera
  container: HTMLElement
  theme!: ICanvasTheme
  activeTheme: activeTheme = 'light'

  dummyMesh!: THREE.Mesh

  constructor(container: HTMLElement) {
    console.log('OpenThree constructor')
    this.container = container
    this.scene = new THREE.Scene()
    this.renderer = new THREE.WebGLRenderer({
      antialias: true
    })
    this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000)
    
    this.generateTheme()
    this.setup()
  }

  // accept a theme with type
  generateTheme() {
    this.theme = {
      darkBlue: {
        background: '#003ca0',
        color: '#fff'
      },
      light: {
        background: '#ebdbcc',
        color: '#003ca0'
      },
      dark: {
        background: '#242b2f',
        color: '#fff'
      }
    }
  }

  toggleTheme(name: activeTheme) {
    if (!this.theme[name]) {
      return
    }
    this.activeTheme = name
    this.scene.background = new THREE.Color(this.theme[this.activeTheme].background)
  }

  setup() {
    // this.scene.background = new THREE.Color(0xff00ff)
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.container.appendChild(this.renderer.domElement)
    this.camera.position.z = 5

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
    this.scene.add(directionalLight)

    this.scene.background = new THREE.Color(this.theme[this.activeTheme].background)

    this.animate()
  }

  animate() {
    requestAnimationFrame(() => this.animate())
    this.renderer.render(this.scene, this.camera)
  }

  addCube() {
    const geometry = new THREE.BoxGeometry()
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    const cube = new THREE.Mesh(geometry, material)
    this.scene.add(cube)
    this.dummyMesh = cube
  }
}