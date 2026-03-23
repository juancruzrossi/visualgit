import { useState, useCallback, useEffect, useRef } from 'react'
import type { AiProvider, AnalysisMode, ClaudeModel, LoadingPhase } from '@shared/types'

export function useAiAnalysis() {
  const [analysis, setAnalysis] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>(null)
  const [provider, setProvider] = useState<AiProvider>('claude')
  const [model, setModel] = useState<ClaudeModel>('sonnet')
  const controllerRef = useRef<AbortController | null>(null)

  const analyze = useCallback(async (content: string, mode: AnalysisMode = 'full', filePath?: string) => {
    controllerRef.current?.abort()

    const controller = new AbortController()
    controllerRef.current = controller

    setIsLoading(true)
    setLoadingPhase('connecting')
    setAnalysis('')

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ provider, mode, content, filePath, model: provider === 'claude' ? model : undefined }),
      })

      if (!res.ok) {
        throw new Error('AI analysis failed')
      }

      setLoadingPhase('analyzing')

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('No stream available')

      let receivedFirst = false
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const chunks = buffer.split('\n\n')
        buffer = chunks.pop() ?? ''

        for (const chunk of chunks) {
          const line = chunk.split('\n').find(entry => entry.startsWith('data: '))
          if (!line) continue

          const raw = line.slice(6)
          let json: { done?: boolean; error?: string; text?: string }

          try {
            json = JSON.parse(raw)
          } catch {
            continue // skip malformed SSE lines
          }

          if (json.done) {
            return
          }

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
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }

      setAnalysis(prev => prev + '\n\n[Error: AI analysis failed]')
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null
        setIsLoading(false)
        setLoadingPhase(null)
      }
    }
  }, [provider, model])

  const cancel = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
    setIsLoading(false)
    setLoadingPhase(null)
  }, [])

  useEffect(() => () => controllerRef.current?.abort(), [])

  return { analysis, isLoading, loadingPhase, provider, setProvider, model, setModel, analyze, cancel }
}
