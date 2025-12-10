import { useState, useEffect } from 'react'
import { X, Sun, Palette, Key, Folder } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { preferencesAPI } from '@/services/api'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Theme, ColorTheme } from '@/types/Settings'
import { APIKeysTab } from './APIKeysTab'

interface PreferencesModalProps {
  open: boolean
  onClose: () => void
}

type Tab = 'general' | 'api-keys' | 'content-folder'

export function PreferencesModal({ open, onClose }: PreferencesModalProps) {
  const { theme, colorTheme, setTheme, setColorTheme } = useAppStore()
  const [localTheme, setLocalTheme] = useState<Theme>(theme)
  const [localColorTheme, setLocalColorTheme] = useState<ColorTheme>(colorTheme)
  const [activeTab, setActiveTab] = useState<Tab>('general')

  useEffect(() => {
    if (open) {
      setLocalTheme(theme)
      setLocalColorTheme(colorTheme)
    }
  }, [open, theme, colorTheme])

  const handleSave = async () => {
    try {
      await Promise.all([
        preferencesAPI.set('theme', localTheme),
        preferencesAPI.set('color_theme', localColorTheme),
      ])
      setTheme(localTheme)
      setColorTheme(localColorTheme)
      onClose()
    } catch (error) {
      console.error('Error saving preferences:', error)
      alert('Failed to save preferences')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center" onClick={onClose}>
      <div className="bg-[hsl(var(--card))] border border-border rounded-lg max-w-3xl w-full mx-4 shadow-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Preferences</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-4 border-b border-border -mb-px">
            <button
              onClick={() => setActiveTab('general')}
              className={cn(
                'pb-2 px-1 border-b-2 transition-colors flex items-center gap-2',
                activeTab === 'general'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Palette className="w-4 h-4" />
              General
            </button>
            <button
              onClick={() => setActiveTab('api-keys')}
              className={cn(
                'pb-2 px-1 border-b-2 transition-colors flex items-center gap-2',
                activeTab === 'api-keys'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Key className="w-4 h-4" />
              API Keys
            </button>
            <button
              onClick={() => setActiveTab('content-folder')}
              className={cn(
                'pb-2 px-1 border-b-2 transition-colors flex items-center gap-2',
                activeTab === 'content-folder'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Folder className="w-4 h-4" />
              Content Folder
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto flex-1 space-y-6">{activeTab === 'general' && (
          <>
          <div>
            <label className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-2 font-medium">
                <Sun className="w-4 h-4" />
                Light/Dark Mode
              </span>
              <select
                value={localTheme}
                onChange={(e) => setLocalTheme(e.target.value as Theme)}
                className="px-3 py-1.5 bg-background border border-input rounded-md"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </label>
            <p className="text-sm text-muted-foreground ml-6">Choose light or dark mode</p>
          </div>

          <div>
            <label className="flex items-center gap-2 font-medium mb-2">
              <Palette className="w-4 h-4" />
              Color Theme
            </label>
            <p className="text-sm text-muted-foreground mb-3">Select your color palette</p>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setLocalColorTheme('miami')}
                className={cn(
                  'p-0 rounded-lg transition-all overflow-hidden',
                  localColorTheme === 'miami'
                    ? 'ring-4 ring-[hsl(320,85%,60%)]'
                    : 'ring-1 ring-border hover:ring-2 hover:ring-[hsl(320,85%,60%)]/50'
                )}
              >
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'hsl(210, 40%, 96%)' }}>
                  <div className="font-semibold mb-3" style={{ color: 'hsl(222.2, 47.4%, 20%)' }}>Miami</div>
                  <div className="flex gap-1">
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: 'hsl(320, 85%, 60%)' }} />
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: 'hsl(200, 90%, 45%)' }} />
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: 'hsl(340, 82%, 52%)' }} />
                  </div>
                </div>
              </button>
              <button
                onClick={() => setLocalColorTheme('midwest')}
                className={cn(
                  'p-0 rounded-lg transition-all overflow-hidden',
                  localColorTheme === 'midwest'
                    ? 'ring-4 ring-[hsl(210,80%,50%)]'
                    : 'ring-1 ring-border hover:ring-2 hover:ring-[hsl(210,80%,50%)]/50'
                )}
              >
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'hsl(210, 40%, 96%)' }}>
                  <div className="font-semibold mb-3" style={{ color: 'hsl(222.2, 47.4%, 20%)' }}>Midwest</div>
                  <div className="flex gap-1">
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: 'hsl(210, 80%, 50%)' }} />
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: 'hsl(210, 70%, 60%)' }} />
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: 'hsl(0, 70%, 50%)' }} />
                  </div>
                </div>
              </button>
              <button
                onClick={() => setLocalColorTheme('california')}
                className={cn(
                  'p-0 rounded-lg transition-all overflow-hidden',
                  localColorTheme === 'california'
                    ? 'ring-4 ring-[hsl(35,90%,55%)]'
                    : 'ring-1 ring-border hover:ring-2 hover:ring-[hsl(35,90%,55%)]/50'
                )}
              >
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'hsl(210, 40%, 96%)' }}>
                  <div className="font-semibold mb-3" style={{ color: 'hsl(222.2, 47.4%, 20%)' }}>California</div>
                  <div className="flex gap-1">
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: 'hsl(35, 90%, 55%)' }} />
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: 'hsl(25, 85%, 60%)' }} />
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: 'hsl(5, 75%, 55%)' }} />
                  </div>
                </div>
              </button>
            </div>
          </div>
          </>
        )}

        {activeTab === 'api-keys' && (
          <APIKeysTab />
        )}

        {activeTab === 'content-folder' && (
          <ContentFolderTab />
        )}
        </div>

        {/* Footer - only show for General tab */}
        {activeTab === 'general' && (
          <div className="p-6 border-t border-border bg-muted/30 flex justify-end gap-2 flex-shrink-0">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Save
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function ContentFolderTab() {
  const [folderInfo, setFolderInfo] = useState<any>(null)
  const [newPath, setNewPath] = useState('')
  const [validationResult, setValidationResult] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadFolderInfo()
  }, [])

  const loadFolderInfo = async () => {
    try {
      const response = await fetch('/api/content-folder')
      const data = await response.json()
      setFolderInfo(data)
      setNewPath(data.content_folder)
    } catch (error) {
      setError('Failed to load content folder information')
    }
  }

  const validatePath = async (path: string) => {
    if (!path.trim()) {
      setValidationResult(null)
      return
    }

    try {
      const response = await fetch('/api/content-folder/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      })
      const result = await response.json()
      setValidationResult(result)
    } catch (error) {
      console.error('Validation error:', error)
    }
  }

  const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const path = e.target.value
    setNewPath(path)
    setTimeout(() => validatePath(path), 500)
  }

  const handleBrowse = async () => {
    if ((window as any).electronAPI?.showOpenDialog) {
      try {
        const result = await (window as any).electronAPI.showOpenDialog({
          properties: ['openDirectory', 'createDirectory'],
          title: 'Select Content Folder',
          defaultPath: folderInfo?.absolute_path || '~/'
        })

        if (result && !result.canceled && result.filePaths.length > 0) {
          const selectedPath = result.filePaths[0]
          setNewPath(selectedPath)
          validatePath(selectedPath)
        }
      } catch (error) {
        console.error('Folder picker error:', error)
      }
    } else {
      alert('Folder picker only available in Electron app')
    }
  }

  const handleSave = async () => {
    if (!newPath.trim()) {
      setError('Path cannot be empty')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/content-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: newPath })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update')
      }

      const result = await response.json()
      alert(`Content folder updated to: ${result.absolute_path}`)
      window.location.reload()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (!folderInfo) return <div className="text-center text-muted-foreground">Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold mb-2">Content Folder Location</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Configure where DeckBot stores presentations and templates. Settings always remain in ~/.deckbot.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Current Location</label>
        <div className="bg-muted/30 p-3 rounded-md text-sm space-y-1">
          <div><strong>Path:</strong> {folderInfo.content_folder}</div>
          <div><strong>Resolved:</strong> {folderInfo.absolute_path}</div>
          <div>
            <strong>Status:</strong>
            {folderInfo.exists ?
              <span className="text-green-600 ml-2">✓ Exists</span> :
              <span className="text-yellow-600 ml-2">⚠ Will be created</span>
            }
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">New Location</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newPath}
            onChange={handlePathChange}
            className="flex-1 px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="~/.deckbot"
          />
          {(window as any).electronAPI?.showOpenDialog && (
            <Button onClick={handleBrowse} variant="secondary">
              Browse...
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Use ~ for home directory
        </p>
      </div>

      {validationResult && (
        <div className={`p-3 rounded-md text-sm ${
          validationResult.valid ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
        }`}>
          {validationResult.valid ? (
            <div className="space-y-1">
              <div className="text-green-600 font-medium">✓ Valid path</div>
              <div className="text-xs opacity-75">{validationResult.absolute_path}</div>
              {validationResult.created && (
                <div className="text-xs opacity-75">Note: Directory will be created</div>
              )}
            </div>
          ) : (
            <div>
              <div className="text-red-600 font-medium">✗ Invalid</div>
              <div className="text-xs opacity-75">{validationResult.error}</div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-md text-sm bg-red-500/10 border border-red-500/20 text-red-600">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={saving || !validationResult?.valid}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button
          onClick={() => { setNewPath(folderInfo.content_folder); setValidationResult(null); }}
          variant="secondary"
        >
          Reset
        </Button>
      </div>

      <div className="border-t border-border pt-4">
        <h5 className="font-medium mb-2 text-sm">What happens when you change this?</h5>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>All future presentations and templates will be loaded from the new location</li>
          <li>Existing content in the old location will not be moved automatically</li>
          <li>You'll need to manually move presentations if you want to migrate them</li>
          <li>Settings and preferences remain in ~/.deckbot</li>
          <li>The app will reload to apply changes</li>
        </ul>
      </div>
    </div>
  )
}




