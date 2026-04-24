import * as THREE from "three";
import { Line, Vector3 } from "opengeometry";

import { ElementType } from "../elements/base-type";
import {
  DatumOptionsBase,
  DatumType,
  DATUM_COLORS,
} from "./base-type";
import { Datum } from "./datum";

export interface ReferencePlaneOptions extends DatumOptionsBase {
  datumType: DatumType.REFERENCE_PLANE;
  /** World-space origin of the plane. */
  origin: [number, number, number];
  /** Plane normal (will be normalised). */
  normal: [number, number, number];
  /** Half-width along the plane's local X and Y axes. */
  extents: [number, number];
  /** Dashed line length / gap ratio used when rendering the edge. */
  dash: { length: number; gap: number };
  /** Whether the plane body is drawn as a semi-transparent quad. */
  showBody: boolean;
}

/**
 * Free-angle guide plane. Used by designers to constrain rotations,
 * align elements, or set up work planes for sketches.
 */
export class ReferencePlane extends Datum {
  propertySet: ReferencePlaneOptions = {
    labelName: "Reference Plane",
    type: ElementType.DATUM,
    datumType: DatumType.REFERENCE_PLANE,
    placement: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    color: DATUM_COLORS.REFERENCE,
    lineWidth: 1,
    visibility: { plan: true, model: true },
    origin: [0, 0, 0],
    normal: [0, 1, 0],
    extents: [3, 3],
    dash: { length: 0.2, gap: 0.12 },
    showBody: true,
  };

  constructor(config?: Partial<ReferencePlaneOptions>) {
    super();
    this.propertySet = {
      ...this.propertySet,
      ...(config ?? {}),
      dash: { ...this.propertySet.dash, ...(config?.dash ?? {}) },
    };
    this.propertySet.ogid = this.ogid;
    this.setOPGeometry();
    this.applyVisibility();
  }

  setOPGeometry(): void {
    this.dispose();
    const { origin, normal, extents, color, lineWidth, dash, showBody } = this.propertySet;

    const nrm = new Vector3(normal[0], normal[1], normal[2]);
    const nlen = Math.sqrt(nrm.x * nrm.x + nrm.y * nrm.y + nrm.z * nrm.z) || 1;
    const n = new Vector3(nrm.x / nlen, nrm.y / nlen, nrm.z / nlen);

    // Build an orthonormal basis in the plane.
    const worldUp = Math.abs(n.y) < 0.99 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0);
    const u = this.crossV(worldUp, n);
    const uLen = Math.sqrt(u.x * u.x + u.y * u.y + u.z * u.z) || 1;
    const uN = new Vector3(u.x / uLen, u.y / uLen, u.z / uLen);
    const v = this.crossV(n, uN);

    const o = new Vector3(origin[0], origin[1], origin[2]);
    const [ex, ey] = extents;

    const corners = [
      this.addV3(o, this.scaleV(uN, -ex), this.scaleV(v, -ey)),
      this.addV3(o, this.scaleV(uN, ex), this.scaleV(v, -ey)),
      this.addV3(o, this.scaleV(uN, ex), this.scaleV(v, ey)),
      this.addV3(o, this.scaleV(uN, -ex), this.scaleV(v, ey)),
    ];

    for (let i = 0; i < 4; i++) {
      const a = corners[i];
      const b = corners[(i + 1) % 4];
      this.addDashedEdge(a, b, color ?? DATUM_COLORS.REFERENCE, lineWidth ?? 1, dash, `edge-${i}`);
    }

    if (showBody) {
      const geometry = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        corners[0].x, corners[0].y, corners[0].z,
        corners[1].x, corners[1].y, corners[1].z,
        corners[2].x, corners[2].y, corners[2].z,
        corners[0].x, corners[0].y, corners[0].z,
        corners[2].x, corners[2].y, corners[2].z,
        corners[3].x, corners[3].y, corners[3].z,
      ]);
      geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
      geometry.computeVertexNormals();
      const material = new THREE.MeshBasicMaterial({
        color: color ?? DATUM_COLORS.REFERENCE,
        transparent: true,
        opacity: 0.08,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const body = new THREE.Mesh(geometry, material);
      this.add(body);
      this.subElements3D.set("body", body);
    }

    const labelAnchor = new Line({
      start: corners[3].clone(),
      end: corners[3].clone(),
      color: color ?? DATUM_COLORS.REFERENCE,
    });
    labelAnchor.userData.datumLabel = this.propertySet.labelName;
    this.add(labelAnchor);
    this.subElements3D.set("label", labelAnchor);

    this.onDatumUpdated.trigger(null);
  }

  private addDashedEdge(
    a: Vector3,
    b: Vector3,
    color: number,
    width: number,
    dash: { length: number; gap: number },
    key: string,
  ) {
    const dir = new Vector3(b.x - a.x, b.y - a.y, b.z - a.z);
    const total = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z);
    if (total === 0) return;
    const unit = new Vector3(dir.x / total, dir.y / total, dir.z / total);
    const stride = dash.length + dash.gap;
    let dist = 0;
    let index = 0;
    while (dist < total) {
      const segLen = Math.min(dash.length, total - dist);
      const p0 = new Vector3(a.x + unit.x * dist, a.y + unit.y * dist, a.z + unit.z * dist);
      const p1 = new Vector3(
        p0.x + unit.x * segLen,
        p0.y + unit.y * segLen,
        p0.z + unit.z * segLen,
      );
      const seg = new Line({ start: p0, end: p1, color, fatLines: true, width });
      this.add(seg);
      this.subElements3D.set(`${key}-${index}`, seg);
      dist += stride;
      index += 1;
    }
  }

  private crossV(a: Vector3, b: Vector3): Vector3 {
    return new Vector3(
      a.y * b.z - a.z * b.y,
      a.z * b.x - a.x * b.z,
      a.x * b.y - a.y * b.x,
    );
  }

  private scaleV(a: Vector3, s: number): Vector3 {
    return new Vector3(a.x * s, a.y * s, a.z * s);
  }

  private addV3(a: Vector3, b: Vector3, c: Vector3): Vector3 {
    return new Vector3(a.x + b.x + c.x, a.y + b.y + c.y, a.z + b.z + c.z);
  }
}
