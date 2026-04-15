import { generateUUID } from "three/src/math/MathUtils.js";

export interface IViewOptions {
  ogid?: string;
  container?: HTMLElement;
  // Set Viewport region using bounds
  bounds: {
    min: {
      x: number;
      y: number;
      z: number;
    },
    max: {
      x: number;
      y: number;
      z: number;
    }
  },
  camera: {
    position: {
      x: number;
      y: number;
      z: number;
    },
    target: {
      x: number;
      y: number;
      z: number;
    }
  },
  lockCamera?: boolean;

  // TODO:
  // Element overrides allow users to specify custom rendering or interaction behavior for specific elements within the view. This can be used to highlight certain objects, disable interactions for others.
  elementOverides?: {
    [elementId: string]: {
      options: any; // Should be PropertySet or Options specific to the element type, allowing for flexible customization of individual elements within the view.
    }
  };
}

/**
 * Represents a view in the OpenPlans application. A view is a specific configuration of the camera and the visible area of the scene. It can be used to save and restore specific perspectives or to create predefined viewpoints for users.
 */
export class View {
  private viewProperties: IViewOptions = {
    bounds: {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 10, y: 0, z: 0 }
    },
    camera: {
      position: { x: 0, y: 0, z: 10 },
      target: { x: 0, y: 0, z: 0 }
    }
  };

  ogid: string = '';
  private isActive: boolean = false;

  /**
   * Sets the active state of the view. When a view is active, it can be rendered and interacted with. 
   * Inactive views are not rendered and do not respond to user interactions.
   * TODO: Inactive views can be offloaded to save memory and improve performance, especially when dealing with large scenes or multiple views.
   */
  set active(active: boolean) {
    this.isActive = active;
  }
  get active() { return this.isActive; }

  // TODO: Add error handling for properties
  constructor(options: IViewOptions) {
    this.viewProperties = { ...this.viewProperties, ...options };
    if (!this.viewProperties.ogid) {
      this.viewProperties.ogid = generateUUID();
    }
    
    this.ogid = this.viewProperties.ogid;
  }
}
