import * as THREE from "three";
import { IShape } from "../../../shapes/base-type";
import { ElementType } from "../../base-type";
import { Polygon, Polyline, Vector3 } from "../../../kernel";

export interface BidetOptions {
    ogid?: string;
    labelName: string;
    type: ElementType.FIXTURE;
    position: { x: number; y: number; z: number };
    dimensions: { width: number; depth: number };
    bidetColor: number;
    outlineColor: number;
}

export class Bidet2D extends Polyline implements IShape {
    ogType: string = ElementType.FIXTURE;
    subElements: Map<string, THREE.Object3D> = new Map();
    selected: boolean = false;
    edit: boolean = false;
    locked: boolean = false;

    propertySet: BidetOptions = {
        labelName: "Bidet",
        type: ElementType.FIXTURE,
        position: { x: 0, y: 0, z: 0 },
        dimensions: { width: 0.5, depth: 0.7 },
        bidetColor: 0xffffff,
        outlineColor: 0x000000
    };

    get labelName() { return this.propertySet.labelName; }
    set labelName(value: string) { this.propertySet.labelName = value; }

    get dimensions() { return this.propertySet.dimensions; }
    set dimensions(value: { width: number; depth: number }) {
        this.propertySet.dimensions = value;
        this.setOPGeometry();
    }

    get bidetColor() { return this.propertySet.bidetColor; }
    set bidetColor(value: number) {
        this.propertySet.bidetColor = value;
        const body = this.subElements.get("body") as Polygon;
        if (body) body.color = value;
    }

    constructor(config?: Partial<BidetOptions>) {
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

        // Main body (oval shape)
        const bodyPoly = new Polygon({
            vertices: this.createOvalVertices(dimensions.width, dimensions.depth, 20),
            color: this.bidetColor
        });
        bodyPoly.outline = true;
        this.subElements.set("body", bodyPoly);
        this.add(bodyPoly);

        // Inner basin (smaller oval)
        const innerPoly = new Polygon({
            vertices: this.createOvalVertices(dimensions.width * 0.6, dimensions.depth * 0.5, 16),
            color: 0xf8f8f8
        });
        innerPoly.outline = true;
        innerPoly.position.set(0, 0.001, dimensions.depth * 0.1);
        this.subElements.set("inner", innerPoly);
        this.add(innerPoly);

        // Faucet indicator (small rectangle at back) in the ratio of width and depth
        const faucetWidth = dimensions.width * 0.1;
        const faucetDepth = dimensions.depth * 0.1;
        const faucetPoly = new Polygon({
            vertices: [
                new Vector3(-faucetWidth / 2, 0, -faucetDepth / 2),
                new Vector3(-faucetWidth / 2, 0, faucetDepth / 2),
                new Vector3(faucetWidth / 2, 0, faucetDepth / 2),
                new Vector3(faucetWidth / 2, 0, -faucetDepth / 2)
            ],
            color: 0xcccccc
        });
        faucetPoly.position.set(0, 0.001, -dimensions.depth / 2 + faucetDepth);
        this.subElements.set("faucet", faucetPoly);
        this.add(faucetPoly);
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
