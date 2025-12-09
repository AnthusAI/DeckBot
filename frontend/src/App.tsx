import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAppStore } from './store/useAppStore'
import { useChatStore } from './store/useChatStore'
import { useSSEIntegration } from './hooks/useSSEIntegration'
import { MenuBar } from './components/layout/MenuBar'
import { ViewToggleBar } from './components/layout/ViewToggleBar'
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
import { MermaidEditor } from './components/code/MermaidEditor'
import { ExcalidrawEditor } from './components/code/ExcalidrawEditor'
import { replaceMermaidBlock, replaceExcalidrawBlock } from './services/diagramExtractor'
import { presentationsAPI } from './services/api'

// Inner component that uses router hooks
function AppContent() {
  const navigate = useNavigate()
  const { presentationName } = useParams<{ presentationName?: string }>()
  const [searchParams] = useSearchParams()
  const { theme, colorTheme, setTheme, setColorTheme, currentPresentation, currentSlide, activeView, setActiveView, setCurrentPresentation, setCurrentSlide, editingMermaid, mermaidCode, mermaidBlockIndex, setEditingMermaid, editingExcalidraw, excalidrawJson, excalidrawBlockIndex, setEditingExcalidraw } = useAppStore()
  
  // Debug log for Excalidraw editing state
  useEffect(() => {
    console.log('[App] editingExcalidraw:', editingExcalidraw, 'excalidrawJson length:', excalidrawJson?.length || 0)
  }, [editingExcalidraw, excalidrawJson])
  const { setMessages } = useChatStore()
  const [sidebarWidth, setSidebarWidth] = useState(600)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSaveAsModal, setShowSaveAsModal] = useState(false)
  const [showPreferencesModal, setShowPreferencesModal] = useState(false)
  
  // Check for Electron mode immediately (synchronous check on first render)
  // This must be synchronous to prevent MenuBar from flashing
  const electronMode = (() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false
    }
    
    const win = window as any
    
    // ONLY trust the preload script flag - this is the most reliable way
    // The preload script ONLY runs in Electron, never in a browser
    if (win.__DECKBOT_ELECTRON__ === true) {
      return true
    }
    
    // Fallback: Check for electronAPI (also only exists in Electron)
    if (typeof win.electronAPI !== 'undefined') {
      return true
    }
    
    return false
  })()
  
  // Initialize SSE integration (connects and handles all events)
  useSSEIntegration()
  
  // Initialize theme on mount
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

    // Restore presentation from localStorage in CLI mode (fallback for non-routed navigation)
    if (!electronMode && !presentationName) {
      const savedPresentation = localStorage.getItem('deckbot_current_presentation')
      const savedSlide = localStorage.getItem('deckbot_current_slide')
      if (savedPresentation) {
        const slideParam = savedSlide && parseInt(savedSlide) > 1 ? `?slide=${savedSlide}` : ''
        navigate(`/presentation/${encodeURIComponent(savedPresentation)}${slideParam}`, { replace: true })
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // Update theme when it changes
  useEffect(() => {
    const effectiveTheme = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme
    document.documentElement.setAttribute('data-theme', effectiveTheme)
    document.documentElement.setAttribute('data-color-theme', colorTheme)
  }, [theme, colorTheme])

  // Listen for Electron menu actions
  useEffect(() => {
    if (!electronMode) return

    const electronAPI = (window as any).electronAPI
    if (!electronAPI || !electronAPI.onMenuAction) return

    const handleMenuAction = (action: string) => {
      console.log('[App] Menu action:', action)
      switch (action) {
        case 'new-presentation':
          setShowCreateModal(true)
          break
        case 'open-presentation':
          navigate('/')
          break
        case 'preferences':
          setShowPreferencesModal(true)
          break
        case 'view-preview':
          setActiveView('preview')
          break
        case 'view-code':
          setActiveView('code')
          break
        case 'view-layouts':
          setActiveView('layouts')
          break
        case 'view-settings':
          setActiveView('settings')
          break
        default:
          console.warn('[App] Unknown menu action:', action)
      }
    }

    electronAPI.onMenuAction(handleMenuAction)

    return () => {
      if (electronAPI.removeMenuActionListener) {
        electronAPI.removeMenuActionListener()
      }
    }
  }, [electronMode, navigate, setActiveView])

  // Sync URL with presentation state
  useEffect(() => {
    if (presentationName) {
      // Decode the presentation name from URL (it's URI-encoded)
      const decodedName = decodeURIComponent(presentationName)
      console.log('Opened presentation:', decodedName)

      // Load presentation from URL
      presentationsAPI.load(decodedName)
        .then((data) => {
          setCurrentPresentation(data.presentation)
          if (data.history && data.history.length > 0) {
            setMessages(data.history)
          }
          // Update window title with presentation name
          if (electronMode) {
            document.title = `${data.presentation.name} - DeckBot`
          }
          // Restore slide from URL params
          const slideParam = searchParams.get('slide')
          if (slideParam) {
            const slideNum = parseInt(slideParam)
            if (!isNaN(slideNum) && slideNum > 0) {
              setCurrentSlide(slideNum)
            }
          }
        })
        .catch((err) => {
          console.error('Error loading presentation from URL:', err)
          navigate('/')
        })
    } else {
      // No presentation in URL - clear state
      if (currentPresentation) {
        setCurrentPresentation(null)
        setMessages([])
      }
      // Reset window title
      if (electronMode) {
        document.title = 'DeckBot'
      }
    }
  }, [presentationName, searchParams, electronMode])

  // Update URL when presentation or slide changes (for CLI mode with localStorage fallback)
  useEffect(() => {
    // Only navigate if we have a presentation AND we're not already at the right URL
    // This prevents re-navigation when closing a presentation
    if (!electronMode && currentPresentation && presentationName) {
      const slideParam = currentSlide > 1 ? `?slide=${currentSlide}` : ''
      const newPath = `/presentation/${encodeURIComponent(currentPresentation.name)}${slideParam}`
      if (window.location.hash !== `#${newPath}`) {
        navigate(newPath, { replace: true })
      }
    }
  }, [currentPresentation, currentSlide, electronMode, navigate, presentationName])

  const handleOpenPresentation = (name: string) => {
    navigate(`/presentation/${encodeURIComponent(name)}`)
  }

  const handleExcalidrawSave = async (newJson: string) => {
    if (!currentPresentation || excalidrawBlockIndex === null) return

    try {
      // Get current markdown content
      const result = await presentationsAPI.files.getContent('deck.marp.md')
      if (result.type !== 'text' || !result.content) {
        console.error('Failed to load markdown content')
        return
      }
      
      // Replace the excalidraw block
      const updatedContent = replaceExcalidrawBlock(result.content, excalidrawBlockIndex, newJson)
      if (!updatedContent) {
        console.error('Failed to replace Excalidraw block')
        return
      }

      // Save the updated markdown
      await presentationsAPI.files.save({ path: 'deck.marp.md', content: updatedContent })
      
      // Close the editor
      setEditingExcalidraw(false, undefined, undefined)
      
      console.log('Excalidraw diagram saved successfully')
    } catch (error) {
      console.error('Failed to save Excalidraw diagram:', error)
    }
  }

  const handleMermaidSave = async (newCode: string) => {
    if (!currentPresentation || mermaidBlockIndex === null) return

    try {
      // Get current markdown content
      const result = await presentationsAPI.files.getContent('deck.marp.md')
      if (result.type !== 'text' || !result.content) {
        console.error('Failed to load markdown content')
        return
      }
      
      // Replace the mermaid block
      const updatedContent = replaceMermaidBlock(result.content, mermaidBlockIndex, newCode)
      if (!updatedContent) {
        console.error('Failed to replace Mermaid block')
        return
      }

      // Save the updated markdown
      await presentationsAPI.files.save({ path: 'deck.marp.md', content: updatedContent })
      
      // Close the editor
      setEditingMermaid(false, undefined, undefined)
      
      console.log('Mermaid diagram saved successfully')
    } catch (error) {
      console.error('Failed to save Mermaid diagram:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {!electronMode && (
        <MenuBar 
          onCreatePresentation={() => setShowCreateModal(true)}
          onOpenPresentation={() => navigate('/')}
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
      )}
      
      {!presentationName ? (
        <WelcomeScreen onOpenPresentation={handleOpenPresentation} electronMode={electronMode} />
      ) : editingExcalidraw && excalidrawJson !== null ? (
        // Full-width Excalidraw editor (replaces chat + sidebar)
        <div className="overflow-hidden" style={{ height: electronMode ? '100vh' : 'calc(100vh - 40px)' }}>
          <ExcalidrawEditor
            initialJson={excalidrawJson}
            onSave={handleExcalidrawSave}
            onClose={() => setEditingExcalidraw(false, undefined, undefined)}
            theme={theme === 'dark' ? 'dark' : 'light'}
          />
        </div>
      ) : editingMermaid && mermaidCode !== null ? (
        // Full-width Mermaid editor (replaces chat + sidebar)
        <div className="overflow-hidden" style={{ height: electronMode ? '100vh' : 'calc(100vh - 40px)' }}>
          <MermaidEditor
            initialCode={mermaidCode}
            onSave={handleMermaidSave}
            onClose={() => setEditingMermaid(false, undefined, undefined)}
            theme={theme === 'dark' ? 'dark' : 'light'}
          />
        </div>
      ) : (
        <div className="flex overflow-hidden" style={{ height: electronMode ? '100vh' : 'calc(100vh - 40px)' }}>
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
                {electronMode && <ViewToggleBar />}
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

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/presentation/:presentationName" element={<AppContent />} />
      </Routes>
    </HashRouter>
  )
}

export default App
