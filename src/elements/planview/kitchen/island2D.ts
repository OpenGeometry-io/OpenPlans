import * as THREE from "three";
import { IShape } from "../../../shapes/base-type";
import { ElementType } from "../../base-type";
import { Polygon, Polyline, Vector3 } from "../../../kernel";

export interface IslandOptions {
    ogid?: string;
    labelName: string;
    type: ElementType.FIXTURE;
    position: { x: number; y: number; z: number };
    dimensions: { width: number; depth: number };
    islandColor: number;
}

export class Island2D extends Polyline implements IShape {
    ogType: string = ElementType.FIXTURE;
    subElements: Map<string, THREE.Object3D> = new Map();
    selected: boolean = false;
    edit: boolean = false;
    locked: boolean = false;

    propertySet: IslandOptions = {
        labelName: "Kitchen Island",
        type: ElementType.FIXTURE,
        position: { x: 0, y: 0, z: 0 },
        dimensions: { width: 1.8, depth: 0.9 },
        islandColor: 0xffffff
    };

    get labelName() { return this.propertySet.labelName; }
    set labelName(value: string) { this.propertySet.labelName = value; }

    get dimensions() { return this.propertySet.dimensions; }
    set dimensions(value: { width: number; depth: number }) {
        this.propertySet.dimensions = value;
        this.setOPGeometry();
    }

    get islandColor() { return this.propertySet.islandColor; }
    set islandColor(value: number) {
        this.propertySet.islandColor = value;
        const surface = this.subElements.get("surface") as Polygon;
        if (surface) surface.color = value;
    }

    constructor(config?: Partial<IslandOptions>) {
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
        const hw = dimensions.width / 2;
        const hd = dimensions.depth / 2;

        // Island surface
        const surfacePoly = new Polygon({
            vertices: [
                new Vector3(-hw, 0, -hd),
                new Vector3(-hw, 0, hd),
                new Vector3(hw, 0, hd),
                new Vector3(hw, 0, -hd)
            ],
            color: this.islandColor
        });
        surfacePoly.outline = true;
        this.subElements.set("surface", surfacePoly);
        this.add(surfacePoly);

        // Stool indicators on one side (secondary color)
        const stoolRadius = 0.15;
        const stoolSpacing = dimensions.width / 4;
        for (let i = 0; i < 3; i++) {
            const stool = new Polygon({
                vertices: this.createCircleVertices(stoolRadius, 12),
                color: 0xcccccc
            });
            stool.outline = true;
            stool.position.set(-hw + stoolSpacing * (i + 1), 0.001, -hd - stoolRadius - 0.1);
            this.subElements.set(`stool${i}`, stool);
            this.add(stool);
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
