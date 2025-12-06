import { useEffect } from 'react'
import { useEditorStore } from '@/store/useEditorStore'
import { useAppStore } from '@/store/useAppStore'
import { presentationsAPI } from '@/services/api'
import { FileTree } from './FileTree'
import { MonacoEditor } from './MonacoEditor'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CodeView() {
  const { fileTree, currentFilePath, currentFileContent, hasUnsavedChanges, isLoading, setFileTree, setHasUnsavedChanges, setLoading } = useEditorStore()
  const { currentPresentation } = useAppStore()

  useEffect(() => {
    if (currentPresentation) {
      loadFileTree()
    }
  }, [currentPresentation])

  const loadFileTree = async () => {
    try {
      const result = await presentationsAPI.files.list()
      setFileTree(result.files || [])
    } catch (error) {
      console.error('Error loading file tree:', error)
    }
  }

  const handleSave = async () => {
    if (!currentFilePath || !currentFileContent) return

    try {
      setLoading(true)
      await presentationsAPI.files.save({
        path: currentFilePath,
        content: currentFileContent,
      })
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Error saving file:', error)
      alert('Failed to save file')
    } finally {
      setLoading(false)
    }
  }

  if (!currentPresentation) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No presentation loaded
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <div className="w-64 border-r border-border bg-muted/20 flex flex-col">
        <div className="p-3 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
          Files
        </div>
        <div className="flex-1 overflow-y-auto">
          <FileTree items={fileTree} />
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-[hsl(var(--card))]">
          <span className="text-sm font-medium truncate">
            {currentFilePath || 'No file selected'}
          </span>
          {hasUnsavedChanges && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSave}
              disabled={isLoading}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          {currentFilePath ? (
            (() => {
              const isImage = /\.(png|jpe?g|gif|svg|webp)$/i.test(currentFilePath)
              const imageUrl = `/api/presentation/file-serve?path=${encodeURIComponent(currentFilePath)}`
              console.log('File:', currentFilePath, 'Is image:', isImage, 'URL:', imageUrl)
              
              return isImage ? (
                <div className="flex items-center justify-center h-full p-8 bg-muted/10">
                  <img 
                    src={imageUrl}
                    alt={currentFilePath}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => console.error('Image load error:', e)}
                    onLoad={() => console.log('Image loaded successfully')}
                  />
                </div>
              ) : (
                <MonacoEditor />
              )
            })()
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a file to view its contents
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

