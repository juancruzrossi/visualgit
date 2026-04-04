import { GitBranch } from 'lucide-react'

interface StatusBarProps {
  filesChanged: number
  totalAdditions: number
  totalDeletions: number
}

export function StatusBar({ filesChanged, totalAdditions, totalDeletions }: StatusBarProps) {
  return (
    <footer
      className="h-8 shrink-0 flex items-center justify-between px-6"
      style={{ background: 'var(--vg-bg-secondary)', borderTop: '1px solid var(--vg-border)' }}
    >
      <div className="flex items-center gap-4">
        <span style={{ color: 'var(--vg-text-muted)', fontSize: '12px' }}>
          {filesChanged} file{filesChanged !== 1 ? 's' : ''} changed
        </span>
        <span style={{ color: 'var(--vg-green)', fontSize: '12px' }}>
          {totalAdditions} insertion{totalAdditions !== 1 ? 's' : ''}(+)
        </span>
        <span style={{ color: 'var(--vg-red)', fontSize: '12px' }}>
          {totalDeletions} deletion{totalDeletions !== 1 ? 's' : ''}(-)
        </span>
      </div>
      <div className="flex items-center gap-2">
        <GitBranch size={12} color="var(--vg-text-dim)" />
        <span style={{ color: 'var(--vg-text-dim)', fontSize: '11px' }}>visualgit</span>
      </div>
    </footer>
  )
}
