import { GitBranch, ArrowLeft, Circle } from 'lucide-react'

interface HeaderProps {
  repoName: string
  currentBranch: string
  baseBranch: string
  ahead: number
  behind: number
}

export function Header({ repoName, currentBranch, baseBranch, ahead, behind }: HeaderProps) {
  return (
    <header
      className="h-12 shrink-0 flex items-center justify-between px-6"
      style={{ borderBottom: '1px solid #30363D' }}
    >
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <GitBranch size={16} color="#E6EDF3" />
          <span style={{ color: '#E6EDF3', fontSize: '14px' }}>{repoName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: '#58A6FF', fontSize: '13px' }}>{currentBranch}</span>
          <ArrowLeft size={14} color="#8B949E" />
          <span style={{ color: '#8B949E', fontSize: '13px' }}>{baseBranch}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Circle size={8} fill="#2EA043" color="#2EA043" />
        <span style={{ color: '#8B949E', fontSize: '12px' }}>
          {ahead} ahead, {behind} behind
        </span>
      </div>
    </header>
  )
}
