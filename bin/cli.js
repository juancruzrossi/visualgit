#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { spawn, execFileSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgDir = resolve(__dirname, '..')
const pkg = JSON.parse(readFileSync(resolve(__dirname, '..', 'package.json'), 'utf-8'))
const registryFile = resolve(pkgDir, '.npm-registry')

function savedRegistry() {
  if (!existsSync(registryFile)) return ''
  return readFileSync(registryFile, 'utf-8').trim()
}

function npmRegistry() {
  const explicit = process.env.npm_config_registry || process.env.NPM_CONFIG_REGISTRY
  if (explicit) return explicit

  const saved = savedRegistry()
  if (saved) return saved

  try {
    return execFileSync('npm', ['config', 'get', 'registry'], {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return ''
  }
}

function versionKey(version) {
  return version
    .replace(/^v/, '')
    .split('.')
    .map(part => part.padStart(6, '0'))
    .join('')
}

function isNewerVersion(candidate, current) {
  return versionKey(candidate) > versionKey(current)
}

function npmViewLatestVersion(registry) {
  const args = ['view', '@jxtools/visualgit', 'version']
  if (registry) args.push('--registry', registry)

  return execFileSync('npm', args, {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'ignore'],
    env: {
      ...process.env,
      npm_config_fetch_retries: '0',
      npm_config_fetch_timeout: '5000',
    },
  }).trim()
}

function npmInstallLatest(registry) {
  const args = ['install', '-g', '@jxtools/visualgit@latest']
  if (registry) args.push('--registry', registry)

  execFileSync('npm', args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      npm_config_fetch_retries: '0',
      npm_config_fetch_timeout: '10000',
    },
  })
}

if (process.argv.includes('--version') || process.argv.includes('-v')) {
  console.log(`visualgit v${pkg.version}`)
  process.exit(0)
}

if (process.argv[2] === 'update') {
  const current = pkg.version
  const registry = npmRegistry()
  console.log(`\x1b[36m⟳\x1b[0m Current version: v${current}`)
  console.log(`  Checking for updates...`)

  try {
    const latest = npmViewLatestVersion(registry)

    if (!isNewerVersion(latest, current)) {
      console.log(`\x1b[32m✓\x1b[0m Already on the latest version (v${current})`)
      process.exit(0)
    }

    console.log(`\x1b[33m↑\x1b[0m New version available: v${latest}`)
    console.log(`  Updating...`)

    npmInstallLatest(registry)
    console.log(`\n\x1b[32m✓\x1b[0m Updated to v${latest}`)
  } catch (err) {
    const suffix = registry ? ` (registry: ${registry})` : ''
    console.error(`\x1b[31m✗\x1b[0m Update failed${suffix}: ${err.message}`)
    process.exit(1)
  }

  process.exit(0)
}

const repoPath = process.cwd()
const isGitRepo = existsSync(resolve(repoPath, '.git'))

async function waitForServer(url) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${url}/api/git/status`, {
        signal: AbortSignal.timeout(1000),
      })

      if (response.ok) {
        return
      }
    } catch {
      // Keep polling until the server is ready or retries are exhausted.
    }

    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

async function main() {
  const serverPath = resolve(__dirname, '..', 'dist-server', 'server', 'index.js')

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

  waitForServer(url).finally(() => {
    if (isGitRepo) {
      console.log(`\x1b[32m✓\x1b[0m VisualGit running at \x1b[36m${url}\x1b[0m`)
      console.log(`  Repo: ${repoPath}`)
    } else {
      console.log(`\x1b[33m⚠\x1b[0m VisualGit running at \x1b[36m${url}\x1b[0m`)
      console.log(`  \x1b[33mNot a git repository\x1b[0m`)
    }
    console.log(`  Press \x1b[33mCtrl+C\x1b[0m to stop\n`)
    open(url)
  })

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
