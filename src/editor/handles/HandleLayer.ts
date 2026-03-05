import * as THREE from "three";
import { HandleFactory } from "./HandleFactory";
import { pixelScaleAt } from "../math/GizmoMath";
import type { EditorHandle } from "../types";

export class HandleLayer {
  private group: THREE.Group = new THREE.Group();
  private factory = new HandleFactory();
  private handleById: Map<string, EditorHandle> = new Map();
  private meshById: Map<string, THREE.Mesh> = new Map();
  private hoveredHandleId: string | null = null;

  constructor(private scene: THREE.Scene) {
    this.group.name = "openplans-editor-handles";
    this.scene.add(this.group);
  }

  setHandles(handles: EditorHandle[]): void {
    this.clearMeshes();
    this.handleById.clear();

    for (const handle of handles) {
      const mesh = this.factory.create(handle);
      this.group.add(mesh);
      this.handleById.set(handle.id, handle);
      this.meshById.set(handle.id, mesh);
    }
  }

  setHoveredHandle(handleId: string | null): void {
    if (this.hoveredHandleId && this.meshById.has(this.hoveredHandleId)) {
      const mesh = this.meshById.get(this.hoveredHandleId)!;
      const material = mesh.material as THREE.MeshBasicMaterial;
      if ((mesh.userData.handleType as string) === "rotate") {
        material.color.setHex(mesh.userData.baseColor as number);
      } else {
        material.color.setHex(0xffffff);
      }
      const outlineMaterial = mesh.userData.outlineMaterial as THREE.LineBasicMaterial | undefined;
      if (outlineMaterial) {
        outlineMaterial.color.setHex(mesh.userData.baseColor as number);
      }
    }

    this.hoveredHandleId = handleId;

    if (handleId && this.meshById.has(handleId)) {
      const mesh = this.meshById.get(handleId)!;
      const material = mesh.material as THREE.MeshBasicMaterial;
      const hoverColor = new THREE.Color(mesh.userData.baseColor as number).offsetHSL(0, 0, 0.18);
      if ((mesh.userData.handleType as string) === "rotate") {
        material.color.copy(hoverColor);
      } else {
        material.color.setHex(0xffffff);
      }
      const outlineMaterial = mesh.userData.outlineMaterial as THREE.LineBasicMaterial | undefined;
      if (outlineMaterial) {
        outlineMaterial.color.copy(hoverColor);
      }
    }
  }

  getHandle(handleId: string): EditorHandle | null {
    return this.handleById.get(handleId) ?? null;
  }

  getHandleMeshes(): THREE.Object3D[] {
    return Array.from(this.meshById.values());
  }

  updateScale(camera: THREE.Camera, viewportHeight: number): void {
    for (const mesh of this.meshById.values()) {
      const scale = pixelScaleAt(mesh.getWorldPosition(new THREE.Vector3()), camera, viewportHeight);
      mesh.scale.setScalar(Math.max(scale * 14, 0.03));
    }
  }

  clear(): void {
    this.handleById.clear();
    this.clearMeshes();
  }

  dispose(): void {
    this.clear();
    this.group.removeFromParent();
  }

  private clearMeshes(): void {
    for (const mesh of this.meshById.values()) {
      mesh.removeFromParent();
      mesh.traverse((obj) => {
        const anyObj = obj as any;
        if (anyObj.geometry && typeof anyObj.geometry.dispose === "function") {
          anyObj.geometry.dispose();
        }
        const material = anyObj.material;
        if (material instanceof THREE.Material) {
          material.dispose();
        } else if (Array.isArray(material)) {
          material.forEach((mat) => {
            if (mat instanceof THREE.Material) {
              mat.dispose();
            }
          });
        }
      });
    }
    this.meshById.clear();
  }
}
