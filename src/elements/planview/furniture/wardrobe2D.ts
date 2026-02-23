import * as THREE from "three";
import { IShape } from "../../../shapes/base-type";
import { ElementType } from "../../base-type";
import { Polygon, Polyline, Vector3 } from "../../../kernel";

export interface WardrobeOptions {
    ogid?: string;
    labelName: string;
    type: ElementType.FURNITURE;
    position: { x: number; y: number; z: number };
    dimensions: { width: number; depth: number };
    wardrobeColor: number;
    doorSlots: number;
}

export class Wardrobe2D extends Polyline implements IShape {
    ogType: string = ElementType.FURNITURE;
    subElements: Map<string, THREE.Object3D> = new Map();
    selected: boolean = false;
    edit: boolean = false;
    locked: boolean = false;

    propertySet: WardrobeOptions = {
        labelName: "Wardrobe",
        type: ElementType.FURNITURE,
        position: { x: 0, y: 0, z: 0 },
        dimensions: { width: 1.8, depth: 0.6 },
        wardrobeColor: 0xffffff,
        doorSlots: 2
    };

    get labelName() { return this.propertySet.labelName; }
    set labelName(value: string) { this.propertySet.labelName = value; }

    get dimensions() { return this.propertySet.dimensions; }
    set dimensions(value: { width: number; depth: number }) {
        this.propertySet.dimensions = value;
        this.setOPGeometry();
    }

    get wardrobeColor() { return this.propertySet.wardrobeColor; }
    set wardrobeColor(value: number) {
        this.propertySet.wardrobeColor = value;
        this.setOPGeometry();
    }

    get doorSlots() { return this.propertySet.doorSlots; }
    set doorSlots(value: number) {
        this.propertySet.doorSlots = Math.max(1, Math.min(6, value));
        this.setOPGeometry();
    }

    constructor(config?: Partial<WardrobeOptions>) {
        super({ ogid: config?.ogid, points: [], color: 0 });
        this.subElements = new Map<string, THREE.Object3D>();
        if (config) this.propertySet = { ...this.propertySet, ...config };
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
        this.subElements.forEach((el) => {
            el.removeFromParent();
            if (el instanceof Polygon) el.dispose();
        });
        this.subElements.clear();

        const { dimensions, doorSlots } = this.propertySet;
        const w = dimensions.width;
        const d = dimensions.depth;
        const hw = w / 2;
        const hd = d / 2;

        // Door strip thickness (at front)
        const doorStripDepth = 0.08;

        // Main body (cabinet interior)
        const bodyPoly = new Polygon({
            vertices: [
                new Vector3(-hw, 0, -hd),
                new Vector3(-hw, 0, hd - doorStripDepth),
                new Vector3(hw, 0, hd - doorStripDepth),
                new Vector3(hw, 0, -hd)
            ],
            color: this.wardrobeColor
        });
        bodyPoly.outline = true;
        this.subElements.set("body", bodyPoly);
        this.add(bodyPoly);

        // Door strip at front (thin strip divided into slots)
        const doorStripPoly = new Polygon({
            vertices: [
                new Vector3(-hw, 0, hd - doorStripDepth),
                new Vector3(-hw, 0, hd),
                new Vector3(hw, 0, hd),
                new Vector3(hw, 0, hd - doorStripDepth)
            ],
            color: this.wardrobeColor
        });
        doorStripPoly.outline = true;
        doorStripPoly.position.set(0, 0.001, 0);
        this.subElements.set("doorStrip", doorStripPoly);
        this.add(doorStripPoly);

        // Door slot dividers (vertical lines in the door strip)
        const slotWidth = w / doorSlots;

        for (let i = 1; i < doorSlots; i++) {
            const xPos = -hw + i * slotWidth;
            const dividerLine = new Polyline({
                points: [
                    new Vector3(xPos, 0.002, hd - doorStripDepth),
                    new Vector3(xPos, 0.002, hd)
                ],
                color: 0x000000
            });
            this.subElements.set(`divider${i}`, dividerLine);
            this.add(dividerLine);
        }
    }

    setOPMaterial(): void { }
}
