import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type RefObject } from 'react'

interface UseResizablePanelOptions<T extends HTMLElement> {
  containerRef: RefObject<T | null>
  initialSize: number
  minSize: number
  maxSize: number
  getNextSize: (event: MouseEvent, rect: DOMRect) => number
}

export function useResizablePanel<T extends HTMLElement>({
  containerRef,
  initialSize,
  minSize,
  maxSize,
  getNextSize,
}: UseResizablePanelOptions<T>) {
  const [size, setSize] = useState(initialSize)
  const cleanupRef = useRef<(() => void) | null>(null)

  const clamp = useCallback(
    (value: number) => Math.max(minSize, Math.min(maxSize, value)),
    [maxSize, minSize],
  )

  const stopResizing = useCallback(() => {
    cleanupRef.current?.()
    cleanupRef.current = null
  }, [])

  const startResizing = useCallback((event: ReactMouseEvent) => {
    event.preventDefault()

    const container = containerRef.current
    if (!container) return

    const onMouseMove = (nextEvent: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      setSize(clamp(getNextSize(nextEvent, rect)))
    }

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      cleanupRef.current = null
    }

    cleanupRef.current = onMouseUp
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [clamp, containerRef, getNextSize])

  const nudgeSize = useCallback((delta: number) => {
    setSize(prev => clamp(prev + delta))
  }, [clamp])

  useEffect(() => stopResizing, [stopResizing])

  return { size, setSize, startResizing, nudgeSize }
}
