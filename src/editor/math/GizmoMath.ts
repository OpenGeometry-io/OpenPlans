import * as THREE from "three";

export function worldToNdc(position: THREE.Vector3, camera: THREE.Camera): THREE.Vector3 {
  return position.clone().project(camera);
}

export function pixelScaleAt(position: THREE.Vector3, camera: THREE.Camera, viewportHeight: number): number {
  if (camera instanceof THREE.PerspectiveCamera) {
    const distance = camera.position.distanceTo(position);
    const fovRad = THREE.MathUtils.degToRad(camera.fov);
    const worldHeight = 2 * Math.tan(fovRad / 2) * distance;
    return worldHeight / viewportHeight;
  }

  if (camera instanceof THREE.OrthographicCamera) {
    return (camera.top - camera.bottom) / viewportHeight;
  }

  return 1;
}

export function angleAroundYAxis(center: THREE.Vector3, point: THREE.Vector3): number {
  const dx = point.x - center.x;
  const dz = point.z - center.z;
  return Math.atan2(dz, dx);
}

export function projectDeltaOnAxis(delta: THREE.Vector3, axis: THREE.Vector3): number {
  const normalized = axis.clone().normalize();
  return delta.dot(normalized);
}

export function clampMin(value: number, min: number): number {
  return Math.max(value, min);
}
