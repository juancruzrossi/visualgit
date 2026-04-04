import { Router, type Request, type Response } from 'express'
import { AiService, type AiProvider, type AnalysisMode, type ClaudeModel } from '../services/ai.service.js'

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

    if (!content) {
      res.status(400).json({ error: 'content is required' })
      return
    }

    const validProviders: AiProvider[] = ['claude', 'openai']
    const validModes: AnalysisMode[] = ['full', 'file', 'selection']
    const validModels: ClaudeModel[] = ['opus', 'sonnet', 'haiku']

    if (!validProviders.includes(provider)) {
      res.status(400).json({ error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` })
      return
    }
    if (!validModes.includes(mode)) {
      res.status(400).json({ error: `Invalid mode. Must be one of: ${validModes.join(', ')}` })
      return
    }
    if (model && !validModels.includes(model)) {
      res.status(400).json({ error: `Invalid model. Must be one of: ${validModels.join(', ')}` })
      return
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })

    const abortController = new AbortController()
    req.on('close', () => abortController.abort())

    try {
      for await (const chunk of aiService.analyze(provider, mode, content, filePath, model, repoPath, abortController.signal)) {
        if (abortController.signal.aborted) break
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`)
      }
      if (!abortController.signal.aborted) {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
      }
    } catch {
      if (!abortController.signal.aborted) {
        res.write(`data: ${JSON.stringify({ error: 'AI analysis failed' })}\n\n`)
      }
    } finally {
      res.end()
    }
  })

  return router
}
