import simpleGit, { type SimpleGit } from 'simple-git'

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
    try {
      const tracking = await this.git.raw(['rev-parse', '--abbrev-ref', `${currentBranch}@{upstream}`])
      const remote = tracking.trim().split('/').slice(1).join('/')
      return remote || 'main'
    } catch {
      for (const candidate of ['develop', 'main', 'master']) {
        try {
          await this.git.raw(['rev-parse', '--verify', candidate])
          return candidate
        } catch {
          continue
        }
      }
      return 'main'
    }
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
        const match = url.match(/[:/]([^/]+\/[^/]+?)(?:\.git)?$/)
        return match ? match[1] : 'unknown/repo'
      }
    } catch { /* fallback */ }
    return 'local/repo'
  }

  async getAheadBehind(baseBranch: string, currentBranch: string): Promise<{ ahead: number; behind: number }> {
    try {
      const result = await this.git.raw(['rev-list', '--left-right', '--count', `${baseBranch}...${currentBranch}`])
      const [behind, ahead] = result.trim().split('\t').map(Number)
      return { ahead: ahead || 0, behind: behind || 0 }
    } catch {
      return { ahead: 0, behind: 0 }
    }
  }
}
