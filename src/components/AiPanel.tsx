import { ChevronDown, RefreshCw } from 'lucide-react'

interface AiPanelProps {
  analysis: string
  isLoading: boolean
  provider: 'claude' | 'openai'
  onProviderChange: (provider: 'claude' | 'openai') => void
  onReanalyze: () => void
}

export function AiPanel({ analysis, isLoading, provider, onProviderChange, onReanalyze }: AiPanelProps) {
  return (
    <div className="flex flex-col h-full p-5 gap-4" style={{ background: '#0D1117' }}>
      <div className="flex items-center justify-between shrink-0">
        <span style={{ color: '#E6EDF3', fontSize: '13px' }}>AI Analysis</span>
        <button
          className="flex items-center gap-1.5 px-2.5 py-1.5 cursor-pointer"
          style={{ border: '1px solid #30363D', background: 'transparent' }}
          onClick={() => onProviderChange(provider === 'claude' ? 'openai' : 'claude')}
        >
          <span style={{ color: '#E6EDF3', fontSize: '12px' }}>
            {provider === 'claude' ? 'Claude' : 'OpenAI'}
          </span>
          <ChevronDown size={12} color="#8B949E" />
        </button>
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
            <span style={{ color: '#8B949E' }}>Analyzing diff</span>
            <span
              className="inline-block w-[2px] h-[14px] cursor-blink"
              style={{ background: '#58A6FF' }}
            />
          </div>
        ) : (
          <span style={{ color: '#8B949E' }}>Click Re-analyze or wait for automatic analysis.</span>
        )}
      </div>

      <button
        className="flex items-center justify-center gap-1.5 py-2 px-3 shrink-0 cursor-pointer"
        style={{ border: '1px solid #30363D', background: 'transparent' }}
        onClick={onReanalyze}
        disabled={isLoading}
      >
        <RefreshCw size={14} color="#58A6FF" />
        <span style={{ color: '#58A6FF', fontSize: '12px' }}>Re-analyze</span>
      </button>
    </div>
  )
}
