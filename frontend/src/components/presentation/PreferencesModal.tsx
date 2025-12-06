import { useState, useEffect } from 'react'
import { X, Sun, Palette, Key } from 'lucide-react'
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

type Tab = 'general' | 'api-keys'

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

