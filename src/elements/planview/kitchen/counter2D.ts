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
        counterColor: 0xd4c4b0
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
        const surface = this.subElements.get("surface") as Polygon;
        if (surface) surface.color = value;
    }

    constructor(config?: Partial<CounterOptions>) {
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

        // Counter surface
        const surfacePoly = new Polygon({
            vertices: [
                new Vector3(-hw, 0, -hd),
                new Vector3(-hw, 0, hd),
                new Vector3(hw, 0, hd),
                new Vector3(hw, 0, -hd)
            ],
            color: this.counterColor
        });
        surfacePoly.outline = true;
        this.subElements.set("surface", surfacePoly);
        this.add(surfacePoly);

        // Edge detail line
        const edgeLine = new Polygon({
            vertices: [
                new Vector3(-hw + 0.03, 0, hd - 0.03),
                new Vector3(-hw + 0.03, 0, hd - 0.05),
                new Vector3(hw - 0.03, 0, hd - 0.05),
                new Vector3(hw - 0.03, 0, hd - 0.03)
            ],
            color: 0xb0a090
        });
        edgeLine.position.set(0, 0.001, 0);
        this.subElements.set("edge", edgeLine);
        this.add(edgeLine);
    }

    setOPMaterial(): void { }
}
