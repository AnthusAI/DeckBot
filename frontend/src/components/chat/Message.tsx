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
    // Behavior: Messages with parts field (from history) should render their text content
    // Given a message with a parts array containing text objects
    // When the component renders
    // Then it should extract and display all text content from the parts
    if ('parts' in message && message.parts && Array.isArray(message.parts)) {
      const texts = message.parts
        .map((part: any) => part.text || '')
        .filter((text: string) => text.length > 0)
        .join('\n\n')

      // Check for function calls/responses in parts
      const functionCalls = message.parts.filter((part: any) => part.function_call)
      const functionResponses = message.parts.filter((part: any) => part.function_response)

      // If we have text content, render it
      if (texts) {
        const html = marked.parse(texts)
        return (
          <div
            className="markdown-content"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )
      }

      // If we have function calls/responses but no text, show them
      if (functionCalls.length > 0 || functionResponses.length > 0) {
        return (
          <div className="space-y-2 text-sm">
            {functionCalls.map((part: any, idx: number) => (
              <div key={`call-${idx}`} className="space-y-1">
                <div className="font-medium">Tool: {part.function_call.name}</div>
                {part.function_call.args && (
                  <pre className="text-xs opacity-70 overflow-x-auto">
                    {JSON.stringify(part.function_call.args, null, 2)}
                  </pre>
                )}
              </div>
            ))}
            {functionResponses.map((part: any, idx: number) => (
              <div key={`response-${idx}`} className="space-y-1">
                <div className="font-medium">Result from: {part.function_response.name}</div>
                <div className="text-xs opacity-70">
                  {typeof part.function_response.response === 'string'
                    ? part.function_response.response
                    : JSON.stringify(part.function_response.response, null, 2)}
                </div>
              </div>
            ))}
          </div>
        )
      }
    }

    // Behavior: Messages with content field should render as markdown
    // Given a message with a content string
    // When the component renders
    // Then it should parse and display the content as markdown
    if ('content' in message && message.content) {
      const html = marked.parse(message.content)
      return (
        <div
          className="markdown-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )
    }

    // Behavior: Rich messages with message_type should render appropriately
    // Given a message with a message_type field
    // When the component renders
    // Then it should render using the appropriate handler for that type
    if ('message_type' in message) {
      switch (message.message_type) {
        case 'image_candidate':
          return <ImageCandidateMessage data={message.data} />
        case 'image_request_details':
          return <ImageRequestDetails data={message.data} />
        case 'tool_call':
          // Tool call messages should show the tool name and result
          if ('data' in message && message.data) {
            const { tool_name, status, args, result } = message.data
            return (
              <div className="space-y-1">
                <div className="font-medium">
                  {status === 'started' && '🔧 '}
                  {status === 'completed' && '✓ '}
                  Tool: {tool_name || message.data.tool || 'Unknown'}
                </div>
                {args && Object.keys(args).length > 0 && (
                  <pre className="text-xs opacity-70 overflow-x-auto">
                    {JSON.stringify(args, null, 2)}
                  </pre>
                )}
                {result && (
                  <div className="text-xs opacity-70 mt-1">
                    Result: {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                  </div>
                )}
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

    // Fallback: return null for messages with no displayable content
    // ChatHistory will filter these out
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




