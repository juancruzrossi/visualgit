import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { createGitRouter } from './routes/git.js'
import { createAiRouter } from './routes/ai.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function createServer(repoPath: string, isGitRepo = true) {
  const app = express()

  app.use(cors())
  app.use(express.json({ limit: '5mb' }))

  app.use('/api/git', createGitRouter(repoPath, isGitRepo))
  app.use('/api/ai', createAiRouter())

  const distPath = path.join(__dirname, '..', 'dist')
  app.use(express.static(distPath))
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })

  return app
}

// Direct execution (dev mode)
const isDirectRun = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))
if (isDirectRun) {
  const repoPath = process.env.REPO_PATH || process.cwd()
  const port = parseInt(process.env.PORT || '4321', 10)
  const isGitRepo = process.env.IS_GIT_REPO !== 'false'
  const app = createServer(repoPath, isGitRepo)
  app.listen(port, () => {
    console.log(`VisualGit server running at http://localhost:${port}`)
    console.log(`Repo: ${repoPath}`)
  })
}
