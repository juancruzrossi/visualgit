import { ChevronDown, ChevronRight, FileCode } from 'lucide-react'

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
      <div className="flex items-center gap-2 min-w-0">
        <Chevron size={14} color="#9DA5AE" className="shrink-0" />
        <FileCode size={14} color={viewed ? '#3FB950' : '#9DA5AE'} className="shrink-0" />
        <span className="truncate" style={{ color: viewed ? '#9DA5AE' : '#E6EDF3', fontSize: '13px' }}>{path}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-3">
        <span style={{ color: '#3FB950', fontSize: '12px' }}>+{additions}</span>
        <span style={{ color: '#F47067', fontSize: '12px' }}>-{deletions}</span>
        <div
          className="flex items-center justify-center cursor-pointer shrink-0"
          style={{
            width: '15px',
            height: '15px',
            border: `1.5px solid ${viewed ? '#3FB950' : '#484F58'}`,
            borderRadius: '3px',
            background: viewed ? 'transparent' : 'transparent',
          }}
          onClick={(e) => {
            e.stopPropagation()
            onToggleViewed?.()
          }}
        >
          {viewed && (
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M2 5.5L4.5 8L9 3" stroke="#3FB950" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
    </div>
  )
}
