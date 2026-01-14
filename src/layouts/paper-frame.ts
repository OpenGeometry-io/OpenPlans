import { Polygon, Vector3 } from "../kernel/";
import * as THREE from 'three';
import { IShape } from "../shapes/base-type";

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
  ogid?: string;
  labelName: string;
  type: 'PAPERFRAME';
  format: PaperFormat;
  orientation: PaperOrientation;
  margin: number;
  backgroundColor: number;
  borderColor: number;
  borderWidth: number;
  paperSize: { width: number; height: number };
}

export class PaperFrame extends Polygon implements IShape {
  ogType = 'paperFrame';
  subElements: Map<string, THREE.Object3D> = new Map();

  selected: boolean = false;
  edit: boolean = false;

  propertySet: PaperFrameOptions = {
    labelName: 'PaperFrame',
    type: 'PAPERFRAME',
    format: 'A4',
    orientation: 'portrait',
    margin: 10,
    backgroundColor: 0xffffff,
    borderColor: 0x000000,
    borderWidth: 1,
    paperSize: paperSizes['A4'],
  };
  
  private readonly Y_OFFSET = 0.0010; // Offset to avoid z-fighting

  // Getter and Setter Properties

  /**
   * Set the Label Name for the Paper Frame
   */
  set paperName(name: string) {
    this.propertySet.labelName = name;
  }

  set format(format: PaperFormat) {
    this.propertySet.format = format;
    this.propertySet.paperSize = paperSizes[format];

    this.setOPGeometry();
  }

  set orientation(orientation: PaperOrientation) {
    this.propertySet.orientation = orientation;
    
    this.setOPGeometry();
  }

  set margin(margin: number) {
    this.propertySet.margin = margin;

    this.setOPGeometry();
  }

  get margin() {
    return this.propertySet.margin;
  }

  set backgroundColor(color: number) {
    this.propertySet.backgroundColor = color;
  }

  set borderColor(color: number) {
    this.propertySet.borderColor = color;

    // TODO: We need to implement setOPMaterial properly
    // Note: For time being we will use setOPGeometry
    this.setOPGeometry();
  }

  set borderWidth(width: number) {
    this.propertySet.borderWidth = width;
  }

  get paperSize() {
    return this.propertySet.paperSize;
  }

  set paperSize(size: { width: number; height: number }) {
    if (this.format !== 'Custom') {
      throw new Error('Cannot set paper size for non-custom formats');
    }
    this.propertySet.paperSize = size;

    this.setOPGeometry();
  }

  constructor(paperFrameConfig?: Partial<PaperFrameOptions>) {
    // TODO: Figure out the best way to retain ogid when calling parent elements, since they internally have the logic to create ogid
    super({
      ogid: paperFrameConfig?.ogid,
      vertices: [],
      color: 0
    });

    this.subElements = new Map<string, THREE.Object3D>();

    if (paperFrameConfig) {
      this.propertySet = { ...this.propertySet, ...paperFrameConfig };
    }

    this.propertySet.ogid = this.ogid;
    this.setOPGeometry();
  }

  setOPConfig(config: Record<string, any>): void {
    
  }

  setOPGeometry(): void {

    const format = this.propertySet.format;
    this.propertySet.paperSize = paperSizes[format];
    const { width, height } = this.propertySet.paperSize;

    const isPortrait = this.propertySet.orientation === 'portrait';
    const absoluteWidth = isPortrait ? width : height;
    const absoluteHeight = isPortrait ? height : width;

    const vertices = [
      new Vector3(-absoluteWidth / 2, -absoluteHeight / 2, 0), // Bottom left
      new Vector3(absoluteWidth / 2, -absoluteHeight / 2, 0), // Bottom right
      new Vector3(absoluteWidth / 2, absoluteHeight / 2, 0), // Top right
      new Vector3(-absoluteWidth / 2, absoluteHeight / 2, 0), // Top left
    ];
    
    this.setConfig({ 
      vertices: vertices,
      color: this.propertySet.backgroundColor
    });

    this.rotation.x = -Math.PI / 2; // Rotate to face the camera
    this.position.y = -0.01;

    this.outline = true;

    // Local Geometry Updates
    this.createInnerBorder();
  }

  // TODO: Material or Color Related changes should be applied here but for now we will use setOPGeometry
  setOPMaterial(): void {
    this.color = this.propertySet.backgroundColor;
    this.borderColor = this.propertySet.borderColor;
  }

  getOPConfig() {
    return this.propertySet;
  }

  private createInnerBorder() {
    // Cleanup Previous Inner Border
    this.remove(this.subElements.get('InnerBorder')!);

    const { width, height } = this.propertySet.paperSize;
    const margin = this.propertySet.margin / 10;

    const isPortrait = this.propertySet.orientation === 'portrait';
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
      color: this.propertySet.borderColor,
      linewidth: 1,
    });
    const innerBorderGeometry = new THREE.BufferGeometry().setFromPoints(innerVertices);
    const innerBorderMesh = new THREE.LineSegments(innerBorderGeometry, innerBorderMaterial);
    innerBorderMesh.position.set(0, 0, this.Y_OFFSET);
    this.add(innerBorderMesh);

    this.subElements.set('InnerBorder', innerBorderMesh);
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

  // removeBlock(blockId: string) {
  //   const blockMesh = this.subNodes.get(blockId);
  //   console.log('BlockMesh:', blockMesh);
  //   if (blockMesh) {
  //     this.remove(blockMesh);
  //     this.subNodes.delete(blockId);
  //   }
  //   // remove logo and other blocks
  // }
}
