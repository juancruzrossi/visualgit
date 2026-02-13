import { Router, type Request, type Response } from 'express'
import { AiService, type AiProvider } from '../services/ai.service.js'

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
    } catch {
      res.write(`data: ${JSON.stringify({ error: 'AI analysis failed' })}\n\n`)
    } finally {
      res.end()
    }
  })

  return router
}
