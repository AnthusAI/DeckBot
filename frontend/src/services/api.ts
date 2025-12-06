import type { Presentation, Template, PresentationSettings } from '../types/Presentation'
import type { Message } from '../types/Chat'
import type { Layout } from '../types/Layout'
import type { Preferences } from '../types/Settings'
import type { Profile, ProfileCreate, ProfileUpdate } from '../types/Secrets'
import type {
  FileTreeItem,
  FileContent,
  PreviewSlidesResponse,
  CreatePresentationRequest,
  SaveAsPresentationRequest,
  ChatRequest,
  GenerateImagesRequest,
  SelectImageRequest,
  SelectLayoutRequest,
  SaveFileRequest,
  UpdatePresentationSettingsRequest,
  UpdateStyleRequest,
  StyleSpecResponse,
  AgentPromptsResponse,
  ImagePromptsResponse,
} from '../types/API'

let API_BASE = import.meta.env.DEV ? '' : ''
let configFetched = false

// Fetch API configuration from backend (only in dev mode when using proxy)
async function ensureConfig() {
  if (configFetched || !import.meta.env.DEV) return
  
  try {
    await fetch('/api/config')
    // In dev mode with Vite proxy, we don't need to change API_BASE
    // The proxy handles forwarding to the correct backend
    configFetched = true
  } catch (error) {
    console.warn('Failed to fetch API config, using defaults:', error)
    configFetched = true
  }
}

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  await ensureConfig()
  
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

async function fetchFormData<T>(url: string, formData: FormData): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// Presentation APIs
export const presentationsAPI = {
  list: (): Promise<Presentation[]> => fetchJSON('/api/presentations'),
  
  get: (name: string): Promise<Presentation> => fetchJSON(`/api/presentations/${encodeURIComponent(name)}`),
  
  create: (data: CreatePresentationRequest): Promise<{ message: string; name: string }> =>
    fetchJSON('/api/presentations/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  delete: (name: string): Promise<{ message: string; name: string }> =>
    fetchJSON('/api/presentations/delete', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  
  load: (name: string): Promise<{ message: string; history: Message[]; presentation: Presentation }> =>
    fetchJSON('/api/load', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  
  previewSlides: (name: string): Promise<PreviewSlidesResponse> =>
    fetchJSON(`/api/presentations/${encodeURIComponent(name)}/preview-slides`),
  
  preview: (): Promise<string> => fetch('/api/presentation/preview').then(r => r.text()),
  
  settings: {
    get: (): Promise<PresentationSettings> => fetchJSON('/api/presentation/settings'),
    
    update: (data: UpdatePresentationSettingsRequest): Promise<{ message: string }> =>
      fetchJSON('/api/presentation/settings', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  
  saveAs: (data: SaveAsPresentationRequest): Promise<{ message: string; name: string; folder_name: string }> =>
    fetchJSON('/api/presentation/save-as', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  exportPDF: (): Promise<{ message: string }> =>
    fetchJSON('/api/presentation/export-pdf', {
      method: 'POST',
    }),
  
  files: {
    list: (): Promise<{ files: FileTreeItem[] }> => fetchJSON('/api/presentation/files'),
    
    getContent: (path: string): Promise<FileContent> =>
      fetchJSON(`/api/presentation/file-content?path=${encodeURIComponent(path)}`),
    
    save: (data: SaveFileRequest): Promise<{ success: boolean; message: string; compile?: any }> =>
      fetchJSON('/api/presentation/file-save', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  
  style: {
    get: (): Promise<StyleSpecResponse> => fetchJSON('/api/presentation/style'),
    
    update: (data: UpdateStyleRequest): Promise<{ message: string; style: StyleSpecResponse }> =>
      fetchFormData('/api/presentation/style', createStyleFormData(data)),
  },
  
  prompts: {
    get: (): Promise<AgentPromptsResponse> => fetchJSON('/api/presentation/prompts'),
    
    getAgent: (): Promise<{ system_prompt: string }> => fetchJSON('/api/presentation/agent-prompt'),
    
    getImage: (prompt?: string): Promise<ImagePromptsResponse> =>
      fetchJSON(`/api/presentation/image-prompts${prompt ? `?prompt=${encodeURIComponent(prompt)}` : ''}`),
  },
}

// Template APIs
export const templatesAPI = {
  list: (): Promise<Template[]> => fetchJSON('/api/templates'),
  
  delete: (name: string): Promise<{ message: string; name: string }> =>
    fetchJSON('/api/templates/delete', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  
  previewSlides: (name: string): Promise<PreviewSlidesResponse> =>
    fetchJSON(`/api/templates/${encodeURIComponent(name)}/preview-slides`),
}

// Chat APIs
export const chatAPI = {
  send: (data: ChatRequest): Promise<{ status: string }> =>
    fetchFormData('/api/chat', createChatFormData(data)),
  
  cancel: (): Promise<{ status: string }> =>
    fetchJSON('/api/chat/cancel', {
      method: 'POST',
    }),
}

// Image APIs
export const imagesAPI = {
  generate: (data: GenerateImagesRequest): Promise<{ message: string }> =>
    fetchJSON('/api/images/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  select: (data: SelectImageRequest): Promise<{ path: string; filename: string }> =>
    fetchJSON('/api/images/select', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  serve: (path: string): string => `/api/serve-image?path=${encodeURIComponent(path)}`,
}

// Layout APIs
export const layoutsAPI = {
  list: (): Promise<{ layouts: Layout[] }> => fetchJSON('/api/layouts'),
  
  select: (data: SelectLayoutRequest): Promise<{ status: string; layout?: string; title?: string }> =>
    fetchJSON('/api/layouts/select', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  preview: (layoutName: string): string => `/api/layouts/${encodeURIComponent(layoutName)}/preview`,
}

// Preferences APIs
export const preferencesAPI = {
  getAll: (): Promise<Preferences> => fetchJSON('/api/preferences'),
  
  get: (key: string): Promise<{ key: string; value: any }> => fetchJSON(`/api/preferences/${key}`),
  
  set: (key: string, value: any): Promise<{ message: string; key: string; value: any }> =>
    fetchJSON(`/api/preferences/${key}`, {
      method: 'POST',
      body: JSON.stringify({ value }),
    }),
  
  update: (data: Partial<Preferences>): Promise<{ message: string; preferences: Preferences }> =>
    fetchJSON('/api/preferences', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// Helper functions
function createChatFormData(data: ChatRequest): FormData {
  const formData = new FormData()
  formData.append('message', data.message)
  if (data.presentation_name) {
    formData.append('presentation_name', data.presentation_name)
  }
  if (data.current_slide) {
    formData.append('current_slide', String(data.current_slide))
  }
  // Note: Image uploads would be added separately as image_0, image_1, etc.
  return formData
}

function createStyleFormData(data: UpdateStyleRequest): FormData {
  const formData = new FormData()
  if (data.instructions !== undefined) {
    formData.append('instructions', data.instructions)
  }
  if (data['image_style.prompt'] !== undefined) {
    formData.append('image_style.prompt', data['image_style.prompt'])
  }
  if (data.delete_reference) {
    formData.append('delete_reference', 'true')
  }
  if (data.file) {
    formData.append('file', data.file)
  }
  return formData
}

// Secrets/Profile APIs
export const secretsAPI = {
  listProfiles: (): Promise<{ profiles: Profile[] }> =>
    fetchJSON('/api/secrets/profiles'),

  getProfile: (profileId: string): Promise<Profile> =>
    fetchJSON(`/api/secrets/profiles/${encodeURIComponent(profileId)}`),

  createProfile: (data: ProfileCreate): Promise<{ message: string; profile_id: string }> =>
    fetchJSON('/api/secrets/profiles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProfile: (profileId: string, data: ProfileUpdate): Promise<{ message: string; profile_id: string }> =>
    fetchJSON(`/api/secrets/profiles/${encodeURIComponent(profileId)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteProfile: (profileId: string): Promise<{ message: string; profile_id: string }> =>
    fetchJSON(`/api/secrets/profiles/${encodeURIComponent(profileId)}`, {
      method: 'DELETE',
    }),

  getActiveProfile: (): Promise<Profile> =>
    fetchJSON('/api/secrets/active-profile'),

  setActiveProfile: (profileId: string): Promise<{ message: string; profile_id: string }> =>
    fetchJSON('/api/secrets/active-profile', {
      method: 'POST',
      body: JSON.stringify({ profile_id: profileId }),
    }),

  migrateFromEnv: (): Promise<{ message: string; profile_id?: string }> =>
    fetchJSON('/api/secrets/migrate', {
      method: 'POST',
    }),
}
