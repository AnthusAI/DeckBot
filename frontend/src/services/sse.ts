import type { SSEEventType } from '../types/API'

export class SSEService {
  private eventSource: EventSource | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectDelay = 1000
  private listeners: Map<SSEEventType, Set<(data: any) => void>> = new Map()
  private url: string

  constructor(url: string = '/events') {
    this.url = url
  }

  connect(): void {
    if (this.eventSource?.readyState === EventSource.OPEN) {
      return
    }

    this.disconnect()

    const apiBase = import.meta.env.DEV ? '' : ''
    this.eventSource = new EventSource(`${apiBase}${this.url}`)

    this.eventSource.onopen = () => {
      console.log('[SSE] Connected')
      this.reconnectAttempts = 0
    }

    this.eventSource.onerror = (error) => {
      console.error('[SSE] Error:', error)
      this.handleReconnect()
    }

    // Handle all event types dynamically
    this.eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data)
        this.handleEvent('message', parsed)
      } catch (e) {
        console.error('[SSE] Failed to parse message:', e)
      }
    }

    // Set up listeners for specific event types
    const eventTypes: SSEEventType[] = [
      'message',
      'thinking_start',
      'thinking_end',
      'image_request_details',
      'image_progress',
      'image_candidate',
      'images_ready',
      'image_selected',
      'layout_request',
      'presentation_updated',
      'tool_call',
      'tool_result',
      'agent_request_details',
      'error',
    ]

    eventTypes.forEach((eventType) => {
      this.eventSource?.addEventListener(eventType, (event: MessageEvent) => {
        try {
          const data = event.data ? JSON.parse(event.data) : null
          this.handleEvent(eventType, data)
        } catch (e) {
          console.error(`[SSE] Failed to parse ${eventType}:`, e)
        }
      })
    })
  }

  private handleEvent(eventType: SSEEventType, data: any): void {
    const listeners = this.listeners.get(eventType)
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data)
        } catch (e) {
          console.error(`[SSE] Error in listener for ${eventType}:`, e)
        }
      })
    }

    // Also notify generic 'message' listeners for all events
    if (eventType !== 'message') {
      const messageListeners = this.listeners.get('message')
      if (messageListeners) {
        messageListeners.forEach((callback) => {
          try {
            callback({ type: eventType, data })
          } catch (e) {
            console.error(`[SSE] Error in generic message listener:`, e)
          }
        })
      }
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[SSE] Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000)

    console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)

    setTimeout(() => {
      this.connect()
    }, delay)
  }

  subscribe(eventType: SSEEventType, callback: (data: any) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    this.listeners.get(eventType)!.add(callback)

    // Auto-connect if not already connected
    if (!this.eventSource || this.eventSource.readyState === EventSource.CLOSED) {
      this.connect()
    }

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType)
      if (listeners) {
        listeners.delete(callback)
        if (listeners.size === 0) {
          this.listeners.delete(eventType)
        }
      }
    }
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
  }

  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN
  }
}

// Singleton instance
export const sseService = new SSEService()

