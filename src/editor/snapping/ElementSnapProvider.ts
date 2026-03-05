import * as THREE from "three";
import { SpatialHash } from "./SpatialHash";

export interface SnapPointDescriptor {
  position: THREE.Vector3;
  entityId: string;
}

export class ElementSnapProvider {
  private spatial: SpatialHash;

  constructor(cellSize: number = 0.5) {
    this.spatial = new SpatialHash(cellSize);
  }

  rebuild(points: SnapPointDescriptor[]): void {
    this.spatial.clear();
    for (const point of points) {
      this.spatial.insert({
        entityId: point.entityId,
        position: point.position.clone(),
      });
    }
  }

  nearest(point: THREE.Vector3, radius: number, excludeEntityId?: string): SnapPointDescriptor | null {
    const candidates = this.spatial.query(point, radius);

    let best: SnapPointDescriptor | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const candidate of candidates) {
      if (excludeEntityId && candidate.entityId === excludeEntityId) {
        continue;
      }

      const distance = candidate.position.distanceTo(point);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = {
          entityId: candidate.entityId,
          position: candidate.position.clone(),
        };
      }
    }

    return best;
  }
}
