import * as THREE from "three";
import { IShape } from "../../shapes/base-type";
import { ElementType } from "../base-type";
import { Polygon, Polyline, Vector3 } from "../../kernel";

export enum StairDirection {
    UP = "UP",
    DOWN = "DOWN"
}

export interface StairOptions {
    ogid?: string;
    labelName: string;
    type: ElementType.STAIR;
    stairPosition: { x: number; y: number; z: number };
    stairDimensions: { width: number; length: number };
    numberOfSteps: number;
    direction: StairDirection;
    stairColor: number;
    arrowColor: number;
}

export class Stair2D extends Polyline implements IShape {
    ogType: string = ElementType.STAIR;
    subElements: Map<string, THREE.Object3D> = new Map();
    selected: boolean = false;
    edit: boolean = false;
    locked: boolean = false;

    propertySet: StairOptions = {
        labelName: "Stair",
        type: ElementType.STAIR,
        stairPosition: { x: 0, y: 0, z: 0 },
        stairDimensions: { width: 1.2, length: 3.0 },
        numberOfSteps: 12,
        direction: StairDirection.UP,
        stairColor: 0x8B7355,
        arrowColor: 0x333333
    };

    // Getter Setter
    get labelName() {
        return this.propertySet.labelName;
    }

    set labelName(value: string) {
        this.propertySet.labelName = value;
    }

    get stairPosition() {
        return this.propertySet.stairPosition;
    }

    set stairPosition(value: { x: number; y: number; z: number }) {
        this.propertySet.stairPosition = value;
    }

    get stairDimensions() {
        return this.propertySet.stairDimensions;
    }

    set stairDimensions(value: { width: number; length: number }) {
        this.propertySet.stairDimensions = value;
        this.setOPGeometry();
    }

    get numberOfSteps() {
        return this.propertySet.numberOfSteps;
    }

    set numberOfSteps(value: number) {
        this.propertySet.numberOfSteps = Math.max(2, Math.floor(value));
        this.setOPGeometry();
    }

    get direction() {
        return this.propertySet.direction;
    }

    set direction(value: StairDirection) {
        this.propertySet.direction = value;
        this.setOPGeometry();
    }

    get stairColor() {
        return this.propertySet.stairColor;
    }

    set stairColor(value: number) {
        this.propertySet.stairColor = value;
        // Update all tread colors
        this.subElements.forEach((element, key) => {
            if (key.startsWith("tread")) {
                (element as Polygon).color = value;
            }
        });
        const boundary = this.subElements.get("boundary") as Polygon;
        if (boundary) boundary.color = value;
    }

    get arrowColor() {
        return this.propertySet.arrowColor;
    }

    set arrowColor(value: number) {
        this.propertySet.arrowColor = value;
        const arrow = this.subElements.get("arrow") as THREE.Group;
        if (arrow) {
            arrow.children.forEach(child => {
                if (child instanceof Polygon) {
                    child.color = value;
                }
            });
        }
    }

    constructor(stairConfig?: Partial<StairOptions>) {
        super({
            ogid: stairConfig?.ogid,
            points: [],
            color: 0
        });

        this.subElements = new Map<string, THREE.Object3D>();

        if (stairConfig) {
            this.propertySet = { ...this.propertySet, ...stairConfig };
        }

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
        // Clear existing sub-elements
        this.subElements.forEach((element) => {
            element.removeFromParent();
            if (element instanceof Polygon) {
                element.dispose();
            }
        });
        this.subElements.clear();

        const { stairDimensions } = this.propertySet;

        const vertices = [
            new Vector3(stairDimensions.length / 2, 0, stairDimensions.width / 2),
            new Vector3(stairDimensions.length / 2, 0, -stairDimensions.width / 2),
            new Vector3(-stairDimensions.length / 2, 0, -stairDimensions.width / 2),
            new Vector3(-stairDimensions.length / 2, 0, stairDimensions.width / 2),
            new Vector3(stairDimensions.length / 2, 0, stairDimensions.width / 2)
        ];

        this.setConfig({
            points: vertices,
            color: 0x0000ff
        });

        // Create stair boundary
        this.createBoundaryGeometry();

        // Create treads (horizontal lines)
        this.createTreadsGeometry();

        // Create direction arrow
        this.createArrowGeometry();
    }

    private createBoundaryGeometry() {
        const { stairDimensions } = this.propertySet;

        const boundaryPoly = new Polygon({
            vertices: [
                new Vector3(-stairDimensions.length / 2, 0, -stairDimensions.width / 2),
                new Vector3(-stairDimensions.length / 2, 0, stairDimensions.width / 2),
                new Vector3(stairDimensions.length / 2, 0, stairDimensions.width / 2),
                new Vector3(stairDimensions.length / 2, 0, -stairDimensions.width / 2)
            ],
            color: this.stairColor
        });
        boundaryPoly.outline = true;

        this.subElements.set("boundary", boundaryPoly);
        this.add(boundaryPoly);
    }

    private createTreadsGeometry() {
        const { stairDimensions, numberOfSteps } = this.propertySet;
        const treadDepth = stairDimensions.length / numberOfSteps;
        const lineThickness = 0.02;

        for (let i = 1; i < numberOfSteps; i++) {
            const xPos = -stairDimensions.length / 2 + i * treadDepth;

            const treadPoly = new Polygon({
                vertices: [
                    new Vector3(-lineThickness / 2, 0, -stairDimensions.width / 2),
                    new Vector3(-lineThickness / 2, 0, stairDimensions.width / 2),
                    new Vector3(lineThickness / 2, 0, stairDimensions.width / 2),
                    new Vector3(lineThickness / 2, 0, -stairDimensions.width / 2)
                ],
                color: 0x000000
            });

            treadPoly.position.set(xPos, 0.001, 0);
            this.subElements.set(`tread${i}`, treadPoly);
            this.add(treadPoly);
        }
    }

    private createArrowGeometry() {
        const { stairDimensions, direction } = this.propertySet;
        const arrowGroup = new THREE.Group();

        const arrowLength = stairDimensions.length * 0.4;
        const arrowWidth = 0.05;
        const arrowHeadSize = 0.15;

        // Arrow shaft
        const shaftPoly = new Polygon({
            vertices: [
                new Vector3(-arrowLength / 2, 0, -arrowWidth / 2),
                new Vector3(-arrowLength / 2, 0, arrowWidth / 2),
                new Vector3(arrowLength / 2 - arrowHeadSize, 0, arrowWidth / 2),
                new Vector3(arrowLength / 2 - arrowHeadSize, 0, -arrowWidth / 2)
            ],
            color: this.arrowColor
        });

        // Arrow head (triangle)
        const headPoly = new Polygon({
            vertices: [
                new Vector3(arrowLength / 2 - arrowHeadSize, 0, -arrowHeadSize / 2),
                new Vector3(arrowLength / 2, 0, 0),
                new Vector3(arrowLength / 2 - arrowHeadSize, 0, arrowHeadSize / 2)
            ],
            color: this.arrowColor
        });

        arrowGroup.add(shaftPoly);
        arrowGroup.add(headPoly);

        // Position arrow at center, slightly above treads
        arrowGroup.position.set(0, 0.002, 0);

        // Rotate arrow based on direction
        if (direction === StairDirection.DOWN) {
            arrowGroup.rotation.y = Math.PI;
        }

        this.subElements.set("arrow", arrowGroup);
        this.add(arrowGroup);
    }

    setOPMaterial(): void {
        // Implementation here
    }
}
