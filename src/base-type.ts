import * as THREE from 'three'

export interface ITheme {
  background: string
  color: string
  gridColor: number
}

export type activeTheme = 'darkBlue' | 'light' | 'dark'

export interface ICanvasTheme {
  darkBlue: ITheme,
  light: ITheme,
  dark: ITheme,
}