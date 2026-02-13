import { useState } from 'react'
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

      <div className="flex-1 flex min-h-0">
        <div className="flex-[65] min-w-0" style={{ borderRight: '1px solid #30363D' }}>
          <DiffViewer
            files={diff?.files ?? []}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
          />
        </div>
        <div className="flex-[35] min-w-0">
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
