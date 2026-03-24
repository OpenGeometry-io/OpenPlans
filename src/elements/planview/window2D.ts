import * as THREE from "three";
import { IShape } from "../../shapes/base-type";
import { ElementType } from "../base-type";
import { Polygon, Polyline, Vector3 } from "opengeometry";

export interface WindowOptions {
    ogid?: string;
    labelName: string;
    type: ElementType.WINDOW;
    windowPosition: { x: number; y: number; z: number };
    frameDimensions: { width: number; thickness: number };
    windowDimensions: { width: number; thickness: number };
    frameColor: number;
    glassColor: number;
}

export class Window2D extends Polyline implements IShape {
    ogType: string = ElementType.WINDOW;
    subElements: Map<string, THREE.Object3D> = new Map();
    selected: boolean = false;
    edit: boolean = false;
    locked: boolean = false;

    propertySet: WindowOptions = {
        labelName: "Single Window",
        type: ElementType.WINDOW,
        windowPosition: { x: 0, y: 0, z: 0 },
        windowDimensions: { width: 1.5, thickness: 0.15 },
        frameDimensions: { width: 0.15, thickness: 0.2 },
        frameColor: 0x000000,
        glassColor: 0x87CEEB
    };

    // Getter Setter
    get labelName() {
        return this.propertySet.labelName;
    }

    set labelName(value: string) {
        this.propertySet.labelName = value;
    }

    get windowPosition() {
        return this.propertySet.windowPosition;
    }

    set windowPosition(value: { x: number; y: number; z: number }) {
        this.propertySet.windowPosition = value;
    }

    get frameDimensions() {
        return this.propertySet.frameDimensions;
    }

    set frameDimensions(value: { width: number; thickness: number }) {
        this.propertySet.frameDimensions = value;
        this.setOPGeometry();
    }

    get windowDimensions() {
        return this.propertySet.windowDimensions;
    }

    set windowDimensions(value: { width: number; thickness: number }) {
        this.propertySet.windowDimensions = value;
        this.setOPGeometry();
    }

    get frameColor() {
        return this.propertySet.frameColor;
    }

    set frameColor(value: number) {
        this.propertySet.frameColor = value;
        const frameLeft = this.subElements.get("frameLeft") as Polygon;
        if (frameLeft) frameLeft.color = value;
        const frameRight = this.subElements.get("frameRight") as Polygon;
        if (frameRight) frameRight.color = value;
    }

    get glassColor() {
        return this.propertySet.glassColor;
    }

    set glassColor(value: number) {
        this.propertySet.glassColor = value;
        const glass = this.subElements.get("glass") as Polygon;
        if (glass) glass.color = value;
    }

    constructor(windowConfig?: Partial<WindowOptions>) {
        super({
            ogid: windowConfig?.ogid,
            points: [],
            color: 0
        });

        this.subElements = new Map<string, THREE.Object3D>();

        if (windowConfig) {
            this.propertySet = { ...this.propertySet, ...windowConfig };
        }

        this.propertySet.ogid = this.ogid;
        this.setOPGeometry();
    }

    setOPConfig(config: Record<string, any>): void {
        if (config) {
            this.propertySet = { ...this.propertySet, ...config };
            this.setOPGeometry();
        }
    }

    getOPConfig(): Record<string, any> {
        return this.propertySet;
    }

    setOPGeometry(): void {
        const { windowDimensions } = this.propertySet;

        const vertices = [
            new Vector3(windowDimensions.width / 2, 0, windowDimensions.thickness / 2),
            new Vector3(windowDimensions.width / 2, 0, -windowDimensions.thickness / 2),
            new Vector3(-windowDimensions.width / 2, 0, -windowDimensions.thickness / 2),
            new Vector3(-windowDimensions.width / 2, 0, windowDimensions.thickness / 2),
            new Vector3(windowDimensions.width / 2, 0, windowDimensions.thickness / 2)
        ];

        this.setConfig({
            points: vertices,
            color: 0x0000ff
        });

        // Create frame geometry
        this.createFrameGeometry();

        // Create glass pane
        this.createGlassGeometry();
    }

    private createGlassGeometry() {
        if (this.subElements.has("glass")) {
            const glass = this.subElements.get("glass") as Polygon;
            glass?.removeFromParent();
            glass?.dispose();
        }

        const { windowDimensions, frameDimensions } = this.propertySet;
        const glassWidth = windowDimensions.width - frameDimensions.width * 2;
        const glassThickness = windowDimensions.thickness * 0.6;

        const glassPoly = new Polygon({
            vertices: [
                new Vector3(-glassWidth / 2, 0, -glassThickness / 2),
                new Vector3(-glassWidth / 2, 0, glassThickness / 2),
                new Vector3(glassWidth / 2, 0, glassThickness / 2),
                new Vector3(glassWidth / 2, 0, -glassThickness / 2)
            ],
            color: this.glassColor
        });
        glassPoly.outline = true;

        this.subElements.set("glass", glassPoly);
        this.add(glassPoly);
    }

    private createFrameGeometry() {
        if (this.subElements.has("frameLeft")) {
            const frame = this.subElements.get("frameLeft") as Polygon;
            frame?.removeFromParent();
            frame?.dispose();
        }

        if (this.subElements.has("frameRight")) {
            const frame = this.subElements.get("frameRight") as Polygon;
            frame?.removeFromParent();
            frame?.dispose();
        }

        const { frameDimensions, windowDimensions } = this.propertySet;

        const frameLeftPoly = new Polygon({
            vertices: [
                new Vector3(-frameDimensions.width / 2, 0, -frameDimensions.thickness / 2),
                new Vector3(-frameDimensions.width / 2, 0, frameDimensions.thickness / 2),
                new Vector3(frameDimensions.width / 2, 0, frameDimensions.thickness / 2),
                new Vector3(frameDimensions.width / 2, 0, -frameDimensions.thickness / 2)
            ],
            color: this.frameColor
        });

        frameLeftPoly.position.set(-windowDimensions.width / 2 + frameDimensions.width / 2, 0, 0);

        this.subElements.set("frameLeft", frameLeftPoly);
        this.add(frameLeftPoly);

        // Frame Right
        const frameRightPoly = new Polygon({
            vertices: [
                new Vector3(-frameDimensions.width / 2, 0, -frameDimensions.thickness / 2),
                new Vector3(-frameDimensions.width / 2, 0, frameDimensions.thickness / 2),
                new Vector3(frameDimensions.width / 2, 0, frameDimensions.thickness / 2),
                new Vector3(frameDimensions.width / 2, 0, -frameDimensions.thickness / 2)
            ],
            color: this.frameColor
        });

        frameRightPoly.position.set(windowDimensions.width / 2 - frameDimensions.width / 2, 0, 0);
        this.subElements.set("frameRight", frameRightPoly);
        this.add(frameRightPoly);
    }

    setOPMaterial(): void {
        // Implementation here
    }
}
