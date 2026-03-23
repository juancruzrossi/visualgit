import { useCallback, useRef, useState } from 'react'
import { AlertTriangle, GitBranch, PanelRight } from 'lucide-react'
import { AiPanel } from './components/AiPanel'
import { DiffViewer } from './components/DiffViewer'
import { Header } from './components/Header'
import { StatusBar } from './components/StatusBar'
import { useAiAnalysis } from './hooks/useAiAnalysis'
import { useGitData } from './hooks/useGitData'
import { useResizablePanel } from './hooks/useResizablePanel'
import { fontSizes, tokens } from './lib/tokens'

export default function App() {
  const { info, diff, loading, error, isGitRepo, refetch } = useGitData()
  const {
    analysis,
    isLoading: aiLoading,
    loadingPhase,
    provider,
    setProvider,
    model,
    setModel,
    analyze,
    cancel,
  } = useAiAnalysis()
  const [selectedFile, setSelectedFile] = useState(0)
  const [aiPanelOpen, setAiPanelOpen] = useState(true)
  const [selectedText, setSelectedText] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { size: diffWidth, startResizing, nudgeSize } = useResizablePanel({
    containerRef,
    initialSize: 65,
    minSize: 30,
    maxSize: 80,
    getNextSize: useCallback((event, rect) => ((event.clientX - rect.left) / rect.width) * 100, []),
  })

  const currentFile = diff?.files?.[selectedFile]

  if (loading) {
    return (
      <div
        className="h-screen w-screen flex items-center justify-center"
        style={{ background: tokens.background.primary, color: tokens.text.muted, fontSize: fontSizes.body }}
        role="status"
        aria-live="polite"
      >
        Loading repository...
      </div>
    )
  }

  if (!isGitRepo) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-6" style={{ background: tokens.background.primary }}>
        <div className="flex items-center gap-3">
          <AlertTriangle size={32} color={tokens.danger.strong} />
          <GitBranch size={32} color={tokens.danger.strong} />
        </div>
        <h1 style={{ color: tokens.text.primary, fontSize: '24px', fontWeight: 600, margin: 0 }}>
          Not a Git Repository
        </h1>
        <p style={{ color: tokens.text.muted, fontSize: fontSizes.body, maxWidth: '400px', textAlign: 'center', lineHeight: '1.6', margin: 0 }}>
          VisualGit needs to run inside a git repository.
          {' '}
          Navigate to a project with
          {' '}
          <code style={{ color: tokens.accent.primary, background: tokens.background.secondary, padding: '2px 6px', borderRadius: '4px' }}>git init</code>
          {' '}
          and try again.
        </p>
        <div style={{ color: tokens.border.muted, fontSize: fontSizes.code, marginTop: '8px' }}>
          Run
          {' '}
          <code style={{ color: tokens.text.muted, background: tokens.background.secondary, padding: '2px 6px', borderRadius: '4px' }}>cd your-project && visualgit</code>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ background: tokens.background.primary }}>
        <div
          className="flex flex-col items-center gap-3"
          style={{ color: tokens.danger.strong, fontSize: fontSizes.body }}
          role="alert"
          aria-live="assertive"
        >
          <span>{error}</span>
          <button
            className="cursor-pointer px-3 py-1.5"
            style={{
              border: `1px solid ${tokens.border.default}`,
              borderRadius: '6px',
              background: tokens.background.secondary,
              color: tokens.text.primary,
            }}
            onClick={() => void refetch()}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex flex-col" style={{ background: tokens.background.primary }}>
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
              className="w-1 shrink-0 cursor-col-resize hover:opacity-80 transition-opacity"
              style={{ background: tokens.border.default }}
              onMouseDown={startResizing}
              onKeyDown={event => {
                if (event.key === 'ArrowLeft') nudgeSize(-2)
                if (event.key === 'ArrowRight') nudgeSize(2)
              }}
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize AI panel"
              tabIndex={0}
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
                    const fileContent = currentFile.lines.map(line => line.content).join('\n')
                    analyze(fileContent, 'file', currentFile.path)
                  }
                }}
                hasSelection={Boolean(selectedText)}
                onAnalyzeSelection={() => {
                  if (selectedText) {
                    analyze(selectedText, 'selection', currentFile?.path)
                  }
                }}
                currentFileName={currentFile?.path}
                onClose={() => setAiPanelOpen(false)}
                onCancel={cancel}
              />
            </div>
          </>
        )}

        {!aiPanelOpen && (
          <button
            className="h-full w-10 shrink-0 flex items-center justify-center cursor-pointer"
            style={{
              background: tokens.background.secondary,
              border: 'none',
              borderLeft: `1px solid ${tokens.border.default}`,
            }}
            onClick={() => setAiPanelOpen(true)}
          >
            <PanelRight size={14} color={tokens.text.muted} />
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
