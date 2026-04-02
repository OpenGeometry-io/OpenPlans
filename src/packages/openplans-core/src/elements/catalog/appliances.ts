import { ElementType } from "../base-type";
import type { Placement } from "../../types";
import { DualViewPolylineElement, DEFAULT_PLACEMENT, toColorNumber } from "../shared/dual-view";
import { circleVertices, rectVertices } from "../shared/geometry";

interface RectDimensions {
  width: number;
  depth: number;
}

function closedRectPoints(dimensions: RectDimensions) {
  const vertices = rectVertices(dimensions.width, dimensions.depth);
  return [...vertices, vertices[0]];
}

interface ApplianceBaseOptions {
  ogid?: string;
  labelName: string;
  type: ElementType.APPLIANCE;
  dimensions: RectDimensions;
  placement?: Placement;
}

export interface RefrigeratorOptions extends ApplianceBaseOptions {
  bodyColor: number;
}

export class Refrigerator extends DualViewPolylineElement<RefrigeratorOptions> {
  ogType = ElementType.APPLIANCE;

  constructor(config?: Partial<RefrigeratorOptions>) {
    super({
      labelName: "Refrigerator",
      type: ElementType.APPLIANCE,
      dimensions: { width: 0.9, depth: 0.75 },
      bodyColor: 0xf6f6f6,
      placement: DEFAULT_PLACEMENT,
    }, config);
    this.setOPGeometry();
  }

  get dimensions() { return this.propertySet.dimensions; }
  set dimensions(value: RectDimensions) { this.propertySet.dimensions = value; this.setOPGeometry(); }
  get bodyColor() { return this.propertySet.bodyColor; }
  set bodyColor(value: number) { this.propertySet.bodyColor = toColorNumber(value, this.propertySet.bodyColor); this.setOPGeometry(); }

  setOPGeometry() {
    this.setConfig({ points: closedRectPoints(this.propertySet.dimensions), color: 0 });
    this.rebuildViews();
  }

  protected build2D() {
    const { width, depth } = this.propertySet.dimensions;
    this.createPlanPolygon({ key: "body", color: this.propertySet.bodyColor, vertices: rectVertices(width, depth) });
    this.createPlanPolygon({
      key: "doorLine",
      color: 0x999999,
      vertices: rectVertices(width * 0.9, 0.02),
      position: [0, 0.001, 0],
    });
    this.createPlanPolygon({
      key: "handle",
      color: 0x777777,
      vertices: rectVertices(0.05, depth * 0.25),
      position: [-(width / 2) + 0.08, 0.002, depth * 0.2],
    });
    this.topExportKeys = ["body", "doorLine", "handle"];
  }

  protected build3D() {
    const { width, depth } = this.propertySet.dimensions;
    this.createModelBox({
      key: "body",
      color: this.propertySet.bodyColor,
      width,
      height: 1.95,
      depth,
      center: [0, 0.975, 0],
    });
    this.isometricExportKeys = ["body"];
  }

  setOPMaterial() {}
}

export interface StoveOptions extends ApplianceBaseOptions {
  bodyColor: number;
}

export class Stove extends DualViewPolylineElement<StoveOptions> {
  ogType = ElementType.APPLIANCE;

  constructor(config?: Partial<StoveOptions>) {
    super({
      labelName: "Stove",
      type: ElementType.APPLIANCE,
      dimensions: { width: 0.8, depth: 0.65 },
      bodyColor: 0xf6f6f6,
      placement: DEFAULT_PLACEMENT,
    }, config);
    this.setOPGeometry();
  }

  get dimensions() { return this.propertySet.dimensions; }
  set dimensions(value: RectDimensions) { this.propertySet.dimensions = value; this.setOPGeometry(); }
  get bodyColor() { return this.propertySet.bodyColor; }
  set bodyColor(value: number) { this.propertySet.bodyColor = toColorNumber(value, this.propertySet.bodyColor); this.setOPGeometry(); }

  setOPGeometry() {
    this.setConfig({ points: closedRectPoints(this.propertySet.dimensions), color: 0 });
    this.rebuildViews();
  }

  protected build2D() {
    const { width, depth } = this.propertySet.dimensions;
    const offsetX = width * 0.22;
    const offsetZ = depth * 0.22;

    this.createPlanPolygon({ key: "body", color: this.propertySet.bodyColor, vertices: rectVertices(width, depth) });
    [
      [-offsetX, -offsetZ],
      [offsetX, -offsetZ],
      [-offsetX, offsetZ],
      [offsetX, offsetZ],
    ].forEach(([x, z], index) => {
      this.createPlanPolygon({
        key: `burner${index}`,
        color: 0xcccccc,
        vertices: circleVertices(Math.min(width, depth) * 0.12, 16),
        position: [x, 0.001, z],
      });
    });
    this.topExportKeys = ["body", "burner0", "burner1", "burner2", "burner3"];
  }

  protected build3D() {
    const { width, depth } = this.propertySet.dimensions;
    this.createModelBox({
      key: "body",
      color: this.propertySet.bodyColor,
      width,
      height: 0.92,
      depth,
      center: [0, 0.46, 0],
    });
    this.isometricExportKeys = ["body"];
  }

  setOPMaterial() {}
}

export interface WasherOptions extends ApplianceBaseOptions {
  bodyColor: number;
  accentColor: number;
}

export class Washer extends DualViewPolylineElement<WasherOptions> {
  ogType = ElementType.APPLIANCE;

  constructor(config?: Partial<WasherOptions>) {
    super({
      labelName: "Washer",
      type: ElementType.APPLIANCE,
      dimensions: { width: 0.75, depth: 0.7 },
      bodyColor: 0xf6f6f6,
      accentColor: 0xcccccc,
      placement: DEFAULT_PLACEMENT,
    }, config);
    this.setOPGeometry();
  }

  get dimensions() { return this.propertySet.dimensions; }
  set dimensions(value: RectDimensions) { this.propertySet.dimensions = value; this.setOPGeometry(); }
  set bodyColor(value: number) { this.propertySet.bodyColor = toColorNumber(value, this.propertySet.bodyColor); this.setOPGeometry(); }
  get bodyColor() { return this.propertySet.bodyColor; }
  set accentColor(value: number) { this.propertySet.accentColor = toColorNumber(value, this.propertySet.accentColor); this.setOPGeometry(); }
  get accentColor() { return this.propertySet.accentColor; }

  setOPGeometry() {
    this.setConfig({ points: closedRectPoints(this.propertySet.dimensions), color: 0 });
    this.rebuildViews();
  }

  protected build2D() {
    const { width, depth } = this.propertySet.dimensions;
    this.createPlanPolygon({ key: "body", color: this.propertySet.bodyColor, vertices: rectVertices(width, depth) });
    this.createPlanPolygon({
      key: "drum",
      color: this.propertySet.accentColor,
      vertices: circleVertices(Math.min(width, depth) * 0.22, 20),
      position: [0, 0.001, 0],
    });
    this.createPlanPolygon({
      key: "controls",
      color: 0x888888,
      vertices: rectVertices(width * 0.65, 0.06),
      position: [0, 0.002, -(depth / 2) + 0.08],
    });
    this.topExportKeys = ["body", "drum", "controls"];
  }

  protected build3D() {
    const { width, depth } = this.propertySet.dimensions;
    this.createModelBox({
      key: "body",
      color: this.propertySet.bodyColor,
      width,
      height: 0.92,
      depth,
      center: [0, 0.46, 0],
    });
    this.isometricExportKeys = ["body"];
  }

  setOPMaterial() {}
}

export interface DishwasherOptions extends ApplianceBaseOptions {
  bodyColor: number;
}

export class Dishwasher extends DualViewPolylineElement<DishwasherOptions> {
  ogType = ElementType.APPLIANCE;

  constructor(config?: Partial<DishwasherOptions>) {
    super({
      labelName: "Dishwasher",
      type: ElementType.APPLIANCE,
      dimensions: { width: 0.75, depth: 0.65 },
      bodyColor: 0xf6f6f6,
      placement: DEFAULT_PLACEMENT,
    }, config);
    this.setOPGeometry();
  }

  get dimensions() { return this.propertySet.dimensions; }
  set dimensions(value: RectDimensions) { this.propertySet.dimensions = value; this.setOPGeometry(); }
  set bodyColor(value: number) { this.propertySet.bodyColor = toColorNumber(value, this.propertySet.bodyColor); this.setOPGeometry(); }
  get bodyColor() { return this.propertySet.bodyColor; }

  setOPGeometry() {
    this.setConfig({ points: closedRectPoints(this.propertySet.dimensions), color: 0 });
    this.rebuildViews();
  }

  protected build2D() {
    const { width, depth } = this.propertySet.dimensions;
    this.createPlanPolygon({ key: "body", color: this.propertySet.bodyColor, vertices: rectVertices(width, depth) });
    this.createPlanPolygon({
      key: "panel",
      color: 0xcccccc,
      vertices: rectVertices(width * 0.8, 0.06),
      position: [0, 0.001, -(depth / 2) + 0.08],
    });
    this.topExportKeys = ["body", "panel"];
  }

  protected build3D() {
    const { width, depth } = this.propertySet.dimensions;
    this.createModelBox({
      key: "body",
      color: this.propertySet.bodyColor,
      width,
      height: 0.88,
      depth,
      center: [0, 0.44, 0],
    });
    this.isometricExportKeys = ["body"];
  }

  setOPMaterial() {}
}

export {
  Refrigerator as Refrigerator2D,
  Stove as Stove2D,
  Washer as Washer2D,
  Dishwasher as Dishwasher2D,
};
