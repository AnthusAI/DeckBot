import { useEffect, useState } from 'react'
import { useAppStore } from './store/useAppStore'
import { useChatStore } from './store/useChatStore'
import { useSSEIntegration } from './hooks/useSSEIntegration'
import { MenuBar } from './components/layout/MenuBar'
import { Resizer } from './components/layout/Resizer'
import { WelcomeScreen } from './components/presentation/WelcomeScreen'
import { CreatePresentationModal } from './components/presentation/CreatePresentationModal'
import { SaveAsModal } from './components/presentation/SaveAsModal'
import { PreferencesModal } from './components/presentation/PreferencesModal'
import { ChatHistory } from './components/chat/ChatHistory'
import { ChatInput } from './components/chat/ChatInput'
import { PreviewView } from './components/views/PreviewView'
import { LayoutsView } from './components/views/LayoutsView'
import { CodeView } from './components/code/CodeView'
import { SettingsView } from './components/views/SettingsView'
import { presentationsAPI } from './services/api'

function App() {
  const { theme, colorTheme, setTheme, setColorTheme, showWelcomeScreen, currentPresentation, activeView, setActiveView, setShowWelcomeScreen, setCurrentPresentation, setCurrentSlide } = useAppStore()
  const { setMessages } = useChatStore()
  const [sidebarWidth, setSidebarWidth] = useState(600)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSaveAsModal, setShowSaveAsModal] = useState(false)
  const [showPreferencesModal, setShowPreferencesModal] = useState(false)
  
  // Initialize SSE integration (connects and handles all events)
  useSSEIntegration()
  
  // Initialize theme and restore session on mount
  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('deckbot_theme') as 'light' | 'dark' | 'system' | null
    const savedColorTheme = localStorage.getItem('deckbot_color_theme') as 'miami' | 'midwest' | 'california' | null

    if (savedTheme) setTheme(savedTheme)
    if (savedColorTheme) setColorTheme(savedColorTheme)

    // Apply theme
    const effectiveTheme = (savedTheme || theme) === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : (savedTheme || theme)
    document.documentElement.setAttribute('data-theme', effectiveTheme)
    document.documentElement.setAttribute('data-color-theme', savedColorTheme || colorTheme)

    // Restore saved presentation
    const savedPresentation = localStorage.getItem('deckbot_current_presentation')
    const savedSlide = localStorage.getItem('deckbot_current_slide')

    if (savedPresentation) {
      console.log(`Restoring presentation: ${savedPresentation} (slide ${savedSlide || 1})`)

      // Load the presentation from the API
      presentationsAPI.load(savedPresentation)
        .then((data) => {
          // Set the current presentation in the store
          setCurrentPresentation(data.presentation)

          // Restore chat history
          if (data.history && data.history.length > 0) {
            setMessages(data.history)
          }

          // Restore slide number if saved
          if (savedSlide) {
            const slideNum = parseInt(savedSlide)
            if (slideNum > 1) {
              setCurrentSlide(slideNum)
            }
          }

          // Hide welcome screen
          setShowWelcomeScreen(false)
        })
        .catch((err) => {
          console.error('Error restoring presentation:', err)
          // Show welcome screen if restoration fails
          setShowWelcomeScreen(true)
        })
    }

    // Listen for system theme changes
    if ((savedTheme || theme) === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = (e: MediaQueryListEvent) => {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light')
      }
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])
  
  // Update theme when it changes
  useEffect(() => {
    const effectiveTheme = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme
    document.documentElement.setAttribute('data-theme', effectiveTheme)
    document.documentElement.setAttribute('data-color-theme', colorTheme)
  }, [theme, colorTheme])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <MenuBar 
        onCreatePresentation={() => setShowCreateModal(true)}
        onOpenPresentation={() => setShowWelcomeScreen(true)}
        onSaveAs={() => setShowSaveAsModal(true)}
        onExportPDF={async () => {
          if (!currentPresentation) return
          try {
            await presentationsAPI.exportPDF()
            alert('PDF export started')
          } catch (error: any) {
            alert(`Export failed: ${error.message}`)
          }
        }}
        onPreferences={() => setShowPreferencesModal(true)}
        onPresentationSettings={() => setActiveView('settings')}
      />
      
      {showWelcomeScreen ? (
        <WelcomeScreen />
      ) : (
        <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 40px)' }}>
          {/* Chat Panel - main-chat equivalent */}
          <div className="flex-1 flex flex-col min-w-[400px] bg-background">
            <ChatHistory />
            <ChatInput />
          </div>

          {/* Resizer */}
          {currentPresentation && (
            <>
              <Resizer onResize={setSidebarWidth} initialSize={sidebarWidth} />
              
              {/* Sidebar */}
              <div
                className="flex flex-col bg-[hsl(var(--card))] border-l border-border"
                style={{ width: `${sidebarWidth}px`, minWidth: '300px', maxWidth: '1200px' }}
              >
                {activeView === 'preview' && <PreviewView />}
                {activeView === 'code' && <CodeView />}
                {activeView === 'layouts' && <LayoutsView />}
                {activeView === 'settings' && <SettingsView />}
              </div>
            </>
          )}
        </div>
      )}

      <CreatePresentationModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
      <SaveAsModal open={showSaveAsModal} onClose={() => setShowSaveAsModal(false)} />
      <PreferencesModal open={showPreferencesModal} onClose={() => setShowPreferencesModal(false)} />
    </div>
  )
}

export default App
