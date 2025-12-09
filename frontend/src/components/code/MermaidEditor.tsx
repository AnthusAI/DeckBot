import React, { useEffect, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import mermaid from 'mermaid'
import { Button } from '../ui/button'
import { X, Save, ZoomIn, ZoomOut } from 'lucide-react'

interface MermaidEditorProps {
  initialCode: string
  onSave: (code: string) => void
  onClose: () => void
  theme?: 'light' | 'dark'
}

export const MermaidEditor: React.FC<MermaidEditorProps> = ({
  initialCode,
  onSave,
  onClose,
  theme = 'light'
}) => {
  const [code, setCode] = useState(initialCode)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(200) // Start at 200% for better visibility
  const [splitPosition, setSplitPosition] = useState(50) // percentage
  const [isDragging, setIsDragging] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const renderTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === 'dark' ? 'dark' : 'default',
      securityLevel: 'loose',
    })
  }, [theme])

  // Render preview with debounce
  useEffect(() => {
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current)
    }

    renderTimeoutRef.current = setTimeout(async () => {
      if (!previewRef.current || !code.trim()) return

      try {
        // Clear previous content
        previewRef.current.innerHTML = ''
        
        // Generate unique ID for this render
        const id = `mermaid-preview-${Date.now()}`
        
        // Validate and render
        const { svg } = await mermaid.render(id, code)
        previewRef.current.innerHTML = svg
        setError(null)
      } catch (err) {
        console.error('Mermaid render error:', err)
        setError(err instanceof Error ? err.message : 'Failed to render diagram')
        previewRef.current.innerHTML = `<div style="color: #dc2626; padding: 20px;">${
          err instanceof Error ? err.message : 'Failed to render diagram'
        }</div>`
      }
    }, 500) // 500ms debounce

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current)
      }
    }
  }, [code])

  const handleSave = () => {
    if (!error) {
      onSave(code)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + S to save
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault()
      handleSave()
    }
    // Escape to close
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  const handleMouseDown = () => {
    setIsDragging(true)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return
    
    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    const newPosition = ((e.clientX - rect.left) / rect.width) * 100
    
    // Clamp between 20% and 80%
    setSplitPosition(Math.min(Math.max(newPosition, 20), 80))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging])

  const handleZoomIn = () => setZoom(Math.min(zoom + 10, 400))
  const handleZoomOut = () => setZoom(Math.max(zoom - 10, 50))
  const handleZoomReset = () => setZoom(200)

  return (
    <div 
      className="flex flex-col h-full bg-background"
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-lg font-semibold">Edit Mermaid Diagram</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={!!error}
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      </div>

      {/* Two-column layout */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden relative">
        {/* Left: Monaco Editor */}
        <div 
          className="border-r overflow-hidden"
          style={{ width: `${splitPosition}%` }}
        >
          <Editor
            height="100%"
            language="mermaid"
            value={code}
            onChange={(value) => setCode(value || '')}
            theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>

        {/* Resizer */}
        <div
          className="w-1 bg-border hover:bg-primary/50 cursor-col-resize relative group"
          onMouseDown={handleMouseDown}
          style={{ flexShrink: 0 }}
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>

        {/* Right: Mermaid Preview */}
        <div 
          className="overflow-auto bg-muted/30 relative"
          style={{ width: `${100 - splitPosition}%` }}
        >
          {/* Zoom controls */}
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomReset}
              title="Reset zoom (200%)"
            >
              {zoom}%
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 400}
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-8 flex items-center justify-center min-h-full">
            <div 
              ref={previewRef}
              className="mermaid-preview transition-transform duration-200"
              style={{
                maxWidth: '100%',
                textAlign: 'center',
                transform: `scale(${zoom / 100})`
              }}
            />
          </div>
        </div>
      </div>

      {/* Error indicator */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm border-t">
          <strong>Syntax Error:</strong> {error}
        </div>
      )}
    </div>
  )
}


