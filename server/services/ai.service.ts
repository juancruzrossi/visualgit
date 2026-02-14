import { spawn } from 'child_process'

export type AiProvider = 'claude' | 'openai'
export type AnalysisMode = 'full' | 'file' | 'selection'
export type ClaudeModel = 'opus' | 'sonnet' | 'haiku'

export class AiService {
  private hasConversation = false

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
      const args = ['-p', '--model', model]
      if (this.hasConversation) args.push('--continue')
      return { command: 'claude', args, useStdin: true }
    }
    return {
      command: 'openai',
      args: ['api', 'chat.completions.create', '-m', 'gpt-4o', '-g', 'user'],
      useStdin: true,
    }
  }

  async *analyze(provider: AiProvider, mode: AnalysisMode, content: string, filePath?: string, model?: ClaudeModel, repoPath?: string): AsyncGenerator<string> {
    const prompt = this.buildPrompt(mode, content, filePath)
    const { command, args, useStdin } = this.getCommand(provider, model)

    const env = { ...process.env }
    delete env.CLAUDECODE

    const cwd = repoPath || process.cwd()
    const proc = spawn(command, args, { env, cwd, stdio: ['pipe', 'pipe', 'pipe'] })

    if (useStdin) {
      proc.stdin.write(prompt)
      proc.stdin.end()
    }

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
        if (code !== 0 && !data) {
          reject(new Error(stderr.trim() || `Process exited with code ${code}`))
        } else {
          resolve(data)
        }
      })
    })

    if (provider === 'claude') this.hasConversation = true

    if (result) {
      const words = result.split(' ')
      for (let i = 0; i < words.length; i += 3) {
        yield words.slice(i, i + 3).join(' ') + ' '
      }
    }
  }
}
