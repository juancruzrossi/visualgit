import { ChevronDown, ChevronRight, FileCode, Check } from 'lucide-react'

interface FileHeaderProps {
  path: string
  additions: number
  deletions: number
  collapsed?: boolean
  onToggle?: () => void
  viewed?: boolean
  onToggleViewed?: () => void
}

export function FileHeader({ path, additions, deletions, collapsed, onToggle, viewed, onToggleViewed }: FileHeaderProps) {
  const Chevron = collapsed ? ChevronRight : ChevronDown

  return (
    <div
      className="h-10 flex items-center justify-between px-4 shrink-0 cursor-pointer select-none"
      style={{ background: '#161B22', borderBottom: '1px solid #30363D' }}
      onClick={onToggle}
    >
      <div className="flex items-center gap-2">
        <Chevron size={14} color="#8B949E" />
        <FileCode size={14} color={viewed ? '#3FB950' : '#8B949E'} />
        <span style={{ color: viewed ? '#8B949E' : '#E6EDF3', fontSize: '13px' }}>{path}</span>
      </div>
      <div className="flex items-center gap-3">
        <span style={{ color: '#3FB950', fontSize: '12px' }}>+{additions}</span>
        <span style={{ color: '#F47067', fontSize: '12px' }}>-{deletions}</span>
        <button
          className="flex items-center gap-1 px-1.5 py-0.5 cursor-pointer"
          style={{
            background: viewed ? 'rgba(63,185,80,0.15)' : 'transparent',
            border: `1px solid ${viewed ? '#3FB950' : '#30363D'}`,
            borderRadius: '4px',
          }}
          onClick={(e) => {
            e.stopPropagation()
            onToggleViewed?.()
          }}
        >
          {viewed && <Check size={10} color="#3FB950" />}
          <span style={{ color: viewed ? '#3FB950' : '#8B949E', fontSize: '11px' }}>
            {viewed ? 'Viewed' : 'View'}
          </span>
        </button>
      </div>
    </div>
  )
}
