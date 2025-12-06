import { useEffect, useRef } from 'react'
import { sseService } from '../services/sse'
import type { SSEEventType } from '../types/API'

export function useEventSource(
  eventType: SSEEventType,
  callback: (data: any) => void,
  deps: any[] = []
) {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    const unsubscribe = sseService.subscribe(eventType, (data) => {
      callbackRef.current(data)
    })

    return unsubscribe
  }, [eventType, ...deps])
}

export function useSSEConnection() {
  useEffect(() => {
    sseService.connect()
    return () => {
      sseService.disconnect()
    }
  }, [])
}

