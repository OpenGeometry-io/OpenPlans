import { Event } from "../../utils/event";
import type { EditCommand, HistoryState } from "./EditCommand";

export class HistoryManager {
  private undoStack: EditCommand[] = [];
  private redoStack: EditCommand[] = [];
  private readonly onChangeEvent: Event<HistoryState> = new Event();

  constructor(private readonly limit: number, private readonly mergeWindowMs: number) {}

  get onChange() {
    return this.onChangeEvent;
  }

  push(command: EditCommand): void {
    const last = this.undoStack[this.undoStack.length - 1];
    const shouldMerge =
      !!last &&
      !!last.mergeKey &&
      !!command.mergeKey &&
      last.mergeKey === command.mergeKey &&
      command.createdAt - last.createdAt <= this.mergeWindowMs;

    if (shouldMerge) {
      this.undoStack[this.undoStack.length - 1] = {
        ...last,
        createdAt: command.createdAt,
        after: command.after,
        apply: command.apply,
      };
    } else {
      this.undoStack.push(command);
      if (this.undoStack.length > this.limit) {
        this.undoStack.shift();
      }
    }

    this.redoStack.length = 0;
    this.emitState();
  }

  undo(): boolean {
    const command = this.undoStack.pop();
    if (!command) {
      return false;
    }

    command.revert();
    this.redoStack.push(command);
    this.emitState();
    return true;
  }

  redo(): boolean {
    const command = this.redoStack.pop();
    if (!command) {
      return false;
    }

    command.apply();
    this.undoStack.push(command);
    this.emitState();
    return true;
  }

  clear(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
    this.emitState();
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  state(): HistoryState {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length,
    };
  }

  private emitState(): void {
    this.onChangeEvent.trigger(this.state());
  }
}
