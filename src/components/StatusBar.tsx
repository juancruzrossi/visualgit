import { Terminal } from 'lucide-react'

interface StatusBarProps {
  filesChanged: number
  totalAdditions: number
  totalDeletions: number
}

export function StatusBar({ filesChanged, totalAdditions, totalDeletions }: StatusBarProps) {
  return (
    <footer
      className="h-8 shrink-0 flex items-center justify-between px-6"
      style={{ background: '#161B22', borderTop: '1px solid #30363D' }}
    >
      <div className="flex items-center gap-4">
        <span style={{ color: '#8B949E', fontSize: '12px' }}>
          {filesChanged} file{filesChanged !== 1 ? 's' : ''} changed
        </span>
        <span style={{ color: '#2EA043', fontSize: '12px' }}>
          {totalAdditions} insertion{totalAdditions !== 1 ? 's' : ''}(+)
        </span>
        <span style={{ color: '#F85149', fontSize: '12px' }}>
          {totalDeletions} deletion{totalDeletions !== 1 ? 's' : ''}(-)
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Terminal size={12} color="#484F58" />
        <span style={{ color: '#484F58', fontSize: '11px' }}>diff --git</span>
      </div>
    </footer>
  )
}
