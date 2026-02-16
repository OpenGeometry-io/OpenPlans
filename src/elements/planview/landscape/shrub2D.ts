import * as THREE from "three";
import { IShape } from "../../../shapes/base-type";
import { ElementType } from "../../base-type";
import { Polygon, Polyline, Vector3 } from "../../../kernel";

export interface ShrubOptions {
    ogid?: string;
    labelName: string;
    type: ElementType.LANDSCAPE;
    position: { x: number; y: number; z: number };
    dimensions: { width: number; depth: number };
    shrubColor: number;
}

export class Shrub2D extends Polyline implements IShape {
    ogType: string = ElementType.LANDSCAPE;
    subElements: Map<string, THREE.Object3D> = new Map();
    selected: boolean = false;
    edit: boolean = false;
    locked: boolean = false;

    propertySet: ShrubOptions = {
        labelName: "Shrub",
        type: ElementType.LANDSCAPE,
        position: { x: 0, y: 0, z: 0 },
        dimensions: { width: 0.8, depth: 0.6 },
        shrubColor: 0x2e8b57
    };

    get labelName() { return this.propertySet.labelName; }
    set labelName(value: string) { this.propertySet.labelName = value; }

    get dimensions() { return this.propertySet.dimensions; }
    set dimensions(value: { width: number; depth: number }) {
        this.propertySet.dimensions = value;
        this.setOPGeometry();
    }

    get shrubColor() { return this.propertySet.shrubColor; }
    set shrubColor(value: number) {
        this.propertySet.shrubColor = value;
        const body = this.subElements.get("body") as Polygon;
        if (body) body.color = value;
    }

    constructor(config?: Partial<ShrubOptions>) {
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

        // Organic blob shape (oval with bumps)
        const bodyPoly = new Polygon({
            vertices: this.createBlobVertices(dimensions.width / 2, dimensions.depth / 2, 24),
            color: this.shrubColor
        });
        bodyPoly.outline = true;
        this.subElements.set("body", bodyPoly);
        this.add(bodyPoly);

        // Inner texture circles
        const innerRadius = Math.min(dimensions.width, dimensions.depth) * 0.15;
        const positions = [
            { x: 0, z: 0 },
            { x: dimensions.width * 0.2, z: dimensions.depth * 0.1 },
            { x: -dimensions.width * 0.15, z: -dimensions.depth * 0.1 }
        ];

        positions.forEach((pos, i) => {
            const inner = new Polygon({
                vertices: this.createCircleVertices(innerRadius, 8),
                color: 0x1f6b3f
            });
            inner.position.set(pos.x, 0.001, pos.z);
            this.subElements.set(`inner${i}`, inner);
            this.add(inner);
        });
    }

    private createBlobVertices(radiusX: number, radiusZ: number, segments: number): Vector3[] {
        const vertices: Vector3[] = [];
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const wobble = 1 + Math.sin(angle * 5) * 0.1;
            vertices.push(new Vector3(
                Math.cos(angle) * radiusX * wobble,
                0,
                Math.sin(angle) * radiusZ * wobble
            ));
        }
        return vertices;
    }

    private createCircleVertices(radius: number, segments: number): Vector3[] {
        const vertices: Vector3[] = [];
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            vertices.push(new Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
        }
        return vertices;
    }

    setOPMaterial(): void { }
}
