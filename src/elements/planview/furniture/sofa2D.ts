import * as THREE from "three";
import { IShape } from "../../../shapes/base-type";
import { ElementType } from "../../base-type";
import { Polygon, Polyline, Vector3 } from "../../../kernel";

export interface SofaOptions {
    ogid?: string;
    labelName: string;
    type: ElementType.FURNITURE;
    position: { x: number; y: number; z: number };
    dimensions: { width: number; depth: number };
    sofaColor: number;
    cushionColor: number;
}

export class Sofa2D extends Polyline implements IShape {
    ogType: string = ElementType.FURNITURE;
    subElements: Map<string, THREE.Object3D> = new Map();
    selected: boolean = false;
    edit: boolean = false;
    locked: boolean = false;

    propertySet: SofaOptions = {
        labelName: "Sofa",
        type: ElementType.FURNITURE,
        position: { x: 0, y: 0, z: 0 },
        dimensions: { width: 2.2, depth: 0.9 },
        sofaColor: 0xffffff,
        cushionColor: 0xcccccc
    };

    get labelName() { return this.propertySet.labelName; }
    set labelName(value: string) { this.propertySet.labelName = value; }

    get dimensions() { return this.propertySet.dimensions; }
    set dimensions(value: { width: number; depth: number }) {
        this.propertySet.dimensions = value;
        this.setOPGeometry();
    }

    get sofaColor() { return this.propertySet.sofaColor; }
    set sofaColor(value: number) {
        this.propertySet.sofaColor = value;
        const frame = this.subElements.get("frame") as Polygon;
        if (frame) frame.color = value;
    }

    get cushionColor() { return this.propertySet.cushionColor; }
    set cushionColor(value: number) {
        this.propertySet.cushionColor = value;
        this.subElements.forEach((el, key) => {
            if (key.startsWith("cushion") && el instanceof Polygon) el.color = value;
        });
    }

    constructor(config?: Partial<SofaOptions>) {
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
        const hw = dimensions.width / 2;
        const hd = dimensions.depth / 2;
        const backDepth = dimensions.depth * 0.2;
        const armWidth = dimensions.width * 0.08;

        // Main frame
        const framePoly = new Polygon({
            vertices: [
                new Vector3(-hw, 0, -hd),
                new Vector3(-hw, 0, hd),
                new Vector3(hw, 0, hd),
                new Vector3(hw, 0, -hd)
            ],
            color: this.sofaColor
        });
        framePoly.outline = true;
        this.subElements.set("frame", framePoly);
        this.add(framePoly);

        // Backrest
        const backrest = new Polygon({
            vertices: [
                new Vector3(-hw + armWidth, 0, -hd),
                new Vector3(-hw + armWidth, 0, -hd + backDepth),
                new Vector3(hw - armWidth, 0, -hd + backDepth),
                new Vector3(hw - armWidth, 0, -hd)
            ],
            color: 0x6b5344
        });
        backrest.position.set(0, 0.001, 0);
        this.subElements.set("backrest", backrest);
        this.add(backrest);

        // Seat cushions (3 cushions)
        const cushionWidth = (dimensions.width - armWidth * 2) / 3;
        const cushionDepth = dimensions.depth - backDepth - 0.05;
        for (let i = 0; i < 3; i++) {
            const cushion = new Polygon({
                vertices: [
                    new Vector3(-cushionWidth / 2 + 0.02, 0, -cushionDepth / 2 + 0.02),
                    new Vector3(-cushionWidth / 2 + 0.02, 0, cushionDepth / 2 - 0.02),
                    new Vector3(cushionWidth / 2 - 0.02, 0, cushionDepth / 2 - 0.02),
                    new Vector3(cushionWidth / 2 - 0.02, 0, -cushionDepth / 2 + 0.02)
                ],
                color: this.cushionColor
            });
            cushion.outline = true;
            const xPos = -hw + armWidth + cushionWidth / 2 + i * cushionWidth;
            cushion.position.set(xPos, 0.002, hd - cushionDepth / 2 - 0.02);
            this.subElements.set(`cushion${i}`, cushion);
            this.add(cushion);
        }
    }

    setOPMaterial(): void { }
}
