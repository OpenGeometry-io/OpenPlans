import * as THREE from "three";
import { IShape } from "../../shapes/base-type";
import { ElementType } from "../base-type";
import { Polygon, Polyline, Vector3 } from "../../kernel";

export enum DoorMaterial {
    WOOD = "WOOD",
    METAL = "METAL",
    GLASS = "GLASS"
}

// TODO: Can the 2D Door Options be used for 3D Doors as well
export interface DoorOptions {
    ogid?: string;
    labelName: string;
    type: ElementType.DOOR;
    doorPosition: { x: number; y: number; z: number };
    frameDimensions: { width: number; height?: number; thickness: number };
    doorDimensions: { width: number; height?: number; thickness: number };
    frameColor: number;
    doorColor: number;
    swingRotation: number;
    isOpen: boolean;
    doorMaterial: DoorMaterial;
}

// TODO: Should extend Opening or 2DLineOpening Element instead of Polyline Boundary
export class Door2D extends Polyline implements IShape {
    ogType: string = ElementType.DOOR;
    subElements: Map<string, THREE.Object3D> = new Map();
    selected: boolean = false;
    edit: boolean = false;
    locked: boolean = false;

    propertySet: DoorOptions = {
        labelName: "Your Awesome Door",
        type: ElementType.DOOR,
        doorPosition: { x: 0, y: 0, z: 0 },
        doorDimensions: { width: 2, height: 1, thickness: 0.2 },
        frameDimensions: { width: 0.2, height: 1, thickness: 0.2 },
        frameColor: 0x000000,
        doorColor: 0xc7c7c7,
        swingRotation: 0,
        isOpen: false,
        doorMaterial: DoorMaterial.WOOD
    };

    // Getter Setter
    get labelName() {
        return this.propertySet.labelName;
    }

    /**
     * The name of the door element.
     */
    set labelName(value: string) {
        this.propertySet.labelName = value;
    }

    get doorPosition() {
        return this.propertySet.doorPosition;
    }

    /**
     * The position of the door in 3D space.
     */
    set doorPosition(value: { x: number; y: number; z: number }) {
        this.propertySet.doorPosition = value;
    }

    get frameDimensions() {
        return this.propertySet.frameDimensions;
    }

    /**
     * The dimensions of the door frame.
     */
    set frameDimensions(value: { width: number; height?: number; thickness: number }) {
        this.propertySet.frameDimensions = value;
        this.setOPGeometry();
    }

    get doorDimensions() {
        return this.propertySet.doorDimensions;
    }

    /**
     * The dimensions of the door.
     */
    set doorDimensions(value: { width: number; height?: number; thickness: number }) {
        this.propertySet.doorDimensions = value;
        this.setOPGeometry();
    }

    get frameColor() {
        return this.propertySet.frameColor;
    }

    /**
     * The color of the door frame.
     */
    set frameColor(value: number) {
        this.propertySet.frameColor = value;
        const frameLeft = this.subElements.get("frameLeft") as Polygon;
        frameLeft.color = value;
        const frameRight = this.subElements.get("frameRight") as Polygon;
        frameRight.color = value;
    }

    get doorColor() {
        return this.propertySet.doorColor;
    }

    /**
     * The color of the door.
     */
    set doorColor(value: number) {
        this.propertySet.doorColor = value;
        const door = this.subElements.get("door") as Polygon;
        door.color = value;
    }

    get swingRotation() {
        return this.propertySet.swingRotation;
    }

    /**
     * The rotation of the door swing.
     */
    set swingRotation(value: number) {
        this.propertySet.swingRotation = value;
        const doorHinge = this.subElements.get("doorHinge") as THREE.Mesh;
        doorHinge.rotation.y = THREE.MathUtils.degToRad(value);
    }

    get isOpen() {
        return this.propertySet.isOpen;
    }

    /**
     * Whether the door is currently open.
     */
    set isOpen(value: boolean) {
        this.propertySet.isOpen = value;
    }

    get doorMaterial() {
        return this.propertySet.doorMaterial;
    }

    /**
     * The material of the door (e.g., wood, metal).
     */
    set doorMaterial(value: DoorMaterial) {
        this.propertySet.doorMaterial = value;
    }

    constructor(doorConfig?: Partial<DoorOptions>) {
        super({
            ogid: doorConfig?.ogid,
            points: [],
            color: 0
        });

        this.subElements = new Map<string, THREE.Object3D>();

        if (doorConfig) {
            this.propertySet = { ...this.propertySet, ...doorConfig };
        }

        this.propertySet.ogid = this.ogid;
        this.setOPGeometry();
    }

    setOPConfig(config: Record<string, any>): void {
        // Implementation here
    }

    getOPConfig(): Record<string, any> {
        // Implementation here
        return {};
    }

    setOPGeometry(): void {
        const { doorDimensions } = this.propertySet;

        const vertices = [
            new Vector3(doorDimensions.width / 2, 0, doorDimensions.thickness / 2),
            new Vector3(doorDimensions.width / 2, 0, -doorDimensions.thickness / 2),
            new Vector3(-doorDimensions.width / 2, 0, -doorDimensions.thickness / 2),
            new Vector3(-doorDimensions.width / 2, 0, doorDimensions.thickness / 2),
            new Vector3(doorDimensions.width / 2, 0, doorDimensions.thickness / 2)
        ];

        this.setConfig({
            points: vertices,
            color: 0x0000ff
        });

        // Related Geometry Creation
        // Frame
        this.createFrameGeometry();
        
        // Door
        this.createDoorGeometry();
    }

    private createDoorHingeGeometry() {
        if (this.subElements.has("doorHinge")) {
            const doorHinge = this.subElements.get("doorHinge") as THREE.Mesh;
            doorHinge.geometry.dispose();
            doorHinge?.removeFromParent();
        }

        const { doorDimensions } = this.propertySet;

        const doorHinge = new THREE.SphereGeometry(0.01, 2, 2);
        const doorHingeMaterial = new THREE.MeshDepthMaterial({ transparent: true, opacity: 0 });
        const doorHingeMesh = new THREE.Mesh(doorHinge, doorHingeMaterial);
        doorHingeMesh.position.set(-doorDimensions.width / 2, 0, -doorDimensions.thickness / 2);
        doorHingeMesh.rotation.y = THREE.MathUtils.degToRad(this.propertySet.swingRotation);
        this.subElements.set("doorHinge", doorHingeMesh);
        this.add(doorHingeMesh);
    }

    private createDoorGeometry() {
        // Door Hinge
        this.createDoorHingeGeometry();

        if (this.subElements.has("door")) {
            const door = this.subElements.get("door") as Polygon;
            door?.removeFromParent();
            door?.dispose();
        }

        const { doorDimensions } = this.propertySet;

        const doorPoly = new Polygon({
            vertices: [
                new Vector3(-doorDimensions.width / 2, 0, -doorDimensions.thickness / 2),
                new Vector3(-doorDimensions.width / 2, 0, doorDimensions.thickness / 2),
                new Vector3(doorDimensions.width / 2, 0, doorDimensions.thickness / 2),
                new Vector3(doorDimensions.width / 2, 0, -doorDimensions.thickness / 2)
            ],
            color: this.doorColor
        });
        doorPoly.outline = true;
        doorPoly.position.set(doorDimensions.width / 2, 0, doorDimensions.thickness / 2);
        this.subElements.set("door", doorPoly);

        const doorHinge = this.subElements.get("doorHinge") as THREE.Mesh;
        doorHinge.add(doorPoly);
    }

    private createFrameGeometry() {
        if (this.subElements.has("frameLeft")) {
            const frame = this.subElements.get("frameLeft") as Polygon;
            frame?.removeFromParent();
            frame?.dispose();
        }

        if (this.subElements.has("frameRight")) {
            const frame = this.subElements.get("frameRight") as Polygon;
            frame?.removeFromParent();
            frame?.dispose();
        }

        const { frameDimensions, doorDimensions } = this.propertySet;

        const frameLeftPoly = new Polygon({
            vertices: [
                new Vector3(-frameDimensions.width / 2, 0, -frameDimensions.thickness / 2),
                new Vector3(-frameDimensions.width / 2, 0, frameDimensions.thickness / 2),
                new Vector3(frameDimensions.width / 2, 0, frameDimensions.thickness / 2),
                new Vector3(frameDimensions.width / 2, 0, -frameDimensions.thickness / 2)
            ],
            color: this.frameColor
        });

        frameLeftPoly.position.set(-doorDimensions.width / 2 - frameDimensions.width / 2, 0, 0);

        this.subElements.set("frameLeft", frameLeftPoly);
        this.add(frameLeftPoly);

        // Frame Right
        const frameRightPoly = new Polygon({
            vertices: [
                new Vector3(-frameDimensions.width / 2, 0, -frameDimensions.thickness / 2),
                new Vector3(-frameDimensions.width / 2, 0, frameDimensions.thickness / 2),
                new Vector3(frameDimensions.width / 2, 0, frameDimensions.thickness / 2),
                new Vector3(frameDimensions.width / 2, 0, -frameDimensions.thickness / 2)
            ],
            color: this.frameColor
        });

        frameRightPoly.position.set(doorDimensions.width / 2 + frameDimensions.width / 2, 0, 0);
        this.subElements.set("frameRight", frameRightPoly);
        this.add(frameRightPoly);
    }

    setOPMaterial(): void {
        // Implementation here
    }
}

// Example
// const door = new Door2D();
// door.labelName = "Front Door";
// door.doorPosition = { x: 0, y: 0, z: 0 };
// door.frameDimensions = { width: 1, height: 2, depth: 0.1 };
// door.doorDimensions = { width: 0.8, height: 2, thickness: 0.1 };
// door.frameColor = 0x000000;
// door.doorColor = 0xff0000;
// door.swingRotation = 0;
// door.isOpen = false;
// door.doorMaterial = DoorMaterial.WOOD;
