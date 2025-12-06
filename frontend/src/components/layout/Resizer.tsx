import { useEffect } from 'react'
import { useResizable } from '../../hooks/useResizable'

interface ResizerProps {
  onResize: (size: number) => void
  initialSize?: number
  minSize?: number
  maxSize?: number
}

export function Resizer({ onResize, initialSize = 600, minSize = 300, maxSize = 1200 }: ResizerProps) {
  const { size, startResize } = useResizable(initialSize, minSize, maxSize, 'horizontal')

  useEffect(() => {
    onResize(size)
  }, [size, onResize])

  return (
    <div
      className="w-2 bg-transparent cursor-ew-resize relative flex items-center justify-center flex-shrink-0 select-none"
      onMouseDown={startResize}
    >
      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-border transition-all hover:w-[3px] hover:bg-primary" />
    </div>
  )
}

