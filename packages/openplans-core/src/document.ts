import type {
  DoorElement,
  PlanDocumentState,
  PlanStructure,
  SemanticElement,
  WallElement,
  WindowElement,
} from "./types";
import { createSemanticId } from "./utils";

const DEFAULT_STRUCTURE: PlanStructure = {
  projectName: "OpenPlans Project",
  siteName: "OpenPlans Site",
  buildingName: "OpenPlans Building",
  storeyName: "Level 1",
};

export class PlanDocument {
  structure: PlanStructure;

  private readonly walls = new Map<string, WallElement>();
  private readonly doors = new Map<string, DoorElement>();
  private readonly windows = new Map<string, WindowElement>();

  constructor(structure?: Partial<PlanStructure>) {
    this.structure = { ...DEFAULT_STRUCTURE, ...structure };
  }

  upsertWall(wall: Omit<WallElement, "id"> & { id?: string }) {
    const id = wall.id ?? createSemanticId("wall");
    const next: WallElement = { ...wall, id };
    this.walls.set(id, next);
    return next;
  }

  upsertDoor(door: Omit<DoorElement, "id"> & { id?: string }) {
    const id = door.id ?? createSemanticId("door");
    const next: DoorElement = { ...door, id };
    this.doors.set(id, next);
    return next;
  }

  upsertWindow(window: Omit<WindowElement, "id"> & { id?: string }) {
    const id = window.id ?? createSemanticId("window");
    const next: WindowElement = { ...window, id };
    this.windows.set(id, next);
    return next;
  }

  getWall(id: string) {
    return this.walls.get(id);
  }

  getDoor(id: string) {
    return this.doors.get(id);
  }

  getWindow(id: string) {
    return this.windows.get(id);
  }

  listWalls() {
    return Array.from(this.walls.values());
  }

  listDoors() {
    return Array.from(this.doors.values());
  }

  listWindows() {
    return Array.from(this.windows.values());
  }

  listElements(): SemanticElement[] {
    return [...this.listWalls(), ...this.listDoors(), ...this.listWindows()];
  }

  toJSON(): PlanDocumentState {
    return {
      structure: { ...this.structure },
      walls: this.listWalls(),
      doors: this.listDoors(),
      windows: this.listWindows(),
    };
  }
}
