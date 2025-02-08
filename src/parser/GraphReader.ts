/**
 * As for today, I'm creating a reader in the format shared by Implenai.
 * But I need to identify the format of the graph/JSON that I will be using.
 * If there is a standard format, I will use it. If not, better I will create one.
 */

import { BuildingData } from "./IGraph";

export type Graph = {
  nodes: [];
  edges: [];
}

export type ImpleniaGraph = {
  nodes: [];
  edges: [];
}

export class GraphReader {
  constructor() {
  }

  /**
   * @param json This is the JSON that will be read and transformed into a Graph object.
   * @returns 
   */
  public readJSON(json: ImpleniaGraph): Graph {
    return json;
  }

  // /**
  //  * 
  //  * @param graph This is the graph that will be used to generate the geometry.
  //  * @returns 
  //  */
  // public generateGeometry(graph: BuildingData): void {
  //   // Calling APIs to generate the geometry.
    
  //   const floors = graph.floors;

  //   // Just doing for first floor
  //   for (let i = 0; i < 1; i++) {
  //     const floor = floors[i];
  //     const rooms = floor.OG_DATA;
  //     for (let j = 0; j < rooms.length; j++) {
  //       const room = rooms[j];
        
  //       const walls = graph.walls;
  //       for (let k = 0; k < walls.length; k++) {
  //         const wall = walls[k];
  //         if (wall.type === 'internal' && wall.OG_ID === room) {
  //           // Generate wall geometry
  //           const start = wall.start;
  //           const end = wall.end;
  //           const thickness = wall.thickness;

  //         }
  //       }
  //     }
  //   }
  // }
}