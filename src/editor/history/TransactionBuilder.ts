import { entityDisplayId } from "../types";
import type { EditableEntity } from "../types";
import type { EditCommand, SnapshotPayload } from "./EditCommand";
import { SnapshotSerializer } from "./SnapshotSerializer";

export interface TransactionDraft {
  entity: EditableEntity;
  entityId: string;
  adapterId: string;
  handleType: string;
  mergeKey?: string;
  before: SnapshotPayload;
}

export class TransactionBuilder {
  private serializer = new SnapshotSerializer();

  begin(entity: EditableEntity, adapterId: string, handleType: string, mergeKey?: string): TransactionDraft {
    return {
      entity,
      entityId: entityDisplayId(entity),
      adapterId,
      handleType,
      mergeKey,
      before: this.serializer.capture(entity),
    };
  }

  commit(draft: TransactionDraft): EditCommand | null {
    const after = this.serializer.capture(draft.entity);

    if (JSON.stringify(draft.before) === JSON.stringify(after)) {
      return null;
    }

    const entity = draft.entity;
    const beforeSnapshot = draft.before;
    const afterSnapshot = after;

    const apply = () => this.serializer.restore(entity, afterSnapshot);
    const revert = () => this.serializer.restore(entity, beforeSnapshot);

    return {
      id: `tx-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      entityId: draft.entityId,
      adapterId: draft.adapterId,
      handleType: draft.handleType,
      createdAt: Date.now(),
      mergeKey: draft.mergeKey,
      before: beforeSnapshot,
      after: afterSnapshot,
      apply,
      revert,
    };
  }
}
