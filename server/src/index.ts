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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', service: 'AlgoVision IDE Backend' })
})

// AI Analysis endpoint
app.post('/api/analyze', async (req, res) => {
  const { code, type, line } = req.body

  if (!code) {
    return res.status(400).json({ error: 'Code is required' })
  }

  try {
    // In production: call Anthropic API here
    // For demo: return structured response
    const mockResponses: Record<string, string> = {
      explain: `## Algorithm Explanation\n\nThis is a **sorting algorithm** that works by...\n\n**Time Complexity:** O(n²)\n**Space Complexity:** O(1)`,
      complexity: `## Complexity Analysis\n\n**Time:** O(n²) — nested loops iterate n×n times\n**Space:** O(1) — in-place sorting`,
      optimize: `## Optimization Suggestions\n\n1. Use **Merge Sort** for O(n log n) time\n2. Add early exit if no swaps in a pass\n3. Consider Tim Sort for real-world data`
    }

    res.json({
      success: true,
      result: mockResponses[type] || 'Analysis complete.',
      type,
      line
    })
  } catch (error) {
    res.status(500).json({ error: 'Analysis failed' })
  }
})

// Code execution endpoint
app.post('/api/execute', async (req, res) => {
  const { code, language } = req.body

  if (!code) {
    return res.status(400).json({ error: 'Code is required' })
  }

  // Security check
  const dangerous = ['process.exit', 'require(', 'import ', '__dirname', 'fs.', 'child_process']
  const hasDangerous = dangerous.some(d => code.includes(d))

  if (hasDangerous) {
    return res.status(403).json({ error: 'Code contains restricted operations' })
  }

  // In production: run in Docker sandbox
  // For demo: return mock execution result
  res.json({
    success: true,
    output: ['Execution simulated in demo mode', 'Connect Docker sandbox for real execution'],
    executionTime: 42,
    memoryUsed: 1024
  })
})

// WebSocket for real-time execution updates
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`)

  socket.on('execute:start', (data) => {
    console.log('Execution started:', data.language)
    socket.emit('execute:status', { status: 'running' })

    // Simulate step-by-step execution
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
})
