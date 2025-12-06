import { useState, useRef, type KeyboardEvent } from 'react'
import { Send, Image as ImageIcon, X } from 'lucide-react'
import { useChatStore } from '@/store/useChatStore'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/button'

export function ChatInput() {
  const [input, setInput] = useState('')
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { currentPresentation, currentSlide } = useAppStore()
  const { addMessage } = useChatStore()

  const handleSend = async () => {
    if (!input.trim() && uploadedImages.length === 0) return
    if (!currentPresentation) return

    // Add user message immediately
    if (input.trim()) {
      addMessage({ role: 'user', content: input })
    }

    // Create FormData for image uploads
    const formData = new FormData()
    if (input.trim()) {
      formData.append('message', input)
    }
    formData.append('presentation_name', currentPresentation.name)
    formData.append('current_slide', String(currentSlide))

    uploadedImages.forEach((file, index) => {
      formData.append(`image_${index}`, file)
    })

    try {
      // Use fetch directly for FormData
      const response = await fetch('/api/chat', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      setInput('')
      setUploadedImages([])
      setImagePreviews([])
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    
    const newImages = [...uploadedImages, ...files]
    setUploadedImages(newImages)
    
    // Create previews
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="border-t border-border bg-card">
      {imagePreviews.length > 0 && (
        <div className="p-2 border-b border-border flex gap-2 flex-wrap">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative">
              <img src={preview} alt={`Preview ${index}`} className="w-20 h-20 object-cover rounded" />
              <button
                onClick={() => removeImage(index)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:opacity-90 text-xs"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="p-4 flex gap-2 items-end">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Use /image <prompt> for images)"
          className="flex-1 min-h-[40px] max-h-[200px] px-4 py-2 bg-background border border-input rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          rows={1}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement
            target.style.height = 'auto'
            target.style.height = `${target.scrollHeight}px`
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          className="hidden"
        />
        <Button
          variant="ghost"
          size="md"
          onClick={() => fileInputRef.current?.click()}
          title="Upload image"
        >
          <ImageIcon className="w-4 h-4" />
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={handleSend}
          disabled={(!input.trim() && uploadedImages.length === 0) || !currentPresentation}
        >
          <Send className="w-4 h-4 mr-2" />
          Send
        </Button>
      </div>
    </div>
  )
}
