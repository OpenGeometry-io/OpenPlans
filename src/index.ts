import { OpenGeometry } from '../kernel/dist';
import { Pencil } from '../kernel/dist/src/pencil';
import { BaseDoor } from './elements/base-door';
import { BaseWall } from './elements/base-wall';
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
    this.container = container
    this.openThree = new OpenThree(container)
    this.planCamera = this.openThree.planCamera
  }

  async setupOpenGeometry() {
    this.og = new OpenGeometry(this.container, this.openThree.scene, this.openThree.threeCamera)
    await this.og.setup()
    this.pencil = this.og.pencil
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

  getEntitiesByType(type: string) {
    return this.ogElements.filter((el) => el.ogType === type)
  }

  fit(element: string) {
    if (!element) return
    const entities = this.getEntitiesByType(element)
    if (entities.length === 0) return
    this.planCamera.fitToElement(entities)
  }
}
