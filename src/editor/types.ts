import * as THREE from "three";

export type ControlHandleType =
  | "move"
  | "rotate"
  | "vertex"
  | "edge"
  | "width"
  | "depth"
  | "radius"
  | "angle"
  | "scale-axis";

export type HandleAxis = "x" | "y" | "z" | "xy" | "yz" | "xz" | "free";

export type DragSpace = "planar" | "spatial";

export type EditableEntity = THREE.Object3D & {
  ogid?: string;
  ogType?: string;
  selected?: boolean;
  edit?: boolean;
  locked?: boolean;
  propertySet?: Record<string, any>;
  setOPGeometry?: () => void;
  setOPConfig?: (config: Record<string, any>) => void;
  getOPConfig?: () => Record<string, any>;
};

export interface EditorHandle {
  id: string;
  type: ControlHandleType;
  axis?: HandleAxis;
  position: THREE.Vector3;
  targetId: string;
  metadata?: Record<string, any>;
  dragSpace?: DragSpace;
}

export interface EditorGridOptions {
  enabled: boolean;
  minor: number;
  major: number;
  extent: number;
  origin: THREE.Vector3;
  minorColor: number;
  majorColor: number;
}

export interface SnapOptions {
  enabled: boolean;
  gridEnabled: boolean;
  elementEnabled: boolean;
  tolerance: number;
  majorStep: number;
  minorStep: number;
}

export interface OpenPlansEditorOptions {
  enabled: boolean;
  mode: "plan" | "model";
  selection: {
    single: boolean;
  };
  snap: SnapOptions;
  grid: EditorGridOptions;
  history: {
    limit: number;
    mergeWindowMs: number;
  };
}

export const DEFAULT_EDITOR_OPTIONS: OpenPlansEditorOptions = {
  enabled: true,
  mode: "plan",
  selection: {
    single: true,
  },
  snap: {
    enabled: true,
    gridEnabled: true,
    elementEnabled: true,
    tolerance: 0.2,
    majorStep: 1,
    minorStep: 0.1,
  },
  grid: {
    enabled: true,
    minor: 0.1,
    major: 1,
    extent: 100,
    origin: new THREE.Vector3(0, 0, 0),
    minorColor: 0x8f9baa,
    majorColor: 0x4f5e6f,
  },
  history: {
    limit: 200,
    mergeWindowMs: 350,
  },
};

export interface PointerInfo {
  ndc: THREE.Vector2;
  clientX: number;
  clientY: number;
  altKey: boolean;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
}

export interface SnapResult {
  point: THREE.Vector3;
  source: "none" | "grid" | "element";
  targetPoint?: THREE.Vector3;
}

export interface DragUpdate {
  pointer: PointerInfo;
  world: THREE.Vector3;
  snapped: SnapResult;
  delta: THREE.Vector3;
}

export interface AdapterSession {
  before: Record<string, any>;
  [key: string]: any;
}

export interface AdapterContext {
  camera: THREE.Camera;
  scene: THREE.Scene;
  mode: "plan" | "model";
}

export interface EditorAdapter {
  id: string;
  priority?: number;
  match(target: EditableEntity): boolean;
  getDragSpace(target: EditableEntity, handle: EditorHandle): DragSpace;
  getHandles(target: EditableEntity, ctx: AdapterContext): EditorHandle[];
  applyDrag(target: EditableEntity, handle: EditorHandle, session: AdapterSession, update: DragUpdate): void;
  beginSession?(target: EditableEntity, handle: EditorHandle): AdapterSession;
  commitSession?(target: EditableEntity, handle: EditorHandle, session: AdapterSession): void;
  getSnapPoints?(target: EditableEntity): THREE.Vector3[];
}

export interface TransactionEvent {
  entityId: string;
  adapterId: string;
  handleType: ControlHandleType;
  timestamp: number;
}

export interface SelectionChangeEvent {
  selectedId: string | null;
}

export function mergeEditorOptions(
  base: OpenPlansEditorOptions,
  partial?: Partial<OpenPlansEditorOptions>,
): OpenPlansEditorOptions {
  if (!partial) {
    return cloneEditorOptions(base);
  }

  const merged: OpenPlansEditorOptions = {
    ...base,
    ...partial,
    selection: {
      ...base.selection,
      ...(partial.selection ?? {}),
    },
    snap: {
      ...base.snap,
      ...(partial.snap ?? {}),
    },
    grid: {
      ...base.grid,
      ...(partial.grid ?? {}),
      origin: partial.grid?.origin ? partial.grid.origin.clone() : base.grid.origin.clone(),
    },
    history: {
      ...base.history,
      ...(partial.history ?? {}),
    },
  };

  return merged;
}

export function cloneEditorOptions(options: OpenPlansEditorOptions): OpenPlansEditorOptions {
  return {
    ...options,
    selection: { ...options.selection },
    snap: { ...options.snap },
    grid: {
      ...options.grid,
      origin: options.grid.origin.clone(),
    },
    history: { ...options.history },
  };
}

export function entityDisplayId(entity: EditableEntity): string {
  return String(entity.ogid ?? entity.id ?? entity.uuid ?? "unknown");
}
