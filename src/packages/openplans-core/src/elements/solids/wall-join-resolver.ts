import { buildResolvedWallArtifacts } from "./wall-artifact-builder";
import { buildWallTopology } from "./wall-topology-builder";
import { Wall } from "./wall";
import type { WallSystemOptions } from "./wall-types";

export interface WallJoinResolverOptions extends WallSystemOptions {}

/**
 * @deprecated Prefer automatic wall resolution through OpenPlans/WallSystem.
 * This shim remains for tests and compatibility while the public authoring
 * workflow moves to internal wall-system ownership.
 */
export class WallJoinResolver {
  private readonly options: WallSystemOptions;

  constructor(options: WallJoinResolverOptions = {}) {
    this.options = { ...options };
  }

  resolve(walls: Wall[]) {
    const sources = walls
      .map((wall) => wall.getResolvedSource())
      .filter((source): source is NonNullable<typeof source> => Boolean(source));
    const topology = buildWallTopology(sources, this.options);
    const artifacts = buildResolvedWallArtifacts(sources, topology, this.options);

    walls.forEach((wall) => {
      wall.applySystemArtifacts(artifacts.get(wall.ogid) ?? null);
    });

    return walls;
  }
}
