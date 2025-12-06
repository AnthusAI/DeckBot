export interface Presentation {
  name: string
  description?: string
  aspect_ratio?: string
  slide_count?: number
  last_modified?: string
  created_at?: string
  color_settings?: ColorSettings
  font_settings?: FontSettings
  image_style?: ImageStyle
  design_opinions?: Record<string, string>
  instructions?: string
  _folder_name?: string
}

export interface Template {
  name: string
  description?: string
  slide_count?: number
}

export interface ColorSettings {
  primary?: string
  secondary?: string
  accent?: string
  danger?: string
  muted?: string
  foreground?: string
  background?: string
}

export interface FontSettings {
  primary?: string
  secondary?: string
}

export interface ImageStyle {
  prompt?: string
  style_reference?: string | null
}

export interface PresentationSettings {
  title: string
  description: string
  aspect_ratio: string
  color_settings: ColorSettings
  font_settings: FontSettings
}

