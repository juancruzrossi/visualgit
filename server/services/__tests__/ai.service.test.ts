import { describe, it, expect, vi } from 'vitest'
import { AiService } from '../ai.service'
import { EventEmitter } from 'events'
import { Readable, Writable } from 'stream'

type MockProcess = EventEmitter & {
  stdout: Readable
  stderr: Readable
  stdin: Writable
  killed: boolean
  kill: ReturnType<typeof vi.fn>
}

vi.mock('child_process', () => {
  return {
    spawn: vi.fn(() => {
      const proc = new EventEmitter() as MockProcess
      const stdout = new Readable({ read() {} })
      const stderr = new Readable({ read() {} })
      const stdin = new Writable({
        write(_chunk: string | Buffer, _enc: BufferEncoding, cb: (error?: Error | null) => void) {
          cb()
        },
      })

      proc.stdout = stdout
      proc.stderr = stderr
      proc.stdin = stdin
      proc.killed = false
      proc.kill = vi.fn(() => {
        proc.killed = true
        return true
      })

      setTimeout(() => {
        stdout.push('This change refactors the auth logic.')
        stdout.push(null)
        proc.emit('close', 0)
      }, 10)

      return proc
    }),
  }
})

describe('AiService', () => {
  it('builds the correct prompt with diff content', () => {
    const service = new AiService()
    const prompt = service.buildPrompt('full', 'some diff content')
    expect(prompt).toContain('some diff content')
    expect(prompt).toContain('git diff')
  })

  it('returns a readable stream from claude CLI', async () => {
    const service = new AiService()
    const stream = service.analyze('claude', 'full', 'some diff')
    const chunks: string[] = []

    for await (const chunk of stream) {
      chunks.push(chunk)
    }

    expect(chunks.join('')).toContain('refactors the auth')
  })

  it('gets the command args for claude provider', () => {
    const service = new AiService()
    const { command, args } = service.getCommand('claude')
    expect(command).toBe('claude')
    expect(args).toContain('-p')
  })

  it('gets the command args for openai provider', () => {
    const service = new AiService()
    const { command, args } = service.getCommand('openai')
    expect(command).toBe('openai')
  })
})
