import * as THREE from "three";
import type { PointerInfo } from "../types";

export interface PointerRouterHandlers {
  onPointerDown: (info: PointerInfo) => void;
  onPointerMove: (info: PointerInfo) => void;
  onPointerUp: (info: PointerInfo) => void;
}

export class PointerRouter {
  private handlers: PointerRouterHandlers;
  private ndcElement: HTMLElement;

  constructor(private element: HTMLElement, handlers: PointerRouterHandlers, ndcElement?: HTMLElement) {
    this.handlers = handlers;
    this.ndcElement = ndcElement ?? element;
    this.bind();
  }

  dispose(): void {
    this.element.removeEventListener("pointerdown", this.handlePointerDown);
    this.element.removeEventListener("pointermove", this.handlePointerMove);
    this.element.removeEventListener("pointerup", this.handlePointerUp);
    this.element.removeEventListener("pointercancel", this.handlePointerUp);
  }

  private bind(): void {
    this.element.addEventListener("pointerdown", this.handlePointerDown);
    this.element.addEventListener("pointermove", this.handlePointerMove);
    this.element.addEventListener("pointerup", this.handlePointerUp);
    this.element.addEventListener("pointercancel", this.handlePointerUp);
  }

  private toPointerInfo(event: PointerEvent): PointerInfo {
    const rect = this.ndcElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );

    return {
      ndc,
      clientX: event.clientX,
      clientY: event.clientY,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
    };
  }

  private handlePointerDown = (event: PointerEvent) => {
    this.element.setPointerCapture(event.pointerId);
    this.handlers.onPointerDown(this.toPointerInfo(event));
  };

  private handlePointerMove = (event: PointerEvent) => {
    this.handlers.onPointerMove(this.toPointerInfo(event));
  };

  private handlePointerUp = (event: PointerEvent) => {
    if (this.element.hasPointerCapture(event.pointerId)) {
      this.element.releasePointerCapture(event.pointerId);
    }
    this.handlers.onPointerUp(this.toPointerInfo(event));
  };
}
