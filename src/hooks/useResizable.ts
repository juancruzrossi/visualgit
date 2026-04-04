import { useState, useCallback, type RefObject } from 'react'

interface UseResizableOptions {
  containerRef: RefObject<HTMLElement | null>
  initial: number
  min: number
  max: number
  unit: 'percent' | 'pixel'
}

export function useResizable({ containerRef, initial, min, max, unit }: UseResizableOptions) {
  const [value, setValue] = useState(initial)

  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const container = containerRef.current
    if (!container) return

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const raw = unit === 'percent'
        ? ((e.clientX - rect.left) / rect.width) * 100
        : e.clientX - rect.left
      setValue(Math.max(min, Math.min(max, raw)))
    }
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [containerRef, min, max, unit])

  return { value, onDragStart }
}
