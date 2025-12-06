import { useState, useEffect } from 'react'
import { Presentation, FileText, Clock, Plus, Trash2 } from 'lucide-react'
import { usePresentationStore } from '@/store/usePresentationStore'
import { useAppStore } from '@/store/useAppStore'
import { useChatStore } from '@/store/useChatStore'
import { presentationsAPI, templatesAPI } from '@/services/api'
import { Button } from '@/components/ui/button'
import { CreatePresentationModal } from './CreatePresentationModal'
import type { Presentation as PresentationType, Template } from '@/types/Presentation'

export function WelcomeScreen() {
  const [activeTab, setActiveTab] = useState<'presentations' | 'templates'>('presentations')
  const { presentations, templates, setPresentations, setTemplates, removePresentation } = usePresentationStore()
  const { setCurrentPresentation, setShowWelcomeScreen } = useAppStore()
  const { setMessages } = useChatStore()
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTemplateForCreate, setSelectedTemplateForCreate] = useState<string | undefined>(undefined)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [pres, tmpl] = await Promise.all([
        presentationsAPI.list(),
        templatesAPI.list(),
      ])
      setPresentations(pres)
      setTemplates(tmpl)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenPresentation = async (name: string) => {
    try {
      const result = await presentationsAPI.load(name)
      setCurrentPresentation(result.presentation)
      setMessages(result.history || [])
      setShowWelcomeScreen(false)
    } catch (error) {
      console.error('Error loading presentation:', error)
      alert('Failed to load presentation')
    }
  }

  const handleDeletePresentation = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    
    try {
      await presentationsAPI.delete(name)
      removePresentation(name)
    } catch (error) {
      console.error('Error deleting presentation:', error)
      alert('Failed to delete presentation')
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently'
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  return (
    <>
      <div className="fixed inset-0 top-10 bg-background z-10 flex flex-col">
        <div className="border-b border-border bg-background p-10 pb-0">
          <div className="flex gap-2">
            <button
              className={activeTab === 'presentations' 
                ? 'flex items-center gap-2 px-5 py-3 border-b-2 border-primary text-primary font-medium transition-colors' 
                : 'flex items-center gap-2 px-5 py-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-colors'}
              onClick={() => setActiveTab('presentations')}
            >
              <Presentation className="w-4 h-4" />
              Presentations
            </button>
            <button
              className={activeTab === 'templates' 
                ? 'flex items-center gap-2 px-5 py-3 border-b-2 border-primary text-primary font-medium transition-colors' 
                : 'flex items-center gap-2 px-5 py-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-colors'}
              onClick={() => setActiveTab('templates')}
            >
              <Presentation className="w-4 h-4" />
              Templates
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-10">
          {loading ? (
            <div className="text-center text-muted-foreground">Loading...</div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6">
              {activeTab === 'presentations' && (
                <>
                  <PresentationCard
                    type="create"
                    onCreateClick={() => setShowCreateModal(true)}
                  />
                  {presentations.map((pres) => (
                    <PresentationCard
                      key={pres.name}
                      type="presentation"
                      presentation={pres}
                      onOpen={() => handleOpenPresentation(pres.name)}
                      onDelete={(e) => handleDeletePresentation(pres.name, e)}
                      formatDate={formatDate}
                    />
                  ))}
                </>
              )}
              {activeTab === 'templates' && (
                <>
                  {templates.map((template) => (
                    <PresentationCard
                      key={template.name}
                      type="template"
                      template={template}
                      onOpen={() => {
                        setSelectedTemplateForCreate(template.name)
                        setShowCreateModal(true)
                      }}
                      onDelete={() => {/* TODO: Delete template */}}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      <CreatePresentationModal 
        open={showCreateModal} 
        onClose={() => {
          setShowCreateModal(false)
          setSelectedTemplateForCreate(undefined)
        }}
        initialTemplate={selectedTemplateForCreate}
      />
    </>
  )
}

interface PresentationCardProps {
  type: 'create' | 'presentation' | 'template'
  presentation?: PresentationType
  template?: Template
  onOpen?: () => void
  onDelete?: (e: React.MouseEvent) => void
  onCreateClick?: () => void
  formatDate?: (date?: string) => string
}

function PresentationCard({ type, presentation, template, onOpen, onDelete, onCreateClick, formatDate }: PresentationCardProps) {
  const [previews, setPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (type === 'create') {
      setLoading(false)
      return
    }
    if (presentation) {
      loadPresentationPreviews(presentation.name)
    } else if (template) {
      loadTemplatePreviews(template.name)
    }
  }, [presentation, template, type])

  const loadPresentationPreviews = async (name: string) => {
    try {
      const response = await fetch(`/api/presentations/${encodeURIComponent(name)}/preview-slides`)
      const data = await response.json()
      if (data.previews && data.previews.length > 0) {
        setPreviews(data.previews)
      }
    } catch (error) {
      console.error('Error loading presentation previews:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTemplatePreviews = async (name: string) => {
    try {
      const url = `/api/templates/${encodeURIComponent(name)}/preview-slides`
      console.log(`Fetching template previews from: ${url}`)
      const response = await fetch(url)
      if (!response.ok) {
        console.error(`Template preview failed: ${response.status} ${response.statusText}`)
        const text = await response.text()
        console.error('Response body:', text)
        setLoading(false)
        return
      }
      const data = await response.json()
      console.log(`Template "${name}" previews:`, data)
      if (data.previews && data.previews.length > 0) {
        setPreviews(data.previews)
      }
    } catch (error) {
      console.error(`Error loading template previews for "${name}":`, error)
    } finally {
      setLoading(false)
    }
  }

  if (type === 'create') {
    return (
      <div
        onClick={onCreateClick}
        className="rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer transition-all bg-[hsl(var(--card))] hover:bg-accent"
      >
        <Plus className="w-12 h-12 text-muted-foreground mb-4" />
        <span className="text-lg font-medium text-muted-foreground">Create New Presentation</span>
      </div>
    )
  }

  const item = presentation || template
  if (!item) return null

  return (
    <div
      onClick={onOpen}
      className="rounded-lg overflow-hidden cursor-pointer transition-all bg-[hsl(var(--card))] group hover:bg-accent"
    >
      <div className="h-48 bg-muted/30 flex items-center justify-center overflow-hidden relative rounded-t-lg">
        {loading ? (
          <div className="text-muted-foreground text-sm">Loading preview...</div>
        ) : previews.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto h-full items-center">
            {previews.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Slide ${index + 1}`}
                className="h-full w-auto object-contain flex-shrink-0"
              />
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">No preview available</div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold mb-2">{item.name}</h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {item.description || 'No description'}
        </p>
        <div className="flex gap-4 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {item.slide_count || 0} slides
          </span>
          {presentation && formatDate && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(presentation.last_modified)}
            </span>
          )}
        </div>
        <div className="flex gap-2 pt-3 border-t border-border">
          {onDelete && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onDelete}
              className="flex-1"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={onOpen}
            className="flex-1"
          >
            {presentation ? 'Open' : 'Use'}
          </Button>
        </div>
      </div>
    </div>
  )
}

