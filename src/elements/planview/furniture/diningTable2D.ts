import * as THREE from "three";
import { IShape } from "../../../shapes/base-type";
import { ElementType } from "../../base-type";
import { Polygon, Polyline, Vector3 } from "../../../kernel";
import { Chair2D } from "./chair2D";

export interface DiningTableOptions {
    ogid?: string;
    labelName: string;
    type: ElementType.FURNITURE;
    position: { x: number; y: number; z: number };
    dimensions: { width: number; depth: number };
    tableColor: number;
    chairColor: number;
    seats: number;
    chairGap: number;
}

export class DiningTable2D extends Polyline implements IShape {
    ogType: string = ElementType.FURNITURE;
    subElements: Map<string, THREE.Object3D> = new Map();
    selected: boolean = false;
    edit: boolean = false;
    locked: boolean = false;

    propertySet: DiningTableOptions = {
        labelName: "Dining Table",
        type: ElementType.FURNITURE,
        position: { x: 0, y: 0, z: 0 },
        dimensions: { width: 1.8, depth: 1.2 },
        tableColor: 0xffffff,
        chairColor: 0xffffff,
        seats: 4,
        chairGap: 0.08
    };

    get labelName() { return this.propertySet.labelName; }
    set labelName(value: string) { this.propertySet.labelName = value; }

    get dimensions() { return this.propertySet.dimensions; }
    set dimensions(value: { width: number; depth: number }) {
        this.propertySet.dimensions = value;
        this.setOPGeometry();
    }

    get tableColor() { return this.propertySet.tableColor; }
    set tableColor(value: number) {
        this.propertySet.tableColor = value;
        this.setOPGeometry();
    }

    get chairColor() { return this.propertySet.chairColor; }
    set chairColor(value: number) {
        this.propertySet.chairColor = value;
        this.setOPGeometry();
    }

    get seats() { return this.propertySet.seats; }
    set seats(value: number) {
        this.propertySet.seats = Math.max(2, Math.min(12, value));
        this.setOPGeometry();
    }

    get chairGap() { return this.propertySet.chairGap; }
    set chairGap(value: number) {
        this.propertySet.chairGap = Math.max(0.02, value);
        this.setOPGeometry();
    }

    constructor(config?: Partial<DiningTableOptions>) {
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

        const { dimensions, seats, chairGap } = this.propertySet;
        const tw = dimensions.width;
        const td = dimensions.depth;

        // Table top (white, outlined)
        const tablePoly = new Polygon({
            vertices: [
                new Vector3(-tw / 2, 0, -td / 2),
                new Vector3(-tw / 2, 0, td / 2),
                new Vector3(tw / 2, 0, td / 2),
                new Vector3(tw / 2, 0, -td / 2)
            ],
            color: this.tableColor
        });
        tablePoly.outline = true;
        this.subElements.set("table", tablePoly);
        this.add(tablePoly);

        // Chair dimensions
        const chairWidth = 0.5;
        const chairDepth = 0.5;
        const tableToChairGap = 0.05;

        // Distribute chairs evenly on each side
        const seatsPerSide = Math.floor(seats / 2);

        // Calculate total chair width needed per side (chairGap is horizontal only)
        const totalChairWidth = seatsPerSide * chairWidth + (seatsPerSide - 1) * chairGap;
        const startX = -totalChairWidth / 2 + chairWidth / 2;

        // Chairs on front side (positive Z - below table)
        for (let i = 0; i < seatsPerSide; i++) {
            const xPos = startX + i * (chairWidth + chairGap);
            const zPos = td / 2 + tableToChairGap + chairDepth / 2;
            const chair = new Chair2D({
                dimensions: { width: chairWidth, depth: chairDepth },
                chairColor: this.chairColor
            });
            chair.position.set(xPos, 0.001, zPos);
            chair.rotation.y = Math.PI; // Face the table
            this.subElements.set(`chairFront${i}`, chair);
            this.add(chair);
        }

        // Chairs on back side (negative Z - above table)
        for (let i = 0; i < seatsPerSide; i++) {
            const xPos = startX + i * (chairWidth + chairGap);
            const zPos = -td / 2 - tableToChairGap - chairDepth / 2;
            const chair = new Chair2D({
                dimensions: { width: chairWidth, depth: chairDepth },
                chairColor: this.chairColor
            });
            chair.position.set(xPos, 0.001, zPos);
            // No rotation needed, already faces table
            this.subElements.set(`chairBack${i}`, chair);
            this.add(chair);
        }
    }

    setOPMaterial(): void { }
}
