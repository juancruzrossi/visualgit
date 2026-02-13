import { FileHeader } from './FileHeader'
import { DiffLine } from './DiffLine'

interface DiffLineData {
  type: 'context' | 'addition' | 'deletion'
  lineNumber: number
  content: string
}

interface DiffFileData {
  path: string
  additions: number
  deletions: number
  lines: DiffLineData[]
}

interface DiffViewerProps {
  files: DiffFileData[]
  selectedFile: number
  onSelectFile: (index: number) => void
}

export function DiffViewer({ files, selectedFile }: DiffViewerProps) {
  const file = files[selectedFile]

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center h-full" style={{ color: '#8B949E', fontSize: '13px' }}>
        No diff available. Are you on a feature branch?
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <FileHeader path={file.path} additions={file.additions} deletions={file.deletions} />
      <div className="flex-1 overflow-y-auto py-3">
        {file.lines.map((line, i) => (
          <DiffLine key={i} type={line.type} lineNumber={line.lineNumber} content={line.content} />
        ))}
      </div>
    </div>
  )
}
