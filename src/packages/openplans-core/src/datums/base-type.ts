/**
 * Shared type definitions for datum objects.
 *
 * Datums are reference geometry (non-building) that other elements are
 * positioned against: levels, structural grids, reference planes, the
 * project origin, section lines, and elevation markers.
 *
 * Naming and data shape follow the open BIM standard (IFC 4.3) where
 * applicable so the objects map cleanly to IfcGrid, IfcGridAxis,
 * IfcBuildingStorey and IfcAnnotation during export.
 */

import type { Placement } from "../types";
import { ElementType } from "../elements/base-type";

export enum DatumType {
  LEVEL = "LEVEL",
  GRID = "GRID",
  REFERENCE_PLANE = "REFERENCE_PLANE",
  PROJECT_ORIGIN = "PROJECT_ORIGIN",
  SECTION_LINE = "SECTION_LINE",
  ELEVATION_MARKER = "ELEVATION_MARKER",
}

/**
 * Common fields shared by every datum subtype. Individual datums extend
 * this with their own shape-specific fields.
 */
export interface DatumOptionsBase {
  ogid?: string;
  labelName: string;
  type: ElementType.DATUM;
  datumType: DatumType;
  placement: Placement;
  /** Line / symbol colour. Defaulted per subtype when omitted. */
  color?: number;
  /** Line weight for the datum's 2D representation. */
  lineWidth?: number;
  /** Whether this datum is shown in plan / model views. */
  visibility?: DatumVisibility;
}

export interface DatumVisibility {
  plan?: boolean;
  model?: boolean;
}

export const DEFAULT_DATUM_VISIBILITY: Required<DatumVisibility> = {
  plan: true,
  model: true,
};

export const DEFAULT_PLACEMENT: Placement = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
};

/**
 * Palette reserved for datums. Kept deliberately neutral so datums read
 * as reference geometry rather than building elements.
 */
export const DATUM_COLORS = {
  /** Mid grey for generic guide lines. */
  NEUTRAL: 0x888888,
  /** Warm tone reserved for level / storey datums. */
  LEVEL: 0x4b6584,
  /** Cool tone reserved for structural grids. */
  GRID: 0x3b5998,
  /** Dashed reference-plane tint. */
  REFERENCE: 0x9c88ff,
  /** Project origin / benchmark. */
  ORIGIN: 0xd35400,
  /** Section line. */
  SECTION: 0x2d3436,
  /** Elevation marker. */
  ELEVATION: 0x0984e3,
} as const;
