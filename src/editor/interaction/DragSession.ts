import * as THREE from "three";
import { buildCameraPlane, buildPlanarPlane } from "../math/RaycastPlane";
import type { DragSpace, PointerInfo } from "../types";
import { SelectionController } from "../selection/SelectionController";

export class DragSession {
  private dragPlane: THREE.Plane;
  private startPoint: THREE.Vector3;
  private currentPoint: THREE.Vector3;

  constructor(
    private selection: SelectionController,
    private camera: THREE.Camera,
    worldStart: THREE.Vector3,
    dragSpace: DragSpace,
    planarY: number = 0,
  ) {
    this.dragPlane = dragSpace === "planar" ? buildPlanarPlane(planarY) : buildCameraPlane(camera, worldStart);
    this.startPoint = worldStart.clone();
    this.currentPoint = worldStart.clone();
  }

  update(pointer: PointerInfo): { world: THREE.Vector3; delta: THREE.Vector3 } | null {
    const world = this.selection.worldFromNdcOnPlane(pointer.ndc, this.camera, this.dragPlane);
    if (!world) {
      return null;
    }

    const delta = world.clone().sub(this.startPoint);
    this.currentPoint.copy(world);

    return {
      world,
      delta,
    };
  }

  get start(): THREE.Vector3 {
    return this.startPoint.clone();
  }

  get current(): THREE.Vector3 {
    return this.currentPoint.clone();
  }
}
