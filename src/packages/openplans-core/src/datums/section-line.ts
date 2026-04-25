import { Line, Vector3 } from "opengeometry";

import { ElementType } from "../elements/base-type";
import {
  DatumOptionsBase,
  DatumType,
  DATUM_COLORS,
} from "./base-type";
import { Datum } from "./datum";

export interface SectionHeadLabel {
  /** Drawing number assigned when the linked view is placed on a sheet. */
  drawingNumber: string;
  /** Sheet number carrying the linked view. */
  sheetNumber: string;
}

export interface SectionLineOptions extends DatumOptionsBase {
  datumType: DatumType.SECTION_LINE;
  /** Start of the cut line on the XZ plane. */
  start: [number, number, number];
  /** End of the cut line on the XZ plane. */
  end: [number, number, number];
  /** Near / far view-depth clipping distances from the cut line. */
  depth: { near: number; far: number };
  /** Flip the cut direction arrow. */
  flip: boolean;
  /** Additional interior vertices for stepped / jogged sections. */
  jogs?: [number, number, number][];
  /** Head labels at either end of the cut. */
  headStart: SectionHeadLabel;
  headEnd: SectionHeadLabel;
  /** Identifier of the section view this line generates, if any. */
  linkedViewId?: string;
}

/**
 * Cutting-plane datum. The 2D mark follows common architectural
 * conventions: a dashed line terminating in two heads (letter / sheet)
 * with a direction-of-view arrow.
 */
export class SectionLine extends Datum {
  propertySet: SectionLineOptions = {
    labelName: "Section",
    type: ElementType.DATUM,
    datumType: DatumType.SECTION_LINE,
    placement: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    color: DATUM_COLORS.SECTION,
    lineWidth: 2,
    visibility: { plan: true, model: true },
    start: [-3, 0, 0],
    end: [3, 0, 0],
    depth: { near: 0, far: 10 },
    flip: false,
    jogs: undefined,
    headStart: { drawingNumber: "?", sheetNumber: "?" },
    headEnd: { drawingNumber: "?", sheetNumber: "?" },
    linkedViewId: undefined,
  };

  constructor(config?: Partial<SectionLineOptions>) {
    super();
    this.propertySet = {
      ...this.propertySet,
      ...(config ?? {}),
      depth: { ...this.propertySet.depth, ...(config?.depth ?? {}) },
      headStart: { ...this.propertySet.headStart, ...(config?.headStart ?? {}) },
      headEnd: { ...this.propertySet.headEnd, ...(config?.headEnd ?? {}) },
    };
    this.propertySet.ogid = this.ogid;
    this.setOPGeometry();
    this.applyVisibility();
  }

  setOPGeometry(): void {
    this.dispose();
    const color = this.propertySet.color ?? DATUM_COLORS.SECTION;

    const polyline: [number, number, number][] = [
      this.propertySet.start,
      ...(this.propertySet.jogs ?? []),
      this.propertySet.end,
    ];
    const toVec = (p: [number, number, number]) => new Vector3(p[0], p[1], p[2]);

    for (let i = 0; i < polyline.length - 1; i++) {
      const seg = this.buildDashedSegments(
        toVec(polyline[i]),
        toVec(polyline[i + 1]),
        color,
        0.6,
        0.25,
      );
      this.add(seg);
      this.subElements3D.set(`seg-${i}`, seg);
    }

    const startVec = toVec(this.propertySet.start);
    const endVec = toVec(this.propertySet.end);
    this.buildHead(startVec, endVec, this.propertySet.headStart, "headStart", true);
    this.buildHead(endVec, startVec, this.propertySet.headEnd, "headEnd", false);

    this.onDatumUpdated.trigger(null);
  }

  private buildHead(
    atPoint: Vector3,
    oppositePoint: Vector3,
    labels: SectionHeadLabel,
    keyPrefix: string,
    isStart: boolean,
  ) {
    const color = this.propertySet.color ?? DATUM_COLORS.SECTION;
    const width = this.propertySet.lineWidth ?? 2;

    const dir = new Vector3(
      oppositePoint.x - atPoint.x,
      0,
      oppositePoint.z - atPoint.z,
    );
    const len = Math.sqrt(dir.x * dir.x + dir.z * dir.z) || 1;
    const ux = dir.x / len;
    const uz = dir.z / len;

    const flip = this.propertySet.flip ? -1 : 1;
    const perpX = -uz * flip;
    const perpZ = ux * flip;

    const arrowBase = new Vector3(atPoint.x - ux * 0.6, atPoint.y, atPoint.z - uz * 0.6);
    const arrowTipSide = new Vector3(
      arrowBase.x + perpX * 0.6,
      arrowBase.y,
      arrowBase.z + perpZ * 0.6,
    );
    const arrowShaft = new Line({
      start: atPoint.clone(),
      end: arrowBase,
      color,
      fatLines: true,
      width,
    });
    const arrowHead = new Line({
      start: arrowBase,
      end: arrowTipSide,
      color,
      fatLines: true,
      width,
    });
    this.add(arrowShaft);
    this.add(arrowHead);
    this.subElements3D.set(`${keyPrefix}-arrowShaft`, arrowShaft);
    this.subElements3D.set(`${keyPrefix}-arrowHead`, arrowHead);

    const radius = 0.45;
    const center = new Vector3(
      atPoint.x - ux * (radius + 0.3),
      atPoint.y,
      atPoint.z - uz * (radius + 0.3),
    );
    const bubble = this.buildCircleLine(center, radius, color);
    this.add(bubble);
    this.subElements3D.set(`${keyPrefix}-bubble`, bubble);

    const divider = new Line({
      start: new Vector3(center.x - radius * 0.9, center.y, center.z),
      end: new Vector3(center.x + radius * 0.9, center.y, center.z),
      color,
      fatLines: true,
      width: 1,
    });
    this.add(divider);
    this.subElements3D.set(`${keyPrefix}-divider`, divider);

    const label = new Line({ start: center.clone(), end: center.clone(), color });
    label.userData.datumLabel = `${labels.drawingNumber}\n${labels.sheetNumber}`;
    label.userData.isStart = isStart;
    this.add(label);
    this.subElements3D.set(`${keyPrefix}-label`, label);
  }
}
