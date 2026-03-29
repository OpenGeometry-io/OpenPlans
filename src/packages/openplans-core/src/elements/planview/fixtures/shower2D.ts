import * as THREE from "three";
import { IShape } from "../../../shapes/base-type";
import { ElementType } from "../../base-type";
import { Polygon, Polyline, Vector3 } from "opengeometry";

export interface ShowerOptions {
    ogid?: string;
    labelName: string;
    type: ElementType.FIXTURE;
    position: { x: number; y: number; z: number };
    dimensions: { width: number; depth: number };
    floorColor: number;
    outlineColor: number;
}

export class Shower2D extends Polyline implements IShape {
    ogType: string = ElementType.FIXTURE;
    subElements: Map<string, THREE.Object3D> = new Map();
    selected: boolean = false;
    edit: boolean = false;
    locked: boolean = false;

    propertySet: ShowerOptions = {
        labelName: "Shower",
        type: ElementType.FIXTURE,
        position: { x: 0, y: 0, z: 0 },
        dimensions: { width: 1, depth: 1 },
        floorColor: 0xffffff,
        outlineColor: 0x000000
    };

    get labelName() { return this.propertySet.labelName; }
    set labelName(value: string) { this.propertySet.labelName = value; }

    get dimensions() { return this.propertySet.dimensions; }
    set dimensions(value: { width: number; depth: number }) {
        this.propertySet.dimensions = value;
        this.setOPGeometry();
    }

    get floorColor() { return this.propertySet.floorColor; }
    set floorColor(value: number) {
        this.propertySet.floorColor = value;
        const floor = this.subElements.get("floor") as Polygon;
        if (floor) floor.color = value;
    }

    constructor(config?: Partial<ShowerOptions>) {
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
        const hw = dimensions.width / 2;
        const hd = dimensions.depth / 2;

        // Shower floor (square/rectangle)
        const floorPoly = new Polygon({
            vertices: [
                new Vector3(-hw, 0, -hd),
                new Vector3(-hw, 0, hd),
                new Vector3(hw, 0, hd),
                new Vector3(hw, 0, -hd)
            ],
            color: this.floorColor
        });
        floorPoly.outline = true;
        this.subElements.set("floor", floorPoly);
        this.add(floorPoly);

        // Shower head symbol (circle in corner)
        const headPoly = new Polygon({
            vertices: this.createOvalVertices(0.12, 0.12, 12),
            color: 0xcccccc
        });
        headPoly.outline = true;
        headPoly.position.set(-hw + 0.15, 0.001, -hd + 0.15);
        this.subElements.set("head", headPoly);
        this.add(headPoly);

        // Drain (center circle)
        const drainPoly = new Polygon({
            vertices: this.createOvalVertices(0.08, 0.08, 8),
            color: 0x666666
        });
        drainPoly.position.set(0, 0.001, 0);
        this.subElements.set("drain", drainPoly);
        this.add(drainPoly);

        // // X pattern on drain
        // const lineWidth = 0.005;
        // const lineLen = 0.06;
        // const line1 = new Polygon({
        //     vertices: [
        //         new Vector3(-lineLen / 2, 0, -lineWidth / 2),
        //         new Vector3(-lineLen / 2, 0, lineWidth / 2),
        //         new Vector3(lineLen / 2, 0, lineWidth / 2),
        //         new Vector3(lineLen / 2, 0, -lineWidth / 2)
        //     ],
        //     color: 0x444444
        // });
        // line1.rotation.y = Math.PI / 4;
        // line1.position.set(0, 0.002, 0);
        // this.subElements.set("line1", line1);
        // this.add(line1);

        // const line2 = new Polygon({
        //     vertices: [
        //         new Vector3(-lineLen / 2, 0, -lineWidth / 2),
        //         new Vector3(-lineLen / 2, 0, lineWidth / 2),
        //         new Vector3(lineLen / 2, 0, lineWidth / 2),
        //         new Vector3(lineLen / 2, 0, -lineWidth / 2)
        //     ],
        //     color: 0x444444
        // });
        // line2.rotation.y = -Math.PI / 4;
        // line2.position.set(0, 0.002, 0);
        // this.subElements.set("line2", line2);
        // this.add(line2);
    }

    private createOvalVertices(width: number, depth: number, segments: number): Vector3[] {
        const vertices: Vector3[] = [];
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            vertices.push(new Vector3(Math.cos(angle) * width / 2, 0, Math.sin(angle) * depth / 2));
        }
        return vertices;
    }

    setOPMaterial(): void { }
}
