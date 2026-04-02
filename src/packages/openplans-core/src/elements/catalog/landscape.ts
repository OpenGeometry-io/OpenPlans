import { ElementType } from "../base-type";
import type { Placement } from "../../types";
import { DualViewPolylineElement, DEFAULT_PLACEMENT, toColorNumber } from "../shared/dual-view";
import { blobVertices, circleVertices, rectVertices } from "../shared/geometry";

interface RectDimensions {
  width: number;
  depth: number;
}

function closedRectPoints(dimensions: RectDimensions) {
  const vertices = rectVertices(dimensions.width, dimensions.depth);
  return [...vertices, vertices[0]];
}

interface LandscapeBaseOptions {
  ogid?: string;
  labelName: string;
  type: ElementType.LANDSCAPE;
  placement?: Placement;
}

export interface TreeOptions extends LandscapeBaseOptions {
  canopyRadius: number;
  trunkRadius: number;
  canopyColor: number;
  trunkColor: number;
}

export class Tree extends DualViewPolylineElement<TreeOptions> {
  ogType = ElementType.LANDSCAPE;

  constructor(config?: Partial<TreeOptions>) {
    super({
      labelName: "Tree",
      type: ElementType.LANDSCAPE,
      canopyRadius: 1.1,
      trunkRadius: 0.16,
      canopyColor: 0x2f8f46,
      trunkColor: 0x8b5a2b,
      placement: DEFAULT_PLACEMENT,
    }, config);
    this.setOPGeometry();
  }

  get canopyRadius() { return this.propertySet.canopyRadius; }
  set canopyRadius(value: number) { this.propertySet.canopyRadius = Math.max(0.2, value); this.setOPGeometry(); }
  get trunkRadius() { return this.propertySet.trunkRadius; }
  set trunkRadius(value: number) { this.propertySet.trunkRadius = Math.max(0.05, value); this.setOPGeometry(); }
  set canopyColor(value: number) { this.propertySet.canopyColor = toColorNumber(value, this.propertySet.canopyColor); this.setOPGeometry(); }
  get canopyColor() { return this.propertySet.canopyColor; }
  set trunkColor(value: number) { this.propertySet.trunkColor = toColorNumber(value, this.propertySet.trunkColor); this.setOPGeometry(); }
  get trunkColor() { return this.propertySet.trunkColor; }

  setOPGeometry() {
    const radius = this.propertySet.canopyRadius;
    const footprint = rectVertices(radius * 2, radius * 2);
    this.setConfig({ points: [...footprint, footprint[0]], color: 0 });
    this.rebuildViews();
  }

  protected build2D() {
    this.createPlanPolygon({ key: "canopy", color: this.propertySet.canopyColor, vertices: circleVertices(this.propertySet.canopyRadius, 24) });
    this.createPlanPolygon({ key: "trunk", color: this.propertySet.trunkColor, vertices: circleVertices(this.propertySet.trunkRadius, 12), position: [0, 0.001, 0] });
    this.topExportKeys = ["canopy", "trunk"];
  }

  protected build3D() {
    this.createModelCylinder({
      key: "trunk",
      color: this.propertySet.trunkColor,
      radius: this.propertySet.trunkRadius,
      height: 2.2,
      center: [0, 1.1, 0],
      segments: 18,
    });
    this.createModelCylinder({
      key: "canopy",
      color: this.propertySet.canopyColor,
      radius: this.propertySet.canopyRadius,
      height: 1.8,
      center: [0, 2.5, 0],
      segments: 20,
    });
    this.isometricExportKeys = ["trunk", "canopy"];
  }

  setOPMaterial() {}
}

export interface ShrubOptions extends LandscapeBaseOptions {
  radius: number;
  bodyColor: number;
}

export class Shrub extends DualViewPolylineElement<ShrubOptions> {
  ogType = ElementType.LANDSCAPE;

  constructor(config?: Partial<ShrubOptions>) {
    super({
      labelName: "Shrub",
      type: ElementType.LANDSCAPE,
      radius: 0.6,
      bodyColor: 0x3f9a50,
      placement: DEFAULT_PLACEMENT,
    }, config);
    this.setOPGeometry();
  }

  get radius() { return this.propertySet.radius; }
  set radius(value: number) { this.propertySet.radius = Math.max(0.15, value); this.setOPGeometry(); }
  set bodyColor(value: number) { this.propertySet.bodyColor = toColorNumber(value, this.propertySet.bodyColor); this.setOPGeometry(); }
  get bodyColor() { return this.propertySet.bodyColor; }

  setOPGeometry() {
    const footprint = rectVertices(this.propertySet.radius * 2, this.propertySet.radius * 2);
    this.setConfig({ points: [...footprint, footprint[0]], color: 0 });
    this.rebuildViews();
  }

  protected build2D() {
    this.createPlanPolygon({ key: "body", color: this.propertySet.bodyColor, vertices: blobVertices(this.propertySet.radius, this.propertySet.radius, 18) });
    this.topExportKeys = ["body"];
  }

  protected build3D() {
    this.createModelCylinder({
      key: "body",
      color: this.propertySet.bodyColor,
      radius: this.propertySet.radius,
      height: 0.8,
      center: [0, 0.4, 0],
      segments: 20,
    });
    this.isometricExportKeys = ["body"];
  }

  setOPMaterial() {}
}

export interface PlanterOptions extends LandscapeBaseOptions {
  dimensions: RectDimensions;
  planterColor: number;
  plantColor: number;
}

export class Planter extends DualViewPolylineElement<PlanterOptions> {
  ogType = ElementType.LANDSCAPE;

  constructor(config?: Partial<PlanterOptions>) {
    super({
      labelName: "Planter",
      type: ElementType.LANDSCAPE,
      dimensions: { width: 0.6, depth: 0.6 },
      planterColor: 0x8b5a2b,
      plantColor: 0x2f8f46,
      placement: DEFAULT_PLACEMENT,
    }, config);
    this.setOPGeometry();
  }

  get dimensions() { return this.propertySet.dimensions; }
  set dimensions(value: RectDimensions) { this.propertySet.dimensions = value; this.setOPGeometry(); }
  set planterColor(value: number) { this.propertySet.planterColor = toColorNumber(value, this.propertySet.planterColor); this.setOPGeometry(); }
  get planterColor() { return this.propertySet.planterColor; }
  set plantColor(value: number) { this.propertySet.plantColor = toColorNumber(value, this.propertySet.plantColor); this.setOPGeometry(); }
  get plantColor() { return this.propertySet.plantColor; }

  setOPGeometry() {
    this.setConfig({ points: closedRectPoints(this.propertySet.dimensions), color: 0 });
    this.rebuildViews();
  }

  protected build2D() {
    const { width, depth } = this.propertySet.dimensions;
    this.createPlanPolygon({ key: "pot", color: this.propertySet.planterColor, vertices: rectVertices(width, depth) });
    this.createPlanPolygon({ key: "plant", color: this.propertySet.plantColor, vertices: blobVertices(width * 0.35, depth * 0.35, 16), position: [0, 0.001, 0] });
    this.topExportKeys = ["pot", "plant"];
  }

  protected build3D() {
    const { width, depth } = this.propertySet.dimensions;
    this.createModelBox({
      key: "pot",
      color: this.propertySet.planterColor,
      width,
      height: 0.45,
      depth,
      center: [0, 0.225, 0],
    });
    this.createModelCylinder({
      key: "plant",
      color: this.propertySet.plantColor,
      radius: Math.min(width, depth) * 0.3,
      height: 0.65,
      center: [0, 0.62, 0],
      segments: 18,
    });
    this.isometricExportKeys = ["pot", "plant"];
  }

  setOPMaterial() {}
}

export interface FountainOptions extends LandscapeBaseOptions {
  radius: number;
  basinColor: number;
  waterColor: number;
}

export class Fountain extends DualViewPolylineElement<FountainOptions> {
  ogType = ElementType.LANDSCAPE;

  constructor(config?: Partial<FountainOptions>) {
    super({
      labelName: "Fountain",
      type: ElementType.LANDSCAPE,
      radius: 1.0,
      basinColor: 0x808080,
      waterColor: 0x5f8de6,
      placement: DEFAULT_PLACEMENT,
    }, config);
    this.setOPGeometry();
  }

  get radius() { return this.propertySet.radius; }
  set radius(value: number) { this.propertySet.radius = Math.max(0.2, value); this.setOPGeometry(); }
  set basinColor(value: number) { this.propertySet.basinColor = toColorNumber(value, this.propertySet.basinColor); this.setOPGeometry(); }
  get basinColor() { return this.propertySet.basinColor; }
  set waterColor(value: number) { this.propertySet.waterColor = toColorNumber(value, this.propertySet.waterColor); this.setOPGeometry(); }
  get waterColor() { return this.propertySet.waterColor; }

  setOPGeometry() {
    const footprint = rectVertices(this.propertySet.radius * 2, this.propertySet.radius * 2);
    this.setConfig({ points: [...footprint, footprint[0]], color: 0 });
    this.rebuildViews();
  }

  protected build2D() {
    this.createPlanPolygon({ key: "basin", color: this.propertySet.basinColor, vertices: circleVertices(this.propertySet.radius, 28) });
    this.createPlanPolygon({ key: "water", color: this.propertySet.waterColor, vertices: circleVertices(this.propertySet.radius * 0.82, 24), position: [0, 0.001, 0] });
    this.topExportKeys = ["basin", "water"];
  }

  protected build3D() {
    this.createModelCylinder({
      key: "basin",
      color: this.propertySet.basinColor,
      radius: this.propertySet.radius,
      height: 0.4,
      center: [0, 0.2, 0],
      segments: 24,
    });
    this.createModelCylinder({
      key: "water",
      color: this.propertySet.waterColor,
      radius: this.propertySet.radius * 0.82,
      height: 0.12,
      center: [0, 0.28, 0],
      segments: 24,
    });
    this.isometricExportKeys = ["basin", "water"];
  }

  setOPMaterial() {}
}

export interface BenchOptions extends LandscapeBaseOptions {
  dimensions: RectDimensions;
  benchColor: number;
}

export class Bench extends DualViewPolylineElement<BenchOptions> {
  ogType = ElementType.LANDSCAPE;

  constructor(config?: Partial<BenchOptions>) {
    super({
      labelName: "Bench",
      type: ElementType.LANDSCAPE,
      dimensions: { width: 1.4, depth: 0.45 },
      benchColor: 0x8b5a2b,
      placement: DEFAULT_PLACEMENT,
    }, config);
    this.setOPGeometry();
  }

  get dimensions() { return this.propertySet.dimensions; }
  set dimensions(value: RectDimensions) { this.propertySet.dimensions = value; this.setOPGeometry(); }
  set benchColor(value: number) { this.propertySet.benchColor = toColorNumber(value, this.propertySet.benchColor); this.setOPGeometry(); }
  get benchColor() { return this.propertySet.benchColor; }

  setOPGeometry() {
    this.setConfig({ points: closedRectPoints(this.propertySet.dimensions), color: 0 });
    this.rebuildViews();
  }

  protected build2D() {
    const { width, depth } = this.propertySet.dimensions;
    this.createPlanPolygon({ key: "seat", color: this.propertySet.benchColor, vertices: rectVertices(width, depth) });
    this.createPlanPolygon({
      key: "backrest",
      color: 0x6b3d18,
      vertices: rectVertices(width * 0.95, 0.08),
      position: [0, 0.001, -(depth / 2) + 0.04],
    });
    this.topExportKeys = ["seat", "backrest"];
  }

  protected build3D() {
    const { width, depth } = this.propertySet.dimensions;
    this.createModelBox({
      key: "seat",
      color: this.propertySet.benchColor,
      width,
      height: 0.08,
      depth,
      center: [0, 0.45, 0],
    });
    this.createModelBox({
      key: "backrest",
      color: 0x6b3d18,
      width: width * 0.95,
      height: 0.45,
      depth: 0.08,
      center: [0, 0.68, -(depth / 2) + 0.04],
    });
    this.createModelBox({
      key: "leftLeg",
      color: 0x4a2c16,
      width: 0.06,
      height: 0.45,
      depth: 0.06,
      center: [-(width / 2) + 0.12, 0.225, 0],
    });
    this.createModelBox({
      key: "rightLeg",
      color: 0x4a2c16,
      width: 0.06,
      height: 0.45,
      depth: 0.06,
      center: [(width / 2) - 0.12, 0.225, 0],
    });
    this.isometricExportKeys = ["seat", "backrest", "leftLeg", "rightLeg"];
  }

  setOPMaterial() {}
}

export {
  Tree as Tree2D,
  Shrub as Shrub2D,
  Planter as Planter2D,
  Fountain as Fountain2D,
  Bench as Bench2D,
};
