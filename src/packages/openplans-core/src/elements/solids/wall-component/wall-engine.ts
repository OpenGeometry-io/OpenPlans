import { SingleWall } from "../single-wall";
import { WallOptions } from "../wall-types";


const wallJoinTolerance: number = 0.01; // Tolerance for detecting joins

interface WallRelationship {
  wallId: string;
  startLink: string | null; // ID of the wall connected at the start point
  endLink: string | null;   // ID of the wall connected at the end point
  middleLinks: string[]; // IDs of walls that overlap in the middle
}

/**
 * Wall Engine provides a way to create new walls based on parameters.
 * The Engine then resolves Wall Joins based on Overalapping Walls.
 * Currently T, L, X joins are supported.
 * The Wall Engine is running in the background and whenever user modifies a wall geometry or creates a new wall, the engine checks for overlapping walls and resolves the joins accordingly.
 */
export class WallEngine {
  private wallMap: Map<string, SingleWall> = new Map();
  private wallRelationships: Map<string, WallRelationship> = new Map(); // Map of wallId to wall relationship

  constructor() {}

  createWall(wallOptions: Partial<WallOptions>): SingleWall {
    const wall = new SingleWall(wallOptions);
    this.addWallToSystem(wall);
    this.wallMap.set(wall.ogid, wall);
    return wall;
  }

  addStartLink(wallId: string, connectedWallId: string) {
    const relationship = this.wallRelationships.get(wallId);
    if (relationship) {
      relationship.startLink = connectedWallId;
      this.updateWallGeometry(wallId);
    }
  }

  addEndLink(wallId: string, connectedWallId: string) {
    const relationship = this.wallRelationships.get(wallId);
    if (relationship) {
      relationship.endLink = connectedWallId;
      this.updateWallGeometry(wallId);
    }
  }

  addMiddleLink(wallId: string, connectedWallId: string) {
    const relationship = this.wallRelationships.get(wallId);
    if (relationship && !relationship.middleLinks.includes(connectedWallId)) {
      relationship.middleLinks.push(connectedWallId);
      this.updateWallGeometry(wallId);
    }
  }

  private updateWallGeometry(wallId: string) {
    // Logic to update the wall geometry based on its relationships (joins)
    // This would involve checking the type of join (L, T, X) and modifying the wall's geometry accordingly to reflect the join.
  }

  private addWallToSystem(wall: SingleWall) {
    // Add wall to the system and initialize its relationship
    this.wallRelationships.set(wall.ogid, {
      wallId: wall.ogid,
      startLink: null,
      endLink: null,
      middleLinks: [],
    });

    // After adding the wall, resolve joins
    this.resolveJoinsForWall(wall);
  }

  private resolveJoinsForWall(wall: SingleWall) {
    // Logic to check for overlapping walls and determine join types (L, T, X)
    // This is a complex logic that involves checking the geometry of the wall against other walls in the system and determining if they are connected at the start, end, or middle.
    // Based on the connections, we can then update the wall's geometry to reflect the appropriate join type.
  }
}
