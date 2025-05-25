import { Polygon, Vector3D } from "../../kernel/dist";
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

export class PaperFrame extends Polygon {
  ogType = 'paperFrame';

  private options: PaperFrameOptions;
  private subNodes: Map<string, THREE.Object3D> = new Map();
  
  private readonly Y_OFFSET = 0.0010; // Offset to avoid z-fighting

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

  set paperName(name: string) {
    this.options.name = name;
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

  get margin() {
    return this.options.margin;
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
      // side: THREE.DoubleSide,
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

  private updateGeometry() {
    this.resetVertices();

    // Clear previous geometry and borders
    this.remove(this.subNodes.get('InnerBorder')!);
    this.remove(this.subNodes.get('OuterBorder')!);

    this.setupGeometry();
    this.setupMaterial();
    this.createOuterBorder();
    this.createInnerBorder();
  }

  /**
   * 
   * @param infoBlock InfoBlock
   * @description Adds an InfoBlock to the paper frame. The InfoBlock is positioned based on its placement property.
   */
  // async addBlock(infoBlock: InfoBlock) {
  //   const infoBlockMaterial = new THREE.LineBasicMaterial({
  //     color: infoBlock.options.borderColor,
  //     linewidth: 1,
  //   });
  //   const { width, height } = infoBlock.options;
  //   const infoBlockGeometry = new THREE.BufferGeometry();
  //   const blockVertices = [
  //     new THREE.Vector3(-width / 2, -height / 2, this.Y_OFFSET), // Bottom left
  //     new THREE.Vector3(width / 2, -height / 2, this.Y_OFFSET), // Bottom right
  //     new THREE.Vector3(width / 2, height / 2, this.Y_OFFSET), // Top right
  //     new THREE.Vector3(-width / 2, height / 2, this.Y_OFFSET), // Top left
  //     new THREE.Vector3(-width / 2, -height / 2, this.Y_OFFSET), // Bottom left
  //     new THREE.Vector3(-width / 2, height / 2, this.Y_OFFSET), // Top left
  //     new THREE.Vector3(width / 2, -height / 2, this.Y_OFFSET), // Bottom right
  //     new THREE.Vector3(width / 2, height / 2, this.Y_OFFSET), // Top right
  //   ];
  //   infoBlockGeometry.setFromPoints(blockVertices);
  //   const infoBlockMesh = new THREE.LineSegments(infoBlockGeometry, infoBlockMaterial);

  //   this.add(infoBlockMesh);

  //   this.blocks.push(infoBlock);
  //   infoBlockMesh.name = infoBlock.options.id;
  //   this.subNodes.set(infoBlock.options.id, infoBlockMesh);

  //   // Set position based on the block layout
  //   const placement = infoBlock.options.placement;
  //   switch (placement) {
  //     case 'topRight':
  //       infoBlockMesh.position.set(this.options.paperSize.width / 2 - infoBlock.options.width / 2 - this.margin / 10, this.options.paperSize.height / 2 - infoBlock.options.height / 2 - this.margin / 10, this.Y_OFFSET);
  //       break;
  //     case 'topLeft':
  //       infoBlockMesh.position.set(-this.options.paperSize.width / 2 + infoBlock.options.width / 2 + this.margin / 10, this.options.paperSize.height / 2 - infoBlock.options.height / 2 - this.margin / 10, this.Y_OFFSET);
  //       break;
  //     case 'bottomRight':
  //       infoBlockMesh.position.set(this.options.paperSize.width / 2 - infoBlock.options.width / 2 - this.margin / 10, -this.options.paperSize.height / 2 + infoBlock.options.height / 2 + this.margin / 10, this.Y_OFFSET);
  //       break;
  //     case 'bottomLeft':
  //       infoBlockMesh.position.set(-this.options.paperSize.width / 2 + infoBlock.options.width / 2 + this.margin / 10, -this.options.paperSize.height / 2 + infoBlock.options.height / 2 + this.margin / 10, this.Y_OFFSET);
  //       break;
  //     default:
  //       throw new Error('Invalid block placement');
  //   }

  //   // Add Blocks based on the layout
  //   if (!infoBlock.layoutOptions.layout) {
  //     console.log('No layout set for the block');
  //     return; 
  //   }
  //   const layout = infoBlock.layoutOptions.layout;
  //   const layoutBlocks: Record<string, RowInfoBlock> = infoBlock.layoutOptions.blocks;

  //   const layoutArray = layout.split('\n');

  //   for (let i = 1; i < layoutArray.length - 1; i++) {
  //     const lBlockName = layoutArray[i].trim();
  //     const lBlock = layoutBlocks[lBlockName];

  //     for (const block of await lBlock.getBlockData()) {
  //       let absoluteHeightInBlock = infoBlockMesh.position.y + infoBlock.options.height / 2 - block.userData.dimension.height / 2;
  //       if (i > 1) {
  //         absoluteHeightInBlock = infoBlockMesh.position.y + infoBlock.options.height / 2 - block.userData.dimension.height / 2 - (i - 1) * block.userData.dimension.height;
  //       }

  //       block.position.set(
  //         infoBlockMesh.position.x - infoBlock.options.width / 2 + block.userData.dimension.width / 2,
  //         absoluteHeightInBlock,
  //         this.Y_OFFSET);
        
  //       this.add(block);
  //       this.subNodes.set(block.name, block);
  //     }
  //   }
  // }

  // updateBlocks() {
  //   for (const block of this.blocks) {
  //     const blockMesh = this.subNodes.get(block.options.id);

  //     this.remove(blockMesh!);

  //     this.subNodes.delete(block.options.id);
  //   }

  //   console.log(this.subNodes);

  //   for (const block of this.blocks) {
  //     console.log(block);
  //   }
  // }

  removeBlock(blockId: string) {
    const blockMesh = this.subNodes.get(blockId);
    console.log('BlockMesh:', blockMesh);
    if (blockMesh) {
      this.remove(blockMesh);
      this.subNodes.delete(blockId);
    }
    // remove logo and other blocks
  }
}
