import { useEffect, useRef, useState, useCallback } from 'react'

export function useResizable(
  initialSize: number,
  minSize: number = 200,
  maxSize: number = 1200,
  direction: 'horizontal' | 'vertical' = 'horizontal'
) {
  const [size, setSize] = useState(initialSize)
  const isResizingRef = useRef(false)
  const startPosRef = useRef(0)
  const startSizeRef = useRef(initialSize)

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizingRef.current) return
    e.preventDefault()

    const delta = direction === 'horizontal' ? e.clientX - startPosRef.current : e.clientY - startPosRef.current
    const newSize = Math.max(minSize, Math.min(maxSize, startSizeRef.current - delta))
    setSize(newSize)
  }, [minSize, maxSize, direction])

  const handleMouseUp = useCallback(() => {
    if (isResizingRef.current) {
      isResizingRef.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.body.style.pointerEvents = ''
    }
  }, [])

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove, { passive: false })
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isResizingRef.current = true
    startPosRef.current = direction === 'horizontal' ? e.clientX : e.clientY
    startSizeRef.current = size
    document.body.style.cursor = direction === 'horizontal' ? 'ew-resize' : 'ns-resize'
    document.body.style.userSelect = 'none'
    document.body.style.pointerEvents = 'none'
  }, [size, direction])

  return { size, startResize }
}

