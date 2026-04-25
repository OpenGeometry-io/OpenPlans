import { Line, Vector3 } from "opengeometry";

import { ElementType } from "../elements/base-type";
import {
  DatumOptionsBase,
  DatumType,
  DATUM_COLORS,
} from "./base-type";
import { Datum } from "./datum";

export type LevelHeadSide = "start" | "end" | "both" | "none";

export interface LevelOptions extends DatumOptionsBase {
  datumType: DatumType.LEVEL;
  /** Height of the level along world Y. */
  elevation: number;
  /** Horizontal extents on the X-Z plane: `[xMin, zMin]` and `[xMax, zMax]`. */
  extents: [[number, number], [number, number]];
  /** Which end(s) of the line carry a bubble / tag. */
  headSide: LevelHeadSide;
  /**
   * Text shown inside the level head. Falls back to {@link labelName}
   * when empty.
   */
  headLabel?: string;
  /**
   * Whether to also draw a vertical tick from the headline down to the
   * previous level. Purely visual; defaults off.
   */
  drawTick?: boolean;
}

/**
 * Horizontal reference plane anchored at a fixed elevation. Equivalent
 * to an `IfcBuildingStorey` datum in BIM terms.
 */
export class Level extends Datum {
  propertySet: LevelOptions = {
    labelName: "Level",
    type: ElementType.DATUM,
    datumType: DatumType.LEVEL,
    placement: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    color: DATUM_COLORS.LEVEL,
    lineWidth: 1,
    visibility: { plan: true, model: true },
    elevation: 0,
    extents: [
      [-5, 0],
      [5, 0],
    ],
    headSide: "end",
    headLabel: undefined,
    drawTick: false,
  };

  constructor(config?: Partial<LevelOptions>) {
    super();
    this.propertySet = { ...this.propertySet, ...(config ?? {}) };
    this.propertySet.ogid = this.ogid;
    this.setOPGeometry();
    this.applyVisibility();
  }

  get elevation(): number {
    return this.propertySet.elevation;
  }
  set elevation(value: number) {
    this.propertySet.elevation = value;
    this.setOPGeometry();
    this.onDatumUpdated.trigger(null);
  }

  setOPGeometry(): void {
    this.dispose();

    const { elevation, extents, color, lineWidth, headSide, labelName, headLabel } =
      this.propertySet;
    const [xMin, zMin] = extents[0];
    const [xMax, zMax] = extents[1];

    const start = new Vector3(xMin, elevation, zMin);
    const end = new Vector3(xMax, elevation, zMax);

    this.setConfig({ start, end, color: color ?? DATUM_COLORS.LEVEL });

    const headline = new Line({
      start,
      end,
      color: color ?? DATUM_COLORS.LEVEL,
      fatLines: true,
      width: lineWidth ?? 1,
    });
    this.add(headline);
    this.subElements3D.set("headline", headline);

    if (this.propertySet.drawTick) {
      const tickHeight = 0.15;
      const tick = new Line({
        start: end.clone(),
        end: new Vector3(end.x, end.y - tickHeight, end.z),
        color: color ?? DATUM_COLORS.LEVEL,
        fatLines: true,
        width: lineWidth ?? 1,
      });
      this.add(tick);
      this.subElements3D.set("tick", tick);
    }

    const bubbleRadius = 0.25;
    const bubbleOffset = 0.1;
    const text = headLabel && headLabel.length > 0 ? headLabel : labelName;

    if (headSide === "start" || headSide === "both") {
      const center = new Vector3(start.x - bubbleOffset - bubbleRadius, start.y, start.z);
      const bubble = this.buildCircleLine(center, bubbleRadius, color ?? DATUM_COLORS.LEVEL);
      this.add(bubble);
      this.subElements3D.set("bubbleStart", bubble);
      this.subElements3D.set("bubbleStartLabel", this.buildLabel(text, center));
    }
    if (headSide === "end" || headSide === "both") {
      const center = new Vector3(end.x + bubbleOffset + bubbleRadius, end.y, end.z);
      const bubble = this.buildCircleLine(center, bubbleRadius, color ?? DATUM_COLORS.LEVEL);
      this.add(bubble);
      this.subElements3D.set("bubbleEnd", bubble);
      this.subElements3D.set("bubbleEndLabel", this.buildLabel(text, center));
    }

    this.onDatumUpdated.trigger(null);
  }

  private buildLabel(text: string, position: Vector3) {
    // Text rendering is provided via @opengeometry/openglyph in a
    // separate module; when that is wired up at runtime the label
    // payload is picked up via userData.
    const placeholder = new Line({
      start: position.clone(),
      end: position.clone(),
      color: this.propertySet.color ?? DATUM_COLORS.LEVEL,
    });
    placeholder.userData.datumLabel = text;
    return placeholder;
  }
}
