interface DiffLineProps {
  type: 'context' | 'addition' | 'deletion'
  lineNumber: number
  content: string
}

const lineStyles = {
  context: { bg: 'transparent', text: 'var(--vg-text-muted)', ln: 'var(--vg-text-dim)', prefix: ' ' },
  addition: { bg: 'var(--vg-green-bg)', text: 'var(--vg-green-bright)', ln: 'var(--vg-green)', prefix: '+' },
  deletion: { bg: 'var(--vg-red-bg)', text: 'var(--vg-red-bright)', ln: 'var(--vg-red)', prefix: '-' },
}

export function DiffLine({ type, lineNumber, content }: DiffLineProps) {
  const style = lineStyles[type]

  return (
    <div
      className="flex items-center h-[22px] min-w-full"
      style={{ background: style.bg }}
    >
      <span
        className="w-12 shrink-0 text-right pr-3 select-none"
        style={{ color: style.ln, fontSize: '12px' }}
      >
        {lineNumber}
      </span>
      <span
        className="flex-1 whitespace-pre"
        style={{ color: style.text, fontSize: '12px' }}
      >
        {content}
      </span>
    </div>
  )
}
