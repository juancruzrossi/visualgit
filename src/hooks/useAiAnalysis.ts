import { useState, useCallback } from 'react'

type Provider = 'claude' | 'openai'

export function useAiAnalysis() {
  const [analysis, setAnalysis] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [provider, setProvider] = useState<Provider>('claude')

  const analyze = useCallback(async (diff: string) => {
    setIsLoading(true)
    setAnalysis('')

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, diff }),
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('No stream available')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          try {
            const json = JSON.parse(line.slice(6))
            if (json.done) break
            if (json.error) throw new Error(json.error)
            if (json.text) {
              setAnalysis(prev => prev + json.text)
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } catch {
      setAnalysis(prev => prev + '\n\n[Error: AI analysis failed]')
    } finally {
      setIsLoading(false)
    }
  }, [provider])

  return { analysis, isLoading, provider, setProvider, analyze }
}
