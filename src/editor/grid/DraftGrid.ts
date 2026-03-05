import * as THREE from "three";
import type { EditorGridOptions } from "../types";

export class DraftGrid {
  private group: THREE.Group = new THREE.Group();
  private options: EditorGridOptions;

  constructor(private scene: THREE.Scene, options: EditorGridOptions) {
    this.options = { ...options, origin: options.origin.clone() };
    this.rebuild();
  }

  setOptions(options: EditorGridOptions): void {
    this.options = { ...options, origin: options.origin.clone() };
    this.rebuild();
  }

  setVisible(visible: boolean): void {
    this.group.visible = visible;
  }

  private rebuild(): void {
    this.group.removeFromParent();
    this.disposeGroup();
    this.group = new THREE.Group();

    const minorMaterial = new THREE.LineBasicMaterial({
      color: this.options.minorColor,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
    });

    const majorMaterial = new THREE.LineBasicMaterial({
      color: this.options.majorColor,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });

    const half = this.options.extent / 2;

    for (let x = -half; x <= half; x += this.options.minor) {
      const isMajor = Math.abs((x / this.options.major) - Math.round(x / this.options.major)) < 1e-6;
      const material = isMajor ? majorMaterial : minorMaterial;
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 0.001, -half),
        new THREE.Vector3(x, 0.001, half),
      ]);
      this.group.add(new THREE.Line(geometry, material));
    }

    for (let z = -half; z <= half; z += this.options.minor) {
      const isMajor = Math.abs((z / this.options.major) - Math.round(z / this.options.major)) < 1e-6;
      const material = isMajor ? majorMaterial : minorMaterial;
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-half, 0.001, z),
        new THREE.Vector3(half, 0.001, z),
      ]);
      this.group.add(new THREE.Line(geometry, material));
    }

    this.group.position.copy(this.options.origin);
    this.group.visible = this.options.enabled;
    this.scene.add(this.group);
  }

  private disposeGroup(): void {
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Line) {
        obj.geometry.dispose();
        const material = obj.material;
        if (material instanceof THREE.Material) {
          material.dispose();
        }
      }
    });
  }

  dispose(): void {
    this.group.removeFromParent();
    this.disposeGroup();
  }
}
