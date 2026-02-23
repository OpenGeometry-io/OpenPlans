import * as THREE from "three";
import { IShape } from "../shapes/base-type";

export type ViewCamera = 'top' | 'front' | 'right' | 'left' | 'back';

export interface ViewportConfig {
    id: string;
    ogType: 'VIEWPORT_BLOCK';
    /** Width and height of the viewport plane in scene units */
    size: [number, number];
    /** Position of the viewport plane in the scene */
    position: [number, number, number];
    scale: number;
    rotation: number;
    /** Camera direction: top, front, right, left, back */
    viewCamera: ViewCamera;
    /** World-space center of the region to look at */
    viewCenter: [number, number, number];
    /** Half-extent of the orthographic frustum (controls zoom level) */
    viewSize: number;
    /** Optional background color for the viewport (defaults to scene background) */
    viewportBackground?: number;
}

// Camera offset distance from viewCenter (far enough to see the scene)
const CAMERA_DISTANCE = 200;

/**
 * Computes camera position and up vector based on view direction.
 */
function getCameraSetup(viewCamera: ViewCamera, center: [number, number, number]): { position: THREE.Vector3; up: THREE.Vector3 } {
    const c = new THREE.Vector3(center[0], center[1], center[2]);
    switch (viewCamera) {
        case 'top':
            return { position: new THREE.Vector3(c.x, c.y + CAMERA_DISTANCE, c.z), up: new THREE.Vector3(0, 0, -1) };
        case 'front':
            return { position: new THREE.Vector3(c.x, c.y, c.z + CAMERA_DISTANCE), up: new THREE.Vector3(0, 1, 0) };
        case 'right':
            return { position: new THREE.Vector3(c.x + CAMERA_DISTANCE, c.y, c.z), up: new THREE.Vector3(0, 1, 0) };
        case 'left':
            return { position: new THREE.Vector3(c.x - CAMERA_DISTANCE, c.y, c.z), up: new THREE.Vector3(0, 1, 0) };
        case 'back':
            return { position: new THREE.Vector3(c.x, c.y, c.z - CAMERA_DISTANCE), up: new THREE.Vector3(0, 1, 0) };
    }
}

export class ViewportBlock extends THREE.Object3D implements IShape {
    private viewportConfig: ViewportConfig;
    private viewportMesh!: THREE.Mesh;
    private viewportCamera: THREE.OrthographicCamera;

    renderTarget: THREE.WebGLRenderTarget;

    propertySet: ViewportConfig;

    ogType: 'VIEWPORT_BLOCK' = 'VIEWPORT_BLOCK';
    selected: boolean = false;
    edit: boolean = false;
    locked: boolean = false;

    subElements: Map<string, THREE.Object3D> = new Map();

    constructor(viewportConfig: ViewportConfig) {
        super();
        this.viewportConfig = viewportConfig;
        this.propertySet = { ...viewportConfig };

        // Create render target with appropriate resolution
        // Use a pixel multiplier for crisp rendering
        const pixelDensity = 512; // pixels per scene unit
        const rtWidth = Math.floor(viewportConfig.size[0] * pixelDensity);
        const rtHeight = Math.floor(viewportConfig.size[1] * pixelDensity);

        this.renderTarget = new THREE.WebGLRenderTarget(rtWidth, rtHeight, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
        });

        // Create the dedicated orthographic camera
        const aspect = viewportConfig.size[0] / viewportConfig.size[1];
        const vs = viewportConfig.viewSize;
        this.viewportCamera = new THREE.OrthographicCamera(
            -vs * aspect, vs * aspect,
            vs, -vs,
            0.1, CAMERA_DISTANCE * 2
        );
        this.updateCamera();

        // Position the viewport block in the scene
        this.position.set(
            viewportConfig.position[0],
            viewportConfig.position[1],
            viewportConfig.position[2]
        );

        // Build geometry
        this.setOPGeometry();
    }

    getOPConfig(): Record<string, any> {
        return this.viewportConfig;
    }

    setOPConfig(config: Record<string, any>): void {
        // Merge config
        Object.assign(this.viewportConfig, config);
        this.propertySet = { ...this.viewportConfig };
        this.updateCamera();
    }

    setOPGeometry(): void {
        // Remove old mesh if present
        if (this.viewportMesh) {
            this.remove(this.viewportMesh);
            this.viewportMesh.geometry.dispose();
            (this.viewportMesh.material as THREE.Material).dispose();
        }

        const [w, h] = this.viewportConfig.size;
        const geometry = new THREE.PlaneGeometry(w, h);
        const material = new THREE.MeshBasicMaterial({
            map: this.renderTarget.texture,
            side: THREE.DoubleSide
        });

        this.viewportMesh = new THREE.Mesh(geometry, material);

        // Rotate to lie flat on XZ plane (consistent with PaperFrame)
        this.viewportMesh.rotation.x = -Math.PI / 2;

        // Add a thin border around the viewport
        const borderGeometry = new THREE.EdgesGeometry(geometry);
        const borderMaterial = new THREE.LineBasicMaterial({ color: 0x333333 });
        const border = new THREE.LineSegments(borderGeometry, borderMaterial);
        this.viewportMesh.add(border);

        this.add(this.viewportMesh);
        this.subElements.set('viewportMesh', this.viewportMesh);
    }

    setOPMaterial(): void {
        // No-op for now
    }

    /**
     * Update the internal orthographic camera based on config.
     */
    private updateCamera(): void {
        const { viewCamera, viewCenter, viewSize, size } = this.viewportConfig;
        const aspect = size[0] / size[1];

        this.viewportCamera.left = -viewSize * aspect;
        this.viewportCamera.right = viewSize * aspect;
        this.viewportCamera.top = viewSize;
        this.viewportCamera.bottom = -viewSize;
        this.viewportCamera.updateProjectionMatrix();

        const setup = getCameraSetup(viewCamera, viewCenter);
        this.viewportCamera.position.copy(setup.position);
        this.viewportCamera.up.copy(setup.up);
        this.viewportCamera.lookAt(new THREE.Vector3(viewCenter[0], viewCenter[1], viewCenter[2]));
    }

    /**
     * Render the scene from this viewport's camera into the render target.
     * Must be called each frame from the main render loop.
     *
     * Temporarily hides the viewport mesh to avoid WebGL feedback loop
     * (the mesh's texture IS the render target we're writing to).
     */
    render(renderer: THREE.WebGLRenderer, scene: THREE.Scene): void {
        // 1. Hide mesh to prevent feedback loop
        const wasVisible = this.viewportMesh.visible;
        this.viewportMesh.visible = false;

        renderer.setRenderTarget(this.renderTarget);

        if (this.viewportConfig.viewportBackground !== undefined) {
            // Use setClearColor for the background (bypasses color management)
            const prevClearColor = new THREE.Color();
            renderer.getClearColor(prevClearColor);
            const prevClearAlpha = renderer.getClearAlpha();
            const prevAutoClear = renderer.autoClear;
            const origBackground = scene.background;

            renderer.setClearColor(this.viewportConfig.viewportBackground, 1);
            renderer.autoClear = false;
            renderer.clear();

            // Remove scene background so it doesn't overdraw our clear color
            scene.background = null;
            renderer.render(scene, this.viewportCamera);

            // Restore all state
            scene.background = origBackground;
            renderer.autoClear = prevAutoClear;
            renderer.setClearColor(prevClearColor, prevClearAlpha);
        } else {
            renderer.clear();
            renderer.render(scene, this.viewportCamera);
        }

        renderer.setRenderTarget(null);
        this.viewportMesh.visible = wasVisible;
    }

    /**
     * Update the view direction.
     */
    set viewCamera(direction: ViewCamera) {
        this.viewportConfig.viewCamera = direction;
        this.updateCamera();
    }

    get viewCamera(): ViewCamera {
        return this.viewportConfig.viewCamera;
    }

    /**
     * Update the world-space center that the viewport camera looks at.
     */
    set viewCenter(center: [number, number, number]) {
        this.viewportConfig.viewCenter = center;
        this.updateCamera();
    }

    get viewCenter(): [number, number, number] {
        return this.viewportConfig.viewCenter;
    }

    /**
     * Update the zoom level (half-extent of the ortho frustum).
     */
    set viewSize(size: number) {
        this.viewportConfig.viewSize = size;
        this.updateCamera();
    }

    get viewSize(): number {
        return this.viewportConfig.viewSize;
    }

    public getViewportMesh(): THREE.Mesh {
        return this.viewportMesh;
    }

    public getViewportConfig(): ViewportConfig {
        return this.viewportConfig;
    }

    public dispose(): void {
        this.renderTarget.dispose();
        if (this.viewportMesh) {
            this.viewportMesh.geometry.dispose();
            (this.viewportMesh.material as THREE.Material).dispose();
        }
    }
}
