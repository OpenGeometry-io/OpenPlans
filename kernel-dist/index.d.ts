import { Vector3D, BasePolygon } from "../opengeometry/pkg/opengeometry";
import * as THREE from "three";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { Pencil } from "./src/pencil";
import { SpotLabel } from "./src/markup/spotMarker";
export declare class OpenGeometry {
    private camera;
    protected scene: THREE.Scene | undefined;
    protected container: HTMLElement | undefined;
    private _pencil;
    private _labelRenderer;
    constructor(container: HTMLElement, threeScene: THREE.Scene, camera: THREE.Camera);
    setup(): Promise<void>;
    get pencil(): Pencil | undefined;
    get labelRenderer(): CSS2DRenderer | undefined;
    setuplabelRenderer(): void;
    setupEvent(): void;
    update(scene: THREE.Scene, camera: THREE.Camera): void;
}
export declare class BasePoly extends THREE.Mesh {
    layerVertices: Vector3D[];
    layerBackVertices: Vector3D[];
    polygon: BasePolygon | null;
    isTriangulated: boolean;
    constructor(vertices?: Vector3D[]);
    addVertex(threeVertex: Vector3D): void;
    addFlushBufferToScene(flush: string): void;
}
/**
 * Base Flat Mesh
 */
export declare class FlatMesh extends THREE.Mesh {
    constructor(vertices: Vector3D[]);
}
export { Vector3D, SpotLabel, };
