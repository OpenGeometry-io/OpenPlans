import { OpenGeometry } from '../kernel/dist';
import { Pencil } from '../kernel/dist/src/pencil';
import { BaseDoor } from './elements/base-door';
import { BaseSpace } from './elements/base-spaces';
import { OPDoor, OPSpace, OPWall } from './elements/base-types';
import { BaseWall } from './elements/base-wall';
import { BaseWindow } from './elements/base-window';
import { DoubleWindow } from './elements/double-window';
import { GlyphNode, Glyphs } from './glyphs';
import { BuildingData } from './parser/IGraph';
import convertToOGFormat from './parser/ImpleniaConverter';
import { PlanCamera } from './service/plancamera';
import { OpenThree } from './service/three';

export class OpenPlans {
  private container: HTMLElement
  private openThree: OpenThree
  private pencil: Pencil | undefined
  private planCamera: PlanCamera

  private og: OpenGeometry | undefined
  private ogElements: any[] = []

  constructor(container: HTMLElement) {
    console.log('OpenPlans constructor')

    this.callback = this.callback.bind(this)

    this.container = container
    this.openThree = new OpenThree(container, this.callback)
    this.planCamera = this.openThree.planCamera

    this.openThree.planCamera.controls.addEventListener("update", () => {
      Glyphs.updateManager(this.openThree.threeCamera)
    })
  }

  callback() {
    // console.log(this.og?.labelRenderer)
    if (this.og?.labelRenderer) {
      this.og.update(this.openThree.scene, this.openThree.threeCamera)
      // Glyphs.updateManager(this.openThree.threeCamera)
    }
  }

  async setupOpenGeometry() {
    this.og = new OpenGeometry(this.container, this.openThree.scene, this.openThree.threeCamera)
    await this.og.setup()
    this.pencil = this.og.pencil

    Glyphs.scene = this.openThree.scene
    Glyphs.camera = this.openThree.threeCamera
    Glyphs.openGeometry = this.og
  }

  // addTheme(theme: ICanvasTheme) {

  // }

  // setTheme(themeName: string) {

  // }

  wall(): BaseWall {
    if (!this.pencil) {
      throw new Error('Pencil not initialized')
    }
    const wall = new BaseWall(0xedf2f4, this.pencil)
    this.openThree.scene.add(wall)
    this.ogElements.push(wall)
    return wall
  }

  door(): BaseDoor {
    if (!this.pencil) {
      throw new Error('Pencil not initialized')
    }
    const door = new BaseDoor(this.pencil)
    door.doorColor = 0xadb5bd;
    this.openThree.scene.add(door)
    this.ogElements.push(door)
    return door
  }

  window(): BaseWindow {
    if (!this.pencil) {
      throw new Error('Pencil not initialized')
    }
    const window = new BaseWindow(this.pencil)
    // window.windowColor = 0xadb5bd;
    this.openThree.scene.add(window)
    this.ogElements.push(window)
    return window
  }

  space(): BaseSpace {
    if (!this.pencil) {
      throw new Error('Pencil not initialized')
    }
    const space = new BaseSpace(this.pencil)
    this.openThree.scene.add(space)
    this.ogElements.push(space)
    return space
  }

  doubleWindow(): DoubleWindow {
    if (!this.pencil) {
      throw new Error('Pencil not initialized')
    }
    const window = new DoubleWindow(this.pencil)
    // window.windowColor = 0xadb5bd;
    this.openThree.scene.add(window)
    this.ogElements.push(window)
    return window
  }

  getEntitiesByType(type: string) {
    return this.ogElements.filter((el) => el.ogType === type)
  }

  fit(element: string) {
    if (!element) return
    const entities = this.getEntitiesByType(element)
    if (entities.length === 0) return
    this.planCamera.fitToElement(entities)
  }

  glyph(text: string, size: number, color: number, staticZoom: boolean = true) {
    const glyph = Glyphs.addGlyph(text, size, color, staticZoom)
    return glyph
  }

  getGlyph(id: string): GlyphNode {
    const glyph = Glyphs.getGlyph(id)
    if (!glyph) throw new Error('Glyph not found')
    return glyph
  }

  selectGlyph(id: string) {
    if (!id) throw new Error('ID not provided')
    Glyphs.selectGlyph(id)
  }

  rotateGlyph(id: string, angle: number) {
    if (!id) throw new Error('ID not provided')
    Glyphs.rotateGlyph(id, angle)
  }

  get glyphNodes() {
    return Glyphs.glyphNodes
  }

  clearGlyphSelection() {
    Glyphs.clearSelection()
  }

  updateGlyphText(id: string, text: string) {
    Glyphs.updateGlyphText(id, text)
  }

  convertImpleniaToOGFormat(sourceJson: any) {
    console.log('Converting Implenia to OG format');
    const ogJSON = convertToOGFormat(sourceJson);
    this.generateGeometry(ogJSON);
  }

  ////// Automated Stuff
  /**
   * 
   * @param graph This is the graph that will be used to generate the geometry.
   * @returns 
   */
  public generateGeometry(graph: BuildingData): void {
    const wallText = this.glyph(`Implenia Building`, 2, 0x5D0E41, false);
    wallText.position.set(0, 0, 1);

    console.log('Generating geometry');
    console.log(graph);

    // Calling APIs to generate the geometry.
    
    const floors = graph.floors;
    console.log(floors);

    // Just doing for first floor
    for (let i = 0; i < 1; i++) {
      const floor = floors[i];
      const rooms = floor.OG_DATA;
      for (let j = 0; j < rooms.length; j++) {
        const roomId = rooms[j];
        const room = graph.rooms.find((r) => r.OG_ID === roomId);
        if (!room) return;

        // ROOM/SPACE visualization

        const roomCoords = room.coordinates;
        console.log(`Room coordinates for ${room.USER_DATA}: ${roomCoords}`);
        const roomSet: OPSpace = {
          id: j,
          position: { x: 0, y: 0, z: 0 },
          color: 0xff0000,
          type: 'internal',
          coordinates: roomCoords,
          labelName: room.USER_DATA
        }

        if (!this.pencil) return;
        const roomElement = new BaseSpace(this.pencil, roomSet);
        this.openThree.scene.add(roomElement);

        const roomElements = room.OG_DATA;
        for (let k = 0; k < roomElements.length; k++) {
          const elementFromRoom = roomElements[k];
          const elementType = elementFromRoom.OG_TYPE;
          switch (elementType) {
            case 'OG_WALL':
              const wall = graph.walls.find((w) => w.OG_ID === elementFromRoom.OG_ID);
              if (!wall) return;
              if (wall.type === 'internal') {
                // Generate wall geometry
                const start = wall.start;
                const end = wall.end;
                const thickness = wall.thickness;
                
                if (!this.pencil) return;

                const wallSet: OPWall = {
                  id: k,
                  position: { x: 0, y: 0, z: 0 },
                  color: 0xedf2f4,
                  type: 'concrete',
                  anchor: {
                    start: {
                      x: start[0],
                      y: start[1],
                      z: start[2]
                    },
                    end: {
                      x: end[0],
                      y: end[1],
                      z: end[2]
                    }
                  },
                  thickness: thickness,
                  halfThickness: thickness / 2
                }
                const wallElement = new BaseWall(0xedf2f4, this.pencil, wallSet);
                this.openThree.scene.add(wallElement);
                // console.log(`Processing wall: ${wall.USER_DATA}`);
                // const wallText = this.glyph(wall.USER_DATA, 1, 0x5D0E41, false);
                // wallText.position.set((start[0] + end[0]) / 2, (start[1] + end[1]) / 2, (start[2] + end[2]) / 2);
              }
              break;
            case 'OG_DOOR':
              const door = graph.doors.find((d) => d.OG_ID === elementFromRoom.OG_ID);
              console.log(door);
              if (!door) return;
              if (door.type === 'internal') {
                // Generate door geometry
                const start = door.start;
                const end = door.end;
                const thickness = door.thickness;
                const hingeThickness = door.hingeThickness;
                
                if (!this.pencil) return;
                console.log('Creating door');
                const doorSet: OPDoor = {
                  id: k,
                  position: { x: 0, y: 0, z: 0 },
                  doorColor: 0x00000,
                  anchor: {
                    start: {
                      x: -1,
                      y: 0,
                      z: 1
                    },
                    end: {
                      x: 1,
                      y: 0,
                      z: 0
                    }
                  },
                  thickness: thickness / 2,
                  halfThickness: thickness / 2 / 2,
                  hingeColor: 0x000000,
                  hingeThickness: hingeThickness,
                }
                const doorElement = new BaseDoor(this.pencil, doorSet);
                this.openThree.scene.add(doorElement);
              }
              break;
            default:
              break;
          }

          // if (wall.type === 'internal' && roomTest) {
          //   console.log(wall);
          //   // Generate wall geometry
          //   const start = wall.start;
          //   const end = wall.end;
          //   const thickness = wall.thickness;
            
          //   if (!this.pencil) return;

          //   const wallSet: OPWall = {
          //     id: k,
          //     position: { x: 0, y: 0, z: 0 },
          //     color: 0xedf2f4,
          //     type: 'concrete',
          //     anchor: {
          //       start: {
          //         x: start[0],
          //         y: start[1],
          //         z: start[2]
          //       },
          //       end: {
          //         x: end[0],
          //         y: end[1],
          //         z: end[2]
          //       }
          //     },
          //     thickness: thickness,
          //     halfThickness: thickness / 2
          //   }
          //   const wallElement = new BaseWall(0xedf2f4, this.pencil, wallSet);
          //   this.openThree.scene.add(wallElement);
          // }
        }
      }
    }
  }
}
