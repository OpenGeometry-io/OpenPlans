import * as THREE from "three";
import { IShape } from "../../../shapes/base-type";
import { ElementType } from "../../base-type";
import { Polygon, Polyline, Vector3 } from "../../../kernel";

export interface TreeOptions {
    ogid?: string;
    labelName: string;
    type: ElementType.LANDSCAPE;
    position: { x: number; y: number; z: number };
    canopyRadius: number;
    trunkRadius: number;
    canopyColor: number;
    trunkColor: number;
}

export class Tree2D extends Polyline implements IShape {
    ogType: string = ElementType.LANDSCAPE;
    subElements: Map<string, THREE.Object3D> = new Map();
    selected: boolean = false;
    edit: boolean = false;
    locked: boolean = false;

    propertySet: TreeOptions = {
        labelName: "Tree",
        type: ElementType.LANDSCAPE,
        position: { x: 0, y: 0, z: 0 },
        canopyRadius: 1.5,
        trunkRadius: 0.15,
        canopyColor: 0x228b22,
        trunkColor: 0x8b4513
    };

    get labelName() { return this.propertySet.labelName; }
    set labelName(value: string) { this.propertySet.labelName = value; }

    get canopyRadius() { return this.propertySet.canopyRadius; }
    set canopyRadius(value: number) {
        this.propertySet.canopyRadius = value;
        this.setOPGeometry();
    }

    get trunkRadius() { return this.propertySet.trunkRadius; }
    set trunkRadius(value: number) {
        this.propertySet.trunkRadius = value;
        this.setOPGeometry();
    }

    get canopyColor() { return this.propertySet.canopyColor; }
    set canopyColor(value: number) {
        this.propertySet.canopyColor = value;
        const canopy = this.subElements.get("canopy") as Polygon;
        if (canopy) canopy.color = value;
    }

    get trunkColor() { return this.propertySet.trunkColor; }
    set trunkColor(value: number) {
        this.propertySet.trunkColor = value;
        const trunk = this.subElements.get("trunk") as Polygon;
        if (trunk) trunk.color = value;
    }

    constructor(config?: Partial<TreeOptions>) {
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

        const { canopyRadius, trunkRadius } = this.propertySet;

        // Canopy (circle)
        const canopyPoly = new Polygon({
            vertices: this.createCircleVertices(canopyRadius, 24),
            color: this.canopyColor
        });
        canopyPoly.outline = true;
        this.subElements.set("canopy", canopyPoly);
        this.add(canopyPoly);

        // Trunk (smaller circle in center)
        const trunkPoly = new Polygon({
            vertices: this.createCircleVertices(trunkRadius, 12),
            color: this.trunkColor
        });
        trunkPoly.position.set(0, 0.001, 0);
        this.subElements.set("trunk", trunkPoly);
        this.add(trunkPoly);

        // Cross lines in canopy to show foliage pattern
        const lineWidth = 0.02;
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI;
            const line = new Polygon({
                vertices: [
                    new Vector3(-canopyRadius * 0.7, 0, -lineWidth / 2),
                    new Vector3(-canopyRadius * 0.7, 0, lineWidth / 2),
                    new Vector3(canopyRadius * 0.7, 0, lineWidth / 2),
                    new Vector3(canopyRadius * 0.7, 0, -lineWidth / 2)
                ],
                color: 0x1a6b1a
            });
            line.rotation.y = angle;
            line.position.set(0, 0.002, 0);
            this.subElements.set(`line${i}`, line);
            this.add(line);
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

    setOPMaterial(): void { }
}
