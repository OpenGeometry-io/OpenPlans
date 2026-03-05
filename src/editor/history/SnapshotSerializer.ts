import type { EditableEntity } from "../types";
import type { SnapshotPayload } from "./EditCommand";
import { Vector3 } from "../../kernel";

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class SnapshotSerializer {
  capture(target: EditableEntity): SnapshotPayload {
    const payload: SnapshotPayload = {
      transform: {
        position: [target.position.x, target.position.y, target.position.z],
        rotation: [target.rotation.x, target.rotation.y, target.rotation.z],
        scale: [target.scale.x, target.scale.y, target.scale.z],
      },
    };

    if (target.propertySet) {
      payload.propertySet = deepClone(target.propertySet);
    } else if (typeof target.getOPConfig === "function") {
      try {
        payload.propertySet = deepClone(target.getOPConfig());
      } catch {
        // noop
      }
    }

    return payload;
  }

  restore(target: EditableEntity, snapshot: SnapshotPayload): void {
    target.position.set(...snapshot.transform.position);
    target.rotation.set(...snapshot.transform.rotation);
    target.scale.set(...snapshot.transform.scale);

    if (snapshot.propertySet) {
      const nextConfig = deepClone(snapshot.propertySet);
      if (
        nextConfig.center &&
        typeof nextConfig.center === "object" &&
        typeof nextConfig.center.x === "number" &&
        typeof nextConfig.center.y === "number" &&
        typeof nextConfig.center.z === "number" &&
        (target.ogType === "CuboidShape" || target.ogType === "CylinderShape")
      ) {
        nextConfig.center = new Vector3(nextConfig.center.x, nextConfig.center.y, nextConfig.center.z);
      }

      if (typeof target.setOPConfig === "function") {
        target.setOPConfig(nextConfig);
      } else {
        target.propertySet = nextConfig;
        if (typeof target.setOPGeometry === "function") {
          target.setOPGeometry();
        }
      }
    }

    target.updateMatrixWorld(true);
  }
}
