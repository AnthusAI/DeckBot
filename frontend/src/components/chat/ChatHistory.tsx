import { useEffect, useRef } from 'react'
import { useChatStore } from '@/store/useChatStore'
import { Message } from './Message'
import { ThinkingIndicator } from './ThinkingIndicator'

export function ChatHistory() {
  const { messages, isThinking } = useChatStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isThinking])

  useEffect(() => {
    console.log('ChatHistory: messages updated', messages.length, messages)

    // Check for messages with no displayable content
    const invalidMessages = messages.filter(m => {
      const hasContent = ('content' in m && m.content) ||
                        ('parts' in m && m.parts && m.parts.length > 0) ||
                        ('message_type' in m)
      return !hasContent
    })
    if (invalidMessages.length > 0) {
      console.warn('Messages with no displayable content:', invalidMessages)
    }
  }, [messages])

  // Filter out messages that have no displayable content
  const displayableMessages = messages.filter(m => {
    // Messages with content field
    if ('content' in m && m.content) return true

    // Messages with parts array (even if empty, we'll check in Message component)
    if ('parts' in m && Array.isArray(m.parts)) return true

    // Messages with message_type (rich messages)
    if ('message_type' in m) return true

    // Filter out messages with only role field
    return false
  })

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
      {displayableMessages.length === 0 && !isThinking && (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <p className="text-lg mb-2">No messages yet</p>
            <p className="text-sm">Start a conversation with the AI assistant</p>
          </div>
        </div>
      )}
      {displayableMessages.map((message, index) => (
        <Message key={index} message={message} />
      ))}
      {isThinking && <ThinkingIndicator />}
    </div>
  )
}




