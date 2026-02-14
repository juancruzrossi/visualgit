import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Loader2, FileText, ScanSearch, Layers, PanelRightClose } from 'lucide-react'

type LoadingPhase = null | 'connecting' | 'analyzing' | 'streaming'

interface AiPanelProps {
  analysis: string
  isLoading: boolean
  loadingPhase: LoadingPhase
  provider: 'claude' | 'openai'
  onProviderChange: (provider: 'claude' | 'openai') => void
  onAnalyzeFull: () => void
  onAnalyzeFile: () => void
  hasSelection: boolean
  onAnalyzeSelection: () => void
  currentFileName?: string
  onClose: () => void
}

const providers = [
  { value: 'claude' as const, label: 'Claude' },
  { value: 'openai' as const, label: 'OpenAI' },
]

const phaseMessages: Record<string, string> = {
  connecting: 'Connecting to AI provider...',
  analyzing: 'Analyzing changes...',
  streaming: '',
}

export function AiPanel({
  analysis, isLoading, loadingPhase, provider, onProviderChange,
  onAnalyzeFull, onAnalyzeFile, hasSelection, onAnalyzeSelection, currentFileName, onClose,
}: AiPanelProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  const btnStyle = {
    border: '1px solid #30363D',
    background: 'transparent',
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#0D1117' }}>
      <div className="flex items-center justify-between px-3 h-10 shrink-0" style={{ background: '#161B22', borderBottom: '1px solid #30363D' }}>
        <div className="flex items-center gap-2">
          <button className="cursor-pointer" style={{ background: 'transparent', border: 'none' }} onClick={onClose}>
            <PanelRightClose size={14} color="#8B949E" />
          </button>
          <span style={{ color: '#8B949E', fontSize: '12px' }}>AI Analysis</span>
        </div>
        <div className="relative" ref={dropdownRef}>
          <button
            className="flex items-center gap-1.5 px-2.5 py-1 cursor-pointer"
            style={{ border: '1px solid #30363D', background: 'transparent', borderRadius: '4px' }}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span style={{ color: '#E6EDF3', fontSize: '11px' }}>
              {providers.find(p => p.value === provider)?.label}
            </span>
            <ChevronDown size={10} color="#8B949E" />
          </button>
          {dropdownOpen && (
            <div
              className="absolute right-0 top-full mt-1 py-1 z-10 min-w-[120px]"
              style={{ background: '#161B22', border: '1px solid #30363D' }}
            >
              {providers.map(p => (
                <button
                  key={p.value}
                  className="w-full text-left px-3 py-1.5 cursor-pointer"
                  style={{
                    background: p.value === provider ? '#1C2128' : 'transparent',
                    border: 'none',
                    color: p.value === provider ? '#58A6FF' : '#E6EDF3',
                    fontSize: '12px',
                  }}
                  onClick={() => {
                    onProviderChange(p.value)
                    setDropdownOpen(false)
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4" style={{ fontSize: '12px', lineHeight: '1.6' }}>
        {analysis ? (
          <div className="whitespace-pre-wrap" style={{ color: '#E6EDF3' }}>
            {analysis}
            {isLoading && (
              <span
                className="inline-block w-[2px] h-[14px] ml-0.5 cursor-blink align-middle"
                style={{ background: '#58A6FF' }}
              />
            )}
          </div>
        ) : isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 size={14} color="#58A6FF" className="animate-spin" />
            <span style={{ color: '#8B949E' }}>
              {loadingPhase ? phaseMessages[loadingPhase] || 'Analyzing...' : 'Analyzing...'}
            </span>
          </div>
        ) : (
          <span style={{ color: '#8B949E' }}>
            Choose an analysis mode below.
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 shrink-0 p-4 pt-0">
        <button
          className={`flex items-center justify-center gap-1.5 py-2 px-3 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          style={btnStyle}
          onClick={onAnalyzeFull}
          disabled={isLoading}
        >
          <Layers size={14} color="#58A6FF" />
          <span style={{ color: '#58A6FF', fontSize: '12px' }}>Analyze All Files</span>
        </button>
        <button
          className={`flex items-center justify-center gap-1.5 py-2 px-3 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          style={btnStyle}
          onClick={onAnalyzeFile}
          disabled={isLoading}
        >
          <FileText size={14} color="#58A6FF" />
          <span style={{ color: '#58A6FF', fontSize: '12px' }}>
            Analyze {currentFileName ? currentFileName.split('/').pop() : 'Current File'}
          </span>
        </button>
        {hasSelection && (
          <button
            className={`flex items-center justify-center gap-1.5 py-2 px-3 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            style={{ border: '1px solid #58A6FF', background: 'rgba(88,166,255,0.1)' }}
            onClick={onAnalyzeSelection}
            disabled={isLoading}
          >
            <ScanSearch size={14} color="#58A6FF" />
            <span style={{ color: '#58A6FF', fontSize: '12px' }}>Analyze Selection</span>
          </button>
        )}
      </div>
    </div>
  )
}
