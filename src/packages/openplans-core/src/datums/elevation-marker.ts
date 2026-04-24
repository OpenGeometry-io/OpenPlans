import { Line, Vector3 } from "opengeometry";

import { ElementType } from "../elements/base-type";
import {
  DatumOptionsBase,
  DatumType,
  DATUM_COLORS,
} from "./base-type";
import { Datum } from "./datum";

export type CardinalDirection = "N" | "S" | "E" | "W";

export interface ElevationHeadLabel {
  drawingNumber: string;
  sheetNumber: string;
}

export interface ElevationMarkerOptions extends DatumOptionsBase {
  datumType: DatumType.ELEVATION_MARKER;
  /** World-space placement of the marker on the XZ plane. */
  position: [number, number, number];
  /**
   * View direction — either a cardinal preset or an explicit unit
   * vector on the XZ plane.
   */
  direction: CardinalDirection | [number, number];
  /**
   * Render four markers 90° apart (one per cardinal) sharing a single
   * centre, matching the standard four-arrow elevation symbol.
   */
  cluster: boolean;
  /** Head labels shown inside the bubble. */
  head: ElevationHeadLabel;
  /** Identifier of the elevation view this marker generates. */
  linkedViewId?: string;
  /** Outer radius of the bubble in world units. */
  bubbleRadius: number;
}

const CARDINAL_VECTORS: Record<CardinalDirection, [number, number]> = {
  N: [0, -1],
  S: [0, 1],
  E: [1, 0],
  W: [-1, 0],
};

/**
 * Direction-of-view datum for elevations. Generates either a single
 * marker (bubble + arrow) or a clustered four-arrow symbol pointing
 * at the four cardinals from a shared centre.
 */
export class ElevationMarker extends Datum {
  propertySet: ElevationMarkerOptions = {
    labelName: "Elevation",
    type: ElementType.DATUM,
    datumType: DatumType.ELEVATION_MARKER,
    placement: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    color: DATUM_COLORS.ELEVATION,
    lineWidth: 2,
    visibility: { plan: true, model: true },
    position: [0, 0, 0],
    direction: "N",
    cluster: false,
    head: { drawingNumber: "?", sheetNumber: "?" },
    bubbleRadius: 0.45,
  };

  constructor(config?: Partial<ElevationMarkerOptions>) {
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

  setOPGeometry(): void {
    this.dispose();

    if (this.propertySet.cluster) {
      (["N", "E", "S", "W"] as CardinalDirection[]).forEach((dir) => {
        this.buildMarker(CARDINAL_VECTORS[dir], dir);
      });
    } else {
      const dir = this.resolveDirection(this.propertySet.direction);
      this.buildMarker(dir, "single");
    }

    this.onDatumUpdated.trigger(null);
  }

  private resolveDirection(d: CardinalDirection | [number, number]): [number, number] {
    if (typeof d === "string") return CARDINAL_VECTORS[d];
    const [x, z] = d;
    const len = Math.sqrt(x * x + z * z) || 1;
    return [x / len, z / len];
  }

  private buildMarker(direction: [number, number], keyPrefix: string) {
    const color = this.propertySet.color ?? DATUM_COLORS.ELEVATION;
    const width = this.propertySet.lineWidth ?? 2;
    const [px, py, pz] = this.propertySet.position;
    const [ux, uz] = direction;

    const center = new Vector3(px, py, pz);
    const radius = this.propertySet.bubbleRadius;

    const segments = 32;
    for (let i = 0; i < segments; i++) {
      const a0 = (i / segments) * Math.PI * 2;
      const a1 = ((i + 1) / segments) * Math.PI * 2;
      const p0 = new Vector3(center.x + Math.cos(a0) * radius, center.y, center.z + Math.sin(a0) * radius);
      const p1 = new Vector3(center.x + Math.cos(a1) * radius, center.y, center.z + Math.sin(a1) * radius);
      const seg = new Line({ start: p0, end: p1, color, fatLines: true, width: 1 });
      this.add(seg);
      this.subElements3D.set(`${keyPrefix}-bubble-${i}`, seg);
    }

    const divider = new Line({
      start: new Vector3(center.x - radius * 0.9, center.y, center.z),
      end: new Vector3(center.x + radius * 0.9, center.y, center.z),
      color,
      fatLines: true,
      width: 1,
    });
    this.add(divider);
    this.subElements3D.set(`${keyPrefix}-divider`, divider);

    const arrowTip = new Vector3(
      center.x + ux * (radius * 2.0),
      center.y,
      center.z + uz * (radius * 2.0),
    );
    const wingA = new Vector3(
      center.x + ux * (radius * 1.2) - uz * (radius * 0.4),
      center.y,
      center.z + uz * (radius * 1.2) + ux * (radius * 0.4),
    );
    const wingB = new Vector3(
      center.x + ux * (radius * 1.2) + uz * (radius * 0.4),
      center.y,
      center.z + uz * (radius * 1.2) - ux * (radius * 0.4),
    );

    const arrowL = new Line({ start: wingA, end: arrowTip, color, fatLines: true, width });
    const arrowR = new Line({ start: wingB, end: arrowTip, color, fatLines: true, width });
    const arrowBase = new Line({ start: wingA, end: wingB, color, fatLines: true, width });
    this.add(arrowL);
    this.add(arrowR);
    this.add(arrowBase);
    this.subElements3D.set(`${keyPrefix}-arrowL`, arrowL);
    this.subElements3D.set(`${keyPrefix}-arrowR`, arrowR);
    this.subElements3D.set(`${keyPrefix}-arrowBase`, arrowBase);

    const label = new Line({ start: center.clone(), end: center.clone(), color });
    label.userData.datumLabel = `${this.propertySet.head.drawingNumber}\n${this.propertySet.head.sheetNumber}`;
    this.add(label);
    this.subElements3D.set(`${keyPrefix}-label`, label);
  }
}
