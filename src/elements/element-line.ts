import * as THREE from 'three';
import { PolyLine } from '../../kernel/dist';

/**
 * If any element start moves, cast a ray and check if it interesects with the board.
 * Add the element to the board if it does.
 * If the element is moved outside the board, remove it from the board.
 */

export abstract class OPLineMesh extends PolyLine{
  abstract ogType: string;
  abstract subNodes: Map<string, THREE.Object3D>;
  abstract _selected: boolean;

  // TODO: Find a way to make this better and more generic
  abstract propertySet: any;

  abstract setOPConfig(config: Record<string, any>): void;
  abstract getOPConfig(): Record<string, any>;

  abstract setOPGeometry() : void;
  abstract setOPMaterial() : void;
}