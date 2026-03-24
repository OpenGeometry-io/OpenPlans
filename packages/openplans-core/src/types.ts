export interface Point3D {
  x: number;
  y: number;
  z: number;
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
  doorPosition: Point3D;
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
  windowPosition: Point3D;
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
