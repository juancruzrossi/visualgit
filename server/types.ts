// Shared types used by both client and server
// Re-exported from shared/types.ts for the frontend, canonical source for the server build.

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

export interface DiffData {
  rawDiff: string
  files: DiffFile[]
  summary: {
    filesChanged: number
    totalAdditions: number
    totalDeletions: number
  }
}

export interface GitInfo {
  repoName: string
  currentBranch: string
  baseBranch: string
}

export type AiProvider = 'claude' | 'openai'
export type AnalysisMode = 'full' | 'file' | 'selection'
export type ClaudeModel = 'opus' | 'sonnet' | 'haiku'
export type LoadingPhase = null | 'connecting' | 'analyzing' | 'streaming'
