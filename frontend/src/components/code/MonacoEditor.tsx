import { useRef } from 'react'
import Editor from '@monaco-editor/react'
import { useEditorStore } from '@/store/useEditorStore'
import { useAppStore } from '@/store/useAppStore'

export function MonacoEditor() {
  const { currentFilePath, currentFileContent, updateFileContent } = useEditorStore()
  const { theme } = useAppStore()
  const editorRef = useRef<any>(null)

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

  return (
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
  )
}

