import { useState } from 'react'
import { Info, Settings, FilePlus, FolderOpen, XCircle, Copy, Sliders, FileDown, Eye, LayoutTemplate, Code2, Sun, Moon, Monitor } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'

interface MenuBarProps {
  onCreatePresentation?: () => void
  onOpenPresentation?: () => void
  onSaveAs?: () => void
  onExportPDF?: () => void
  onPreferences?: () => void
  onPresentationSettings?: () => void
}

interface MenuItemProps {
  label: string
  children: React.ReactNode
}

function MenuItem({ label, children }: MenuItemProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="px-3 py-1.5 text-sm font-medium rounded hover:bg-accent transition-colors">
        {label}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-0 bg-popover border border-border rounded-md shadow-lg z-50 min-w-[200px] py-1" style={{ backgroundColor: 'hsl(var(--popover))' }}>
          {children}
        </div>
      )}
    </div>
  )
}

interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode
  shortcut?: string
  checkable?: boolean
  checked?: boolean
}

function DropdownItem({ icon, shortcut, checkable, checked, children, className, ...props }: DropdownItemProps) {
  return (
    <button
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left relative',
        checkable && checked && 'pl-8',
        className
      )}
      {...props}
    >
      {checkable && checked && (
        <span className="absolute left-3 text-primary font-semibold">✓</span>
      )}
      {icon && <span className="w-4 h-4">{icon}</span>}
      <span className="flex-1">{children}</span>
      {shortcut && (
        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          {shortcut}
        </span>
      )}
    </button>
  )
}

function DropdownDivider() {
  return <div className="h-px bg-border my-1" />
}

export function MenuBar({
  onCreatePresentation,
  onOpenPresentation,
  onSaveAs,
  onExportPDF,
  onPreferences,
  onPresentationSettings,
}: MenuBarProps = {}) {
  const { activeView, setActiveView, currentPresentation, setCurrentPresentation, setShowWelcomeScreen } = useAppStore()

  const handleClosePresentation = () => {
    if (confirm('Are you sure you want to close the current presentation?')) {
      import('@/store/useChatStore').then(({ useChatStore }) => {
        useChatStore.getState().clearMessages()
      })
      setCurrentPresentation(null)
      setShowWelcomeScreen(true)
    }
  }

  const handleAbout = () => {
    alert('DeckBot v1.0\n\nAn AI-powered presentation creation tool.\n\nBuilt with Marp, Google Gemini, and Nano Banana.')
  }

  return (
    <div className="h-10 border-b border-border bg-card flex items-center justify-between px-4 select-none">
      <div className="flex items-center gap-3">
        <MenuItem label="DeckBot">
          <DropdownItem icon={<Info className="w-4 h-4" />} onClick={handleAbout}>
            About DeckBot
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem icon={<Settings className="w-4 h-4" />} shortcut="⌘," onClick={onPreferences}>
            Preferences...
          </DropdownItem>
        </MenuItem>

        <MenuItem label="File">
          <DropdownItem icon={<FilePlus className="w-4 h-4" />} onClick={onCreatePresentation}>
            New Presentation...
          </DropdownItem>
          <DropdownItem icon={<FolderOpen className="w-4 h-4" />} onClick={onOpenPresentation}>
            Open Presentation...
          </DropdownItem>
          {currentPresentation && (
            <>
              <DropdownDivider />
              <DropdownItem icon={<XCircle className="w-4 h-4" />} onClick={handleClosePresentation}>
                Close Presentation
              </DropdownItem>
              <DropdownDivider />
              <DropdownItem icon={<Copy className="w-4 h-4" />} onClick={onSaveAs}>
                Save As...
              </DropdownItem>
              <DropdownDivider />
              <DropdownItem icon={<Sliders className="w-4 h-4" />} onClick={onPresentationSettings}>
                Presentation Settings...
              </DropdownItem>
              <DropdownDivider />
              <DropdownItem icon={<FileDown className="w-4 h-4" />} onClick={onExportPDF}>
                Export PDF
              </DropdownItem>
            </>
          )}
        </MenuItem>

        {currentPresentation && (
          <MenuItem label="View">
            <DropdownItem
              icon={<Eye className="w-4 h-4" />}
              shortcut="^1"
              checkable
              checked={activeView === 'preview'}
              onClick={() => setActiveView('preview')}
            >
            Preview
          </DropdownItem>
          <DropdownItem
            icon={<LayoutTemplate className="w-4 h-4" />}
            shortcut="^2"
            checkable
            checked={activeView === 'layouts'}
            onClick={() => setActiveView('layouts')}
          >
            Layouts
          </DropdownItem>
          <DropdownItem
            icon={<Code2 className="w-4 h-4" />}
            shortcut="^3"
            checkable
            checked={activeView === 'code'}
            onClick={() => setActiveView('code')}
          >
            Code
          </DropdownItem>
          <DropdownItem
            icon={<Settings className="w-4 h-4" />}
            shortcut="^4"
            checkable
            checked={activeView === 'settings'}
            onClick={() => setActiveView('settings')}
          >
            Settings
          </DropdownItem>
        </MenuItem>
        )}
      </div>

      <div className="flex items-center gap-2">
        <ViewToggle />
        <ThemeSelector />
      </div>
    </div>
  )
}

function ViewToggle() {
  const { activeView, setActiveView, currentPresentation } = useAppStore()

  if (!currentPresentation) return null

  return (
    <div className="hidden md:flex gap-0.5 bg-muted rounded-md p-1 border border-border">
      <button
        className={cn(
          'px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5',
          activeView === 'preview'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => setActiveView('preview')}
        title="Preview"
      >
        <Eye className="w-3.5 h-3.5" />
        <span className="hidden lg:inline">Preview</span>
      </button>
      <button
        className={cn(
          'px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5',
          activeView === 'code'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => setActiveView('code')}
        title="Code"
      >
        <Code2 className="w-3.5 h-3.5" />
        <span className="hidden lg:inline">Code</span>
      </button>
      <button
        className={cn(
          'px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5',
          activeView === 'layouts'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => setActiveView('layouts')}
        title="Layouts"
      >
        <LayoutTemplate className="w-3.5 h-3.5" />
        <span className="hidden lg:inline">Layouts</span>
      </button>
      <button
        className={cn(
          'px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5',
          activeView === 'settings'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => setActiveView('settings')}
        title="Settings"
      >
        <Settings className="w-3.5 h-3.5" />
        <span className="hidden lg:inline">Settings</span>
      </button>
    </div>
  )
}

function ThemeSelector() {
  const { theme, setTheme } = useAppStore()

  return (
    <div className="flex gap-0.5 bg-muted rounded-md p-1 border border-border">
      <button
        className={cn(
          'p-1.5 rounded transition-all',
          theme === 'light'
            ? 'bg-background shadow-sm opacity-100'
            : 'opacity-60 hover:opacity-80'
        )}
        onClick={() => setTheme('light')}
        title="Light Mode"
      >
        <Sun className="w-3.5 h-3.5" />
      </button>
      <button
        className={cn(
          'p-1.5 rounded transition-all',
          theme === 'dark'
            ? 'bg-background shadow-sm opacity-100'
            : 'opacity-60 hover:opacity-80'
        )}
        onClick={() => setTheme('dark')}
        title="Dark Mode"
      >
        <Moon className="w-3.5 h-3.5" />
      </button>
      <button
        className={cn(
          'p-1.5 rounded transition-all',
          theme === 'system'
            ? 'bg-background shadow-sm opacity-100'
            : 'opacity-60 hover:opacity-80'
        )}
        onClick={() => setTheme('system')}
        title="System Mode"
      >
        <Monitor className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

