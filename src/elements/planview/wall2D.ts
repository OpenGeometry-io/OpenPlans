import * as THREE from "three";
import { IShape } from "../../shapes/base-type";
import { ElementType } from "../base-type";
import { Polygon, Polyline, Vector3 } from "opengeometry";

export interface Point {
    x: number;
    y: number;
    z: number;
}

export interface WallOptions {
    ogid?: string;
    labelName: string;
    type: ElementType.WALL;
    points: Array<Point>;
    wallColor: number;
    wallThickness: number;
    wallHeight: number;
}

export class Wall2D extends Polyline implements IShape {
    ogType: string = ElementType.WALL;
    subElements: Map<string, THREE.Object3D> = new Map();
    selected: boolean = false;
    edit: boolean = false;
    locked: boolean = false;

    propertySet: WallOptions = {
        labelName: "Wall 2D",
        type: ElementType.WALL,
        points: [],
        wallColor: 0xcccccc,
        wallThickness: 0.2,
        wallHeight: 3.0
    };

    get labelName() { return this.propertySet.labelName; }
    set labelName(value: string) { this.propertySet.labelName = value; }

    get wallThickness() { return this.propertySet.wallThickness; }
    set wallThickness(value: number) {
        this.propertySet.wallThickness = value;
        this.setOPGeometry();
    }

    get wallHeight() { return this.propertySet.wallHeight; }
    set wallHeight(value: number) { this.propertySet.wallHeight = value; }



    constructor(wallConfig?: Partial<WallOptions> | any) {
        const initialVectorPoints = wallConfig?.points
            ? wallConfig.points.map((p: any) => new Vector3(p.x, p.y, p.z))
            : [];

        super({
            ogid: wallConfig?.ogid,
            points: initialVectorPoints,
            color: wallConfig?.wallColor !== undefined ? wallConfig.wallColor : 0x0000ff
        });

        this.subElements = new Map<string, THREE.Object3D>();

        if (wallConfig) {
            this.propertySet = { ...this.propertySet, ...wallConfig } as WallOptions;
            if (wallConfig.points) {
                this.propertySet.points = wallConfig.points.map((p: any) => ({ x: p.x, y: p.y, z: p.z }));
            }
        }

        this.propertySet.ogid = this.ogid;
        this.setOPGeometry();
    }

    setOPConfig(_config: Record<string, any>): void { }
    getOPConfig(): Record<string, any> { return this.propertySet; }

    addPoint(point: Vector3): void {
        super.addPoint(point);
        this.propertySet.points.push({ x: point.x, y: point.y, z: point.z });
        this.setOPGeometry();
    }

    updatePoints(points: Vector3[]): void {
        this.propertySet.points = points.map(p => ({ x: p.x, y: p.y, z: p.z }));
        this.setConfig({
            points: points,
            color: this.color
        });
        this.setOPGeometry();
    }

    setOPGeometry(): void {
        const points = this.propertySet.points;
        if (!points || points.length < 2) {
            if (this.subElements.has("wallPolygon")) {
                const poly = this.subElements.get("wallPolygon") as Polygon;
                poly?.removeFromParent();
                this.subElements.delete("wallPolygon");
            }
            return;
        }

        const vectorPoints = points.map(p => new Vector3(p.x, p.y, p.z));
        const polygonVertices = this.computeOffsetPolygonVertices(vectorPoints, this.propertySet.wallThickness);

        let wallPolygon: Polygon;
        if (this.subElements.has("wallPolygon")) {
            wallPolygon = this.subElements.get("wallPolygon") as Polygon;
            wallPolygon.removeFromParent();
            wallPolygon.dispose();
            this.subElements.delete("wallPolygon");
        }

        wallPolygon = new Polygon({
            vertices: polygonVertices,
            color: this.propertySet.wallColor
        });

        // Ensure proper positioning relative to this parent Polyline
        // We will just add it.
        this.subElements.set("wallPolygon", wallPolygon);
        this.add(wallPolygon);
    }

    private computeOffsetPolygonVertices(points: Vector3[], thickness: number): Vector3[] {
        const halfThickness = thickness / 2;
        const n = points.length;
        const leftOffset: Vector3[] = [];
        const rightOffset: Vector3[] = [];

        const threePoints = points.map(p => new THREE.Vector3(p.x, p.y, p.z));

        for (let i = 0; i < n; i++) {
            const current = threePoints[i];
            const prev = (i > 0) ? threePoints[i - 1] : current;
            const next = (i < n - 1) ? threePoints[i + 1] : current;

            let dirPrev = new THREE.Vector3().subVectors(current, prev).normalize();
            let dirNext = new THREE.Vector3().subVectors(next, current).normalize();

            if (i === 0) dirPrev = dirNext.clone();
            if (i === n - 1) dirNext = dirPrev.clone();

            // Normal in XZ plane: (-dz, 0, dx)
            const normalPrev = new THREE.Vector3(-dirPrev.z, 0, dirPrev.x).normalize();
            const normalNext = new THREE.Vector3(-dirNext.z, 0, dirNext.x).normalize();

            // Average normal for miter joint
            const avgNormal = new THREE.Vector3().addVectors(normalPrev, normalNext).normalize();

            let miterFactor = 1;
            const dot = normalPrev.dot(normalNext);
            if (dot > -0.99) {
                miterFactor = 1 / Math.sqrt((1 + dot) / 2);
                if (miterFactor > 4) miterFactor = 4; // limit spike
            }

            const offsetVec = avgNormal.multiplyScalar(halfThickness * miterFactor);

            const left = new THREE.Vector3().addVectors(current, offsetVec);
            const right = new THREE.Vector3().subVectors(current, offsetVec);

            leftOffset.push(new Vector3(left.x, left.y, left.z));
            rightOffset.push(new Vector3(right.x, right.y, right.z));
        }

        const polygonVertices = [...leftOffset];
        for (let i = n - 1; i >= 0; i--) {
            polygonVertices.push(rightOffset[i]);
        }
        return polygonVertices;
    }

    setOPMaterial(): void { }
}
