import * as THREE from "three";
import type { EditableEntity } from "../types";

export class SelectionController {
  private raycaster = new THREE.Raycaster();

  constructor() {
    this.raycaster.params.Line.threshold = 0.35;
    this.raycaster.params.Points.threshold = 0.25;
  }

  pickHandle(ndc: THREE.Vector2, camera: THREE.Camera, handleMeshes: THREE.Object3D[]): string | null {
    this.raycaster.setFromCamera(ndc, camera);
    const hits = this.raycaster.intersectObjects(handleMeshes, false);
    if (hits.length === 0) {
      return null;
    }

    const hit = hits[0].object;
    return (hit.userData.handleId as string) ?? null;
  }

  pickEntity(ndc: THREE.Vector2, camera: THREE.Camera, entities: EditableEntity[]): EditableEntity | null {
    this.raycaster.setFromCamera(ndc, camera);

    if (entities.length === 0) {
      return null;
    }

    const roots = entities as unknown as THREE.Object3D[];
    const rootByUuid = new Map<string, EditableEntity>();
    for (const entity of entities) {
      rootByUuid.set(entity.uuid, entity);
    }

    const hits = this.raycaster.intersectObjects(roots, true);
    for (const hit of hits) {
      let cursor: THREE.Object3D | null = hit.object;
      while (cursor) {
        const owner = rootByUuid.get(cursor.uuid);
        if (owner) {
          return owner;
        }
        cursor = cursor.parent;
      }
    }

    return null;
  }

  worldFromNdcOnPlane(ndc: THREE.Vector2, camera: THREE.Camera, plane: THREE.Plane): THREE.Vector3 | null {
    this.raycaster.setFromCamera(ndc, camera);
    const out = new THREE.Vector3();
    const hit = this.raycaster.ray.intersectPlane(plane, out);
    return hit ? out : null;
  }
}
