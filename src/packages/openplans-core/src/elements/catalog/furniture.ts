import { ElementType } from "../base-type";
import type { Placement } from "../../types";
import { DualViewPolylineElement, DEFAULT_PLACEMENT, setObjectColor, toColorNumber } from "../shared/dual-view";
import { rectVertices, roundedRectVertices } from "../shared/geometry";

interface RectDimensions {
  width: number;
  depth: number;
}

function closedRectPoints(dimensions: RectDimensions) {
  const vertices = rectVertices(dimensions.width, dimensions.depth);
  return [...vertices, vertices[0]];
}

export interface ChairOptions {
  ogid?: string;
  labelName: string;
  type: ElementType.FURNITURE;
  dimensions: RectDimensions;
  chairColor: number;
  legSize: number;
  placement?: Placement;
}

export class Chair extends DualViewPolylineElement<ChairOptions> {
  ogType = ElementType.FURNITURE;

  constructor(config?: Partial<ChairOptions>) {
    super({
      labelName: "Chair",
      type: ElementType.FURNITURE,
      dimensions: { width: 0.55, depth: 0.55 },
      chairColor: 0xd8d8d8,
      legSize: 0.05,
      placement: DEFAULT_PLACEMENT,
    }, config);
    this.setOPGeometry();
  }

  get dimensions() {
    return this.propertySet.dimensions;
  }

  set dimensions(value: RectDimensions) {
    this.propertySet.dimensions = value;
    this.setOPGeometry();
  }

  get chairColor() {
    return this.propertySet.chairColor;
  }

  set chairColor(value: number) {
    this.propertySet.chairColor = toColorNumber(value, this.propertySet.chairColor);
    this.setOPMaterial();
  }

  get legSize() {
    return this.propertySet.legSize;
  }

  set legSize(value: number) {
    this.propertySet.legSize = Math.max(0.03, value);
    this.setOPGeometry();
  }

  setOPGeometry() {
    this.setConfig({ points: closedRectPoints(this.propertySet.dimensions), color: 0 });
    this.rebuildViews();
  }

  protected build2D() {
    const { width, depth } = this.propertySet.dimensions;
    const halfWidth = width / 2;
    const halfDepth = depth / 2;
    const legOffsetX = halfWidth - 0.08;
    const legOffsetZ = halfDepth - 0.08;

    this.createPlanPolygon({
      key: "seat",
      color: this.propertySet.chairColor,
      vertices: rectVertices(width, depth),
    });

    this.createPlanPolygon({
      key: "backrest",
      color: 0xbfbfbf,
      vertices: rectVertices(width * 0.9, 0.12),
      position: [0, 0.001, -halfDepth + 0.06],
    });

    [
      [-legOffsetX, -legOffsetZ],
      [legOffsetX, -legOffsetZ],
      [-legOffsetX, legOffsetZ],
      [legOffsetX, legOffsetZ],
    ].forEach(([x, z], index) => {
      this.createPlanPolygon({
        key: `leg${index}`,
        color: this.propertySet.chairColor,
        vertices: rectVertices(this.propertySet.legSize, this.propertySet.legSize),
        position: [x, 0.002, z],
      });
    });

    this.topExportKeys = ["seat", "backrest", "leg0", "leg1", "leg2", "leg3"];
  }

  protected build3D() {
    const { width, depth } = this.propertySet.dimensions;
    const legHeight = 0.45;
    const seatHeight = 0.08;
    const backHeight = 0.55;
    const halfWidth = width / 2;
    const halfDepth = depth / 2;
    const legOffsetX = halfWidth - 0.08;
    const legOffsetZ = halfDepth - 0.08;

    [
      [-legOffsetX, -legOffsetZ],
      [legOffsetX, -legOffsetZ],
      [-legOffsetX, legOffsetZ],
      [legOffsetX, legOffsetZ],
    ].forEach(([x, z], index) => {
      this.createModelBox({
        key: `leg${index}`,
        color: 0x555555,
        width: this.propertySet.legSize,
        height: legHeight,
        depth: this.propertySet.legSize,
        center: [x, legHeight / 2, z],
      });
    });

    this.createModelBox({
      key: "seat",
      color: this.propertySet.chairColor,
      width,
      height: seatHeight,
      depth,
      center: [0, legHeight + seatHeight / 2, 0],
    });

    this.createModelBox({
      key: "backrest",
      color: 0xbfbfbf,
      width: width * 0.9,
      height: backHeight,
      depth: 0.08,
      center: [0, legHeight + seatHeight + backHeight / 2, -halfDepth + 0.04],
    });

    this.isometricExportKeys = ["seat", "backrest", "leg0", "leg1", "leg2", "leg3"];
  }

  setOPMaterial() {
    setObjectColor(this.subElements2D.get("seat"), this.propertySet.chairColor);
    setObjectColor(this.subElements3D.get("seat"), this.propertySet.chairColor);
  }
}

export interface SofaOptions {
  ogid?: string;
  labelName: string;
  type: ElementType.FURNITURE;
  dimensions: RectDimensions;
  sofaColor: number;
  cushionColor: number;
  placement?: Placement;
}

export class Sofa extends DualViewPolylineElement<SofaOptions> {
  ogType = ElementType.FURNITURE;

  constructor(config?: Partial<SofaOptions>) {
    super({
      labelName: "Sofa",
      type: ElementType.FURNITURE,
      dimensions: { width: 2.1, depth: 0.9 },
      sofaColor: 0xa7a7a7,
      cushionColor: 0xdedede,
      placement: DEFAULT_PLACEMENT,
    }, config);
    this.setOPGeometry();
  }

  get dimensions() {
    return this.propertySet.dimensions;
  }

  set dimensions(value: RectDimensions) {
    this.propertySet.dimensions = value;
    this.setOPGeometry();
  }

  get sofaColor() {
    return this.propertySet.sofaColor;
  }

  set sofaColor(value: number) {
    this.propertySet.sofaColor = toColorNumber(value, this.propertySet.sofaColor);
    this.setOPGeometry();
  }

  get cushionColor() {
    return this.propertySet.cushionColor;
  }

  set cushionColor(value: number) {
    this.propertySet.cushionColor = toColorNumber(value, this.propertySet.cushionColor);
    this.setOPGeometry();
  }

  setOPGeometry() {
    this.setConfig({ points: closedRectPoints(this.propertySet.dimensions), color: 0 });
    this.rebuildViews();
  }

  protected build2D() {
    const { width, depth } = this.propertySet.dimensions;
    const halfDepth = depth / 2;
    const armWidth = 0.14;
    const cushionDepth = depth * 0.4;

    this.createPlanPolygon({
      key: "frame",
      color: this.propertySet.sofaColor,
      vertices: rectVertices(width, depth),
    });

    this.createPlanPolygon({
      key: "back",
      color: 0x8f8f8f,
      vertices: rectVertices(width, 0.14),
      position: [0, 0.001, -halfDepth + 0.07],
    });

    this.createPlanPolygon({
      key: "leftArm",
      color: 0x8f8f8f,
      vertices: rectVertices(armWidth, depth),
      position: [-(width / 2) + armWidth / 2, 0.001, 0],
    });

    this.createPlanPolygon({
      key: "rightArm",
      color: 0x8f8f8f,
      vertices: rectVertices(armWidth, depth),
      position: [(width / 2) - armWidth / 2, 0.001, 0],
    });

    [-0.33, 0, 0.33].forEach((ratio, index) => {
      this.createPlanPolygon({
        key: `cushion${index}`,
        color: this.propertySet.cushionColor,
        vertices: roundedRectVertices(width * 0.24, cushionDepth, 0.04),
        position: [ratio * width, 0.002, halfDepth - cushionDepth / 2 - 0.04],
      });
    });

    this.topExportKeys = ["frame", "back", "leftArm", "rightArm", "cushion0", "cushion1", "cushion2"];
  }

  protected build3D() {
    const { width, depth } = this.propertySet.dimensions;
    const seatHeight = 0.32;
    const armWidth = 0.14;
    const backHeight = 0.5;

    this.createModelBox({
      key: "frame",
      color: this.propertySet.sofaColor,
      width,
      height: seatHeight,
      depth,
      center: [0, seatHeight / 2, 0],
    });

    this.createModelBox({
      key: "back",
      color: 0x8f8f8f,
      width,
      height: backHeight,
      depth: 0.12,
      center: [0, seatHeight + backHeight / 2, -(depth / 2) + 0.06],
    });

    this.createModelBox({
      key: "leftArm",
      color: 0x8f8f8f,
      width: armWidth,
      height: 0.5,
      depth,
      center: [-(width / 2) + armWidth / 2, 0.25, 0],
    });

    this.createModelBox({
      key: "rightArm",
      color: 0x8f8f8f,
      width: armWidth,
      height: 0.5,
      depth,
      center: [(width / 2) - armWidth / 2, 0.25, 0],
    });

    [-0.33, 0, 0.33].forEach((ratio, index) => {
      this.createModelBox({
        key: `cushion${index}`,
        color: this.propertySet.cushionColor,
        width: width * 0.24,
        height: 0.12,
        depth: depth * 0.42,
        center: [ratio * width, seatHeight + 0.06, depth * 0.08],
      });
    });

    this.isometricExportKeys = ["frame", "back", "leftArm", "rightArm", "cushion0", "cushion1", "cushion2"];
  }

  setOPMaterial() {}
}

export interface BedOptions {
  ogid?: string;
  labelName: string;
  type: ElementType.FURNITURE;
  dimensions: RectDimensions;
  bedColor: number;
  pillowColor: number;
  placement?: Placement;
}

export class Bed extends DualViewPolylineElement<BedOptions> {
  ogType = ElementType.FURNITURE;

  constructor(config?: Partial<BedOptions>) {
    super({
      labelName: "Bed",
      type: ElementType.FURNITURE,
      dimensions: { width: 1.6, depth: 2.1 },
      bedColor: 0xf4f4f4,
      pillowColor: 0xcdcdcd,
      placement: DEFAULT_PLACEMENT,
    }, config);
    this.setOPGeometry();
  }

  get dimensions() {
    return this.propertySet.dimensions;
  }

  set dimensions(value: RectDimensions) {
    this.propertySet.dimensions = value;
    this.setOPGeometry();
  }

  get bedColor() {
    return this.propertySet.bedColor;
  }

  set bedColor(value: number) {
    this.propertySet.bedColor = toColorNumber(value, this.propertySet.bedColor);
    this.setOPGeometry();
  }

  get pillowColor() {
    return this.propertySet.pillowColor;
  }

  set pillowColor(value: number) {
    this.propertySet.pillowColor = toColorNumber(value, this.propertySet.pillowColor);
    this.setOPGeometry();
  }

  setOPGeometry() {
    this.setConfig({ points: closedRectPoints(this.propertySet.dimensions), color: 0 });
    this.rebuildViews();
  }

  protected build2D() {
    const { width, depth } = this.propertySet.dimensions;
    const halfDepth = depth / 2;

    this.createPlanPolygon({
      key: "mattress",
      color: this.propertySet.bedColor,
      vertices: rectVertices(width, depth),
    });

    this.createPlanPolygon({
      key: "headboard",
      color: 0x8b7355,
      vertices: rectVertices(width, 0.08),
      position: [0, 0.001, -halfDepth + 0.04],
    });

    this.createPlanPolygon({
      key: "pillow1",
      color: this.propertySet.pillowColor,
      vertices: roundedRectVertices(width * 0.38, depth * 0.14, 0.04),
      position: [-(width / 4), 0.002, -halfDepth + depth * 0.12],
    });

    this.createPlanPolygon({
      key: "pillow2",
      color: this.propertySet.pillowColor,
      vertices: roundedRectVertices(width * 0.38, depth * 0.14, 0.04),
      position: [width / 4, 0.002, -halfDepth + depth * 0.12],
    });

    this.topExportKeys = ["mattress", "headboard", "pillow1", "pillow2"];
  }

  protected build3D() {
    const { width, depth } = this.propertySet.dimensions;
    const baseHeight = 0.18;

    this.createModelBox({
      key: "mattress",
      color: this.propertySet.bedColor,
      width,
      height: 0.28,
      depth,
      center: [0, baseHeight + 0.14, 0],
    });

    this.createModelBox({
      key: "base",
      color: 0xb6a58a,
      width,
      height: baseHeight,
      depth,
      center: [0, baseHeight / 2, 0],
    });

    this.createModelBox({
      key: "headboard",
      color: 0x8b7355,
      width,
      height: 0.8,
      depth: 0.08,
      center: [0, 0.4, -(depth / 2) + 0.04],
    });

    this.createModelBox({
      key: "pillow1",
      color: this.propertySet.pillowColor,
      width: width * 0.36,
      height: 0.08,
      depth: depth * 0.18,
      center: [-(width / 4), baseHeight + 0.32, -(depth / 2) + depth * 0.16],
    });

    this.createModelBox({
      key: "pillow2",
      color: this.propertySet.pillowColor,
      width: width * 0.36,
      height: 0.08,
      depth: depth * 0.18,
      center: [width / 4, baseHeight + 0.32, -(depth / 2) + depth * 0.16],
    });

    this.isometricExportKeys = ["base", "mattress", "headboard", "pillow1", "pillow2"];
  }

  setOPMaterial() {}
}

export interface WardrobeOptions {
  ogid?: string;
  labelName: string;
  type: ElementType.FURNITURE;
  dimensions: RectDimensions;
  bodyColor: number;
  doorColor: number;
  doorSlots: number;
  placement?: Placement;
}

export class Wardrobe extends DualViewPolylineElement<WardrobeOptions> {
  ogType = ElementType.FURNITURE;

  constructor(config?: Partial<WardrobeOptions>) {
    super({
      labelName: "Wardrobe",
      type: ElementType.FURNITURE,
      dimensions: { width: 1.4, depth: 0.6 },
      bodyColor: 0xf2f2f2,
      doorColor: 0xcccccc,
      doorSlots: 2,
      placement: DEFAULT_PLACEMENT,
    }, config);
    this.setOPGeometry();
  }

  get dimensions() {
    return this.propertySet.dimensions;
  }

  set dimensions(value: RectDimensions) {
    this.propertySet.dimensions = value;
    this.setOPGeometry();
  }

  get bodyColor() {
    return this.propertySet.bodyColor;
  }

  set bodyColor(value: number) {
    this.propertySet.bodyColor = toColorNumber(value, this.propertySet.bodyColor);
    this.setOPGeometry();
  }

  get doorColor() {
    return this.propertySet.doorColor;
  }

  set doorColor(value: number) {
    this.propertySet.doorColor = toColorNumber(value, this.propertySet.doorColor);
    this.setOPGeometry();
  }

  get doorSlots() {
    return this.propertySet.doorSlots;
  }

  set doorSlots(value: number) {
    this.propertySet.doorSlots = Math.max(1, Math.min(6, Math.floor(value)));
    this.setOPGeometry();
  }

  setOPGeometry() {
    this.setConfig({ points: closedRectPoints(this.propertySet.dimensions), color: 0 });
    this.rebuildViews();
  }

  protected build2D() {
    const { width, depth } = this.propertySet.dimensions;
    const slotWidth = width / this.propertySet.doorSlots;

    this.createPlanPolygon({
      key: "body",
      color: this.propertySet.bodyColor,
      vertices: rectVertices(width, depth),
    });

    this.createPlanPolygon({
      key: "doorStrip",
      color: this.propertySet.doorColor,
      vertices: rectVertices(width, 0.08),
      position: [0, 0.001, depth / 2 - 0.04],
    });

    for (let index = 1; index < this.propertySet.doorSlots; index += 1) {
      this.createPlanPolygon({
        key: `divider${index}`,
        color: 0x222222,
        vertices: rectVertices(0.02, 0.08),
        position: [-(width / 2) + slotWidth * index, 0.002, depth / 2 - 0.04],
      });
    }

    this.topExportKeys = ["body", "doorStrip", ...Array.from({ length: Math.max(0, this.propertySet.doorSlots - 1) }, (_, index) => `divider${index + 1}`)];
  }

  protected build3D() {
    const { width, depth } = this.propertySet.dimensions;

    this.createModelBox({
      key: "body",
      color: this.propertySet.bodyColor,
      width,
      height: 2.1,
      depth,
      center: [0, 1.05, 0],
    });

    this.createModelBox({
      key: "doorStrip",
      color: this.propertySet.doorColor,
      width,
      height: 2.08,
      depth: 0.04,
      center: [0, 1.04, depth / 2 - 0.02],
    });

    this.isometricExportKeys = ["body", "doorStrip"];
  }

  setOPMaterial() {}
}

export interface DeskOptions {
  ogid?: string;
  labelName: string;
  type: ElementType.FURNITURE;
  dimensions: RectDimensions;
  deskColor: number;
  chairColor: number;
  placement?: Placement;
}

export class Desk extends DualViewPolylineElement<DeskOptions> {
  ogType = ElementType.FURNITURE;

  constructor(config?: Partial<DeskOptions>) {
    super({
      labelName: "Desk",
      type: ElementType.FURNITURE,
      dimensions: { width: 1.4, depth: 0.7 },
      deskColor: 0xf1f1f1,
      chairColor: 0xd0d0d0,
      placement: DEFAULT_PLACEMENT,
    }, config);
    this.setOPGeometry();
  }

  get dimensions() {
    return this.propertySet.dimensions;
  }

  set dimensions(value: RectDimensions) {
    this.propertySet.dimensions = value;
    this.setOPGeometry();
  }

  set deskColor(value: number) {
    this.propertySet.deskColor = toColorNumber(value, this.propertySet.deskColor);
    this.setOPGeometry();
  }

  get deskColor() {
    return this.propertySet.deskColor;
  }

  set chairColor(value: number) {
    this.propertySet.chairColor = toColorNumber(value, this.propertySet.chairColor);
    this.setOPGeometry();
  }

  get chairColor() {
    return this.propertySet.chairColor;
  }

  setOPGeometry() {
    this.setConfig({ points: closedRectPoints(this.propertySet.dimensions), color: 0 });
    this.rebuildViews();
  }

  protected build2D() {
    const { width, depth } = this.propertySet.dimensions;
    const halfWidth = width / 2;
    const halfDepth = depth / 2;

    this.createPlanPolygon({
      key: "desktop",
      color: this.propertySet.deskColor,
      vertices: rectVertices(width, depth),
    });

    [-0.42, 0.42].forEach((xRatio, xIndex) => {
      [-0.35, 0.35].forEach((zRatio, zIndex) => {
        const keyIndex = xIndex * 2 + zIndex;
        this.createPlanPolygon({
          key: `leg${keyIndex}`,
          color: 0x555555,
          vertices: rectVertices(0.05, 0.05),
          position: [xRatio * halfWidth * 2, 0.001, zRatio * halfDepth * 2],
        });
      });
    });

    this.createPlanPolygon({
      key: "chair",
      color: this.propertySet.chairColor,
      vertices: rectVertices(width * 0.35, depth * 0.35),
      position: [0, 0.002, halfDepth + depth * 0.25],
    });

    this.topExportKeys = ["desktop", "leg0", "leg1", "leg2", "leg3", "chair"];
  }

  protected build3D() {
    const { width, depth } = this.propertySet.dimensions;
    const halfWidth = width / 2;
    const halfDepth = depth / 2;

    this.createModelBox({
      key: "desktop",
      color: this.propertySet.deskColor,
      width,
      height: 0.08,
      depth,
      center: [0, 0.76, 0],
    });

    [-0.42, 0.42].forEach((xRatio, xIndex) => {
      [-0.35, 0.35].forEach((zRatio, zIndex) => {
        const keyIndex = xIndex * 2 + zIndex;
        this.createModelBox({
          key: `leg${keyIndex}`,
          color: 0x555555,
          width: 0.05,
          height: 0.72,
          depth: 0.05,
          center: [xRatio * halfWidth * 2, 0.36, zRatio * halfDepth * 2],
        });
      });
    });

    this.createModelBox({
      key: "chair",
      color: this.propertySet.chairColor,
      width: width * 0.35,
      height: 0.45,
      depth: depth * 0.35,
      center: [0, 0.225, halfDepth + depth * 0.25],
    });

    this.isometricExportKeys = ["desktop", "leg0", "leg1", "leg2", "leg3", "chair"];
  }

  setOPMaterial() {}
}

export interface DiningTableOptions {
  ogid?: string;
  labelName: string;
  type: ElementType.FURNITURE;
  dimensions: RectDimensions;
  tableColor: number;
  chairColor: number;
  seats: number;
  placement?: Placement;
}

export class DiningTable extends DualViewPolylineElement<DiningTableOptions> {
  ogType = ElementType.FURNITURE;

  constructor(config?: Partial<DiningTableOptions>) {
    super({
      labelName: "Dining Table",
      type: ElementType.FURNITURE,
      dimensions: { width: 1.8, depth: 1.1 },
      tableColor: 0xf0f0f0,
      chairColor: 0xdadada,
      seats: 4,
      placement: DEFAULT_PLACEMENT,
    }, config);
    this.setOPGeometry();
  }

  get dimensions() {
    return this.propertySet.dimensions;
  }

  set dimensions(value: RectDimensions) {
    this.propertySet.dimensions = value;
    this.setOPGeometry();
  }

  set tableColor(value: number) {
    this.propertySet.tableColor = toColorNumber(value, this.propertySet.tableColor);
    this.setOPGeometry();
  }

  get tableColor() {
    return this.propertySet.tableColor;
  }

  set chairColor(value: number) {
    this.propertySet.chairColor = toColorNumber(value, this.propertySet.chairColor);
    this.setOPGeometry();
  }

  get chairColor() {
    return this.propertySet.chairColor;
  }

  set seats(value: number) {
    this.propertySet.seats = Math.max(2, Math.min(12, Math.floor(value)));
    this.setOPGeometry();
  }

  get seats() {
    return this.propertySet.seats;
  }

  setOPGeometry() {
    this.setConfig({ points: closedRectPoints(this.propertySet.dimensions), color: 0 });
    this.rebuildViews();
  }

  protected build2D() {
    const { width, depth } = this.propertySet.dimensions;
    const seatsPerSide = Math.max(1, Math.floor(this.propertySet.seats / 2));
    const spacing = width / (seatsPerSide + 1);

    this.createPlanPolygon({
      key: "table",
      color: this.propertySet.tableColor,
      vertices: rectVertices(width, depth),
    });

    for (let index = 0; index < seatsPerSide; index += 1) {
      const x = -(width / 2) + spacing * (index + 1);
      this.createPlanPolygon({
        key: `chairFront${index}`,
        color: this.propertySet.chairColor,
        vertices: rectVertices(0.38, 0.38),
        position: [x, 0.001, depth / 2 + 0.28],
      });
      this.createPlanPolygon({
        key: `chairBack${index}`,
        color: this.propertySet.chairColor,
        vertices: rectVertices(0.38, 0.38),
        position: [x, 0.001, -(depth / 2 + 0.28)],
      });
    }

    this.topExportKeys = ["table", ...Array.from({ length: seatsPerSide }, (_, index) => `chairFront${index}`), ...Array.from({ length: seatsPerSide }, (_, index) => `chairBack${index}`)];
  }

  protected build3D() {
    const { width, depth } = this.propertySet.dimensions;
    const seatsPerSide = Math.max(1, Math.floor(this.propertySet.seats / 2));
    const spacing = width / (seatsPerSide + 1);

    this.createModelBox({
      key: "table",
      color: this.propertySet.tableColor,
      width,
      height: 0.1,
      depth,
      center: [0, 0.78, 0],
    });

    [
      [-(width / 2) + 0.12, -(depth / 2) + 0.12],
      [(width / 2) - 0.12, -(depth / 2) + 0.12],
      [-(width / 2) + 0.12, (depth / 2) - 0.12],
      [(width / 2) - 0.12, (depth / 2) - 0.12],
    ].forEach(([x, z], index) => {
      this.createModelBox({
        key: `leg${index}`,
        color: 0x666666,
        width: 0.06,
        height: 0.74,
        depth: 0.06,
        center: [x, 0.37, z],
      });
    });

    for (let index = 0; index < seatsPerSide; index += 1) {
      const x = -(width / 2) + spacing * (index + 1);
      this.createModelBox({
        key: `chairFront${index}`,
        color: this.propertySet.chairColor,
        width: 0.38,
        height: 0.45,
        depth: 0.38,
        center: [x, 0.225, depth / 2 + 0.28],
      });
      this.createModelBox({
        key: `chairBack${index}`,
        color: this.propertySet.chairColor,
        width: 0.38,
        height: 0.45,
        depth: 0.38,
        center: [x, 0.225, -(depth / 2 + 0.28)],
      });
    }

    this.isometricExportKeys = ["table", "leg0", "leg1", "leg2", "leg3", ...Array.from({ length: seatsPerSide }, (_, index) => `chairFront${index}`), ...Array.from({ length: seatsPerSide }, (_, index) => `chairBack${index}`)];
  }

  setOPMaterial() {}
}

export {
  Chair as Chair2D,
  Sofa as Sofa2D,
  Bed as Bed2D,
  Wardrobe as Wardrobe2D,
  Desk as Desk2D,
  DiningTable as DiningTable2D,
};
