import { generateUUID } from 'three/src/math/MathUtils.js';

export type BlockPosition = 'topRight' | 'topLeft' | 'bottomRight' | 'bottomLeft';

export interface InfoBlockInterface {
  id: string;
  name: string;
  placement: BlockPosition;
  width: number;
  height: number;
  backgroundColor: string;
  borderColor: string;
}

export type LayoutOptions = {
  layout: string;
  blocks: {};
};

export class InfoBlock {
  options: InfoBlockInterface;
  layoutOptions: LayoutOptions = {
    layout: '',
    blocks: [],
  };

  constructor() {
    this.options = {
      id: generateUUID(),
      name: 'Info Block',
      placement: 'bottomRight',
      width: 8,
      height: 4,
      backgroundColor: '#ffffff',
      borderColor: '#000000',
    };
  }

  set blockLayout(options: LayoutOptions) {
    this.layoutOptions = options;
  }

  set placement(placement: BlockPosition) {
    this.options.placement = placement;
  }
}
