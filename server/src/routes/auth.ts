/**
 * Authentication Routes
 * PHASE 1 FIX: Secure API key handling with backend token exchange
 * Users send their API key, get back a short-lived session token
 * The raw key is never stored client-side
 */

import express, { Request, Response } from 'express'
import crypto from 'crypto'

const router = express.Router()

// In-memory session store (use Redis in production)
const sessionTokens = new Map<
  string,
  {
    apiKey: string
    createdAt: number
    expiresIn: number
  }
>()

const generateToken = (): string => crypto.randomBytes(32).toString('hex')

/**
 * POST /api/auth/exchange
 * Exchange user's Anthropic API key for a session token
 *
 * Request: { apiKey: "sk-ant-..." }
 * Response: { sessionToken: "...", expiresIn: 1800000 }
 */
router.post('/exchange', async (req: Request, res: Response) => {
  try {
    const { apiKey } = req.body

    // Validate input
    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({ error: 'Invalid API key format' })
    }

    // Validate it's an Anthropic key (basic check)
    if (!apiKey.startsWith('sk-ant-')) {
      return res.status(401).json({ error: 'Invalid Anthropic API key format' })
    }

    // Optional: Validate the key against Anthropic API
    // const isValid = await validateAnthropicKey(apiKey)
    // if (!isValid) {
    //   return res.status(401).json({ error: 'Invalid API key' })
    // }

    // Create session token (valid for 30 minutes)
    const sessionToken = generateToken()
    const expiresIn = 1800000 // 30 minutes

    sessionTokens.set(sessionToken, {
      apiKey,
      createdAt: Date.now(),
      expiresIn,
    })

    // Auto-cleanup expired token
    setTimeout(() => {
      sessionTokens.delete(sessionToken)
    }, expiresIn)

    res.json({
      sessionToken,
      expiresIn,
      message: 'Session token created successfully',
    })
  } catch (err) {
    console.error('Auth error:', err)
    res.status(500).json({ error: 'Authentication failed' })
  }
})

/**
 * GET /api/auth/validate
 * Validate if a session token is still valid
 */
router.get('/validate', (req: Request, res: Response) => {
  const { token } = req.query

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ valid: false })
  }

  const session = sessionTokens.get(token)

  if (!session) {
    return res.status(401).json({ valid: false })
  }

  const elapsed = Date.now() - session.createdAt

  if (elapsed > session.expiresIn) {
    sessionTokens.delete(token)
    return res.status(401).json({ valid: false })
  }

  res.json({
    valid: true,
    expiresIn: session.expiresIn - elapsed,
  })
})

/**
 * POST /api/ai/explain
 * Use session token to call Claude API
 */
router.post('/ai/explain', async (req: Request, res: Response) => {
  try {
    const { sessionToken, code } = req.body

    if (!sessionToken || typeof sessionToken !== 'string') {
      return res.status(401).json({ error: 'Invalid session token' })
    }

    const session = sessionTokens.get(sessionToken)

    if (!session) {
      return res.status(401).json({ error: 'Session expired' })
    }

    // Use session.apiKey to call Anthropic API
    // (Implementation depends on Anthropic SDK)
    // const response = await anthropic.messages.create({
    //   model: 'claude-3-sonnet-20240229',
    //   max_tokens: 1024,
    //   messages: [{ role: 'user', content: `Explain this code:\n${code}` }],
    // })

    res.json({
      explanation: 'This is a placeholder explanation. Implement with Anthropic SDK.',
    })
  } catch (err) {
    console.error('AI error:', err)
    res.status(500).json({ error: 'AI request failed' })
  }
})

export default router
