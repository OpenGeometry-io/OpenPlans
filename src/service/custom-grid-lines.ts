import * as THREE from 'three';
import { GlyphNode, Glyphs } from '@opengeometry/openglyph';

export type GridLineAxisLock = 'none' | 'x' | 'z';

export interface GridLinePoint {
  x: number;
  y?: number;
  z: number;
}

export interface GridLineStyle {
  color?: number;
  opacity?: number;
  lineWidth?: number;
  dashed?: boolean;
  dashSize?: number;
  gapSize?: number;
}

export interface GridLineLabel {
  text?: string;
  size?: number;
  color?: number;
  staticZoom?: boolean;
  show?: boolean;
}

export interface CreateGridLineOptions {
  id?: string;
  start: GridLinePoint;
  end: GridLinePoint;
  elevation?: number;
  axisLock?: GridLineAxisLock;
  visible?: boolean;
  locked?: boolean;
  style?: GridLineStyle;
  label?: GridLineLabel;
  metadata?: Record<string, unknown>;
}

export interface UpdateGridLineOptions {
  start?: GridLinePoint;
  end?: GridLinePoint;
  elevation?: number;
  axisLock?: GridLineAxisLock;
  visible?: boolean;
  locked?: boolean;
  style?: GridLineStyle;
  label?: GridLineLabel;
  metadata?: Record<string, unknown>;
}

export interface GridLineData {
  id: string;
  start: THREE.Vector3;
  end: THREE.Vector3;
  axisLock: GridLineAxisLock;
  visible: boolean;
  locked: boolean;
  style: Required<GridLineStyle>;
  label: Required<GridLineLabel>;
  metadata?: Record<string, unknown>;
}

interface GridLineEntity {
  data: GridLineData;
  line: THREE.Line;
  labelNode?: GlyphNode;
}

const defaultStyle: Required<GridLineStyle> = {
  color: 0xd32f2f,
  opacity: 1,
  lineWidth: 1,
  dashed: false,
  dashSize: 0.5,
  gapSize: 0.2
};

const defaultLabel: Required<GridLineLabel> = {
  text: '',
  size: 0.5,
  color: 0x1f2937,
  staticZoom: true,
  show: true
};

export class CustomGridLineManager {
  private scene: THREE.Scene;
  private gridLayer: THREE.Group;
  private lines = new Map<string, GridLineEntity>();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.gridLayer = new THREE.Group();
    this.gridLayer.name = 'custom-grid-lines';
    this.scene.add(this.gridLayer);
  }

  create(options: CreateGridLineOptions): GridLineData {
    const id = options.id ?? THREE.MathUtils.generateUUID();
    if (this.lines.has(id)) {
      throw new Error(`Grid line with id ${id} already exists`);
    }

    const lineData = this.makeData(id, options);
    const line = this.buildLine(lineData);
    const labelNode = this.buildLabel(lineData);

    this.gridLayer.add(line);
    const entity: GridLineEntity = { data: lineData, line, labelNode };
    this.lines.set(id, entity);

    return this.cloneData(lineData);
  }

  update(id: string, updates: UpdateGridLineOptions): GridLineData {
    const entity = this.lines.get(id);
    if (!entity) {
      throw new Error(`Grid line with id ${id} not found`);
    }

    const nextStyle = { ...entity.data.style, ...updates.style };
    const nextLabel = { ...entity.data.label, ...updates.label };

    const nextData: GridLineData = {
      ...entity.data,
      start: updates.start ? this.toVector(updates.start, updates.elevation ?? entity.data.start.y) : entity.data.start.clone(),
      end: updates.end ? this.toVector(updates.end, updates.elevation ?? entity.data.end.y) : entity.data.end.clone(),
      axisLock: updates.axisLock ?? entity.data.axisLock,
      visible: updates.visible ?? entity.data.visible,
      locked: updates.locked ?? entity.data.locked,
      style: nextStyle,
      label: nextLabel,
      metadata: updates.metadata ?? entity.data.metadata
    };

    this.applyAxisLock(nextData);

    const replacementLine = this.buildLine(nextData);
    replacementLine.visible = nextData.visible;
    this.gridLayer.remove(entity.line);
    entity.line.geometry.dispose();
    (entity.line.material as THREE.Material).dispose();
    this.gridLayer.add(replacementLine);

    if (entity.labelNode) {
      this.gridLayer.remove(entity.labelNode);
    }

    const nextLabelNode = this.buildLabel(nextData);

    entity.data = nextData;
    entity.line = replacementLine;
    entity.labelNode = nextLabelNode;

    return this.cloneData(nextData);
  }

  remove(id: string): boolean {
    const entity = this.lines.get(id);
    if (!entity) {
      return false;
    }

    this.gridLayer.remove(entity.line);
    entity.line.geometry.dispose();
    (entity.line.material as THREE.Material).dispose();

    if (entity.labelNode) {
      this.gridLayer.remove(entity.labelNode);
    }

    this.lines.delete(id);
    return true;
  }

  get(id: string): GridLineData | undefined {
    const entity = this.lines.get(id);
    if (!entity) {
      return undefined;
    }

    return this.cloneData(entity.data);
  }

  list(): GridLineData[] {
    return Array.from(this.lines.values(), ({ data }) => this.cloneData(data));
  }

  clear() {
    for (const id of this.lines.keys()) {
      this.remove(id);
    }
  }

  setVisible(id: string, visible: boolean): GridLineData {
    return this.update(id, { visible });
  }

  dispose() {
    this.clear();
    this.scene.remove(this.gridLayer);
  }

  private makeData(id: string, options: CreateGridLineOptions): GridLineData {
    const style = { ...defaultStyle, ...options.style };
    const label = {
      ...defaultLabel,
      ...options.label,
      text: options.label?.text ?? options.id ?? id
    };
    const elevation = options.elevation ?? 0;

    const data: GridLineData = {
      id,
      start: this.toVector(options.start, elevation),
      end: this.toVector(options.end, elevation),
      axisLock: options.axisLock ?? 'none',
      visible: options.visible ?? true,
      locked: options.locked ?? false,
      style,
      label,
      metadata: options.metadata
    };

    this.applyAxisLock(data);
    return data;
  }

  private toVector(point: GridLinePoint, elevation: number): THREE.Vector3 {
    return new THREE.Vector3(point.x, point.y ?? elevation, point.z);
  }

  private applyAxisLock(data: GridLineData) {
    if (data.axisLock === 'x') {
      data.end.z = data.start.z;
    }

    if (data.axisLock === 'z') {
      data.end.x = data.start.x;
    }
  }

  private buildLine(data: GridLineData): THREE.Line {
    const geometry = new THREE.BufferGeometry().setFromPoints([data.start.clone(), data.end.clone()]);

    const material = data.style.dashed
      ? new THREE.LineDashedMaterial({
        color: data.style.color,
        opacity: data.style.opacity,
        linewidth: data.style.lineWidth,
        dashSize: data.style.dashSize,
        gapSize: data.style.gapSize,
        transparent: data.style.opacity < 1
      })
      : new THREE.LineBasicMaterial({
        color: data.style.color,
        opacity: data.style.opacity,
        linewidth: data.style.lineWidth,
        transparent: data.style.opacity < 1
      });

    const line = new THREE.Line(geometry, material);
    line.name = `grid-line-${data.id}`;
    line.visible = data.visible;
    if (data.style.dashed) {
      line.computeLineDistances();
    }

    return line;
  }

  private buildLabel(data: GridLineData): GlyphNode | undefined {
    if (!data.label.show || !data.label.text) {
      return undefined;
    }

    const labelNode = Glyphs.addGlyph(data.label.text, data.label.size, data.label.color, data.label.staticZoom);
    labelNode.name = `grid-line-label-${data.id}`;

    const midPoint = data.start.clone().add(data.end).multiplyScalar(0.5);
    const direction = data.end.clone().sub(data.start);
    const angle = Math.atan2(direction.z, direction.x);

    labelNode.position.copy(midPoint);
    labelNode.position.y += 0.01;
    labelNode.rotation.set(-Math.PI / 2, 0, angle);
    labelNode.visible = data.visible;

    this.gridLayer.add(labelNode);
    return labelNode;
  }

  private cloneData(data: GridLineData): GridLineData {
    return {
      ...data,
      start: data.start.clone(),
      end: data.end.clone(),
      style: { ...data.style },
      label: { ...data.label },
      metadata: data.metadata ? { ...data.metadata } : undefined
    };
  }
}
