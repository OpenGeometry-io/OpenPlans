import { Glyphs } from '@opengeometry/openglyph';
import * as THREE from 'three';
import { Polygon, Vector3 } from '../kernel/dist';

export type BlockRowTypes = 'image' | 'text' | 'logo' | 'qrCode';

export interface LogoInfoBlockOptions {
  type: BlockRowTypes;
  id: string;
  name: string;
  width: number;
  height: number;
  url?: string;
  description?: string;
  borderColor?: number;
}

export class LogoInfoBlock extends Polygon {
  rowOptions: LogoInfoBlockOptions;
  name: string;

  set borderColor(color: number) {
    this.outlineColor = color;
  }

  // TODO: Add a method to set the background color, but we need a Polygon as well if we have to do that
  // set backgroundColor(color: string) 

  constructor(options: LogoInfoBlockOptions) {
    super();
    this.rowOptions = options;

    // calculate points based on width and height
    const points = [
      new Vector3(-options.width / 2, 0, -options.height / 2),
      new Vector3(options.width / 2, 0, -options.height / 2),
      new Vector3(options.width / 2, 0, options.height / 2),
      new Vector3(-options.width / 2, 0, options.height / 2),
    ];
    this.addVertices(points);
    this.outline = true;

    this.name = `rowInfoBlock` + this.ogid;

    // Material for the block
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    this.material = material;

    this.blockConfig();
    this.addBlockData(options);
  }

  blockConfig() {
    const { width, height, borderColor } = this.rowOptions;
    this.borderColor = borderColor || 0x000000;
  }

  async addBlockData(logoOptions: LogoInfoBlockOptions) {
    // const { width, height } = textOptions;

    if (!logoOptions.url) {
      throw new Error('No image URL provided for logo block');
    }

    const textureLoader = new THREE.TextureLoader();

    textureLoader.load(
      logoOptions.url as string,
      (texture) => {
        texture.needsUpdate = true;
        const { width, height } = texture.image;
        const aspectRatio = width / height;

        const material = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
          color: 0xffffff,
        });

        const dimensions = {
          width: logoOptions.width,
          height: logoOptions.height,
        }

        const absoluteHeight = logoOptions.height - 0.002;
        const absoluteWidth = absoluteHeight * aspectRatio; // Correct width calculation

        const planeGeometry = new THREE.PlaneGeometry(absoluteWidth, absoluteHeight);
        const mesh = new THREE.Mesh(planeGeometry, material);
        mesh.name = 'LogoInfoBlock';
        mesh.position.set(0, 0.001, 0);
        mesh.rotateX( -Math.PI / 2 );
        this.add(mesh);
      }
    );
  }
}
