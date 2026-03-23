export type DiffLineType = 'context' | 'addition' | 'deletion'

export interface DiffLine {
  type: DiffLineType
  oldLineNumber?: number
  newLineNumber?: number
  content: string
}

export interface DiffFile {
  path: string
  additions: number
  deletions: number
  lines: DiffLine[]
}

export interface DiffSummary {
  filesChanged: number
  totalAdditions: number
  totalDeletions: number
}

export interface DiffData {
  rawDiff: string
  files: DiffFile[]
  summary: DiffSummary
}

export interface GitInfo {
  repoName: string
  currentBranch: string
  baseBranch: string
}

export interface GitDataResponse {
  isGitRepo: boolean
  info: GitInfo | null
  diff: DiffData | null
}

export type AiProvider = 'claude' | 'openai'
export type AnalysisMode = 'full' | 'file' | 'selection'
export type ClaudeModel = 'opus' | 'sonnet' | 'haiku'
export type LoadingPhase = null | 'connecting' | 'analyzing' | 'streaming'
