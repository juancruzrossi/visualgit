export interface DiffLine {
  type: 'context' | 'addition' | 'deletion'
  lineNumber: number
  content: string
}

export interface DiffFile {
  path: string
  additions: number
  deletions: number
  lines: DiffLine[]
}

export function parseDiff(rawDiff: string): DiffFile[] {
  const files: DiffFile[] = []
  const fileSections = rawDiff.split(/^diff --git /m).filter(Boolean)

  for (const section of fileSections) {
    const headerMatch = section.match(/a\/(.+?) b\/(.+)/)
    if (!headerMatch) continue

    const path = headerMatch[2]
    const lines: DiffLine[] = []
    let additions = 0
    let deletions = 0

    const hunks = section.split(/^@@\s+-\d+(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@.*$/m)

    for (let h = 1; h < hunks.length; h += 2) {
      let lineNum = parseInt(hunks[h], 10)
      const hunkBody = hunks[h + 1]
      if (!hunkBody) continue

      const hunkLines = hunkBody.split('\n')

      for (const line of hunkLines) {
        if (line.startsWith('+')) {
          lines.push({ type: 'addition', lineNumber: lineNum, content: line.slice(1) })
          additions++
          lineNum++
        } else if (line.startsWith('-')) {
          lines.push({ type: 'deletion', lineNumber: lineNum, content: line.slice(1) })
          deletions++
        } else if (line.startsWith(' ') || line === '') {
          if (line !== '' || lines.length > 0) {
            lines.push({ type: 'context', lineNumber: lineNum, content: line.startsWith(' ') ? line.slice(1) : '' })
            lineNum++
          }
        }
      }
    }

    files.push({ path, additions, deletions, lines })
  }

  return files
}
