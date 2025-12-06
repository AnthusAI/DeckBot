import type { ColorSettings, FontSettings, ImageStyle } from './Presentation'

export interface APIResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface FileTreeItem {
  name: string
  path: string
  type: 'file' | 'folder' | 'image' | 'markdown' | 'json' | 'code'
  mtime?: string
  children?: FileTreeItem[]
}

export interface FileContent {
  type: 'text' | 'image' | 'binary'
  content?: string
  language?: string
  url?: string
  message?: string
}

export interface PreviewSlidesResponse {
  previews: string[]
  error?: string
}

// API request/response types
export interface CreatePresentationRequest {
  name: string
  description?: string
  template?: string
}

export interface SaveAsPresentationRequest {
  name: string
  description?: string
  copy_images?: boolean
}

export interface ChatRequest {
  message: string
  presentation_name?: string
  current_slide?: number
}

export interface GenerateImagesRequest {
  prompt: string
}

export interface SelectImageRequest {
  index: number
  filename?: string
}

export interface SelectLayoutRequest {
  layout_name: string
}

export interface SaveFileRequest {
  path: string
  content: string
}

export interface UpdatePresentationSettingsRequest {
  title?: string
  description?: string
  aspect_ratio?: string
  color_settings?: ColorSettings
  font_settings?: FontSettings
}

export interface UpdateStyleRequest {
  instructions?: string
  'image_style.prompt'?: string
  delete_reference?: boolean
  file?: File
}

export interface StyleSpecResponse {
  instructions: string
  image_style: ImageStyle
}

export interface AgentPromptsResponse {
  presentation_agent: any
  image_agent: any
  prompt_templates: any
}

export interface ImagePromptsResponse {
  generating: {
    system_message: string
    user_message: string
  }
  remix_slide: {
    system_message: string
    user_message: string
  }
  remix_image: {
    system_message: string
    user_message: string
  }
}

// SSE Event types
export type SSEEventType =
  | 'message'
  | 'thinking_start'
  | 'thinking_end'
  | 'image_request_details'
  | 'image_progress'
  | 'image_candidate'
  | 'images_ready'
  | 'image_selected'
  | 'layout_request'
  | 'presentation_updated'
  | 'tool_call'
  | 'tool_result'
  | 'agent_request_details'
  | 'error'

export interface SSEEvent {
  type: SSEEventType
  data: any
}

