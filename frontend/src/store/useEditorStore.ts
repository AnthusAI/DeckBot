import { create } from 'zustand'
import type { FileTreeItem } from '../types/API'

interface EditorState {
  fileTree: FileTreeItem[]
  currentFilePath: string | null
  currentFileContent: string | null
  hasUnsavedChanges: boolean
  isLoading: boolean
  
  // Actions
  setFileTree: (tree: FileTreeItem[]) => void
  setCurrentFile: (path: string | null, content: string | null) => void
  updateFileContent: (content: string) => void
  setHasUnsavedChanges: (hasChanges: boolean) => void
  setLoading: (loading: boolean) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  fileTree: [],
  currentFilePath: null,
  currentFileContent: null,
  hasUnsavedChanges: false,
  isLoading: false,
  
  setFileTree: (tree) => set({ fileTree: tree }),
  
  setCurrentFile: (path, content) => set({
    currentFilePath: path,
    currentFileContent: content,
    hasUnsavedChanges: false,
  }),
  
  updateFileContent: (content) => set((state) => ({
    currentFileContent: content,
    hasUnsavedChanges: state.currentFileContent !== content,
  })),
  
  setHasUnsavedChanges: (hasChanges) => set({ hasUnsavedChanges: hasChanges }),
  
  setLoading: (loading) => set({ isLoading: loading }),
}))

