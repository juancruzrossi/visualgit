import { ChevronDown, FileCode } from 'lucide-react'

interface FileHeaderProps {
  path: string
  additions: number
  deletions: number
}

export function FileHeader({ path, additions, deletions }: FileHeaderProps) {
  return (
    <div
      className="h-10 flex items-center justify-between px-4 shrink-0"
      style={{ background: '#161B22', borderBottom: '1px solid #30363D' }}
    >
      <div className="flex items-center gap-2">
        <ChevronDown size={14} color="#8B949E" />
        <FileCode size={14} color="#8B949E" />
        <span style={{ color: '#E6EDF3', fontSize: '13px' }}>{path}</span>
      </div>
      <div className="flex items-center gap-3">
        <span style={{ color: '#2EA043', fontSize: '12px' }}>+{additions}</span>
        <span style={{ color: '#F85149', fontSize: '12px' }}>-{deletions}</span>
      </div>
    </div>
  )
}
