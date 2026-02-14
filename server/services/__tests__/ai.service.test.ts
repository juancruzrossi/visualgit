import { describe, it, expect, vi } from 'vitest'
import { AiService } from '../ai.service'

vi.mock('child_process', () => {
  const EventEmitter = require('events').EventEmitter
  const { Readable } = require('stream')
  return {
    spawn: vi.fn(() => {
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
