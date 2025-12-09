import { useEffect, useState, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { presentationsAPI } from '@/services/api'
import { getExcalidrawBlock, getMermaidBlock } from '@/services/diagramExtractor'

export function PreviewView() {
  const { currentPresentation, currentSlide, setCurrentSlide, setEditingMermaid, setEditingExcalidraw } = useAppStore()
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const isRestoringSlide = useRef(false)
  const retryCountRef = useRef<number>(0)
  const markdownContentRef = useRef<string>('') // Ref for immediate access to markdown content

  useEffect(() => {
    if (currentPresentation) {
      loadPreview()
    } else {
      setPreviewUrl('')
    }
  }, [currentPresentation])

  const loadPreview = async () => {
    if (!currentPresentation) return

    try {
      setLoading(true)
      // Include current slide in URL hash if > 1
      const hash = currentSlide > 1 ? `#${currentSlide}` : ''
      // NOTE: Removed cache-busting timestamp to prevent unnecessary reloads
      const url = `/api/presentation/preview${hash}`
      setPreviewUrl(url)

      if (currentSlide > 1) {
        isRestoringSlide.current = true
      }
    } catch (error) {
      console.error('Error loading preview:', error)
      setPreviewUrl('')
    } finally {
      setLoading(false)
    }
  }

  // Monitor iframe hash changes to track slide navigation
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe || !previewUrl) return

    const setupHashMonitoring = () => {
      try {
        const iframeWindow = iframe.contentWindow
        if (!iframeWindow) return

        // Monitor hash changes within the iframe
        const hashChangeHandler = () => {
          try {
            const timestamp = new Date().toISOString()
            const newHash = iframeWindow.location.hash
            const newSlideNum = newHash ? parseInt(newHash.substring(1)) : 1

            console.log(`[HashChange ${timestamp}] Hash changed to: ${newHash}, slide: ${newSlideNum}`)
            
            if (!isNaN(newSlideNum) && newSlideNum !== currentSlide) {
              console.log(`[HashChange] Updating slide from ${currentSlide} to ${newSlideNum}`)
              setCurrentSlide(newSlideNum)
            }
          } catch (err) {
            // Ignore errors
          }
        }

        iframeWindow.addEventListener('hashchange', hashChangeHandler)

        // Polling fallback in case hashchange doesn't fire
        let lastKnownSlide = currentSlide
        const pollInterval = setInterval(() => {
          try {
            const hash = iframeWindow.location.hash
            const slideNum = hash ? parseInt(hash.substring(1)) : 1

            if (!isNaN(slideNum) && slideNum !== lastKnownSlide) {
              console.log(`Navigated to slide ${slideNum}`)
              lastKnownSlide = slideNum
              setCurrentSlide(slideNum)
            }
          } catch (err) {
            // Ignore polling errors
          }
        }, 500)

        return () => {
          iframeWindow.removeEventListener('hashchange', hashChangeHandler)
          clearInterval(pollInterval)
        }
      } catch (err) {
        // Ignore setup errors
      }
    }

    const handleIframeLoad = async () => {
      const timestamp = new Date().toISOString()
      console.log(`[IframeLoad ${timestamp}] *** IFRAME LOAD EVENT FIRED ***`)
      console.trace('[IframeLoad] Stack trace:')
      
      if (isRestoringSlide.current) {
        isRestoringSlide.current = false
      }

      // Load markdown content first, then inject overlays
      await loadMarkdownContent()
      
      // Wait for iframe to be fully ready
      setTimeout(() => {
        setupHashMonitoring()
      }, 100)
      
      // Brief wait for diagrams to render in iframe before injecting overlays
      setTimeout(() => {
        injectDiagramOverlays()
      }, 400)
    }

    iframe.addEventListener('load', handleIframeLoad)

    // If iframe is already loaded, set up monitoring immediately
    if (iframe.contentDocument?.readyState === 'complete') {
      handleIframeLoad()
    }

    return () => {
      iframe.removeEventListener('load', handleIframeLoad)
    }
  }, [previewUrl, setCurrentSlide]) // Removed currentSlide to prevent re-setup on slide navigation

  // Handle presentation updates via custom event
  useEffect(() => {
    const handleUpdate = () => {
      if (currentPresentation) {
        // Just reload markdown, don't reload iframe (causes flicker)
        loadMarkdownContent()
        // Reload will happen automatically when user saves in editor
      }
    }

    window.addEventListener('presentation-updated', handleUpdate)
    return () => window.removeEventListener('presentation-updated', handleUpdate)
  }, [currentPresentation])

  // Load markdown content for diagram extraction
  useEffect(() => {
    if (currentPresentation) {
      loadMarkdownContent()
    }
  }, [currentPresentation])

  const loadMarkdownContent = async (): Promise<string | null> => {
    try {
      console.log('[Markdown] Loading deck.marp.md...')
      const result = await presentationsAPI.files.getContent('deck.marp.md')
      console.log('[Markdown] Result type:', result.type, 'Has content:', !!result.content)
      if (result.type === 'text' && result.content) {
        markdownContentRef.current = result.content // Store in ref for immediate access
        console.log('[Markdown] Loaded successfully, length:', result.content.length)
        retryCountRef.current = 0 // Reset retry count on success
        return result.content // Return the content directly
      } else {
        console.warn('[Markdown] No content in result:', result)
        return null
      }
    } catch (error) {
      console.error('[Markdown] Error loading markdown content:', error)
      return null
    }
  }

  const injectDiagramOverlays = () => {
    const iframe = iframeRef.current
    if (!iframe) {
      return
    }

    try {
      const iframeDoc = iframe.contentDocument
      if (!iframeDoc) {
        return
      }

      // Inject CSS for overlay (once only)
      const styleId = 'deckbot-diagram-overlay-style'
      if (!iframeDoc.getElementById(styleId)) {
        const style = iframeDoc.createElement('style')
        style.id = styleId
        style.textContent = `
          .mermaid-container, .excalidraw-container {
            position: relative !important;
          }
          .mermaid-container:hover, .excalidraw-container:hover {
            outline: 3px solid rgba(37, 99, 235, 0.6) !important;
            outline-offset: 4px !important;
          }
          .diagram-edit-overlay {
            position: absolute !important;
            top: 8px !important;
            right: 8px !important;
            opacity: 0 !important;
            transition: opacity 0.2s !important;
            z-index: 10000 !important;
            pointer-events: none !important;
          }
          .mermaid-container:hover .diagram-edit-overlay,
          .excalidraw-container:hover .diagram-edit-overlay {
            opacity: 1 !important;
            pointer-events: all !important;
          }
          .diagram-edit-button {
            background: rgba(37, 99, 235, 0.95) !important;
            color: white !important;
            border: 2px solid white !important;
            padding: 8px 16px !important;
            border-radius: 6px !important;
            cursor: pointer !important;
            font-size: 14px !important;
            font-weight: 600 !important;
            display: inline-block !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
            transition: all 0.2s !important;
          }
          .diagram-edit-button:hover {
            background: rgba(29, 78, 216, 1) !important;
            transform: scale(1.05) !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
          }
        `
        iframeDoc.head.appendChild(style)
      }

      // Find all diagram containers (both Mermaid and Excalidraw)
      const mermaidDiagrams = iframeDoc.querySelectorAll('.mermaid-container')
      const excalidrawDiagrams = iframeDoc.querySelectorAll('.excalidraw-container')
      const totalDiagrams = mermaidDiagrams.length + excalidrawDiagrams.length
      
      // Check if overlays already exist - if so, don't re-inject (prevents flicker)
      const existingOverlays = iframeDoc.querySelectorAll('.diagram-edit-overlay')
      if (existingOverlays.length === totalDiagrams && totalDiagrams > 0) {
        return // Overlays already injected, no need to do it again
      }
      
      // Remove existing overlays before re-injecting
      existingOverlays.forEach(overlay => overlay.remove())
      
      if (totalDiagrams === 0) {
        // Diagrams might still be loading, retry a few times
        retryCountRef.current++
        if (retryCountRef.current <= 3) {
          setTimeout(() => {
            injectDiagramOverlays()
          }, 200)
          return
        } else {
          retryCountRef.current = 0
          return
        }
      }
      
      retryCountRef.current = 0 // Reset retry count when we find diagrams
      
      // Use the markdown content from ref (immediate access, not async state)
      const content = markdownContentRef.current
      
      if (!content) {
        console.warn(`[Overlay] Markdown content not available in ref yet`)
        return
      }
      
      console.log(`[Overlay] Using markdown content, length: ${content.length}`)
      
      // Add overlays to Excalidraw diagrams
      excalidrawDiagrams.forEach((diagram, index) => {
        if (diagram.querySelector('.diagram-edit-overlay')) return
        
        const overlay = iframeDoc.createElement('div')
        overlay.className = 'diagram-edit-overlay'
        
        const button = iframeDoc.createElement('button')
        button.className = 'diagram-edit-button'
        button.innerHTML = '✏️ Edit'
        button.title = 'Edit Excalidraw diagram'
        button.onclick = (e) => {
          e.stopPropagation()
          e.preventDefault()
          handleEditDiagramFromPreview(index)
        }
        
        overlay.appendChild(button)
        diagram.appendChild(overlay)
        console.log(`[Overlay] Added Excalidraw edit button to diagram ${index}`)
      })
      
      // Add overlays to Mermaid diagrams
      mermaidDiagrams.forEach((diagram, index) => {
        if (diagram.querySelector('.diagram-edit-overlay')) return
        
        const overlay = iframeDoc.createElement('div')
        overlay.className = 'diagram-edit-overlay'
        
        const button = iframeDoc.createElement('button')
        button.className = 'diagram-edit-button'
        button.innerHTML = '✏️ Edit'
        button.title = 'Edit Mermaid diagram'
        button.onclick = (e) => {
          e.stopPropagation()
          e.preventDefault()
          handleEditMermaidFromPreview(index)
        }
        
        overlay.appendChild(button)
        diagram.appendChild(overlay)
        console.log(`[Overlay] Added Mermaid edit button to diagram ${index}`)
      })
    } catch (error) {
      // Cross-origin or other iframe access issues
      console.error('[Overlay] Error injecting diagram overlays:', error)
    }
  }

  const handleEditDiagramFromPreview = async (diagramIndex: number) => {
    try {
      console.log('[Excalidraw] Editing diagram index:', diagramIndex)
      // Reload markdown content to ensure we have latest
      const result = await presentationsAPI.files.getContent('deck.marp.md')
      if (result.type !== 'text' || !result.content) {
        alert('Could not load markdown content')
        return
      }

      const content = result.content
      console.log('[Excalidraw] Markdown content length:', content.length)
      const block = getExcalidrawBlock(content, diagramIndex)
      console.log('[Excalidraw] Found block:', block ? 'YES' : 'NO', block)
      if (block) {
        console.log('[Excalidraw] JSON length:', block.json.length)
        console.log('[Excalidraw] Opening editor with index:', diagramIndex)
        // Open Excalidraw editor with this JSON
        setEditingExcalidraw(true, block.json, diagramIndex)
      } else {
        console.error(`Diagram block ${diagramIndex} not found`)
        alert('Could not find diagram to edit. Please try again.')
      }
    } catch (error) {
      console.error('Error editing diagram from preview:', error)
      alert('Failed to load diagram for editing')
    }
  }

  const handleEditMermaidFromPreview = async (mermaidIndex: number) => {
    try {
      // Reload markdown content to ensure we have latest
      const result = await presentationsAPI.files.getContent('deck.marp.md')
      if (result.type !== 'text' || !result.content) {
        alert('Could not load markdown content')
        return
      }
      
      const content = result.content
      const block = getMermaidBlock(content, mermaidIndex)
      if (block) {
        // Open Mermaid editor with this code
        setEditingMermaid(true, block.code, mermaidIndex)
      } else {
        console.error(`Mermaid block ${mermaidIndex} not found`)
        alert('Could not find Mermaid diagram to edit. Please try again.')
      }
    } catch (error) {
      console.error('Error editing Mermaid diagram from preview:', error)
      alert('Failed to load Mermaid diagram for editing')
    }
  }

  if (!currentPresentation) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No presentation loaded
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Loading preview...
      </div>
    )
  }

  return (
    <>
      <div className="h-full w-full">
        {previewUrl ? (
          <iframe
            ref={iframeRef}
            src={previewUrl}
            className="w-full h-full border-0"
            title="Presentation Preview"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <p className="mb-2">Preview not available</p>
              <p className="text-sm">Ask the agent to compile the presentation</p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}


