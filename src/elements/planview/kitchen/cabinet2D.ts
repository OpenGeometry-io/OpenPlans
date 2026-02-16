import * as THREE from "three";
import { IShape } from "../../../shapes/base-type";
import { ElementType } from "../../base-type";
import { Polygon, Polyline, Vector3 } from "../../../kernel";

export interface CabinetOptions {
    ogid?: string;
    labelName: string;
    type: ElementType.FIXTURE;
    position: { x: number; y: number; z: number };
    dimensions: { width: number; depth: number };
    cabinetColor: number;
    doors: number;
}

export class Cabinet2D extends Polyline implements IShape {
    ogType: string = ElementType.FIXTURE;
    subElements: Map<string, THREE.Object3D> = new Map();
    selected: boolean = false;
    edit: boolean = false;
    locked: boolean = false;

    propertySet: CabinetOptions = {
        labelName: "Cabinet",
        type: ElementType.FIXTURE,
        position: { x: 0, y: 0, z: 0 },
        dimensions: { width: 0.8, depth: 0.6 },
        cabinetColor: 0xc4a77d,
        doors: 2
    };

    get labelName() { return this.propertySet.labelName; }
    set labelName(value: string) { this.propertySet.labelName = value; }

    get dimensions() { return this.propertySet.dimensions; }
    set dimensions(value: { width: number; depth: number }) {
        this.propertySet.dimensions = value;
        this.setOPGeometry();
    }

    get cabinetColor() { return this.propertySet.cabinetColor; }
    set cabinetColor(value: number) {
        this.propertySet.cabinetColor = value;
        const body = this.subElements.get("body") as Polygon;
        if (body) body.color = value;
    }

    get doors() { return this.propertySet.doors; }
    set doors(value: number) {
        this.propertySet.doors = Math.max(1, Math.min(4, value));
        this.setOPGeometry();
    }

    constructor(config?: Partial<CabinetOptions>) {
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

        const { dimensions, doors } = this.propertySet;
        const hw = dimensions.width / 2;
        const hd = dimensions.depth / 2;

        // Cabinet body
        const bodyPoly = new Polygon({
            vertices: [
                new Vector3(-hw, 0, -hd),
                new Vector3(-hw, 0, hd),
                new Vector3(hw, 0, hd),
                new Vector3(hw, 0, -hd)
            ],
            color: this.cabinetColor
        });
        bodyPoly.outline = true;
        this.subElements.set("body", bodyPoly);
        this.add(bodyPoly);

        // Door dividers
        const doorWidth = dimensions.width / doors;
        for (let i = 1; i < doors; i++) {
            const divider = new Polygon({
                vertices: [
                    new Vector3(-0.01, 0, -hd + 0.02),
                    new Vector3(-0.01, 0, hd - 0.02),
                    new Vector3(0.01, 0, hd - 0.02),
                    new Vector3(0.01, 0, -hd + 0.02)
                ],
                color: 0x8b7355
            });
            divider.position.set(-hw + i * doorWidth, 0.001, 0);
            this.subElements.set(`divider${i}`, divider);
            this.add(divider);
        }

        // Door handles
        for (let i = 0; i < doors; i++) {
            const handleX = -hw + doorWidth * (i + 0.7);
            const handle = new Polygon({
                vertices: this.createCircleVertices(0.02, 6),
                color: 0x666666
            });
            handle.position.set(handleX, 0.002, 0);
            this.subElements.set(`handle${i}`, handle);
            this.add(handle);
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
