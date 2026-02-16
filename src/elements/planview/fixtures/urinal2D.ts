import * as THREE from "three";
import { IShape } from "../../../shapes/base-type";
import { ElementType } from "../../base-type";
import { Polygon, Polyline, Vector3 } from "../../../kernel";

export interface UrinalOptions {
    ogid?: string;
    labelName: string;
    type: ElementType.FIXTURE;
    position: { x: number; y: number; z: number };
    dimensions: { width: number; depth: number };
    urinalColor: number;
    outlineColor: number;
}

export class Urinal2D extends Polyline implements IShape {
    ogType: string = ElementType.FIXTURE;
    subElements: Map<string, THREE.Object3D> = new Map();
    selected: boolean = false;
    edit: boolean = false;
    locked: boolean = false;

    propertySet: UrinalOptions = {
        labelName: "Urinal",
        type: ElementType.FIXTURE,
        position: { x: 0, y: 0, z: 0 },
        dimensions: { width: 1, depth: 1 },
        urinalColor: 0xffffff,
        outlineColor: 0x000000
    };

    get labelName() { return this.propertySet.labelName; }
    set labelName(value: string) { this.propertySet.labelName = value; }

    get dimensions() { return this.propertySet.dimensions; }
    set dimensions(value: { width: number; depth: number }) {
        this.propertySet.dimensions = value;
        this.setOPGeometry();
    }

    get urinalColor() { return this.propertySet.urinalColor; }
    set urinalColor(value: number) {
        this.propertySet.urinalColor = value;
        this.setOPGeometry();
    }

    constructor(config?: Partial<UrinalOptions>) {
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
        const w = dimensions.width;
        const d = dimensions.depth;

        // Back plate (top rectangle)
        const backPlateHeight = d * 0.12;
        const backPlatePoly = new Polygon({
            vertices: [
                new Vector3(-w / 2, 0, -d / 2),
                new Vector3(-w / 2, 0, -d / 2 + backPlateHeight),
                new Vector3(w / 2, 0, -d / 2 + backPlateHeight),
                new Vector3(w / 2, 0, -d / 2)
            ],
            color: this.urinalColor
        });
        backPlatePoly.outline = true;
        this.subElements.set("backPlate", backPlatePoly);
        this.add(backPlatePoly);

        // Outer body (U-shape with rounded bottom)
        const outerPoly = new Polygon({
            vertices: this.createStadiumVertices(w, d - backPlateHeight, 16),
            color: this.urinalColor
        });
        outerPoly.outline = true;
        outerPoly.position.set(0, 0, backPlateHeight / 2);
        this.subElements.set("outer", outerPoly);
        this.add(outerPoly);

        // Inner body (smaller U-shape inset)
        const innerMargin = w * 0.12;
        const innerW = w - innerMargin * 2;
        const innerD = (d - backPlateHeight) * 0.75;
        const innerPoly = new Polygon({
            vertices: this.createStadiumVertices(innerW, innerD, 12),
            color: this.urinalColor
        });
        innerPoly.outline = true;
        innerPoly.position.set(0, 0.001, backPlateHeight / 2 + (d - backPlateHeight - innerD) * 0.3);
        this.subElements.set("inner", innerPoly);
        this.add(innerPoly);

        // Drain (center circle)
        const drainRadius = w * 0.1;
        const drainPoly = new Polygon({
            vertices: this.createCircleVertices(drainRadius, 12),
            color: 0x000000
        });
        drainPoly.outline = true;
        drainPoly.position.set(0, 0.002, d * 0.1);
        this.subElements.set("drain", drainPoly);
        this.add(drainPoly);
    }

    // Creates a stadium shape: rectangle with semicircle at bottom
    private createStadiumVertices(width: number, depth: number, curveSegments: number): Vector3[] {
        const vertices: Vector3[] = [];
        const hw = width / 2;
        const hd = depth / 2;
        const curveRadius = hw; // Semicircle radius matches half width

        // Top-left corner
        vertices.push(new Vector3(-hw, 0, -hd));
        // Left side going down
        vertices.push(new Vector3(-hw, 0, hd - curveRadius));

        // Bottom semicircle (from left to right)
        for (let i = 0; i <= curveSegments; i++) {
            const angle = Math.PI + (i / curveSegments) * Math.PI;
            vertices.push(new Vector3(
                Math.cos(angle) * curveRadius,
                0,
                (hd - curveRadius) + Math.abs(Math.sin(angle)) * curveRadius
            ));
        }

        // Right side going up
        vertices.push(new Vector3(hw, 0, hd - curveRadius));
        // Top-right corner
        vertices.push(new Vector3(hw, 0, -hd));

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
