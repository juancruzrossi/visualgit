import ReactMarkdown from 'react-markdown'
import { FileText, Layers, Loader2, PanelRightClose, ScanSearch, Square } from 'lucide-react'
import type { AiProvider, ClaudeModel, LoadingPhase } from '@shared/types'
import { Dropdown } from './Dropdown'
import { tokens } from '../lib/tokens'

interface AiPanelProps {
  analysis: string
  isLoading: boolean
  loadingPhase: LoadingPhase
  provider: AiProvider
  onProviderChange: (provider: AiProvider) => void
  model: ClaudeModel
  onModelChange: (model: ClaudeModel) => void
  onAnalyzeFull: () => void
  onAnalyzeFile: () => void
  hasSelection: boolean
  onAnalyzeSelection: () => void
  currentFileName?: string
  onClose: () => void
  onCancel: () => void
}

const providers = [
  { value: 'claude' as const, label: 'Claude' },
  { value: 'codex' as const, label: 'Codex' },
]

const claudeModels: Array<{ value: ClaudeModel; label: string }> = [
  { value: 'opus', label: 'Opus' },
  { value: 'sonnet', label: 'Sonnet' },
  { value: 'haiku', label: 'Haiku' },
]

const phaseMessages: Record<NonNullable<LoadingPhase>, string> = {
  connecting: 'Connecting to AI provider...',
  analyzing: 'Analyzing changes...',
  streaming: '',
}

const buttonStyle = {
  border: `1px solid ${tokens.border.default}`,
  background: 'transparent',
} as const

export function AiPanel({
  analysis,
  isLoading,
  loadingPhase,
  provider,
  onProviderChange,
  model,
  onModelChange,
  onAnalyzeFull,
  onAnalyzeFile,
  hasSelection,
  onAnalyzeSelection,
  currentFileName,
  onClose,
  onCancel,
}: AiPanelProps) {
  return (
    <div className="flex flex-col h-full" style={{ background: tokens.background.primary }}>
      <div
        className="flex items-center justify-between px-3 h-10 shrink-0"
        style={{ background: tokens.background.secondary, borderBottom: `1px solid ${tokens.border.default}` }}
      >
        <div className="flex items-center gap-2">
          <button className="cursor-pointer" style={{ background: 'transparent', border: 'none' }} onClick={onClose}>
            <PanelRightClose size={14} color={tokens.text.muted} />
          </button>
          <span style={{ color: tokens.text.muted, fontSize: '12px' }}>AI Analysis</span>
        </div>

        <div className="flex items-center gap-2">
          <Dropdown
            value={provider}
            options={providers}
            onChange={onProviderChange}
            ariaLabel="Select AI provider"
          />
          {provider === 'claude' && (
            <Dropdown
              value={model}
              options={claudeModels}
              onChange={onModelChange}
              ariaLabel="Select Claude model"
            />
          )}
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto p-4"
        style={{ fontSize: '12px', lineHeight: '1.6' }}
        aria-label="AI analysis output"
      >
        {analysis ? (
          <div className="ai-markdown" style={{ color: tokens.text.primary }}>
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 style={{ color: tokens.accent.primary, fontSize: '16px', fontWeight: 600, margin: '12px 0 6px' }}>{children}</h1>,
                h2: ({ children }) => <h2 style={{ color: tokens.accent.primary, fontSize: '14px', fontWeight: 600, margin: '10px 0 4px' }}>{children}</h2>,
                h3: ({ children }) => <h3 style={{ color: tokens.text.accent, fontSize: '13px', fontWeight: 600, margin: '8px 0 4px' }}>{children}</h3>,
                p: ({ children }) => <p style={{ margin: '4px 0' }}>{children}</p>,
                ul: ({ children }) => <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>{children}</ul>,
                ol: ({ children }) => <ol style={{ margin: '4px 0', paddingLeft: '20px' }}>{children}</ol>,
                li: ({ children }) => <li style={{ margin: '2px 0' }}>{children}</li>,
                strong: ({ children }) => <strong style={{ color: tokens.text.strong, fontWeight: 600 }}>{children}</strong>,
                em: ({ children }) => <em style={{ color: tokens.text.emphasis }}>{children}</em>,
                code: ({ children, className }) => {
                  const isBlock = className?.includes('language-')

                  if (isBlock) {
                    return (
                      <pre
                        style={{
                          background: tokens.background.secondary,
                          border: `1px solid ${tokens.border.default}`,
                          borderRadius: '4px',
                          padding: '8px',
                          margin: '6px 0',
                          overflowX: 'auto',
                        }}
                      >
                        <code style={{ color: tokens.text.primary, fontSize: '11px', fontFamily: 'monospace' }}>{children}</code>
                      </pre>
                    )
                  }

                  return (
                    <code
                      style={{
                        background: tokens.background.tertiary,
                        color: tokens.text.accent,
                        padding: '1px 4px',
                        borderRadius: '3px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                      }}
                    >
                      {children}
                    </code>
                  )
                },
                pre: ({ children }) => <>{children}</>,
                hr: () => <hr style={{ border: 'none', borderTop: `1px solid ${tokens.border.default}`, margin: '8px 0' }} />,
              }}
            >
              {analysis}
            </ReactMarkdown>
            {isLoading && (
              <span
                className="inline-block w-[2px] h-[14px] ml-0.5 cursor-blink align-middle"
                style={{ background: tokens.accent.primary }}
              />
            )}
          </div>
        ) : isLoading ? (
          <div className="flex items-center gap-2" role="status" aria-live="polite">
            <Loader2 size={14} color={tokens.accent.primary} className="animate-spin" />
            <span style={{ color: tokens.text.muted }}>
              {loadingPhase ? phaseMessages[loadingPhase] || 'Analyzing...' : 'Analyzing...'}
            </span>
          </div>
        ) : (
          <span style={{ color: tokens.text.muted }}>
            Choose an analysis mode below.
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 shrink-0 p-4 pt-0">
        <button
          className={`flex items-center justify-center gap-1.5 py-2 px-3 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          style={buttonStyle}
          onClick={onAnalyzeFull}
          disabled={isLoading}
        >
          <Layers size={14} color={tokens.accent.primary} />
          <span style={{ color: tokens.accent.primary, fontSize: '12px' }}>Analyze All Files</span>
        </button>

        <button
          className={`flex items-center justify-center gap-1.5 py-2 px-3 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          style={buttonStyle}
          onClick={onAnalyzeFile}
          disabled={isLoading}
        >
          <FileText size={14} color={tokens.accent.primary} />
          <span style={{ color: tokens.accent.primary, fontSize: '12px' }}>
            Analyze {currentFileName ? currentFileName.split('/').pop() : 'Current File'}
          </span>
        </button>

        {hasSelection && (
          <button
            className={`flex items-center justify-center gap-1.5 py-2 px-3 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            style={{ border: `1px solid ${tokens.accent.primary}`, background: tokens.accent.overlay }}
            onClick={onAnalyzeSelection}
            disabled={isLoading}
          >
            <ScanSearch size={14} color={tokens.accent.primary} />
            <span style={{ color: tokens.accent.primary, fontSize: '12px' }}>Analyze Selection</span>
          </button>
        )}

        {isLoading && (
          <button
            className="flex items-center justify-center gap-1.5 py-2 px-3 cursor-pointer"
            style={buttonStyle}
            onClick={onCancel}
          >
            <Square size={12} color={tokens.text.primary} />
            <span style={{ color: tokens.text.primary, fontSize: '12px' }}>Cancel Analysis</span>
          </button>
        )}
      </div>
    </div>
  )
}
