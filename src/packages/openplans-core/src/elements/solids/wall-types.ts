import type { Placement } from "../../types";

export enum WallMaterial {
  CONCRETE = "CONCRETE",
  BRICK = "BRICK",
  WOOD = "WOOD",
  GLASS = "GLASS",
  OTHER = "OTHER",
}

/** Declarative hosted-opening spec — wall-local offset + base height. */
export interface HostedOpeningSpec {
  openingId: string;
  offset: number;
  baseHeight: number;
}

export interface WallOptions {
  ogid?: string;
  labelName: string;
  thickness: number;
  material: WallMaterial | string;
  color: number;
  height: number;
  points: Array<[number, number, number]>;
  placement: Placement;
  openings: Array<string>;
  hostedOpenings?: HostedOpeningSpec[];
}
