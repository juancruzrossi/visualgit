import type { DiffFile, DiffLine } from '../../shared/types.js'

const HUNK_HEADER_REGEX = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/

export function parseDiff(rawDiff: string): DiffFile[] {
  const files: DiffFile[] = []
  const fileSections = rawDiff.split(/^diff --git /m).filter(Boolean)

  for (const section of fileSections) {
    const lines = section.split('\n')
    const headerMatch = lines[0]?.match(/a\/(.+?) b\/(.+)/)

    if (!headerMatch) continue

    const parsedLines: DiffLine[] = []
    let additions = 0
    let deletions = 0
    let oldLineNumber = 0
    let newLineNumber = 0
    let inHunk = false

    for (const line of lines.slice(1)) {
      const hunkMatch = line.match(HUNK_HEADER_REGEX)
      if (hunkMatch) {
        oldLineNumber = Number.parseInt(hunkMatch[1], 10)
        newLineNumber = Number.parseInt(hunkMatch[2], 10)
        inHunk = true
        continue
      }

      if (!inHunk || line.startsWith('+++') || line.startsWith('---') || line.startsWith('\\')) {
        continue
      }

      if (line.startsWith('+')) {
        parsedLines.push({
          type: 'addition',
          newLineNumber,
          content: line.slice(1),
        })
        additions += 1
        newLineNumber += 1
        continue
      }

      if (line.startsWith('-')) {
        parsedLines.push({
          type: 'deletion',
          oldLineNumber,
          content: line.slice(1),
        })
        deletions += 1
        oldLineNumber += 1
        continue
      }

      if (line.startsWith(' ')) {
        parsedLines.push({
          type: 'context',
          oldLineNumber,
          newLineNumber,
          content: line.slice(1),
        })
        oldLineNumber += 1
        newLineNumber += 1
        continue
      }

      if (line === '') {
        parsedLines.push({
          type: 'context',
          oldLineNumber,
          newLineNumber,
          content: '',
        })
        oldLineNumber += 1
        newLineNumber += 1
      }
    }

    files.push({
      path: headerMatch[2],
      additions,
      deletions,
      lines: parsedLines,
    })
  }

  return files
}
