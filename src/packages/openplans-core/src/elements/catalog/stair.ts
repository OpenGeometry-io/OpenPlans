import { Vector3 } from "opengeometry";
import { ElementType } from "../base-type";
import type { Placement } from "../../types";
import { DualViewPolylineElement, DEFAULT_PLACEMENT, toColorNumber } from "../shared/dual-view";
import { rectVertices } from "../shared/geometry";

export enum StairDirection {
  UP = "UP",
  DOWN = "DOWN",
}

export interface StairOptions {
  ogid?: string;
  labelName: string;
  type: ElementType.STAIR;
  stairDimensions: { width: number; length: number };
  numberOfSteps: number;
  direction: StairDirection;
  stairColor: number;
  arrowColor: number;
  placement?: Placement;
}

export class Stair extends DualViewPolylineElement<StairOptions> {
  ogType = ElementType.STAIR;

  constructor(config?: Partial<StairOptions>) {
    super({
      labelName: "Stair",
      type: ElementType.STAIR,
      stairDimensions: { width: 1.2, length: 3.0 },
      numberOfSteps: 12,
      direction: StairDirection.UP,
      stairColor: 0x8b7355,
      arrowColor: 0x333333,
      placement: DEFAULT_PLACEMENT,
    }, config);
    this.setOPGeometry();
  }

  get stairDimensions() { return this.propertySet.stairDimensions; }
  set stairDimensions(value: { width: number; length: number }) { this.propertySet.stairDimensions = value; this.setOPGeometry(); }
  get numberOfSteps() { return this.propertySet.numberOfSteps; }
  set numberOfSteps(value: number) { this.propertySet.numberOfSteps = Math.max(2, Math.floor(value)); this.setOPGeometry(); }
  get direction() { return this.propertySet.direction; }
  set direction(value: StairDirection) { this.propertySet.direction = value; this.setOPGeometry(); }
  get stairColor() { return this.propertySet.stairColor; }
  set stairColor(value: number) { this.propertySet.stairColor = toColorNumber(value, this.propertySet.stairColor); this.setOPGeometry(); }
  get arrowColor() { return this.propertySet.arrowColor; }
  set arrowColor(value: number) { this.propertySet.arrowColor = toColorNumber(value, this.propertySet.arrowColor); this.setOPGeometry(); }

  setOPGeometry() {
    const { width, length } = this.propertySet.stairDimensions;
    const points = [
      ...rectVertices(length, width),
      rectVertices(length, width)[0],
    ];
    this.setConfig({ points, color: 0 });
    this.rebuildViews();
  }

  protected build2D() {
    const { width, length } = this.propertySet.stairDimensions;
    this.createPlanPolygon({
      key: "boundary",
      color: this.propertySet.stairColor,
      vertices: rectVertices(length, width),
    });

    const treadDepth = length / this.propertySet.numberOfSteps;
    for (let index = 1; index < this.propertySet.numberOfSteps; index += 1) {
      const x = -(length / 2) + index * treadDepth;
      this.createPlanPolygon({
        key: `tread${index}`,
        color: 0x111111,
        vertices: rectVertices(0.02, width),
        position: [x, 0.001, 0],
      });
    }

    const shaftLength = length * 0.38;
    const shaftX = this.propertySet.direction === StairDirection.UP ? -0.1 : 0.1;
    const arrowRotation = this.propertySet.direction === StairDirection.UP ? 0 : Math.PI;
    this.createPlanPolygon({
      key: "arrowShaft",
      color: this.propertySet.arrowColor,
      vertices: rectVertices(shaftLength, 0.04),
      position: [shaftX, 0.002, 0],
      rotationY: arrowRotation,
    });
    const head = this.createPlanPolygon({
      key: "arrowHead",
      color: this.propertySet.arrowColor,
      vertices: [
        new Vector3(0.12, 0, 0),
        new Vector3(-0.02, 0, -0.1),
        new Vector3(-0.02, 0, 0.1),
      ],
      position: [this.propertySet.direction === StairDirection.UP ? length * 0.18 : -(length * 0.18), 0.003, 0],
      rotationY: arrowRotation,
    });
    head.outline = true;

    this.topExportKeys = [
      "boundary",
      ...Array.from({ length: Math.max(0, this.propertySet.numberOfSteps - 1) }, (_, index) => `tread${index + 1}`),
      "arrowShaft",
      "arrowHead",
    ];
  }

  protected build3D() {
    const { width, length } = this.propertySet.stairDimensions;
    const stepHeight = 0.18;
    const treadDepth = length / this.propertySet.numberOfSteps;

    for (let index = 0; index < this.propertySet.numberOfSteps; index += 1) {
      const height = stepHeight * (index + 1);
      const x = -(length / 2) + treadDepth * index + treadDepth / 2;
      this.createModelBox({
        key: `step${index}`,
        color: this.propertySet.stairColor,
        width: treadDepth,
        height,
        depth: width,
        center: [x, height / 2, 0],
      });
    }

    this.isometricExportKeys = Array.from({ length: this.propertySet.numberOfSteps }, (_, index) => `step${index}`);
  }

  setOPMaterial() {}
}

export { Stair as Stair2D };
