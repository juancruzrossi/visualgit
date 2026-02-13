import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Sparkles, FileText, ScanSearch, Layers } from 'lucide-react'

interface AiPanelProps {
  analysis: string
  isLoading: boolean
  provider: 'claude' | 'openai'
  onProviderChange: (provider: 'claude' | 'openai') => void
  onAnalyzeFull: () => void
  onAnalyzeFile: () => void
  hasSelection: boolean
  onAnalyzeSelection: () => void
  currentFileName?: string
}

const providers = [
  { value: 'claude' as const, label: 'Claude' },
  { value: 'openai' as const, label: 'OpenAI' },
]

export function AiPanel({
  analysis, isLoading, provider, onProviderChange,
  onAnalyzeFull, onAnalyzeFile, hasSelection, onAnalyzeSelection, currentFileName,
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
    <div className="flex flex-col h-full p-5 gap-4" style={{ background: '#0D1117' }}>
      <div className="flex items-center justify-between shrink-0">
        <span style={{ color: '#E6EDF3', fontSize: '13px' }}>AI Analysis</span>
        <div className="relative" ref={dropdownRef}>
          <button
            className="flex items-center gap-1.5 px-2.5 py-1.5 cursor-pointer"
            style={btnStyle}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span style={{ color: '#E6EDF3', fontSize: '12px' }}>
              {providers.find(p => p.value === provider)?.label}
            </span>
            <ChevronDown size={12} color="#8B949E" />
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

      <div className="w-full h-px shrink-0" style={{ background: '#30363D' }} />

      <div className="flex-1 overflow-y-auto" style={{ fontSize: '12px', lineHeight: '1.6' }}>
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
          <div className="flex items-center gap-1">
            <span style={{ color: '#8B949E' }}>Analyzing...</span>
            <span
              className="inline-block w-[2px] h-[14px] cursor-blink"
              style={{ background: '#58A6FF' }}
            />
          </div>
        ) : (
          <span style={{ color: '#8B949E' }}>
            Choose an analysis mode below. Conversations persist within this session.
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 shrink-0">
        <button
          className="flex items-center justify-center gap-1.5 py-2 px-3 cursor-pointer"
          style={btnStyle}
          onClick={onAnalyzeFull}
          disabled={isLoading}
        >
          <Layers size={14} color="#58A6FF" />
          <span style={{ color: '#58A6FF', fontSize: '12px' }}>Analyze All Files</span>
        </button>
        <button
          className="flex items-center justify-center gap-1.5 py-2 px-3 cursor-pointer"
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
            className="flex items-center justify-center gap-1.5 py-2 px-3 cursor-pointer"
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
