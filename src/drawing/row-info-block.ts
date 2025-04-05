import { Glyphs } from '@opengeometry/openglyph';
import * as THREE from 'three';

export type BlockRowTypes = 'image' | 'text' | 'logo' | 'qrCode';

export interface RowInfoBlockOptions {
  type: BlockRowTypes;
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
  borderColor: string;
  image?: string;
  description?: string;
  text?: string;
  fontSize?: number;
  fontColor?: number;
}

export class RowInfoBlock {
  options: RowInfoBlockOptions[];

  constructor(options: RowInfoBlockOptions[]) {
    this.options = options;
    console.log('RowInfoBlock options:', this.options);
  }

  async getBlockData() {
    const blockData: THREE.Mesh[] = [];
    for (const option of this.options) {
      switch (option.type) {
        case 'logo':
          const logoBlock = await this.getLogoBlockData(option);
          if (logoBlock) {
            blockData.push(logoBlock);
          }
          break;
        case 'text':
          const textBlock = await this.getTextBlockData(option);
          console.log('Text Block:', textBlock);
          if (textBlock) {
            blockData.push(textBlock);
          }
          break;
        default:
          throw new Error('Invalid block type');
      }
    }
    return blockData;
  }

  async getTextBlockData(textOptions: RowInfoBlockOptions): Promise<THREE.Mesh> {
    const { width, height, backgroundColor, borderColor } = textOptions;
    console.log('Text Block Options:', textOptions);
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      color: '#ffffff',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'TextInfoBlock';
    mesh.position.set(0, 0, 0);

    if (!textOptions.text) {
      throw new Error('No text provided for text block');
    }
    const textMesh = Glyphs.addGlyph(
      textOptions.text,
      textOptions.fontSize || 1,
      textOptions.fontColor || 0x000000,
      false
    );

    textMesh.position.set(0, 0, 0);
    textMesh.rotateX(Math.PI / 2);
    mesh.add(textMesh);

    // Add Border To the Mesh
    const borderMaterial = new THREE.LineBasicMaterial({ color: '#000000' });
    const borderGeometry = new THREE.EdgesGeometry(geometry);
    const borderMesh = new THREE.LineSegments(borderGeometry, borderMaterial);
    borderMesh.name = 'TextInfoBlockBorder';
    borderMesh.position.set(0, 0, 0);
    mesh.add(borderMesh);

    mesh.userData = {
      dimension : {
        width: width,
        height: height,
      },
    }

    return mesh;
  }

  async getLogoBlockData(logoOptions: RowInfoBlockOptions): Promise<THREE.Mesh> {
    if (!logoOptions.image) {
      throw new Error('No image URL provided for logo block');
    }

    const textureLoader = new THREE.TextureLoader();

    return new Promise((resolve, reject) => {
      textureLoader.load(
        logoOptions.image as string,
        (texture) => {
          texture.needsUpdate = true;
          const { width, height } = texture.image;
          const aspectRatio = width / height;

          const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
          });

          const absoluteHeight = logoOptions.height;
          const absoluteWidth = absoluteHeight * aspectRatio; // Correct width calculation

          console.log('Corrected Dimensions:', absoluteWidth, absoluteHeight);

          const planeGeometry = new THREE.PlaneGeometry(absoluteWidth, absoluteHeight);
          const mesh = new THREE.Mesh(planeGeometry, material);
          mesh.name = 'LogoInfoBlock';
          mesh.position.set(0, 0, 0);

          // Add Border To the Mesh
          const borderMaterial = new THREE.LineBasicMaterial({ color: '#000000' });
          const borderGeometry = new THREE.EdgesGeometry(planeGeometry);
          const borderMesh = new THREE.LineSegments(borderGeometry, borderMaterial);
          borderMesh.name = 'LogoInfoBlockBorder';
          borderMesh.position.set(0, 0, 0);
          mesh.add(borderMesh);

          mesh.userData = {
            dimension : {
              width: absoluteWidth,
              height: absoluteHeight,
            },
          }

          resolve(mesh); // Return the mesh only after texture loads
        },
        undefined, // onProgress (not needed)
        (error) => reject(error) // Handle texture loading error
      );
    });
  }
}
