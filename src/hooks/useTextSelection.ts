import { useCallback, useEffect, useState, type RefObject } from 'react'

interface SelectionPosition {
  x: number
  y: number
}

export function useTextSelection(containerRef: RefObject<HTMLElement | null>) {
  const [selectedText, setSelectedText] = useState<string | null>(null)
  const [selectionPosition, setSelectionPosition] = useState<SelectionPosition | null>(null)

  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection()
      const container = containerRef.current
      const text = selection?.toString().trim() ?? ''

      if (!selection || !container || !text || text.length <= 3 || selection.rangeCount === 0) {
        setSelectedText(null)
        setSelectionPosition(null)
        return
      }

      if (!container.contains(selection.anchorNode) || !container.contains(selection.focusNode)) {
        setSelectedText(null)
        setSelectionPosition(null)
        return
      }

      const rect = selection.getRangeAt(0).getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()

      setSelectedText(text)
      setSelectionPosition({
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top - 8,
      })
    }

    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [containerRef])

  const clearSelection = useCallback(() => {
    setSelectedText(null)
    setSelectionPosition(null)
    window.getSelection()?.removeAllRanges()
  }, [])

  return { selectedText, selectionPosition, clearSelection }
}
