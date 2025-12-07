import { useState, useRef, type KeyboardEvent } from 'react'
import { Send, Image as ImageIcon, X } from 'lucide-react'
import { useChatStore } from '@/store/useChatStore'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/button'
import { commandAPI, chatAPI } from '@/services/api'

export function ChatInput() {
  const [input, setInput] = useState('')
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isSending, setIsSending] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { currentPresentation, currentSlide, fastMode } = useAppStore()
  const { addMessage } = useChatStore()

  const handleSend = async () => {
    console.log('[ChatInput] handleSend called, input:', input)

    // Prevent duplicate sends
    if (isSending) {
      console.log('[ChatInput] Already sending, ignoring duplicate call')
      return
    }
    if (!input.trim() && uploadedImages.length === 0) return
    if (!currentPresentation) return

    const trimmedInput = input.trim()
    setIsSending(true)

    // Check if this is a slash command
    const isSlashCommand = trimmedInput.startsWith('/') && uploadedImages.length === 0
    console.log('[ChatInput] isSlashCommand:', isSlashCommand)

    if (isSlashCommand) {
      console.log('[ChatInput] Processing as slash command')
      // Parse command and args
      const parts = trimmedInput.slice(1).split(' ')
      const command = parts[0].toLowerCase()
      const args = parts.slice(1).join(' ')
      console.log('[ChatInput] Command:', command, 'Args:', args)

      // Add user message immediately for commands
      addMessage({ role: 'user', content: trimmedInput })

      try {
        // Send to command endpoint
        console.log('[ChatInput] Calling commandAPI.execute')
        const response = await commandAPI.execute({
          command,
          args,
          presentation_name: currentPresentation.name,
          current_slide: currentSlide
        })
        console.log('[ChatInput] Command response:', response)

        // Handle direct responses for commands that don't use SSE
        if (command === 'fast' && !args) {
          // Toggle fast mode
          const { toggleFastMode } = useAppStore.getState()
          toggleFastMode()
          const newFastMode = useAppStore.getState().fastMode
          addMessage({
            role: 'system',
            content: newFastMode ? '⚡ Fast mode enabled' : '🐢 Fast mode disabled'
          } as any)
        } else if (response.content) {
          addMessage({
            role: 'system',
            content: response.content,
            message_type: response.format || 'text'
          } as any)
        } else if (response.tools) {
          // Handle tools list
          addMessage({
            role: 'system',
            content: response.content,
            message_type: 'markdown'
          } as any)
        }

        // Clear input after successful command
        setInput('')
        console.log('[ChatInput] Slash command processed, returning early')
      } catch (error) {
        console.error('Error executing command:', error)
        addMessage({ role: 'model', content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` })
      } finally {
        setIsSending(false)
      }
      return
    }

    console.log('[ChatInput] Processing as regular message')

    // Regular message handling
    // Don't add user message here - the SSE will add it via session_service

    // Create FormData for image uploads or JSON for regular messages
    const { fastMode } = useAppStore.getState()

    try {
      if (uploadedImages.length > 0) {
        // Use FormData for image uploads
        const formData = new FormData()
        if (trimmedInput) {
          formData.append('message', trimmedInput)
        }
        formData.append('presentation_name', currentPresentation.name)
        formData.append('current_slide', String(currentSlide))
        formData.append('model', fastMode ? 'secondary' : 'primary')

        uploadedImages.forEach((file, index) => {
          formData.append(`image_${index}`, file)
        })

        await chatAPI.sendFormData(formData)

        setInput('')
        setUploadedImages([])
        setImagePreviews([])
      } else {
        // Use JSON for text-only messages
        await chatAPI.sendJSON({
          message: trimmedInput,
          presentation_name: currentPresentation.name,
          current_slide: currentSlide,
          model: fastMode ? 'secondary' : 'primary'
        })

        setInput('')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setIsSending(false)
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
          placeholder={fastMode ? "Type a message... (Fast mode active)" : "Type a message... (Use /help for commands)"}
          className={`flex-1 min-h-[40px] max-h-[200px] px-4 py-2 bg-background border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring ${fastMode ? 'border-orange-500' : 'border-input'}`}
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
          disabled={(!input.trim() && uploadedImages.length === 0) || !currentPresentation || isSending}
        >
          <Send className="w-4 h-4 mr-2" />
          Send
        </Button>
      </div>
    </div>
  )
}
