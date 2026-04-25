import type * as THREE from "three";

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

// TODO: Maybe we can change this to use Point3D
export interface Placement {
  position: Array<number>; // Assuming [x, y, z] format for position
  rotation: Array<number>; // Assuming rotation in degrees for [x, y, z] axes
  scale: Array<number>; // Assuming scale factors for [x, y, z] axes
}

export interface PlanAppearance {
  wallColor?: number;
  doorColor?: number;
  frameColor?: number;
  glassColor?: number;
  materialLabel?: string;
}

export interface PlanStructure {
  projectName: string;
  siteName: string;
  buildingName: string;
  storeyName: string;
}

export type SemanticElementKind = "WALL" | "DOOR" | "WINDOW";

export interface SemanticElementBase {
  id: string;
  kind: SemanticElementKind;
  labelName: string;
  description?: string;
  tag?: string;
  storeyName?: string;
  appearance: PlanAppearance;
}

export interface WallElement extends SemanticElementBase {
  kind: "WALL";
  points: Point3D[];
  wallThickness: number;
  wallHeight: number;
  wallColor: number;
  wallMaterial: string;
}

export interface DoorElement extends SemanticElementBase {
  kind: "DOOR";
  hostWallId?: string;
  /**
   * Door center in the host wall's local frame.
   *   u — distance along the wall from its start
   *   h — vertical offset above wall base
   */
  stationLocal: { u: number; h: number };
  doorWidth: number;
  doorHeight: number;
  doorThickness: number;
  frameThickness: number;
  doorColor: number;
  frameColor: number;
  doorMaterial: string;
}

export interface WindowElement extends SemanticElementBase {
  kind: "WINDOW";
  hostWallId?: string;
  /**
   * Window center in the host wall's local frame.
   *   u — distance along the wall from its start
   * (Vertical position comes from sillHeight; v is always 0.)
   */
  stationLocal: { u: number };
  windowWidth: number;
  windowHeight: number;
  windowThickness: number;
  sillHeight: number;
  frameColor: number;
  glassColor: number;
  windowMaterial: string;
}

export type SemanticElement = WallElement | DoorElement | WindowElement;

export interface PlanDocumentState {
  structure: PlanStructure;
  walls: WallElement[];
  doors: DoorElement[];
  windows: WindowElement[];
}

export interface SemanticIfcEntityInput {
  entity_id: string;
  brep: Record<string, unknown>;
  kind?: string;
  ifc_class?: string;
  name?: string;
  description?: string;
  object_type?: string;
  tag?: string;
  property_sets?: Record<string, Record<string, string>>;
  quantity_sets?: Record<string, Record<string, number>>;
}

export interface GeneratedSemanticEntity {
  element: SemanticElement;
  brep: Record<string, unknown>;
  ifc: SemanticIfcEntityInput;
}

export interface GeneratedPlanDocument {
  structure: PlanStructure;
  entities: GeneratedSemanticEntity[];
}

export interface SemanticIfcExportOptions extends Partial<PlanStructure> {
  scale?: number;
  errorPolicy?: "Strict" | "BestEffort";
  validateTopology?: boolean;
  requireClosedShell?: boolean;
}

export interface PlanIfcExportResult {
  text: string;
  reportJson: string;
}

export type PlanExportView = "top" | "isometric";

export interface PlanVectorPoint {
  x: number;
  y: number;
}

export type PlanVectorColor = [number, number, number];

export interface PlanVectorLine {
  start: PlanVectorPoint;
  end: PlanVectorPoint;
  stroke_width?: number;
  stroke_color?: PlanVectorColor;
}

export interface PlanVectorBounds {
  min: PlanVectorPoint;
  max: PlanVectorPoint;
  width: number;
  height: number;
}

export interface PlanProjectionCamera {
  position: Point3D;
  target: Point3D;
  up: Point3D;
  near: number;
  projection_mode: "Orthographic" | "Perspective";
}

export interface PlanProjectionHlr {
  hide_hidden_edges: boolean;
}

export interface PlanVectorPayload {
  view: PlanExportView;
  units: "meters";
  bounds: PlanVectorBounds;
  lines: PlanVectorLine[];
  camera?: PlanProjectionCamera;
  hlr?: PlanProjectionHlr;
}

export interface PlanVectorExportable {
  getExportRoots(view: PlanExportView): THREE.Object3D[];
}

export interface PlanIfcExportable extends PlanVectorExportable {
  ogType: string;
  labelName: string;
  ogid?: string;
}
