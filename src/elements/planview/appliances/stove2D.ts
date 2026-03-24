import * as THREE from "three";
import { IShape } from "../../../shapes/base-type";
import { ElementType } from "../../base-type";
import { Polygon, Polyline, Vector3 } from "opengeometry";

export interface StoveOptions {
    ogid?: string;
    labelName: string;
    type: ElementType.APPLIANCE;
    position: { x: number; y: number; z: number };
    dimensions: { width: number; depth: number };
    bodyColor: number;
}

export class Stove2D extends Polyline implements IShape {
    ogType: string = ElementType.APPLIANCE;
    subElements: Map<string, THREE.Object3D> = new Map();
    selected: boolean = false;
    edit: boolean = false;
    locked: boolean = false;

    propertySet: StoveOptions = {
        labelName: "Stove",
        type: ElementType.APPLIANCE,
        position: { x: 0, y: 0, z: 0 },
        dimensions: { width: 1, depth: 1 },
        bodyColor: 0xffffff
    };

    get labelName() { return this.propertySet.labelName; }
    set labelName(value: string) { this.propertySet.labelName = value; }

    get dimensions() { return this.propertySet.dimensions; }
    set dimensions(value: { width: number; depth: number }) {
        this.propertySet.dimensions = value;
        this.setOPGeometry();
    }

    get bodyColor() { return this.propertySet.bodyColor; }
    set bodyColor(value: number) {
        this.propertySet.bodyColor = value;
        const body = this.subElements.get("body") as Polygon;
        if (body) body.color = value;
    }

    constructor(config?: Partial<StoveOptions>) {
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

        // Body
        const bodyPoly = new Polygon({
            vertices: [
                new Vector3(-hw, 0, -hd),
                new Vector3(-hw, 0, hd),
                new Vector3(hw, 0, hd),
                new Vector3(hw, 0, -hd)
            ],
            color: this.bodyColor
        });
        bodyPoly.outline = true;
        this.subElements.set("body", bodyPoly);
        this.add(bodyPoly);

        // Fixed 4 burners in 2x2 grid
        const burnerRadius = Math.min(dimensions.width, dimensions.depth) * 0.15;
        const offsetX = hw * 0.5;
        const offsetZ = hd * 0.5;

        const positions = [
            { x: -offsetX, z: -offsetZ },
            { x: offsetX, z: -offsetZ },
            { x: -offsetX, z: offsetZ },
            { x: offsetX, z: offsetZ }
        ];

        positions.forEach((pos, i) => {
            // Outer circle (secondary color)
            const burner = new Polygon({
                vertices: this.createCircleVertices(burnerRadius, 16),
                color: 0xcccccc
            });
            burner.outline = true;
            burner.position.set(pos.x, 0.001, pos.z);
            this.subElements.set(`burner${i}`, burner);
            this.add(burner);

            // Inner circle (white)
            const innerCircle = new Polygon({
                vertices: this.createCircleVertices(burnerRadius * 0.5, 12),
                color: 0xffffff
            });
            innerCircle.outline = true;
            innerCircle.position.set(pos.x, 0.002, pos.z);
            this.subElements.set(`inner${i}`, innerCircle);
            this.add(innerCircle);
        });
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

