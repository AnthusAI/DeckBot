import { useState, useEffect } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'
import { useAppStore } from '@/store/useAppStore'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ExcalidrawModalProps {
  initialJson: string
  onSave: (newJson: string) => void
  onClose: () => void
}

export function ExcalidrawModal({ initialJson, onSave, onClose }: ExcalidrawModalProps) {
  const { theme } = useAppStore()
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null)
  const [initialData, setInitialData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const parsed = JSON.parse(initialJson)
      setInitialData({
        elements: parsed.elements || [],
        appState: parsed.appState || {
          viewBackgroundColor: '#ffffff',
          gridSize: null
        },
        files: parsed.files || {}
      })
      setError(null)
    } catch (e) {
      setError('Invalid Excalidraw JSON format')
      console.error('Failed to parse Excalidraw JSON:', e)
    }
  }, [initialJson])

  const handleSave = () => {
    if (!excalidrawAPI) {
      console.error('Excalidraw API not available')
      return
    }

    try {
      const elements = excalidrawAPI.getSceneElements()
      const appState = excalidrawAPI.getAppState()
      const files = excalidrawAPI.getFiles()

      const newData = {
        type: 'excalidraw',
        version: 2,
        source: 'https://excalidraw.com',
        elements: elements || [],
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor || '#ffffff',
          gridSize: appState.gridSize || null
        },
        files: files || {}
      }

      const formattedJson = JSON.stringify(newData, null, 2)
      onSave(formattedJson)
    } catch (e) {
      console.error('Failed to save Excalidraw diagram:', e)
      setError('Failed to save diagram')
    }
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg w-[90vw] max-w-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Error</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    )
  }

  if (!initialData) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg w-[90vw] max-w-2xl p-6">
          <p>Loading editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-[90vw] h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Edit Excalidraw Diagram</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <Excalidraw
            excalidrawAPI={(api) => setExcalidrawAPI(api)}
            initialData={initialData}
            theme={theme === 'dark' ? 'dark' : 'light'}
          />
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}



