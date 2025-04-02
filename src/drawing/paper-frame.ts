import { BasePoly, Vector3D } from "../../kernel/dist";
import * as THREE from 'three';

export type PaperFormat = 'A4' | 'A3' | 'A2' | 'Custom';
export type PaperOrientation = 'portrait' | 'landscape';
export type SubNodeOptions = 'OuterBorder' | 'InnerBorder';

// Paper size based on PaperFormat
export const paperSizes: Record<PaperFormat, { width: number; height: number }> = {
  A4: { width: 21.0, height: 29.7 },
  A3: { width: 29.7, height: 42.0 },
  A2: { width: 42.0, height: 59.4 },
  Custom: { width: 0, height: 0 }, // Custom size will be set later
};

export interface PaperFrameOptions {
  name: string;
  format: PaperFormat;
  orientation: PaperOrientation;
  margin: number;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  paperSize: { width: number; height: number };
}

export class PaperFrame extends BasePoly {
  ogType = 'paperFrame';

  private options: PaperFrameOptions;
  private subNodes: Map<string, THREE.Object3D> = new Map();
  
  private readonly Y_OFFSET = 0.010; // Offset to avoid z-fighting

  constructor() {
    super();
    this.options = {
      name: 'PaperFrame',
      format: 'A4',
      orientation: 'portrait',
      margin: 10,
      backgroundColor: '#ffffff',
      borderColor: '#000000',
      borderWidth: 1,
      paperSize: paperSizes['A4'],
    };

    this.setupGeometry();
    this.setupMaterial();

    // Cosmetic properties
    this.createOuterBorder();
    this.createInnerBorder();
  }

  set format(format: PaperFormat) {
    this.options.format = format;
    this.options.paperSize = paperSizes[format];

    this.updateGeometry();
  }

  set orientation(orientation: PaperOrientation) {
    this.options.orientation = orientation;
    this.updateGeometry();
  }

  set margin(margin: number) {
    this.options.margin = margin;

    this.remove(this.subNodes.get('InnerBorder')!);
    this.createInnerBorder();
  }

  set backgroundColor(color: string) {
    this.options.backgroundColor = color;
  }

  set borderColor(color: string) {
    this.options.borderColor = color;
  }

  set borderWidth(width: number) {
    this.options.borderWidth = width;
  }

  get paperSize() {
    return this.options.paperSize;
  }

  set paperSize(size: { width: number; height: number }) {
    if (this.format !== 'Custom') {
      throw new Error('Cannot set paper size for non-custom formats');
    }
    this.options.paperSize = size;

    this.updateGeometry();
  }

  private setupGeometry() {
    const { width, height } = this.options.paperSize;

    const isPortrait = this.options.orientation === 'portrait';
    const absoluteWidth = isPortrait ? width : height;
    const absoluteHeight = isPortrait ? height : width;

    const vertices = [
      new Vector3D(-absoluteWidth / 2, -absoluteHeight / 2, 0), // Bottom left
      new Vector3D(absoluteWidth / 2, -absoluteHeight / 2, 0), // Bottom right
      new Vector3D(absoluteWidth / 2, absoluteHeight / 2, 0), // Top right
      new Vector3D(-absoluteWidth / 2, absoluteHeight / 2, 0), // Top left
    ];
    this.addVertices(vertices);

    this.rotation.x = -Math.PI / 2; // Rotate to face the camera
    this.position.y = -0.01;
    // Create The Polygon Page Done here
  }

  private setupMaterial() {
    // Setup the material for the paper frame
    const material = new THREE.MeshBasicMaterial({
      color: this.options.backgroundColor,
      side: THREE.DoubleSide,
    });
    this.material = material;
  }

  private createOuterBorder() {
    const borderMaterial = new THREE.LineBasicMaterial({
      color: '#000000',
      linewidth: 1,
    });
    const borderGeometry = new THREE.EdgesGeometry(this.geometry);
    const borderMesh = new THREE.LineSegments(borderGeometry, borderMaterial);
    this.add(borderMesh);
    this.subNodes.set('OuterBorder', borderMesh);
  }

  private createInnerBorder() {
    const { width, height } = this.options.paperSize;
    const margin = this.options.margin / 10;

    const isPortrait = this.options.orientation === 'portrait';
    const absoluteWidth = isPortrait ? width : height;
    const absoluteHeight = isPortrait ? height : width;

    const innerVertices = [
      new THREE.Vector3(-absoluteWidth / 2 + margin, -absoluteHeight / 2 + margin, 0), // Top left
      new THREE.Vector3(absoluteWidth / 2 - margin, -absoluteHeight / 2 + margin, 0), // Top right
    
      new THREE.Vector3(absoluteWidth / 2 - margin, absoluteHeight / 2 - margin, 0), // Bottom right
      new THREE.Vector3(-absoluteWidth / 2 + margin, absoluteHeight / 2 - margin, 0), // Bottom left
    
      new THREE.Vector3(-absoluteWidth / 2 + margin, -absoluteHeight / 2 + margin, 0), // Top left
      new THREE.Vector3(-absoluteWidth / 2 + margin, absoluteHeight / 2 - margin, 0), // Bottom left
    
      new THREE.Vector3(absoluteWidth / 2 - margin, -absoluteHeight / 2 + margin, 0), // Top right
      new THREE.Vector3(absoluteWidth / 2 - margin, absoluteHeight / 2 - margin, 0), // Bottom right
    ];

    const innerBorderMaterial = new THREE.LineBasicMaterial({
      color: '#000000',
      linewidth: 1,
    });
    const innerBorderGeometry = new THREE.BufferGeometry().setFromPoints(innerVertices);
    const innerBorderMesh = new THREE.LineSegments(innerBorderGeometry, innerBorderMaterial);
    innerBorderMesh.position.set(0, 0, this.Y_OFFSET);
    this.add(innerBorderMesh);
    this.subNodes.set('InnerBorder', innerBorderMesh);
  }

  updateGeometry() {
    this.resetVertices();

    // Clear previous geometry and borders
    this.remove(this.subNodes.get('InnerBorder')!);
    this.remove(this.subNodes.get('OuterBorder')!);

    this.setupGeometry();
    this.setupMaterial();
    this.createOuterBorder();
    this.createInnerBorder();
  }
}
