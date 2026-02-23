import { Arc, Vector3, Line } from "../kernel/";
import * as THREE from "three";
import { IPrimitive } from "../primitives/base-type";
import { Glyphs } from "@opengeometry/openglyph";

export interface AngleDimensionOptions {
    ogid?: string;
    center: Array<number>;
    vector1: Array<number>; // Direction vector 1
    vector2: Array<number>; // Direction vector 2
    radius: number;
    color: number;
    label?: string; // Optional, if not provided, calculates angle
    fontSize: number;
    fontColor: number;
    font?: string;
    lineWidth: number;
    textOffset?: number; // Distance between arc and label
    opposite?: boolean; // New flag for vertically opposite angles
}

export class AngleDimension extends Arc implements IPrimitive {
    ogType: string = 'AngleDimension';
    subNodes: Map<string, THREE.Object3D>;

    selected: boolean = false;
    edit: boolean = false;

    propertySet: AngleDimensionOptions = {
        center: [0, 0, 0],
        vector1: [1, 0, 0],
        vector2: [0, 1, 0],
        radius: 2,
        color: 0x000000,
        fontSize: 2,
        fontColor: 0x000000,
        font: undefined,
        lineWidth: 2,
        textOffset: 0.2,
        opposite: false,
    };

    set center(value: Array<number>) {
        this.propertySet.center = value;
        this.setOPGeometry();
    }

    get center(): Array<number> {
        return this.propertySet.center;
    }

    set vector1(value: Array<number>) {
        this.propertySet.vector1 = value;
        this.setOPGeometry();
    }

    get vector1(): Array<number> {
        return this.propertySet.vector1;
    }

    set vector2(value: Array<number>) {
        this.propertySet.vector2 = value;
        this.setOPGeometry();
    }

    get vector2(): Array<number> {
        return this.propertySet.vector2;
    }

    set radius(value: number) {
        this.propertySet.radius = value;
        this.setOPGeometry();
    }

    get radius(): number {
        return this.propertySet.radius;
    }

    set dimColor(value: number) {
        this.propertySet.color = value;
        this.color = value;
        this.setOPGeometry();
    }

    get dimColor(): number {
        return this.propertySet.color;
    }

    set fontSize(value: number) {
        this.propertySet.fontSize = value;
        this.setOPGeometry();
    }

    get fontSize(): number {
        return this.propertySet.fontSize;
    }

    set fontColor(value: number) {
        this.propertySet.fontColor = value;
        this.setOPGeometry();
    }

    get fontColor(): number {
        return this.propertySet.fontColor;
    }

    set label(value: string | undefined) {
        this.propertySet.label = value;
        this.setOPGeometry();
    }

    get label(): string | undefined {
        return this.propertySet.label;
    }

    set opposite(value: boolean) {
        this.propertySet.opposite = value;
        this.setOPGeometry();
    }

    get opposite(): boolean {
        return this.propertySet.opposite || false;
    }

    set textOffset(value: number) {
        this.propertySet.textOffset = value;
        this.setOPGeometry();
    }

    get textOffset(): number {
        return this.propertySet.textOffset || 0.5;
    }

    constructor(angleDimensionConfig?: AngleDimensionOptions) {
        // Initial Arc setup - placeholders, updated in setOPGeometry
        super({
            ogid: angleDimensionConfig?.ogid,
            center: new Vector3(...(angleDimensionConfig?.center || [0, 0, 0])),
            radius: angleDimensionConfig?.radius || 2,
            startAngle: 0,
            endAngle: Math.PI / 2,
            segments: 32,
            color: angleDimensionConfig?.color || 0x000000
        });

        this.subNodes = new Map<string, THREE.Object3D>();

        if (angleDimensionConfig) {
            this.propertySet = { ...this.propertySet, ...angleDimensionConfig };
        }

        this.propertySet.ogid = this.ogid;
        this.setOPGeometry();
    }

    setOPConfig(config: AngleDimensionOptions): void {
        // Implementation for updating config
    }

    getOPConfig(): AngleDimensionOptions {
        return this.propertySet;
    }

    setOPGeometry(): void {
        const { center, vector1, vector2, radius, color, lineWidth, opposite, textOffset } = this.propertySet;

        // Base geometry vectors (physical lines)
        const baseV1 = new Vector3(...vector1);
        const baseV2 = new Vector3(...vector2);

        // Calculation vectors (direction of angle measurement)
        // If opposite, valid angle is between -v1 and -v2
        const calcV1 = opposite ? baseV1.clone().negate().normalize() : baseV1.clone().normalize();
        const calcV2 = opposite ? baseV2.clone().negate().normalize() : baseV2.clone().normalize();

        // Calculate start and end angles
        // Assuming 2D logic on XZ plane for now, consistent with LineDimension logic usually
        // Or generally using atan2(z, x)
        const angle1 = Math.atan2(calcV1.z, calcV1.x);
        const angle2 = Math.atan2(calcV2.z, calcV2.x);

        let startAngle = angle1;
        let endAngle = angle2;

        // Ensure we draw the smaller angle by swapping if needed, or adjusting
        // Usually we want counter-clockwise from start to end?
        // Let's ensure the arc is drawn correctly.
        // If we want the inner angle, the difference should be <= PI.

        let diff = endAngle - startAngle;

        // Normalize diff to -PI to PI
        while (diff <= -Math.PI) diff += 2 * Math.PI;
        while (diff > Math.PI) diff -= 2 * Math.PI;

        if (diff < 0) {
            // Swap to make positive traversal
            const temp = startAngle;
            startAngle = endAngle;
            endAngle = temp;
        }

        // Recalculate diff to be positive
        let sweep = endAngle - startAngle;
        if (sweep < 0) sweep += 2 * Math.PI;

        // If sweep > PI, user might want the reflex angle, OR we picked the wrong order for the inner angle.
        // Usually CAD defaults to inner angle (< 180).
        if (sweep > Math.PI) {
            // We probably want the other way around for the inner angle.
            // But let's stick to the vectors sequence provided unless we enforce inner angle.
            // For now, let's assume standard behavior: Inner angle.
            const temp = startAngle;
            startAngle = endAngle;
            endAngle = temp + 2 * Math.PI;
        }

        this.setConfig({
            center: new Vector3(...center),
            radius: radius,
            startAngle: startAngle,
            endAngle: endAngle,
            segments: 32,
            color: color,
            width: lineWidth,
            fatLines: true // Assuming we want visible lines like LineDimension
        });

        this.createWitnessLines(startAngle, endAngle, baseV1, baseV2);
    }

    createWitnessLines(startAngle: number, endAngle: number, baseV1: Vector3, baseV2: Vector3) {
        // Clear existing witness lines (but keep label to optimize)
        ['witnessLine1', 'witnessLine2', 'arrow1', 'arrow2'].forEach(key => {
            if (this.subNodes.has(key)) {
                const node = this.subNodes.get(key) as THREE.Object3D;
                this.remove(node); // Assuming `remove` works on children
                // If it's a Line from kernel, it might need specific disposal, but THREE.Line just needs removal
                // Check LineDimension for `removeFromParent` usage
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

        const { center, radius, color, lineWidth } = this.propertySet;
        const centerVec = new Vector3(...center);

        // ... (rest of witness line logic is unchanged, skipping for brevity in this replace block if possible, but I need to include context or just replace the start)
        // I will replace the START of createWitnessLines to update the cleanup loop.

        // ... Logic for witness lines ...

        // RE-INSERTING THE LOGIC for witness lines because I can't just skip it in a ReplaceChunk unless I target specific lines.
        // It's better to split this into two ReplaceChunks if possible, or one big one.
        // The file content is around 170 lines for this method.
        // I will try to use a smaller chunk for the cleanup loop.


        // Witness Line Logic
        // Scenario 1: Inside vectors - no specific lines if arc connects them? 
        // Actually standard usually has arrows at ends of arc.

        // Arrows
        // Draw arrows at the end of the arc pointing outwards or inwards?
        // Usually arrows at endpoints of the arc, tangent to the arc.

        // Let's create arrows.
        // Arrow 1 at startAngle
        // Arrow 2 at endAngle

        // Implementation of arrows (Simple cones or lines)
        // For now, let's skip complex arrow geometry and focus on the lines requested.

        // "Scenario 1 - if the angle dimension object is between those two vectors we might not to show witness lines"
        // "Scenario 2 - if the angle dimension is changed and placed on the other side/opposite of the vector lines then witness lines might be needed"

        // How to determine Scen 1 vs 2?
        // It depends on where valid geometry is. Since we only have 'vectors', we assume the geometry is ON these vectors.
        // If the `radius` is large, or if the user intends "opposite", we might need lines.
        // Let's assume: If the Angle Dimension is measuring the *supplementary* or *vertically opposite* angle, we need lines.

        // But given we just calculate the angle between v1 and v2, we are always "between" them in terms of angle.
        // Unless the user explicitly wants the Refex angle?

        // Let's implement basic "extension lines" if the radius is "large" or if configured?
        // Actually, standard CAD:
        // Extension lines are drawn from the center (vertex) to the arc start, but ONLY if the arc is far away? No, that's not right.
        // Extension lines usually extend the *legs* of the angle if the arc is far out.

        // Let's implement: Lines from center to arc start/end? No, that looks like a sector.
        // The user images usually show:
        // Case 1: Arc touches the lines. No extra lines.
        // Case 2: Arc is "opposite". Lines extend BACKWARDS from the vertex? Or lines extend from vertex to arc.

        // Let's implement a simple logic:
        // We always draw "extension lines" from the Center to the Arc Start/End.
        // BUT, we make them "intelligent".
        // If "Smart Mode" is on:
        // Check if we are "inside" the vectors.
        // Use the dot product or similar?
        // Actually, simpler: The user provided NO geometry context, only vectors.
        // So visual feedback is all we have.

        // Let's draw lines from the Center to the Arc ONLY if we are in "Opposite" mode?
        // The requirement says:
        // "Scenario 2 - if the angle dimension is changed and placed on the other side/opposite of the vector lines then witness lines might be needed"

        // This implies we might be measuring the angle "behind" the vertex?
        // i.e. bounded by -v1 and -v2?

        // Let's stick to the given vectors.
        // I will add witness lines from Center to Arc Start/End for now, but purely radial?
        // No, witness lines for angles continue the vector line.

        const startPointOnArc = new Vector3(
            centerVec.x + radius * Math.cos(startAngle),
            centerVec.y,
            centerVec.z + radius * Math.sin(startAngle)
        );

        const endPointOnArc = new Vector3(
            centerVec.x + radius * Math.cos(endAngle),
            centerVec.y,
            centerVec.z + radius * Math.sin(endAngle)
        );

        // Create Witness Lines (radial extensions)
        // Only if we want them. Let's add them by default for "Scenario 2" visualization, 
        // but maybe hide them if "Scenario 1" (radius small?)
        // Let's use a heuristic: Always add them, but maybe they are the vectors themselves?
        // The user said "between those two vectors we might not show witness lines".
        // This implies if there is already a line there, don't draw over it.
        // But we don't know if there is a line.

        // I'll add "Extension Lines" property? Or just draw them.
        // Let's draw them from Center to Arc.

        // Extension Lines (Witness Lines) Logic
        // Check if physical geometry covers the witness line path

        const checkCoverage = (angle: number, geometryVec: Vector3): boolean => {
            const witnessDir = new Vector3(Math.cos(angle), 0, Math.sin(angle));
            const geomDir = geometryVec.clone().normalize();

            // Check direction (Dot > 0.99 for parallel/same-direction)
            // Relax tolerance slightly for floating point
            const isSameDir = witnessDir.dot(geomDir) > 0.99;

            // Check length
            const isLongEnough = geometryVec.length() >= radius;

            return isSameDir && isLongEnough;
        };

        const isStartCoveredByV1 = checkCoverage(startAngle, baseV1);
        const isStartCoveredByV2 = checkCoverage(startAngle, baseV2);
        const startCovered = isStartCoveredByV1 || isStartCoveredByV2;

        const isEndCoveredByV1 = checkCoverage(endAngle, baseV1);
        const isEndCoveredByV2 = checkCoverage(endAngle, baseV2);
        const endCovered = isEndCoveredByV1 || isEndCoveredByV2;

        // Draw Witness Line 1 (Start) if not covered
        if (!startCovered) {
            const witnessLine1 = new Line({
                start: centerVec,
                end: startPointOnArc,
                color: color,
                width: lineWidth ? lineWidth / 2 : 1, // Thinner
                fatLines: true
            });
            this.subNodes.set('witnessLine1', witnessLine1);
            this.add(witnessLine1);
        }

        // Draw Witness Line 2 (End) if not covered
        if (!endCovered) {
            const witnessLine2 = new Line({
                start: centerVec,
                end: endPointOnArc,
                color: color,
                width: lineWidth ? lineWidth / 2 : 1,
                fatLines: true
            });
            this.subNodes.set('witnessLine2', witnessLine2);
            this.add(witnessLine2);
        }

        // Calculate Label Position (Midpoint of Arc)
        const midAngle = (startAngle + endAngle) / 2;
        // Handle the wraparound case for midAngle if needed?
        // Since we ensured start < end (or consistent sweep), simple average works.

        // Stick to arc line: exact radius + offset
        const offset = this.propertySet.textOffset !== undefined ? this.propertySet.textOffset : 0.5;
        const labelPos = new Vector3(
            centerVec.x + (radius + offset) * Math.cos(midAngle),
            centerVec.y,
            centerVec.z + (radius + offset) * Math.sin(midAngle)
        );

        // Calculate Degrees
        const degrees = Math.round(((endAngle - startAngle) * 180 / Math.PI));
        const labelText = this.propertySet.label || `${degrees}°`;

        this.createLabel(labelPos, midAngle, labelText);
    }

    createLabel(position: { x: number; y: number; z: number }, angleY: number, text: string) {
        let label = this.subNodes.get("label") as THREE.Object3D;

        const shouldRecreate = !label || label.userData.text !== text ||
            label.userData.fontSize !== this.propertySet.fontSize ||
            label.userData.fontColor !== this.propertySet.fontColor;

        if (shouldRecreate) {
            if (label) {
                this.remove(label);
            }

            label = Glyphs.addGlyph(text, this.propertySet.fontSize, this.propertySet.fontColor, true);
            label.userData = { text: text, fontSize: this.propertySet.fontSize, fontColor: this.propertySet.fontColor };
            this.add(label);
            this.subNodes.set("label", label);
        }

        label.position.set(position.x, position.y, position.z);
        // Rotate label to be readable?
        // Usually we want it horizontal or aligned with tangent?
        // Align with tangent at midpoint.
        // Tangent angle is angleY + PI/2.
        // Text rotation: 
        label.rotation.z = -angleY + Math.PI / 2; // Adjust as needed for generic orientation
    }

    setOPMaterial(): void {

    }
}
