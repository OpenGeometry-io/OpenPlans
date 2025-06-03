import { OpenGeometry } from '../kernel/dist';
import { Pencil, PencilMode } from '../kernel/dist/src/pencil';
import { BaseDoor } from './elements/base-door';
import { BaseSpace } from './elements/base-spaces';
import { OPDoor, OPSpace, OPWall } from './elements/base-types';
import { BaseWindow } from './elements/base-window';
import { DoubleWindow } from './elements/double-window';
import { GlyphNode, Glyphs } from '@opengeometry/openglyph';
import { BuildingData } from './parser/IGraph';
import convertToOGFormat from './parser/ImpleniaConverter';
import { PlanCamera } from './service/plancamera';
import { OpenThree } from './service/three';
import * as THREE from 'three';
import { Event } from './utils/event';
import { PaperFrame } from './drawing';
import { LogoInfoBlock, LogoInfoBlockOptions } from './drawing/logo-info-block';
import { RowInfoBlock, RowInfoBlockOptions } from './drawing/row-info-block';
import { Board, OPBoard } from './elements/board';
import { OPPolyLine, PolyLine } from './shapes/op-polyline';
import { OPPolygon, Polygon } from './shapes/op-polygon';
import { SimpleWall } from './elements/op-wall';

export class OpenPlans {
  private container: HTMLElement
  private openThree: OpenThree
  static sOThree: OpenThree;

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
    OpenPlans.sOThree = this.openThree;

    this.planCamera = this.openThree.planCamera
    
    this.openThree.planCamera.controls.addEventListener("update", () => {
      Glyphs.updateManager(this.openThree.threeCamera)
    })
  }

  callback() {
    if (this.og?.labelRenderer) {
      this.og.update(this.openThree.scene, this.openThree.threeCamera)
    }

    for (const element of this.ogElements) {
      if (
        element.ogType === 'OPPolyLine' || 
        element.ogType === 'OPPolygon' ||
        element.ogType === 'OPWall'
      ) {
        element.calulateAnchorEdges(true);
      }
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

  simpleWall(config: OPWall): SimpleWall {
    if (!this.pencil) {
      throw new Error('Pencil not initialized')
    }
    const wall = new SimpleWall(config);
    wall.pencil = this.pencil;
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
    this.openThree.scene.add(window)
    this.ogElements.push(window)
    return window
  }

  board(boardConfig?:OPBoard): Board {
    if (!this.pencil) {
      throw new Error('Pencil not initialized')
    }
    const board = new Board(boardConfig)
    this.openThree.scene.add(board)
    this.ogElements.push(board)
    return board
  }

  polyline(polyLineConfig?: OPPolyLine): PolyLine {
    if (!this.pencil) {
      throw new Error('Pencil not initialized')
    }
    const polyline = new PolyLine(polyLineConfig)
    polyline.pencil = this.pencil;
    this.openThree.scene.add(polyline)
    this.ogElements.push(polyline)
    return polyline
  }

  polygon(polygonConfig?: OPPolygon): Polygon {
    if (!this.pencil) {
      throw new Error('Pencil not initialized')
    }
    const polygon = new Polygon(polygonConfig)
    polygon.pencil = this.pencil;
    this.openThree.scene.add(polygon)
    this.ogElements.push(polygon)
    return polygon
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
    // this.generateGeometry(ogJSON);
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

  // infoBlock() {
  //   const infoBlock = new InfoBlock()
  //   return infoBlock
  // }

  logoInfoBlock(options:LogoInfoBlockOptions) {
    const logoBlock = new LogoInfoBlock(options);
    this.openThree.scene.add(logoBlock);
    return logoBlock
  }

  rowInfoBlock(options: RowInfoBlockOptions) {
    const rowInfoBlock = new RowInfoBlock(options);
    this.openThree.scene.add(rowInfoBlock);
    return rowInfoBlock;
  }

  static toScreenPosition(pos: THREE.Vector3): { x: number; y: number } {
    const vector = pos.clone().project(OpenPlans.sOThree.threeCamera);
  
    const halfWidth = OpenPlans.sOThree.renderer.domElement.clientWidth / 2;
    const halfHeight = OpenPlans.sOThree.renderer.domElement.clientHeight / 2;
  
    return {
      x: vector.x * halfWidth + halfWidth,
      y: -vector.y * halfHeight + halfHeight
    };
  }
}
