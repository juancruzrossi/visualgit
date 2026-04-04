import type { DiffFile, DiffFileStatus, DiffLine } from '../../shared/types.js'

const HUNK_HEADER_REGEX = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/
const DIFF_HEADER_REGEX = /^a\/(.+?) b\/(.+)$/

export function parseDiff(rawDiff: string): DiffFile[] {
  const normalized = rawDiff.replace(/\r\n/g, '\n')
  const files: DiffFile[] = []
  const fileSections = normalized.split(/^diff --git /m).filter(Boolean)

  for (const section of fileSections) {
    const lines = section.split('\n')
    const headerMatch = lines[0]?.match(DIFF_HEADER_REGEX)

    if (!headerMatch) continue

    const filePath = headerMatch[2]
    let oldPath: string | undefined
    let status: DiffFileStatus | undefined
    let isBinary = false

    // Parse extended headers
    let lineIdx = 1
    for (; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx]

      if (line.startsWith('rename from ')) {
        oldPath = line.slice('rename from '.length)
        status = 'renamed'
      } else if (line.startsWith('rename to ')) {
        // handled by 'rename from'
      } else if (line.startsWith('copy from ')) {
        oldPath = line.slice('copy from '.length)
        status = 'copied'
      } else if (line.startsWith('copy to ')) {
        // handled by 'copy from'
      } else if (line.startsWith('new file mode')) {
        status = 'added'
      } else if (line.startsWith('deleted file mode')) {
        status = 'deleted'
      } else if (line.startsWith('old mode ') || line.startsWith('new mode ')) {
        if (!status) status = 'modified'
      } else if (line.startsWith('Binary files')) {
        isBinary = true
      } else if (line.startsWith('---') || line.startsWith('@@')) {
        break
      }
    }

    // Parse hunks using line counts from hunk header
    const parsedLines: DiffLine[] = []
    let additions = 0
    let deletions = 0
    let oldLineNumber = 0
    let newLineNumber = 0
    let remainingOld = 0
    let remainingNew = 0

    for (; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx]

      const hunkMatch = line.match(HUNK_HEADER_REGEX)
      if (hunkMatch) {
        oldLineNumber = Number.parseInt(hunkMatch[1], 10)
        newLineNumber = Number.parseInt(hunkMatch[3], 10)
        remainingOld = hunkMatch[2] ? Number.parseInt(hunkMatch[2], 10) : 1
        remainingNew = hunkMatch[4] ? Number.parseInt(hunkMatch[4], 10) : 1
        continue
      }

      // Outside a hunk (both counters exhausted)
      if (remainingOld <= 0 && remainingNew <= 0) continue

      if (line.startsWith('\\')) continue

      if (line.startsWith('+++') || line.startsWith('---')) continue

      if (line.startsWith('+')) {
        parsedLines.push({
          type: 'addition',
          newLineNumber,
          content: line.slice(1),
        })
        additions += 1
        newLineNumber += 1
        remainingNew -= 1
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
        remainingOld -= 1
        continue
      }

      // Context line (starts with space or is bare empty line within hunk bounds)
      if (line.startsWith(' ') || (line === '' && remainingOld > 0 && remainingNew > 0)) {
        parsedLines.push({
          type: 'context',
          oldLineNumber,
          newLineNumber,
          content: line.startsWith(' ') ? line.slice(1) : '',
        })
        oldLineNumber += 1
        newLineNumber += 1
        remainingOld -= 1
        remainingNew -= 1
      }
    }

    files.push({
      path: filePath,
      ...(oldPath && { oldPath }),
      ...(status && { status }),
      ...(isBinary && { isBinary }),
      additions,
      deletions,
      lines: parsedLines,
    })
  }

  return files
}
