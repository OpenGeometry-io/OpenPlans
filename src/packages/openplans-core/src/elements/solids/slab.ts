import type { Placement } from "../../types";
import { ElementType } from "../base-type";
import {
  DualViewPolylineElement,
  DEFAULT_PLACEMENT,
  toColorNumber,
} from "../shared/dual-view";
import { rectVertices } from "../shared/geometry";

function closedRectPoints(length: number, width: number) {
  const vertices = rectVertices(length, width);
  return [...vertices, vertices[0]];
}

export interface SlabOptions {
  ogid?: string;
  labelName: string;
  type: ElementType.SLAB;
  slabDimensions: {
    width: number;
    length: number;
  };
  slabThickness: number;
  slabColor: number;
  slabMaterial: string;
  placement?: Placement;
  slabPosition?: [number, number, number];
}

export class Slab extends DualViewPolylineElement<SlabOptions> {
  ogType = ElementType.SLAB;

  constructor(config?: Partial<SlabOptions>) {
    super({
      labelName: "Slab",
      type: ElementType.SLAB,
      slabDimensions: {
        width: 3,
        length: 4,
      },
      slabThickness: 0.25,
      slabColor: 0xcfcfcf,
      slabMaterial: "concrete",
      placement: DEFAULT_PLACEMENT,
      slabPosition: [0, 0, 0],
    }, config);
    this.setOPGeometry();
  }

  get labelName() { return this.propertySet.labelName; }
  set labelName(value: string) { this.propertySet.labelName = value; }

  get slabDimensions() { return this.propertySet.slabDimensions; }
  set slabDimensions(value: { width: number; length: number }) { this.propertySet.slabDimensions = value; this.setOPGeometry(); }

  get slabWidth() { return this.propertySet.slabDimensions.width; }
  set slabWidth(value: number) {
    this.propertySet.slabDimensions = {
      ...this.propertySet.slabDimensions,
      width: Math.max(0.4, value),
    };
    this.setOPGeometry();
  }

  get slabLength() { return this.propertySet.slabDimensions.length; }
  set slabLength(value: number) {
    this.propertySet.slabDimensions = {
      ...this.propertySet.slabDimensions,
      length: Math.max(0.4, value),
    };
    this.setOPGeometry();
  }

  get slabThickness() { return this.propertySet.slabThickness; }
  set slabThickness(value: number) { this.propertySet.slabThickness = Math.max(0.05, value); this.setOPGeometry(); }

  get slabColor() { return this.propertySet.slabColor; }
  set slabColor(value: number) { this.propertySet.slabColor = toColorNumber(value, this.propertySet.slabColor); this.setOPGeometry(); }

  get slabPosition() { return [...this.propertySet.placement!.position] as [number, number, number]; }
  set slabPosition(value: [number, number, number]) {
    this.propertySet.placement = {
      ...this.propertySet.placement!,
      position: [...value],
    };
    this.setOPGeometry();
  }

  setOPGeometry() {
    const { length, width } = this.propertySet.slabDimensions;
    this.setConfig({
      points: closedRectPoints(length, width),
      color: 0,
    });
    this.rebuildViews();
  }

  protected build2D() {
    const { length, width } = this.propertySet.slabDimensions;
    this.createPlanPolygon({
      key: "footprint",
      color: this.propertySet.slabColor,
      vertices: rectVertices(length, width),
    });
    this.topExportKeys = ["footprint"];
  }

  protected build3D() {
    const { length, width } = this.propertySet.slabDimensions;
    this.createModelBox({
      key: "mass",
      color: this.propertySet.slabColor,
      width: length,
      height: this.propertySet.slabThickness,
      depth: width,
      center: [0, this.propertySet.slabThickness / 2, 0],
    });
    this.isometricExportKeys = ["mass"];
  }

  setOPMaterial() {}
}
