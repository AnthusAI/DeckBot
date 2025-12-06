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
  }, [messages])

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
      {messages.length === 0 && !isThinking && (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <p className="text-lg mb-2">No messages yet</p>
            <p className="text-sm">Start a conversation with the AI assistant</p>
          </div>
        </div>
      )}
      {messages.map((message, index) => (
        <Message key={index} message={message} />
      ))}
      {isThinking && <ThinkingIndicator />}
    </div>
  )
}

