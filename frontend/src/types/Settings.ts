export type Theme = 'light' | 'dark' | 'system'
export type ColorTheme = 'miami' | 'midwest' | 'california'

export interface Preferences {
  theme?: Theme
  color_theme?: ColorTheme
}

