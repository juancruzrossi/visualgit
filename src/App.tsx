import { useState, useCallback, useRef } from 'react'
import { PanelRight, GitBranch, AlertTriangle } from 'lucide-react'
import { Header } from './components/Header'
import { DiffViewer } from './components/DiffViewer'
import { AiPanel } from './components/AiPanel'
import { StatusBar } from './components/StatusBar'
import { useGitData } from './hooks/useGitData'
import { useAiAnalysis } from './hooks/useAiAnalysis'
import { useResizable } from './hooks/useResizable'

export default function App() {
  const { info, diff, loading, error, isGitRepo } = useGitData()
  const { analysis, isLoading: aiLoading, loadingPhase, provider, setProvider, model, setModel, analyze } = useAiAnalysis()
  const [selectedFile, setSelectedFile] = useState(0)
  const [aiPanelOpen, setAiPanelOpen] = useState(true)
  const [selectedText, setSelectedText] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentFile = diff?.files?.[selectedFile]

  const { value: diffWidth, onDragStart: handleDragStart } = useResizable({
    containerRef,
    initial: 65,
    min: 30,
    max: 80,
    unit: 'percent',
  })

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ background: 'var(--vg-bg)', color: 'var(--vg-text-muted)', fontSize: '14px' }}>
        Loading repository...
      </div>
    )
  }

  if (!isGitRepo) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-6" style={{ background: 'var(--vg-bg)' }}>
        <div className="flex items-center gap-3">
          <AlertTriangle size={32} color="var(--vg-red)" />
          <GitBranch size={32} color="var(--vg-red)" />
        </div>
        <h1 style={{ color: 'var(--vg-text)', fontSize: '24px', fontWeight: 600, margin: 0 }}>
          Not a Git Repository
        </h1>
        <p style={{ color: 'var(--vg-text-muted)', fontSize: '14px', maxWidth: '400px', textAlign: 'center', lineHeight: '1.6', margin: 0 }}>
          VisualGit needs to run inside a git repository.
          Navigate to a project with <code style={{ color: 'var(--vg-accent)', background: 'var(--vg-bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>git init</code> and try again.
        </p>
        <div style={{ color: 'var(--vg-text-dim)', fontSize: '12px', marginTop: '8px' }}>
          Run <code style={{ color: 'var(--vg-text-muted)', background: 'var(--vg-bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>cd your-project && visualgit</code>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ background: 'var(--vg-bg)', color: 'var(--vg-red)', fontSize: '14px' }}>
        {error}
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex flex-col" style={{ background: 'var(--vg-bg)' }}>
      <Header
        repoName={info?.repoName ?? 'unknown'}
        currentBranch={info?.currentBranch ?? ''}
        baseBranch={info?.baseBranch ?? ''}
      />

      <div className="flex-1 flex min-h-0" ref={containerRef}>
        <div className="min-w-0" style={{ width: aiPanelOpen ? `${diffWidth}%` : '100%' }}>
          <DiffViewer
            files={diff?.files ?? []}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
            onSelectionChange={setSelectedText}
            onAnalyzeSelection={() => {
              if (selectedText) {
                analyze(selectedText, 'selection', currentFile?.path)
              }
            }}
          />
        </div>
        {aiPanelOpen && (
          <>
            <div
              className="w-1 shrink-0 cursor-col-resize hover:bg-[#58A6FF]/40 transition-colors"
              style={{ background: 'var(--vg-border)' }}
              onMouseDown={handleDragStart}
            />
            <div className="flex-1 min-w-0">
              <AiPanel
                analysis={analysis}
                isLoading={aiLoading}
                loadingPhase={loadingPhase}
                provider={provider}
                onProviderChange={setProvider}
                model={model}
                onModelChange={setModel}
                onAnalyzeFull={() => {
                  if (diff?.rawDiff) analyze(diff.rawDiff, 'full')
                }}
                onAnalyzeFile={() => {
                  if (currentFile) {
                    const fileContent = currentFile.lines.map(l => l.content).join('\n')
                    analyze(fileContent, 'file', currentFile.path)
                  }
                }}
                hasSelection={!!selectedText}
                onAnalyzeSelection={() => {
                  if (selectedText) {
                    analyze(selectedText, 'selection', currentFile?.path)
                  }
                }}
                currentFileName={currentFile?.path}
                onClose={() => setAiPanelOpen(false)}
              />
            </div>
          </>
        )}
        {!aiPanelOpen && (
          <button
            className="h-full w-10 shrink-0 flex items-center justify-center cursor-pointer"
            style={{ background: 'var(--vg-bg-secondary)', border: 'none', borderLeft: '1px solid var(--vg-border)' }}
            onClick={() => setAiPanelOpen(true)}
          >
            <PanelRight size={14} color="var(--vg-text-muted)" />
          </button>
        )}
      </div>

      <StatusBar
        filesChanged={diff?.summary.filesChanged ?? 0}
        totalAdditions={diff?.summary.totalAdditions ?? 0}
        totalDeletions={diff?.summary.totalDeletions ?? 0}
      />
    </div>
  )
}
