import * as THREE from "three";
import { IShape } from "../../../shapes/base-type";
import { ElementType } from "../../base-type";
import { Polygon, Polyline, Vector3 } from "../../../kernel";

export interface SinkOptions {
    ogid?: string;
    labelName: string;
    type: ElementType.FIXTURE;
    position: { x: number; y: number; z: number };
    dimensions: { width: number; depth: number };
    basinColor: number;
    counterColor: number;
    outlineColor: number;
}

export class Sink2D extends Polyline implements IShape {
    ogType: string = ElementType.FIXTURE;
    subElements: Map<string, THREE.Object3D> = new Map();
    selected: boolean = false;
    edit: boolean = false;
    locked: boolean = false;

    propertySet: SinkOptions = {
        labelName: "Sink",
        type: ElementType.FIXTURE,
        position: { x: 0, y: 0, z: 0 },
        dimensions: { width: 1.2, depth: 0.8 },
        basinColor: 0xffffff,
        counterColor: 0xe0e0e0,
        outlineColor: 0x000000
    };

    get labelName() { return this.propertySet.labelName; }
    set labelName(value: string) { this.propertySet.labelName = value; }

    get dimensions() { return this.propertySet.dimensions; }
    set dimensions(value: { width: number; depth: number }) {
        this.propertySet.dimensions = value;
        this.setOPGeometry();
    }

    get basinColor() { return this.propertySet.basinColor; }
    set basinColor(value: number) {
        this.propertySet.basinColor = value;
        const basin = this.subElements.get("basin") as Polygon;
        if (basin) basin.color = value;
    }

    get counterColor() { return this.propertySet.counterColor; }
    set counterColor(value: number) {
        this.propertySet.counterColor = value;
        const counter = this.subElements.get("counter") as Polygon;
        if (counter) counter.color = value;
    }

    constructor(config?: Partial<SinkOptions>) {
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

        // Counter (outer rectangle)
        const counterPoly = new Polygon({
            vertices: [
                new Vector3(-w / 2, 0, -d / 2),
                new Vector3(-w / 2, 0, d / 2),
                new Vector3(w / 2, 0, d / 2),
                new Vector3(w / 2, 0, -d / 2)
            ],
            color: this.counterColor
        });
        counterPoly.outline = true;
        this.subElements.set("counter", counterPoly);
        this.add(counterPoly);

        // Basin (inner rounded rectangle)
        const basinMargin = 0.04;
        const basinW = w - basinMargin * 2;
        const basinD = d * 0.65;
        const cornerRadius = 0.03;
        const basinPoly = new Polygon({
            vertices: this.createRoundedRectVertices(basinW, basinD, cornerRadius, 4),
            color: this.basinColor
        });
        basinPoly.outline = true;
        basinPoly.position.set(0, 0.001, d * 0.1);
        this.subElements.set("basin", basinPoly);
        this.add(basinPoly);

        // Drain (center circle with crosshair)
        this.addDrainSymbol(0, d * 0.1, 0.025);

        // Left faucet symbol
        this.addFaucetSymbol(-w * 0.25, -d * 0.35, 0.015);

        // Right faucet symbol
        this.addFaucetSymbol(w * 0.25, -d * 0.35, 0.015);
    }

    private createRoundedRectVertices(width: number, depth: number, radius: number, cornerSegments: number): Vector3[] {
        const vertices: Vector3[] = [];
        const hw = width / 2;
        const hd = depth / 2;
        const r = Math.min(radius, hw, hd);

        // Helper to add corner arc
        const addCorner = (cx: number, cz: number, startAngle: number) => {
            for (let i = 0; i <= cornerSegments; i++) {
                const angle = startAngle + (i / cornerSegments) * (Math.PI / 2);
                vertices.push(new Vector3(
                    cx + Math.cos(angle) * r,
                    0,
                    cz + Math.sin(angle) * r
                ));
            }
        };

        // Top-left corner
        addCorner(-hw + r, -hd + r, Math.PI);
        // Top-right corner
        addCorner(hw - r, -hd + r, -Math.PI / 2);
        // Bottom-right corner
        addCorner(hw - r, hd - r, 0);
        // Bottom-left corner
        addCorner(-hw + r, hd - r, Math.PI / 2);

        return vertices;
    }

    private addDrainSymbol(x: number, z: number, radius: number): void {
        // Outer circle
        const outerCircle = new Polygon({
            vertices: this.createCircleVertices(radius, 12),
            color: 0x000000
        });
        outerCircle.outline = true;
        outerCircle.position.set(x, 0.002, z);
        this.subElements.set("drain_outer", outerCircle);
        this.add(outerCircle);

        // Inner circle
        // const innerCircle = new Polygon({
        //     vertices: this.createCircleVertices(radius * 0.5, 8),
        //     color: 0x333333
        // });
        // innerCircle.position.set(x, 0.003, z);
        // this.subElements.set("drain_inner", innerCircle);
        // this.add(innerCircle);
    }

    private addFaucetSymbol(x: number, z: number, radius: number): void {
        // Outer circle
        const outerCircle = new Polygon({
            vertices: this.createCircleVertices(radius, 10),
            color: 0xffffff
        });
        outerCircle.outline = true;
        outerCircle.position.set(x, 0.002, z);
        this.subElements.set(`faucet_${x}_outer`, outerCircle);
        this.add(outerCircle);

        // // Inner dot
        // const innerDot = new Polygon({
        //     vertices: this.createCircleVertices(radius * 0.3, 6),
        //     color: 0x000000
        // });
        // innerDot.position.set(x, 0.003, z);
        // this.subElements.set(`faucet_${x}_inner`, innerDot);
        // this.add(innerDot);
    }

    private createCircleVertices(radius: number, segments: number): Vector3[] {
        const vertices: Vector3[] = [];
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            vertices.push(new Vector3(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
            ));
        }
        return vertices;
    }

    setOPMaterial(): void { }
}
