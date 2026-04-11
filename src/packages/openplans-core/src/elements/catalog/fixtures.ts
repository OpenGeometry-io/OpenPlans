// import { ElementType } from "../base-type";
// import type { Placement } from "../../types";
// import { DualViewPolylineElement, DEFAULT_PLACEMENT, toColorNumber } from "../shared/dual-view";
// import { circleVertices, ovalVertices, rectVertices, roundedRectVertices } from "../shared/geometry";

// interface RectDimensions {
//   width: number;
//   depth: number;
// }

// function closedRectPoints(dimensions: RectDimensions) {
//   const vertices = rectVertices(dimensions.width, dimensions.depth);
//   return [...vertices, vertices[0]];
// }

// interface FixtureBaseOptions {
//   ogid?: string;
//   labelName: string;
//   dimensions: RectDimensions;
//   placement?: Placement;
// }

// export interface ToiletOptions extends FixtureBaseOptions {
//   type: ElementType.FIXTURE;
//   bowlColor: number;
//   tankColor: number;
// }

// export class Toilet extends DualViewPolylineElement<ToiletOptions> {
//   ogType = ElementType.FIXTURE;

//   constructor(config?: Partial<ToiletOptions>) {
//     super({
//       labelName: "Toilet",
//       type: ElementType.FIXTURE,
//       dimensions: { width: 0.75, depth: 1.1 },
//       bowlColor: 0xffffff,
//       tankColor: 0xe6e6e6,
//       placement: DEFAULT_PLACEMENT,
//     }, config);
//     this.setOPGeometry();
//   }

//   get dimensions() { return this.propertySet.dimensions; }
//   set dimensions(value: RectDimensions) { this.propertySet.dimensions = value; this.setOPGeometry(); }
//   get bowlColor() { return this.propertySet.bowlColor; }
//   set bowlColor(value: number) { this.propertySet.bowlColor = toColorNumber(value, this.propertySet.bowlColor); this.setOPGeometry(); }
//   get tankColor() { return this.propertySet.tankColor; }
//   set tankColor(value: number) { this.propertySet.tankColor = toColorNumber(value, this.propertySet.tankColor); this.setOPGeometry(); }

//   setOPGeometry() {
//     this.setConfig({ points: closedRectPoints(this.propertySet.dimensions), color: 0 });
//     this.rebuildViews();
//   }

//   protected build2D() {
//     const { width, depth } = this.propertySet.dimensions;
//     this.createPlanPolygon({
//       key: "tank",
//       color: this.propertySet.tankColor,
//       vertices: rectVertices(width, depth * 0.25),
//       position: [0, 0, -(depth / 2) + (depth * 0.25) / 2],
//     });
//     this.createPlanPolygon({
//       key: "bowl",
//       color: this.propertySet.bowlColor,
//       vertices: ovalVertices(width * 0.85, depth * 0.72, 18),
//       position: [0, 0.001, depth * 0.12],
//     });
//     this.topExportKeys = ["tank", "bowl"];
//   }

//   protected build3D() {
//     const { width, depth } = this.propertySet.dimensions;
//     this.createModelBox({
//       key: "tank",
//       color: this.propertySet.tankColor,
//       width,
//       height: 0.75,
//       depth: depth * 0.24,
//       center: [0, 0.375, -(depth / 2) + (depth * 0.24) / 2],
//     });
//     this.createModelCylinder({
//       key: "bowl",
//       color: this.propertySet.bowlColor,
//       radius: width * 0.34,
//       height: 0.55,
//       center: [0, 0.275, depth * 0.12],
//     });
//     this.isometricExportKeys = ["tank", "bowl"];
//   }

//   setOPMaterial() {}
// }

// export interface SinkOptions extends FixtureBaseOptions {
//   type: ElementType.FIXTURE;
//   basinColor: number;
//   counterColor: number;
// }

// export class Sink extends DualViewPolylineElement<SinkOptions> {
//   ogType = ElementType.FIXTURE;

//   constructor(config?: Partial<SinkOptions>) {
//     super({
//       labelName: "Sink",
//       type: ElementType.FIXTURE,
//       dimensions: { width: 1.0, depth: 0.6 },
//       basinColor: 0xffffff,
//       counterColor: 0xdddddd,
//       placement: DEFAULT_PLACEMENT,
//     }, config);
//     this.setOPGeometry();
//   }

//   get dimensions() { return this.propertySet.dimensions; }
//   set dimensions(value: RectDimensions) { this.propertySet.dimensions = value; this.setOPGeometry(); }
//   get basinColor() { return this.propertySet.basinColor; }
//   set basinColor(value: number) { this.propertySet.basinColor = toColorNumber(value, this.propertySet.basinColor); this.setOPGeometry(); }
//   get counterColor() { return this.propertySet.counterColor; }
//   set counterColor(value: number) { this.propertySet.counterColor = toColorNumber(value, this.propertySet.counterColor); this.setOPGeometry(); }

//   setOPGeometry() {
//     this.setConfig({ points: closedRectPoints(this.propertySet.dimensions), color: 0 });
//     this.rebuildViews();
//   }

//   protected build2D() {
//     const { width, depth } = this.propertySet.dimensions;
//     this.createPlanPolygon({ key: "counter", color: this.propertySet.counterColor, vertices: rectVertices(width, depth) });
//     this.createPlanPolygon({
//       key: "basin",
//       color: this.propertySet.basinColor,
//       vertices: roundedRectVertices(width * 0.82, depth * 0.5, 0.05),
//       position: [0, 0.001, depth * 0.08],
//     });
//     this.createPlanPolygon({
//       key: "drain",
//       color: 0x444444,
//       vertices: circleVertices(0.025, 12),
//       position: [0, 0.002, depth * 0.08],
//     });
//     this.topExportKeys = ["counter", "basin", "drain"];
//   }

//   protected build3D() {
//     const { width, depth } = this.propertySet.dimensions;
//     this.createModelBox({
//       key: "counter",
//       color: this.propertySet.counterColor,
//       width,
//       height: 0.12,
//       depth,
//       center: [0, 0.06, 0],
//     });
//     this.createModelBox({
//       key: "basin",
//       color: this.propertySet.basinColor,
//       width: width * 0.8,
//       height: 0.22,
//       depth: depth * 0.46,
//       center: [0, 0.17, depth * 0.08],
//     });
//     this.isometricExportKeys = ["counter", "basin"];
//   }

//   setOPMaterial() {}
// }

// export interface ShowerOptions extends FixtureBaseOptions {
//   type: ElementType.FIXTURE;
//   floorColor: number;
//   hardwareColor: number;
// }

// export class Shower extends DualViewPolylineElement<ShowerOptions> {
//   ogType = ElementType.FIXTURE;

//   constructor(config?: Partial<ShowerOptions>) {
//     super({
//       labelName: "Shower",
//       type: ElementType.FIXTURE,
//       dimensions: { width: 0.9, depth: 0.9 },
//       floorColor: 0xf3f3f3,
//       hardwareColor: 0x888888,
//       placement: DEFAULT_PLACEMENT,
//     }, config);
//     this.setOPGeometry();
//   }

//   get dimensions() { return this.propertySet.dimensions; }
//   set dimensions(value: RectDimensions) { this.propertySet.dimensions = value; this.setOPGeometry(); }
//   get floorColor() { return this.propertySet.floorColor; }
//   set floorColor(value: number) { this.propertySet.floorColor = toColorNumber(value, this.propertySet.floorColor); this.setOPGeometry(); }
//   get hardwareColor() { return this.propertySet.hardwareColor; }
//   set hardwareColor(value: number) { this.propertySet.hardwareColor = toColorNumber(value, this.propertySet.hardwareColor); this.setOPGeometry(); }

//   setOPGeometry() {
//     this.setConfig({ points: closedRectPoints(this.propertySet.dimensions), color: 0 });
//     this.rebuildViews();
//   }

//   protected build2D() {
//     const { width, depth } = this.propertySet.dimensions;
//     this.createPlanPolygon({ key: "tray", color: this.propertySet.floorColor, vertices: rectVertices(width, depth) });
//     this.createPlanPolygon({
//       key: "head",
//       color: this.propertySet.hardwareColor,
//       vertices: ovalVertices(0.1, 0.1, 12),
//       position: [-(width / 2) + 0.14, 0.001, -(depth / 2) + 0.14],
//     });
//     this.createPlanPolygon({
//       key: "drain",
//       color: this.propertySet.hardwareColor,
//       vertices: circleVertices(0.035, 10),
//       position: [0, 0.002, 0],
//     });
//     this.topExportKeys = ["tray", "head", "drain"];
//   }

//   protected build3D() {
//     const { width, depth } = this.propertySet.dimensions;
//     this.createModelBox({
//       key: "tray",
//       color: this.propertySet.floorColor,
//       width,
//       height: 0.08,
//       depth,
//       center: [0, 0.04, 0],
//     });
//     this.createModelCylinder({
//       key: "post",
//       color: this.propertySet.hardwareColor,
//       radius: 0.015,
//       height: 1.8,
//       center: [-(width / 2) + 0.1, 0.9, -(depth / 2) + 0.1],
//       segments: 18,
//     });
//     this.createModelCylinder({
//       key: "head",
//       color: this.propertySet.hardwareColor,
//       radius: 0.06,
//       height: 0.03,
//       center: [-(width / 2) + 0.1, 1.78, -(depth / 2) + 0.1],
//       segments: 18,
//     });
//     this.isometricExportKeys = ["tray", "post", "head"];
//   }

//   setOPMaterial() {}
// }

// export interface BathtubOptions extends FixtureBaseOptions {
//   type: ElementType.FIXTURE;
//   tubColor: number;
//   interiorColor: number;
// }

// export class Bathtub extends DualViewPolylineElement<BathtubOptions> {
//   ogType = ElementType.FIXTURE;

//   constructor(config?: Partial<BathtubOptions>) {
//     super({
//       labelName: "Bathtub",
//       type: ElementType.FIXTURE,
//       dimensions: { width: 1.7, depth: 0.75 },
//       tubColor: 0xf6f6f6,
//       interiorColor: 0xe1e1e1,
//       placement: DEFAULT_PLACEMENT,
//     }, config);
//     this.setOPGeometry();
//   }

//   get dimensions() { return this.propertySet.dimensions; }
//   set dimensions(value: RectDimensions) { this.propertySet.dimensions = value; this.setOPGeometry(); }
//   set tubColor(value: number) { this.propertySet.tubColor = toColorNumber(value, this.propertySet.tubColor); this.setOPGeometry(); }
//   get tubColor() { return this.propertySet.tubColor; }
//   set interiorColor(value: number) { this.propertySet.interiorColor = toColorNumber(value, this.propertySet.interiorColor); this.setOPGeometry(); }
//   get interiorColor() { return this.propertySet.interiorColor; }

//   setOPGeometry() {
//     this.setConfig({ points: closedRectPoints(this.propertySet.dimensions), color: 0 });
//     this.rebuildViews();
//   }

//   protected build2D() {
//     const { width, depth } = this.propertySet.dimensions;
//     this.createPlanPolygon({ key: "tub", color: this.propertySet.tubColor, vertices: roundedRectVertices(width, depth, 0.12, 8) });
//     this.createPlanPolygon({
//       key: "interior",
//       color: this.propertySet.interiorColor,
//       vertices: roundedRectVertices(width * 0.82, depth * 0.72, 0.1, 8),
//       position: [0, 0.001, 0],
//     });
//     this.topExportKeys = ["tub", "interior"];
//   }

//   protected build3D() {
//     const { width, depth } = this.propertySet.dimensions;
//     this.createModelBox({
//       key: "tub",
//       color: this.propertySet.tubColor,
//       width,
//       height: 0.55,
//       depth,
//       center: [0, 0.275, 0],
//     });
//     this.createModelBox({
//       key: "interior",
//       color: this.propertySet.interiorColor,
//       width: width * 0.8,
//       height: 0.28,
//       depth: depth * 0.68,
//       center: [0, 0.3, 0],
//     });
//     this.isometricExportKeys = ["tub", "interior"];
//   }

//   setOPMaterial() {}
// }

// export interface BidetOptions extends FixtureBaseOptions {
//   type: ElementType.FIXTURE;
//   bodyColor: number;
// }

// export class Bidet extends DualViewPolylineElement<BidetOptions> {
//   ogType = ElementType.FIXTURE;

//   constructor(config?: Partial<BidetOptions>) {
//     super({
//       labelName: "Bidet",
//       type: ElementType.FIXTURE,
//       dimensions: { width: 0.65, depth: 0.8 },
//       bodyColor: 0xf8f8f8,
//       placement: DEFAULT_PLACEMENT,
//     }, config);
//     this.setOPGeometry();
//   }

//   get dimensions() { return this.propertySet.dimensions; }
//   set dimensions(value: RectDimensions) { this.propertySet.dimensions = value; this.setOPGeometry(); }
//   set bodyColor(value: number) { this.propertySet.bodyColor = toColorNumber(value, this.propertySet.bodyColor); this.setOPGeometry(); }
//   get bodyColor() { return this.propertySet.bodyColor; }

//   setOPGeometry() {
//     this.setConfig({ points: closedRectPoints(this.propertySet.dimensions), color: 0 });
//     this.rebuildViews();
//   }

//   protected build2D() {
//     const { width, depth } = this.propertySet.dimensions;
//     this.createPlanPolygon({ key: "body", color: this.propertySet.bodyColor, vertices: ovalVertices(width, depth, 18) });
//     this.createPlanPolygon({
//       key: "basin",
//       color: 0xe6e6e6,
//       vertices: ovalVertices(width * 0.55, depth * 0.45, 16),
//       position: [0, 0.001, depth * 0.08],
//     });
//     this.topExportKeys = ["body", "basin"];
//   }

//   protected build3D() {
//     const { width } = this.propertySet.dimensions;
//     this.createModelCylinder({
//       key: "body",
//       color: this.propertySet.bodyColor,
//       radius: width * 0.35,
//       height: 0.55,
//       center: [0, 0.275, 0],
//       segments: 20,
//     });
//     this.isometricExportKeys = ["body"];
//   }

//   setOPMaterial() {}
// }

// export interface UrinalOptions extends FixtureBaseOptions {
//   type: ElementType.FIXTURE;
//   bodyColor: number;
// }

// export class Urinal extends DualViewPolylineElement<UrinalOptions> {
//   ogType = ElementType.FIXTURE;

//   constructor(config?: Partial<UrinalOptions>) {
//     super({
//       labelName: "Urinal",
//       type: ElementType.FIXTURE,
//       dimensions: { width: 0.45, depth: 0.45 },
//       bodyColor: 0xf8f8f8,
//       placement: DEFAULT_PLACEMENT,
//     }, config);
//     this.setOPGeometry();
//   }

//   get dimensions() { return this.propertySet.dimensions; }
//   set dimensions(value: RectDimensions) { this.propertySet.dimensions = value; this.setOPGeometry(); }
//   set bodyColor(value: number) { this.propertySet.bodyColor = toColorNumber(value, this.propertySet.bodyColor); this.setOPGeometry(); }
//   get bodyColor() { return this.propertySet.bodyColor; }

//   setOPGeometry() {
//     this.setConfig({ points: closedRectPoints(this.propertySet.dimensions), color: 0 });
//     this.rebuildViews();
//   }

//   protected build2D() {
//     const { width, depth } = this.propertySet.dimensions;
//     this.createPlanPolygon({ key: "body", color: this.propertySet.bodyColor, vertices: roundedRectVertices(width, depth, 0.08, 6) });
//     this.createPlanPolygon({
//       key: "drain",
//       color: 0x444444,
//       vertices: circleVertices(0.03, 12),
//       position: [0, 0.001, depth * 0.1],
//     });
//     this.topExportKeys = ["body", "drain"];
//   }

//   protected build3D() {
//     const { width, depth } = this.propertySet.dimensions;
//     this.createModelBox({
//       key: "body",
//       color: this.propertySet.bodyColor,
//       width,
//       height: 0.75,
//       depth,
//       center: [0, 0.375, 0],
//     });
//     this.isometricExportKeys = ["body"];
//   }

//   setOPMaterial() {}
// }

// export {
//   Toilet as Toilet2D,
//   Sink as Sink2D,
//   Shower as Shower2D,
//   Bathtub as Bathtub2D,
//   Bidet as Bidet2D,
//   Urinal as Urinal2D,
// };
