import * as THREE from "three";

import { DatumType } from "./base-type";
import { Datum } from "./datum";
import { Level, LevelOptions } from "./level";
import { Grid, GridOptions } from "./grid";
import { ReferencePlane, ReferencePlaneOptions } from "./reference-plane";
import { ProjectOrigin, ProjectOriginOptions } from "./project-origin";
import { SectionLine, SectionLineOptions } from "./section-line";
import { ElevationMarker, ElevationMarkerOptions } from "./elevation-marker";

export * from "./base-type";
export { Datum } from "./datum";
export { Level } from "./level";
export type { LevelOptions, LevelHeadSide } from "./level";
export { Grid } from "./grid";
export type {
  GridOptions,
  GridAxis,
  GridAxisCurve,
  GridHead,
  GridKind,
  GridLabelMode,
} from "./grid";
export { ReferencePlane } from "./reference-plane";
export type { ReferencePlaneOptions } from "./reference-plane";
export { ProjectOrigin } from "./project-origin";
export type { ProjectOriginOptions, SurveyPoint } from "./project-origin";
export { SectionLine } from "./section-line";
export type { SectionLineOptions, SectionHeadLabel } from "./section-line";
export { ElevationMarker } from "./elevation-marker";
export type {
  ElevationMarkerOptions,
  ElevationHeadLabel,
  CardinalDirection,
} from "./elevation-marker";

/**
 * Uses `kind` as the discriminator (not `type`) because the underlying
 * options interfaces already use `type: ElementType.DATUM` for the
 * IShape contract. The factory strips `kind` before passing the
 * remaining fields to the datum constructor.
 */
export type CreateDatumOptions =
  | ({ kind: DatumType.LEVEL } & Partial<LevelOptions>)
  | ({ kind: DatumType.GRID } & Partial<GridOptions>)
  | ({ kind: DatumType.REFERENCE_PLANE } & Partial<ReferencePlaneOptions>)
  | ({ kind: DatumType.PROJECT_ORIGIN } & Partial<ProjectOriginOptions>)
  | ({ kind: DatumType.SECTION_LINE } & Partial<SectionLineOptions>)
  | ({ kind: DatumType.ELEVATION_MARKER } & Partial<ElevationMarkerOptions>);

/**
 * Singleton factory / registry for datums. Mirrors the shape of
 * `DimensionTool` (src/packages/openplans-core/src/dimensions/index.ts)
 * so callers can still instantiate datum classes directly but also get
 * a uniform entry point with automatic scene attachment.
 */
export class Datums {
  private static _instance: Datums;
  private scene: THREE.Scene | null = null;
  private store = new Map<string, Datum>();
  private originId: string | null = null;

  static getInstance(): Datums {
    if (!Datums._instance) {
      Datums._instance = new Datums();
    }
    return Datums._instance;
  }

  set sceneRef(scene: THREE.Scene) {
    this.scene = scene;
  }

  get sceneRef(): THREE.Scene {
    if (!this.scene) {
      throw new Error("Datum scene reference not initialised. Set DatumTool.sceneRef before creating datums.");
    }
    return this.scene;
  }

  createDatum(opts: CreateDatumOptions): Datum {
    const datum = this.instantiate(opts);
    this.sceneRef.add(datum);
    this.store.set(datum.ogid, datum);
    if (datum.datumType === DatumType.PROJECT_ORIGIN) {
      this.originId = datum.ogid;
    }
    return datum;
  }

  getDatumById(id: string): Datum | undefined {
    return this.store.get(id);
  }

  getDatumsByType(type: DatumType): Datum[] {
    return [...this.store.values()].filter((d) => d.datumType === type);
  }

  getProjectOrigin(): ProjectOrigin | undefined {
    if (!this.originId) return undefined;
    return this.store.get(this.originId) as ProjectOrigin | undefined;
  }

  remove(id: string): void {
    const datum = this.store.get(id);
    if (!datum) return;
    datum.dispose();
    datum.removeFromParent();
    this.store.delete(id);
    if (this.originId === id) this.originId = null;
  }

  clear(): void {
    for (const id of [...this.store.keys()]) this.remove(id);
  }

  private instantiate(opts: CreateDatumOptions): Datum {
    const { kind, ...rest } = opts as CreateDatumOptions & { kind: DatumType };
    switch (kind) {
      case DatumType.LEVEL:
        return new Level(rest as Partial<LevelOptions>);
      case DatumType.GRID:
        return new Grid(rest as Partial<GridOptions>);
      case DatumType.REFERENCE_PLANE:
        return new ReferencePlane(rest as Partial<ReferencePlaneOptions>);
      case DatumType.PROJECT_ORIGIN:
        if (this.originId) {
          throw new Error(
            "A ProjectOrigin already exists. Remove the existing one before creating another, or update it via setOPConfig.",
          );
        }
        return new ProjectOrigin(rest as Partial<ProjectOriginOptions>);
      case DatumType.SECTION_LINE:
        return new SectionLine(rest as Partial<SectionLineOptions>);
      case DatumType.ELEVATION_MARKER:
        return new ElevationMarker(rest as Partial<ElevationMarkerOptions>);
      default: {
        const exhaustive: never = kind;
        throw new Error(`Unknown datum kind: ${String(exhaustive)}`);
      }
    }
  }
}

export const DatumTool = Datums.getInstance();
