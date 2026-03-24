import * as THREE from "three";
import { IShape } from "../../../shapes/base-type";
import { ElementType } from "../../base-type";
import { Polygon, Polyline, Vector3 } from "opengeometry";

export interface BathtubOptions {
    ogid?: string;
    labelName: string;
    type: ElementType.FIXTURE;
    position: { x: number; y: number; z: number };
    dimensions: { width: number; depth: number };
    tubColor: number;
    outlineColor: number;
}

export class Bathtub2D extends Polyline implements IShape {
    ogType: string = ElementType.FIXTURE;
    subElements: Map<string, THREE.Object3D> = new Map();
    selected: boolean = false;
    edit: boolean = false;
    locked: boolean = false;

    propertySet: BathtubOptions = {
        labelName: "Bathtub",
        type: ElementType.FIXTURE,
        position: { x: 0, y: 0, z: 0 },
        dimensions: { width: 0.75, depth: 1.7 },
        tubColor: 0xffffff,
        outlineColor: 0x000000
    };

    get labelName() { return this.propertySet.labelName; }
    set labelName(value: string) { this.propertySet.labelName = value; }

    get dimensions() { return this.propertySet.dimensions; }
    set dimensions(value: { width: number; depth: number }) {
        this.propertySet.dimensions = value;
        this.setOPGeometry();
    }

    get tubColor() { return this.propertySet.tubColor; }
    set tubColor(value: number) {
        this.propertySet.tubColor = value;
        const tub = this.subElements.get("tub") as Polygon;
        if (tub) tub.color = value;
    }

    constructor(config?: Partial<BathtubOptions>) {
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

        // Outer tub (rounded rectangle)
        const tubPoly = new Polygon({
            vertices: this.createRoundedRectVertices(dimensions.width, dimensions.depth, 0.1, 8),
            color: this.tubColor
        });
        tubPoly.outline = true;
        this.subElements.set("tub", tubPoly);
        this.add(tubPoly);

        // Inner basin (smaller rounded rectangle)
        const innerWidth = dimensions.width * 0.85;
        const innerDepth = dimensions.depth * 0.9;
        const innerPoly = new Polygon({
            vertices: this.createRoundedRectVertices(innerWidth, innerDepth, 0.08, 8),
            color: 0xf8f8f8
        });
        innerPoly.outline = true;
        innerPoly.position.set(0, 0.001, 0);
        this.subElements.set("inner", innerPoly);
        this.add(innerPoly);

        // Drain circle
        const drainPoly = new Polygon({
            vertices: this.createOvalVertices(0.05, 0.05, 8),
            color: 0x666666
        });
        drainPoly.position.set(0, 0.002, -dimensions.depth / 2 + 0.2);
        this.subElements.set("drain", drainPoly);
        this.add(drainPoly);
    }

    private createRoundedRectVertices(width: number, depth: number, radius: number, cornerSegments: number): Vector3[] {
        const vertices: Vector3[] = [];
        const hw = width / 2 - radius;
        const hd = depth / 2 - radius;

        // Top-right corner
        for (let i = 0; i <= cornerSegments; i++) {
            const angle = (i / cornerSegments) * (Math.PI / 2);
            vertices.push(new Vector3(hw + Math.cos(angle) * radius, 0, -hd - Math.sin(angle) * radius));
        }
        // Top-left corner
        for (let i = 0; i <= cornerSegments; i++) {
            const angle = (Math.PI / 2) + (i / cornerSegments) * (Math.PI / 2);
            vertices.push(new Vector3(-hw + Math.cos(angle) * radius, 0, -hd - Math.sin(angle) * radius));
        }
        // Bottom-left corner
        for (let i = 0; i <= cornerSegments; i++) {
            const angle = Math.PI + (i / cornerSegments) * (Math.PI / 2);
            vertices.push(new Vector3(-hw + Math.cos(angle) * radius, 0, hd - Math.sin(angle) * radius));
        }
        // Bottom-right corner
        for (let i = 0; i <= cornerSegments; i++) {
            const angle = (3 * Math.PI / 2) + (i / cornerSegments) * (Math.PI / 2);
            vertices.push(new Vector3(hw + Math.cos(angle) * radius, 0, hd - Math.sin(angle) * radius));
        }
        return vertices;
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
