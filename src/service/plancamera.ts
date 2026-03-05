import * as THREE from 'three'
import CameraControls from 'camera-controls'

export enum CameraMode {
  Plan,
  Model
}

export class PlanCamera {
  private camera: THREE.PerspectiveCamera | THREE.OrthographicCamera
  controls: CameraControls
  clock: THREE.Clock = new THREE.Clock()

  private mode: CameraMode = CameraMode.Plan;

  set CameraMode(mode: CameraMode) {
    this.mode = mode;
    switch (mode) {
      case CameraMode.Plan:
        console.log("Plan Mode");
        this.planMode();
        break;
      case CameraMode.Model:
        console.log("Model Mode");
        this.modelMode();
        break;
    }
  }

  get CameraMode() {
    return this.mode;
  }

  constructor(camera: THREE.PerspectiveCamera | THREE.OrthographicCamera, container: HTMLElement) {
    this.camera = camera;
    // camera from top
    this.camera.position.set(0, 20, 0);
    // Container Events are not being sent to the shadow dom
    this.controls = new CameraControls(camera, container);

    this.controls.dollyToCursor = true;
    this.controls.minDistance = 1.5;

    this.setupCamera();
  }

  setupCamera() {
    // Default mode is plan mode
    this.CameraMode = CameraMode.Plan;
  }

  private planMode() {
    this.controls.enabled = true;
    this.controls.mouseButtons.left = CameraControls.ACTION.SCREEN_PAN;
  }

  private modelMode() {
    this.controls.enabled = true;
    this.controls.mouseButtons.left = CameraControls.ACTION.ROTATE;
  }

  async fitToElement(mesh: THREE.Mesh) {
    const box = new THREE.Box3();
    box.expandByObject(mesh);
    // box.expandByScalar(2);
    await this.controls.fitToSphere(box.getBoundingSphere(new THREE.Sphere()), true);
  }

  update() {
    const delta = this.clock.getDelta();
    this.controls.update(delta);
  }

  setControlsEnabled(enabled: boolean) {
    this.controls.enabled = enabled;
  }

  get controlsEnabled() {
    return this.controls.enabled;
  }
}
