import { useState, useEffect } from 'react'

interface GitInfo {
  repoName: string
  currentBranch: string
  baseBranch: string
  ahead: number
  behind: number
}

interface DiffLine {
  type: 'context' | 'addition' | 'deletion'
  lineNumber: number
  content: string
}

interface DiffFile {
  path: string
  additions: number
  deletions: number
  lines: DiffLine[]
}

interface DiffData {
  files: DiffFile[]
  summary: {
    filesChanged: number
    totalAdditions: number
    totalDeletions: number
  }
}

export function useGitData() {
  const [info, setInfo] = useState<GitInfo | null>(null)
  const [diff, setDiff] = useState<DiffData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
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

  return { info, diff, loading, error }
}
