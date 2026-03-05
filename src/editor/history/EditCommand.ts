export interface SnapshotPayload {
  transform: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  };
  propertySet?: Record<string, any>;
}

export interface EditCommand {
  id: string;
  entityId: string;
  adapterId: string;
  handleType: string;
  createdAt: number;
  mergeKey?: string;
  before: SnapshotPayload;
  after: SnapshotPayload;
  apply(): void;
  revert(): void;
}

export interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
}
