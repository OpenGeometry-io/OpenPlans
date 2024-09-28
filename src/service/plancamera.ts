import * as THREE from 'three'
import CameraControls from 'camera-controls'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class PlanCamera {
  private camera: THREE.PerspectiveCamera
  controls: CameraControls
  clock: THREE.Clock = new THREE.Clock()

  constructor(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
    this.camera = camera;
    // camera from top
    this.camera.position.set(0, 10, 0);
    // Container Events are not being sent to the shadow dom
    this.controls = new CameraControls(camera, document.body);
    console.log(this.controls);
    this.setupCamera();
  }

  setupCamera() {
    console.log('setupCamera');

    // this.controls.moveTo( 3, 5, 2, true )
  }

  orthoCamera() {

  }

  perspectiveCamera() {

  }

  isometricCamera() {
    
  }

  update() {
    const delta = this.clock.getDelta();
    this.controls.update(delta);
  }
}

