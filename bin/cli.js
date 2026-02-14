#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { spawn, execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(resolve(__dirname, '..', 'package.json'), 'utf-8'))

if (process.argv.includes('--version') || process.argv.includes('-v')) {
  console.log(`visualgit v${pkg.version}`)
  process.exit(0)
}

if (process.argv[2] === 'update') {
  const current = pkg.version
  console.log(`\x1b[36m⟳\x1b[0m Current version: v${current}`)
  console.log(`  Checking for updates...`)

  try {
    const latest = execSync('npm view @jxtools/visualgit version', { encoding: 'utf-8' }).trim()

    if (latest === current) {
      console.log(`\x1b[32m✓\x1b[0m Already on the latest version (v${current})`)
      process.exit(0)
    }

    console.log(`\x1b[33m↑\x1b[0m New version available: v${latest}`)
    console.log(`  Updating...`)

    execSync('npm install -g @jxtools/visualgit@latest', { stdio: 'inherit' })
    console.log(`\n\x1b[32m✓\x1b[0m Updated to v${latest}`)
  } catch (err) {
    console.error(`\x1b[31m✗\x1b[0m Update failed: ${err.message}`)
    process.exit(1)
  }

  process.exit(0)
}

const repoPath = process.cwd()
const isGitRepo = existsSync(resolve(repoPath, '.git'))

async function main() {
  const serverPath = resolve(__dirname, '..', 'dist-server', 'index.js')

  if (!existsSync(serverPath)) {
    console.error('\x1b[31mError:\x1b[0m Server files not found. Try reinstalling: npm install -g visualgit')
    process.exit(1)
  }

  const detectPort = (await import('detect-port')).default
  const open = (await import('open')).default

  const port = await detectPort(4321)
  const url = `http://localhost:${port}`

  const child = spawn('node', [serverPath], {
    stdio: 'inherit',
    env: {
      ...process.env,
      REPO_PATH: repoPath,
      PORT: String(port),
      IS_GIT_REPO: String(isGitRepo),
    },
  })

  child.on('error', (err) => {
    console.error('\x1b[31mFailed to start VisualGit:\x1b[0m', err.message)
    process.exit(1)
  })

  setTimeout(() => {
    if (isGitRepo) {
      console.log(`\x1b[32m✓\x1b[0m VisualGit running at \x1b[36m${url}\x1b[0m`)
      console.log(`  Repo: ${repoPath}`)
    } else {
      console.log(`\x1b[33m⚠\x1b[0m VisualGit running at \x1b[36m${url}\x1b[0m`)
      console.log(`  \x1b[33mNot a git repository\x1b[0m`)
    }
    console.log(`  Press \x1b[33mCtrl+C\x1b[0m to stop\n`)
    open(url)
  }, 1500)

  child.on('close', (code) => process.exit(code ?? 0))

  process.on('SIGINT', () => {
    child.kill('SIGINT')
    console.log('\n\x1b[33m⏹\x1b[0m VisualGit stopped.')
    process.exit(0)
  })
}

main().catch((err) => {
  console.error('\x1b[31mFailed to start VisualGit:\x1b[0m', err.message)
  process.exit(1)
})
