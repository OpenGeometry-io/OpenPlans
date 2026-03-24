import * as THREE from "three";
import { IShape } from "../../../shapes/base-type";
import { ElementType } from "../../base-type";
import { Polygon, Polyline, Vector3 } from "opengeometry";

export interface PlanterOptions {
    ogid?: string;
    labelName: string;
    type: ElementType.LANDSCAPE;
    position: { x: number; y: number; z: number };
    dimensions: { width: number; depth: number };
    planterColor: number;
    plantColor: number;
}

export class Planter2D extends Polyline implements IShape {
    ogType: string = ElementType.LANDSCAPE;
    subElements: Map<string, THREE.Object3D> = new Map();
    selected: boolean = false;
    edit: boolean = false;
    locked: boolean = false;

    propertySet: PlanterOptions = {
        labelName: "Planter",
        type: ElementType.LANDSCAPE,
        position: { x: 0, y: 0, z: 0 },
        dimensions: { width: 0.6, depth: 0.6 },
        planterColor: 0x8b4513,
        plantColor: 0x228b22
    };

    get labelName() { return this.propertySet.labelName; }
    set labelName(value: string) { this.propertySet.labelName = value; }

    get dimensions() { return this.propertySet.dimensions; }
    set dimensions(value: { width: number; depth: number }) {
        this.propertySet.dimensions = value;
        this.setOPGeometry();
    }

    get planterColor() { return this.propertySet.planterColor; }
    set planterColor(value: number) {
        this.propertySet.planterColor = value;
        const pot = this.subElements.get("pot") as Polygon;
        if (pot) pot.color = value;
    }

    get plantColor() { return this.propertySet.plantColor; }
    set plantColor(value: number) {
        this.propertySet.plantColor = value;
        const plant = this.subElements.get("plant") as Polygon;
        if (plant) plant.color = value;
    }

    constructor(config?: Partial<PlanterOptions>) {
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

        // Planter pot (rectangle)
        const potPoly = new Polygon({
            vertices: [
                new Vector3(-hw, 0, -hd),
                new Vector3(-hw, 0, hd),
                new Vector3(hw, 0, hd),
                new Vector3(hw, 0, -hd)
            ],
            color: this.planterColor
        });
        potPoly.outline = true;
        this.subElements.set("pot", potPoly);
        this.add(potPoly);

        // Plant foliage (inner organic circle)
        const plantRadius = Math.min(hw, hd) * 0.8;
        const plantPoly = new Polygon({
            vertices: this.createBlobVertices(plantRadius, plantRadius, 16),
            color: this.plantColor
        });
        plantPoly.outline = true;
        plantPoly.position.set(0, 0.001, 0);
        this.subElements.set("plant", plantPoly);
        this.add(plantPoly);

        // Small inner detail
        const innerPoly = new Polygon({
            vertices: this.createCircleVertices(plantRadius * 0.3, 8),
            color: 0x1a6b1a
        });
        innerPoly.position.set(0, 0.002, 0);
        this.subElements.set("inner", innerPoly);
        this.add(innerPoly);
    }

    private createBlobVertices(radiusX: number, radiusZ: number, segments: number): Vector3[] {
        const vertices: Vector3[] = [];
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const wobble = 1 + Math.sin(angle * 6) * 0.08;
            vertices.push(new Vector3(Math.cos(angle) * radiusX * wobble, 0, Math.sin(angle) * radiusZ * wobble));
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
