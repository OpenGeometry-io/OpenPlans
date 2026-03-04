import * as THREE from 'three';
import { jsPDF } from 'jspdf';

export type ViewCamera = 'top' | 'front' | 'right' | 'left' | 'back';

export interface LayoutViewportConfig {
    id: string;
    /** Width and height within the paper, in mm */
    size: [number, number];
    /** Position within the paper (top-left corner), in mm */
    position: [number, number];
    /** Camera direction */
    viewCamera: ViewCamera;
    /** World-space center the camera looks at */
    viewCenter: [number, number, number];
    /** Half-extent of ortho frustum (zoom level in scene units) */
    viewSize: number;
    /** Background color for this viewport (default: 0xffffff) */
    background?: number;
    /** Border color (default: 0x000000) */
    borderColor?: string;
    /** Border width in px (default: 1) */
    borderWidth?: number;
}

const CAMERA_DISTANCE = 500;

function getCameraSetup(viewCamera: ViewCamera, center: [number, number, number]) {
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

export class LayoutViewport {
    readonly id: string;
    private config: LayoutViewportConfig;
    private camera: THREE.OrthographicCamera;

    /** The canvas element positioned inside the paper */
    readonly canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    /** Scale factor: pixels per mm (layout scale) */
    private pxPerMm: number;

    /** Dirty flag — skip re-render if nothing changed */
    private _dirty: boolean = true;

    /** Previous render dimensions (for dynamic resolution) */
    private prevRenderW: number = 0;
    private prevRenderH: number = 0;

    /** Max render dimension to avoid GPU memory issues */
    private static MAX_DIM = 4096;

    constructor(config: LayoutViewportConfig, paperElement: HTMLElement, pxPerMm: number) {
        this.id = config.id;
        this.config = { ...config };
        this.pxPerMm = pxPerMm;

        // CSS dimensions (layout size on screen)
        const cssW = Math.round(config.size[0] * pxPerMm);
        const cssH = Math.round(config.size[1] * pxPerMm);

        // Initial backing pixel dimensions (will be updated dynamically)
        const dpr = window.devicePixelRatio || 1;

        this.canvas = document.createElement('canvas');
        this.canvas.width = Math.round(cssW * dpr);
        this.canvas.height = Math.round(cssH * dpr);
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = `${config.position[0] * pxPerMm}px`;
        this.canvas.style.top = `${config.position[1] * pxPerMm}px`;
        this.canvas.style.width = `${cssW}px`;
        this.canvas.style.height = `${cssH}px`;
        this.canvas.style.border = `${config.borderWidth ?? 1}px solid ${config.borderColor ?? '#000000'}`;
        this.canvas.style.boxSizing = 'border-box';
        this.canvas.style.background = `#${(config.background ?? 0xffffff).toString(16).padStart(6, '0')}`;

        this.ctx = this.canvas.getContext('2d')!;
        paperElement.appendChild(this.canvas);

        // Create orthographic camera
        const aspect = config.size[0] / config.size[1];
        const vs = config.viewSize;
        this.camera = new THREE.OrthographicCamera(
            -vs * aspect, vs * aspect,
            vs, -vs,
            0.1, CAMERA_DISTANCE * 2
        );
        this.updateCamera();
    }

    private updateCamera(): void {
        const { viewCamera, viewCenter, viewSize, size } = this.config;
        const aspect = size[0] / size[1];

        this.camera.left = -viewSize * aspect;
        this.camera.right = viewSize * aspect;
        this.camera.top = viewSize;
        this.camera.bottom = -viewSize;
        this.camera.updateProjectionMatrix();

        const setup = getCameraSetup(viewCamera, viewCenter);
        this.camera.position.copy(setup.position);
        this.camera.up.copy(setup.up);
        this.camera.lookAt(new THREE.Vector3(viewCenter[0], viewCenter[1], viewCenter[2]));
    }

    /**
     * Mark viewport as dirty — will re-render on next frame.
     */
    markDirty(): void {
        this._dirty = true;
    }

    /**
     * Check if a re-render is needed.
     */
    get isDirty(): boolean {
        return this._dirty;
    }

    /**
     * Update the canvas resolution to match the effective screen pixel size.
     * Called by PaperLayoutService when CSS3D zoom changes.
     * @param cssZoom The effective CSS zoom scale applied to the paper
     */
    updateResolution(cssZoom: number): void {
        const dpr = window.devicePixelRatio || 1;
        const cssW = this.config.size[0] * this.pxPerMm;
        const cssH = this.config.size[1] * this.pxPerMm;

        // Effective screen pixels needed for this viewport at current zoom
        let renderW = Math.round(cssW * cssZoom * dpr);
        let renderH = Math.round(cssH * cssZoom * dpr);

        // Cap at MAX_DIM
        const maxDim = LayoutViewport.MAX_DIM;
        if (renderW > maxDim || renderH > maxDim) {
            const scale = maxDim / Math.max(renderW, renderH);
            renderW = Math.round(renderW * scale);
            renderH = Math.round(renderH * scale);
        }

        // Only update if resolution changed significantly (>10%)
        if (this.prevRenderW === 0 ||
            Math.abs(renderW - this.prevRenderW) / this.prevRenderW > 0.1 ||
            Math.abs(renderH - this.prevRenderH) / this.prevRenderH > 0.1) {
            this.canvas.width = renderW;
            this.canvas.height = renderH;
            this.prevRenderW = renderW;
            this.prevRenderH = renderH;
            this._dirty = true;
        }
    }

    /**
     * Render the scene using the shared offscreen renderer, then copy pixels to this viewport's canvas.
     * Returns true if actually rendered (dirty), false if skipped.
     */
    render(offscreenRenderer: THREE.WebGLRenderer, scene: THREE.Scene, force: boolean = false): boolean {
        if (!this._dirty && !force) return false;

        const w = this.canvas.width;
        const h = this.canvas.height;
        if (w === 0 || h === 0) return false;

        // Resize offscreen renderer to match this viewport's backing pixel size
        offscreenRenderer.setSize(w, h, false);

        // Save and override state
        const prevAutoClear = offscreenRenderer.autoClear;
        const origBackground = scene.background;

        // Set viewport background and prevent scene.background from overriding
        const bg = this.config.background ?? 0xffffff;
        offscreenRenderer.setClearColor(bg, 1);
        offscreenRenderer.autoClear = false;
        scene.background = null;

        // Clear with our color, then render scene content only
        offscreenRenderer.clear();
        offscreenRenderer.render(scene, this.camera);

        // Restore state
        scene.background = origBackground;
        offscreenRenderer.autoClear = prevAutoClear;

        // Copy rendered pixels to this viewport's 2D canvas
        this.ctx.clearRect(0, 0, w, h);
        this.ctx.drawImage(offscreenRenderer.domElement, 0, 0, w, h);

        this._dirty = false;
        return true;
    }

    /**
     * Render at high resolution for PDF export.
     * Returns the data URL of the rendered image.
     * @param pxPerMm Pixels per mm for the export (e.g. 12 = ~300 DPI)
     */
    renderHighRes(offscreenRenderer: THREE.WebGLRenderer, scene: THREE.Scene, pxPerMm: number): string {
        const w = Math.round(this.config.size[0] * pxPerMm);
        const h = Math.round(this.config.size[1] * pxPerMm);

        offscreenRenderer.setSize(w, h, false);

        // Save and override state
        const prevAutoClear = offscreenRenderer.autoClear;
        const origBackground = scene.background;

        const bg = this.config.background ?? 0xffffff;
        offscreenRenderer.setClearColor(bg, 1);
        offscreenRenderer.autoClear = false;
        scene.background = null;

        offscreenRenderer.clear();
        offscreenRenderer.render(scene, this.camera);

        // Restore state
        scene.background = origBackground;
        offscreenRenderer.autoClear = prevAutoClear;

        // Capture to a temp canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext('2d')!;
        tempCtx.drawImage(offscreenRenderer.domElement, 0, 0, w, h);

        const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.95);
        tempCanvas.remove();
        return dataUrl;
    }

    /** Get config (for PDF export positioning) */
    getConfig(): LayoutViewportConfig {
        return this.config;
    }

    // ── Setters for live updates ──

    set viewCamera(direction: ViewCamera) {
        this.config.viewCamera = direction;
        this.updateCamera();
        this._dirty = true;
    }

    get viewCamera(): ViewCamera {
        return this.config.viewCamera;
    }

    set viewCenter(center: [number, number, number]) {
        this.config.viewCenter = center;
        this.updateCamera();
        this._dirty = true;
    }

    get viewCenter(): [number, number, number] {
        return this.config.viewCenter;
    }

    set viewSize(size: number) {
        this.config.viewSize = size;
        this.updateCamera();
        this._dirty = true;
    }

    get viewSize(): number {
        return this.config.viewSize;
    }

    dispose(): void {
        this.canvas.remove();
    }
}
