import * as THREE from "three";
import { IShape } from "../../../shapes/base-type";
import { ElementType } from "../../base-type";
import { Polygon, Polyline, Vector3 } from "opengeometry";

export interface FountainOptions {
    ogid?: string;
    labelName: string;
    type: ElementType.LANDSCAPE;
    position: { x: number; y: number; z: number };
    radius: number;
    basinColor: number;
    waterColor: number;
}

export class Fountain2D extends Polyline implements IShape {
    ogType: string = ElementType.LANDSCAPE;
    subElements: Map<string, THREE.Object3D> = new Map();
    selected: boolean = false;
    edit: boolean = false;
    locked: boolean = false;

    propertySet: FountainOptions = {
        labelName: "Fountain",
        type: ElementType.LANDSCAPE,
        position: { x: 0, y: 0, z: 0 },
        radius: 1.5,
        basinColor: 0x808080,
        waterColor: 0x4169e1
    };

    get labelName() { return this.propertySet.labelName; }
    set labelName(value: string) { this.propertySet.labelName = value; }

    get radius() { return this.propertySet.radius; }
    set radius(value: number) {
        this.propertySet.radius = value;
        this.setOPGeometry();
    }

    get basinColor() { return this.propertySet.basinColor; }
    set basinColor(value: number) {
        this.propertySet.basinColor = value;
        const basin = this.subElements.get("basin") as Polygon;
        if (basin) basin.color = value;
    }

    get waterColor() { return this.propertySet.waterColor; }
    set waterColor(value: number) {
        this.propertySet.waterColor = value;
        const water = this.subElements.get("water") as Polygon;
        if (water) water.color = value;
    }

    constructor(config?: Partial<FountainOptions>) {
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

        const { radius } = this.propertySet;

        // Outer basin
        const basinPoly = new Polygon({
            vertices: this.createCircleVertices(radius, 32),
            color: this.basinColor
        });
        basinPoly.outline = true;
        this.subElements.set("basin", basinPoly);
        this.add(basinPoly);

        // Water surface
        const waterPoly = new Polygon({
            vertices: this.createCircleVertices(radius * 0.85, 28),
            color: this.waterColor
        });
        waterPoly.outline = true;
        waterPoly.position.set(0, 0.001, 0);
        this.subElements.set("water", waterPoly);
        this.add(waterPoly);

        // Center spout
        const spoutPoly = new Polygon({
            vertices: this.createCircleVertices(radius * 0.15, 12),
            color: 0x606060
        });
        spoutPoly.position.set(0, 0.002, 0);
        this.subElements.set("spout", spoutPoly);
        this.add(spoutPoly);

        // Water ripple rings
        for (let i = 1; i <= 3; i++) {
            const rippleRadius = radius * 0.25 * i;
            const ripple = new Polygon({
                vertices: this.createRingVertices(rippleRadius, rippleRadius + 0.02, 20),
                color: 0x5a7fba
            });
            ripple.position.set(0, 0.003, 0);
            this.subElements.set(`ripple${i}`, ripple);
            this.add(ripple);
        }
    }

    private createCircleVertices(radius: number, segments: number): Vector3[] {
        const vertices: Vector3[] = [];
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            vertices.push(new Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
        }
        return vertices;
    }

    private createRingVertices(innerRadius: number, outerRadius: number, segments: number): Vector3[] {
        const vertices: Vector3[] = [];
        // Outer edge
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            vertices.push(new Vector3(Math.cos(angle) * outerRadius, 0, Math.sin(angle) * outerRadius));
        }
        // Inner edge (reverse)
        for (let i = segments; i >= 0; i--) {
            const angle = (i / segments) * Math.PI * 2;
            vertices.push(new Vector3(Math.cos(angle) * innerRadius, 0, Math.sin(angle) * innerRadius));
        }
        return vertices;
    }

    setOPMaterial(): void { }
}
