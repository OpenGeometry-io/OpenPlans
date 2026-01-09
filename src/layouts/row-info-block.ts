import { Glyphs } from '@opengeometry/openglyph';
import * as THREE from 'three';
import { Rectangle, Vector3 } from '../kernel/dist';

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

  set description(text: string) {
    this.rowOptions.description = text;
    this.clearBlockData();
    this.addBlockData(this.rowOptions);
  }

  set title(text: string) {
    this.rowOptions.title = text;
  }

  // TODO: Add a method to set the background color, but we need a Polygon as well if we have to do that
  // set backgroundColor(color: string) 

  constructor(options: RowInfoBlockOptions) {
    super({
      width: options.width,
      breadth: options.height,
      center: new Vector3(0, 0, 0)
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

  clearBlockData() {
    while (this.children.length > 0) {
      const child = this.children[0];
      this.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
        child.geometry = null;
        child.material = null;
      }
    }
    this.children = [];
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
        textMesh.position.set(
          -width / 2 + textWidth / 2,
          center.y,
          height / 2 - textHeight / 2
        );
      }
      this.add(textMesh);
    }
  }
}
