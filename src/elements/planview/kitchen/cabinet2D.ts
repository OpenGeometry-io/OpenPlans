import * as THREE from "three";
import { IShape } from "../../../shapes/base-type";
import { ElementType } from "../../base-type";
import { Polygon, Polyline, Vector3 } from "../../../kernel";

export interface CabinetOptions {
    ogid?: string;
    labelName: string;
    type: ElementType.FIXTURE;
    position: { x: number; y: number; z: number };
    dimensions: { width: number; depth: number };
    cabinetColor: number;
    doorColor: number;
    doorSlots: number;
}

export class Cabinet2D extends Polyline implements IShape {
    ogType: string = ElementType.FIXTURE;
    subElements: Map<string, THREE.Object3D> = new Map();
    selected: boolean = false;
    edit: boolean = false;
    locked: boolean = false;

    propertySet: CabinetOptions = {
        labelName: "Cabinet",
        type: ElementType.FIXTURE,
        position: { x: 0, y: 0, z: 0 },
        dimensions: { width: 1, depth: 1 },
        cabinetColor: 0xffffff,
        doorColor: 0xc7c7c7,
        doorSlots: 2
    };

    get labelName() { return this.propertySet.labelName; }
    set labelName(value: string) { this.propertySet.labelName = value; }

    get dimensions() { return this.propertySet.dimensions; }
    set dimensions(value: { width: number; depth: number }) {
        this.propertySet.dimensions = value;
        this.setOPGeometry();
    }

    get cabinetColor() { return this.propertySet.cabinetColor; }
    set cabinetColor(value: number) {
        this.propertySet.cabinetColor = value;
        this.setOPGeometry();
    }

    get doorColor() { return this.propertySet.doorColor; }
    set doorColor(value: number) {
        this.propertySet.doorColor = value;
        this.setOPGeometry();
    }

    get doorSlots() { return this.propertySet.doorSlots; }
    set doorSlots(value: number) {
        this.propertySet.doorSlots = Math.max(1, Math.min(6, value));
        this.setOPGeometry();
    }

    constructor(config?: Partial<CabinetOptions>) {
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

        const { dimensions, doorSlots } = this.propertySet;
        const w = dimensions.width;
        const d = dimensions.depth;
        const hw = w / 2;
        const hd = d / 2;

        // Panel thickness (side panels and door strip)
        const panelThickness = 0.04;

        // Main body (cabinet interior) - white by default
        const bodyPoly = new Polygon({
            vertices: [
                new Vector3(-hw + panelThickness, 0, -hd),
                new Vector3(-hw + panelThickness, 0, hd - panelThickness),
                new Vector3(hw - panelThickness, 0, hd - panelThickness),
                new Vector3(hw - panelThickness, 0, -hd)
            ],
            color: this.cabinetColor
        });
        bodyPoly.outline = true;
        this.subElements.set("body", bodyPoly);
        this.add(bodyPoly);

        // Left side panel - fixed grey color
        const sidePanelColor = 0xc7c7c7;
        const leftPanelPoly = new Polygon({
            vertices: [
                new Vector3(-hw, 0, -hd),
                new Vector3(-hw, 0, hd),
                new Vector3(-hw + panelThickness, 0, hd),
                new Vector3(-hw + panelThickness, 0, -hd)
            ],
            color: sidePanelColor
        });
        leftPanelPoly.outline = true;
        leftPanelPoly.position.set(0, 0.001, 0);
        this.subElements.set("leftPanel", leftPanelPoly);
        this.add(leftPanelPoly);

        // Right side panel - fixed grey color
        const rightPanelPoly = new Polygon({
            vertices: [
                new Vector3(hw - panelThickness, 0, -hd),
                new Vector3(hw - panelThickness, 0, hd),
                new Vector3(hw, 0, hd),
                new Vector3(hw, 0, -hd)
            ],
            color: sidePanelColor
        });
        rightPanelPoly.outline = true;
        rightPanelPoly.position.set(0, 0.001, 0);
        this.subElements.set("rightPanel", rightPanelPoly);
        this.add(rightPanelPoly);

        // Door strip at front (+Z, top in screen)
        const doorStripPoly = new Polygon({
            vertices: [
                new Vector3(-hw + panelThickness, 0, hd - panelThickness),
                new Vector3(-hw + panelThickness, 0, hd),
                new Vector3(hw - panelThickness, 0, hd),
                new Vector3(hw - panelThickness, 0, hd - panelThickness)
            ],
            color: this.doorColor
        });
        doorStripPoly.outline = true;
        doorStripPoly.position.set(0, 0.001, 0);
        this.subElements.set("doorStrip", doorStripPoly);
        this.add(doorStripPoly);

        // Door slot dividers (vertical lines in the door strip)
        const innerWidth = w - 2 * panelThickness;
        const slotWidth = innerWidth / doorSlots;

        for (let i = 1; i < doorSlots; i++) {
            const xPos = -hw + panelThickness + i * slotWidth;
            const dividerLine = new Polyline({
                points: [
                    new Vector3(xPos, 0.002, hd - panelThickness),
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
