import type { Placement } from "../../types";

export enum WallMaterial {
  CONCRETE = "CONCRETE",
  BRICK = "BRICK",
  WOOD = "WOOD",
  GLASS = "GLASS",
  OTHER = "OTHER",
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
}
