import * as THREE from "three";

export class SnapGuidesLayer {
  private group: THREE.Group = new THREE.Group();
  private xGuide: THREE.Line;
  private zGuide: THREE.Line;

  constructor(private scene: THREE.Scene) {
    const material = new THREE.LineBasicMaterial({ color: 0x16a34a, transparent: true, opacity: 0.8 });

    const xGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.25, 0.002, 0),
      new THREE.Vector3(0.25, 0.002, 0),
    ]);
    this.xGuide = new THREE.Line(xGeom, material);

    const zGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.002, -0.25),
      new THREE.Vector3(0, 0.002, 0.25),
    ]);
    this.zGuide = new THREE.Line(zGeom, material);

    this.group.add(this.xGuide);
    this.group.add(this.zGuide);
    this.group.visible = false;
    this.scene.add(this.group);
  }

  show(point: THREE.Vector3): void {
    this.group.visible = true;
    this.group.position.copy(point);
  }

  hide(): void {
    this.group.visible = false;
  }

  dispose(): void {
    this.group.removeFromParent();
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Line) {
        obj.geometry.dispose();
      }
    });
  }
}
