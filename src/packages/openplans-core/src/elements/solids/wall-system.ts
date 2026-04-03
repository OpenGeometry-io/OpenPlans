import { buildResolvedWallArtifacts } from "./wall-artifact-builder";
import { buildWallTopology } from "./wall-topology-builder";
import type { Wall } from "./wall";
import type { WallModelDisplayAssignment, WallResolvedSource, WallSystemOptions, WallTopologyNode } from "./wall-types";

interface UnregisterOptions {
  rebuildDetached?: boolean;
}

export class WallSystem {
  private readonly walls = new Map<string, Wall>();
  private readonly options: Required<WallSystemOptions>;
  private resolving = false;

  constructor(options: WallSystemOptions = {}) {
    this.options = {
      endpointTolerance: options.endpointTolerance ?? 1e-3,
      segmentTolerance: options.segmentTolerance ?? 1e-3,
      parallelTolerance: options.parallelTolerance ?? 1e-6,
      capStyle: options.capStyle ?? "uncapped",
    };
  }

  register(wall: Wall) {
    const currentSystem = wall.getBoundWallSystem();
    if (currentSystem && currentSystem !== this) {
      currentSystem.unregister(wall, { rebuildDetached: false });
    }

    this.walls.set(wall.ogid, wall);
    wall.bindWallSystem(this);
    this.resolve();
    return wall;
  }

  unregister(wall: Wall, options: UnregisterOptions = {}) {
    const existed = this.walls.delete(wall.ogid);
    if (!existed) {
      if (wall.getBoundWallSystem() === this) {
        wall.unbindWallSystem(Boolean(options.rebuildDetached));
      }
      return wall;
    }

    if (wall.getBoundWallSystem() === this) {
      wall.unbindWallSystem(options.rebuildDetached ?? true);
    }

    this.resolve();
    return wall;
  }

  requestResolve() {
    this.resolve();
  }

  getWall(wallId: string) {
    return this.walls.get(wallId);
  }

  resolve() {
    if (this.resolving) {
      return;
    }

    this.resolving = true;
    try {
      const sources = Array.from(this.walls.values())
        .map((wall) => wall.getResolvedSource())
        .filter((source): source is NonNullable<typeof source> => Boolean(source));
      const topology = buildWallTopology(sources, this.options);
      const artifacts = buildResolvedWallArtifacts(sources, topology, this.options);

      this.walls.forEach((wall) => {
        wall.applySystemArtifacts(artifacts.get(wall.ogid) ?? null);
      });

      const displayAssignments = buildWallModelDisplayAssignments(sources, topology);
      this.walls.forEach((wall) => {
        wall.applyModelDisplayAssignment(displayAssignments.get(wall.ogid) ?? { mode: "individual" });
      });
    } finally {
      this.resolving = false;
    }
  }

  getWalls() {
    return Array.from(this.walls.values());
  }

  getOptions() {
    return { ...this.options };
  }
}

function compareSources(a: WallResolvedSource, b: WallResolvedSource) {
  if (Math.abs(a.frame.length - b.frame.length) > 1e-6) {
    return b.frame.length - a.frame.length;
  }

  if (a.creationOrder !== b.creationOrder) {
    return a.creationOrder - b.creationOrder;
  }

  return a.wallId.localeCompare(b.wallId);
}

function buildWallModelDisplayAssignments(
  sources: WallResolvedSource[],
  topology: WallTopologyNode[],
) {
  const assignments = new Map<string, WallModelDisplayAssignment>();
  const adjacency = new Map<string, Set<string>>();
  const sourceById = new Map(sources.map((source) => [source.wallId, source]));

  sources.forEach((source) => {
    adjacency.set(source.wallId, new Set());
    assignments.set(source.wallId, { mode: "individual" });
  });

  topology.forEach((node) => {
    const [a, b] = node.wallIds;
    adjacency.get(a)?.add(b);
    adjacency.get(b)?.add(a);
  });

  const visited = new Set<string>();
  sources.forEach((source) => {
    if (visited.has(source.wallId)) {
      return;
    }

    const component: string[] = [];
    const queue = [source.wallId];
    visited.add(source.wallId);

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) {
        continue;
      }

      component.push(current);
      adjacency.get(current)?.forEach((neighbor) => {
        if (visited.has(neighbor)) {
          return;
        }
        visited.add(neighbor);
        queue.push(neighbor);
      });
    }

    if (component.length <= 1) {
      return;
    }

    const componentSources = component
      .map((wallId) => sourceById.get(wallId))
      .filter((candidate): candidate is WallResolvedSource => Boolean(candidate))
      .sort(compareSources);
    const owner = componentSources[0];
    if (!owner) {
      return;
    }

    assignments.set(owner.wallId, {
      mode: "merged-owner",
      memberWallIds: component,
    });

    component.forEach((wallId) => {
      if (wallId === owner.wallId) {
        return;
      }
      assignments.set(wallId, {
        mode: "merged-hidden",
        memberWallIds: component,
      });
    });
  });

  return assignments;
}
