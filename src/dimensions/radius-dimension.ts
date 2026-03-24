import * as THREE from "three";
import { IPrimitive } from "../primitives/base-type";
import { Line, Vector3 as KernelVector3 } from "opengeometry";
import { Glyphs } from "@opengeometry/openglyph";

export interface RadiusDimensionOptions {
    ogid?: string;
    center: Array<number>;
    radius: number;
    angle: number; // Angle in radians
    textOffset?: number;
    color: number;
    label?: string;
    fontSize: number;
    fontColor: number;
    font?: string;
    lineWidth: number;
}

export class RadiusDimension extends THREE.Group implements IPrimitive {
    ogid: string = "";
    ogType: "dimension" = "dimension";
    subNodes: Map<string, THREE.Object3D> = new Map();

    selected: boolean = false;
    edit: boolean = false;

    propertySet: RadiusDimensionOptions = {
        center: [0, 0, 0],
        radius: 1,
        angle: 0,
        textOffset: 0, // Deprecated/Unused for positioning now
        color: 0x000000,
        fontSize: 2,
        fontColor: 0x000000,
        font: undefined,
        lineWidth: 2,
    };

    setOPConfig(config: RadiusDimensionOptions): void {
        this.propertySet = { ...this.propertySet, ...config };
        this.setOPGeometry();
    }

    getOPConfig(): RadiusDimensionOptions {
        return this.propertySet;
    }

    setOPMaterial(): void {
        // Implementation for material updates if needed
    }

    set center(value: Array<number>) {
        this.propertySet.center = value;
        this.setOPGeometry();
    }

    set radius(value: number) {
        this.propertySet.radius = value;
        this.setOPGeometry();
    }

    set angle(value: number) {
        this.propertySet.angle = value;
        this.setOPGeometry();
    }

    set textOffset(value: number) {
        this.propertySet.textOffset = value;
        this.setOPGeometry();
    }

    set dimColor(value: number) {
        this.propertySet.color = value;
        this.setOPGeometry();
    }

    set lineWidth(value: number) {
        this.propertySet.lineWidth = value;
        this.setOPGeometry();
    }

    set fontSize(value: number) {
        this.propertySet.fontSize = value;
        this.setOPGeometry();
    }

    set fontColor(value: number) {
        this.propertySet.fontColor = value;
        this.setOPGeometry();
    }

    set label(value: string | undefined) {
        this.propertySet.label = value;
        this.setOPGeometry();
    }

    constructor(config?: RadiusDimensionOptions) {
        super();
        this.ogid = config?.ogid || THREE.MathUtils.generateUUID();
        this.subNodes = new Map<string, THREE.Object3D>();

        if (config) {
            this.propertySet = { ...this.propertySet, ...config };
        }

        this.setOPGeometry();
    }

    setOPGeometry(): void {
        // Clear existing lines (but keep label to optimize)
        ['line', 'arrow'].forEach(key => {
            if (this.subNodes.has(key)) {
                const node = this.subNodes.get(key) as THREE.Object3D;
                this.remove(node);
                if (node instanceof Line) {
                    node.removeFromParent();
                    if ((node as any).discardGeometry) {
                        (node as any).discardGeometry();
                    }
                } else {
                    node.parent?.remove(node);
                }
                this.subNodes.delete(key);
            }
        });

        const { center, radius, angle, color, lineWidth } = this.propertySet;

        // Use THREE.Vector3 for calculations
        const centerVec = new THREE.Vector3(...center);

        // Point on the circle/arc
        const arcPoint = new THREE.Vector3(
            centerVec.x + radius * Math.cos(angle),
            centerVec.y,
            centerVec.z + radius * Math.sin(angle)
        );

        // Witness Line: Center -> Arc
        // Line primitive needs KernelVector3
        const lineStart = new KernelVector3(centerVec.x, centerVec.y, centerVec.z);
        const lineEnd = new KernelVector3(arcPoint.x, arcPoint.y, arcPoint.z);

        const dimLine = new Line({
            start: lineStart,
            end: lineEnd,
            color: color,
            width: lineWidth,
            fatLines: true
        });

        this.subNodes.set('line', dimLine);
        this.add(dimLine);

        // Label Position: Midpoint of the radius line
        // User requested: "text label in center of the radius witness line"
        // AND "above the line with offset of 0.2"
        const midpoint = new THREE.Vector3().addVectors(centerVec, arcPoint).multiplyScalar(0.5);

        // Calculate perpendicular offset in XZ plane
        // Radius direction is (cos(angle), 0, sin(angle))
        // Perpendicular is (-sin(angle), 0, cos(angle))
        const labelOffset = 0.2;
        const perpX = -Math.sin(angle);
        const perpZ = Math.cos(angle);

        const labelPos = new THREE.Vector3(
            midpoint.x + perpX * labelOffset,
            midpoint.y,
            midpoint.z + perpZ * labelOffset
        );

        // Label
        const labelText = this.propertySet.label || `R${radius.toFixed(2)}`;
        this.createLabel(labelPos, angle, labelText);
    }

    createLabel(position: THREE.Vector3, angleY: number, text: string) {
        let label = this.subNodes.get("label") as THREE.Object3D;

        // Check if we can reuse the existing label
        // We reuse if it exists. 
        // Note: If the text content, font size, or color changes, we might need to recreate it.
        // For now, minimizing recreation as requested for performance. 
        // Ideally we should track the current text/style on the object to know if we need to rebuild.
        // But the user specifically asked: "just update the position if label exists".
        // Use a user-added property or just assume if it exists, it's the right text?
        // Let's be safe: If the text matches, we keep it. If not, we recreate.
        // We can store the text on the object userData.

        const shouldRecreate = !label || label.userData.text !== text ||
            label.userData.fontSize !== this.propertySet.fontSize ||
            label.userData.fontColor !== this.propertySet.fontColor;

        if (shouldRecreate) {
            if (label) {
                this.remove(label);
                // Dispose geometry/material if possible? 
                // Glyph geometry disposal handled by Glyphs system or standard THREE cleanup?
                // Assuming standard cleanup for now.
            }

            label = Glyphs.addGlyph(text, this.propertySet.fontSize, this.propertySet.fontColor, true);
            label.userData = { text: text, fontSize: this.propertySet.fontSize, fontColor: this.propertySet.fontColor };
            this.add(label);
            this.subNodes.set("label", label);
        }

        // Always update position and rotation
        label.position.set(position.x, position.y, position.z);
        label.rotation.z = -angleY;
    }
}
