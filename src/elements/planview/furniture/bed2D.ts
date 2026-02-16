import * as THREE from "three";
import { IShape } from "../../../shapes/base-type";
import { ElementType } from "../../base-type";
import { Polygon, Polyline, Vector3 } from "../../../kernel";

export interface BedOptions {
    ogid?: string;
    labelName: string;
    type: ElementType.FURNITURE;
    position: { x: number; y: number; z: number };
    dimensions: { width: number; depth: number };
    bedColor: number;
    pillowColor: number;
}

export class Bed2D extends Polyline implements IShape {
    ogType: string = ElementType.FURNITURE;
    subElements: Map<string, THREE.Object3D> = new Map();
    selected: boolean = false;
    edit: boolean = false;
    locked: boolean = false;

    propertySet: BedOptions = {
        labelName: "Bed",
        type: ElementType.FURNITURE,
        position: { x: 0, y: 0, z: 0 },
        dimensions: { width: 1.6, depth: 2.0 },
        bedColor: 0xffffff,
        pillowColor: 0xcccccc
    };

    get labelName() { return this.propertySet.labelName; }
    set labelName(value: string) { this.propertySet.labelName = value; }

    get dimensions() { return this.propertySet.dimensions; }
    set dimensions(value: { width: number; depth: number }) {
        this.propertySet.dimensions = value;
        this.setOPGeometry();
    }

    get bedColor() { return this.propertySet.bedColor; }
    set bedColor(value: number) {
        this.propertySet.bedColor = value;
        const frame = this.subElements.get("frame") as Polygon;
        if (frame) frame.color = value;
    }

    get pillowColor() { return this.propertySet.pillowColor; }
    set pillowColor(value: number) {
        this.propertySet.pillowColor = value;
        const pillow1 = this.subElements.get("pillow1") as Polygon;
        const pillow2 = this.subElements.get("pillow2") as Polygon;
        if (pillow1) pillow1.color = value;
        if (pillow2) pillow2.color = value;
    }

    constructor(config?: Partial<BedOptions>) {
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

        // Bed frame
        const framePoly = new Polygon({
            vertices: [
                new Vector3(-hw, 0, -hd),
                new Vector3(-hw, 0, hd),
                new Vector3(hw, 0, hd),
                new Vector3(hw, 0, -hd)
            ],
            color: this.bedColor
        });
        framePoly.outline = true;
        this.subElements.set("frame", framePoly);
        this.add(framePoly);

        // Pillows at head of bed
        const pillowWidth = dimensions.width * 0.4;
        const pillowDepth = dimensions.depth * 0.12;
        const pillowY = -hd + pillowDepth / 2 + 0.1;

        // Left pillow
        const pillow1 = new Polygon({
            vertices: this.createRoundedRectVertices(pillowWidth, pillowDepth, 0.03, 4),
            color: this.pillowColor
        });
        pillow1.outline = true;
        pillow1.position.set(-hw / 2, 0.001, pillowY);
        this.subElements.set("pillow1", pillow1);
        this.add(pillow1);

        // Right pillow
        const pillow2 = new Polygon({
            vertices: this.createRoundedRectVertices(pillowWidth, pillowDepth, 0.03, 4),
            color: this.pillowColor
        });
        pillow2.outline = true;
        pillow2.position.set(hw / 2, 0.001, pillowY);
        this.subElements.set("pillow2", pillow2);
        this.add(pillow2);

        // Headboard line
        const headboard = new Polygon({
            vertices: [
                new Vector3(-hw, 0, -0.02),
                new Vector3(-hw, 0, 0.02),
                new Vector3(hw, 0, 0.02),
                new Vector3(hw, 0, -0.02)
            ],
            color: 0x8b7355
        });
        headboard.position.set(0, 0.001, -hd);
        this.subElements.set("headboard", headboard);
        this.add(headboard);
    }

    private createRoundedRectVertices(width: number, depth: number, radius: number, cornerSegments: number): Vector3[] {
        const vertices: Vector3[] = [];
        const hw = width / 2 - radius;
        const hd = depth / 2 - radius;

        for (let i = 0; i <= cornerSegments; i++) {
            const angle = (i / cornerSegments) * (Math.PI / 2);
            vertices.push(new Vector3(hw + Math.cos(angle) * radius, 0, -hd - Math.sin(angle) * radius));
        }
        for (let i = 0; i <= cornerSegments; i++) {
            const angle = (Math.PI / 2) + (i / cornerSegments) * (Math.PI / 2);
            vertices.push(new Vector3(-hw + Math.cos(angle) * radius, 0, -hd - Math.sin(angle) * radius));
        }
        for (let i = 0; i <= cornerSegments; i++) {
            const angle = Math.PI + (i / cornerSegments) * (Math.PI / 2);
            vertices.push(new Vector3(-hw + Math.cos(angle) * radius, 0, hd - Math.sin(angle) * radius));
        }
        for (let i = 0; i <= cornerSegments; i++) {
            const angle = (3 * Math.PI / 2) + (i / cornerSegments) * (Math.PI / 2);
            vertices.push(new Vector3(hw + Math.cos(angle) * radius, 0, hd - Math.sin(angle) * radius));
        }
        return vertices;
    }

    setOPMaterial(): void { }
}
