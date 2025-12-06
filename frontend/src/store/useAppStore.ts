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
          localStorage.setItem('deckbot_current_presentation', presentation.name)
          console.log(`Opened presentation: ${presentation.name}`)
          set({ showWelcomeScreen: false, activeView: 'preview' })
        } else {
          localStorage.removeItem('deckbot_current_presentation')
          set({ showWelcomeScreen: true })
        }
      },

      setCurrentSlide: (slide) => {
        set({ currentSlide: slide })
        localStorage.setItem('deckbot_current_slide', String(slide))
      },
      
      setPreferences: (prefs) => set((state) => ({
        preferences: { ...state.preferences, ...prefs }
      })),
      
      setActiveView: (view) => set({ activeView: view }),
      
      setShowWelcomeScreen: (show) => set({ showWelcomeScreen: show }),
    }),
    {
      name: 'deckbot-app-storage',
      partialize: (state) => ({
        theme: state.theme,
        colorTheme: state.colorTheme,
        currentSlide: state.currentSlide,
        preferences: state.preferences,
        activeView: state.activeView,
      }),
    }
  )
)

