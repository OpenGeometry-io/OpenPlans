import * as THREE from "three";
import { IShape } from "../../shapes/base-type";
import { ElementType } from "../base-type";
import { Polygon, Polyline, Vector3 } from "opengeometry";

export interface DoubleWindowOptions {
    ogid?: string;
    labelName: string;
    type: ElementType.WINDOW;
    windowPosition: { x: number; y: number; z: number };
    frameDimensions: { width: number; thickness: number };
    windowDimensions: { width: number; thickness: number };
    mullionWidth: number;
    frameColor: number;
    glassColor: number;
}

export class DoubleWindow2D extends Polyline implements IShape {
    ogType: string = ElementType.WINDOW;
    subElements: Map<string, THREE.Object3D> = new Map();
    selected: boolean = false;
    edit: boolean = false;
    locked: boolean = false;

    propertySet: DoubleWindowOptions = {
        labelName: "Double Window",
        type: ElementType.WINDOW,
        windowPosition: { x: 0, y: 0, z: 0 },
        windowDimensions: { width: 0.8, thickness: 0.2 },
        frameDimensions: { width: 0.08, thickness: 0.2 },
        mullionWidth: 0.06,
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

    get mullionWidth() {
        return this.propertySet.mullionWidth;
    }

    set mullionWidth(value: number) {
        this.propertySet.mullionWidth = value;
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
        const mullion = this.subElements.get("mullion") as Polygon;
        if (mullion) mullion.color = value;
    }

    get glassColor() {
        return this.propertySet.glassColor;
    }

    set glassColor(value: number) {
        this.propertySet.glassColor = value;
        const leftGlass = this.subElements.get("leftGlass") as Polygon;
        if (leftGlass) leftGlass.color = value;
        const rightGlass = this.subElements.get("rightGlass") as Polygon;
        if (rightGlass) rightGlass.color = value;
    }

    constructor(windowConfig?: Partial<DoubleWindowOptions>) {
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
        // Clear all existing sub-elements
        this.subElements.forEach((element) => {
            element.removeFromParent();
            if (element instanceof Polygon) {
                element.dispose();
            }
        });
        this.subElements.clear();

        const { windowDimensions, mullionWidth, frameDimensions } = this.propertySet;

        // Total width: left frame + left glass + mullion + right glass + right frame
        const glassWidth = windowDimensions.width;
        const totalWidth = frameDimensions.width * 2 + glassWidth * 2 + mullionWidth;

        const vertices = [
            new Vector3(totalWidth / 2, 0, windowDimensions.thickness / 2),
            new Vector3(totalWidth / 2, 0, -windowDimensions.thickness / 2),
            new Vector3(-totalWidth / 2, 0, -windowDimensions.thickness / 2),
            new Vector3(-totalWidth / 2, 0, windowDimensions.thickness / 2),
            new Vector3(totalWidth / 2, 0, windowDimensions.thickness / 2)
        ];

        this.setConfig({
            points: vertices,
            color: 0x0000ff
        });

        // Create frame geometry (left and right jambs)
        this.createFrameGeometry(totalWidth);

        // Create mullion (center divider)
        this.createMullionGeometry();

        // Create glass panes
        this.createGlassGeometry(glassWidth, totalWidth);
    }

    private createGlassGeometry(glassWidth: number, totalWidth: number) {
        const { windowDimensions, frameDimensions } = this.propertySet;
        const glassThickness = windowDimensions.thickness * 0.8;

        // Left glass pane position: after left frame
        const leftGlassX = -totalWidth / 2 + frameDimensions.width + glassWidth / 2;

        const leftGlassPoly = new Polygon({
            vertices: [
                new Vector3(-glassWidth / 2, 0, -glassThickness / 2),
                new Vector3(-glassWidth / 2, 0, glassThickness / 2),
                new Vector3(glassWidth / 2, 0, glassThickness / 2),
                new Vector3(glassWidth / 2, 0, -glassThickness / 2)
            ],
            color: this.glassColor
        });
        leftGlassPoly.outline = true;
        leftGlassPoly.position.set(leftGlassX, 0.001, 0);

        this.subElements.set("leftGlass", leftGlassPoly);
        this.add(leftGlassPoly);

        // Right glass pane position: after mullion
        const rightGlassX = totalWidth / 2 - frameDimensions.width - glassWidth / 2;

        const rightGlassPoly = new Polygon({
            vertices: [
                new Vector3(-glassWidth / 2, 0, -glassThickness / 2),
                new Vector3(-glassWidth / 2, 0, glassThickness / 2),
                new Vector3(glassWidth / 2, 0, glassThickness / 2),
                new Vector3(glassWidth / 2, 0, -glassThickness / 2)
            ],
            color: this.glassColor
        });
        rightGlassPoly.outline = true;
        rightGlassPoly.position.set(rightGlassX, 0.001, 0);

        this.subElements.set("rightGlass", rightGlassPoly);
        this.add(rightGlassPoly);
    }

    private createMullionGeometry() {
        const { mullionWidth, frameDimensions } = this.propertySet;

        const mullionPoly = new Polygon({
            vertices: [
                new Vector3(-mullionWidth / 2, 0, -frameDimensions.thickness / 2),
                new Vector3(-mullionWidth / 2, 0, frameDimensions.thickness / 2),
                new Vector3(mullionWidth / 2, 0, frameDimensions.thickness / 2),
                new Vector3(mullionWidth / 2, 0, -frameDimensions.thickness / 2)
            ],
            color: this.frameColor
        });
        mullionPoly.position.set(0, 0.002, 0);

        this.subElements.set("mullion", mullionPoly);
        this.add(mullionPoly);
    }

    private createFrameGeometry(totalWidth: number) {
        const { frameDimensions } = this.propertySet;

        // Left frame (jamb)
        const frameLeftPoly = new Polygon({
            vertices: [
                new Vector3(-frameDimensions.width / 2, 0, -frameDimensions.thickness / 2),
                new Vector3(-frameDimensions.width / 2, 0, frameDimensions.thickness / 2),
                new Vector3(frameDimensions.width / 2, 0, frameDimensions.thickness / 2),
                new Vector3(frameDimensions.width / 2, 0, -frameDimensions.thickness / 2)
            ],
            color: this.frameColor
        });
        frameLeftPoly.position.set(-totalWidth / 2 + frameDimensions.width / 2, 0.002, 0);

        this.subElements.set("frameLeft", frameLeftPoly);
        this.add(frameLeftPoly);

        // Right frame (jamb)
        const frameRightPoly = new Polygon({
            vertices: [
                new Vector3(-frameDimensions.width / 2, 0, -frameDimensions.thickness / 2),
                new Vector3(-frameDimensions.width / 2, 0, frameDimensions.thickness / 2),
                new Vector3(frameDimensions.width / 2, 0, frameDimensions.thickness / 2),
                new Vector3(frameDimensions.width / 2, 0, -frameDimensions.thickness / 2)
            ],
            color: this.frameColor
        });
        frameRightPoly.position.set(totalWidth / 2 - frameDimensions.width / 2, 0.002, 0);

        this.subElements.set("frameRight", frameRightPoly);
        this.add(frameRightPoly);
    }

    setOPMaterial(): void {
        // Implementation here
    }
}
