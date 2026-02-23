import { ILineOptions, Line, Vector3 } from "../kernel/";
import * as THREE from "three";
import { IPrimitive } from "../primitives/base-type";
import { Glyphs } from "@opengeometry/openglyph";

export interface LengthDimensionOptions {
  ogid?: string;
  startPoint: Array<number>;
  endPoint: Array<number>;
  color: number;
  // Positive Space means you go above the start and end points
  // Negative means it should go below the start and end points
  spacing: number;
  // -1: On Top
  // 1: Below
  // crossHairLength: number;
  label: string;
  fontSize: number;
  fontColor: number;
  font?: string;
  lineWidth: number;
}

export class LineDimension extends Line implements IPrimitive {
  ogType: string = 'LineDimension';
  subNodes: Map<string, THREE.Object3D>;

  selected: boolean = false;
  edit: boolean = false;

  propertySet: LengthDimensionOptions = {
    startPoint: [0, 0, 0],
    endPoint: [2, 0, 0],
    color: 0x0000000,
    spacing: 3.5,
    label: "Dimension Label",
    fontSize: 3,
    fontColor: 0x000000,
    font: undefined,
    lineWidth: 2,
  };

  set startPoint(value: Array<number>) {
    this.propertySet.startPoint = value;

    this.setOPGeometry();
  }

  get startPoint(): Array<number> {
    return this.propertySet.startPoint;
  }

  set endPoint(value: Array<number>) {
    this.propertySet.endPoint = value;

    this.setOPGeometry();
  }

  get endPoint(): Array<number> {
    return this.propertySet.endPoint;
  }

  set spacing(value: number) {
    this.propertySet.spacing = value;
    this.setOPGeometry();
  }

  get spacing(): number {
    return this.propertySet.spacing;
  }

  set lineColor(value: number) {
    this.propertySet.color = value;
    this.color = value;
    this.setOPGeometry();
  }

  get lineColor(): number {
    return this.propertySet.color;
  }

  set fontSize(value: number) {
    this.propertySet.fontSize = value;
    this.setOPGeometry();
  }

  get fontSize(): number {
    return this.propertySet.fontSize;
  }

  set fontColor(value: number) {
    this.propertySet.fontColor = value;
    this.setOPGeometry();
  }

  get fontColor(): number {
    return this.propertySet.fontColor;
  }

  set font(value: string | undefined) {
    this.propertySet.font = value;
    this.setOPGeometry();
  }

  get font(): string | undefined {
    return this.propertySet.font;
  }

  set label(value: string) {
    this.propertySet.label = value;
    this.setOPGeometry();
  }

  get label(): string {
    return this.propertySet.label;
  }

  set lineWidth(value: number) {
    this.propertySet.lineWidth = value;
    this.setOPGeometry();
  }

  get lineWidth(): number {
    return this.propertySet.lineWidth;
  }

  constructor(lineDimensionConfig?: LengthDimensionOptions) {
    // This is the base line, actual line will which is shown above is known as primary line
    // The below is skeleton line
    super({
      ogid: lineDimensionConfig?.ogid,
      start: new Vector3(...(lineDimensionConfig?.startPoint || [0, 0, 0])),
      end: new Vector3(...(lineDimensionConfig?.endPoint || [1, 0, 0])),
      color: 0xa6a6a6,
    });

    this.subNodes = new Map<string, THREE.Object3D>();

    if (lineDimensionConfig) {
      this.propertySet = { ...this.propertySet, ...lineDimensionConfig };
    }

    this.propertySet.ogid = this.ogid;
    this.setOPGeometry();
  }

  setOPConfig(config: LengthDimensionOptions): void {

  }

  getOPConfig(): LengthDimensionOptions {
    return this.propertySet;
  }

  setOPGeometry(): void {
    this.setConfig({
      start: new Vector3(...this.propertySet.startPoint),
      end: new Vector3(...this.propertySet.endPoint),
      color: 0xa6a6a6,
    });

    this.createWitnessLines();
  }

  createWitnessLines() {
    if (this.subNodes.has("witnessLineLeft")) {
      const witnessLineLeft = this.subNodes.get("witnessLineLeft") as Line;
      witnessLineLeft.removeFromParent();
      witnessLineLeft.discardGeometry();
    }

    if (this.subNodes.has("witnessLineRight")) {
      const witnessLineRight = this.subNodes.get("witnessLineRight") as Line;
      witnessLineRight.removeFromParent();
      witnessLineRight.discardGeometry();
    }

    if (this.subNodes.has("primaryLine")) {
      const primaryLine = this.subNodes.get("primaryLine") as Line;
      primaryLine.removeFromParent();
      primaryLine.discardGeometry();
    }

    if (this.subNodes.has("crossPrimaryLeft")) {
      const crossPrimaryLeft = this.subNodes.get("crossPrimaryLeft") as Line;
      crossPrimaryLeft.removeFromParent();
      crossPrimaryLeft.discardGeometry();
    }

    if (this.subNodes.has("crossPrimaryRight")) {
      const crossPrimaryRight = this.subNodes.get("crossPrimaryRight") as Line;
      crossPrimaryRight.removeFromParent();
      crossPrimaryRight.discardGeometry();
    }

    const { startPoint, endPoint, spacing } = this.propertySet;

    const direction = new Vector3(...endPoint).subtract(new Vector3(...startPoint)).normalize();
    const perpendicular = new Vector3(
      direction.z,
      0,
      -direction.x
    ).normalize();

    console.log("Direction:", direction.x, direction.y, direction.z);
    console.log("Perpendicular:", perpendicular.x, perpendicular.y, perpendicular.z);

    // Based on Spacing and the Perpendicular direction, calculate the offset for the witness lines
    const offset = perpendicular.multiply_scalar(spacing);
    const witnessLineRightEnd = new Vector3(...endPoint).add(offset);
    const witnessLineRightStart = new Vector3(...endPoint);

    const witnessLineRight = new Line({
      start: witnessLineRightStart,
      end: witnessLineRightEnd,
      color: this.propertySet.color,
      fatLines: true,
      width: this.propertySet.lineWidth,
    });

    this.add(witnessLineRight);
    this.subNodes.set("witnessLineRight", witnessLineRight);

    // Create witness line for Start Point
    const witnessLineLeftEnd = new Vector3(...startPoint).add(offset);
    const witnessLineLeftStart = new Vector3(...startPoint);

    const witnessLineLeft = new Line({
      start: witnessLineLeftStart,
      end: witnessLineLeftEnd,
      color: this.propertySet.color,
      fatLines: true,
      width: this.propertySet.lineWidth,
    });

    this.add(witnessLineLeft);
    this.subNodes.set("witnessLineLeft", witnessLineLeft);

    // Start and End Point for Primary Line but we will deduct some offset from both witness lines
    const primaryLineStart = witnessLineLeftEnd.clone().add(witnessLineLeftStart.clone().subtract(witnessLineLeftEnd).normalize().multiply_scalar(0.3));
    const primaryLineEnd = witnessLineRightEnd.clone().add(witnessLineRightStart.clone().subtract(witnessLineRightEnd).normalize().multiply_scalar(0.3));

    // Primary line from Witness Line Left to Witness Line Right
    const primaryLine = new Line({
      start: primaryLineStart,
      end: primaryLineEnd,
      color: this.propertySet.color,
      fatLines: true,
      width: this.propertySet.lineWidth,
    });

    this.add(primaryLine);
    this.subNodes.set("primaryLine", primaryLine);

    // Add Cross Hair which is 45 degrees from primary line and intersects it and one is placed primaryLineStart and other at primaryLineEnd
    const crossHairLength = 0.3;
    const crossPrimaryLineLeftStart = primaryLineStart.clone().add(new Vector3(-crossHairLength, 0, crossHairLength));
    const crossPrimaryLineLeftEnd = primaryLineStart.clone().add(new Vector3(crossHairLength, 0, -crossHairLength));
    const crossPrimaryLineRightStart = primaryLineEnd.clone().add(new Vector3(-crossHairLength, 0, crossHairLength));
    const crossPrimaryLineRightEnd = primaryLineEnd.clone().add(new Vector3(crossHairLength, 0, -crossHairLength));

    const crossPrimaryLeft = new Line({
      start: crossPrimaryLineLeftStart,
      end: crossPrimaryLineLeftEnd,
      color: this.propertySet.color,
      fatLines: true,
      width: this.propertySet.lineWidth,
    });

    const crossPrimaryRight = new Line({
      start: crossPrimaryLineRightStart,
      end: crossPrimaryLineRightEnd,
      color: this.propertySet.color,
      fatLines: true,
      width: this.propertySet.lineWidth,
    });

    this.add(crossPrimaryLeft);
    this.add(crossPrimaryRight);

    this.subNodes.set("crossPrimaryLeft", crossPrimaryLeft);
    this.subNodes.set("crossPrimaryRight", crossPrimaryRight);

    // Calculate mid of primary line and use it for label positioning and rotate it according to the orientation of primary line
    const midPrimaryLine = witnessLineLeftEnd.clone().add(witnessLineRightEnd).multiply_scalar(0.5);
    const angle = Math.atan2(primaryLineEnd.z - primaryLineStart.z, primaryLineEnd.x - primaryLineStart.x);
    this.createLabel(midPrimaryLine, angle);
  }

  createLabel(position: { x: number; y: number; z: number }, angleY: number) {
    let label = this.subNodes.get("label") as THREE.Object3D;
    const text = this.propertySet.label;

    const shouldRecreate = !label || label.userData.text !== text ||
      label.userData.fontSize !== this.propertySet.fontSize ||
      label.userData.fontColor !== this.propertySet.fontColor;

    if (shouldRecreate) {
      if (label) {
        this.remove(label);
      }

      label = Glyphs.addGlyph(text, this.propertySet.fontSize, this.propertySet.fontColor, true);
      label.userData = { text: text, fontSize: this.propertySet.fontSize, fontColor: this.propertySet.fontColor };
      this.add(label);
      this.subNodes.set("label", label);
    }

    label.position.set(position.x, position.y, position.z);
    label.rotation.z = -angleY + Math.PI;
  }

  setOPMaterial(): void {

  }
}
