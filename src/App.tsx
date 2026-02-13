import { useState, useCallback, useRef } from 'react'
import { Header } from './components/Header'
import { DiffViewer } from './components/DiffViewer'
import { AiPanel } from './components/AiPanel'
import { StatusBar } from './components/StatusBar'
import { useGitData } from './hooks/useGitData'
import { useAiAnalysis } from './hooks/useAiAnalysis'

export default function App() {
  const { info, diff, loading, error } = useGitData()
  const { analysis, isLoading: aiLoading, provider, setProvider, analyze } = useAiAnalysis()
  const [selectedFile, setSelectedFile] = useState(0)
  const [diffWidth, setDiffWidth] = useState(65)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const container = containerRef.current
    if (!container) return

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const pct = ((e.clientX - rect.left) / rect.width) * 100
      setDiffWidth(Math.max(30, Math.min(80, pct)))
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
  }, [])

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ background: '#0D1117', color: '#8B949E', fontSize: '14px' }}>
        Loading repository...
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ background: '#0D1117', color: '#F85149', fontSize: '14px' }}>
        {error}
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex flex-col" style={{ background: '#0D1117' }}>
      <Header
        repoName={info?.repoName ?? 'unknown'}
        currentBranch={info?.currentBranch ?? ''}
        baseBranch={info?.baseBranch ?? ''}
        ahead={info?.ahead ?? 0}
        behind={info?.behind ?? 0}
      />

      <div className="flex-1 flex min-h-0" ref={containerRef}>
        <div className="min-w-0" style={{ width: `${diffWidth}%` }}>
          <DiffViewer
            files={diff?.files ?? []}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
          />
        </div>
        <div
          className="w-1 shrink-0 cursor-col-resize hover:bg-[#58A6FF]/40 transition-colors"
          style={{ background: '#30363D' }}
          onMouseDown={handleDragStart}
        />
        <div className="flex-1 min-w-0">
          <AiPanel
            analysis={analysis}
            isLoading={aiLoading}
            provider={provider}
            onProviderChange={setProvider}
            onAnalyze={() => {
              if (diff?.rawDiff) {
                analyze(diff.rawDiff)
              }
            }}
          />
        </div>
      </div>

      <StatusBar
        filesChanged={diff?.summary.filesChanged ?? 0}
        totalAdditions={diff?.summary.totalAdditions ?? 0}
        totalDeletions={diff?.summary.totalDeletions ?? 0}
      />
    </div>
  )
}
