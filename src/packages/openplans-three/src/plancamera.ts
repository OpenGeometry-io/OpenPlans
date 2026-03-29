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

  private setView(position: [number, number, number], target: [number, number, number], up: [number, number, number]) {
    this.controls.stop();
    this.camera.up.set(...up);
    this.controls.updateCameraUp();
    void this.controls.setLookAt(...position, ...target, false);
    this.controls.update(0);
  }

  private planMode() {
    this.controls.enabled = true;
    this.controls.mouseButtons.left = CameraControls.ACTION.TRUCK;
    this.setView([0, 20, 0.001], [0, 0, 0], [0, 0, -1]);
  }

  private modelMode() {
    this.controls.enabled = true;
    this.controls.mouseButtons.left = CameraControls.ACTION.ROTATE;
    this.setView([20, 20, 20], [0, 0, 0], [0, 1, 0]);
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
