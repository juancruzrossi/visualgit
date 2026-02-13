import { spawn } from 'child_process'

export type AiProvider = 'claude' | 'openai'
export type AnalysisMode = 'full' | 'file' | 'selection'

export class AiService {
  private hasConversation = false

  buildPrompt(mode: AnalysisMode, content: string, filePath?: string): string {
    if (mode === 'selection') {
      return `Analyze this selected code snippet${filePath ? ` from ${filePath}` : ''}. Explain what it does, any issues, and potential improvements. Be concise with bullet points.\n\n\`\`\`\n${content}\n\`\`\``
    }
    if (mode === 'file') {
      return `Analyze the changes in ${filePath || 'this file'}. Explain what changed and why it matters, key improvements, and any risks. Be concise with bullet points.\n\n\`\`\`diff\n${content}\n\`\`\``
    }
    return `You are a senior software engineer. Analyze this complete git diff and provide:\n\n1. Executive summary of all changes\n2. Key improvements or patterns introduced\n3. Any potential risks or concerns\n4. How the changes relate to each other\n\nBe concise with bullet points. Do not repeat the code.\n\n\`\`\`diff\n${content}\n\`\`\``
  }

  getCommand(provider: AiProvider, prompt: string): { command: string; args: string[] } {
    if (provider === 'claude') {
      const args = ['-p', '--model', 'sonnet']
      if (this.hasConversation) args.push('--continue')
      args.push(prompt)
      return { command: 'claude', args }
    }
    return {
      command: 'openai',
      args: ['api', 'chat.completions.create', '-m', 'gpt-4o', '-g', 'user', prompt],
    }
  }

  async *analyze(provider: AiProvider, mode: AnalysisMode, content: string, filePath?: string): AsyncGenerator<string> {
    const prompt = this.buildPrompt(mode, content, filePath)
    const { command, args } = this.getCommand(provider, prompt)

    const env = { ...process.env }
    delete env.CLAUDECODE

    const proc = spawn(command, args, { env })

    const result: string = await new Promise((resolve, reject) => {
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

    if (provider === 'claude') this.hasConversation = true

    if (result) {
      const words = result.split(' ')
      for (let i = 0; i < words.length; i += 3) {
        yield words.slice(i, i + 3).join(' ') + ' '
      }
    }
  }
}
