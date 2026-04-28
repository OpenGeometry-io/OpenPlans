import * as THREE from "three";

/**
 * Abstract base for all OpenPlans scene elements.
 *
 * Extends THREE.Object3D so every element participates in the scene graph
 * and is reachable via traverse(). Subclasses declare ogid and ogType,
 * enabling type-safe queries for drawings, views, and schedules:
 *
 *   scene.traverse(o => { if (o instanceof OPElement) ... });
 */
export abstract class OPElement extends THREE.Object3D {
  abstract ogid: string;
  abstract ogType: string;
}
