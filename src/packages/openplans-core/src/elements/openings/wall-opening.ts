import * as THREE from "three";

export interface WallOpeningOptions {
  ogid?: string;
  labelName?: string;
  width?: number;
  height?: number;
  baseHeight?: number;
  hostWallId?: string;
}

export class WallOpening extends THREE.Group {
  ogType = "WALL_OPENING";
  ogid: string;

  private propertySet = {
    labelName: "Wall Opening",
    width: 1,
    height: 2.1,
    baseHeight: 0,
    hostWallId: undefined as string | undefined,
  };

  constructor(config?: WallOpeningOptions) {
    super();
    this.ogid = config?.ogid ?? crypto.randomUUID();
    if (config) {
      this.setOPConfig(config);
    }
  }

  get labelName() { return this.propertySet.labelName; }
  set labelName(value: string) { this.propertySet.labelName = value; }

  get width() { return this.propertySet.width; }
  set width(value: number) { this.propertySet.width = Math.max(0.1, value); }

  get height() { return this.propertySet.height; }
  set height(value: number) { this.propertySet.height = Math.max(0.1, value); }

  get baseHeight() { return this.propertySet.baseHeight; }
  set baseHeight(value: number) { this.propertySet.baseHeight = Math.max(0, value); }

  get hostWallId() { return this.propertySet.hostWallId; }
  set hostWallId(value: string | undefined) { this.propertySet.hostWallId = value; }

  setOPConfig(config: WallOpeningOptions) {
    if (config.labelName !== undefined) {
      this.labelName = config.labelName;
    }
    if (config.width !== undefined) {
      this.width = config.width;
    }
    if (config.height !== undefined) {
      this.height = config.height;
    }
    if (config.baseHeight !== undefined) {
      this.baseHeight = config.baseHeight;
    }
    if (config.hostWallId !== undefined) {
      this.hostWallId = config.hostWallId;
    }
  }

  getOPConfig() {
    return {
      ogid: this.ogid,
      labelName: this.labelName,
      width: this.width,
      height: this.height,
      baseHeight: this.baseHeight,
      hostWallId: this.hostWallId,
    } satisfies Required<Pick<WallOpeningOptions, "labelName" | "width" | "height" | "baseHeight">> & Pick<WallOpeningOptions, "ogid" | "hostWallId">;
  }
}

