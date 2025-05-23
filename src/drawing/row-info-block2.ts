import { Glyphs } from '@opengeometry/openglyph';
import * as THREE from 'three';
import { Rectangle, Vector3D } from '../../kernel/dist';

export type BlockRowTypes = 'image' | 'text' | 'logo' | 'qrCode';

export interface RowInfoBlockOptions {
  type: BlockRowTypes;
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor?: string;
  borderColor?: number;
  image?: string;
  title?: string;
  description?: string;
  fontSize?: number;
  fontColor?: number;
}

export class RowInfoBlock extends Rectangle {
  rowOptions: RowInfoBlockOptions;
  name: string;

  set borderColor(color: number) {
    this.color = color;
  }

  constructor(options: RowInfoBlockOptions) {
    super({
      width: options.width,
      breadth: options.height,
      center: new Vector3D(0, 0, 0)
    });
    this.rowOptions = options;
    this.name = `rowInfoBlock` + this.ogid;

    this.blockConfig();
    this.addBlockData(options);
  }

  blockConfig() {
    const { width, height, backgroundColor, borderColor } = this.rowOptions;
    this.color = borderColor || 0x000000;
  }

  async addBlockData(textOptions: RowInfoBlockOptions) {
    const { width, height } = textOptions;

    if (textOptions.title) {
      const textMesh = Glyphs.addGlyph(
        textOptions.title,
        textOptions.fontSize || 0.5,
        textOptions.fontColor || 0x000000,
        false
      );
  
      // Top Left Corner
      if (textOptions.fontSize) {
        const box = new THREE.Box3().setFromObject(textMesh);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const textWidth = box.max.x - box.min.x;
        const textHeight = box.max.z - box.min.z;
        console.log('Text Mesh Center:', center);
        textMesh.position.set(
          -width / 2 + textWidth / 2,
          center.y,
          -height / 2 + textHeight / 2
        );
      }
      this.add(textMesh);
    }

    if (textOptions.description) {
      const textMesh = Glyphs.addGlyph(
        textOptions.description,
        textOptions.fontSize || 0.5,
        textOptions.fontColor || 0x000000,
        false
      );
  
      // Bottom Left Corner
      if (textOptions.fontSize) {
        const box = new THREE.Box3().setFromObject(textMesh);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const textWidth = box.max.x - box.min.x;
        const textHeight = box.max.z - box.min.z;
        console.log('Text Mesh Center:', center);
        textMesh.position.set(
          -width / 2 + textWidth / 2,
          center.y,
          height / 2 - textHeight / 2
        );
      }
      this.add(textMesh);
    }
  }

  // async getLogoBlockData(logoOptions: RowInfoBlockOptions): Promise<THREE.Mesh> {
  //   if (!logoOptions.image) {
  //     throw new Error('No image URL provided for logo block');
  //   }

  //   const textureLoader = new THREE.TextureLoader();

  //   return new Promise((resolve, reject) => {
  //     textureLoader.load(
  //       logoOptions.image as string,
  //       (texture) => {
  //         texture.needsUpdate = true;
  //         const { width, height } = texture.image;
  //         const aspectRatio = width / height;

  //         const material = new THREE.MeshBasicMaterial({
  //           map: texture,
  //           side: THREE.DoubleSide,
  //         });

  //         const absoluteHeight = logoOptions.height;
  //         const absoluteWidth = absoluteHeight * aspectRatio; // Correct width calculation

  //         console.log('Corrected Dimensions:', absoluteWidth, absoluteHeight);

  //         const planeGeometry = new THREE.PlaneGeometry(absoluteWidth, absoluteHeight);
  //         const mesh = new THREE.Mesh(planeGeometry, material);
  //         mesh.name = 'LogoInfoBlock';
  //         mesh.position.set(0, 0, 0);

  //         // Add Border To the Mesh
  //         const borderMaterial = new THREE.LineBasicMaterial({ color: '#000000' });
  //         const borderGeometry = new THREE.EdgesGeometry(planeGeometry);
  //         const borderMesh = new THREE.LineSegments(borderGeometry, borderMaterial);
  //         borderMesh.name = 'LogoInfoBlockBorder';
  //         borderMesh.position.set(0, 0, 0);
  //         mesh.add(borderMesh);

  //         mesh.userData = {
  //           dimension : {
  //             width: absoluteWidth,
  //             height: absoluteHeight,
  //           },
  //         }

  //         resolve(mesh); // Return the mesh only after texture loads
  //       },
  //       undefined, // onProgress (not needed)
  //       (error) => reject(error) // Handle texture loading error
  //     );
  //   });
  // }
}
