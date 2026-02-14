import { simpleGit, type SimpleGit } from 'simple-git'

export class GitService {
  private git: SimpleGit

  constructor(repoPath: string) {
    this.git = simpleGit(repoPath)
  }

  async getCurrentBranch(): Promise<string> {
    const result = await this.git.branch()
    return result.current
  }

  async getBaseBranch(currentBranch: string): Promise<string> {
    for (const candidate of ['main', 'master', 'develop']) {
      if (candidate === currentBranch) continue
      try {
        await this.git.raw(['rev-parse', '--verify', candidate])
        return candidate
      } catch {
        continue
      }
    }
    return 'main'
  }

  async getDiff(baseBranch: string, currentBranch: string): Promise<string> {
    return this.git.diff([`${baseBranch}...${currentBranch}`])
  }

  async getRepoName(): Promise<string> {
    try {
      const remotes = await this.git.getRemotes(true)
      const origin = remotes.find(r => r.name === 'origin')
      if (origin?.refs?.fetch) {
        const url = origin.refs.fetch
        const match = url.match(/\/([^/]+?)(?:\.git)?$/)
        return match ? match[1] : 'unknown'
      }
    } catch { /* fallback */ }
    return 'repo'
  }

}
