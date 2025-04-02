import * as THREE from 'three'
import CameraControls from 'camera-controls'

export class PlanCamera {
  private camera: THREE.PerspectiveCamera | THREE.OrthographicCamera
  controls: CameraControls
  clock: THREE.Clock = new THREE.Clock()

  constructor(camera: THREE.PerspectiveCamera | THREE.OrthographicCamera, container: HTMLElement) {
    this.camera = camera;
    // camera from top
    this.camera.position.set(0, 20, 0);
    // Container Events are not being sent to the shadow dom
    this.controls = new CameraControls(camera, container);
    // this.controls.mouseButtons.left = CameraControls.ACTION.NONE;
    this.controls.touches.one = CameraControls.ACTION.NONE;
    this.controls.dollyToCursor = true;
    this.controls.minDistance = 1.5;

    this.setupCamera();
  }

  setupCamera() {
    // this.controls.moveTo( 3, 5, 2, true )
  }

  orthoCamera() {

  }

  perspectiveCamera() {

  }

  isometricCamera() {
    
  }

  fitToElement(meshes: THREE.Mesh[]) {
    const box = new THREE.Box3();
    for (const mesh of meshes) {
      box.expandByObject(mesh);
    }
    box.expandByScalar(2);
    this.controls.fitToSphere(box.getBoundingSphere(new THREE.Sphere()), true);
  }

  update() {
    const delta = this.clock.getDelta();
    this.controls.update(delta);
  }
}

