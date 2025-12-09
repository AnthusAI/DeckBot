import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme, ColorTheme, Preferences } from '../types/Settings'
import type { Presentation } from '../types/Presentation'

interface AppState {
  // Theme
  theme: Theme
  colorTheme: ColorTheme
  setTheme: (theme: Theme) => void
  setColorTheme: (colorTheme: ColorTheme) => void

  // Current presentation
  currentPresentation: Presentation | null
  currentSlide: number
  setCurrentPresentation: (presentation: Presentation | null) => void
  setCurrentSlide: (slide: number) => void

  // Preferences
  preferences: Preferences
  setPreferences: (prefs: Partial<Preferences>) => void

  // View state
  activeView: 'preview' | 'code' | 'layouts' | 'settings'
  setActiveView: (view: 'preview' | 'code' | 'layouts' | 'settings') => void

  // Welcome screen
  showWelcomeScreen: boolean
  setShowWelcomeScreen: (show: boolean) => void

  // Fast mode (use secondary model)
  fastMode: boolean
  setFastMode: (enabled: boolean) => void
  toggleFastMode: () => void

  // Mermaid editor state
  editingMermaid: boolean
  mermaidCode: string | null
  mermaidBlockIndex: number | null
  setEditingMermaid: (editing: boolean, code?: string, blockIndex?: number) => void

  // Excalidraw editor state
  editingExcalidraw: boolean
  excalidrawJson: string | null
  excalidrawBlockIndex: number | null
  setEditingExcalidraw: (editing: boolean, json?: string, blockIndex?: number) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Theme defaults
      theme: (localStorage.getItem('deckbot_theme') as Theme) || 'dark',
      colorTheme: (localStorage.getItem('deckbot_color_theme') as ColorTheme) || 'miami',
      
      // Current presentation
      currentPresentation: null,
      currentSlide: 1,
      
      // Preferences
      preferences: {},
      
      // View state
      activeView: 'preview',
      
      // Welcome screen
      showWelcomeScreen: true,

      // Fast mode
      fastMode: false,

      // Mermaid editor
      editingMermaid: false,
      mermaidCode: null,
      mermaidBlockIndex: null,

      // Excalidraw editor
      editingExcalidraw: false,
      excalidrawJson: null,
      excalidrawBlockIndex: null,

      // Actions
      setTheme: (theme) => {
        set({ theme })
        localStorage.setItem('deckbot_theme', theme)
        const effectiveTheme = theme === 'system'
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : theme
        document.documentElement.setAttribute('data-theme', effectiveTheme)
      },
      
      setColorTheme: (colorTheme) => {
        set({ colorTheme })
        localStorage.setItem('deckbot_color_theme', colorTheme)
        document.documentElement.setAttribute('data-color-theme', colorTheme)
      },
      
      setCurrentPresentation: (presentation) => {
        set({ currentPresentation: presentation })
        if (presentation) {
          console.log(`Opened presentation: ${presentation.name}`)
          set({ showWelcomeScreen: false, activeView: 'preview' })
        } else {
          set({ showWelcomeScreen: true })
        }
      },

      setCurrentSlide: (slide) => {
        set({ currentSlide: slide })
      },
      
      setPreferences: (prefs) => set((state) => ({
        preferences: { ...state.preferences, ...prefs }
      })),
      
      setActiveView: (view) => set({ activeView: view }),

      setShowWelcomeScreen: (show) => set({ showWelcomeScreen: show }),

      setFastMode: (enabled) => set({ fastMode: enabled }),

      toggleFastMode: () => set((state) => ({ fastMode: !state.fastMode })),

      setEditingMermaid: (editing, code, blockIndex) => set({
        editingMermaid: editing,
        mermaidCode: code ?? null,
        mermaidBlockIndex: blockIndex ?? null,
      }),

      setEditingExcalidraw: (editing, json, blockIndex) => set({
        editingExcalidraw: editing,
        excalidrawJson: json ?? null,
        excalidrawBlockIndex: blockIndex ?? null,
      }),
    }),
    {
      name: 'deckbot-app-storage',
      partialize: (state) => ({
        theme: state.theme,
        colorTheme: state.colorTheme,
        preferences: state.preferences,
        activeView: state.activeView,
        fastMode: state.fastMode,
      }),
    }
  )
)


