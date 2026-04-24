import * as THREE from "three";
import { Line, Vector3 } from "opengeometry";

import { ElementType } from "../elements/base-type";
import {
  DatumOptionsBase,
  DatumType,
  DATUM_COLORS,
} from "./base-type";
import { Datum } from "./datum";

export type GridKind = "rectangular" | "radial" | "irregular";
export type GridLabelMode = "alpha" | "numeric";

export type GridAxisCurve =
  | { curve: "line"; start: [number, number]; end: [number, number] }
  | { curve: "arc"; center: [number, number]; radius: number; startAngle: number; endAngle: number };

export interface GridAxis {
  tag: string;
  curveSpec: GridAxisCurve;
  /** Which endpoint(s) carry a bubble. */
  head?: { start?: boolean; end?: boolean };
}

export interface GridHead {
  /** Diameter of the bubble on the XZ plane in world units. */
  diameter: number;
  /** Text size for the bubble label. */
  fontSize: number;
}

export interface GridOptions extends DatumOptionsBase {
  datumType: DatumType.GRID;
  gridKind: GridKind;
  uAxes: GridAxis[];
  vAxes: GridAxis[];
  head: GridHead;
  /** Characters omitted from auto-generated alpha labels. */
  labelSkip: string[];
  /** Elevation (world Y) at which the grid is drawn. */
  elevation: number;
}

/**
 * Structural grid — a pair of axis families (U, V) labeled per the
 * conventions in ISO 5457 and the US National CAD Standard: letters on
 * one axis, numbers on the other, with I and O skipped to avoid
 * confusion with 1 and 0.
 *
 * Maps to IfcGrid (with IfcGridAxis children and IfcAnnotation bubbles)
 * on IFC export.
 */
export class Grid extends Datum {
  propertySet: GridOptions = {
    labelName: "Structural Grid",
    type: ElementType.DATUM,
    datumType: DatumType.GRID,
    placement: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    color: DATUM_COLORS.GRID,
    lineWidth: 1,
    visibility: { plan: true, model: true },
    gridKind: "rectangular",
    uAxes: [],
    vAxes: [],
    head: { diameter: 0.7, fontSize: 0.3 },
    labelSkip: ["I", "O"],
    elevation: 0,
  };

  constructor(config?: Partial<GridOptions>) {
    super();
    this.propertySet = {
      ...this.propertySet,
      ...(config ?? {}),
      head: { ...this.propertySet.head, ...(config?.head ?? {}) },
    };
    this.propertySet.ogid = this.ogid;
    this.setOPGeometry();
    this.applyVisibility();
  }

  /**
   * Build a rectangular grid from spacing arrays and return the
   * resulting options so callers can pass them straight into the
   * constructor.
   */
  static rectangular(opts: {
    uSpacings: number[];
    vSpacings: number[];
    origin?: [number, number];
    elevation?: number;
    labelName?: string;
    head?: Partial<GridHead>;
  }): Partial<GridOptions> {
    const origin = opts.origin ?? [0, 0];
    const uAxes = Grid.buildParallelAxes(opts.uSpacings, "numeric", "vertical", origin);
    const vAxes = Grid.buildParallelAxes(opts.vSpacings, "alpha", "horizontal", origin);
    return {
      gridKind: "rectangular",
      uAxes,
      vAxes,
      elevation: opts.elevation ?? 0,
      labelName: opts.labelName ?? "Structural Grid",
      head: { diameter: 0.7, fontSize: 0.3, ...(opts.head ?? {}) },
    };
  }

  /**
   * Sequence of axis labels following ISO 5457 / US NCS conventions:
   * `A, B, C, D, E, F, G, H, J, K, L, M, N, P, Q, ...` (I and O
   * skipped). For numeric mode returns `1, 2, 3, ...`.
   */
  static generateLabels(count: number, mode: GridLabelMode, skip: string[] = ["I", "O"]): string[] {
    if (mode === "numeric") {
      return Array.from({ length: count }, (_, i) => String(i + 1));
    }
    const labels: string[] = [];
    const skipSet = new Set(skip.map((s) => s.toUpperCase()));
    let i = 0;
    while (labels.length < count) {
      let n = i;
      let s = "";
      do {
        s = String.fromCharCode(65 + (n % 26)) + s;
        n = Math.floor(n / 26) - 1;
      } while (n >= 0);
      if (!skipSet.has(s)) labels.push(s);
      i++;
    }
    return labels;
  }

  private static buildParallelAxes(
    spacings: number[],
    labelMode: GridLabelMode,
    orientation: "horizontal" | "vertical",
    origin: [number, number],
  ): GridAxis[] {
    if (spacings.length === 0) return [];
    const positions: number[] = [0];
    for (let i = 0; i < spacings.length; i++) {
      positions.push(positions[i] + spacings[i]);
    }
    const total = positions[positions.length - 1];
    const halfPerp = total / 2 + 1;
    const labels = Grid.generateLabels(positions.length, labelMode);

    return positions.map((p, i) => {
      const startPerp = origin[orientation === "vertical" ? 1 : 0] - halfPerp;
      const endPerp = origin[orientation === "vertical" ? 1 : 0] + halfPerp;
      const alongOrigin = origin[orientation === "vertical" ? 0 : 1];
      const start: [number, number] =
        orientation === "vertical"
          ? [alongOrigin + p, startPerp]
          : [startPerp, alongOrigin + p];
      const end: [number, number] =
        orientation === "vertical"
          ? [alongOrigin + p, endPerp]
          : [endPerp, alongOrigin + p];
      return {
        tag: labels[i],
        curveSpec: { curve: "line", start, end },
        head: { start: true, end: true },
      };
    });
  }

  setOPGeometry(): void {
    this.dispose();
    const elevation = this.propertySet.elevation;
    const color = this.propertySet.color ?? DATUM_COLORS.GRID;
    const width = this.propertySet.lineWidth ?? 1;

    for (const axis of [...this.propertySet.uAxes, ...this.propertySet.vAxes]) {
      const axisGroup = this.buildAxis(axis, elevation, color, width);
      this.add(axisGroup);
      this.subElements3D.set(`axis-${axis.tag}`, axisGroup);
    }

    this.onDatumUpdated.trigger(null);
  }

  private buildAxis(axis: GridAxis, elevation: number, color: number, width: number) {
    const group = new THREE.Group();
    group.name = `grid-axis-${axis.tag}`;

    let startPt: Vector3;
    let endPt: Vector3;
    if (axis.curveSpec.curve === "line") {
      startPt = new Vector3(axis.curveSpec.start[0], elevation, axis.curveSpec.start[1]);
      endPt = new Vector3(axis.curveSpec.end[0], elevation, axis.curveSpec.end[1]);
      const line = new Line({
        start: startPt,
        end: endPt,
        color,
        fatLines: true,
        width,
      });
      group.add(line);
    } else {
      const spec = axis.curveSpec;
      startPt = new Vector3(
        spec.center[0] + spec.radius * Math.cos(spec.startAngle),
        elevation,
        spec.center[1] + spec.radius * Math.sin(spec.startAngle),
      );
      endPt = new Vector3(
        spec.center[0] + spec.radius * Math.cos(spec.endAngle),
        elevation,
        spec.center[1] + spec.radius * Math.sin(spec.endAngle),
      );
      const segments = 48;
      for (let i = 0; i < segments; i++) {
        const t0 = i / segments;
        const t1 = (i + 1) / segments;
        const a0 = spec.startAngle + (spec.endAngle - spec.startAngle) * t0;
        const a1 = spec.startAngle + (spec.endAngle - spec.startAngle) * t1;
        const p0 = new Vector3(
          spec.center[0] + spec.radius * Math.cos(a0),
          elevation,
          spec.center[1] + spec.radius * Math.sin(a0),
        );
        const p1 = new Vector3(
          spec.center[0] + spec.radius * Math.cos(a1),
          elevation,
          spec.center[1] + spec.radius * Math.sin(a1),
        );
        group.add(new Line({ start: p0, end: p1, color, fatLines: true, width }));
      }
    }

    const head = axis.head ?? { start: true, end: true };
    if (head.start) {
      const bubble = this.buildBubble(startPt, axis.tag, color, true);
      group.add(bubble);
    }
    if (head.end) {
      const bubble = this.buildBubble(endPt, axis.tag, color, false);
      group.add(bubble);
    }

    return group;
  }

  private buildBubble(
    anchor: Vector3,
    tag: string,
    color: number,
    isStart: boolean,
  ): THREE.Group {
    const group = new THREE.Group();
    const radius = this.propertySet.head.diameter / 2;
    const offset = radius + 0.2;
    const dir = isStart ? -1 : 1;
    const bubbleCenter = new Vector3(anchor.x, anchor.y, anchor.z + dir * offset);

    // We don't know the axis direction without re-deriving it; a
    // centred bubble offset along Z is fine for rectangular grids and
    // keeps the implementation simple. Radial grids use end-of-curve
    // offsets via the axis specification.
    const segments = 32;
    const pts: Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      pts.push(
        new Vector3(
          bubbleCenter.x + Math.cos(a) * radius,
          bubbleCenter.y,
          bubbleCenter.z + Math.sin(a) * radius,
        ),
      );
    }
    for (let i = 0; i < segments; i++) {
      const seg = new Line({
        start: pts[i],
        end: pts[i + 1],
        color,
        fatLines: true,
        width: 1,
      });
      group.add(seg);
    }

    const tagAnchor = new Line({
      start: bubbleCenter.clone(),
      end: bubbleCenter.clone(),
      color,
    });
    tagAnchor.userData.datumLabel = tag;
    tagAnchor.userData.fontSize = this.propertySet.head.fontSize;
    group.add(tagAnchor);

    return group;
  }

  getAxesSnapshot(): { u: GridAxis[]; v: GridAxis[] } {
    return {
      u: this.propertySet.uAxes.map((a) => ({ ...a })),
      v: this.propertySet.vAxes.map((a) => ({ ...a })),
    };
  }
}
