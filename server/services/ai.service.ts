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

    if (result) {
      const words = result.split(' ')
      for (let i = 0; i < words.length; i += 3) {
        yield words.slice(i, i + 3).join(' ') + ' '
      }
    }
  }
}
