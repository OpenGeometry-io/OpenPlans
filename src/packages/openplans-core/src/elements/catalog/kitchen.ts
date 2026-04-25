// import { ElementType } from "../base-type";
// import type { Placement } from "../../types";
// import { DualViewPolylineElement, DEFAULT_PLACEMENT, toColorNumber } from "../shared/dual-view";
// import { circleVertices, rectVertices } from "../shared/geometry";

// interface RectDimensions {
//   width: number;
//   depth: number;
// }

// function closedRectPoints(dimensions: RectDimensions) {
//   const vertices = rectVertices(dimensions.width, dimensions.depth);
//   return [...vertices, vertices[0]];
// }

// interface KitchenBaseOptions {
//   ogid?: string;
//   labelName: string;
//   type: ElementType.FIXTURE;
//   dimensions: RectDimensions;
//   placement?: Placement;
// }

// export interface CabinetOptions extends KitchenBaseOptions {
//   cabinetColor: number;
//   doorColor: number;
//   doorSlots: number;
// }

// export class Cabinet extends DualViewPolylineElement<CabinetOptions> {
//   ogType = ElementType.FIXTURE;

//   constructor(config?: Partial<CabinetOptions>) {
//     super({
//       labelName: "Cabinet",
//       type: ElementType.FIXTURE,
//       dimensions: { width: 1.2, depth: 0.65 },
//       cabinetColor: 0xf5f5f5,
//       doorColor: 0xcccccc,
//       doorSlots: 2,
//       placement: DEFAULT_PLACEMENT,
//     }, config);
//     this.setOPGeometry();
//   }

//   get dimensions() { return this.propertySet.dimensions; }
//   set dimensions(value: RectDimensions) { this.propertySet.dimensions = value; this.setOPGeometry(); }
//   set cabinetColor(value: number) { this.propertySet.cabinetColor = toColorNumber(value, this.propertySet.cabinetColor); this.setOPGeometry(); }
//   get cabinetColor() { return this.propertySet.cabinetColor; }
//   set doorColor(value: number) { this.propertySet.doorColor = toColorNumber(value, this.propertySet.doorColor); this.setOPGeometry(); }
//   get doorColor() { return this.propertySet.doorColor; }
//   set doorSlots(value: number) { this.propertySet.doorSlots = Math.max(1, Math.min(6, Math.floor(value))); this.setOPGeometry(); }
//   get doorSlots() { return this.propertySet.doorSlots; }

//   setOPGeometry() {
//     this.setConfig({ points: closedRectPoints(this.propertySet.dimensions), color: 0 });
//     this.rebuildViews();
//   }

//   protected build2D() {
//     const { width, depth } = this.propertySet.dimensions;
//     const slotWidth = width / this.propertySet.doorSlots;

//     this.createPlanPolygon({ key: "body", color: this.propertySet.cabinetColor, vertices: rectVertices(width, depth) });
//     this.createPlanPolygon({
//       key: "doorStrip",
//       color: this.propertySet.doorColor,
//       vertices: rectVertices(width * 0.9, 0.08),
//       position: [0, 0.001, depth / 2 - 0.04],
//     });

//     for (let index = 1; index < this.propertySet.doorSlots; index += 1) {
//       this.createPlanPolygon({
//         key: `divider${index}`,
//         color: 0x222222,
//         vertices: rectVertices(0.02, 0.08),
//         position: [-(width / 2) + slotWidth * index, 0.002, depth / 2 - 0.04],
//       });
//     }

//     this.topExportKeys = ["body", "doorStrip", ...Array.from({ length: Math.max(0, this.propertySet.doorSlots - 1) }, (_, index) => `divider${index + 1}`)];
//   }

//   protected build3D() {
//     const { width, depth } = this.propertySet.dimensions;
//     this.createModelBox({
//       key: "body",
//       color: this.propertySet.cabinetColor,
//       width,
//       height: 0.92,
//       depth,
//       center: [0, 0.46, 0],
//     });
//     this.isometricExportKeys = ["body"];
//   }

//   setOPMaterial() {}
// }

// export interface CounterOptions extends KitchenBaseOptions {
//   counterColor: number;
// }

// export class Counter extends DualViewPolylineElement<CounterOptions> {
//   ogType = ElementType.FIXTURE;

//   constructor(config?: Partial<CounterOptions>) {
//     super({
//       labelName: "Counter",
//       type: ElementType.FIXTURE,
//       dimensions: { width: 1.5, depth: 0.65 },
//       counterColor: 0xf5f5f5,
//       placement: DEFAULT_PLACEMENT,
//     }, config);
//     this.setOPGeometry();
//   }

//   get dimensions() { return this.propertySet.dimensions; }
//   set dimensions(value: RectDimensions) { this.propertySet.dimensions = value; this.setOPGeometry(); }
//   set counterColor(value: number) { this.propertySet.counterColor = toColorNumber(value, this.propertySet.counterColor); this.setOPGeometry(); }
//   get counterColor() { return this.propertySet.counterColor; }

//   setOPGeometry() {
//     this.setConfig({ points: closedRectPoints(this.propertySet.dimensions), color: 0 });
//     this.rebuildViews();
//   }

//   protected build2D() {
//     const { width, depth } = this.propertySet.dimensions;
//     this.createPlanPolygon({ key: "surface", color: this.propertySet.counterColor, vertices: rectVertices(width, depth) });
//     this.createPlanPolygon({
//       key: "frontEdge",
//       color: 0xc7c7c7,
//       vertices: rectVertices(width * 0.9, 0.06),
//       position: [0, 0.001, -(depth / 2) + 0.03],
//     });
//     this.topExportKeys = ["surface", "frontEdge"];
//   }

//   protected build3D() {
//     const { width, depth } = this.propertySet.dimensions;
//     this.createModelBox({
//       key: "surface",
//       color: this.propertySet.counterColor,
//       width,
//       height: 0.12,
//       depth,
//       center: [0, 0.9, 0],
//     });
//     this.createModelBox({
//       key: "base",
//       color: 0xdedede,
//       width,
//       height: 0.88,
//       depth: depth * 0.9,
//       center: [0, 0.44, 0],
//     });
//     this.isometricExportKeys = ["surface", "base"];
//   }

//   setOPMaterial() {}
// }

// export interface KitchenSinkOptions extends KitchenBaseOptions {
//   sinkColor: number;
// }

// export class KitchenSink extends DualViewPolylineElement<KitchenSinkOptions> {
//   ogType = ElementType.FIXTURE;

//   constructor(config?: Partial<KitchenSinkOptions>) {
//     super({
//       labelName: "Kitchen Sink",
//       type: ElementType.FIXTURE,
//       dimensions: { width: 1.0, depth: 0.65 },
//       sinkColor: 0xf5f5f5,
//       placement: DEFAULT_PLACEMENT,
//     }, config);
//     this.setOPGeometry();
//   }

//   get dimensions() { return this.propertySet.dimensions; }
//   set dimensions(value: RectDimensions) { this.propertySet.dimensions = value; this.setOPGeometry(); }
//   set sinkColor(value: number) { this.propertySet.sinkColor = toColorNumber(value, this.propertySet.sinkColor); this.setOPGeometry(); }
//   get sinkColor() { return this.propertySet.sinkColor; }

//   setOPGeometry() {
//     this.setConfig({ points: closedRectPoints(this.propertySet.dimensions), color: 0 });
//     this.rebuildViews();
//   }

//   protected build2D() {
//     const { width, depth } = this.propertySet.dimensions;
//     this.createPlanPolygon({ key: "body", color: this.propertySet.sinkColor, vertices: rectVertices(width, depth) });
//     this.createPlanPolygon({
//       key: "basin",
//       color: 0xe6e6e6,
//       vertices: rectVertices(width * 0.45, depth * 0.75),
//       position: [-(width / 4), 0.001, 0],
//     });
//     this.createPlanPolygon({
//       key: "drain",
//       color: 0x666666,
//       vertices: circleVertices(0.03, 12),
//       position: [-(width / 4), 0.002, 0],
//     });
//     this.topExportKeys = ["body", "basin", "drain"];
//   }

//   protected build3D() {
//     const { width, depth } = this.propertySet.dimensions;
//     this.createModelBox({
//       key: "counter",
//       color: this.propertySet.sinkColor,
//       width,
//       height: 0.12,
//       depth,
//       center: [0, 0.9, 0],
//     });
//     this.createModelBox({
//       key: "base",
//       color: 0xd9d9d9,
//       width,
//       height: 0.88,
//       depth: depth * 0.9,
//       center: [0, 0.44, 0],
//     });
//     this.isometricExportKeys = ["counter", "base"];
//   }

//   setOPMaterial() {}
// }

// export interface IslandOptions extends KitchenBaseOptions {
//   islandColor: number;
// }

// export class Island extends DualViewPolylineElement<IslandOptions> {
//   ogType = ElementType.FIXTURE;

//   constructor(config?: Partial<IslandOptions>) {
//     super({
//       labelName: "Kitchen Island",
//       type: ElementType.FIXTURE,
//       dimensions: { width: 1.8, depth: 0.9 },
//       islandColor: 0xf7f7f7,
//       placement: DEFAULT_PLACEMENT,
//     }, config);
//     this.setOPGeometry();
//   }

//   get dimensions() { return this.propertySet.dimensions; }
//   set dimensions(value: RectDimensions) { this.propertySet.dimensions = value; this.setOPGeometry(); }
//   set islandColor(value: number) { this.propertySet.islandColor = toColorNumber(value, this.propertySet.islandColor); this.setOPGeometry(); }
//   get islandColor() { return this.propertySet.islandColor; }

//   setOPGeometry() {
//     this.setConfig({ points: closedRectPoints(this.propertySet.dimensions), color: 0 });
//     this.rebuildViews();
//   }

//   protected build2D() {
//     const { width, depth } = this.propertySet.dimensions;
//     this.createPlanPolygon({ key: "surface", color: this.propertySet.islandColor, vertices: rectVertices(width, depth) });

//     const stoolSpacing = width / 4;
//     for (let index = 0; index < 3; index += 1) {
//       this.createPlanPolygon({
//         key: `stool${index}`,
//         color: 0xcccccc,
//         vertices: circleVertices(0.14, 12),
//         position: [-(width / 2) + stoolSpacing * (index + 1), 0.001, -(depth / 2) - 0.24],
//       });
//     }

//     this.topExportKeys = ["surface", "stool0", "stool1", "stool2"];
//   }

//   protected build3D() {
//     const { width, depth } = this.propertySet.dimensions;
//     this.createModelBox({
//       key: "surface",
//       color: this.propertySet.islandColor,
//       width,
//       height: 0.14,
//       depth,
//       center: [0, 0.92, 0],
//     });
//     this.createModelBox({
//       key: "base",
//       color: 0xe5e5e5,
//       width: width * 0.9,
//       height: 0.9,
//       depth: depth * 0.9,
//       center: [0, 0.45, 0],
//     });
//     this.isometricExportKeys = ["surface", "base"];
//   }

//   setOPMaterial() {}
// }

// export {
//   Cabinet as Cabinet2D,
//   Counter as Counter2D,
//   KitchenSink as KitchenSink2D,
//   Island as Island2D,
// };
