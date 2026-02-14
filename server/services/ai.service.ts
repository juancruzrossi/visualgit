import { spawn } from 'child_process'

export type AiProvider = 'claude' | 'openai'
export type AnalysisMode = 'full' | 'file' | 'selection'
export type ClaudeModel = 'opus' | 'sonnet' | 'haiku'

export class AiService {
  private hasConversation = false

  buildPrompt(mode: AnalysisMode, content: string, filePath?: string): string {
    const markdownInstruction = 'Format your response using Markdown (headings, bold, bullet points, code blocks).'

    if (mode === 'selection') {
      return `Analyze this selected code snippet${filePath ? ` from ${filePath}` : ''}. Explain what it does, any issues, and potential improvements. Be concise with bullet points. ${markdownInstruction}\n\n\`\`\`\n${content}\n\`\`\``
    }
    if (mode === 'file') {
      return `Analyze the changes in ${filePath || 'this file'}. Explain what changed and why it matters, key improvements, and any risks. Be concise with bullet points. ${markdownInstruction}\n\n\`\`\`diff\n${content}\n\`\`\``
    }
    return `You are a senior software engineer. Analyze this complete git diff and provide:\n\n1. Executive summary of all changes\n2. Key improvements or patterns introduced\n3. Any potential risks or concerns\n4. How the changes relate to each other\n\nBe concise with bullet points. Do not repeat the code. ${markdownInstruction}\n\n\`\`\`diff\n${content}\n\`\`\``
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
