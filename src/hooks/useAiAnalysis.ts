import { useState, useCallback, useRef } from 'react'
import type { AiProvider, ClaudeModel, AnalysisMode, LoadingPhase } from '../../shared/types'

export function useAiAnalysis() {
  const [analysis, setAnalysis] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>(null)
  const [provider, setProvider] = useState<AiProvider>('claude')
  const [model, setModel] = useState<ClaudeModel>('sonnet')
  const [lastMode, setLastMode] = useState<AnalysisMode | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const cancelAnalysis = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  const analyze = useCallback(async (content: string, mode: AnalysisMode = 'full', filePath?: string) => {
    cancelAnalysis()

    const controller = new AbortController()
    abortRef.current = controller

    setIsLoading(true)
    setLoadingPhase('connecting')
    setAnalysis('')
    setLastMode(mode)

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, mode, content, filePath, model: provider === 'claude' ? model : undefined }),
        signal: controller.signal,
      })

      setLoadingPhase('analyzing')

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('No stream available')

      let receivedFirst = false
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          const raw = line.slice(6)
          let json: { done?: boolean; error?: string; text?: string }
          try {
            json = JSON.parse(raw)
          } catch {
            continue // skip malformed SSE lines
          }
          if (json.done) break
          if (json.error) throw new Error(json.error)
          if (json.text) {
            if (!receivedFirst) {
              receivedFirst = true
              setLoadingPhase('streaming')
            }
            setAnalysis(prev => prev + json.text)
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setAnalysis(prev => prev + '\n\n[Error: AI analysis failed]')
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
        setLoadingPhase(null)
      }
    }
  }, [provider, model, cancelAnalysis])

  return { analysis, isLoading, loadingPhase, provider, setProvider, model, setModel, analyze, cancelAnalysis, lastMode }
}
