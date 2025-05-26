import * as THREE from 'three';
import { Polygon } from '../../kernel/dist';

/**
 * If any element start moves, cast a ray and check if it interesects with the board.
 * Add the element to the board if it does.
 * If the element is moved outside the board, remove it from the board.
 */

export abstract class OPPolygonMesh extends Polygon{
  abstract ogType: string;
  abstract subNodes: Map<string, THREE.Object3D>;
  abstract selected: boolean;

  // TODO: Find a way to make this better and more generic
  abstract propertySet: any;

  abstract setConfig(config: Record<string, any>): void;
  abstract getConfig(): Record<string, any>;

  abstract setGeometry() : void;
  abstract setMaterial() : void;
}