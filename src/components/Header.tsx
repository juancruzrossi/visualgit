import { GitBranch, ArrowRight } from 'lucide-react'
import { fontSizes, tokens } from '../lib/tokens'

interface HeaderProps {
  repoName: string
  currentBranch: string
  baseBranch: string
}

export function Header({ repoName, currentBranch, baseBranch }: HeaderProps) {
  return (
    <header
      className="h-12 shrink-0 flex items-center justify-between px-6"
      style={{ borderBottom: `1px solid ${tokens.border.default}` }}
    >
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <GitBranch size={16} color={tokens.text.primary} />
          <span style={{ color: tokens.text.primary, fontSize: fontSizes.repoName }}>{repoName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: tokens.text.muted, fontSize: fontSizes.branchName }}>{baseBranch}</span>
          <ArrowRight size={14} color={tokens.text.muted} />
          <span style={{ color: tokens.accent.primary, fontSize: fontSizes.branchName }}>{currentBranch}</span>
        </div>
      </div>
    </header>
  )
}
