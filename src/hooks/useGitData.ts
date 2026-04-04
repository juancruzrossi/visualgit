import { useState, useEffect } from 'react'
import type { GitInfo, DiffData } from '../../shared/types'

export function useGitData() {
  const [info, setInfo] = useState<GitInfo | null>(null)
  const [diff, setDiff] = useState<DiffData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isGitRepo, setIsGitRepo] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const statusRes = await fetch('/api/git/status')
        const status = await statusRes.json()

        if (!status.isGitRepo) {
          setIsGitRepo(false)
          return
        }

        const [infoRes, diffRes] = await Promise.all([
          fetch('/api/git/info'),
          fetch('/api/git/diff'),
        ])

        if (!infoRes.ok || !diffRes.ok) throw new Error('Failed to fetch git data')

        setInfo(await infoRes.json())
        setDiff(await diffRes.json())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { info, diff, loading, error, isGitRepo }
}
