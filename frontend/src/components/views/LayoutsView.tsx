import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { layoutsAPI } from '@/services/api'
import type { Layout } from '@/types/Layout'
import { Button } from '@/components/ui/button'

export function LayoutsView() {
  const { currentPresentation } = useAppStore()
  const [layouts, setLayouts] = useState<Layout[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentPresentation) {
      loadLayouts()
    }
  }, [currentPresentation])

  const loadLayouts = async () => {
    try {
      setLoading(true)
      const result = await layoutsAPI.list()
      setLayouts(result.layouts || [])
    } catch (error) {
      console.error('Error loading layouts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectLayout = async (layoutName: string) => {
    try {
      await layoutsAPI.select({ layout_name: layoutName })
    } catch (error) {
      console.error('Error selecting layout:', error)
      alert('Failed to select layout')
    }
  }

  if (!currentPresentation) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No presentation loaded
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading layouts...
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-5">
      <h3 className="text-lg font-semibold mb-2">Available Layouts</h3>
      <p className="text-sm text-muted-foreground mb-5">
        Select a layout to apply it to your slides
      </p>
      <div className="space-y-4">
        {layouts.map((layout) => (
          <div
            key={layout.name}
            className="border border-border rounded-lg p-4 bg-muted/50"
          >
            <img 
              src={layoutsAPI.preview(layout.name)} 
              alt={`${layout.name} preview`}
              className="w-full rounded mb-3 bg-background"
            />
            <h4 className="font-semibold mb-2">{layout.name}</h4>
            {layout.description && (
              <p className="text-sm text-muted-foreground mb-3">{layout.description}</p>
            )}
            <div className="flex gap-2">
              {layout.image_friendly && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Image-friendly</span>
              )}
              {layout.recommended_aspect_ratio && (
                <span className="text-xs bg-muted px-2 py-1 rounded">
                  {layout.recommended_aspect_ratio}
                </span>
              )}
            </div>
            <Button
              variant="primary"
              size="sm"
              className="w-full mt-3"
              onClick={() => handleSelectLayout(layout.name)}
            >
              Use Layout
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

