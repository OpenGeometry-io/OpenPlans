import type { EditorAdapter, EditableEntity } from "../types";

export class AdapterRegistry {
  private adapters: EditorAdapter[] = [];

  register(adapter: EditorAdapter): void {
    this.adapters = this.adapters.filter((existing) => existing.id !== adapter.id);
    this.adapters.push(adapter);
    this.adapters.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  unregister(adapterId: string): void {
    this.adapters = this.adapters.filter((adapter) => adapter.id !== adapterId);
  }

  find(target: EditableEntity): EditorAdapter | null {
    for (const adapter of this.adapters) {
      if (adapter.match(target)) {
        return adapter;
      }
    }
    return null;
  }

  list(): EditorAdapter[] {
    return [...this.adapters];
  }
}
