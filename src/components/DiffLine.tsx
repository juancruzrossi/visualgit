interface DiffLineProps {
  type: 'context' | 'addition' | 'deletion'
  lineNumber: number
  content: string
}

const lineStyles = {
  context: { bg: 'transparent', text: '#8B949E', ln: '#484F58', prefix: ' ' },
  addition: { bg: '#122117', text: '#7EE787', ln: '#3FB950', prefix: '+' },
  deletion: { bg: '#2A1516', text: '#FFA198', ln: '#F47067', prefix: '-' },
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
