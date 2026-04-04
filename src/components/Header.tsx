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
      style={{ borderBottom: '1px solid var(--vg-border)' }}
    >
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <GitBranch size={16} color="var(--vg-text)" />
          <span style={{ color: 'var(--vg-text)', fontSize: '14px' }}>{repoName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: 'var(--vg-text-muted)', fontSize: '13px' }}>{baseBranch}</span>
          <ArrowRight size={14} color="var(--vg-text-muted)" />
          <span style={{ color: 'var(--vg-accent)', fontSize: '13px' }}>{currentBranch}</span>
        </div>
      </div>
    </header>
  )
}
