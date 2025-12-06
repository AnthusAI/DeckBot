import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { usePresentationStore } from '@/store/usePresentationStore'
import { presentationsAPI, templatesAPI } from '@/services/api'
import { useAppStore } from '@/store/useAppStore'
import { useChatStore } from '@/store/useChatStore'
import { Button } from '@/components/ui/button'

interface CreatePresentationModalProps {
  open: boolean
  onClose: () => void
  initialTemplate?: string
}

export function CreatePresentationModal({ open, onClose, initialTemplate }: CreatePresentationModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { templates, setTemplates } = usePresentationStore()
  const { setCurrentPresentation, setShowWelcomeScreen } = useAppStore()
  const { setMessages } = useChatStore()

  useEffect(() => {
    if (open) {
      loadTemplates()
      if (initialTemplate) {
        setSelectedTemplate(initialTemplate)
      }
    } else {
      // Reset form when closed
      setName('')
      setDescription('')
      setSelectedTemplate('')
    }
  }, [open, initialTemplate])

  const loadTemplates = async () => {
    try {
      const tmpl = await templatesAPI.list()
      setTemplates(tmpl)
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await presentationsAPI.create({
        name: name.trim(),
        description: description.trim(),
        template: selectedTemplate || undefined,
      })
      
      const result = await presentationsAPI.load(name.trim())
      setCurrentPresentation(result.presentation)
      setMessages(result.history || [])
      setShowWelcomeScreen(false)
      onClose()
    } catch (error: any) {
      alert(error.message || 'Failed to create presentation')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-[hsl(var(--card))] border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Create New Presentation</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Presentation name"
              required
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Template (optional)</label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">No template</option>
              {templates.map((t) => (
                <option key={t.name} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

