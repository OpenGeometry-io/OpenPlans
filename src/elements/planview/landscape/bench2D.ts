import * as THREE from "three";
import { IShape } from "../../../shapes/base-type";
import { ElementType } from "../../base-type";
import { Polygon, Polyline, Vector3 } from "../../../kernel";

export interface BenchOptions {
    ogid?: string;
    labelName: string;
    type: ElementType.LANDSCAPE;
    position: { x: number; y: number; z: number };
    dimensions: { width: number; depth: number };
    benchColor: number;
}

export class Bench2D extends Polyline implements IShape {
    ogType: string = ElementType.LANDSCAPE;
    subElements: Map<string, THREE.Object3D> = new Map();
    selected: boolean = false;
    edit: boolean = false;
    locked: boolean = false;

    propertySet: BenchOptions = {
        labelName: "Bench",
        type: ElementType.LANDSCAPE,
        position: { x: 0, y: 0, z: 0 },
        dimensions: { width: 1.5, depth: 0.45 },
        benchColor: 0x8b4513
    };

    get labelName() { return this.propertySet.labelName; }
    set labelName(value: string) { this.propertySet.labelName = value; }

    get dimensions() { return this.propertySet.dimensions; }
    set dimensions(value: { width: number; depth: number }) {
        this.propertySet.dimensions = value;
        this.setOPGeometry();
    }

    get benchColor() { return this.propertySet.benchColor; }
    set benchColor(value: number) {
        this.propertySet.benchColor = value;
        const seat = this.subElements.get("seat") as Polygon;
        if (seat) seat.color = value;
    }

    constructor(config?: Partial<BenchOptions>) {
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

        // Seat
        const seatPoly = new Polygon({
            vertices: [
                new Vector3(-hw, 0, -hd),
                new Vector3(-hw, 0, hd),
                new Vector3(hw, 0, hd),
                new Vector3(hw, 0, -hd)
            ],
            color: this.benchColor
        });
        seatPoly.outline = true;
        this.subElements.set("seat", seatPoly);
        this.add(seatPoly);

        // Backrest
        const backrestPoly = new Polygon({
            vertices: [
                new Vector3(-hw + 0.03, 0, -hd),
                new Vector3(-hw + 0.03, 0, -hd + 0.08),
                new Vector3(hw - 0.03, 0, -hd + 0.08),
                new Vector3(hw - 0.03, 0, -hd)
            ],
            color: 0x6b3310
        });
        backrestPoly.position.set(0, 0.001, 0);
        this.subElements.set("backrest", backrestPoly);
        this.add(backrestPoly);

        // Legs (4 at corners)
        const legSize = 0.06;
        const legPositions = [
            { x: -hw + 0.1, z: -hd + 0.08 },
            { x: hw - 0.1, z: -hd + 0.08 },
            { x: -hw + 0.1, z: hd - 0.08 },
            { x: hw - 0.1, z: hd - 0.08 }
        ];

        legPositions.forEach((pos, i) => {
            const leg = new Polygon({
                vertices: [
                    new Vector3(-legSize / 2, 0, -legSize / 2),
                    new Vector3(-legSize / 2, 0, legSize / 2),
                    new Vector3(legSize / 2, 0, legSize / 2),
                    new Vector3(legSize / 2, 0, -legSize / 2)
                ],
                color: 0x444444
            });
            leg.position.set(pos.x, 0.002, pos.z);
            this.subElements.set(`leg${i}`, leg);
            this.add(leg);
        });

        // Slat lines on seat
        const slatCount = 5;
        const slatSpacing = dimensions.width / (slatCount + 1);
        for (let i = 1; i <= slatCount; i++) {
            const slat = new Polygon({
                vertices: [
                    new Vector3(-0.01, 0, -hd + 0.1),
                    new Vector3(-0.01, 0, hd - 0.02),
                    new Vector3(0.01, 0, hd - 0.02),
                    new Vector3(0.01, 0, -hd + 0.1)
                ],
                color: 0x7a3a10
            });
            slat.position.set(-hw + i * slatSpacing, 0.001, 0);
            this.subElements.set(`slat${i}`, slat);
            this.add(slat);
        }
    }

    setOPMaterial(): void { }
}
