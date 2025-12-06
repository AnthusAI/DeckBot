import { useEffect, useState, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'

export function PreviewView() {
  const { currentPresentation, currentSlide, setCurrentSlide } = useAppStore()
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const isRestoringSlide = useRef(false)

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
      const url = `/api/presentation/preview?t=${Date.now()}${hash}`
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
            const newHash = iframeWindow.location.hash
            const newSlideNum = newHash ? parseInt(newHash.substring(1)) : 1

            if (!isNaN(newSlideNum) && newSlideNum !== currentSlide) {
              console.log(`Navigated to slide ${newSlideNum}`)
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

    const handleIframeLoad = () => {
      if (isRestoringSlide.current) {
        isRestoringSlide.current = false
      }

      // Wait for iframe to be fully ready
      setTimeout(setupHashMonitoring, 100)
    }

    iframe.addEventListener('load', handleIframeLoad)

    // If iframe is already loaded, set up monitoring immediately
    if (iframe.contentDocument?.readyState === 'complete') {
      handleIframeLoad()
    }

    return () => {
      iframe.removeEventListener('load', handleIframeLoad)
    }
  }, [previewUrl, currentSlide, setCurrentSlide])

  // Handle presentation updates via custom event
  useEffect(() => {
    const handleUpdate = () => {
      if (currentPresentation) {
        loadPreview()
      }
    }
    
    window.addEventListener('presentation-updated', handleUpdate)
    return () => window.removeEventListener('presentation-updated', handleUpdate)
  }, [currentPresentation])

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
  )
}

