import type { DiffFile, DiffFileStatus, DiffLine } from '../../shared/types.js'

const HUNK_HEADER_REGEX = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/
const DIFF_HEADER_REGEX = /^a\/(.+?) b\/(.+)$/

export function parseDiff(rawDiff: string): DiffFile[] {
  // Normalize CRLF to LF
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

    // Parse extended headers (lines between diff header and hunk/content)
    let lineIdx = 1
    for (; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx]

      if (line.startsWith('rename from ')) {
        oldPath = line.slice('rename from '.length)
        status = 'renamed'
      } else if (line.startsWith('rename to ')) {
        // already handled by 'rename from'
      } else if (line.startsWith('copy from ')) {
        oldPath = line.slice('copy from '.length)
        status = 'copied'
      } else if (line.startsWith('copy to ')) {
        // already handled by 'copy from'
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
      // Skip: similarity index, index, dissimilarity index, +++
    }

    // Parse hunks
    const parsedLines: DiffLine[] = []
    let additions = 0
    let deletions = 0
    let oldLineNumber = 0
    let newLineNumber = 0
    let inHunk = false

    for (; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx]

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

      // Bare empty line inside a hunk = context with empty content
      // But only if it's genuinely part of the hunk (not trailing)
      if (line === '' && lineIdx < lines.length - 1 && lines[lineIdx + 1] !== '') {
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
