export interface Layout {
  name: string
  content: string
  index: number
  image_friendly?: boolean
  recommended_aspect_ratio?: string
  image_position?: string
  description?: string
}

export interface LayoutRequest {
  layouts: Layout[]
  title?: string
  position: 'beginning' | 'end' | 'after-current'
}

