import { Line, Vector3 } from "opengeometry";

import { ElementType } from "../elements/base-type";
import {
  DatumOptionsBase,
  DatumType,
  DATUM_COLORS,
} from "./base-type";
import { Datum } from "./datum";

export interface SurveyPoint {
  latitude: number;
  longitude: number;
  elevation: number;
  description?: string;
}

export interface ProjectOriginOptions extends DatumOptionsBase {
  datumType: DatumType.PROJECT_ORIGIN;
  /** World-space location of the project zero. */
  position: [number, number, number];
  /** Rotation about world Y (radians) applied to the site axes. */
  rotationY: number;
  /** Arm length of the tri-axis gizmo. */
  gizmoSize: number;
  /** Optional survey fix that this origin maps to. */
  surveyPoint?: SurveyPoint;
  /** Whether the triangular benchmark symbol is shown. */
  showBenchmark: boolean;
}

/**
 * Project origin / benchmark datum. Only one instance is normally
 * valid per project; the DatumTool enforces this convention for
 * callers that opt in to the singleton accessor.
 */
export class ProjectOrigin extends Datum {
  propertySet: ProjectOriginOptions = {
    labelName: "Project Origin",
    type: ElementType.DATUM,
    datumType: DatumType.PROJECT_ORIGIN,
    placement: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    color: DATUM_COLORS.ORIGIN,
    lineWidth: 2,
    visibility: { plan: true, model: true },
    position: [0, 0, 0],
    rotationY: 0,
    gizmoSize: 1,
    surveyPoint: undefined,
    showBenchmark: false,
  };

  constructor(config?: Partial<ProjectOriginOptions>) {
    super();
    this.propertySet = { ...this.propertySet, ...(config ?? {}) };
    this.propertySet.ogid = this.ogid;
    this.setOPGeometry();
    this.applyVisibility();
  }

  setOPGeometry(): void {
    this.dispose();
    const { position, rotationY, gizmoSize, lineWidth, showBenchmark } = this.propertySet;
    const [ox, oy, oz] = position;
    const w = lineWidth ?? 2;

    const cos = Math.cos(rotationY);
    const sin = Math.sin(rotationY);
    const rot = (dx: number, dz: number) => new Vector3(ox + cos * dx - sin * dz, oy, oz + sin * dx + cos * dz);

    const origin = new Vector3(ox, oy, oz);

    const xEnd = rot(gizmoSize, 0);
    const zEnd = rot(0, gizmoSize);
    const yEnd = new Vector3(ox, oy + gizmoSize, oz);

    const xAxis = new Line({ start: origin, end: xEnd, color: 0xe74c3c, fatLines: true, width: w });
    const yAxis = new Line({ start: origin, end: yEnd, color: 0x2ecc71, fatLines: true, width: w });
    const zAxis = new Line({ start: origin, end: zEnd, color: 0x3498db, fatLines: true, width: w });

    this.add(xAxis);
    this.add(yAxis);
    this.add(zAxis);
    this.subElements3D.set("xAxis", xAxis);
    this.subElements3D.set("yAxis", yAxis);
    this.subElements3D.set("zAxis", zAxis);

    const tickSize = gizmoSize * 0.12;
    const xTickA = rot(gizmoSize, -tickSize);
    const xTickB = rot(gizmoSize, tickSize);
    const zTickA = rot(-tickSize, gizmoSize);
    const zTickB = rot(tickSize, gizmoSize);
    this.subElements3D.set(
      "xTick",
      this.addLine(new Line({ start: xTickA, end: xTickB, color: 0xe74c3c, fatLines: true, width: w })),
    );
    this.subElements3D.set(
      "zTick",
      this.addLine(new Line({ start: zTickA, end: zTickB, color: 0x3498db, fatLines: true, width: w })),
    );

    if (showBenchmark) {
      const size = gizmoSize * 0.35;
      const apex = new Vector3(ox, oy + size, oz);
      const baseLeft = new Vector3(ox - size * 0.7, oy - size * 0.2, oz);
      const baseRight = new Vector3(ox + size * 0.7, oy - size * 0.2, oz);
      this.subElements3D.set(
        "benchLeft",
        this.addLine(new Line({ start: apex, end: baseLeft, color: DATUM_COLORS.ORIGIN, fatLines: true, width: w })),
      );
      this.subElements3D.set(
        "benchRight",
        this.addLine(new Line({ start: apex, end: baseRight, color: DATUM_COLORS.ORIGIN, fatLines: true, width: w })),
      );
      this.subElements3D.set(
        "benchBase",
        this.addLine(new Line({ start: baseLeft, end: baseRight, color: DATUM_COLORS.ORIGIN, fatLines: true, width: w })),
      );
    }

    const label = new Line({ start: origin.clone(), end: origin.clone(), color: DATUM_COLORS.ORIGIN });
    label.userData.datumLabel = this.propertySet.labelName;
    this.add(label);
    this.subElements3D.set("label", label);

    this.onDatumUpdated.trigger(null);
  }

  private addLine(line: Line): Line {
    this.add(line);
    return line;
  }
}
