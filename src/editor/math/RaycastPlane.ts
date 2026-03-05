import * as THREE from "three";

export interface PlaneRaycastResult {
  point: THREE.Vector3;
  hit: boolean;
}

export function intersectRayWithPlane(raycaster: THREE.Raycaster, plane: THREE.Plane): PlaneRaycastResult {
  const point = new THREE.Vector3();
  const hit = raycaster.ray.intersectPlane(plane, point) !== null;
  return {
    point,
    hit,
  };
}

export function buildPlanarPlane(y: number = 0): THREE.Plane {
  return new THREE.Plane(new THREE.Vector3(0, 1, 0), -y);
}

export function buildCameraPlane(camera: THREE.Camera, throughPoint: THREE.Vector3): THREE.Plane {
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  return new THREE.Plane().setFromNormalAndCoplanarPoint(direction, throughPoint);
}
