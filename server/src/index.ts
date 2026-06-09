import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST']
  }
})

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000']
}))
app.use(express.json({ limit: '10mb' }))

// ─── Simple in-memory rate limiter ────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60_000 // 1 minute
const RATE_LIMIT_MAX = 30        // 30 requests per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
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
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `OpenRouter error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || 'No response from AI.'
}

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    service: 'AlgoVision IDE Backend',
    aiConfigured: !!OPENROUTER_API_KEY,
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
app.post('/api/execute', async (req, res) => {
  const { code, language } = req.body

  if (!code) {
    return res.status(400).json({ error: 'Code is required' })
  }

  // Security check
  const dangerous = ['process.exit', 'require(', '__dirname', 'fs.', 'child_process']
  const hasDangerous = dangerous.some(d => code.includes(d))

  if (hasDangerous) {
    return res.status(403).json({ error: 'Code contains restricted operations' })
  }

  // In production: run in Docker sandbox
  res.json({
    success: true,
    output: ['Execution simulated in demo mode', `Language: ${language || 'unknown'}`],
    executionTime: 42,
    memoryUsed: 1024
  })
})

// ─── WebSocket for real-time execution updates ────────────────────────────────
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`)

  socket.on('execute:start', (data) => {
    console.log('Execution started:', data.language)
    socket.emit('execute:status', { status: 'running' })

    setTimeout(() => {
      socket.emit('execute:step', { line: 1, description: 'Starting execution' })
    }, 200)
  })

  socket.on('execute:stop', () => {
    socket.emit('execute:status', { status: 'stopped' })
  })

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`)
  })
})

const PORT = process.env.PORT || 3001

httpServer.listen(PORT, () => {
  console.log(`🚀 AlgoVision Server running on port ${PORT}`)
  console.log(`📡 WebSocket ready`)
  console.log(`🔗 Health: http://localhost:${PORT}/health`)
  console.log(`🔑 AI: ${OPENROUTER_API_KEY ? 'Configured ✓' : 'NOT configured ✗'}`)
})
