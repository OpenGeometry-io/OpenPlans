// import * as THREE from "three";
// import { Cuboid, Polygon, Vector3 } from "opengeometry";

// import type { Placement } from "../../types";
// import { ElementType, WindowType } from "../base-type";
// import {
//   DualViewPolylineElement,
//   DEFAULT_PLACEMENT,
//   toColorNumber,
// } from "../shared/dual-view";
// import { rectVertices } from "../shared/geometry";

// function closedRectPoints(width: number, depth: number) {
//   const vertices = rectVertices(width, depth);
//   return [...vertices, vertices[0]];
// }

// export interface DoubleWindowOptions {
//   ogid?: string;
//   labelName: string;
//   type: ElementType.WINDOW;
//   windowType: WindowType;
//   windowDimensions: {
//     width: number;
//     thickness: number;
//   };
//   frameDimensions: {
//     width: number;
//     thickness: number;
//   };
//   windowHeight: number;
//   sillHeight: number;
//   mullionWidth: number;
//   leftPanelRotation: number;
//   rightPanelRotation: number;
//   frameColor: number;
//   glassColor: number;
//   placement?: Placement;
// }

// export class DoubleWindow extends DualViewPolylineElement<DoubleWindowOptions> {
//   ogType = ElementType.WINDOW;

//   constructor(config?: Partial<DoubleWindowOptions>) {
//     super({
//       labelName: "Double Window",
//       type: ElementType.WINDOW,
//       windowType: WindowType.CASEMENT,
//       windowDimensions: {
//         width: 2.4,
//         thickness: 0.08,
//       },
//       frameDimensions: {
//         width: 0.12,
//         thickness: 0.12,
//       },
//       windowHeight: 1.4,
//       sillHeight: 0.9,
//       mullionWidth: 0.08,
//       leftPanelRotation: Math.PI / 7,
//       rightPanelRotation: Math.PI / 7,
//       frameColor: 0x77543b,
//       glassColor: 0x8ecae6,
//       placement: DEFAULT_PLACEMENT,
//     }, config);
//     this.setOPGeometry();
//   }

//   get labelName() { return this.propertySet.labelName; }
//   set labelName(value: string) { this.propertySet.labelName = value; }

//   get windowDimensions() { return this.propertySet.windowDimensions; }
//   set windowDimensions(value: { width: number; thickness: number }) { this.propertySet.windowDimensions = value; this.setOPGeometry(); }

//   get windowWidth() { return this.propertySet.windowDimensions.width; }
//   set windowWidth(value: number) {
//     this.propertySet.windowDimensions = {
//       ...this.propertySet.windowDimensions,
//       width: Math.max(0.8, value),
//     };
//     this.setOPGeometry();
//   }

//   get windowLength() { return this.windowWidth; }
//   set windowLength(value: number) { this.windowWidth = value; }

//   get windowThickness() { return this.propertySet.windowDimensions.thickness; }
//   set windowThickness(value: number) {
//     this.propertySet.windowDimensions = {
//       ...this.propertySet.windowDimensions,
//       thickness: Math.max(0.03, value),
//     };
//     this.setOPGeometry();
//   }

//   get frameWidth() { return this.propertySet.frameDimensions.width; }
//   set frameWidth(value: number) {
//     this.propertySet.frameDimensions = {
//       ...this.propertySet.frameDimensions,
//       width: Math.max(0.04, value),
//     };
//     this.setOPGeometry();
//   }

//   get frameThickness() { return this.propertySet.frameDimensions.thickness; }
//   set frameThickness(value: number) {
//     this.propertySet.frameDimensions = {
//       ...this.propertySet.frameDimensions,
//       thickness: Math.max(0.04, value),
//     };
//     this.setOPGeometry();
//   }

//   get windowHeight() { return this.propertySet.windowHeight; }
//   set windowHeight(value: number) { this.propertySet.windowHeight = Math.max(0.5, value); this.setOPGeometry(); }

//   get sillHeight() { return this.propertySet.sillHeight; }
//   set sillHeight(value: number) { this.propertySet.sillHeight = Math.max(0, value); this.setOPGeometry(); }

//   get mullionWidth() { return this.propertySet.mullionWidth; }
//   set mullionWidth(value: number) { this.propertySet.mullionWidth = Math.max(0.02, value); this.setOPGeometry(); }

//   get leftPanelRotation() { return this.propertySet.leftPanelRotation; }
//   set leftPanelRotation(value: number) { this.propertySet.leftPanelRotation = value; this.setOPGeometry(); }

//   get rightPanelRotation() { return this.propertySet.rightPanelRotation; }
//   set rightPanelRotation(value: number) { this.propertySet.rightPanelRotation = value; this.setOPGeometry(); }

//   get leftWindowRotation() { return this.leftPanelRotation; }
//   set leftWindowRotation(value: number) { this.leftPanelRotation = value; }

//   get rightWindowRotation() { return this.rightPanelRotation; }
//   set rightWindowRotation(value: number) { this.rightPanelRotation = value; }

//   get frameColor() { return this.propertySet.frameColor; }
//   set frameColor(value: number) { this.propertySet.frameColor = toColorNumber(value, this.propertySet.frameColor); this.setOPGeometry(); }

//   get glassColor() { return this.propertySet.glassColor; }
//   set glassColor(value: number) { this.propertySet.glassColor = toColorNumber(value, this.propertySet.glassColor); this.setOPGeometry(); }

//   setOPGeometry() {
//     const width = this.propertySet.windowDimensions.width + this.propertySet.frameDimensions.width * 2;
//     const depth = Math.max(this.propertySet.windowDimensions.thickness, this.propertySet.frameDimensions.thickness);
//     this.setConfig({
//       points: closedRectPoints(width, depth),
//       color: 0,
//     });
//     this.rebuildViews();
//   }

//   protected build2D() {
//     const { windowDimensions, frameDimensions, mullionWidth } = this.propertySet;
//     const halfWidth = windowDimensions.width / 2;
//     const panelHalfDepth = windowDimensions.thickness / 2;
//     const panelWidth = Math.max(0.2, (windowDimensions.width - mullionWidth) / 2);

//     this.createPlanPolygon({
//       key: "leftFrame",
//       color: this.propertySet.frameColor,
//       vertices: rectVertices(frameDimensions.width, frameDimensions.thickness),
//       position: [-(halfWidth + frameDimensions.width / 2), 0.001, 0],
//     });
//     this.createPlanPolygon({
//       key: "rightFrame",
//       color: this.propertySet.frameColor,
//       vertices: rectVertices(frameDimensions.width, frameDimensions.thickness),
//       position: [halfWidth + frameDimensions.width / 2, 0.001, 0],
//     });
//     this.createPlanPolygon({
//       key: "mullion",
//       color: this.propertySet.frameColor,
//       vertices: rectVertices(mullionWidth, frameDimensions.thickness),
//       position: [0, 0.001, 0],
//     });

//     const leftPanel = new THREE.Group();
//     leftPanel.position.set(-halfWidth, 0.002, 0);
//     leftPanel.rotation.y = this.propertySet.leftPanelRotation;
//     leftPanel.add(new Polygon({
//       vertices: [
//         new Vector3(0, 0, -panelHalfDepth),
//         new Vector3(0, 0, panelHalfDepth),
//         new Vector3(panelWidth, 0, panelHalfDepth),
//         new Vector3(panelWidth, 0, -panelHalfDepth),
//       ],
//       color: this.propertySet.glassColor,
//     }));
//     this.register2D("leftPanel", leftPanel);

//     const rightPanel = new THREE.Group();
//     rightPanel.position.set(halfWidth, 0.002, 0);
//     rightPanel.rotation.y = -this.propertySet.rightPanelRotation;
//     rightPanel.add(new Polygon({
//       vertices: [
//         new Vector3(0, 0, -panelHalfDepth),
//         new Vector3(0, 0, panelHalfDepth),
//         new Vector3(-panelWidth, 0, panelHalfDepth),
//         new Vector3(-panelWidth, 0, -panelHalfDepth),
//       ],
//       color: this.propertySet.glassColor,
//     }));
//     this.register2D("rightPanel", rightPanel);

//     this.topExportKeys = ["leftFrame", "rightFrame", "mullion", "leftPanel", "rightPanel"];
//   }

//   protected build3D() {
//     const { windowDimensions, frameDimensions, windowHeight, sillHeight, mullionWidth } = this.propertySet;
//     const halfWidth = windowDimensions.width / 2;
//     const panelWidth = Math.max(0.2, (windowDimensions.width - mullionWidth) / 2);
//     const frameDepth = frameDimensions.thickness;

//     this.createModelBox({
//       key: "leftFrame",
//       color: this.propertySet.frameColor,
//       width: frameDimensions.width,
//       height: windowHeight + frameDimensions.width * 2,
//       depth: frameDepth,
//       center: [-(halfWidth + frameDimensions.width / 2), sillHeight + windowHeight / 2, 0],
//     });
//     this.createModelBox({
//       key: "rightFrame",
//       color: this.propertySet.frameColor,
//       width: frameDimensions.width,
//       height: windowHeight + frameDimensions.width * 2,
//       depth: frameDepth,
//       center: [halfWidth + frameDimensions.width / 2, sillHeight + windowHeight / 2, 0],
//     });
//     this.createModelBox({
//       key: "headFrame",
//       color: this.propertySet.frameColor,
//       width: windowDimensions.width + frameDimensions.width * 2,
//       height: frameDimensions.width,
//       depth: frameDepth,
//       center: [0, sillHeight + windowHeight + frameDimensions.width / 2, 0],
//     });
//     this.createModelBox({
//       key: "sillFrame",
//       color: this.propertySet.frameColor,
//       width: windowDimensions.width + frameDimensions.width * 2,
//       height: frameDimensions.width,
//       depth: frameDepth,
//       center: [0, sillHeight - frameDimensions.width / 2, 0],
//     });
//     this.createModelBox({
//       key: "mullion",
//       color: this.propertySet.frameColor,
//       width: mullionWidth,
//       height: windowHeight,
//       depth: frameDepth,
//       center: [0, sillHeight + windowHeight / 2, 0],
//     });

//     const leftPanel = new THREE.Group();
//     leftPanel.position.set(-halfWidth, 0, 0);
//     leftPanel.rotation.y = this.propertySet.leftPanelRotation;
//     leftPanel.add(new Cuboid({
//       center: new Vector3(panelWidth / 2, sillHeight + windowHeight / 2, 0),
//       width: panelWidth,
//       height: windowHeight,
//       depth: windowDimensions.thickness,
//       color: this.propertySet.glassColor,
//     }));
//     this.register3D("leftPanel", leftPanel);

//     const rightPanel = new THREE.Group();
//     rightPanel.position.set(halfWidth, 0, 0);
//     rightPanel.rotation.y = -this.propertySet.rightPanelRotation;
//     rightPanel.add(new Cuboid({
//       center: new Vector3(-panelWidth / 2, sillHeight + windowHeight / 2, 0),
//       width: panelWidth,
//       height: windowHeight,
//       depth: windowDimensions.thickness,
//       color: this.propertySet.glassColor,
//     }));
//     this.register3D("rightPanel", rightPanel);

//     this.isometricExportKeys = [
//       "leftFrame",
//       "rightFrame",
//       "headFrame",
//       "sillFrame",
//       "mullion",
//       "leftPanel",
//       "rightPanel",
//     ];
//   }

//   setOPMaterial() {}
// }
