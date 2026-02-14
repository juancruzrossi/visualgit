import { Router, type Request, type Response } from 'express'
import { GitService } from '../services/git.service.js'
import { parseDiff } from '../utils/diff-parser.js'

export function createGitRouter(repoPath: string, isGitRepo: boolean): Router {
  const router = Router()
  const gitService = new GitService(repoPath)

  router.get('/status', (_req: Request, res: Response) => {
    res.json({ isGitRepo })
  })

  router.get('/info', async (_req: Request, res: Response) => {
    try {
      const currentBranch = await gitService.getCurrentBranch()
      const baseBranch = await gitService.getBaseBranch(currentBranch)
      const repoName = await gitService.getRepoName()
      const aheadBehind = await gitService.getAheadBehind(baseBranch, currentBranch)

      res.json({
        repoName,
        currentBranch,
        baseBranch,
        ...aheadBehind,
      })
    } catch {
      res.status(500).json({ error: 'Failed to read git info' })
    }
  })

  router.get('/diff', async (_req: Request, res: Response) => {
    try {
      const currentBranch = await gitService.getCurrentBranch()
      const baseBranch = await gitService.getBaseBranch(currentBranch)
      const rawDiff = await gitService.getDiff(baseBranch, currentBranch)
      const files = parseDiff(rawDiff)

      const totalAdditions = files.reduce((sum, f) => sum + f.additions, 0)
      const totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0)

      res.json({
        rawDiff,
        files,
        summary: {
          filesChanged: files.length,
          totalAdditions,
          totalDeletions,
        },
      })
    } catch {
      res.status(500).json({ error: 'Failed to compute diff' })
    }
  })

  return router
}
