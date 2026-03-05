import * as THREE from "three";
import { GridSnapProvider } from "./GridSnapProvider";
import { ElementSnapProvider } from "./ElementSnapProvider";
import type { SnapOptions, SnapResult } from "../types";

export class SnapEngine {
  private gridProvider: GridSnapProvider;
  private elementProvider: ElementSnapProvider;
  private elementPoints: Array<{ position: THREE.Vector3; entityId: string }> = [];

  constructor(private options: SnapOptions) {
    this.gridProvider = new GridSnapProvider(options.majorStep, options.minorStep);
    this.elementProvider = new ElementSnapProvider(Math.max(options.minorStep * 2, 0.1));
  }

  setOptions(options: SnapOptions): void {
    this.options = options;
    this.gridProvider.setSteps(options.majorStep, options.minorStep);
    this.elementProvider = new ElementSnapProvider(Math.max(options.minorStep * 2, 0.1));
    this.elementProvider.rebuild(this.elementPoints);
  }

  setElementPoints(points: Array<{ position: THREE.Vector3; entityId: string }>): void {
    this.elementPoints = points.map((point) => ({
      entityId: point.entityId,
      position: point.position.clone(),
    }));
    this.elementProvider.rebuild(this.elementPoints);
  }

  snap(
    worldPoint: THREE.Vector3,
    useMajorGrid: boolean,
    excludeEntityId?: string,
    bypassSnap: boolean = false,
  ): SnapResult {
    if (bypassSnap || !this.options.enabled) {
      return {
        point: worldPoint.clone(),
        source: "none",
      };
    }

    if (this.options.elementEnabled) {
      const nearest = this.elementProvider.nearest(worldPoint, this.options.tolerance, excludeEntityId);
      if (nearest) {
        return {
          point: nearest.position.clone(),
          source: "element",
          targetPoint: nearest.position.clone(),
        };
      }
    }

    if (this.options.gridEnabled) {
      const gridPoint = this.gridProvider.snap(worldPoint, useMajorGrid);
      return {
        point: gridPoint,
        source: "grid",
        targetPoint: gridPoint.clone(),
      };
    }

    return {
      point: worldPoint.clone(),
      source: "none",
    };
  }
}
