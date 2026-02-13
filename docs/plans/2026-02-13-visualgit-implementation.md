# VisualGit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a terminal-style dark-mode web tool that visualizes git diffs and generates AI-powered explanations, distributed as an npm CLI package (`npx visualgit`).

**Architecture:** Vite + React frontend (static build) served by an Express backend. The Express server exposes API routes for git operations (via `simple-git`) and AI analysis (via `claude -p` CLI). A CLI entry point (`bin/cli.js`) bootstraps everything and opens the browser.

**Tech Stack:** TypeScript, React 18, Vite 6, Tailwind CSS 4, Express 4, simple-git, JetBrains Mono font, Lucide React icons.

**Important Note:** `claude -p` cannot run inside a Claude Code session (env var `CLAUDECODE` blocks nesting). In production this is not an issue. During development, unset `CLAUDECODE` before testing the AI route manually.

---

### Task 1: Initialize Project & Install Dependencies

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `.gitignore`

**Step 1: Initialize git repo and npm project**

```bash
cd /Users/juanchirossi/Documents/Proyectos/visualgit
git init
npm init -y
```

**Step 2: Install production dependencies**

```bash
npm install express simple-git open detect-port cors
npm install react react-dom lucide-react
```

**Step 3: Install dev dependencies**

```bash
npm install -D typescript @types/node @types/react @types/react-dom @types/express @types/cors
npm install -D vite @vitejs/plugin-react
npm install -D tailwindcss @tailwindcss/vite
npm install -D tsx vitest @testing-library/react @testing-library/jest-dom jsdom supertest @types/supertest
```

**Step 4: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src", "server"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 5: Create tsconfig.node.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist-server",
    "rootDir": "."
  },
  "include": ["server", "vite.config.ts"]
}
```

**Step 6: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
  },
  server: {
    proxy: {
      '/api': 'http://localhost:4321',
    },
  },
})
```

**Step 7: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VisualGit</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 8: Create .gitignore**

```
node_modules/
dist/
dist-server/
.env
.env.local
*.log
```

**Step 9: Create postcss.config.js**

```javascript
export default {
  plugins: {},
}
```

**Step 10: Update package.json scripts**

Add to package.json:
```json
{
  "type": "module",
  "scripts": {
    "dev": "vite",
    "dev:server": "tsx watch server/index.ts",
    "build": "vite build && tsx server/build.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

**Step 11: Commit**

```bash
git add -A
git commit -m "chore: initialize project with vite, react, tailwind, express"
```

---

### Task 2: Design Tokens & Global Styles

**Files:**
- Create: `src/lib/tokens.ts`
- Create: `src/index.css`
- Create: `src/main.tsx`
- Create: `src/App.tsx`

**Step 1: Create design tokens (extracted from Pencil design)**

Create `src/lib/tokens.ts`:
```typescript
export const tokens = {
  bg: '#0D1117',
  bgSecondary: '#161B22',
  border: '#30363D',
  text: '#E6EDF3',
  textMuted: '#8B949E',
  textDim: '#484F58',
  accent: '#58A6FF',
  addText: '#2EA043',
  addBg: '#1B3826',
  delText: '#F85149',
  delBg: '#3D1F1F',
} as const

export const fontSizes = {
  repoName: '14px',
  branchName: '13px',
  code: '12px',
  statusSmall: '11px',
} as const
```

**Step 2: Create global CSS with Tailwind**

Create `src/index.css`:
```css
@import 'tailwindcss';

body {
  margin: 0;
  padding: 0;
  background-color: #0D1117;
  color: #E6EDF3;
  font-family: 'JetBrains Mono', monospace;
  overflow: hidden;
}

/* Blinking cursor animation for AI typing indicator */
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
.cursor-blink {
  animation: blink 1s step-end infinite;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: #0D1117;
}
::-webkit-scrollbar-thumb {
  background: #30363D;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #484F58;
}
```

**Step 3: Create main.tsx entry point**

Create `src/main.tsx`:
```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

**Step 4: Create App shell**

Create `src/App.tsx`:
```typescript
export default function App() {
  return (
    <div className="h-screen w-screen flex flex-col" style={{ background: '#0D1117' }}>
      {/* Header */}
      <div className="h-12 shrink-0" style={{ borderBottom: '1px solid #30363D' }}>
        Header
      </div>

      {/* Main */}
      <div className="flex-1 flex min-h-0">
        <div className="flex-[65] border-r" style={{ borderColor: '#30363D' }}>
          Diff Viewer
        </div>
        <div className="flex-[35]">
          AI Panel
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-8 shrink-0" style={{ background: '#161B22', borderTop: '1px solid #30363D' }}>
        Status Bar
      </div>
    </div>
  )
}
```

**Step 5: Verify dev server starts**

```bash
npm run dev
```
Expected: Vite dev server starts, browser shows dark layout with 3 placeholder sections.

**Step 6: Commit**

```bash
git add src/lib/tokens.ts src/index.css src/main.tsx src/App.tsx
git commit -m "feat: add design tokens, global styles, and app shell layout"
```

---

### Task 3: Diff Parser Utility (TDD)

**Files:**
- Create: `server/utils/diff-parser.ts`
- Create: `server/utils/__tests__/diff-parser.test.ts`

**Step 1: Write the failing test**

Create `server/utils/__tests__/diff-parser.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { parseDiff } from '../diff-parser'

const SAMPLE_DIFF = `diff --git a/src/auth/AuthProvider.tsx b/src/auth/AuthProvider.tsx
index 1234567..abcdefg 100644
--- a/src/auth/AuthProvider.tsx
+++ b/src/auth/AuthProvider.tsx
@@ -14,9 +14,18 @@
   const [user, setUser] = useState(null);
   const [loading, setLoading] = useState(true);

-  useEffect(() => {
-    fetchUser();
-  }, []);
+  const initAuth = useCallback(async () => {
+    try {
+      const session = await getSession();
+      if (session?.user) {
+        setUser(session.user);
+      }
+    } catch (error) {
+      console.error('Auth failed:', error);
+    } finally {
+      setLoading(false);
+    }
+  }, []);

+  useEffect(() => {
+    initAuth();
+  }, [initAuth]);`

describe('parseDiff', () => {
  it('parses file path from diff header', () => {
    const result = parseDiff(SAMPLE_DIFF)
    expect(result).toHaveLength(1)
    expect(result[0].path).toBe('src/auth/AuthProvider.tsx')
  })

  it('counts additions and deletions', () => {
    const result = parseDiff(SAMPLE_DIFF)
    expect(result[0].additions).toBe(15)
    expect(result[0].deletions).toBe(3)
  })

  it('classifies line types correctly', () => {
    const result = parseDiff(SAMPLE_DIFF)
    const lines = result[0].lines
    const contextLines = lines.filter(l => l.type === 'context')
    const addLines = lines.filter(l => l.type === 'addition')
    const delLines = lines.filter(l => l.type === 'deletion')

    expect(contextLines.length).toBe(3)
    expect(addLines.length).toBe(15)
    expect(delLines.length).toBe(3)
  })

  it('preserves line content without +/- prefix', () => {
    const result = parseDiff(SAMPLE_DIFF)
    const firstDeletion = result[0].lines.find(l => l.type === 'deletion')
    expect(firstDeletion?.content).toBe('  useEffect(() => {')
  })

  it('assigns correct line numbers', () => {
    const result = parseDiff(SAMPLE_DIFF)
    const firstLine = result[0].lines[0]
    expect(firstLine.lineNumber).toBe(14)
    expect(firstLine.type).toBe('context')
  })

  it('handles multiple files in one diff', () => {
    const multiDiff = SAMPLE_DIFF + `\ndiff --git a/src/utils/helpers.ts b/src/utils/helpers.ts
index 1111111..2222222 100644
--- a/src/utils/helpers.ts
+++ b/src/utils/helpers.ts
@@ -1,3 +1,4 @@
 export function helper() {
+  console.log('added');
   return true;
 }`
    const result = parseDiff(multiDiff)
    expect(result).toHaveLength(2)
    expect(result[1].path).toBe('src/utils/helpers.ts')
    expect(result[1].additions).toBe(1)
    expect(result[1].deletions).toBe(0)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run server/utils/__tests__/diff-parser.test.ts
```
Expected: FAIL — module `../diff-parser` not found.

**Step 3: Implement the diff parser**

Create `server/utils/diff-parser.ts`:
```typescript
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

export function parseDiff(rawDiff: string): DiffFile[] {
  const files: DiffFile[] = []
  const fileSections = rawDiff.split(/^diff --git /m).filter(Boolean)

  for (const section of fileSections) {
    const headerMatch = section.match(/a\/(.+?) b\/(.+)/)
    if (!headerMatch) continue

    const path = headerMatch[2]
    const lines: DiffLine[] = []
    let additions = 0
    let deletions = 0

    const hunks = section.split(/^@@\s+-\d+(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@.*$/m)

    for (let h = 1; h < hunks.length; h += 2) {
      let lineNum = parseInt(hunks[h], 10)
      const hunkBody = hunks[h + 1]
      if (!hunkBody) continue

      const hunkLines = hunkBody.split('\n')

      for (const line of hunkLines) {
        if (line.startsWith('+')) {
          lines.push({ type: 'addition', lineNumber: lineNum, content: line.slice(1) })
          additions++
          lineNum++
        } else if (line.startsWith('-')) {
          lines.push({ type: 'deletion', lineNumber: lineNum, content: line.slice(1) })
          deletions++
        } else if (line.startsWith(' ') || line === '') {
          if (line !== '' || lines.length > 0) {
            lines.push({ type: 'context', lineNumber: lineNum, content: line.startsWith(' ') ? line.slice(1) : '' })
            lineNum++
          }
        }
      }
    }

    files.push({ path, additions, deletions, lines })
  }

  return files
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run server/utils/__tests__/diff-parser.test.ts
```
Expected: ALL PASS (6 tests).

**Step 5: Commit**

```bash
git add server/utils/diff-parser.ts server/utils/__tests__/diff-parser.test.ts
git commit -m "feat: add unified diff parser with tests"
```

---

### Task 4: Git Service (TDD)

**Files:**
- Create: `server/services/git.service.ts`
- Create: `server/services/__tests__/git.service.test.ts`

**Step 1: Write the failing test**

Create `server/services/__tests__/git.service.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GitService } from '../git.service'

vi.mock('simple-git', () => {
  const mockGit = {
    branch: vi.fn(),
    raw: vi.fn(),
    diff: vi.fn(),
    revparse: vi.fn(),
    getRemotes: vi.fn(),
  }
  return { default: vi.fn(() => mockGit), simpleGit: vi.fn(() => mockGit) }
})

import simpleGit from 'simple-git'

describe('GitService', () => {
  let service: GitService
  let mockGit: any

  beforeEach(() => {
    mockGit = simpleGit()
    service = new GitService('/fake/repo')
  })

  it('gets current branch name', async () => {
    mockGit.branch.mockResolvedValue({ current: 'feature/auth' })
    const branch = await service.getCurrentBranch()
    expect(branch).toBe('feature/auth')
  })

  it('detects base branch from tracking', async () => {
    mockGit.raw.mockImplementation((args: string[]) => {
      if (args.includes('rev-parse') || args[0] === 'rev-parse') return Promise.resolve('develop\n')
      if (args.includes('merge-base')) return Promise.resolve('abc123\n')
      return Promise.resolve('')
    })
    const base = await service.getBaseBranch('feature/auth')
    expect(base).toBe('develop')
  })

  it('gets diff between branches', async () => {
    mockGit.diff.mockResolvedValue('diff --git a/file.ts b/file.ts\n...')
    const diff = await service.getDiff('develop', 'feature/auth')
    expect(diff).toContain('diff --git')
  })

  it('gets repo name from remote', async () => {
    mockGit.getRemotes.mockResolvedValue([{ name: 'origin', refs: { fetch: 'git@github.com:acme/web-platform.git' } }])
    const name = await service.getRepoName()
    expect(name).toBe('acme/web-platform')
  })

  it('counts commits ahead/behind', async () => {
    mockGit.raw.mockResolvedValue('3\t1\n')
    const result = await service.getAheadBehind('develop', 'feature/auth')
    expect(result).toEqual({ ahead: 3, behind: 1 })
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run server/services/__tests__/git.service.test.ts
```
Expected: FAIL — module `../git.service` not found.

**Step 3: Implement the git service**

Create `server/services/git.service.ts`:
```typescript
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
      // Fallback: try common base branches
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
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run server/services/__tests__/git.service.test.ts
```
Expected: ALL PASS (5 tests).

**Step 5: Commit**

```bash
git add server/services/git.service.ts server/services/__tests__/git.service.test.ts
git commit -m "feat: add git service with branch detection and diff retrieval"
```

---

### Task 5: AI Service (TDD)

**Files:**
- Create: `server/services/ai.service.ts`
- Create: `server/services/__tests__/ai.service.test.ts`

**Step 1: Write the failing test**

Create `server/services/__tests__/ai.service.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { AiService } from '../ai.service'

vi.mock('child_process', () => ({
  spawn: vi.fn(() => {
    const { EventEmitter } = require('events')
    const { Readable } = require('stream')
    const proc = new EventEmitter()
    const stdout = new Readable({ read() {} })
    const stderr = new Readable({ read() {} })
    proc.stdout = stdout
    proc.stderr = stderr

    setTimeout(() => {
      stdout.push('This change refactors the auth logic.')
      stdout.push(null)
      proc.emit('close', 0)
    }, 10)

    return proc
  }),
}))

describe('AiService', () => {
  it('builds the correct prompt with diff content', () => {
    const service = new AiService()
    const prompt = service.buildPrompt('some diff content')
    expect(prompt).toContain('some diff content')
    expect(prompt).toContain('git diff')
  })

  it('returns a readable stream from claude CLI', async () => {
    const service = new AiService()
    const stream = service.analyze('claude', 'some diff')
    const chunks: string[] = []

    for await (const chunk of stream) {
      chunks.push(chunk)
    }

    expect(chunks.join('')).toContain('refactors the auth')
  })

  it('gets the command args for claude provider', () => {
    const service = new AiService()
    const { command, args } = service.getCommand('claude', 'test prompt')
    expect(command).toBe('claude')
    expect(args).toContain('-p')
  })

  it('gets the command args for openai provider', () => {
    const service = new AiService()
    const { command, args } = service.getCommand('openai', 'test prompt')
    expect(command).toBe('openai')
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run server/services/__tests__/ai.service.test.ts
```
Expected: FAIL — module `../ai.service` not found.

**Step 3: Implement the AI service**

Create `server/services/ai.service.ts`:
```typescript
import { spawn } from 'child_process'

export type AiProvider = 'claude' | 'openai'

export class AiService {
  buildPrompt(diff: string): string {
    return `You are a senior software engineer. Analyze this git diff and provide a concise explanation:

1. What changed and why it matters
2. Key improvements or patterns introduced
3. Any potential risks or concerns

Keep it concise with bullet points. Do not repeat the code.

\`\`\`diff
${diff}
\`\`\``
  }

  getCommand(provider: AiProvider, prompt: string): { command: string; args: string[] } {
    if (provider === 'claude') {
      return { command: 'claude', args: ['-p', prompt] }
    }
    return {
      command: 'openai',
      args: ['api', 'chat.completions.create', '-m', 'gpt-4o', '-g', 'user', prompt],
    }
  }

  async *analyze(provider: AiProvider, diff: string): AsyncGenerator<string> {
    const prompt = this.buildPrompt(diff)
    const { command, args } = this.getCommand(provider, prompt)

    const env = { ...process.env }
    delete env.CLAUDECODE

    const proc = spawn(command, args, { env })

    const chunks: Promise<string | null> = new Promise((resolve, reject) => {
      let data = ''
      proc.stdout.on('data', (chunk: Buffer) => {
        data += chunk.toString()
      })
      proc.stdout.on('end', () => resolve(data))
      proc.stderr.on('data', (chunk: Buffer) => {
        const err = chunk.toString()
        if (err.trim()) reject(new Error(err))
      })
      proc.on('error', reject)
    })

    const result = await chunks
    if (result) {
      // Simulate streaming by yielding chunks
      const words = result.split(' ')
      for (let i = 0; i < words.length; i += 3) {
        yield words.slice(i, i + 3).join(' ') + ' '
      }
    }
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run server/services/__tests__/ai.service.test.ts
```
Expected: ALL PASS (4 tests).

**Step 5: Commit**

```bash
git add server/services/ai.service.ts server/services/__tests__/ai.service.test.ts
git commit -m "feat: add AI service with claude and openai CLI integration"
```

---

### Task 6: Express Server & API Routes

**Files:**
- Create: `server/index.ts`
- Create: `server/routes/git.ts`
- Create: `server/routes/ai.ts`

**Step 1: Create git API routes**

Create `server/routes/git.ts`:
```typescript
import { Router, type Request, type Response } from 'express'
import { GitService } from '../services/git.service'
import { parseDiff } from '../utils/diff-parser'

export function createGitRouter(repoPath: string): Router {
  const router = Router()
  const gitService = new GitService(repoPath)

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
    } catch (error) {
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
        files,
        summary: {
          filesChanged: files.length,
          totalAdditions,
          totalDeletions,
        },
      })
    } catch (error) {
      res.status(500).json({ error: 'Failed to compute diff' })
    }
  })

  return router
}
```

**Step 2: Create AI API route with SSE**

Create `server/routes/ai.ts`:
```typescript
import { Router, type Request, type Response } from 'express'
import { AiService, type AiProvider } from '../services/ai.service'

export function createAiRouter(): Router {
  const router = Router()
  const aiService = new AiService()

  router.post('/analyze', async (req: Request, res: Response) => {
    const { provider = 'claude', diff } = req.body as { provider?: AiProvider; diff?: string }

    if (!diff) {
      res.status(400).json({ error: 'diff is required' })
      return
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })

    try {
      for await (const chunk of aiService.analyze(provider, diff)) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`)
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: 'AI analysis failed' })}\n\n`)
    } finally {
      res.end()
    }
  })

  return router
}
```

**Step 3: Create Express server entry point**

Create `server/index.ts`:
```typescript
import express from 'express'
import cors from 'cors'
import path from 'path'
import { createGitRouter } from './routes/git'
import { createAiRouter } from './routes/ai'

export function createServer(repoPath: string) {
  const app = express()

  app.use(cors())
  app.use(express.json({ limit: '5mb' }))

  // API routes
  app.use('/api/git', createGitRouter(repoPath))
  app.use('/api/ai', createAiRouter())

  // Serve static frontend in production
  const distPath = path.join(import.meta.dirname, '..', 'dist')
  app.use(express.static(distPath))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })

  return app
}

// Direct execution (dev mode)
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  const repoPath = process.env.REPO_PATH || process.cwd()
  const port = parseInt(process.env.PORT || '4321', 10)
  const app = createServer(repoPath)
  app.listen(port, () => {
    console.log(`VisualGit server running at http://localhost:${port}`)
    console.log(`Repo: ${repoPath}`)
  })
}
```

**Step 4: Verify server starts**

```bash
REPO_PATH=/Users/juanchirossi/Documents/Proyectos/visualgit npx tsx server/index.ts
```
Expected: "VisualGit server running at http://localhost:4321"

Stop the server (Ctrl+C).

**Step 5: Commit**

```bash
git add server/index.ts server/routes/git.ts server/routes/ai.ts
git commit -m "feat: add express server with git and AI API routes"
```

---

### Task 7: Header Component

**Files:**
- Create: `src/components/Header.tsx`
- Modify: `src/App.tsx`

**Step 1: Create Header component**

Create `src/components/Header.tsx`:
```typescript
import { GitBranch, ArrowLeft, Circle } from 'lucide-react'

interface HeaderProps {
  repoName: string
  currentBranch: string
  baseBranch: string
  ahead: number
  behind: number
}

export function Header({ repoName, currentBranch, baseBranch, ahead, behind }: HeaderProps) {
  return (
    <header
      className="h-12 shrink-0 flex items-center justify-between px-6"
      style={{ borderBottom: '1px solid #30363D' }}
    >
      {/* Left side */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <GitBranch size={16} color="#E6EDF3" />
          <span style={{ color: '#E6EDF3', fontSize: '14px' }}>{repoName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: '#58A6FF', fontSize: '13px' }}>{currentBranch}</span>
          <ArrowLeft size={14} color="#8B949E" />
          <span style={{ color: '#8B949E', fontSize: '13px' }}>{baseBranch}</span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <Circle size={8} fill="#2EA043" color="#2EA043" />
        <span style={{ color: '#8B949E', fontSize: '12px' }}>
          {ahead} ahead, {behind} behind
        </span>
      </div>
    </header>
  )
}
```

**Step 2: Wire into App.tsx**

Replace the Header placeholder in `src/App.tsx` with:
```typescript
import { Header } from './components/Header'

// In the JSX, replace the header div:
<Header
  repoName="loading..."
  currentBranch="..."
  baseBranch="..."
  ahead={0}
  behind={0}
/>
```

**Step 3: Verify visually**

```bash
npm run dev
```
Expected: Header renders with placeholder text, correct dark styling, border at bottom.

**Step 4: Commit**

```bash
git add src/components/Header.tsx src/App.tsx
git commit -m "feat: add Header component with branch info display"
```

---

### Task 8: DiffViewer Component

**Files:**
- Create: `src/components/DiffViewer.tsx`
- Create: `src/components/DiffLine.tsx`
- Create: `src/components/FileHeader.tsx`
- Modify: `src/App.tsx`

**Step 1: Create FileHeader component**

Create `src/components/FileHeader.tsx`:
```typescript
import { ChevronDown, FileCode } from 'lucide-react'

interface FileHeaderProps {
  path: string
  additions: number
  deletions: number
}

export function FileHeader({ path, additions, deletions }: FileHeaderProps) {
  return (
    <div
      className="h-10 flex items-center justify-between px-4 shrink-0"
      style={{ background: '#161B22', borderBottom: '1px solid #30363D' }}
    >
      <div className="flex items-center gap-2">
        <ChevronDown size={14} color="#8B949E" />
        <FileCode size={14} color="#8B949E" />
        <span style={{ color: '#E6EDF3', fontSize: '13px' }}>{path}</span>
      </div>
      <div className="flex items-center gap-3">
        <span style={{ color: '#2EA043', fontSize: '12px' }}>+{additions}</span>
        <span style={{ color: '#F85149', fontSize: '12px' }}>-{deletions}</span>
      </div>
    </div>
  )
}
```

**Step 2: Create DiffLine component**

Create `src/components/DiffLine.tsx`:
```typescript
interface DiffLineProps {
  type: 'context' | 'addition' | 'deletion'
  lineNumber: number
  content: string
}

const lineStyles = {
  context: { bg: 'transparent', text: '#8B949E', ln: '#484F58', prefix: ' ' },
  addition: { bg: '#1B3826', text: '#2EA043', ln: '#2EA043', prefix: '+' },
  deletion: { bg: '#3D1F1F', text: '#F85149', ln: '#F85149', prefix: '-' },
}

export function DiffLine({ type, lineNumber, content }: DiffLineProps) {
  const style = lineStyles[type]

  return (
    <div
      className="flex items-center h-[22px] w-full"
      style={{ background: style.bg }}
    >
      <span
        className="w-12 shrink-0 text-right pr-3 select-none"
        style={{ color: style.ln, fontSize: '12px' }}
      >
        {lineNumber}
      </span>
      <span
        className="flex-1 whitespace-pre"
        style={{ color: style.text, fontSize: '12px' }}
      >
        {type !== 'context' ? style.prefix : ' '}{content}
      </span>
    </div>
  )
}
```

**Step 3: Create DiffViewer component**

Create `src/components/DiffViewer.tsx`:
```typescript
import { FileHeader } from './FileHeader'
import { DiffLine } from './DiffLine'

interface DiffLineData {
  type: 'context' | 'addition' | 'deletion'
  lineNumber: number
  content: string
}

interface DiffFileData {
  path: string
  additions: number
  deletions: number
  lines: DiffLineData[]
}

interface DiffViewerProps {
  files: DiffFileData[]
  selectedFile: number
  onSelectFile: (index: number) => void
}

export function DiffViewer({ files, selectedFile }: DiffViewerProps) {
  const file = files[selectedFile]

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ color: '#8B949E' }}>
        No diff available. Are you on a feature branch?
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <FileHeader path={file.path} additions={file.additions} deletions={file.deletions} />
      <div className="flex-1 overflow-y-auto py-3">
        {file.lines.map((line, i) => (
          <DiffLine key={i} type={line.type} lineNumber={line.lineNumber} content={line.content} />
        ))}
      </div>
    </div>
  )
}
```

**Step 4: Wire into App.tsx with mock data**

Update `src/App.tsx` to import and render `<DiffViewer />` with hardcoded sample data for visual verification.

**Step 5: Verify visually**

```bash
npm run dev
```
Expected: Left panel shows file header + colored diff lines matching the Pencil design.

**Step 6: Commit**

```bash
git add src/components/FileHeader.tsx src/components/DiffLine.tsx src/components/DiffViewer.tsx src/App.tsx
git commit -m "feat: add DiffViewer with FileHeader and colored DiffLine components"
```

---

### Task 9: AI Panel Component

**Files:**
- Create: `src/components/AiPanel.tsx`
- Modify: `src/App.tsx`

**Step 1: Create AiPanel component**

Create `src/components/AiPanel.tsx`:
```typescript
import { ChevronDown, RefreshCw } from 'lucide-react'

interface AiPanelProps {
  analysis: string
  isLoading: boolean
  provider: 'claude' | 'openai'
  onProviderChange: (provider: 'claude' | 'openai') => void
  onReanalyze: () => void
}

export function AiPanel({ analysis, isLoading, provider, onProviderChange, onReanalyze }: AiPanelProps) {
  return (
    <div className="flex flex-col h-full p-5 gap-4" style={{ background: '#0D1117' }}>
      {/* Panel Header */}
      <div className="flex items-center justify-between shrink-0">
        <span style={{ color: '#E6EDF3', fontSize: '13px' }}>AI Analysis</span>
        <button
          className="flex items-center gap-1.5 px-2.5 py-1.5"
          style={{ border: '1px solid #30363D', background: 'transparent' }}
          onClick={() => onProviderChange(provider === 'claude' ? 'openai' : 'claude')}
        >
          <span style={{ color: '#E6EDF3', fontSize: '12px' }}>
            {provider === 'claude' ? 'Claude' : 'OpenAI'}
          </span>
          <ChevronDown size={12} color="#8B949E" />
        </button>
      </div>

      {/* Divider */}
      <div className="w-full h-px shrink-0" style={{ background: '#30363D' }} />

      {/* Analysis Content */}
      <div className="flex-1 overflow-y-auto" style={{ fontSize: '12px', lineHeight: '1.6' }}>
        {analysis ? (
          <div className="whitespace-pre-wrap" style={{ color: '#E6EDF3' }}>
            {analysis}
            {isLoading && (
              <span
                className="inline-block w-[2px] h-[14px] ml-0.5 cursor-blink align-middle"
                style={{ background: '#58A6FF' }}
              />
            )}
          </div>
        ) : isLoading ? (
          <div className="flex items-center gap-1">
            <span style={{ color: '#8B949E' }}>Analyzing diff</span>
            <span
              className="inline-block w-[2px] h-[14px] cursor-blink"
              style={{ background: '#58A6FF' }}
            />
          </div>
        ) : (
          <span style={{ color: '#8B949E' }}>Click Re-analyze or wait for automatic analysis.</span>
        )}
      </div>

      {/* Re-analyze Button */}
      <button
        className="flex items-center justify-center gap-1.5 py-2 px-3 shrink-0"
        style={{ border: '1px solid #30363D', background: 'transparent' }}
        onClick={onReanalyze}
        disabled={isLoading}
      >
        <RefreshCw size={14} color="#58A6FF" />
        <span style={{ color: '#58A6FF', fontSize: '12px' }}>Re-analyze</span>
      </button>
    </div>
  )
}
```

**Step 2: Wire into App.tsx**

Update `src/App.tsx` to import and render `<AiPanel />` in the right panel with mock state.

**Step 3: Verify visually**

```bash
npm run dev
```
Expected: Right panel shows AI Analysis title, provider dropdown, analysis text area, blinking cursor, and Re-analyze button matching the Pencil design.

**Step 4: Commit**

```bash
git add src/components/AiPanel.tsx src/App.tsx
git commit -m "feat: add AiPanel component with provider selector and streaming indicator"
```

---

### Task 10: StatusBar Component

**Files:**
- Create: `src/components/StatusBar.tsx`
- Modify: `src/App.tsx`

**Step 1: Create StatusBar component**

Create `src/components/StatusBar.tsx`:
```typescript
import { Terminal } from 'lucide-react'

interface StatusBarProps {
  filesChanged: number
  totalAdditions: number
  totalDeletions: number
}

export function StatusBar({ filesChanged, totalAdditions, totalDeletions }: StatusBarProps) {
  return (
    <footer
      className="h-8 shrink-0 flex items-center justify-between px-6"
      style={{ background: '#161B22', borderTop: '1px solid #30363D' }}
    >
      <div className="flex items-center gap-4">
        <span style={{ color: '#8B949E', fontSize: '12px' }}>
          {filesChanged} file{filesChanged !== 1 ? 's' : ''} changed
        </span>
        <span style={{ color: '#2EA043', fontSize: '12px' }}>
          {totalAdditions} insertion{totalAdditions !== 1 ? 's' : ''}(+)
        </span>
        <span style={{ color: '#F85149', fontSize: '12px' }}>
          {totalDeletions} deletion{totalDeletions !== 1 ? 's' : ''}(-)
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Terminal size={12} color="#484F58" />
        <span style={{ color: '#484F58', fontSize: '11px' }}>diff --git</span>
      </div>
    </footer>
  )
}
```

**Step 2: Wire into App.tsx**

Replace the StatusBar placeholder in `src/App.tsx`.

**Step 3: Verify visually**

```bash
npm run dev
```
Expected: Footer shows stats in correct colors, terminal icon on right.

**Step 4: Commit**

```bash
git add src/components/StatusBar.tsx src/App.tsx
git commit -m "feat: add StatusBar component with diff statistics"
```

---

### Task 11: Frontend Hooks (Data Fetching & AI Streaming)

**Files:**
- Create: `src/hooks/useGitData.ts`
- Create: `src/hooks/useAiAnalysis.ts`

**Step 1: Create useGitData hook**

Create `src/hooks/useGitData.ts`:
```typescript
import { useState, useEffect } from 'react'

interface GitInfo {
  repoName: string
  currentBranch: string
  baseBranch: string
  ahead: number
  behind: number
}

interface DiffLine {
  type: 'context' | 'addition' | 'deletion'
  lineNumber: number
  content: string
}

interface DiffFile {
  path: string
  additions: number
  deletions: number
  lines: DiffLine[]
}

interface DiffData {
  files: DiffFile[]
  summary: {
    filesChanged: number
    totalAdditions: number
    totalDeletions: number
  }
}

export function useGitData() {
  const [info, setInfo] = useState<GitInfo | null>(null)
  const [diff, setDiff] = useState<DiffData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [infoRes, diffRes] = await Promise.all([
          fetch('/api/git/info'),
          fetch('/api/git/diff'),
        ])

        if (!infoRes.ok || !diffRes.ok) throw new Error('Failed to fetch git data')

        setInfo(await infoRes.json())
        setDiff(await diffRes.json())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { info, diff, loading, error }
}
```

**Step 2: Create useAiAnalysis hook**

Create `src/hooks/useAiAnalysis.ts`:
```typescript
import { useState, useCallback } from 'react'

type Provider = 'claude' | 'openai'

export function useAiAnalysis() {
  const [analysis, setAnalysis] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [provider, setProvider] = useState<Provider>('claude')

  const analyze = useCallback(async (diff: string) => {
    setIsLoading(true)
    setAnalysis('')

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, diff }),
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('No stream available')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          const json = JSON.parse(line.slice(6))
          if (json.done) break
          if (json.error) throw new Error(json.error)
          if (json.text) {
            setAnalysis(prev => prev + json.text)
          }
        }
      }
    } catch (err) {
      setAnalysis(prev => prev + '\n\n[Error: AI analysis failed]')
    } finally {
      setIsLoading(false)
    }
  }, [provider])

  return { analysis, isLoading, provider, setProvider, analyze }
}
```

**Step 3: Commit**

```bash
git add src/hooks/useGitData.ts src/hooks/useAiAnalysis.ts
git commit -m "feat: add useGitData and useAiAnalysis hooks for data fetching"
```

---

### Task 12: Wire Everything Together in App.tsx

**Files:**
- Modify: `src/App.tsx`

**Step 1: Integrate all components with real data**

Rewrite `src/App.tsx`:
```typescript
import { useState, useEffect } from 'react'
import { Header } from './components/Header'
import { DiffViewer } from './components/DiffViewer'
import { AiPanel } from './components/AiPanel'
import { StatusBar } from './components/StatusBar'
import { useGitData } from './hooks/useGitData'
import { useAiAnalysis } from './hooks/useAiAnalysis'

export default function App() {
  const { info, diff, loading, error } = useGitData()
  const { analysis, isLoading: aiLoading, provider, setProvider, analyze } = useAiAnalysis()
  const [selectedFile, setSelectedFile] = useState(0)

  // Auto-analyze when diff loads
  useEffect(() => {
    if (diff?.files.length) {
      const rawDiff = diff.files
        .map(f => {
          const lines = f.lines.map(l => {
            const prefix = l.type === 'addition' ? '+' : l.type === 'deletion' ? '-' : ' '
            return prefix + l.content
          }).join('\n')
          return `--- a/${f.path}\n+++ b/${f.path}\n${lines}`
        })
        .join('\n')
      analyze(rawDiff)
    }
  }, [diff])

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ background: '#0D1117', color: '#8B949E', fontSize: '14px' }}>
        Loading repository...
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ background: '#0D1117', color: '#F85149', fontSize: '14px' }}>
        {error}
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex flex-col" style={{ background: '#0D1117' }}>
      <Header
        repoName={info?.repoName ?? 'unknown'}
        currentBranch={info?.currentBranch ?? ''}
        baseBranch={info?.baseBranch ?? ''}
        ahead={info?.ahead ?? 0}
        behind={info?.behind ?? 0}
      />

      <div className="flex-1 flex min-h-0">
        <div className="flex-[65] min-w-0" style={{ borderRight: '1px solid #30363D' }}>
          <DiffViewer
            files={diff?.files ?? []}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
          />
        </div>
        <div className="flex-[35] min-w-0">
          <AiPanel
            analysis={analysis}
            isLoading={aiLoading}
            provider={provider}
            onProviderChange={setProvider}
            onReanalyze={() => {
              if (diff?.files.length) {
                const rawDiff = diff.files
                  .map(f => {
                    const lines = f.lines.map(l => {
                      const prefix = l.type === 'addition' ? '+' : l.type === 'deletion' ? '-' : ' '
                      return prefix + l.content
                    }).join('\n')
                    return `--- a/${f.path}\n+++ b/${f.path}\n${lines}`
                  })
                  .join('\n')
                analyze(rawDiff)
              }
            }}
          />
        </div>
      </div>

      <StatusBar
        filesChanged={diff?.summary.filesChanged ?? 0}
        totalAdditions={diff?.summary.totalAdditions ?? 0}
        totalDeletions={diff?.summary.totalDeletions ?? 0}
      />
    </div>
  )
}
```

**Step 2: Run full stack and verify**

Terminal 1:
```bash
REPO_PATH=$(pwd) npx tsx server/index.ts
```

Terminal 2:
```bash
npm run dev
```

Expected: Full app renders with real git data (or graceful error if on main branch).

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: integrate all components with real git data and AI analysis"
```

---

### Task 13: CLI Entry Point (`bin/cli.js`)

**Files:**
- Create: `bin/cli.js`
- Modify: `package.json`

**Step 1: Create CLI script**

Create `bin/cli.js`:
```javascript
#!/usr/bin/env node

import { existsSync } from 'fs'
import { resolve } from 'path'
import { pathToFileURL } from 'url'

const repoPath = process.cwd()

// Validate git repo
if (!existsSync(resolve(repoPath, '.git'))) {
  console.error('\x1b[31mError:\x1b[0m Not a git repository.')
  console.error('Run this command from inside a git repository.')
  process.exit(1)
}

async function main() {
  const { createServer } = await import('../server/index.ts')
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
```

**Step 2: Update package.json**

Add to `package.json`:
```json
{
  "name": "visualgit",
  "bin": {
    "visualgit": "./bin/cli.js"
  },
  "files": [
    "bin/",
    "dist/",
    "server/"
  ]
}
```

**Step 3: Test CLI locally**

```bash
npm run build
node bin/cli.js
```
Expected: Server starts, browser opens at `http://localhost:4321`, shows the app.

**Step 4: Commit**

```bash
git add bin/cli.js package.json
git commit -m "feat: add CLI entry point for npx visualgit execution"
```

---

### Task 14: Vitest Configuration & Run All Tests

**Files:**
- Create: `vitest.config.ts`

**Step 1: Create vitest config**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['server/**/__tests__/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
```

**Step 2: Run all tests**

```bash
npx vitest run
```
Expected: ALL PASS — diff-parser (6 tests), git.service (5 tests), ai.service (4 tests).

**Step 3: Commit**

```bash
git add vitest.config.ts
git commit -m "chore: add vitest configuration and verify all tests pass"
```

---

### Task 15: Build Script & Final Polish

**Files:**
- Create: `server/build.ts`
- Modify: `package.json`

**Step 1: Create build script**

Create `server/build.ts`:
```typescript
// Vite build is handled by `vite build` in the npm script.
// This file handles any additional server-side build steps if needed.
console.log('Build complete. Frontend at dist/, server ready.')
```

**Step 2: Verify full build and production run**

```bash
npm run build && node bin/cli.js
```
Expected: Vite builds to `dist/`, server starts, browser opens, full app works.

**Step 3: Final commit**

```bash
git add -A
git commit -m "chore: add build script and finalize project structure"
```

---

## Summary

| Task | What | Tests |
|------|------|-------|
| 1 | Project scaffold, deps, configs | — |
| 2 | Design tokens, CSS, App shell | Visual |
| 3 | Diff parser | 6 unit tests |
| 4 | Git service | 5 unit tests |
| 5 | AI service | 4 unit tests |
| 6 | Express server + API routes | Manual |
| 7 | Header component | Visual |
| 8 | DiffViewer + DiffLine + FileHeader | Visual |
| 9 | AiPanel component | Visual |
| 10 | StatusBar component | Visual |
| 11 | Frontend hooks | — |
| 12 | Full integration in App.tsx | E2E manual |
| 13 | CLI entry point | Manual |
| 14 | Vitest config + run all | 15 tests |
| 15 | Build + polish | Manual |
