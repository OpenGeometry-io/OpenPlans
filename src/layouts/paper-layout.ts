import * as THREE from 'three';
import { jsPDF } from 'jspdf';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { LayoutViewport, LayoutViewportConfig } from './layout-viewport';

export type LayoutPaperFormat = 'A4' | 'A3' | 'A2' | 'Custom';
export type LayoutPaperOrientation = 'portrait' | 'landscape';

export const LAYOUT_PAPER_SIZES_MM: Record<LayoutPaperFormat, { width: number; height: number }> = {
    A4: { width: 210, height: 297 },
    A3: { width: 297, height: 420 },
    A2: { width: 420, height: 594 },
    Custom: { width: 0, height: 0 },
};

export interface PaperLayoutOptions {
    /** Paper format */
    format: LayoutPaperFormat;
    /** Paper orientation */
    orientation: LayoutPaperOrientation;
    /** Margin in mm */
    margin: number;
    /** Pixels per mm at base zoom (controls base layout resolution). Default: 4 */
    scale?: number;
    /** Custom paper size in mm (only used when format = 'Custom') */
    customSize?: { width: number; height: number };
    /** Paper background color CSS. Default: '#ffffff' */
    backgroundColor?: string;
    /** Border color CSS. Default: '#000000' */
    borderColor?: string;
}

/**
 * PaperLayoutService — CSS3D-based AutoCAD-style layout space.
 *
 * Uses CSS3DRenderer to display a pannable/zoomable paper element.
 * Viewport canvases are embedded inside the CSS3D paper object.
 * A shared offscreen WebGLRenderer handles 3D rendering.
 * Dynamic resolution: viewports re-render at higher pixel density when zoomed in.
 */
export class PaperLayoutService {
    private container: HTMLElement;
    private paperElement!: HTMLDivElement;
    private innerBorderElement!: HTMLDivElement;

    // CSS3D layer
    private css3dRenderer!: CSS3DRenderer;
    private css3dScene!: THREE.Scene;
    private css3dCamera!: THREE.OrthographicCamera;
    private paperCSS3DObject!: CSS3DObject;

    // WebGL rendering (shared, offscreen)
    private offscreenRenderer: THREE.WebGLRenderer;
    private scene: THREE.Scene;

    private viewports: LayoutViewport[] = [];
    private animationId: number = 0;
    private options: Required<Omit<PaperLayoutOptions, 'customSize'>> & { customSize?: { width: number; height: number } };

    // Pan/zoom state
    private panX: number = 0;
    private panY: number = 0;
    private zoom: number = 1;
    private isPanning: boolean = false;
    private panStartX: number = 0;
    private panStartY: number = 0;
    private panStartPanX: number = 0;
    private panStartPanY: number = 0;

    /** Pixels per mm */
    readonly pxPerMm: number;
    /** Paper size in mm after orientation */
    readonly paperWidth: number;
    readonly paperHeight: number;

    constructor(container: HTMLElement, scene: THREE.Scene, options: PaperLayoutOptions) {
        this.container = container;
        this.scene = scene;
        this.pxPerMm = options.scale ?? 4;

        this.options = {
            format: options.format,
            orientation: options.orientation,
            margin: options.margin,
            scale: this.pxPerMm,
            backgroundColor: options.backgroundColor ?? '#ffffff',
            borderColor: options.borderColor ?? '#000000',
            customSize: options.customSize,
        };

        // Compute paper dimensions in mm
        const base = options.format === 'Custom' && options.customSize
            ? options.customSize
            : LAYOUT_PAPER_SIZES_MM[options.format];
        const isPortrait = options.orientation === 'portrait';
        this.paperWidth = isPortrait ? base.width : base.height;
        this.paperHeight = isPortrait ? base.height : base.width;

        // Create the shared offscreen renderer (not attached to DOM)
        this.offscreenRenderer = new THREE.WebGLRenderer({
            antialias: true,
            preserveDrawingBuffer: true,
        });
        this.offscreenRenderer.setPixelRatio(1);

        // Build CSS3D layer and paper
        this.createCSS3DLayer();
        this.createPaper();
        this.setupPanZoom();

        // Start render loop
        this.startRenderLoop();
    }

    private createCSS3DLayer(): void {
        const w = this.container.clientWidth || window.innerWidth;
        const h = this.container.clientHeight || window.innerHeight;

        // CSS3D scene + orthographic camera for 2D paper navigation
        this.css3dScene = new THREE.Scene();
        this.css3dCamera = new THREE.OrthographicCamera(
            -w / 2, w / 2,
            h / 2, -h / 2,
            0.1, 10000
        );
        this.css3dCamera.position.set(0, 0, 1000);
        this.css3dCamera.lookAt(0, 0, 0);

        // CSS3D renderer
        this.css3dRenderer = new CSS3DRenderer();
        this.css3dRenderer.setSize(w, h);
        this.css3dRenderer.domElement.style.position = 'absolute';
        this.css3dRenderer.domElement.style.top = '0';
        this.css3dRenderer.domElement.style.left = '0';
        this.container.appendChild(this.css3dRenderer.domElement);

        // Handle container resize
        const resizeObserver = new ResizeObserver(() => {
            const nw = this.container.clientWidth;
            const nh = this.container.clientHeight;
            this.css3dCamera.left = -nw / 2;
            this.css3dCamera.right = nw / 2;
            this.css3dCamera.top = nh / 2;
            this.css3dCamera.bottom = -nh / 2;
            this.css3dCamera.updateProjectionMatrix();
            this.css3dRenderer.setSize(nw, nh);
            this.markAllDirty();
        });
        resizeObserver.observe(this.container);
    }

    private createPaper(): void {
        const pW = this.paperWidth * this.pxPerMm;
        const pH = this.paperHeight * this.pxPerMm;
        const margin = this.options.margin * this.pxPerMm;

        // Paper element — white rectangle
        this.paperElement = document.createElement('div');
        this.paperElement.style.width = `${pW}px`;
        this.paperElement.style.height = `${pH}px`;
        this.paperElement.style.background = this.options.backgroundColor;
        this.paperElement.style.border = `2px solid ${this.options.borderColor}`;
        this.paperElement.style.boxShadow = '0 4px 24px rgba(0,0,0,0.25)';
        this.paperElement.style.overflow = 'hidden';
        this.paperElement.style.boxSizing = 'border-box';
        this.paperElement.style.position = 'relative';

        // Inner border (margin line)
        this.innerBorderElement = document.createElement('div');
        this.innerBorderElement.style.position = 'absolute';
        this.innerBorderElement.style.left = `${margin}px`;
        this.innerBorderElement.style.top = `${margin}px`;
        this.innerBorderElement.style.width = `${pW - margin * 2}px`;
        this.innerBorderElement.style.height = `${pH - margin * 2}px`;
        this.innerBorderElement.style.border = `1px solid ${this.options.borderColor}`;
        this.innerBorderElement.style.pointerEvents = 'none';
        this.innerBorderElement.style.boxSizing = 'border-box';

        this.paperElement.appendChild(this.innerBorderElement);

        // Wrap paper in a CSS3DObject and add to the CSS3D scene
        this.paperCSS3DObject = new CSS3DObject(this.paperElement);
        this.paperCSS3DObject.position.set(0, 0, 0);
        this.css3dScene.add(this.paperCSS3DObject);
    }

    private setupPanZoom(): void {
        const el = this.css3dRenderer.domElement;

        // Mouse wheel zoom
        el.addEventListener('wheel', (e: WheelEvent) => {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            const newZoom = Math.max(0.1, Math.min(10, this.zoom * zoomFactor));

            // Zoom towards mouse position
            const rect = el.getBoundingClientRect();
            const mouseX = e.clientX - rect.left - rect.width / 2;
            const mouseY = -(e.clientY - rect.top - rect.height / 2);

            // Adjust pan so zoom centers on mouse
            const zoomChange = newZoom / this.zoom;
            this.panX = mouseX - (mouseX - this.panX) * zoomChange;
            this.panY = mouseY - (mouseY - this.panY) * zoomChange;
            this.zoom = newZoom;

            this.updateCSS3DCamera();
            this.updateViewportResolutions();
        }, { passive: false });

        // Middle-button pan
        el.addEventListener('mousedown', (e: MouseEvent) => {
            if (e.button === 1) { // middle click
                e.preventDefault();
                this.isPanning = true;
                this.panStartX = e.clientX;
                this.panStartY = e.clientY;
                this.panStartPanX = this.panX;
                this.panStartPanY = this.panY;
                el.style.cursor = 'grabbing';
            }
        });

        window.addEventListener('mousemove', (e: MouseEvent) => {
            if (!this.isPanning) return;
            const dx = e.clientX - this.panStartX;
            const dy = e.clientY - this.panStartY;
            this.panX = this.panStartPanX + dx;
            this.panY = this.panStartPanY - dy;
            this.updateCSS3DCamera();
        });

        window.addEventListener('mouseup', (e: MouseEvent) => {
            if (e.button === 1 && this.isPanning) {
                this.isPanning = false;
                el.style.cursor = '';
            }
        });
    }

    private updateCSS3DCamera(): void {
        // Position the CSS3D camera to create pan/zoom effect
        const w = this.container.clientWidth || window.innerWidth;
        const h = this.container.clientHeight || window.innerHeight;

        const halfW = w / (2 * this.zoom);
        const halfH = h / (2 * this.zoom);

        this.css3dCamera.left = -halfW;
        this.css3dCamera.right = halfW;
        this.css3dCamera.top = halfH;
        this.css3dCamera.bottom = -halfH;
        this.css3dCamera.position.set(-this.panX / this.zoom, -this.panY / this.zoom, 1000);
        this.css3dCamera.updateProjectionMatrix();
    }

    /**
     * Update viewport canvas resolutions based on current CSS3D zoom.
     * This achieves crystal-clear rendering at any zoom level.
     */
    private updateViewportResolutions(): void {
        for (const vp of this.viewports) {
            vp.updateResolution(this.zoom);
        }
    }

    private markAllDirty(): void {
        for (const vp of this.viewports) {
            vp.markDirty();
        }
    }

    /**
     * Add a viewport window to the paper.
     * Position and size are in mm, relative to the paper's top-left corner.
     */
    addViewport(config: LayoutViewportConfig): LayoutViewport {
        const viewport = new LayoutViewport(config, this.paperElement, this.pxPerMm);
        viewport.updateResolution(this.zoom);
        this.viewports.push(viewport);
        return viewport;
    }

    /**
     * Remove a viewport by id.
     */
    removeViewport(id: string): void {
        const idx = this.viewports.findIndex(v => v.id === id);
        if (idx >= 0) {
            this.viewports[idx].dispose();
            this.viewports.splice(idx, 1);
        }
    }

    /**
     * Get a viewport by id.
     */
    getViewport(id: string): LayoutViewport | undefined {
        return this.viewports.find(v => v.id === id);
    }

    private startRenderLoop(): void {
        const loop = () => {
            // Render CSS3D layer (paper positioning)
            this.css3dRenderer.render(this.css3dScene, this.css3dCamera);

            // Render dirty viewports only
            for (const viewport of this.viewports) {
                viewport.render(this.offscreenRenderer, this.scene);
            }

            this.animationId = requestAnimationFrame(loop);
        };
        this.animationId = requestAnimationFrame(loop);
    }

    /**
     * Export the paper layout to a PDF file.
     * Paper borders are drawn as vectors; viewport content is rendered at high DPI.
     */
    exportToPDF(filename?: string, exportDpiScale?: number): void {
        const dpiScale = exportDpiScale ?? 12;
        const format = this.options.format.toLowerCase();
        const orientation = this.options.orientation;

        const pdf = new jsPDF({
            orientation: orientation === 'landscape' ? 'landscape' : 'portrait',
            unit: 'mm',
            format: format !== 'custom' ? format : [this.paperWidth, this.paperHeight],
        });

        const pdfW = pdf.internal.pageSize.getWidth();
        const pdfH = pdf.internal.pageSize.getHeight();

        // Vector: outer border
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.5);
        pdf.rect(0, 0, pdfW, pdfH);

        // Vector: inner margin border
        const m = this.options.margin;
        pdf.setLineWidth(0.25);
        pdf.rect(m, m, pdfW - m * 2, pdfH - m * 2);

        // Raster: viewport content at high DPI
        for (const viewport of this.viewports) {
            const cfg = viewport.getConfig();
            const imgData = viewport.renderHighRes(this.offscreenRenderer, this.scene, dpiScale);

            pdf.addImage(
                imgData,
                'JPEG',
                cfg.position[0],
                cfg.position[1],
                cfg.size[0],
                cfg.size[1],
            );

            // Vector viewport border
            pdf.setLineWidth(0.2);
            pdf.rect(cfg.position[0], cfg.position[1], cfg.size[0], cfg.size[1]);
        }

        pdf.save(filename ?? `OpenPlans_${this.options.format}_${orientation}.pdf`);

        // After high-res render, mark all dirty so they re-render at screen resolution
        this.markAllDirty();
    }

    /** Get the HTML paper element for custom styling. */
    get paper(): HTMLDivElement {
        return this.paperElement;
    }

    /** Get current zoom level. */
    get currentZoom(): number {
        return this.zoom;
    }

    dispose(): void {
        cancelAnimationFrame(this.animationId);
        for (const vp of this.viewports) {
            vp.dispose();
        }
        this.viewports = [];
        this.offscreenRenderer.dispose();
        this.css3dRenderer.domElement.remove();
    }
}
