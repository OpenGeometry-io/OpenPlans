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
        this.planMode();
        break;
      case CameraMode.Model:
        this.modelMode();
        break;
    }
  }

  get CameraMode() {
    return this.mode;
  }

  constructor(camera: THREE.PerspectiveCamera | THREE.OrthographicCamera, container: HTMLElement) {
    this.camera = camera;

    this.camera.position.set(0, 20, 0);
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

  async fitToElement(target: THREE.Object3D | THREE.Object3D[]) {
    const box = new THREE.Box3();
    const objects = Array.isArray(target) ? target : [target];
    objects.forEach((object) => box.expandByObject(object));
    // box.expandByScalar(2);
    await this.controls.fitToSphere(box.getBoundingSphere(new THREE.Sphere()), true);
  }

  update() {
    const delta = this.clock.getDelta();
    this.controls.update(delta);
  }
}
