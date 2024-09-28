/**
 * Infinity Grid Creator
 */
import * as THREE from 'three'
import { activeTheme, ICanvasTheme } from '../base-type'

export class PlanGrid {
  private grid: THREE.GridHelper
  private scene: THREE.Scene
  private theme: ICanvasTheme

  constructor(scene: THREE.Scene, theme: ICanvasTheme, activeTheme: activeTheme) {
    this.scene = scene
    this.theme = theme
    this.grid = new THREE.GridHelper(100, 100, theme[activeTheme].color, theme[activeTheme].color)
    this.scene.add(this.grid)
  }

  toggleGrid() {
    this.grid.visible = !this.grid.visible
  }

  applyTheme(activeTheme: activeTheme) {
    const lineMaterial = new THREE.LineBasicMaterial({ color: this.theme[activeTheme].color })
    this.grid.material = lineMaterial
    this.grid.material.color.set(this.theme[activeTheme].color)
  }
}