import { OpenGeometry } from '../kernel/dist';
import { Pencil, PencilMode } from '../kernel/dist/src/pencil';
import { BaseDoor } from './elements/base-door';
import { BaseSpace } from './elements/base-spaces';
import { OPDoor, OPSpace, OPWall } from './elements/base-types';
import { BaseWall } from './elements/base-wall';
import { BaseWindow } from './elements/base-window';
import { DoubleWindow } from './elements/double-window';
import { GlyphNode, Glyphs } from '@opengeometry/openglyph';
import { BuildingData } from './parser/IGraph';
import convertToOGFormat from './parser/ImpleniaConverter';
import { PlanCamera } from './service/plancamera';
import { OpenThree } from './service/three';
import * as THREE from 'three';
import { BaseWall2 } from './elements/base-wall-2';
import { Event } from './utils/event';
import { PaperFrame } from './drawing';
import { InfoBlock } from './drawing/info-block';
import { LogoInfoBlock } from './drawing/logo-block';
import { RowInfoBlock, RowInfoBlockOptions } from './drawing/row-info-block2';

export class OpenPlans {
  private container: HTMLElement
  private openThree: OpenThree
  private pencil: Pencil | undefined
  private planCamera: PlanCamera

  private og: OpenGeometry | undefined
  private ogElements: any[] = []

  private onRender: Event<void> = new Event<void>();

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
    if (this.og?.labelRenderer) {
      this.og.update(this.openThree.scene, this.openThree.threeCamera)
    }

    this.onRender.trigger();
  }

  async setupOpenGeometry(wasmURL: string) {
    this.og = new OpenGeometry(this.container, this.openThree.scene, this.openThree.threeCamera)
    await this.og.setup(wasmURL)
    this.pencil = this.og.pencil

    await Glyphs.loadFaces('Source_Code_Pro_Regular');
    Glyphs.scene = this.openThree.scene
    Glyphs.camera = this.openThree.threeCamera

    this.pencil?.onCursorDown.add((coords) => {
      console.log('Cursor Down', coords)
    });
  }

  drawDoorByPencil(enabled: boolean) {
    if (!this.pencil) return

    if (enabled) {
      this.pencil.mode = 'cursor';
      this.pencil.onCursorDown.add((coords) => {
        console.log('Cursor Down', coords);
      });
    } else {
      this.pencil.mode = 'select';
    }
  }

  drawDoubleWindowByPencil(enabled: boolean) {
    if (!this.pencil) return

    if (enabled) {
      this.pencil.mode = 'cursor';
      this.pencil.onCursorDown.add((coords) => {
        console.log('Cursor Down', coords);
      });
    } else {
      this.pencil.mode = 'select';
    }
  }

  wall(): BaseWall {
    if (!this.pencil) {
      throw new Error('Pencil not initialized')
    }
    const wall = new BaseWall(0xedf2f4, this.pencil)
    this.openThree.scene.add(wall)
    this.ogElements.push(wall)
    return wall
  }
  
  wall2(): BaseWall2 {
    if (!this.pencil) {
      throw new Error('Pencil not initialized');
    }
    const wall = new BaseWall2(this.pencil);
    this.openThree.scene.add(wall);
    this.ogElements.push(wall);
    return wall;
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
    const ogJSON = convertToOGFormat(sourceJson);
    this.generateGeometry(ogJSON);
  }

  /**
   * 
   * @param graph This is the graph that will be used to generate the geometry.
   * @returns 
   */
  public generateGeometry(graph: BuildingData): void {
    const floors = graph.floors;

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
        // console.log(`Room coordinates for ${room.USER_DATA}: ${roomCoords}`);
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
        this.ogElements.push(roomElement);

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

                this.ogElements.push(wallElement);
              }
              break;
            case 'OG_DOOR':
              const door = graph.doors.find((d) => d.OG_ID === elementFromRoom.OG_ID);
              if (!door) return;
              if (door.type === 'internal') {
                // Generate door geometry
                const start = door.start;
                const end = door.end;
                const thickness = door.thickness;
                const hingeThickness = door.hingeThickness;
                
                if (!this.pencil) return;
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

                this.ogElements.push(doorElement);
              }
              break;
            default:
              break;
          }
        }
      }
    }
  }


  public startEditingSpaces() {
    const spaces = this.getEntitiesByType('space');
    for (let i = 0; i < spaces.length; i++) {
      // change material to white
      const baseMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
      spaces[i].material = baseMaterial;

      spaces[i].isEditing = true;
    }
  }

  public stopEditingSpaces() {
    const spaces = this.getEntitiesByType('space');
    for (let i = 0; i < spaces.length; i++) {
      spaces[i].isEditing = false;
      spaces[i].material = new THREE.MeshBasicMaterial({ color: spaces[i].spaceSet.color, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
    }
  }

  public fitToSpace(spaceId: string) {
    const space = this.getEntitiesByType('space').find((s) => s.name === spaceId);
    if (!space) return;
    this.planCamera.fitToElement([space]);
  }

  public fitToAllSpaces() {
    const spaces = this.getEntitiesByType('space');
    this.planCamera.fitToElement(spaces);
  }

  public getSpaceData(spaceId: string) {
    const space = this.getEntitiesByType('space').find((s) => s.name === spaceId);
    if (!space) return;
    return space.spaceSet;
  }

  public getSpaceArea(spaceId: string) {
    const space = this.getEntitiesByType('space').find((s) => s.name === spaceId);
    if (!space) return;
    const spaceArea = space.area;
    return spaceArea;
  }

  public getElementArea(elementId: string) {
    const element = this.ogElements.find((el) => el.id === elementId);
    if (!element) return;
    const elementArea = element.area;
    return elementArea;
  }

  /**
   * Paper Creation and Frames
   */
  paperFrame() {
    // if (!this.pencil) {
    //   throw new Error('Pencil not initialized')
    // }
    const paperFrame = new PaperFrame()
    this.openThree.scene.add(paperFrame)
    this.ogElements.push(paperFrame)
    return paperFrame
  }

  infoBlock() {
    const infoBlock = new InfoBlock()
    return infoBlock
  }

  logoInfoBlock() {
    const logoBlock = new LogoInfoBlock()
    return logoBlock
  }

  rowInfoBlock(options: RowInfoBlockOptions) {
    const rowInfoBlock = new RowInfoBlock(options);
    return rowInfoBlock;
  }
}

