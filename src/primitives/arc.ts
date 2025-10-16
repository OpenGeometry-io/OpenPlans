import * as THREE from 'three';
import { Arc, IArcOptions, Vector3 } from '../kernel/dist';
import { IPrimitive } from './base-type';
import { DimensionTool } from '../dimensions';

/**
 * If any element start moves, cast a ray and check if it interesects with the board.
 * Add the element to the board if it does.
 * If the element is moved outside the board, remove it from the board.
 */


export class ArcPrimitive extends Arc implements IPrimitive {
  ogType: string = 'ArcPrimitive';
  subNodes: Map<string, THREE.Object3D>;
  selected: boolean;
  edit: boolean;

  propertySet: IArcOptions;
  dimensionsSet: Map<string, THREE.Object3D> = new Map<string, THREE.Object3D>();

  private activeProperty: string | null = null;

  constructor(properties?: IArcOptions) {
    super(properties);
    this.subNodes = new Map<string, THREE.Object3D>();
    this.selected = false;
    this.edit = false;
    
    if (properties) {
      this.propertySet = { ...properties, ...this.options };
    } else {
      // Default properties from the Arc class/Kernel
      this.propertySet = this.options;
    }

    // this.setDimensions();
    // this.listenKeyboardEvents();
  }

  private setDimensions() {
    for (const property in this.propertySet) {
      // TODO: Create Enums for properties
      if (property === 'radius') {
        const radiusDimension = DimensionTool.createDimension(
          this.ogid + '-radius',
          'length',
        );
        this.activeProperty = 'radius';
      }
    }
  }

  private listenKeyboardEvents() {
    window.addEventListener('keypress', (event) => {
      console.log(`Key pressed: ${event.key}`);

      // Number keys to set radius
      if (event.key >= '0' && event.key <= '9') {
        const num = parseInt(event.key);
        if (this.activeProperty === 'radius') {
          this.options.radius = num;
          // @ts-ignore
          const radiusDimId = this.ogid + '-radius';
          const radiusDimension = DimensionTool.getDimensionsById(radiusDimId);
          radiusDimension.setDimensionData(this.options, num);
        }
      }

      // Enter to confirm
      if (event.key === 'Enter') {
        console.log('Finalizing property:', this.activeProperty);
        this.activeProperty = null;
        this.setOPConfig(this.options);
      }
    });
  }

  setOPConfig(config: IArcOptions): void {
    this.discardGeometry();

    console.log('Setting Arc Config:', config);
    this.propertySet = config;
    this.setConfig(config);
    console.log(this.geometry.attributes.position);
  }

  getOPConfig(): IArcOptions {
    return this.propertySet;
  }

  setOPGeometry(): void {
    // Implement geometry update logic here if needed
  }

  setOPMaterial(): void {
    // Implement material update logic here
    // const line = this.subNodes.get('arcLine') as THREE.Line;
    // if (line) {
    //   (line.material as THREE.LineBasicMaterial).color.set(0x0000ff);
    // }
  }
}