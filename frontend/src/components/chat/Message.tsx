import { useState } from 'react'
import { marked } from 'marked'
import { User, Bot, Terminal, Wrench, Image as ImageIcon } from 'lucide-react'
import type { Message as MessageType } from '@/types/Chat'
import { cn } from '@/lib/utils'
import { imagesAPI } from '@/services/api'
import { useChatStore } from '@/store/useChatStore'

interface MessageProps {
  message: MessageType
}

export function Message({ message }: MessageProps) {
  const role = message.role
  
  const getAvatar = () => {
    switch (role) {
      case 'user':
        return <User className="w-4 h-4" />
      case 'model':
        return <Bot className="w-4 h-4" />
      case 'system':
        if ('message_type' in message) {
          if (message.message_type === 'tool_call') {
            return <Wrench className="w-4 h-4" />
          }
          if (message.message_type === 'image_candidate') {
            return <ImageIcon className="w-4 h-4" />
          }
        }
        return <Terminal className="w-4 h-4" />
      default:
        return <Terminal className="w-4 h-4" />
    }
  }

  const getContent = () => {
    // Text message (most common case)
    if ('content' in message && message.content) {
      const html = marked.parse(message.content)
      return <div dangerouslySetInnerHTML={{ __html: html }} />
    }
    
    // Rich message - handle different types
    if ('message_type' in message) {
      switch (message.message_type) {
        case 'image_candidate':
          return <ImageCandidateMessage data={message.data} />
        case 'image_request_details':
          return <ImageRequestDetails data={message.data} />
        case 'tool_call':
          // Tool call messages should show the tool name and result
          if ('data' in message && message.data) {
            return (
              <div className="space-y-1">
                <div className="font-medium">Used tool: {message.data.tool_name || 'Unknown'}</div>
                {message.data.result && <div className="text-xs opacity-70">{message.data.result}</div>}
              </div>
            )
          }
          return null
        default:
          // Unknown message type - show structured info instead of raw JSON
          return (
            <div className="text-xs opacity-70">
              <div>Message type: {message.message_type}</div>
              {message.data && <pre className="mt-1 text-xs">{JSON.stringify(message.data, null, 2)}</pre>}
            </div>
          )
      }
    }
    
    return null
  }

  const isToolMessage = role === 'system' && 'message_type' in message && message.message_type === 'tool_call'
  
  return (
    <div className={cn(
      'flex gap-4 p-4 px-6 border-b border-border/50 hover:bg-muted/30 transition-colors animate-fadeIn'
    )}>
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
        role === 'user' && 'bg-primary text-primary-foreground',
        role === 'model' && 'bg-[hsl(var(--ai-message))] text-[hsl(var(--ai-message-foreground))]',
        role === 'system' && 'bg-muted text-muted-foreground'
      )}>
        {getAvatar()}
      </div>
      <div className={cn(
        'flex-1 min-w-0 break-words leading-relaxed text-sm',
        role === 'system' && !isToolMessage && 'font-mono text-xs text-muted-foreground bg-muted/50 p-3 rounded border-l-2 border-[hsl(var(--system-border))]'
      )}>
        {getContent()}
      </div>
    </div>
  )
}

function ImageCandidateMessage({ data }: { data: any }) {
  const { image_path, index } = data
  const { setSelectedImageIndex } = useChatStore()
  const [selected, setSelected] = useState(false)
  
  const imageUrl = imagesAPI.serve(image_path)
  
  const handleClick = async () => {
    setSelected(true)
    setSelectedImageIndex(index)
    
    try {
      await imagesAPI.select({ index })
    } catch (error) {
      console.error('Error selecting image:', error)
    }
  }
  
  return (
    <div className="mt-2">
      <div
        className={cn(
          "max-w-md rounded-lg overflow-hidden border-2 transition-all cursor-pointer",
          selected ? "border-primary" : "border-transparent hover:border-primary/50"
        )}
        onClick={handleClick}
      >
        <img src={imageUrl} alt={`Candidate ${index + 1}`} className="w-full h-auto" />
      </div>
    </div>
  )
}

function ImageRequestDetails({ data }: { data: any }) {
  return (
    <div className="text-sm space-y-2">
      <div>
        <div className="font-semibold text-xs uppercase text-muted-foreground mb-1">System Instructions</div>
        <div className="font-mono text-xs bg-muted p-2 rounded">{data.system_message || 'N/A'}</div>
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>Aspect Ratio: {data.aspect_ratio}</span>
        <span>Resolution: {data.resolution}</span>
      </div>
    </div>
  )
}

