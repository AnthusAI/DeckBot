import { Eye, Code2, LayoutTemplate, Settings } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'

/**
 * ViewToggleBar - Toolbar for switching between Preview/Code/Layouts/Settings views
 * Used above the right pane in Electron mode when MenuBar is hidden
 */
export function ViewToggleBar() {
  const { activeView, setActiveView, currentPresentation } = useAppStore()

  if (!currentPresentation) return null

  return (
    <div className="h-12 border-b border-border bg-card flex items-center justify-center px-4">
      <div className="flex gap-0.5 bg-muted rounded-md p-1 border border-border">
        <button
          className={cn(
            'px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2',
            activeView === 'preview'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setActiveView('preview')}
          title="Preview"
        >
          <Eye className="w-4 h-4" />
          <span>Preview</span>
        </button>
        <button
          className={cn(
            'px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2',
            activeView === 'code'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setActiveView('code')}
          title="Code"
        >
          <Code2 className="w-4 h-4" />
          <span>Code</span>
        </button>
        <button
          className={cn(
            'px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2',
            activeView === 'layouts'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setActiveView('layouts')}
          title="Layouts"
        >
          <LayoutTemplate className="w-4 h-4" />
          <span>Layouts</span>
        </button>
        <button
          className={cn(
            'px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2',
            activeView === 'settings'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setActiveView('settings')}
          title="Settings"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  )
}

