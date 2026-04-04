import { spawn } from 'child_process'
import type { AiProvider, AnalysisMode, ClaudeModel } from '../../shared/types.js'

function createAbortError(): Error {
  const error = new Error('Analysis aborted')
  error.name = 'AbortError'
  return error
}

export class AiService {
  buildPrompt(mode: AnalysisMode, content: string, filePath?: string): string {
    const systemRules = [
      'Format your response using Markdown (headings, bold, bullet points, inline code).',
      'NEVER ask questions, suggest next steps, or offer to do anything. This is a read-only report.',
      'NEVER repeat the source code in your response.',
      'Be concise. Use bullet points, not paragraphs.',
    ].join(' ')

    if (mode === 'selection') {
      return `Analyze this code snippet${filePath ? ` from ${filePath}` : ''}. Follow this exact structure:\n\n## What It Does\n(Brief explanation)\n\n## Issues\n(Bugs, risks, or anti-patterns found — or "None found")\n\n## Improvements\n(Concrete suggestions — or "Looks good")\n\n${systemRules}\n\n\`\`\`\n${content}\n\`\`\``
    }
    if (mode === 'file') {
      return `Analyze the changes in ${filePath || 'this file'}. Follow this exact structure:\n\n## Summary\n(What changed in 1-2 sentences)\n\n## Changes\n(Bullet list of each meaningful change)\n\n## Risks\n(Potential issues — or "None identified")\n\n## Verdict\n(One-line assessment: safe to merge, needs review, or has issues)\n\n${systemRules}\n\n\`\`\`diff\n${content}\n\`\`\``
    }
    return `You are a senior software engineer reviewing a git diff. Follow this exact structure:\n\n## Summary\n(Executive summary in 2-3 sentences)\n\n## Changes by File\n(Group changes by file, bullet points per file)\n\n## Patterns\n(Key improvements or patterns introduced — or "No notable patterns")\n\n## Risks\n(Potential issues or concerns — or "None identified")\n\n## Verdict\n(One-line overall assessment)\n\n${systemRules}\n\n\`\`\`diff\n${content}\n\`\`\``
  }

  getCommand(provider: AiProvider, model: ClaudeModel = 'sonnet'): { command: string; args: string[]; useStdin: boolean } {
    if (provider === 'claude') {
      return { command: 'claude', args: ['-p', '--model', model], useStdin: true }
    }
    return {
      command: 'codex',
      args: ['exec', '--full-auto'],
      useStdin: true,
    }
  }

  async *analyze(
    provider: AiProvider,
    mode: AnalysisMode,
    content: string,
    filePath?: string,
    model?: ClaudeModel,
    repoPath?: string,
    signal?: AbortSignal,
  ): AsyncGenerator<string> {
    const prompt = this.buildPrompt(mode, content, filePath)
    const { command, args, useStdin } = this.getCommand(provider, model)

    const env = { ...process.env }
    delete env.CLAUDECODE

    const cwd = repoPath || process.cwd()
    const proc = spawn(command, args, { env, cwd, stdio: ['pipe', 'pipe', 'pipe'] })
    const timeout = setTimeout(() => {
      if (!proc.killed) {
        proc.kill()
      }
    }, 120000)

    const handleAbort = () => {
      if (!proc.killed) {
        proc.kill()
      }
    }

    signal?.addEventListener('abort', handleAbort, { once: true })

    if (useStdin) {
      proc.stdin.write(prompt)
      proc.stdin.end()
    }

    try {
      const result: string = await new Promise((resolve, reject) => {
        let data = ''
        let stderr = ''
        proc.stdout.on('data', (chunk: Buffer) => {
          data += chunk.toString()
        })
        proc.stderr.on('data', (chunk: Buffer) => {
          stderr += chunk.toString()
        })
        proc.on('error', reject)
        proc.on('close', (code) => {
          if (signal?.aborted) {
            reject(createAbortError())
            return
          }

          if (code !== 0 && !data) {
            reject(new Error(stderr.trim() || `Process exited with code ${code}`))
            return
          }

          resolve(data)
        })
      })

      if (result) {
        const words = result.split(' ')
        for (let i = 0; i < words.length; i += 3) {
          yield words.slice(i, i + 3).join(' ') + ' '
        }
      }
    } finally {
      clearTimeout(timeout)
      signal?.removeEventListener('abort', handleAbort)
    }
  }
}
