import { useEventSource, useSSEConnection } from './useEventSource'
import { useChatStore } from '@/store/useChatStore'
import type { Message, ImageCandidate, ImageRequestDetails } from '@/types/Chat'

export function useSSEIntegration() {
  useSSEConnection()
  const { addMessage, setThinking, setImageRequestDetails, addImageCandidate, setSelectedImageIndex, setCurrentBatchSlug } = useChatStore()

  // Handle incoming messages
  useEventSource('message', (data: any) => {
    if (data.role && data.content) {
      addMessage({ role: data.role, content: data.content } as Message)
    }
  })

  // Handle thinking state
  useEventSource('thinking_start', () => {
    setThinking(true)
  })
  
  useEventSource('thinking_end', () => {
    setThinking(false)
  })

  // Handle image generation
  useEventSource('image_request_details', (data: ImageRequestDetails) => {
    setImageRequestDetails(data)
    setCurrentBatchSlug(data.batch_slug)
    addMessage({
      role: 'system',
      message_type: 'image_request_details',
      data,
    } as any)
  })

  useEventSource('image_candidate', (data: ImageCandidate) => {
    addImageCandidate(data)
    addMessage({
      role: 'system',
      message_type: 'image_candidate',
      data,
    } as any)
  })

  useEventSource('image_selected', (data: any) => {
    setSelectedImageIndex(data.index)
    addMessage({
      role: 'system',
      content: `Image saved: ${data.filename || 'image'}`,
    } as Message)
  })

  // Handle presentation updates
  useEventSource('presentation_updated', () => {
    // Dispatch custom event for preview reload
    window.dispatchEvent(new CustomEvent('presentation-updated'))
  })

  // Handle tool calls (they come as system messages)
  useEventSource('tool_call', () => {
    // Tool calls are handled via regular messages
  })

  // Handle tool results (they come as system messages)
  useEventSource('tool_result', () => {
    // Tool results are handled via regular messages
  })

  // Handle command results
  useEventSource('command_result', (data: any) => {
    const { command, content, format, message } = data

    // Note: /fast toggle is handled directly in ChatInput, not here
    if (command === 'export') {
      addMessage({
        role: 'system',
        content: message || 'PDF exported successfully'
      } as Message)
      // Could also trigger a download here if needed
    } else if (command === 'help' || command === 'tools') {
      // Display formatted help/tools content
      addMessage({
        role: 'system',
        content: content,
        message_type: format || 'markdown'
      } as any)
    }
  })

  // Handle command errors
  useEventSource('command_error', (data: any) => {
    const { command, error } = data
    addMessage({
      role: 'system',
      content: `Command /${command} failed: ${error}`
    } as Message)
  })
}

