import { useState } from 'react'
import { File, ChevronRight, Image as ImageIcon } from 'lucide-react'
import type { FileTreeItem } from '@/types/API'
import { useEditorStore } from '@/store/useEditorStore'
import { presentationsAPI } from '@/services/api'

interface FileTreeProps {
  items: FileTreeItem[]
}

export function FileTree({ items }: FileTreeProps) {
  return (
    <div className="p-2">
      {items.map((item) => (
        <FileTreeNode key={item.path} item={item} />
      ))}
    </div>
  )
}

function FileTreeNode({ item }: { item: FileTreeItem }) {
  const [expanded, setExpanded] = useState(false)
  const { setCurrentFile, setLoading } = useEditorStore()

  const handleClick = async () => {
    if (item.type === 'folder') {
      setExpanded(!expanded)
    } else {
      setLoading(true)
      try {
        // For images, just set the path without loading content
        if (item.type === 'image') {
          setCurrentFile(item.path, '')
        } else {
          const content = await presentationsAPI.files.getContent(item.path)
          if (content.type === 'text' && content.content) {
            setCurrentFile(item.path, content.content)
          }
        }
      } catch (error) {
        console.error('Error loading file:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  const getIcon = () => {
    if (item.type === 'folder') {
      return expanded ? <ChevronRight className="w-4 h-4 rotate-90" /> : <ChevronRight className="w-4 h-4" />
    }
    if (item.type === 'image') {
      return <ImageIcon className="w-4 h-4" />
    }
    return <File className="w-4 h-4" />
  }

  return (
    <div>
      <div
        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer text-sm"
        onClick={handleClick}
      >
        {getIcon()}
        <span className="flex-1 truncate">{item.name}</span>
      </div>
      {expanded && item.children && item.children.length > 0 && (
        <div className="ml-6 border-l border-border pl-2">
          {item.children.map((child) => (
            <FileTreeNode key={child.path} item={child} />
          ))}
        </div>
      )}
    </div>
  )
}

