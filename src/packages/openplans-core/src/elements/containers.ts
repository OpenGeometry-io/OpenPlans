// import type { Placement } from "../types";
// import { Vector3 } from "opengeometry";

// import { ElementType } from "./base-type";
// import {
//   DualViewPolylineElement,
//   DEFAULT_PLACEMENT,
//   toColorNumber,
// } from "./shared/dual-view";
// import { rectVertices, roundedRectVertices } from "./shared/geometry";

// type Point = { x: number; y: number; z: number };

// function closedPoints(vertices: Vector3[]) {
//   return [...vertices, vertices[0]];
// }

// function rectFootprint(width: number, depth: number) {
//   return rectVertices(width, depth).map((vertex) => ({
//     x: vertex.x,
//     y: vertex.y,
//     z: vertex.z,
//   }));
// }

// function asVector3Points(points: Point[]) {
//   return points.map((point) => new Vector3(point.x, point.y, point.z));
// }

// function normalizeBoardConfig(config?: Partial<BoardOptions>) {
//   if (!config) {
//     return config;
//   }

//   const width = config.boardDimensions?.width ?? config.width ?? config.dimensions?.width;
//   const height = config.boardDimensions?.height ?? config.height ?? config.dimensions?.height;
//   const depth = config.boardDimensions?.depth ?? config.depth ?? 0.05;
//   const center = config.center;

//   return {
//     ...config,
//     boardDimensions: {
//       width: width ?? 12,
//       height: height ?? 8,
//       depth,
//     },
//     boardColor: config.boardColor ?? config.color ?? 0xf7f3eb,
//     placement: config.placement ?? (center
//       ? {
//           position: [center.x, center.y, center.z],
//           rotation: [0, 0, 0],
//           scale: [1, 1, 1],
//         }
//       : config.placement),
//   };
// }

// function normalizeSpaceConfig(config?: Partial<SpaceOptions>) {
//   if (!config) {
//     return config;
//   }

//   if (config.points || !config.coordinates) {
//     return config;
//   }

//   return {
//     ...config,
//     points: config.coordinates.map(([x, y, z]) => ({ x, y, z })),
//   };
// }

// export interface BoardOptions {
//   ogid?: string;
//   labelName: string;
//   type: ElementType.BOARD;
//   boardDimensions: {
//     width: number;
//     height: number;
//     depth: number;
//   };
//   boardColor: number;
//   borderColor: number;
//   placement?: Placement;
//   center?: Point;
//   color?: number;
//   width?: number;
//   height?: number;
//   depth?: number;
//   dimensions?: {
//     width: number;
//     height: number;
//   };
// }

// export class Board extends DualViewPolylineElement<BoardOptions> {
//   ogType = ElementType.BOARD;

//   constructor(config?: Partial<BoardOptions>) {
//     super({
//       labelName: "Board",
//       type: ElementType.BOARD,
//       boardDimensions: {
//         width: 12,
//         height: 8,
//         depth: 0.05,
//       },
//       boardColor: 0xf7f3eb,
//       borderColor: 0x4d4d4d,
//       placement: DEFAULT_PLACEMENT,
//     }, normalizeBoardConfig(config));
//     this.setOPGeometry();
//   }

//   get labelName() { return this.propertySet.labelName; }
//   set labelName(value: string) { this.propertySet.labelName = value; }

//   get width() { return this.propertySet.boardDimensions.width; }
//   set width(value: number) {
//     this.propertySet.boardDimensions = { ...this.propertySet.boardDimensions, width: Math.max(1, value) };
//     this.setOPGeometry();
//   }

//   get height() { return this.propertySet.boardDimensions.height; }
//   set height(value: number) {
//     this.propertySet.boardDimensions = { ...this.propertySet.boardDimensions, height: Math.max(1, value) };
//     this.setOPGeometry();
//   }

//   get depth() { return this.propertySet.boardDimensions.depth; }
//   set depth(value: number) {
//     this.propertySet.boardDimensions = { ...this.propertySet.boardDimensions, depth: Math.max(0.01, value) };
//     this.setOPGeometry();
//   }

//   get boardColor() { return this.propertySet.boardColor; }
//   set boardColor(value: number) { this.propertySet.boardColor = toColorNumber(value, this.propertySet.boardColor); this.setOPGeometry(); }

//   setOPGeometry() {
//     const { width, height } = this.propertySet.boardDimensions;
//     this.setConfig({
//       points: closedPoints(rectVertices(width, height)),
//       color: 0,
//     });
//     this.rebuildViews();
//   }

//   setOPConfig(config: Partial<BoardOptions>) {
//     const normalized = normalizeBoardConfig(config);
//     if (normalized) {
//       super.setOPConfig(normalized);
//     }
//   }

//   protected build2D() {
//     const { width, height } = this.propertySet.boardDimensions;
//     this.createPlanPolygon({
//       key: "outer",
//       color: this.propertySet.borderColor,
//       vertices: rectVertices(width, height),
//     });
//     this.createPlanPolygon({
//       key: "inner",
//       color: this.propertySet.boardColor,
//       vertices: roundedRectVertices(Math.max(0.4, width - 0.3), Math.max(0.4, height - 0.3), 0.12, 8),
//       position: [0, 0.001, 0],
//     });
//     this.topExportKeys = ["outer", "inner"];
//   }

//   protected build3D() {
//     const { width, height, depth } = this.propertySet.boardDimensions;
//     this.createModelBox({
//       key: "board",
//       color: this.propertySet.boardColor,
//       width,
//       height: depth,
//       depth: height,
//       center: [0, depth / 2, 0],
//     });
//     this.createModelBox({
//       key: "lip",
//       color: this.propertySet.borderColor,
//       width: width + 0.08,
//       height: 0.02,
//       depth: height + 0.08,
//       center: [0, depth + 0.01, 0],
//     });
//     this.isometricExportKeys = ["board", "lip"];
//   }

//   setOPMaterial() {}
// }

// export interface SpaceOptions {
//   ogid?: string;
//   labelName: string;
//   type: ElementType.SPACECONTAINER;
//   points: Point[];
//   spaceHeight: number;
//   spaceColor: number;
//   spaceType: "internal" | "external";
//   placement?: Placement;
//   coordinates?: Array<[number, number, number]>;
// }

// export class Space extends DualViewPolylineElement<SpaceOptions> {
//   ogType = ElementType.SPACECONTAINER;

//   constructor(config?: Partial<SpaceOptions>) {
//     super({
//       labelName: "Space",
//       type: ElementType.SPACECONTAINER,
//       points: rectFootprint(4, 3),
//       spaceHeight: 2.8,
//       spaceColor: 0xcfe8ff,
//       spaceType: "internal",
//       placement: DEFAULT_PLACEMENT,
//     }, normalizeSpaceConfig(config));
//     this.setOPGeometry();
//   }

//   get labelName() { return this.propertySet.labelName; }
//   set labelName(value: string) { this.propertySet.labelName = value; }

//   get points() { return this.propertySet.points; }
//   set points(value: Point[]) { this.propertySet.points = value; this.setOPGeometry(); }

//   get spaceHeight() { return this.propertySet.spaceHeight; }
//   set spaceHeight(value: number) { this.propertySet.spaceHeight = Math.max(0.1, value); this.setOPGeometry(); }

//   get spaceColor() { return this.propertySet.spaceColor; }
//   set spaceColor(value: number) { this.propertySet.spaceColor = toColorNumber(value, this.propertySet.spaceColor); this.setOPGeometry(); }

//   setOPGeometry() {
//     this.setConfig({
//       points: closedPoints(asVector3Points(this.propertySet.points)),
//       color: 0,
//     });
//     this.rebuildViews();
//   }

//   setOPConfig(config: Partial<SpaceOptions>) {
//     const normalized = normalizeSpaceConfig(config);
//     if (normalized) {
//       super.setOPConfig(normalized);
//     }
//   }

//   protected build2D() {
//     this.createPlanPolygon({
//       key: "footprint",
//       color: this.propertySet.spaceColor,
//       vertices: asVector3Points(this.propertySet.points),
//     });
//     this.topExportKeys = ["footprint"];
//   }

//   protected build3D() {
//     this.createExtrudedFootprint(
//       "volume",
//       asVector3Points(this.propertySet.points),
//       this.propertySet.spaceHeight,
//       this.propertySet.spaceColor,
//       0,
//     );
//     this.isometricExportKeys = ["volume"];
//   }

//   setOPMaterial() {}
// }
