import { Router, type Request, type Response } from 'express'
import { AiService } from '../services/ai.service.js'
import type { AiProvider, AnalysisMode, ClaudeModel } from '../../shared/types.js'

export function createAiRouter(repoPath: string): Router {
  const router = Router()
  const aiService = new AiService()

  router.post('/analyze', async (req: Request, res: Response) => {
    const { provider = 'claude', mode = 'full', content, filePath, model } = req.body as {
      provider?: AiProvider
      mode?: AnalysisMode
      content?: string
      filePath?: string
      model?: ClaudeModel
    }

    const validProviders: AiProvider[] = ['claude', 'codex']
    if (!validProviders.includes(provider)) {
      res.status(400).json({ error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` })
      return
    }

    if (!content) {
      res.status(400).json({ error: 'content is required' })
      return
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })

    const controller = new AbortController()
    let clientDisconnected = false

    const handleClose = () => {
      clientDisconnected = true
      controller.abort()
    }

    req.on('close', handleClose)

    try {
      for await (const chunk of aiService.analyze(provider, mode, content, filePath, model, repoPath, controller.signal)) {
        if (clientDisconnected || controller.signal.aborted || res.writableEnded) {
          break
        }
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`)
      }
      if (!clientDisconnected && !controller.signal.aborted && !res.writableEnded) {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }

      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ error: 'AI analysis failed' })}\n\n`)
      }
    } finally {
      req.off('close', handleClose)
      if (!res.writableEnded) {
        res.end()
      }
    }
  })

  return router
}
