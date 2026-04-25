import * as THREE from "three";
import { IShape } from "../../../shapes/base-type";
import { ElementType } from "../../base-type";
import { Polygon, Polyline, Vector3 } from "opengeometry";

export interface ChairOptions {
    ogid?: string;
    labelName: string;
    type: ElementType.FURNITURE;
    position: { x: number; y: number; z: number };
    dimensions: { width: number; depth: number };
    chairColor: number;
    legSize: number;
}

export class Chair2D extends Polyline implements IShape {
    ogType: string = ElementType.FURNITURE;
    subElements: Map<string, THREE.Object3D> = new Map();
    selected: boolean = false;
    edit: boolean = false;
    locked: boolean = false;

    propertySet: ChairOptions = {
        labelName: "Chair",
        type: ElementType.FURNITURE,
        position: { x: 0, y: 0, z: 0 },
        dimensions: { width: 0.5, depth: 0.5 },
        chairColor: 0xffffff,
        legSize: 0.04
    };

    get labelName() { return this.propertySet.labelName; }
    set labelName(value: string) { this.propertySet.labelName = value; }

    get dimensions() { return this.propertySet.dimensions; }
    set dimensions(value: { width: number; depth: number }) {
        this.propertySet.dimensions = value;
        this.setOPGeometry();
    }

    get chairColor() { return this.propertySet.chairColor; }
    set chairColor(value: number) {
        this.propertySet.chairColor = value;
        this.setOPGeometry();
    }

    get legSize() { return this.propertySet.legSize; }
    set legSize(value: number) {
        this.propertySet.legSize = Math.max(0.02, value);
        this.setOPGeometry();
    }

    constructor(config?: Partial<ChairOptions>) {
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

        const { dimensions, legSize } = this.propertySet;
        const w = dimensions.width;
        const d = dimensions.depth;
        const hw = w / 2;
        const hd = d / 2;

        // Leg inset (fixed)
        const legInset = 0.06;

        // Fixed backrest dimensions
        const backrestHeight = 0.125;
        const backrestInset = 0.0;

        // Chair seat (square)
        const seatPoly = new Polygon({
            vertices: [
                new Vector3(-hw, 0, -hd),
                new Vector3(-hw, 0, hd),
                new Vector3(hw, 0, hd),
                new Vector3(hw, 0, -hd)
            ],
            color: this.chairColor
        });
        seatPoly.outline = true;
        this.subElements.set("seat", seatPoly);
        this.add(seatPoly);

        // Chair backrest (rectangular, at top)
        const backrestPoly = new Polygon({
            vertices: [
                new Vector3(-hw + backrestInset, 0, -hd),
                new Vector3(-hw + backrestInset, 0, -hd + backrestHeight),
                new Vector3(hw - backrestInset, 0, -hd + backrestHeight),
                new Vector3(hw - backrestInset, 0, -hd)
            ],
            color: 0xcccccc
        });
        backrestPoly.outline = true;
        backrestPoly.position.set(0, 0.001, 0);
        this.subElements.set("backrest", backrestPoly);
        this.add(backrestPoly);

        // 4 square legs at corners
        const legPositions = [
            { x: -hw + legInset, z: -hd + legInset },
            { x: hw - legInset, z: -hd + legInset },
            { x: -hw + legInset, z: hd - legInset },
            { x: hw - legInset, z: hd - legInset }
        ];

        legPositions.forEach((pos, i) => {
            const leg = new Polygon({
                vertices: [
                    new Vector3(-legSize / 2, 0, -legSize / 2),
                    new Vector3(-legSize / 2, 0, legSize / 2),
                    new Vector3(legSize / 2, 0, legSize / 2),
                    new Vector3(legSize / 2, 0, -legSize / 2)
                ],
                color: this.chairColor
            });
            leg.outline = true;
            leg.position.set(pos.x, 0.002, pos.z);
            this.subElements.set(`leg${i}`, leg);
            this.add(leg);
        });
    }

    setOPMaterial(): void { }
}

