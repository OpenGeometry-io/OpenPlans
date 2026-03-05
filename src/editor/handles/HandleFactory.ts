import * as THREE from "three";
import { HANDLE_COLOR_BY_TYPE, createHandleMaterial } from "./handle-types";
import type { EditorHandle } from "../types";

export class HandleFactory {
  create(handle: EditorHandle): THREE.Mesh {
    const accentColor = HANDLE_COLOR_BY_TYPE[handle.type];
    const material =
      handle.type === "rotate"
        ? createHandleMaterial(accentColor)
        : createHandleMaterial(0xffffff);

    let geometry: THREE.BufferGeometry;
    if (handle.type === "rotate") {
      geometry = new THREE.TorusGeometry(0.12, 0.02, 6, 18);
    } else if (handle.type === "edge") {
      geometry = new THREE.BoxGeometry(0.18, 0.02, 0.08);
    } else if (handle.type === "scale-axis") {
      geometry = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    } else {
      geometry = new THREE.SphereGeometry(0.08, 12, 12);
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = 1000;
    mesh.userData.handleId = handle.id;
    mesh.userData.handleType = handle.type;
    mesh.userData.baseColor = accentColor;
    mesh.position.copy(handle.position);

    if (handle.type === "rotate") {
      mesh.rotateX(Math.PI / 2);
    } else {
      const edges = new THREE.EdgesGeometry(geometry, 30);
      const outlineMaterial = new THREE.LineBasicMaterial({
        color: accentColor,
        depthTest: false,
        depthWrite: false,
        transparent: true,
        opacity: 1,
      });
      const outline = new THREE.LineSegments(edges, outlineMaterial);
      outline.renderOrder = 1001;
      mesh.add(outline);
      mesh.userData.outlineMaterial = outlineMaterial;
    }

    return mesh;
  }
}
