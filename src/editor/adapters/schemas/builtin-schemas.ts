export interface ParametricSchema {
  widthPath?: string;
  depthPath?: string;
  radiusPath?: string;
}

function hasNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function resolveParametricSchema(config: Record<string, any>): ParametricSchema | null {
  if (!config || typeof config !== "object") {
    return null;
  }

  if (hasNumber(config?.dimensions?.width) && hasNumber(config?.dimensions?.depth)) {
    return {
      widthPath: "dimensions.width",
      depthPath: "dimensions.depth",
    };
  }

  if (hasNumber(config?.stairDimensions?.width) && hasNumber(config?.stairDimensions?.length)) {
    return {
      widthPath: "stairDimensions.length",
      depthPath: "stairDimensions.width",
    };
  }

  if (hasNumber(config?.doorDimensions?.width) && hasNumber(config?.doorDimensions?.thickness)) {
    return {
      widthPath: "doorDimensions.width",
      depthPath: "doorDimensions.thickness",
    };
  }

  if (hasNumber(config?.windowDimensions?.width) && hasNumber(config?.windowDimensions?.thickness)) {
    return {
      widthPath: "windowDimensions.width",
      depthPath: "windowDimensions.thickness",
    };
  }

  if (hasNumber(config?.radius)) {
    return {
      radiusPath: "radius",
    };
  }

  if (hasNumber(config?.canopyRadius)) {
    return {
      radiusPath: "canopyRadius",
    };
  }

  return null;
}
