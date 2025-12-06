import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { presentationsAPI } from '@/services/api'
import { Button } from '@/components/ui/button'

interface SaveAsModalProps {
  open: boolean
  onClose: () => void
}

export function SaveAsModal({ open, onClose }: SaveAsModalProps) {
  const { currentPresentation, setCurrentPresentation, setShowWelcomeScreen } = useAppStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [copyImages, setCopyImages] = useState(true)

  useEffect(() => {
    if (open && currentPresentation) {
      setName(`${currentPresentation.name} Copy`)
      setDescription(currentPresentation.description || '')
    }
  }, [open, currentPresentation])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !currentPresentation) return

    try {
      const result = await presentationsAPI.saveAs({
        name: name.trim(),
        description: description.trim(),
        copy_images: copyImages,
      })
      
      // Load the new presentation
      const loaded = await presentationsAPI.load(result.folder_name || result.name)
      setCurrentPresentation(loaded.presentation)
      setShowWelcomeScreen(false)
      onClose()
    } catch (error: any) {
      alert(error.message || 'Failed to save presentation')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Save Presentation As</h2>
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
              placeholder="New presentation name"
              required
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring min-h-[60px]"
            />
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={copyImages}
                onChange={(e) => setCopyImages(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Copy images</span>
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Copy
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

