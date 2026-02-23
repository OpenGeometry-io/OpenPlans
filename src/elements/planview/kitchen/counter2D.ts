import * as THREE from "three";
import { IShape } from "../../../shapes/base-type";
import { ElementType } from "../../base-type";
import { Polygon, Polyline, Vector3 } from "../../../kernel";

export interface CounterOptions {
    ogid?: string;
    labelName: string;
    type: ElementType.FIXTURE;
    position: { x: number; y: number; z: number };
    dimensions: { width: number; depth: number };
    counterColor: number;
}

export class Counter2D extends Polyline implements IShape {
    ogType: string = ElementType.FIXTURE;
    subElements: Map<string, THREE.Object3D> = new Map();
    selected: boolean = false;
    edit: boolean = false;
    locked: boolean = false;

    propertySet: CounterOptions = {
        labelName: "Counter",
        type: ElementType.FIXTURE,
        position: { x: 0, y: 0, z: 0 },
        dimensions: { width: 1.5, depth: 0.6 },
        counterColor: 0xffffff
    };

    get labelName() { return this.propertySet.labelName; }
    set labelName(value: string) { this.propertySet.labelName = value; }

    get dimensions() { return this.propertySet.dimensions; }
    set dimensions(value: { width: number; depth: number }) {
        this.propertySet.dimensions = value;
        this.setOPGeometry();
    }

    get counterColor() { return this.propertySet.counterColor; }
    set counterColor(value: number) {
        this.propertySet.counterColor = value;
        this.setOPGeometry();
    }

    constructor(config?: Partial<CounterOptions>) {
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

        const { dimensions } = this.propertySet;
        const w = dimensions.width;
        const d = dimensions.depth;
        const hw = w / 2;
        const hd = d / 2;

        // Panel thickness (side panels and front edge)
        const panelThickness = 0.04;
        const secondaryColor = 0xc7c7c7;

        // Main counter surface (white by default)
        const surfacePoly = new Polygon({
            vertices: [
                new Vector3(-hw + panelThickness, 0, -hd + panelThickness),
                new Vector3(-hw + panelThickness, 0, hd),
                new Vector3(hw - panelThickness, 0, hd),
                new Vector3(hw - panelThickness, 0, -hd + panelThickness)
            ],
            color: this.counterColor
        });
        surfacePoly.outline = true;
        this.subElements.set("surface", surfacePoly);
        this.add(surfacePoly);

        // Left side panel - fixed grey color
        const leftPanelPoly = new Polygon({
            vertices: [
                new Vector3(-hw, 0, -hd),
                new Vector3(-hw, 0, hd),
                new Vector3(-hw + panelThickness, 0, hd),
                new Vector3(-hw + panelThickness, 0, -hd)
            ],
            color: secondaryColor
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
            color: secondaryColor
        });
        rightPanelPoly.outline = true;
        rightPanelPoly.position.set(0, 0.001, 0);
        this.subElements.set("rightPanel", rightPanelPoly);
        this.add(rightPanelPoly);

        // Front edge strip at bottom (-Z) - fixed grey color
        const frontEdgePoly = new Polygon({
            vertices: [
                new Vector3(-hw + panelThickness, 0, -hd),
                new Vector3(-hw + panelThickness, 0, -hd + panelThickness),
                new Vector3(hw - panelThickness, 0, -hd + panelThickness),
                new Vector3(hw - panelThickness, 0, -hd)
            ],
            color: secondaryColor
        });
        frontEdgePoly.outline = true;
        frontEdgePoly.position.set(0, 0.001, 0);
        this.subElements.set("frontEdge", frontEdgePoly);
        this.add(frontEdgePoly);
    }

    setOPMaterial(): void { }
}
