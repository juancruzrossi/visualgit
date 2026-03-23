import { GitBranch } from 'lucide-react'
import { fontSizes, tokens } from '../lib/tokens'

interface StatusBarProps {
  filesChanged: number
  totalAdditions: number
  totalDeletions: number
}

export function StatusBar({ filesChanged, totalAdditions, totalDeletions }: StatusBarProps) {
  return (
    <footer
      className="h-8 shrink-0 flex items-center justify-between px-6"
      style={{ background: tokens.background.secondary, borderTop: `1px solid ${tokens.border.default}` }}
    >
      <div className="flex items-center gap-4">
        <span style={{ color: tokens.text.muted, fontSize: fontSizes.code }}>
          {filesChanged} file{filesChanged !== 1 ? 's' : ''} changed
        </span>
        <span style={{ color: tokens.success.strong, fontSize: fontSizes.code }}>
          {totalAdditions} insertion{totalAdditions !== 1 ? 's' : ''}(+)
        </span>
        <span style={{ color: tokens.danger.strong, fontSize: fontSizes.code }}>
          {totalDeletions} deletion{totalDeletions !== 1 ? 's' : ''}(-)
        </span>
      </div>
      <div className="flex items-center gap-2">
        <GitBranch size={12} color={tokens.border.muted} />
        <span style={{ color: tokens.border.muted, fontSize: fontSizes.statusSmall }}>visualgit</span>
      </div>
    </footer>
  )
}
