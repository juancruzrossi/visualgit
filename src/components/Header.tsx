import { GitBranch, ArrowRight } from 'lucide-react'

interface HeaderProps {
  repoName: string
  currentBranch: string
  baseBranch: string
}

export function Header({ repoName, currentBranch, baseBranch }: HeaderProps) {
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
          <span style={{ color: '#9DA5AE', fontSize: '13px' }}>{baseBranch}</span>
          <ArrowRight size={14} color="#9DA5AE" />
          <span style={{ color: '#58A6FF', fontSize: '13px' }}>{currentBranch}</span>
        </div>
      </div>
    </header>
  )
}
