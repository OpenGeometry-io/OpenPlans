import * as THREE from "three";
export function computeEntityBounds(entity: THREE.Object3D): THREE.Box3 {
  return new THREE.Box3().setFromObject(entity);
}

export function computeEntityCenter(entity: THREE.Object3D): THREE.Vector3 {
  const bounds = computeEntityBounds(entity);
  return bounds.getCenter(new THREE.Vector3());
}

export function computeBoundsSize(entity: THREE.Object3D): THREE.Vector3 {
  const bounds = computeEntityBounds(entity);
  return bounds.getSize(new THREE.Vector3());
}

export function safeUpOffset(distance: number): THREE.Vector3 {
  return new THREE.Vector3(0, Math.max(distance, 0.05), 0);
}
