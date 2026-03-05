import * as THREE from "three";
import type CameraControls from "camera-controls";
import { Event } from "../utils/event";
import { SelectionController } from "./selection/SelectionController";
import { PointerRouter } from "./interaction/PointerRouter";
import { DragSession } from "./interaction/DragSession";
import { HandleLayer } from "./handles/HandleLayer";
import { AdapterRegistry } from "./adapters/AdapterRegistry";
import { builtInAdapters } from "./adapters/builtin";
import { SnapEngine } from "./snapping/SnapEngine";
import { SnapGuidesLayer } from "./snapping/SnapGuidesLayer";
import { DraftGrid } from "./grid/DraftGrid";
import { HistoryManager } from "./history/HistoryManager";
import { TransactionBuilder, type TransactionDraft } from "./history/TransactionBuilder";
import {
  DEFAULT_EDITOR_OPTIONS,
  cloneEditorOptions,
  mergeEditorOptions,
  type EditableEntity,
  type EditorAdapter,
  type EditorHandle,
  type OpenPlansEditorOptions,
  type AdapterSession,
  type PointerInfo,
  type SelectionChangeEvent,
  type TransactionEvent,
} from "./types";

interface OpenPlansEditorDependencies {
  scene: THREE.Scene;
  camera: THREE.Camera;
  canvas: HTMLElement;
  interactionElement?: HTMLElement;
  controls: CameraControls;
  getEntities: () => EditableEntity[];
  options?: Partial<OpenPlansEditorOptions>;
}

export class OpenPlansEditor {
  private options: OpenPlansEditorOptions;

  private selection = new SelectionController();
  private pointerRouter: PointerRouter;
  private handles: HandleLayer;
  private adapters = new AdapterRegistry();
  private snapEngine: SnapEngine;
  private snapGuides: SnapGuidesLayer;
  private draftGrid: DraftGrid;

  private history: HistoryManager;
  private transactions = new TransactionBuilder();

  private selected: EditableEntity | null = null;
  private selectedAdapter: EditorAdapter | null = null;
  private activeHandles: EditorHandle[] = [];

  private activeHandle: EditorHandle | null = null;
  private adapterSession: AdapterSession | null = null;
  private dragSession: DragSession | null = null;
  private transactionDraft: TransactionDraft | null = null;

  private readonly onSelectionChangeEvent: Event<SelectionChangeEvent> = new Event();
  private readonly onTransactionCommittedEvent: Event<TransactionEvent> = new Event();

  constructor(private deps: OpenPlansEditorDependencies) {
    this.options = mergeEditorOptions(cloneEditorOptions(DEFAULT_EDITOR_OPTIONS), deps.options);

    this.handles = new HandleLayer(this.deps.scene);
    this.snapEngine = new SnapEngine(this.options.snap);
    this.snapGuides = new SnapGuidesLayer(this.deps.scene);
    this.draftGrid = new DraftGrid(this.deps.scene, this.options.grid);

    this.history = new HistoryManager(this.options.history.limit, this.options.history.mergeWindowMs);

    for (const adapter of builtInAdapters()) {
      this.adapters.register(adapter);
    }

    const interactionElement = this.deps.interactionElement ?? this.deps.canvas;
    this.pointerRouter = new PointerRouter(
      interactionElement,
      {
        onPointerDown: (info) => this.handlePointerDown(info),
        onPointerMove: (info) => this.handlePointerMove(info),
        onPointerUp: () => this.handlePointerUp(),
      },
      this.deps.canvas,
    );
  }

  get onSelectionChange() {
    return this.onSelectionChangeEvent;
  }

  get onTransactionCommitted() {
    return this.onTransactionCommittedEvent;
  }

  get onHistoryChanged() {
    return this.history.onChange;
  }

  registerAdapter(adapter: EditorAdapter): void {
    this.adapters.register(adapter);
    this.refreshSelectionHandles();
  }

  unregisterAdapter(adapterId: string): void {
    this.adapters.unregister(adapterId);
    this.refreshSelectionHandles();
  }

  setOptions(options: Partial<OpenPlansEditorOptions>): void {
    this.options = mergeEditorOptions(this.options, options);
    this.snapEngine.setOptions(this.options.snap);
    this.draftGrid.setOptions(this.options.grid);
    this.draftGrid.setVisible(this.options.grid.enabled);
    this.refreshSelectionHandles();
  }

  setSnapOptions(options: Partial<OpenPlansEditorOptions["snap"]>): void {
    this.setOptions({ snap: options } as Partial<OpenPlansEditorOptions>);
  }

  setGridOptions(options: Partial<OpenPlansEditorOptions["grid"]>): void {
    this.setOptions({ grid: options } as Partial<OpenPlansEditorOptions>);
  }

  setMode(mode: "plan" | "model"): void {
    this.options = mergeEditorOptions(this.options, { mode });
    this.refreshSelectionHandles();
  }

  update(): void {
    if (this.selected && !this.getEditableEntities().includes(this.selected)) {
      this.clearSelection();
    }

    const viewportHeight = this.deps.canvas.clientHeight || 1;
    this.handles.updateScale(this.deps.camera, viewportHeight);
  }

  undo(): boolean {
    const didUndo = this.history.undo();
    this.refreshSelectionHandles();
    return didUndo;
  }

  redo(): boolean {
    const didRedo = this.history.redo();
    this.refreshSelectionHandles();
    return didRedo;
  }

  canUndo(): boolean {
    return this.history.canUndo();
  }

  canRedo(): boolean {
    return this.history.canRedo();
  }

  clearHistory(): void {
    this.history.clear();
  }

  dispose(): void {
    this.deps.controls.enabled = true;
    this.pointerRouter.dispose();
    this.handles.dispose();
    this.snapGuides.dispose();
    this.draftGrid.dispose();
  }

  private handlePointerDown(info: PointerInfo): void {
    const handleId = this.selection.pickHandle(info.ndc, this.deps.camera, this.handles.getHandleMeshes());
    if (handleId && this.selected && this.selectedAdapter) {
      const handle = this.handles.getHandle(handleId);
      if (handle) {
        this.startDrag(handle, info);
      }
      return;
    }

    const editable = this.getEditableEntities();
    const picked = this.selection.pickEntity(info.ndc, this.deps.camera, editable);

    if (!picked) {
      this.clearSelection();
      return;
    }

    if (picked !== this.selected) {
      this.selectEntity(picked);
      return;
    }

    const moveHandle = this.activeHandles.find((candidate) => candidate.type === "move");
    if (moveHandle) {
      this.startDrag(moveHandle, info);
    }
  }

  private handlePointerMove(info: PointerInfo): void {
    if (this.dragSession && this.selected && this.selectedAdapter && this.activeHandle) {
      const drag = this.dragSession.update(info);
      if (!drag) {
        return;
      }

      this.rebuildSnapPoints();
      const snap = this.snapEngine.snap(
        drag.world,
        info.shiftKey,
        String(this.selected.ogid ?? this.selected.id),
        info.altKey,
      );
      const snappedDelta = snap.point.clone().sub(this.dragSession.start);

      this.selectedAdapter.applyDrag(this.selected, this.activeHandle, this.adapterSession ?? ({ before: {} } as AdapterSession), {
        pointer: info,
        world: drag.world,
        snapped: snap,
        delta: snappedDelta,
      });

      if (snap.source === "none") {
        this.snapGuides.hide();
      } else {
        this.snapGuides.show(snap.point);
      }

      this.refreshSelectionHandles();
      return;
    }

    const hoveredHandleId = this.selection.pickHandle(info.ndc, this.deps.camera, this.handles.getHandleMeshes());
    this.handles.setHoveredHandle(hoveredHandleId);
  }

  private handlePointerUp(): void {
    this.snapGuides.hide();

    if (!this.dragSession || !this.selected || !this.selectedAdapter || !this.activeHandle || !this.transactionDraft) {
      this.deps.controls.enabled = true;
      this.dragSession = null;
      this.activeHandle = null;
      this.adapterSession = null;
      this.transactionDraft = null;
      return;
    }

    this.selectedAdapter.commitSession?.(
      this.selected,
      this.activeHandle,
      this.adapterSession ?? ({ before: {} } as AdapterSession),
    );

    const command = this.transactions.commit(this.transactionDraft);
    if (command) {
      this.history.push(command);
      this.onTransactionCommittedEvent.trigger({
        entityId: command.entityId,
        adapterId: command.adapterId,
        handleType: command.handleType as any,
        timestamp: command.createdAt,
      });
    }

    this.deps.controls.enabled = true;
    this.dragSession = null;
    this.activeHandle = null;
    this.adapterSession = null;
    this.transactionDraft = null;
    this.refreshSelectionHandles();
  }

  private startDrag(
    handle: EditorHandle,
    info: PointerInfo,
  ): void {
    if (!this.selected || !this.selectedAdapter) {
      return;
    }

    const dragSpace = this.selectedAdapter.getDragSpace(this.selected, handle);
    const startWorld = handle.position.clone();

    this.activeHandle = handle;
    this.adapterSession = this.selectedAdapter.beginSession?.(this.selected, handle) ?? ({ before: {} } as AdapterSession);
    this.transactionDraft = this.transactions.begin(
      this.selected,
      this.selectedAdapter.id,
      handle.type,
      `${String(this.selected.ogid ?? this.selected.id)}:${handle.type}`,
    );

    this.dragSession = new DragSession(
      this.selection,
      this.deps.camera,
      startWorld,
      dragSpace,
      this.options.mode === "plan" ? 0 : this.selected.position.y,
    );

    const initial = this.dragSession.update(info);
    if (initial) {
      this.rebuildSnapPoints();
    }

    this.deps.controls.enabled = false;
  }

  private selectEntity(entity: EditableEntity): void {
    this.selected = entity;
    this.selectedAdapter = this.adapters.find(entity);

    this.onSelectionChangeEvent.trigger({
      selectedId: String(entity.ogid ?? entity.id),
    });

    this.refreshSelectionHandles();
  }

  private clearSelection(): void {
    if (!this.selected) {
      return;
    }

    this.selected = null;
    this.selectedAdapter = null;
    this.activeHandles = [];
    this.handles.clear();

    this.onSelectionChangeEvent.trigger({
      selectedId: null,
    });
  }

  private refreshSelectionHandles(): void {
    if (!this.selected || !this.selectedAdapter) {
      this.activeHandles = [];
      this.handles.clear();
      return;
    }

    const handles = this.selectedAdapter.getHandles(this.selected, {
      camera: this.deps.camera,
      scene: this.deps.scene,
      mode: this.options.mode,
    });

    this.activeHandles = handles;
    this.handles.setHandles(handles);
  }

  private rebuildSnapPoints(): void {
    const points: Array<{ position: THREE.Vector3; entityId: string }> = [];

    for (const entity of this.getEditableEntities()) {
      const adapter = this.adapters.find(entity);
      if (!adapter || !adapter.getSnapPoints) {
        continue;
      }

      const entityId = String(entity.ogid ?? entity.id);
      for (const snapPoint of adapter.getSnapPoints(entity)) {
        points.push({
          entityId,
          position: snapPoint,
        });
      }
    }

    this.snapEngine.setElementPoints(points);
  }

  private getEditableEntities(): EditableEntity[] {
    const entities = this.deps.getEntities();
    return entities.filter((entity) => this.adapters.find(entity) !== null);
  }
}
