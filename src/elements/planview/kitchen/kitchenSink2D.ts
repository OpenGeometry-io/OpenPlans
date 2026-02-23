import * as THREE from "three";
import { IShape } from "../../../shapes/base-type";
import { ElementType } from "../../base-type";
import { Polygon, Polyline, Vector3 } from "../../../kernel";

export interface KitchenSinkOptions {
    ogid?: string;
    labelName: string;
    type: ElementType.FIXTURE;
    position: { x: number; y: number; z: number };
    dimensions: { width: number; depth: number };
    sinkColor: number;
}

export class KitchenSink2D extends Polyline implements IShape {
    ogType: string = ElementType.FIXTURE;
    subElements: Map<string, THREE.Object3D> = new Map();
    selected: boolean = false;
    edit: boolean = false;
    locked: boolean = false;

    propertySet: KitchenSinkOptions = {
        labelName: "Kitchen Sink",
        type: ElementType.FIXTURE,
        position: { x: 0, y: 0, z: 0 },
        dimensions: { width: 1, depth: 0.6 },
        sinkColor: 0xffffff
    };

    get labelName() { return this.propertySet.labelName; }
    set labelName(value: string) { this.propertySet.labelName = value; }

    get dimensions() { return this.propertySet.dimensions; }
    set dimensions(value: { width: number; depth: number }) {
        this.propertySet.dimensions = value;
        this.setOPGeometry();
    }

    get sinkColor() { return this.propertySet.sinkColor; }
    set sinkColor(value: number) {
        this.propertySet.sinkColor = value;
        const basin = this.subElements.get("basin") as Polygon;
        if (basin) basin.color = value;
    }

    constructor(config?: Partial<KitchenSinkOptions>) {
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
        const hw = w / 2;
        const hd = d / 2;

        // Outer boundary
        const bodyPoly = new Polygon({
            vertices: [
                new Vector3(-hw, 0, -hd),
                new Vector3(-hw, 0, hd),
                new Vector3(hw, 0, hd),
                new Vector3(hw, 0, -hd)
            ],
            color: this.sinkColor
        });
        bodyPoly.outline = true;
        this.subElements.set("body", bodyPoly);
        this.add(bodyPoly);

        // Basin (left side, simple rectangle without rounded corners)
        const basinWidth = w * 0.5;
        const basinDepth = d * 0.85;
        const basinX = -hw + basinWidth / 2 + 0.05;

        const basin = new Polygon({
            vertices: [
                new Vector3(-basinWidth / 2, 0, -basinDepth / 2),
                new Vector3(-basinWidth / 2, 0, basinDepth / 2),
                new Vector3(basinWidth / 2, 0, basinDepth / 2),
                new Vector3(basinWidth / 2, 0, -basinDepth / 2)
            ],
            color: this.sinkColor
        });
        basin.outline = true;
        basin.position.set(basinX, 0.001, 0);
        this.subElements.set("basin", basin);
        this.add(basin);

        // Drain circle (secondary color)
        const drainRadius = 0.04;
        const drain = new Polygon({
            vertices: this.createCircleVertices(drainRadius, 12),
            color: 0xcccccc
        });
        drain.outline = true;
        drain.position.set(basinX, 0.002, 0);
        this.subElements.set("drain", drain);
        this.add(drain);

        // Draining board area (right side) - 5 horizontal lines using Polyline
        const drainingStartX = basinX + basinWidth / 2 + 0.08;
        const drainingEndX = hw - 0.05;
        const lineSpacing = basinDepth / 6;
        const startZ = -basinDepth / 2 + lineSpacing;

        for (let i = 0; i < 5; i++) {
            const zPos = startZ + i * lineSpacing;
            const line = new Polyline({
                points: [
                    new Vector3(drainingStartX, 0, zPos),
                    new Vector3(drainingEndX, 0, zPos)
                ],
                color: 0x000000
            });
            line.position.set(0, 0.001, 0);
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

