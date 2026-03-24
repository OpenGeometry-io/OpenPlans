import * as THREE from "three";
import { IShape } from "../../../shapes/base-type";
import { ElementType } from "../../base-type";
import { Polygon, Polyline, Vector3 } from "opengeometry";

export interface ToiletOptions {
    ogid?: string;
    labelName: string;
    type: ElementType.FIXTURE;
    position: { x: number; y: number; z: number };
    dimensions: { width: number; depth: number };
    bowlColor: number;
    tankColor: number;
    outlineColor: number;
}

export class Toilet2D extends Polyline implements IShape {
    ogType: string = ElementType.FIXTURE;
    subElements: Map<string, THREE.Object3D> = new Map();
    selected: boolean = false;
    edit: boolean = false;
    locked: boolean = false;

    propertySet: ToiletOptions = {
        labelName: "Toilet",
        type: ElementType.FIXTURE,
        position: { x: 0, y: 0, z: 0 },
        dimensions: { width: 1.2, depth: 1.8 },
        bowlColor: 0xffffff,
        tankColor: 0xf0f0f0,
        outlineColor: 0x000000
    };

    get labelName() { return this.propertySet.labelName; }
    set labelName(value: string) { this.propertySet.labelName = value; }

    get dimensions() { return this.propertySet.dimensions; }
    set dimensions(value: { width: number; depth: number }) {
        this.propertySet.dimensions = value;
        this.setOPGeometry();
    }

    get bowlColor() { return this.propertySet.bowlColor; }
    set bowlColor(value: number) {
        this.propertySet.bowlColor = value;
        const bowl = this.subElements.get("bowl") as Polygon;
        if (bowl) bowl.color = value;
    }

    get tankColor() { return this.propertySet.tankColor; }
    set tankColor(value: number) {
        this.propertySet.tankColor = value;
        const tank = this.subElements.get("tank") as Polygon;
        if (tank) tank.color = value;
    }

    constructor(config?: Partial<ToiletOptions>) {
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
        const tankDepth = dimensions.depth * 0.25;
        const bowlDepth = dimensions.depth * 0.75;

        // Boundary
        // const boundVertices = [
        //     new Vector3(-dimensions.width / 2, 0, -dimensions.depth / 2),
        //     new Vector3(-dimensions.width / 2, 0, dimensions.depth / 2),
        //     new Vector3(dimensions.width / 2, 0, dimensions.depth / 2),
        //     new Vector3(dimensions.width / 2, 0, -dimensions.depth / 2)
        // ];
        // this.setConfig({
        //     points: boundVertices,
        //     color: 0x0000ff
        // });

        // Tank (rectangular at back)
        const tankPoly = new Polygon({
            vertices: [
                new Vector3(-dimensions.width / 2, 0, -dimensions.depth / 2),
                new Vector3(-dimensions.width / 2, 0, -dimensions.depth / 2 + tankDepth),
                new Vector3(dimensions.width / 2, 0, -dimensions.depth / 2 + tankDepth),
                new Vector3(dimensions.width / 2, 0, -dimensions.depth / 2)
            ],
            color: this.tankColor
        });
        tankPoly.outline = true;
        this.subElements.set("tank", tankPoly);
        this.add(tankPoly);

        // Bowl (oval/rounded rectangle at front)
        const bowlWidth = dimensions.width * 0.9;
        const bowlPoly = new Polygon({
            vertices: this.createOvalVertices(bowlWidth, bowlDepth, 16),
            color: this.bowlColor
        });
        bowlPoly.outline = true;
        bowlPoly.position.set(0, 0.001, dimensions.depth / 2 - bowlDepth / 2);
        this.subElements.set("bowl", bowlPoly);
        this.add(bowlPoly);
    }

    private createOvalVertices(width: number, depth: number, segments: number): Vector3[] {
        const vertices: Vector3[] = [];
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            vertices.push(new Vector3(
                Math.cos(angle) * width / 2,
                0,
                Math.sin(angle) * depth / 2
            ));
        }
        return vertices;
    }

    setOPMaterial(): void { }
}
