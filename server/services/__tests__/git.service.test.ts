import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GitService } from '../git.service'

const mockGit = {
  branch: vi.fn(),
  raw: vi.fn(),
  diff: vi.fn(),
  revparse: vi.fn(),
  getRemotes: vi.fn(),
}

vi.mock('simple-git', () => {
  return { default: vi.fn(() => mockGit), simpleGit: vi.fn(() => mockGit) }
})

describe('GitService', () => {
  let service: GitService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new GitService('/fake/repo')
  })

  it('gets current branch name', async () => {
    mockGit.branch.mockResolvedValue({ current: 'feature/auth' })
    const branch = await service.getCurrentBranch()
    expect(branch).toBe('feature/auth')
  })

  it('detects base branch from local branches', async () => {
    mockGit.raw.mockImplementation((args: string[]) => {
      if (args.includes('--verify') && args.includes('main')) return Promise.resolve('abc123\n')
      return Promise.resolve('')
    })
    const base = await service.getBaseBranch('feature/auth')
    expect(base).toBe('main')
  })

  it('gets diff between branches', async () => {
    mockGit.diff.mockResolvedValue('diff --git a/file.ts b/file.ts\n...')
    const diff = await service.getDiff('develop', 'feature/auth')
    expect(diff).toContain('diff --git')
  })

  it('gets repo name from remote', async () => {
    mockGit.getRemotes.mockResolvedValue([{ name: 'origin', refs: { fetch: 'git@github.com:acme/web-platform.git' } }])
    const name = await service.getRepoName()
    expect(name).toBe('web-platform')
  })
})
