import { useState, useEffect } from 'react'
import { presentationsAPI } from '@/services/api'
import type { PresentationSettings } from '@/types/Presentation'
import { Button } from '@/components/ui/button'
import { Upload, X } from 'lucide-react'
import FontPicker from 'react-fontpicker-ts'
import 'react-fontpicker-ts/dist/index.css'

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<'presentation' | 'style' | 'agent-prompts' | 'image-prompts'>('presentation')
  const [settings, setSettings] = useState<PresentationSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const data = await presentationsAPI.settings.get()
      setSettings(data)
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSavePresentation = async () => {
    if (!settings) return
    
    try {
      await presentationsAPI.settings.update({
        title: settings.title,
        description: settings.description,
        aspect_ratio: settings.aspect_ratio,
      })
      alert('Settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading settings...
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No presentation loaded
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-5 border-b border-border">
        <h3 className="text-lg font-semibold mb-1">Style & Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage presentation settings and view agent prompts
        </p>
      </div>
      
      <div className="flex border-b border-border">
        <button
          className={activeTab === 'presentation' ? 'px-4 py-3 border-b-2 border-primary text-primary font-medium' : 'px-4 py-3 text-muted-foreground hover:text-foreground'}
          onClick={() => setActiveTab('presentation')}
        >
          Presentation
        </button>
        <button
          className={activeTab === 'style' ? 'px-4 py-3 border-b-2 border-primary text-primary font-medium' : 'px-4 py-3 text-muted-foreground hover:text-foreground'}
          onClick={() => setActiveTab('style')}
        >
          Style
        </button>
        <button
          className={activeTab === 'agent-prompts' ? 'px-4 py-3 border-b-2 border-primary text-primary font-medium' : 'px-4 py-3 text-muted-foreground hover:text-foreground'}
          onClick={() => setActiveTab('agent-prompts')}
        >
          Presentation Agent
        </button>
        <button
          className={activeTab === 'image-prompts' ? 'px-4 py-3 border-b-2 border-primary text-primary font-medium' : 'px-4 py-3 text-muted-foreground hover:text-foreground'}
          onClick={() => setActiveTab('image-prompts')}
        >
          Image Agent
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-5 max-w-4xl">
          {activeTab === 'presentation' && (
            <PresentationSettingsTab settings={settings} setSettings={setSettings} onSave={handleSavePresentation} />
          )}
          {activeTab === 'style' && <StyleTab settings={settings} setSettings={setSettings} onReload={loadSettings} />}
          {activeTab === 'agent-prompts' && <PresentationAgentTab />}
          {activeTab === 'image-prompts' && <ImageAgentTab />}
        </div>
      </div>
    </div>
  )
}

function PresentationSettingsTab({ settings, setSettings, onSave }: any) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-2">Title</label>
        <input
          type="text"
          value={settings.title}
          onChange={(e) => setSettings({ ...settings, title: e.target.value })}
          className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          value={settings.description}
          onChange={(e) => setSettings({ ...settings, description: e.target.value })}
          className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Aspect Ratio</label>
        <select
          value={settings.aspect_ratio}
          onChange={(e) => setSettings({ ...settings, aspect_ratio: e.target.value })}
          className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="16:9">16:9 (Widescreen)</option>
          <option value="4:3">4:3 (Standard)</option>
          <option value="16:10">16:10</option>
          <option value="3:2">3:2</option>
          <option value="1:1">1:1 (Square)</option>
        </select>
      </div>
      <Button onClick={onSave}>Save Changes</Button>
    </div>
  )
}

function StyleTab({ settings, setSettings, onReload }: { settings: PresentationSettings; setSettings: (s: PresentationSettings) => void; onReload: () => void }) {
  const [styleData, setStyleData] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [styleRefFile, setStyleRefFile] = useState<File | null>(null)
  const [primaryFontLoaded, setPrimaryFontLoaded] = useState<boolean | null>(null)
  const [secondaryFontLoaded, setSecondaryFontLoaded] = useState<boolean | null>(null)

  useEffect(() => {
    loadStyleData()
  }, [])

  // Load and verify fonts when they change
  useEffect(() => {
    if (settings.font_settings?.primary) {
      loadAndVerifyFont(settings.font_settings.primary, setPrimaryFontLoaded)
    }
  }, [settings.font_settings?.primary])

  useEffect(() => {
    if (settings.font_settings?.secondary) {
      loadAndVerifyFont(settings.font_settings.secondary, setSecondaryFontLoaded)
    }
  }, [settings.font_settings?.secondary])

  const loadAndVerifyFont = async (fontFamily: string, setLoaded: (loaded: boolean | null) => void) => {
    setLoaded(null) // Reset to loading state

    // Load the font from Google Fonts
    const linkId = `font-${fontFamily.replace(/\s+/g, '-')}`
    let existingLink = document.getElementById(linkId) as HTMLLinkElement
    
    if (!existingLink) {
      const link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;700&display=swap`
      document.head.appendChild(link)
      existingLink = link
    }

    // Wait a bit for the font to load, then verify
    setTimeout(async () => {
      try {
        // Use Font Loading API to check if font loaded
        if ('fonts' in document) {
          await document.fonts.load(`16px "${fontFamily}"`)
          const fontLoaded = document.fonts.check(`16px "${fontFamily}"`)
          setLoaded(fontLoaded)
        } else {
          // Fallback: assume loaded if link exists
          setLoaded(true)
        }
      } catch (error) {
        console.error(`Failed to load font ${fontFamily}:`, error)
        setLoaded(false)
      }
    }, 1000)
  }

  const loadStyleData = async () => {
    try {
      const response = await fetch('/api/presentation/style')
      const data = await response.json()
      setStyleData(data)
    } catch (error) {
      console.error('Error loading style data:', error)
    }
  }

  const handleSaveStyle = async () => {
    setSaving(true)
    try {
      const formData = new FormData()
      if (styleData?.instructions) formData.append('instructions', styleData.instructions)
      if (styleData?.image_style?.prompt) formData.append('image_style.prompt', styleData.image_style.prompt)
      if (styleRefFile) formData.append('file', styleRefFile)

      const settingsData = {
        title: settings.title,
        description: settings.description,
        aspect_ratio: settings.aspect_ratio,
        color_settings: settings.color_settings,
        font_settings: settings.font_settings,
      }

      await Promise.all([
        fetch('/api/presentation/style', {
          method: 'POST',
          body: formData,
        }),
        fetch('/api/presentation/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settingsData),
        }),
      ])

      alert('Style settings saved successfully')
      onReload()
    } catch (error) {
      console.error('Error saving style:', error)
      alert('Failed to save style settings')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveRefImage = async () => {
    if (!confirm('Remove style reference image?')) return

    try {
      await fetch('/api/presentation/style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delete_reference: true }),
      })
      loadStyleData()
    } catch (error) {
      console.error('Error removing reference image:', error)
    }
  }

  if (!styleData) {
    return <div className="text-center text-muted-foreground">Loading style data...</div>
  }

  return (
    <div className="space-y-6">
      {/* Fonts */}
      <div className="space-y-4">
        {/* Primary Font */}
        <div>
          <label className="block text-sm font-medium mb-2">Primary Font (Headings)</label>
          <div className="rounded-lg p-4 bg-card space-y-3">
            <div className="font-picker-wrapper">
              <FontPicker
                defaultValue={settings.font_settings?.primary || 'Inter'}
                value={(fontName: string) => {
                  setSettings({
                    ...settings,
                    font_settings: { ...settings.font_settings, primary: fontName }
                  })
                }}
              />
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">
                Or enter a custom font name
              </label>
              <input
                type="text"
                value={settings.font_settings?.primary || 'Inter'}
                onChange={(e) => {
                  setSettings({
                    ...settings,
                    font_settings: { ...settings.font_settings, primary: e.target.value }
                  })
                }}
                className="w-full px-3 py-2 bg-background border border-muted rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                placeholder="e.g., Inter, Helvetica Neue, Custom Font Name"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                💡 This exact string will be sent to the AI model. Google Fonts are most reliable.
              </p>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1.5">Preview:</div>
              <div 
                className="p-4 border border-muted rounded-md bg-background"
                style={{ fontFamily: `"${settings.font_settings?.primary || 'Inter'}", sans-serif`, fontSize: '24px' }}
              >
                The quick brown fox jumps
              </div>
              {/* Fixed height container for status to prevent jiggling */}
              <div className="h-5 mt-1.5">
                {primaryFontLoaded === false && (
                  <div className="text-xs text-destructive flex items-center gap-1">
                    ⚠️ Font failed to load - preview showing fallback
                  </div>
                )}
                {primaryFontLoaded === null && (
                  <div className="text-xs text-muted-foreground">Loading font...</div>
                )}
                {primaryFontLoaded === true && (
                  <div className="text-xs text-green-600">✓ Font loaded successfully</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Font */}
        <div>
          <label className="block text-sm font-medium mb-2">Secondary Font (Body)</label>
          <div className="rounded-lg p-4 bg-card space-y-3">
            <div className="font-picker-wrapper">
              <FontPicker
                defaultValue={settings.font_settings?.secondary || 'Source Serif Pro'}
                value={(fontName: string) => {
                  setSettings({
                    ...settings,
                    font_settings: { ...settings.font_settings, secondary: fontName }
                  })
                }}
              />
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">
                Or enter a custom font name
              </label>
              <input
                type="text"
                value={settings.font_settings?.secondary || 'Source Serif Pro'}
                onChange={(e) => {
                  setSettings({
                    ...settings,
                    font_settings: { ...settings.font_settings, secondary: e.target.value }
                  })
                }}
                className="w-full px-3 py-2 bg-background border border-muted rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                placeholder="e.g., Source Serif Pro, Georgia, Custom Font Name"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                💡 This exact string will be sent to the AI model. Google Fonts are most reliable.
              </p>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1.5">Preview:</div>
              <div 
                className="p-4 border border-muted rounded-md bg-background"
                style={{ fontFamily: `"${settings.font_settings?.secondary || 'Source Serif Pro'}", sans-serif`, fontSize: '16px' }}
              >
                The quick brown fox jumps over the lazy dog. 1234567890
              </div>
              {/* Fixed height container for status to prevent jiggling */}
              <div className="h-5 mt-1.5">
                {secondaryFontLoaded === false && (
                  <div className="text-xs text-destructive flex items-center gap-1">
                    ⚠️ Font failed to load - preview showing fallback
                  </div>
                )}
                {secondaryFontLoaded === null && (
                  <div className="text-xs text-muted-foreground">Loading font...</div>
                )}
                {secondaryFontLoaded === true && (
                  <div className="text-xs text-green-600">✓ Font loaded successfully</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Color Palette */}
      <div>
        <label className="block text-sm font-medium mb-3">Color Palette</label>
        <p className="text-xs text-muted-foreground mb-3">
          These colors define the visual style for this presentation and will be used by both the presentation and image agents.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <ColorPicker label="Primary" value={settings.color_settings?.primary || '#3B82F6'} onChange={(v) => setSettings({ ...settings, color_settings: { ...settings.color_settings, primary: v }})} />
          <ColorPicker label="Secondary" value={settings.color_settings?.secondary || '#8B5CF6'} onChange={(v) => setSettings({ ...settings, color_settings: { ...settings.color_settings, secondary: v }})} />
          <ColorPicker label="Accent" value={settings.color_settings?.accent || '#60A5FA'} onChange={(v) => setSettings({ ...settings, color_settings: { ...settings.color_settings, accent: v }})} />
          <ColorPicker label="Danger" value={settings.color_settings?.danger || '#EF4444'} onChange={(v) => setSettings({ ...settings, color_settings: { ...settings.color_settings, danger: v }})} />
          <ColorPicker label="Muted" value={settings.color_settings?.muted || '#9CA3AF'} onChange={(v) => setSettings({ ...settings, color_settings: { ...settings.color_settings, muted: v }})} />
          <ColorPicker label="Foreground (Text)" value={settings.color_settings?.foreground || '#2C4074'} onChange={(v) => setSettings({ ...settings, color_settings: { ...settings.color_settings, foreground: v }})} />
        </div>
        <div className="mt-3">
          <ColorPicker label="Background" value={settings.color_settings?.background || '#EEE5D3'} onChange={(v) => setSettings({ ...settings, color_settings: { ...settings.color_settings, background: v }})} />
        </div>
      </div>

      {/* Coding Agent Instructions */}
      <div>
        <label className="block text-sm font-medium mb-2">Coding Agent Instructions</label>
        <p className="text-xs text-muted-foreground mb-2">Instructions for the agent on tone, structure, and content.</p>
        <textarea
          value={styleData.instructions || ''}
          onChange={(e) => setStyleData({ ...styleData, instructions: e.target.value })}
          className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px] resize-y"
          placeholder="E.g. Use professional tone, start with an agenda..."
        />
      </div>

      {/* Image Style Prompt */}
      <div>
        <label className="block text-sm font-medium mb-2">Image Style Prompt</label>
        <p className="text-xs text-muted-foreground mb-2">Instructions for the image generation model.</p>
        <textarea
          value={styleData.image_style?.prompt || ''}
          onChange={(e) => setStyleData({ ...styleData, image_style: { ...styleData.image_style, prompt: e.target.value }})}
          className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px] resize-y"
          placeholder="E.g. Minimalist, blue and white color scheme..."
        />
      </div>

      {/* Style Reference Image */}
      <div>
        <label className="block text-sm font-medium mb-2">Style Reference Image</label>
        <p className="text-xs text-muted-foreground mb-2">Upload an image to serve as a visual style reference.</p>
        
        {styleData.reference_image_url && !styleRefFile && (
          <div className="mb-3">
            <img src={styleData.reference_image_url} alt="Style reference" className="max-w-full rounded-md border border-input" />
            <Button variant="secondary" size="sm" onClick={handleRemoveRefImage} className="mt-2">
              <X className="w-3 h-3 mr-1" />
              Remove Reference
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setStyleRefFile(e.target.files?.[0] || null)}
            className="hidden"
            id="style-ref-upload"
          />
          <Button variant="secondary" onClick={() => document.getElementById('style-ref-upload')?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            {styleRefFile ? styleRefFile.name : 'Choose Image'}
          </Button>
        </div>
      </div>

      <Button onClick={handleSaveStyle} disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  )
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1">{label}</label>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 border border-input rounded-md cursor-pointer"
      />
    </div>
  )
}

function PresentationAgentTab() {
  const [prompts, setPrompts] = useState<any>(null)
  const [view, setView] = useState<'structure' | 'processed'>('structure')
  const [processedPrompt, setProcessedPrompt] = useState('')

  useEffect(() => {
    loadPrompts()
  }, [])

  const loadPrompts = async () => {
    try {
      const response = await fetch('/api/presentation/prompts')
      const data = await response.json()
      if (!data.error) {
        setPrompts(data.presentation_agent)
      }
    } catch (error) {
      console.error('Error loading prompts:', error)
    }
  }

  const loadProcessedPrompt = async () => {
    try {
      const response = await fetch('/api/presentation/agent-prompt')
      const data = await response.json()
      if (!data.error) {
        setProcessedPrompt(data.system_prompt || 'Not available')
      }
    } catch (error) {
      console.error('Error loading processed prompt:', error)
    }
  }

  useEffect(() => {
    if (view === 'processed') {
      loadProcessedPrompt()
    }
  }, [view])

  if (!prompts) {
    return <div className="text-center text-muted-foreground">Loading prompts...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex border-b border-border">
        <button
          className={view === 'structure' ? 'px-4 py-2 border-b-2 border-primary text-primary font-medium' : 'px-4 py-2 text-muted-foreground hover:text-foreground'}
          onClick={() => setView('structure')}
        >
          Structure
        </button>
        <button
          className={view === 'processed' ? 'px-4 py-2 border-b-2 border-primary text-primary font-medium' : 'px-4 py-2 text-muted-foreground hover:text-foreground'}
          onClick={() => setView('processed')}
        >
          Processed
        </button>
      </div>

      {view === 'structure' ? (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">System Prompt Structure</h4>
            <p className="text-sm text-muted-foreground mb-4">{prompts.description}</p>
          </div>
          {prompts.sections?.map((section: any, i: number) => (
            <div key={i} className="border border-border rounded-md p-4 space-y-2">
              <div className="font-medium">{section.name}</div>
              <div className="text-sm text-muted-foreground">{section.description}</div>
              <div className="text-xs text-muted-foreground">Source: {section.source}</div>
            </div>
          ))}
          {prompts.note && (
            <div className="border border-border rounded-md p-4 space-y-2">
              <div className="font-medium">Note</div>
              <div className="text-sm text-muted-foreground">{prompts.note}</div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Full Processed Prompt</h4>
            <p className="text-sm text-muted-foreground mb-4">This is what gets sent to the model with current settings</p>
          </div>
          <div className="border border-border rounded-md p-4">
            <div className="font-medium mb-2">System Prompt (Processed)</div>
            <pre className="text-sm whitespace-pre-wrap max-h-[600px] overflow-y-auto">{processedPrompt}</pre>
          </div>
        </div>
      )}
    </div>
  )
}

function ImageAgentTab() {
  const [prompts, setPrompts] = useState<any>(null)
  const [view, setView] = useState<'code' | 'processed'>('code')
  const [testPrompt, setTestPrompt] = useState('')
  const [processedPrompts, setProcessedPrompts] = useState<any>(null)

  useEffect(() => {
    loadPrompts()
  }, [])

  const loadPrompts = async () => {
    try {
      const response = await fetch('/api/presentation/prompts')
      const data = await response.json()
      if (!data.error) {
        setPrompts(data.image_agent)
      }
    } catch (error) {
      console.error('Error loading prompts:', error)
    }
  }

  const loadProcessedPrompts = async (prompt: string) => {
    if (!prompt) {
      setProcessedPrompts(null)
      return
    }

    try {
      const response = await fetch(`/api/presentation/image-prompts?prompt=${encodeURIComponent(prompt)}`)
      const data = await response.json()
      if (!data.error) {
        setProcessedPrompts(data)
      }
    } catch (error) {
      console.error('Error loading processed prompts:', error)
    }
  }

  useEffect(() => {
    if (view === 'processed') {
      const timer = setTimeout(() => loadProcessedPrompts(testPrompt), 500)
      return () => clearTimeout(timer)
    }
  }, [testPrompt, view])

  if (!prompts) {
    return <div className="text-center text-muted-foreground">Loading prompts...</div>
  }

  const scenarios = [
    { key: 'generating', title: 'Fresh Image Generation' },
    { key: 'remix_slide', title: 'Remix Slide' },
    { key: 'remix_image', title: 'Remix Image' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex border-b border-border">
        <button
          className={view === 'code' ? 'px-4 py-2 border-b-2 border-primary text-primary font-medium' : 'px-4 py-2 text-muted-foreground hover:text-foreground'}
          onClick={() => setView('code')}
        >
          Code
        </button>
        <button
          className={view === 'processed' ? 'px-4 py-2 border-b-2 border-primary text-primary font-medium' : 'px-4 py-2 text-muted-foreground hover:text-foreground'}
          onClick={() => setView('processed')}
        >
          Processed
        </button>
      </div>

      {view === 'code' ? (
        <div className="space-y-6">
          {scenarios.map(scenario => {
            const data = prompts[scenario.key]
            if (!data) return null

            return (
              <div key={scenario.key} className="border border-border rounded-md p-4 space-y-4">
                <div>
                  <h4 className="font-semibold mb-1">{scenario.title}</h4>
                  <p className="text-sm text-muted-foreground">{data.description}</p>
                </div>

                <div>
                  <h5 className="font-medium mb-2">System Instructions</h5>
                  <p className="text-xs text-muted-foreground mb-2">Template strings from PROMPT_TEMPLATES (nano_banana.py)</p>
                  <div className="space-y-2">
                    {Object.entries(data.system_instructions || {}).map(([key, value]: [string, any]) => (
                      value && (
                        <div key={key} className="bg-muted/30 p-2 rounded text-sm">
                          <div className="font-medium text-xs">{key.replace(/_/g, ' ')}</div>
                          <div className="text-xs opacity-70">{String(value)}</div>
                        </div>
                      )
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="font-medium mb-2">User Message</h5>
                  <p className="text-xs text-muted-foreground mb-2">Built from user input + context</p>
                  <div className="space-y-2">
                    {Object.entries(data.user_message || {}).map(([key, value]: [string, any]) => (
                      value && (
                        <div key={key} className="bg-muted/30 p-2 rounded text-sm">
                          <div className="font-medium text-xs">{key.replace(/_/g, ' ')}</div>
                          <div className="text-xs opacity-70">{String(value)}</div>
                        </div>
                      )
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="font-medium mb-2">Contents Array Order</h5>
                  <p className="text-xs text-muted-foreground mb-2">Order of items sent to the Gemini API</p>
                  <div className="space-y-1">
                    {data.contents_order?.map((item: string, i: number) => (
                      <div key={i} className="bg-muted/30 p-2 rounded text-xs">
                        <span className="font-medium">{i + 1}.</span> {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The processed prompts show what would be sent to the model with your current settings. Enter a test prompt to see how it would be constructed.
          </p>

          <div>
            <label className="block text-sm font-medium mb-2">Test Prompt</label>
            <input
              type="text"
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="E.g. a blue circle"
            />
          </div>

          {!testPrompt ? (
            <div className="text-center text-muted-foreground py-8">
              Enter a test prompt above to see how it would be processed
            </div>
          ) : processedPrompts ? (
            <div className="space-y-6">
              {Object.entries(processedPrompts).map(([key, data]: [string, any]) => (
                <div key={key} className="border border-border rounded-md p-4 space-y-4">
                  <h4 className="font-semibold">
                    {key === 'generating' ? 'Fresh Image Generation' : key === 'remix_slide' ? 'Remix Slide' : 'Remix Image'}
                  </h4>

                  <div>
                    <h5 className="font-medium mb-2">System Instructions (Processed)</h5>
                    <pre className="text-xs whitespace-pre-wrap bg-muted/30 p-3 rounded max-h-[300px] overflow-y-auto">
                      {data.system_message}
                    </pre>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">User Message (Processed)</h5>
                    <pre className="text-xs whitespace-pre-wrap bg-muted/30 p-3 rounded max-h-[300px] overflow-y-auto">
                      {data.user_message}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">Loading...</div>
          )}
        </div>
      )}
    </div>
  )
}

