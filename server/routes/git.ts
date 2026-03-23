import { Router, type Request, type Response } from 'express'
import { GitService } from '../services/git.service.js'
import { parseDiff } from '../utils/diff-parser.js'
import type { DiffData, GitInfo } from '../../shared/types.js'

export function createGitRouter(repoPath: string, isGitRepo: boolean): Router {
  const router = Router()
  const gitService = new GitService(repoPath)

  async function getBranches() {
    const currentBranch = await gitService.getCurrentBranch()
    const baseBranch = await gitService.getBaseBranch(currentBranch)
    return { currentBranch, baseBranch }
  }

  async function getInfoResponse(branches?: { currentBranch: string; baseBranch: string }): Promise<GitInfo> {
    const { currentBranch, baseBranch } = branches ?? await getBranches()
    const repoName = await gitService.getRepoName()

    return {
      repoName,
      currentBranch,
      baseBranch,
    }
  }

  async function getDiffResponse(branches?: { currentBranch: string; baseBranch: string }): Promise<DiffData> {
    const { currentBranch, baseBranch } = branches ?? await getBranches()
    const rawDiff = await gitService.getDiff(baseBranch, currentBranch)
    const files = parseDiff(rawDiff)

    const totalAdditions = files.reduce((sum, f) => sum + f.additions, 0)
    const totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0)

    return {
      rawDiff,
      files,
      summary: {
        filesChanged: files.length,
        totalAdditions,
        totalDeletions,
      },
    }
  }

  router.get('/status', (_req: Request, res: Response) => {
    res.json({ isGitRepo })
  })

  router.get('/all', async (_req: Request, res: Response) => {
    if (!isGitRepo) {
      res.json({ isGitRepo, info: null, diff: null })
      return
    }

    try {
      const branches = await getBranches()
      const [info, diff] = await Promise.all([
        getInfoResponse(branches),
        getDiffResponse(branches),
      ])

      res.json({ isGitRepo, info, diff })
    } catch {
      res.status(500).json({ error: 'Failed to load git data' })
    }
  })

  // Deprecated: kept for backward compatibility.
  router.get('/info', async (_req: Request, res: Response) => {
    try {
      res.json(await getInfoResponse())
    } catch {
      res.status(500).json({ error: 'Failed to read git info' })
    }
  })

  // Deprecated: kept for backward compatibility.
  router.get('/diff', async (_req: Request, res: Response) => {
    try {
      res.json(await getDiffResponse())
    } catch {
      res.status(500).json({ error: 'Failed to compute diff' })
    }
  })

  return router
}
