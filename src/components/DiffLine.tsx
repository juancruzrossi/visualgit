interface DiffLineProps {
  type: 'context' | 'addition' | 'deletion'
  lineNumber: number
  content: string
}

const lineStyles = {
  context: { bg: 'transparent', text: '#8B949E', ln: '#484F58', prefix: ' ' },
  addition: { bg: '#1B3826', text: '#2EA043', ln: '#2EA043', prefix: '+' },
  deletion: { bg: '#3D1F1F', text: '#F85149', ln: '#F85149', prefix: '-' },
}

export function DiffLine({ type, lineNumber, content }: DiffLineProps) {
  const style = lineStyles[type]

  return (
    <div
      className="flex items-center h-[22px] w-full"
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
        {type !== 'context' ? style.prefix : ' '}{content}
      </span>
    </div>
  )
}
