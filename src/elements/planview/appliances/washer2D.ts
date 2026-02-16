import * as THREE from "three";
import { IShape } from "../../../shapes/base-type";
import { ElementType } from "../../base-type";
import { Polygon, Polyline, Vector3 } from "../../../kernel";

export interface WasherOptions {
    ogid?: string;
    labelName: string;
    type: ElementType.APPLIANCE;
    position: { x: number; y: number; z: number };
    dimensions: { width: number; depth: number };
    bodyColor: number;
}

export class Washer2D extends Polyline implements IShape {
    ogType: string = ElementType.APPLIANCE;
    subElements: Map<string, THREE.Object3D> = new Map();
    selected: boolean = false;
    edit: boolean = false;
    locked: boolean = false;

    propertySet: WasherOptions = {
        labelName: "Washer",
        type: ElementType.APPLIANCE,
        position: { x: 0, y: 0, z: 0 },
        dimensions: { width: 0.6, depth: 0.6 },
        bodyColor: 0xffffff
    };

    get labelName() { return this.propertySet.labelName; }
    set labelName(value: string) { this.propertySet.labelName = value; }

    get dimensions() { return this.propertySet.dimensions; }
    set dimensions(value: { width: number; depth: number }) {
        this.propertySet.dimensions = value;
        this.setOPGeometry();
    }

    get bodyColor() { return this.propertySet.bodyColor; }
    set bodyColor(value: number) {
        this.propertySet.bodyColor = value;
        const body = this.subElements.get("body") as Polygon;
        if (body) body.color = value;
    }

    constructor(config?: Partial<WasherOptions>) {
        super({ ogid: config?.ogid, points: [], color: 0 });
        this.subElements = new Map<string, THREE.Object3D>();
        if (config) this.propertySet = { ...this.propertySet, ...config };
        this.propertySet.ogid = this.ogid;
        this.setOPGeometry();
    }

    setOPConfig(config: Record<string, any>): void { }
    getOPConfig(): Record<string, any> { return {}; }

    setOPGeometry(): void {
        this.subElements.forEach((el) => {
            el.removeFromParent();
            if (el instanceof Polygon) el.dispose();
        });
        this.subElements.clear();

        const { dimensions } = this.propertySet;
        const w = dimensions.width;
        const d = dimensions.depth;
        const hw = w / 2;
        const hd = d / 2;

        // Front strip thickness
        const frontStripDepth = 0.08;

        // Outer body (main rectangle without front strip)
        const bodyPoly = new Polygon({
            vertices: [
                new Vector3(-hw, 0, -hd),
                new Vector3(-hw, 0, hd - frontStripDepth),
                new Vector3(hw, 0, hd - frontStripDepth),
                new Vector3(hw, 0, -hd)
            ],
            color: this.bodyColor
        });
        bodyPoly.outline = true;
        this.subElements.set("body", bodyPoly);
        this.add(bodyPoly);

        // Front strip
        const frontStripPoly = new Polygon({
            vertices: [
                new Vector3(-hw, 0, hd - frontStripDepth),
                new Vector3(-hw, 0, hd),
                new Vector3(hw, 0, hd),
                new Vector3(hw, 0, hd - frontStripDepth)
            ],
            color: this.bodyColor
        });
        frontStripPoly.outline = true;
        frontStripPoly.position.set(0, 0.001, 0);
        this.subElements.set("frontStrip", frontStripPoly);
        this.add(frontStripPoly);

        // Control button (small rectangle in center of front strip)
        const buttonWidth = 0.1;
        const buttonDepth = 0.03;
        const controlButton = new Polygon({
            vertices: [
                new Vector3(-buttonWidth / 2, 0, -buttonDepth / 2),
                new Vector3(-buttonWidth / 2, 0, buttonDepth / 2),
                new Vector3(buttonWidth / 2, 0, buttonDepth / 2),
                new Vector3(buttonWidth / 2, 0, -buttonDepth / 2)
            ],
            color: 0x888888
        });
        controlButton.outline = true;
        controlButton.position.set(0, 0.002, hd - frontStripDepth / 2);
        this.subElements.set("controlButton", controlButton);
        this.add(controlButton);
    }

    setOPMaterial(): void { }
}
