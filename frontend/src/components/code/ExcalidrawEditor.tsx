import React, { useState, Suspense } from 'react'
import { Button } from '../ui/button'
import { X, Save } from 'lucide-react'
import '@excalidraw/excalidraw/index.css'

// Lazy load Excalidraw to avoid SSR issues
const Excalidraw = React.lazy(() => 
  import('@excalidraw/excalidraw').then(module => ({ default: module.Excalidraw }))
)

interface ExcalidrawEditorProps {
  initialJson: string
  onSave: (json: string) => void
  onClose: () => void
  theme?: 'light' | 'dark'
}

export const ExcalidrawEditor: React.FC<ExcalidrawEditorProps> = ({
  initialJson,
  onSave,
  onClose,
  theme = 'light'
}) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null)

  const handleSave = () => {
    if (!excalidrawAPI) return

    const elements = excalidrawAPI.getSceneElements()
    const appState = excalidrawAPI.getAppState()
    
    const data = {
      type: 'excalidraw',
      version: 2,
      source: 'deckbot',
      elements: elements,
      appState: {
        viewBackgroundColor: appState.viewBackgroundColor,
        gridSize: appState.gridSize,
      }
    }

    onSave(JSON.stringify(data, null, 2))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + S to save
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault()
      handleSave()
    }
    // Escape to close (but only if not typing in Excalidraw)
    if (e.key === 'Escape' && (e.target as HTMLElement).tagName !== 'INPUT') {
      e.preventDefault()
      onClose()
    }
  }

  let initialData
  try {
    initialData = JSON.parse(initialJson)
  } catch (e) {
    console.error('Failed to parse Excalidraw JSON:', e)
    initialData = { elements: [], appState: {} }
  }

  return (
    <div 
      className="flex flex-col h-full bg-background"
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-lg font-semibold">Edit Excalidraw Diagram</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
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

      {/* Excalidraw canvas */}
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">Loading Excalidraw editor...</div>
          </div>
        }>
          <Excalidraw
            excalidrawAPI={(api) => setExcalidrawAPI(api)}
            initialData={initialData}
            theme={theme === 'dark' ? 'dark' : 'light'}
          />
        </Suspense>
      </div>
    </div>
  )
}



