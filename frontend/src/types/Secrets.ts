export type Provider = 'google_gemini' | 'openai' | 'anthropic' | 'bedrock'

export interface ModelConfig {
  primary_model?: string
  secondary_model?: string
  image_model?: string
}

export interface Profile {
  id: string
  name: string
  description: string
  provider: Provider
  api_key_masked?: string  // Only for display
  created_at: string
  updated_at: string
  model_config: ModelConfig
  is_active: boolean
}

export interface ProfileCreate {
  name: string
  provider: Provider
  api_key: string
  description?: string
  model_config?: ModelConfig
}

export interface ProfileUpdate {
  name?: string
  description?: string
  api_key?: string
  model_config?: ModelConfig
}
