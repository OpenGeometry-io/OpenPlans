import * as THREE from "three";
import { IShape } from "../../../shapes/base-type";
import { ElementType } from "../../base-type";
import { Polygon, Polyline, Vector3 } from "../../../kernel";

export interface RefrigeratorOptions {
    ogid?: string;
    labelName: string;
    type: ElementType.APPLIANCE;
    position: { x: number; y: number; z: number };
    dimensions: { width: number; depth: number };
    bodyColor: number;
}

export class Refrigerator2D extends Polyline implements IShape {
    ogType: string = ElementType.APPLIANCE;
    subElements: Map<string, THREE.Object3D> = new Map();
    selected: boolean = false;
    edit: boolean = false;
    locked: boolean = false;

    propertySet: RefrigeratorOptions = {
        labelName: "Refrigerator",
        type: ElementType.APPLIANCE,
        position: { x: 0, y: 0, z: 0 },
        dimensions: { width: 1, depth: 1 },
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

    constructor(config?: Partial<RefrigeratorOptions>) {
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
            color: 0xcccccc
        });
        frontStripPoly.outline = true;
        frontStripPoly.position.set(0, 0.001, 0);
        this.subElements.set("frontStrip", frontStripPoly);
        this.add(frontStripPoly);

        // Handle (small rectangle on front side, extending outward)
        const handleWidth = 0.05;
        const handleDepth = 0.05;
        const handle = new Polygon({
            vertices: [
                new Vector3(-handleWidth / 2, 0, -handleDepth / 2),
                new Vector3(-handleWidth / 2, 0, handleDepth / 2),
                new Vector3(handleWidth / 2, 0, handleDepth / 2),
                new Vector3(handleWidth / 2, 0, -handleDepth / 2)
            ],
            color: 0x888888
        });
        handle.outline = true;
        handle.position.set(-hw + 0.08, 0.002, hd + handleDepth / 2);
        this.subElements.set("handle", handle);
        this.add(handle);
    }

    setOPMaterial(): void { }
}
