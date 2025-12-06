import { create } from 'zustand'
import type { Presentation, Template } from '../types/Presentation'

interface PresentationState {
  presentations: Presentation[]
  templates: Template[]
  isLoading: boolean
  error: string | null
  
  // Actions
  setPresentations: (presentations: Presentation[]) => void
  setTemplates: (templates: Template[]) => void
  addPresentation: (presentation: Presentation) => void
  removePresentation: (name: string) => void
  updatePresentation: (name: string, updates: Partial<Presentation>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const usePresentationStore = create<PresentationState>((set) => ({
  presentations: [],
  templates: [],
  isLoading: false,
  error: null,
  
  setPresentations: (presentations) => set({ presentations }),
  
  setTemplates: (templates) => set({ templates }),
  
  addPresentation: (presentation) => set((state) => ({
    presentations: [...state.presentations, presentation]
  })),
  
  removePresentation: (name) => set((state) => ({
    presentations: state.presentations.filter(p => p.name !== name)
  })),
  
  updatePresentation: (name, updates) => set((state) => ({
    presentations: state.presentations.map(p => 
      p.name === name ? { ...p, ...updates } : p
    )
  })),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
}))

