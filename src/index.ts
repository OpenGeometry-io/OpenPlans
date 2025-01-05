import { OpenGeometry } from '../kernel/dist';
import { Pencil } from '../kernel/dist/src/pencil';
import { BaseDoor } from './elements/base-door';
import { BaseWall } from './elements/base-wall';
import { BaseWindow } from './elements/base-window';
import { DoubleWindow } from './elements/double-window';
import { GlyphNode, Glyphs } from './glyphs';
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

  glyph(text: string, size: number, color: string, staticZoom: boolean = true) {
    const glyph = Glyphs.addGlyph(text, size, color, staticZoom)
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
}
