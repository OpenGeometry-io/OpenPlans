import * as THREE from "three";

export interface SpatialPoint {
  position: THREE.Vector3;
  entityId: string;
}

export class SpatialHash {
  private buckets: Map<string, SpatialPoint[]> = new Map();

  constructor(private readonly cellSize: number) {}

  clear(): void {
    this.buckets.clear();
  }

  insert(point: SpatialPoint): void {
    const key = this.keyFromPosition(point.position);
    const bucket = this.buckets.get(key);
    if (bucket) {
      bucket.push(point);
      return;
    }
    this.buckets.set(key, [point]);
  }

  query(position: THREE.Vector3, radius: number): SpatialPoint[] {
    const results: SpatialPoint[] = [];
    const steps = Math.ceil(radius / this.cellSize);
    const origin = this.cellCoords(position);

    for (let x = -steps; x <= steps; x++) {
      for (let y = -steps; y <= steps; y++) {
        for (let z = -steps; z <= steps; z++) {
          const key = `${origin.x + x}:${origin.y + y}:${origin.z + z}`;
          const bucket = this.buckets.get(key);
          if (!bucket) {
            continue;
          }
          for (const point of bucket) {
            if (point.position.distanceTo(position) <= radius) {
              results.push(point);
            }
          }
        }
      }
    }

    return results;
  }

  private keyFromPosition(position: THREE.Vector3): string {
    const c = this.cellCoords(position);
    return `${c.x}:${c.y}:${c.z}`;
  }

  private cellCoords(position: THREE.Vector3): { x: number; y: number; z: number } {
    return {
      x: Math.floor(position.x / this.cellSize),
      y: Math.floor(position.y / this.cellSize),
      z: Math.floor(position.z / this.cellSize),
    };
  }
}
