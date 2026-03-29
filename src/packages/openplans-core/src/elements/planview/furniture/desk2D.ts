import * as THREE from "three";
import { IShape } from "../../../shapes/base-type";
import { ElementType } from "../../base-type";
import { Polygon, Polyline, Vector3 } from "opengeometry";
import { Chair2D } from "./chair2D";

export interface DeskOptions {
    ogid?: string;
    labelName: string;
    type: ElementType.FURNITURE;
    position: { x: number; y: number; z: number };
    dimensions: { width: number; depth: number };
    deskColor: number;
    chairColor: number;
    poleSize: number;
}

export class Desk2D extends Polyline implements IShape {
    ogType: string = ElementType.FURNITURE;
    subElements: Map<string, THREE.Object3D> = new Map();
    selected: boolean = false;
    edit: boolean = false;
    locked: boolean = false;

    propertySet: DeskOptions = {
        labelName: "Desk",
        type: ElementType.FURNITURE,
        position: { x: 0, y: 0, z: 0 },
        dimensions: { width: 1.6, depth: 0.8 },
        deskColor: 0xffffff,
        chairColor: 0xffffff,
        poleSize: 0.05
    };

    get labelName() { return this.propertySet.labelName; }
    set labelName(value: string) { this.propertySet.labelName = value; }

    get dimensions() { return this.propertySet.dimensions; }
    set dimensions(value: { width: number; depth: number }) {
        this.propertySet.dimensions = value;
        this.setOPGeometry();
    }

    get deskColor() { return this.propertySet.deskColor; }
    set deskColor(value: number) {
        this.propertySet.deskColor = value;
        this.setOPGeometry();
    }

    get chairColor() { return this.propertySet.chairColor; }
    set chairColor(value: number) {
        this.propertySet.chairColor = value;
        this.setOPGeometry();
    }

    get poleSize() { return this.propertySet.poleSize; }
    set poleSize(value: number) {
        this.propertySet.poleSize = Math.max(0.02, value);
        this.setOPGeometry();
    }

    constructor(config?: Partial<DeskOptions>) {
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
        const dw = dimensions.width;
        const dd = dimensions.depth;
        const hw = dw / 2;
        const hd = dd / 2;

        // Desk surface (outer rectangle)
        const deskPoly = new Polygon({
            vertices: [
                new Vector3(-hw, 0, -hd),
                new Vector3(-hw, 0, hd),
                new Vector3(hw, 0, hd),
                new Vector3(hw, 0, -hd)
            ],
            color: this.deskColor
        });
        deskPoly.outline = true;
        this.subElements.set("desk", deskPoly);
        this.add(deskPoly);

        // Four corner poles
        const poleSize = this.poleSize;
        const poleInset = 0.03;
        const polePositions = [
            { x: -hw + poleInset + poleSize / 2, z: -hd + poleInset + poleSize / 2 },
            { x: hw - poleInset - poleSize / 2, z: -hd + poleInset + poleSize / 2 },
            { x: -hw + poleInset + poleSize / 2, z: hd - poleInset - poleSize / 2 },
            { x: hw - poleInset - poleSize / 2, z: hd - poleInset - poleSize / 2 }
        ];

        polePositions.forEach((pos, i) => {
            const pole = new Polygon({
                vertices: [
                    new Vector3(-poleSize / 2, 0, -poleSize / 2),
                    new Vector3(-poleSize / 2, 0, poleSize / 2),
                    new Vector3(poleSize / 2, 0, poleSize / 2),
                    new Vector3(poleSize / 2, 0, -poleSize / 2)
                ],
                color: this.deskColor
            });
            pole.outline = true;
            pole.position.set(pos.x, 0.001, pos.z);
            this.subElements.set(`pole${i}`, pole);
            this.add(pole);
        });

        // Chair using Chair2D class
        const chairWidth = 0.5;
        const chairDepth = 0.5;
        const tableToChairGap = 0.05;

        const chair = new Chair2D({
            dimensions: { width: chairWidth, depth: chairDepth },
            chairColor: this.chairColor
        });
        const chairZ = hd + tableToChairGap + chairDepth / 2;
        chair.position.set(0, 0.001, chairZ);
        chair.rotation.y = Math.PI; // Face the desk
        this.subElements.set("chair", chair);
        this.add(chair);
    }

    setOPMaterial(): void { }
}
