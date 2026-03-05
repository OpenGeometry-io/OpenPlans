import * as THREE from "three";

export class GridSnapProvider {
  constructor(private majorStep: number, private minorStep: number) {}

  setSteps(major: number, minor: number): void {
    this.majorStep = major;
    this.minorStep = minor;
  }

  snap(point: THREE.Vector3, useMajor: boolean): THREE.Vector3 {
    const step = useMajor ? this.majorStep : this.minorStep;
    return new THREE.Vector3(
      Math.round(point.x / step) * step,
      point.y,
      Math.round(point.z / step) * step,
    );
  }
}
