import { useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { useEditorStore } from '@/store/useEditorStore'
import { useAppStore } from '@/store/useAppStore'
import { detectExcalidrawBlock, extractMermaidBlocks } from '@/services/diagramExtractor'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function MonacoEditor() {
  const { currentFilePath, currentFileContent, updateFileContent } = useEditorStore()
  const { theme, setEditingMermaid, setEditingExcalidraw } = useAppStore()
  const editorRef = useRef<any>(null)
  const [currentDiagramIndex, setCurrentDiagramIndex] = useState<number>(-1)
  const [isInExcalidrawBlock, setIsInExcalidrawBlock] = useState(false)
  const [isInMermaidBlock, setIsInMermaidBlock] = useState(false)
  const [currentMermaidIndex, setCurrentMermaidIndex] = useState<number>(-1)

  const getLanguage = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase()
    const langMap: Record<string, string> = {
      'md': 'markdown',
      'js': 'javascript',
      'ts': 'typescript',
      'json': 'json',
      'html': 'html',
      'css': 'css',
      'py': 'python',
      'yaml': 'yaml',
      'yml': 'yaml',
    }
    return langMap[ext || ''] || 'plaintext'
  }

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor
    
    // Listen for cursor position changes to detect if we're in an excalidraw block
    editor.onDidChangeCursorPosition(() => {
      checkCursorPosition()
    })
    
    // Also check on content changes
    editor.onDidChangeModelContent(() => {
      checkCursorPosition()
    })
    
    // Initial check
    checkCursorPosition()
  }

  const checkCursorPosition = () => {
    if (!editorRef.current || !currentFileContent) {
      setIsInExcalidrawBlock(false)
      setIsInMermaidBlock(false)
      return
    }

    const editor = editorRef.current
    const position = editor.getPosition()
    if (!position) {
      setIsInExcalidrawBlock(false)
      setIsInMermaidBlock(false)
      return
    }

    const model = editor.getModel()
    const offset = model.getOffsetAt(position)
    
    // Check for Excalidraw block
    const excalidrawBlocks = detectExcalidrawBlock(currentFileContent)
    const excalidrawBlockIndex = excalidrawBlocks.findIndex(block => 
      offset >= block.startIndex && offset <= block.endIndex
    )
    setIsInExcalidrawBlock(excalidrawBlockIndex >= 0)
    setCurrentDiagramIndex(excalidrawBlockIndex)

    // Check for Mermaid block
    const mermaidBlocks = extractMermaidBlocks(currentFileContent)
    const mermaidBlockIndex = mermaidBlocks.findIndex(block => 
      offset >= block.startIndex && offset <= block.endIndex
    )
    setIsInMermaidBlock(mermaidBlockIndex >= 0)
    setCurrentMermaidIndex(mermaidBlockIndex)
  }

  const handleEditDiagram = () => {
    if (!editorRef.current || !currentFileContent || currentDiagramIndex < 0) {
      return
    }

    const blocks = detectExcalidrawBlock(currentFileContent)
    const block = blocks[currentDiagramIndex]
    
    if (block) {
      // Open the Excalidraw editor in the main app layout
      setEditingExcalidraw(true, block.json, currentDiagramIndex)
    }
  }

  const handleEditMermaid = () => {
    if (!editorRef.current || !currentFileContent || currentMermaidIndex < 0) {
      return
    }

    const blocks = extractMermaidBlocks(currentFileContent)
    const block = blocks[currentMermaidIndex]
    
    if (block) {
      // Open the Mermaid editor in the main app layout
      setEditingMermaid(true, block.code, currentMermaidIndex)
    }
  }

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      updateFileContent(value)
    }
  }

  const editorTheme = theme === 'dark' ? 'vs-dark' : 'vs'

  if (!currentFilePath || currentFileContent === null) {
    return null
  }

  const isMarkdown = currentFilePath.endsWith('.md') || currentFilePath.endsWith('.markdown')

  return (
    <div className="h-full flex flex-col">
      {isMarkdown && (isInExcalidrawBlock || isInMermaidBlock) && (
        <div className="h-10 border-b border-border flex items-center justify-end px-2 gap-2 bg-muted/20">
          {isInExcalidrawBlock && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditDiagram}
              title="Edit Excalidraw diagram at cursor"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit Diagram
            </Button>
          )}
          {isInMermaidBlock && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditMermaid}
              title="Edit Mermaid diagram at cursor"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit Diagram
            </Button>
          )}
        </div>
      )}
      <div className="flex-1">
        <Editor
          height="100%"
          language={getLanguage(currentFilePath)}
          value={currentFileContent}
          theme={editorTheme}
          onChange={handleChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  )
}


