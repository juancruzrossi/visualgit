#!/usr/bin/env node

import { existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { register } from 'module'

const repoPath = process.cwd()

if (!existsSync(resolve(repoPath, '.git'))) {
  console.error('\x1b[31mError:\x1b[0m Not a git repository.')
  console.error('Run this command from inside a git repository.')
  process.exit(1)
}

async function main() {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const serverPath = resolve(__dirname, '..', 'server', 'index.ts')

  // Use tsx to load TypeScript server
  const { createServer } = await import(serverPath)
  const detectPort = (await import('detect-port')).default
  const open = (await import('open')).default

  const port = await detectPort(4321)
  const app = createServer(repoPath)

  app.listen(port, () => {
    const url = `http://localhost:${port}`
    console.log(`\x1b[32m✓\x1b[0m VisualGit running at \x1b[36m${url}\x1b[0m`)
    console.log(`  Repo: ${repoPath}`)
    console.log(`  Press \x1b[33mCtrl+C\x1b[0m to stop\n`)
    open(url)
  })

  process.on('SIGINT', () => {
    console.log('\n\x1b[33m⏹\x1b[0m VisualGit stopped.')
    process.exit(0)
  })
}

main().catch((err) => {
  console.error('\x1b[31mFailed to start VisualGit:\x1b[0m', err.message)
  process.exit(1)
})
