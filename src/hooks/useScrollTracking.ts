import { useCallback, useEffect, useRef, type RefObject } from 'react'

interface UseScrollTrackingOptions {
  scrollRef: RefObject<HTMLDivElement | null>
  fileRefs: RefObject<Array<HTMLDivElement | null>>
  selectedFile: number
  onSelectFile: (index: number) => void
  syncKey?: string
}

export function useScrollTracking({
  scrollRef,
  fileRefs,
  selectedFile,
  onSelectFile,
  syncKey,
}: UseScrollTrackingOptions) {
  const isProgrammaticScroll = useRef(false)
  const timeoutRef = useRef<number | null>(null)

  const syncVisibleFile = useCallback(() => {
    if (isProgrammaticScroll.current || !scrollRef.current) return

    const container = scrollRef.current
    const scrollTop = container.scrollTop

    for (let index = fileRefs.current.length - 1; index >= 0; index -= 1) {
      const element = fileRefs.current[index]
      if (element && element.offsetTop <= scrollTop + 60) {
        if (index !== selectedFile) {
          onSelectFile(index)
        }
        break
      }
    }
  }, [fileRefs, onSelectFile, scrollRef, selectedFile])

  const scrollToFile = useCallback((index: number) => {
    onSelectFile(index)

    const element = fileRefs.current[index]
    if (!element) return

    isProgrammaticScroll.current = true
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = window.setTimeout(() => {
      isProgrammaticScroll.current = false
    }, 500)
  }, [fileRefs, onSelectFile])

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    element.addEventListener('scroll', syncVisibleFile, { passive: true })
    return () => element.removeEventListener('scroll', syncVisibleFile)
  }, [scrollRef, syncVisibleFile])

  useEffect(() => {
    syncVisibleFile()
  }, [syncKey, syncVisibleFile])

  useEffect(() => () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
    }
  }, [])

  return { scrollToFile }
}
