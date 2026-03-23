import { useState, useEffect, useCallback } from 'react'
import type { DiffData, GitDataResponse, GitInfo } from '@shared/types'

export function useGitData() {
  const [info, setInfo] = useState<GitInfo | null>(null)
  const [diff, setDiff] = useState<DiffData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isGitRepo, setIsGitRepo] = useState(true)

  const refetch = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/git/all', { signal })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)

      const data = await res.json() as GitDataResponse

      setIsGitRepo(data.isGitRepo)
      setInfo(data.info)
      setDiff(data.diff)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }

      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void refetch(controller.signal)

    return () => controller.abort()
  }, [refetch])

  return { info, diff, loading, error, isGitRepo, refetch }
}
