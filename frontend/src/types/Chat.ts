export type MessageRole = 'user' | 'model' | 'system'

export interface BaseMessage {
  role: MessageRole
  timestamp?: string
}

export interface TextMessage extends BaseMessage {
  content?: string
  parts?: Array<{ text: string } | { inline_data?: { mime_type: string; data: string } }>
}

export interface RichMessage extends BaseMessage {
  message_type: string
  data: Record<string, any>
  content?: string
}

export type Message = TextMessage | RichMessage

export interface ImageRequestDetails {
  prompt: string
  aspect_ratio: string
  resolution: string
  batch_slug: string
  system_message?: string
  user_message?: string
  remix_slide_number?: number
  remix_image_path?: string
}

export interface ImageCandidate {
  image_path: string
  index: number
  batch_slug: string
}

export interface ImageSelection {
  index: number
  batch_slug: string
  filename: string
  saved_path: string
}

export interface ToolCall {
  name: string
  args: Record<string, any>
  result?: any
  timestamp?: string
}

export interface AgentRequestDetails {
  user_message: string
  model?: string
  temperature?: number
  max_tokens?: number
  [key: string]: any
}

