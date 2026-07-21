import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1)

const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://localhost:3000']

app.use(cors({
  origin: allowedOrigins
}))
app.disable('x-powered-by')
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  next()
})
app.use(express.json({ limit: '10mb' }))

// ─── Simple in-memory rate limiter ────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const configuredRateWindow = Number(process.env.RATE_LIMIT_WINDOW)
const configuredRateMax = Number(process.env.RATE_LIMIT_MAX)
const RATE_LIMIT_WINDOW = Number.isFinite(configuredRateWindow) && configuredRateWindow > 0 ? configuredRateWindow : 60_000
const RATE_LIMIT_MAX = Number.isFinite(configuredRateMax) && configuredRateMax > 0 ? configuredRateMax : 30

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  if (rateLimitMap.size > 10_000) {
    for (const [key, value] of rateLimitMap) {
      if (now > value.resetAt) rateLimitMap.delete(key)
    }
  }
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

// ─── OpenRouter proxy helper ──────────────────────────────────────────────────
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const EXECUTION_SERVICE_URL = process.env.EXECUTION_SERVICE_URL || ''
const EXECUTION_SERVICE_TOKEN = process.env.EXECUTION_SERVICE_TOKEN || ''
const EXECUTION_TIMEOUT_MS = 20_000
const TRACE_LANGUAGES = new Set(['java', 'cpp', 'c', 'csharp', 'go', 'rust'])

async function callOpenRouter(prompt: string, maxTokens = 1024): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY not configured on server')
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as any
    throw new Error(err.error?.message || `OpenRouter error: ${response.status}`)
  }

  const data = (await response.json()) as any
  return data.choices?.[0]?.message?.content || 'No response from AI.'
}

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    service: 'AlgoVision IDE Backend',
    aiConfigured: !!OPENROUTER_API_KEY,
    executionRuntimeConfigured: !!EXECUTION_SERVICE_URL,
  })
})

// ─── AI Analysis endpoint (proxied to OpenRouter) ─────────────────────────────
app.post('/api/analyze', async (req, res) => {
  const clientIp = req.ip || 'unknown'
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.' })
  }

  const { code, type } = req.body

  if (!code) {
    return res.status(400).json({ error: 'Code is required' })
  }

  const prompts: Record<string, string> = {
    explain: `Explain this code concisely. Include what it does, key logic, and any patterns used:\n\`\`\`\n${code}\n\`\`\``,
    complexity: `Analyze the time and space complexity of this code. Be specific about best/average/worst cases:\n\`\`\`\n${code}\n\`\`\``,
    optimize: `Suggest optimizations for this code. Include improved code snippets where possible:\n\`\`\`\n${code}\n\`\`\``,
    flowchart: `Describe the control flow of this code as a step-by-step flowchart in mermaid syntax:\n\`\`\`\n${code}\n\`\`\``,
    custom: `Analyze this algorithm. Provide: 1) What it does 2) Time complexity 3) Space complexity 4) Potential improvements:\n\`\`\`\n${code}\n\`\`\``,
  }

  const prompt = prompts[type] || prompts.custom

  try {
    const result = await callOpenRouter(prompt)
    res.json({ success: true, result, type })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Analysis failed'
    console.error('AI analysis error:', msg)
    res.status(500).json({ error: msg })
  }
})

// ─── AI Chat endpoint ─────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const clientIp = req.ip || 'unknown'
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.' })
  }

  const { messages, code } = req.body

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' })
  }

  const prompt = `Context: The user is working on this code:\n\`\`\`\n${code || '// No code provided'}\n\`\`\`\n\nConversation:\n${messages.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join('\n')}\n\nPlease respond helpfully about the code above.`

  try {
    const result = await callOpenRouter(prompt)
    res.json({ success: true, content: result })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Chat failed'
    console.error('AI chat error:', msg)
    res.status(500).json({ error: msg })
  }
})

// ─── Code execution endpoint (sandbox) ────────────────────────────────────────
const TELEMETRY_EVENTS = new Set(['runtime_error', 'judge_complete', 'worker_timeout', 'ui_error'])

app.post('/api/telemetry', (req, res) => {
  const clientIp = req.ip || 'unknown'
  if (!checkRateLimit(clientIp)) return res.status(429).json({ error: 'Rate limit exceeded' })

  const { event, language, errorType, passed, total, durationMs, appVersion, sessionId, timestamp } = req.body || {}
  if (typeof event !== 'string' || !TELEMETRY_EVENTS.has(event)) {
    return res.status(400).json({ error: 'Unsupported telemetry event' })
  }

  // Source, input, output, account data, and IP are deliberately excluded.
  console.info('anonymous_telemetry', JSON.stringify({
    event,
    language: typeof language === 'string' ? language.slice(0, 20) : undefined,
    errorType: typeof errorType === 'string' ? errorType.slice(0, 80) : undefined,
    passed: Number.isFinite(Number(passed)) ? Number(passed) : undefined,
    total: Number.isFinite(Number(total)) ? Number(total) : undefined,
    durationMs: Number.isFinite(Number(durationMs)) ? Number(durationMs) : undefined,
    appVersion: typeof appVersion === 'string' ? appVersion.slice(0, 30) : undefined,
    sessionId: typeof sessionId === 'string' ? sessionId.slice(0, 80) : undefined,
    timestamp: typeof timestamp === 'string' ? timestamp.slice(0, 40) : undefined,
  }))
  return res.status(202).json({ accepted: true })
})

app.post('/api/execute', async (req, res) => {
  const clientIp = req.ip || 'unknown'
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.' })
  }

  const { code, language, maxSteps } = req.body

  if (typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ error: 'Code is required' })
  }

  if (code.length > 100_000) {
    return res.status(413).json({ error: 'Code exceeds the 100 KB execution limit' })
  }

  if (typeof language !== 'string' || !TRACE_LANGUAGES.has(language)) {
    return res.status(400).json({ error: 'Unsupported compiled language' })
  }

  if (!EXECUTION_SERVICE_URL) {
    return res.status(503).json({
      error: 'Compiled-language tracing is unavailable. Configure EXECUTION_SERVICE_URL with an isolated trace runner.'
    })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), EXECUTION_TIMEOUT_MS)

  try {
    const runtimeResponse = await fetch(EXECUTION_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(EXECUTION_SERVICE_TOKEN ? { Authorization: `Bearer ${EXECUTION_SERVICE_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        code,
        language,
        trace: true,
        maxSteps: Math.max(1, Math.min(Number(maxSteps) || 3000, 5000)),
      }),
      signal: controller.signal,
    })
    const payload = await runtimeResponse.json() as { steps?: unknown; output?: unknown; error?: string }

    if (!runtimeResponse.ok) {
      return res.status(502).json({ error: payload.error || `Execution runner returned ${runtimeResponse.status}` })
    }
    if (!Array.isArray(payload.steps)) {
      return res.status(502).json({ error: 'Execution runner did not return a step trace' })
    }

    return res.json({
      steps: payload.steps,
      output: Array.isArray(payload.output) ? payload.output : [],
      error: payload.error,
    })
  } catch (error) {
    const message = error instanceof Error && error.name === 'AbortError'
      ? 'Execution runner timed out'
      : error instanceof Error ? error.message : 'Execution runner failed'
    return res.status(502).json({ error: message })
  } finally {
    clearTimeout(timeout)
  }
})

// ─── WebSocket for real-time execution updates ────────────────────────────────
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : 'Internal server error'
  console.error('Unhandled request error:', message)
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 3001

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`AlgoVision Server running on port ${PORT}`)
    console.log(`Health: http://localhost:${PORT}/health`)
    console.log(`AI: ${OPENROUTER_API_KEY ? 'configured' : 'not configured'}`)
  })
}

export default app
