import * as THREE from "three";
import { IShape } from "../../shapes/base-type";
import { ElementType } from "../base-type";
import { Polygon, Polyline, Vector3 } from "opengeometry";

export enum DoubleDoorMaterial {
    WOOD = "WOOD",
    METAL = "METAL",
    GLASS = "GLASS"
}

export interface DoubleDoorOptions {
    ogid?: string;
    labelName: string;
    type: ElementType.DOOR;
    doorPosition: { x: number; y: number; z: number };
    frameDimensions: { width: number; height?: number; thickness: number };
    doorDimensions: { width: number; height?: number; thickness: number };
    mullionWidth: number;
    frameColor: number;
    doorColor: number;
    leftSwingRotation: number;
    rightSwingRotation: number;
    doorMaterial: DoubleDoorMaterial;
}

export class DoubleDoor2D extends Polyline implements IShape {
    ogType: string = ElementType.DOOR;
    subElements: Map<string, THREE.Object3D> = new Map();
    selected: boolean = false;
    edit: boolean = false;
    locked: boolean = false;

    propertySet: DoubleDoorOptions = {
        labelName: "Double Door",
        type: ElementType.DOOR,
        doorPosition: { x: 0, y: 0, z: 0 },
        doorDimensions: { width: 1.5, height: 1, thickness: 0.2 },
        frameDimensions: { width: 0.2, height: 1, thickness: 0.2 },
        mullionWidth: 0.1,
        frameColor: 0x000000,
        doorColor: 0xc7c7c7,
        leftSwingRotation: 0,
        rightSwingRotation: 0,
        doorMaterial: DoubleDoorMaterial.WOOD
    };

    // Getter Setter
    get labelName() {
        return this.propertySet.labelName;
    }

    set labelName(value: string) {
        this.propertySet.labelName = value;
    }

    get doorPosition() {
        return this.propertySet.doorPosition;
    }

    set doorPosition(value: { x: number; y: number; z: number }) {
        this.propertySet.doorPosition = value;
    }

    get frameDimensions() {
        return this.propertySet.frameDimensions;
    }

    set frameDimensions(value: { width: number; height?: number; thickness: number }) {
        this.propertySet.frameDimensions = value;
        this.setOPGeometry();
    }

    get doorDimensions() {
        return this.propertySet.doorDimensions;
    }

    set doorDimensions(value: { width: number; height?: number; thickness: number }) {
        this.propertySet.doorDimensions = value;
        this.setOPGeometry();
    }

    get mullionWidth() {
        return this.propertySet.mullionWidth;
    }

    set mullionWidth(value: number) {
        this.propertySet.mullionWidth = value;
        this.setOPGeometry();
    }

    get frameColor() {
        return this.propertySet.frameColor;
    }

    set frameColor(value: number) {
        this.propertySet.frameColor = value;
        const frameLeft = this.subElements.get("frameLeft") as Polygon;
        if (frameLeft) frameLeft.color = value;
        const frameRight = this.subElements.get("frameRight") as Polygon;
        if (frameRight) frameRight.color = value;
        const mullion = this.subElements.get("mullion") as Polygon;
        if (mullion) mullion.color = value;
    }

    get doorColor() {
        return this.propertySet.doorColor;
    }

    set doorColor(value: number) {
        this.propertySet.doorColor = value;
        const leftDoor = this.subElements.get("leftDoor") as Polygon;
        if (leftDoor) leftDoor.color = value;
        const rightDoor = this.subElements.get("rightDoor") as Polygon;
        if (rightDoor) rightDoor.color = value;
    }

    get leftSwingRotation() {
        return this.propertySet.leftSwingRotation;
    }

    set leftSwingRotation(value: number) {
        this.propertySet.leftSwingRotation = value;
        const leftHinge = this.subElements.get("leftDoorHinge") as THREE.Mesh;
        if (leftHinge) leftHinge.rotation.y = THREE.MathUtils.degToRad(value);
    }

    get rightSwingRotation() {
        return this.propertySet.rightSwingRotation;
    }

    set rightSwingRotation(value: number) {
        this.propertySet.rightSwingRotation = value;
        const rightHinge = this.subElements.get("rightDoorHinge") as THREE.Mesh;
        if (rightHinge) rightHinge.rotation.y = THREE.MathUtils.degToRad(-value);
    }

    get doorMaterial() {
        return this.propertySet.doorMaterial;
    }

    set doorMaterial(value: DoubleDoorMaterial) {
        this.propertySet.doorMaterial = value;
    }

    constructor(doorConfig?: Partial<DoubleDoorOptions>) {
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
        if (config) {
            this.propertySet = { ...this.propertySet, ...config };
            this.setOPGeometry();
        }
    }

    getOPConfig(): Record<string, any> {
        return this.propertySet;
    }

    setOPGeometry(): void {
        const { doorDimensions, mullionWidth } = this.propertySet;
        const totalWidth = doorDimensions.width * 2 + mullionWidth;

        const vertices = [
            new Vector3(totalWidth / 2, 0, doorDimensions.thickness / 2),
            new Vector3(totalWidth / 2, 0, -doorDimensions.thickness / 2),
            new Vector3(-totalWidth / 2, 0, -doorDimensions.thickness / 2),
            new Vector3(-totalWidth / 2, 0, doorDimensions.thickness / 2),
            new Vector3(totalWidth / 2, 0, doorDimensions.thickness / 2)
        ];

        this.setConfig({
            points: vertices,
            color: 0x0000ff
        });

        // Create frame geometry
        this.createFrameGeometry();

        // Create mullion (center divider)
        this.createMullionGeometry();

        // Create left door
        this.createLeftDoorGeometry();

        // Create right door
        this.createRightDoorGeometry();
    }

    private createLeftDoorHingeGeometry() {
        if (this.subElements.has("leftDoorHinge")) {
            const hinge = this.subElements.get("leftDoorHinge") as THREE.Mesh;
            hinge.geometry.dispose();
            hinge?.removeFromParent();
        }

        const { doorDimensions, mullionWidth } = this.propertySet;

        const hingeGeom = new THREE.SphereGeometry(0.01, 2, 2);
        const hingeMaterial = new THREE.MeshDepthMaterial({ transparent: true, opacity: 0 });
        const hingeMesh = new THREE.Mesh(hingeGeom, hingeMaterial);

        // Position at the left outer edge
        hingeMesh.position.set(
            -mullionWidth / 2 - doorDimensions.width,
            0,
            -doorDimensions.thickness / 2
        );
        hingeMesh.rotation.y = THREE.MathUtils.degToRad(this.propertySet.leftSwingRotation);

        this.subElements.set("leftDoorHinge", hingeMesh);
        this.add(hingeMesh);
    }

    private createRightDoorHingeGeometry() {
        if (this.subElements.has("rightDoorHinge")) {
            const hinge = this.subElements.get("rightDoorHinge") as THREE.Mesh;
            hinge.geometry.dispose();
            hinge?.removeFromParent();
        }

        const { doorDimensions, mullionWidth } = this.propertySet;

        const hingeGeom = new THREE.SphereGeometry(0.01, 2, 2);
        const hingeMaterial = new THREE.MeshDepthMaterial({ transparent: true, opacity: 0 });
        const hingeMesh = new THREE.Mesh(hingeGeom, hingeMaterial);

        // Position at the right outer edge
        hingeMesh.position.set(
            mullionWidth / 2 + doorDimensions.width,
            0,
            -doorDimensions.thickness / 2
        );
        hingeMesh.rotation.y = THREE.MathUtils.degToRad(-this.propertySet.rightSwingRotation);

        this.subElements.set("rightDoorHinge", hingeMesh);
        this.add(hingeMesh);
    }

    private createLeftDoorGeometry() {
        this.createLeftDoorHingeGeometry();

        if (this.subElements.has("leftDoor")) {
            const door = this.subElements.get("leftDoor") as Polygon;
            door?.removeFromParent();
            door?.dispose();
        }

        const { doorDimensions } = this.propertySet;

        const doorPoly = new Polygon({
            vertices: [
                new Vector3(0, 0, 0),
                new Vector3(0, 0, doorDimensions.thickness),
                new Vector3(doorDimensions.width, 0, doorDimensions.thickness),
                new Vector3(doorDimensions.width, 0, 0)
            ],
            color: this.doorColor
        });
        doorPoly.outline = true;

        this.subElements.set("leftDoor", doorPoly);

        const leftHinge = this.subElements.get("leftDoorHinge") as THREE.Mesh;
        leftHinge.add(doorPoly);
    }

    private createRightDoorGeometry() {
        this.createRightDoorHingeGeometry();

        if (this.subElements.has("rightDoor")) {
            const door = this.subElements.get("rightDoor") as Polygon;
            door?.removeFromParent();
            door?.dispose();
        }

        const { doorDimensions } = this.propertySet;

        const doorPoly = new Polygon({
            vertices: [
                new Vector3(0, 0, 0),
                new Vector3(0, 0, doorDimensions.thickness),
                new Vector3(-doorDimensions.width, 0, doorDimensions.thickness),
                new Vector3(-doorDimensions.width, 0, 0)
            ],
            color: this.doorColor
        });
        doorPoly.outline = true;

        this.subElements.set("rightDoor", doorPoly);

        const rightHinge = this.subElements.get("rightDoorHinge") as THREE.Mesh;
        rightHinge.add(doorPoly);
    }

    private createMullionGeometry() {
        if (this.subElements.has("mullion")) {
            const mullion = this.subElements.get("mullion") as Polygon;
            mullion?.removeFromParent();
            mullion?.dispose();
        }

        const { mullionWidth, doorDimensions } = this.propertySet;

        const mullionPoly = new Polygon({
            vertices: [
                new Vector3(-mullionWidth / 2, 0, -doorDimensions.thickness / 2),
                new Vector3(-mullionWidth / 2, 0, doorDimensions.thickness / 2),
                new Vector3(mullionWidth / 2, 0, doorDimensions.thickness / 2),
                new Vector3(mullionWidth / 2, 0, -doorDimensions.thickness / 2)
            ],
            color: this.frameColor
        });

        this.subElements.set("mullion", mullionPoly);
        this.add(mullionPoly);
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

        const { frameDimensions, doorDimensions, mullionWidth } = this.propertySet;
        const totalWidth = doorDimensions.width * 2 + mullionWidth;

        const frameLeftPoly = new Polygon({
            vertices: [
                new Vector3(-frameDimensions.width / 2, 0, -frameDimensions.thickness / 2),
                new Vector3(-frameDimensions.width / 2, 0, frameDimensions.thickness / 2),
                new Vector3(frameDimensions.width / 2, 0, frameDimensions.thickness / 2),
                new Vector3(frameDimensions.width / 2, 0, -frameDimensions.thickness / 2)
            ],
            color: this.frameColor
        });

        frameLeftPoly.position.set(-totalWidth / 2 - frameDimensions.width / 2, 0, 0);

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

        frameRightPoly.position.set(totalWidth / 2 + frameDimensions.width / 2, 0, 0);
        this.subElements.set("frameRight", frameRightPoly);
        this.add(frameRightPoly);
    }

    setOPMaterial(): void {
        // Implementation here
    }
}
