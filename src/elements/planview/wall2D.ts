import * as THREE from "three";
import { IShape } from "../../shapes/base-type";
import { ElementType } from "../base-type";
import { Polygon, Polyline, Vector3 } from "../../kernel";

export enum WallHatchPattern {
    NONE = "NONE",
    ANSI31 = "ANSI31",
    ANSI32 = "ANSI32"
}

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
    wallHatchPattern: WallHatchPattern;
    wallHatchColor: number;
}

interface HatchPoint2D {
    x: number;
    y: number;
}

interface HatchSegment2D {
    start: HatchPoint2D;
    end: HatchPoint2D;
}

export class Wall2D extends Polyline implements IShape {
    private static readonly HATCH_SPACING = 0.2;
    private static readonly HATCH_Y_OFFSET = 0.002;
    private static readonly HATCH_EPSILON = 1e-6;

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
        wallHeight: 3.0,
        wallHatchPattern: WallHatchPattern.NONE,
        wallHatchColor: 0x000000
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

    get wallHatchPattern() { return this.propertySet.wallHatchPattern; }
    set wallHatchPattern(value: WallHatchPattern) {
        this.propertySet.wallHatchPattern = this.normalizeHatchPattern(value);
        this.setOPGeometry();
    }

    get wallHatchColor() { return this.propertySet.wallHatchColor; }
    set wallHatchColor(value: number) {
        this.propertySet.wallHatchColor = value;
        this.setOPGeometry();
    }

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

        this.propertySet.wallHatchPattern = this.normalizeHatchPattern(this.propertySet.wallHatchPattern);
        this.propertySet.ogid = this.ogid;
        this.setOPGeometry();
    }

    setOPConfig(config: Record<string, any>): void {
        if (!config) return;

        const normalizedConfig: Record<string, any> = { ...config };
        if (config.points) {
            normalizedConfig.points = config.points.map((p: any) => ({ x: p.x, y: p.y, z: p.z }));
        }

        this.propertySet = { ...this.propertySet, ...normalizedConfig } as WallOptions;
        this.propertySet.wallHatchPattern = this.normalizeHatchPattern(this.propertySet.wallHatchPattern);

        const vectorPoints = this.propertySet.points.map((p) => new Vector3(p.x, p.y, p.z));
        this.setConfig({
            points: vectorPoints,
            color: this.propertySet.wallColor
        });
        this.setOPGeometry();
    }
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
                poly?.dispose();
                this.subElements.delete("wallPolygon");
            }
            this.clearHatchGeometry();
            return;
        }

        const vectorPoints = points.map(p => new Vector3(p.x, p.y, p.z));
        const polygonVertices = this.computeOffsetPolygonVertices(vectorPoints, this.propertySet.wallThickness);
        const hatchPolygon2D = this.getPolygon2D(polygonVertices);

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

        this.clearHatchGeometry();
        this.applyHatchPattern(hatchPolygon2D);
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

    private normalizeHatchPattern(pattern: WallHatchPattern | string | undefined): WallHatchPattern {
        if (pattern === WallHatchPattern.ANSI31) return WallHatchPattern.ANSI31;
        if (pattern === WallHatchPattern.ANSI32) return WallHatchPattern.ANSI32;
        return WallHatchPattern.NONE;
    }

    private clearHatchGeometry(): void {
        for (const [key, element] of this.subElements.entries()) {
            if (!key.startsWith("wallHatch")) continue;

            element.removeFromParent();

            if (element instanceof THREE.LineSegments) {
                element.geometry.dispose();
                if (Array.isArray(element.material)) {
                    element.material.forEach((material) => material.dispose());
                } else {
                    element.material.dispose();
                }
            }

            this.subElements.delete(key);
        }
    }

    private getPolygon2D(polygonVertices: Vector3[]): HatchPoint2D[] {
        return polygonVertices.map((vertex) => ({ x: vertex.x, y: vertex.z }));
    }

    private applyHatchPattern(polygon2D: HatchPoint2D[]): void {
        const pattern = this.normalizeHatchPattern(this.propertySet.wallHatchPattern);
        if (pattern === WallHatchPattern.NONE) return;

        const ansi31Segments = this.buildHatchSegments(polygon2D, 45, Wall2D.HATCH_SPACING);
        this.createHatchLineSegments("wallHatchAnsi31", ansi31Segments);

        if (pattern === WallHatchPattern.ANSI32) {
            const ansi32Segments = this.buildHatchSegments(polygon2D, -45, Wall2D.HATCH_SPACING);
            this.createHatchLineSegments("wallHatchAnsi32", ansi32Segments);
        }
    }

    private buildHatchSegments(polygon2D: HatchPoint2D[], angleDeg: number, spacing: number): HatchSegment2D[] {
        if (polygon2D.length < 3) return [];

        const theta = THREE.MathUtils.degToRad(angleDeg);
        const dir = new THREE.Vector2(Math.cos(theta), Math.sin(theta)).normalize();
        const normal = new THREE.Vector2(-dir.y, dir.x).normalize();

        let minProjection = Number.POSITIVE_INFINITY;
        let maxProjection = Number.NEGATIVE_INFINITY;

        for (const point of polygon2D) {
            const projected = point.x * normal.x + point.y * normal.y;
            minProjection = Math.min(minProjection, projected);
            maxProjection = Math.max(maxProjection, projected);
        }

        const startProjection = Math.floor(minProjection / spacing) * spacing;
        const endProjection = Math.ceil(maxProjection / spacing) * spacing;
        const segments: HatchSegment2D[] = [];

        for (let sweep = startProjection; sweep <= endProjection + Wall2D.HATCH_EPSILON; sweep += spacing) {
            const intersections: HatchPoint2D[] = [];
            for (let index = 0; index < polygon2D.length; index++) {
                const current = polygon2D[index];
                const next = polygon2D[(index + 1) % polygon2D.length];

                const currentDistance = current.x * normal.x + current.y * normal.y - sweep;
                const nextDistance = next.x * normal.x + next.y * normal.y - sweep;

                if (Math.abs(currentDistance) < Wall2D.HATCH_EPSILON && Math.abs(nextDistance) < Wall2D.HATCH_EPSILON) {
                    intersections.push({ x: current.x, y: current.y }, { x: next.x, y: next.y });
                    continue;
                }

                if ((currentDistance > 0 && nextDistance > 0) || (currentDistance < 0 && nextDistance < 0)) {
                    continue;
                }

                const denominator = currentDistance - nextDistance;
                if (Math.abs(denominator) < Wall2D.HATCH_EPSILON) continue;

                const t = currentDistance / denominator;
                if (t < -Wall2D.HATCH_EPSILON || t > 1 + Wall2D.HATCH_EPSILON) continue;

                const clampedT = THREE.MathUtils.clamp(t, 0, 1);
                intersections.push({
                    x: current.x + (next.x - current.x) * clampedT,
                    y: current.y + (next.y - current.y) * clampedT
                });
            }

            const uniqueIntersections = this.deduplicateIntersections(intersections, dir);
            if (uniqueIntersections.length < 2) continue;

            for (let i = 0; i + 1 < uniqueIntersections.length; i += 2) {
                const start = uniqueIntersections[i];
                const end = uniqueIntersections[i + 1];
                const length = Math.hypot(end.x - start.x, end.y - start.y);
                if (length <= Wall2D.HATCH_EPSILON) continue;
                segments.push({ start, end });
            }
        }

        return segments;
    }

    private deduplicateIntersections(intersections: HatchPoint2D[], direction: THREE.Vector2): HatchPoint2D[] {
        const sorted = intersections
            .map((point) => ({
                point,
                scalar: point.x * direction.x + point.y * direction.y
            }))
            .sort((a, b) => a.scalar - b.scalar);

        const unique: HatchPoint2D[] = [];
        for (const entry of sorted) {
            const previous = unique[unique.length - 1];
            if (!previous) {
                unique.push(entry.point);
                continue;
            }

            const distance = Math.hypot(entry.point.x - previous.x, entry.point.y - previous.y);
            if (distance > Wall2D.HATCH_EPSILON) {
                unique.push(entry.point);
            }
        }
        return unique;
    }

    private createHatchLineSegments(key: string, segments: HatchSegment2D[]): void {
        if (segments.length === 0) return;

        const positions: number[] = [];
        for (const segment of segments) {
            positions.push(segment.start.x, Wall2D.HATCH_Y_OFFSET, segment.start.y);
            positions.push(segment.end.x, Wall2D.HATCH_Y_OFFSET, segment.end.y);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));

        const material = new THREE.LineBasicMaterial({ color: this.propertySet.wallHatchColor });
        const hatchLines = new THREE.LineSegments(geometry, material);
        hatchLines.renderOrder = 10;

        this.subElements.set(key, hatchLines);
        this.add(hatchLines);
    }

    setOPMaterial(): void { }
}
