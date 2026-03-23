import { memo } from 'react'
import type { DiffLine as DiffLineData } from '@shared/types'
import { tokens } from '../lib/tokens'

type DiffLineProps = DiffLineData

const lineStyles = {
  context: tokens.diff.context,
  addition: tokens.diff.addition,
  deletion: tokens.diff.deletion,
} as const

export const DiffLine = memo(function DiffLine({
  type,
  oldLineNumber,
  newLineNumber,
  content,
}: DiffLineProps) {
  const style = lineStyles[type]

  return (
    <div
      className="flex items-center h-[22px] min-w-full"
      style={{ background: style.bg }}
    >
      <span
        className="w-12 shrink-0 text-right pr-3 select-none"
        style={{ color: style.line, fontSize: '12px' }}
      >
        {oldLineNumber ?? ''}
      </span>
      <span
        className="w-12 shrink-0 text-right pr-3 select-none"
        style={{ color: style.line, fontSize: '12px' }}
      >
        {newLineNumber ?? ''}
      </span>
      <span
        className="flex-1 whitespace-pre"
        style={{ color: style.text, fontSize: '12px' }}
      >
        {content}
      </span>
    </div>
  )
})
