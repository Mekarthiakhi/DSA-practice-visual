/**
 * AI Service - Backend Proxy + Local Fallback
 * Routes AI requests through the secure backend proxy at /api/analyze
 * Falls back to local analysis when the server is unavailable
 */


export interface AIRequest {
  code: string
  sessionToken?: string
  type: 'explain' | 'complexity' | 'flowchart' | 'optimize' | 'custom'
}

export interface AIResponse {
  success: boolean
  content?: string
  error?: string
  type: string
}

// Backend proxy URL — in dev it's localhost:3001, in production set via env
// @ts-ignore
const API_BASE = String(import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
// @ts-ignore
const DEFAULT_GEMINI_KEY: string = import.meta.env.VITE_GEMINI_API_KEY || ''
const MAX_RETRIES = 2
const RETRY_DELAY = 800

/** Resolve the key to use: explicit arg > env default */
function resolveKey(apiKey?: string): string {
  return (apiKey && apiKey.length > 8) ? apiKey : DEFAULT_GEMINI_KEY
}

/**
 * Analyze code complexity without AI (Fallback)
 */
function analyzeComplexityLocal(code: string): string {
  let timeComplexity = 'O(n)'
  let spaceComplexity = 'O(1)'

  const lower = code.toLowerCase()

  // Detect nested loops
  let loopCount = 0
  for (let i = 0; i < code.length; i++) {
    if (code[i] === 'for' || code[i] === 'while') {
      loopCount++
    }
  }

  if (loopCount >= 3) {
    timeComplexity = 'O(n³)'
  } else if (loopCount === 2) {
    timeComplexity = 'O(n²)'
  } else if (loopCount === 1) {
    if (lower.includes('sort')) {
      timeComplexity = 'O(n log n)'
    } else {
      timeComplexity = 'O(n)'
    }
  }

  // Detect space usage
  if (lower.includes('recursion') || lower.includes('recursive')) {
    spaceComplexity = 'O(n)'
  } else if (lower.includes('split') || lower.includes('merge') || lower.includes('slice')) {
    spaceComplexity = 'O(n)'
  }

  return `
**Time Complexity:** ${timeComplexity}
**Space Complexity:** ${spaceComplexity}

Analysis:
- Loop depth: ${loopCount}
- Uses recursion: ${lower.includes('recursion') ? 'Yes' : 'No'}
- Additional space: ${lower.includes('array') || lower.includes('object') ? 'Yes' : 'No'}
  `
}

/**
 * Generate flowchart description from code
 */
function generateFlowchartLocal(code: string): string {
  const lines = code.split('\n').filter((line) => line.trim() && !line.trim().startsWith('//'))

  let flowchart = '```mermaid\ngraph TD\n'
  flowchart += 'Start([Start])\n'

  let _stepNum = 1

  lines.forEach((line) => {
    const trimmed = line.trim()

    if (trimmed.includes('if')) {
      flowchart += `Node${_stepNum}{Decision: ${trimmed.substring(0, 30)}...}\n`
      flowchart += `Start --> Node${_stepNum}\n`
    } else if (trimmed.includes('for') || trimmed.includes('while')) {
      flowchart += `Loop${_stepNum}[Loop: ${trimmed.substring(0, 30)}...]\n`
      flowchart += `Start --> Loop${_stepNum}\n`
    } else if (trimmed.includes('return')) {
      flowchart += `End${_stepNum}([End: ${trimmed.substring(0, 30)}...])\n`
      flowchart += `Loop${_stepNum} --> End${_stepNum}\n`
    }

    _stepNum++
  })

  flowchart += 'End([End])\n```'


  
  return flowchart
}

/**
 * Optimize code suggestions (Local Analysis)
 */
function optimizeCodeLocal(code: string): string {
  const suggestions: string[] = []

  // Check for common inefficiencies
  if (code.includes('for') && code.includes('indexOf')) {
    suggestions.push('💡 Consider using a Set for O(1) lookups instead of indexOf')
  }

  if (code.match(/for.*\{.*for/)) {
    suggestions.push('💡 Nested loops detected - consider if this can be optimized with a hash map')
  }

  if (code.includes('splice')) {
    suggestions.push('💡 Array.splice is O(n) - consider using filter or building new array')
  }

  if (!code.includes('const') && code.includes('var')) {
    suggestions.push('💡 Use const/let instead of var for better scoping')
  }

  if (code.match(/if.*==\s/)) {
    suggestions.push('💡 Use === instead of == for strict equality')
  }

  return suggestions.length > 0
    ? suggestions.join('\n\n')
    : '✅ Code looks optimized! Keep following best practices.'
}

/**
 * Explain code (Local - improved analysis)
 */
function explainCodeLocal(code: string): string {
  const lines = code.split('\n').slice(0, 10) // First 10 lines

  let explanation = '## Code Explanation\n\n'

  // Detect algorithm type
  const lower = code.toLowerCase()
  if (lower.includes('bubble') || (lower.includes('for') && code.match(/for.*\{.*for/))) {
    explanation += '**Algorithm Type:** Sorting Algorithm\n\n'
  } else if (lower.includes('search')) {
    explanation += '**Algorithm Type:** Search Algorithm\n\n'
  } else if (lower.includes('graph') || lower.includes('tree')) {
    explanation += '**Algorithm Type:** Graph/Tree Traversal\n\n'
  }

  explanation += '**Code Structure:**\n'
  lines.forEach((line) => {
    if (line.trim() && !line.trim().startsWith('//')) {
      explanation += `- ${line.trim().substring(0, 60)}...\n`
    }
  })

  explanation += '\n**Key Operations:**\n'
  if (code.includes('for')) explanation += '- Iteration/Loop\n'
  if (code.includes('if')) explanation += '- Conditional Logic\n'
  if (code.includes('swap')) explanation += '- Element Swapping\n'
  if (code.includes('recursion')) explanation += '- Recursive Calls\n'

  return explanation
}

/**
 * Call the backend proxy with retry logic, or directly with API key
 */
async function callBackendProxy(type: string, code: string, apiKey?: string): Promise<string> {
  let lastError: Error | null = null

  // If we have an API key, try calling Gemini directly first
  if (apiKey && apiKey.length > 8) {
    try {
      return await callGeminiDirect(type, code, apiKey)
    } catch (err) {
      console.warn('Direct Gemini call failed, trying backend proxy:', err)
    }
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (apiKey) headers['x-api-key'] = apiKey
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ code, type }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || `Server error: ${response.status}`)
      }

      const data = await response.json()
      return data.result || 'No response from AI.'
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * (attempt + 1)))
      }
    }
  }

  throw lastError || new Error('Backend proxy call failed')
}

/**
 * Call Gemini API directly with user's key
 */
async function callGeminiDirect(type: string, code: string, apiKey: string): Promise<string> {
  const prompts: Record<string, string> = {
    explain: `You are an expert programming teacher. Explain the following code clearly and concisely:\n\n${code}\n\nProvide: 1) What it does, 2) How it works step by step, 3) Time & space complexity`,
    complexity: `Analyze the time and space complexity of this code:\n\n${code}\n\nProvide Big-O analysis with clear reasoning for both time and space complexity.`,
    flowchart: `Describe the logical flow of this algorithm as a step-by-step flowchart description:\n\n${code}\n\nList each decision point and process step.`,
    optimize: `Suggest optimizations for this code:\n\n${code}\n\nFocus on: time complexity improvements, space efficiency, and code clarity.`,
    custom: `Analyze this code:\n\n${code}`,
  }
  const prompt = prompts[type] || prompts.custom

  // Try Gemini API
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
  const resp = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  })
  if (!resp.ok) {
    const e = await resp.json().catch(() => ({}))
    throw new Error(e?.error?.message || `Gemini error: ${resp.status}`)
  }
  const data = await resp.json()
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.'
}

/**
 * Explain code using backend proxy or local analysis
 */
export async function explainCode(code: string, _lineNumber?: number, sessionToken?: string): Promise<AIResponse> {
  sessionToken = resolveKey(sessionToken)
  try {
    try {
      const content = await callBackendProxy('explain', code, sessionToken)
      return { success: true, content, type: 'explain' }
    } catch (error) {
      console.warn('Backend proxy failed, using local analysis:', error)
    }

    const content = explainCodeLocal(code)
    return { success: true, content, type: 'explain' }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Explanation failed',
      type: 'explain',
    }
  }
}

/**
 * Analyze complexity using backend proxy or local analysis
 */
export async function analyzeComplexity(code: string, sessionToken?: string): Promise<AIResponse> {
  sessionToken = resolveKey(sessionToken)
  try {
    try {
      const content = await callBackendProxy('complexity', code, sessionToken)
      return { success: true, content, type: 'complexity' }
    } catch (error) {
      console.warn('Backend proxy failed, using local analysis:', error)
    }

    const content = analyzeComplexityLocal(code)
    return { success: true, content, type: 'complexity' }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed',
      type: 'complexity',
    }
  }
}

/**
 * Generate flowchart description
 */
export async function generateFlowchart(code: string, _sessionToken?: string): Promise<AIResponse> {
  try {
    // Use local generation (fast and reliable)
    const content = generateFlowchartLocal(code)
    return { success: true, content, type: 'flowchart' }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Flowchart generation failed',
      type: 'flowchart',
    }
  }
}

/**
 * Suggest code optimizations
 */
export async function optimizeCode(code: string, sessionToken?: string): Promise<AIResponse> {
  sessionToken = resolveKey(sessionToken)
  try {
    try {
      const content = await callBackendProxy('optimize', code, sessionToken)
      return { success: true, content, type: 'optimize' }
    } catch (error) {
      console.warn('Backend proxy failed, using local analysis:', error)
    }

    const content = optimizeCodeLocal(code)
    return { success: true, content, type: 'optimize' }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Optimization failed',
      type: 'optimize',
    }
  }
}

/**
 * Analyze custom algorithm
 */
export async function analyzeCustomAlgorithm(
  code: string,
  algorithmName: string,
  _sessionToken?: string
): Promise<AIResponse> {
  try {
    try {
      const content = await callBackendProxy('custom', code)
      return { success: true, content, type: 'custom' }
    } catch (error) {
      console.warn('Backend proxy failed, using basic analysis:', error)
    }

    const content = `## Analysis: ${algorithmName}\n\n${explainCodeLocal(code)}\n\n${analyzeComplexityLocal(code)}`
    return { success: true, content, type: 'custom' }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed',
      type: 'custom',
    }
  }
}

/**
 * Suggest code optimizations (alias for optimizeCode, returns string)
 */
export async function suggestOptimizations(code: string, sessionToken?: string): Promise<string> {
  const result = await optimizeCode(code, sessionToken)
  return result.content || result.error || 'No suggestions available.'
}

/**
 * Chat with AI about code — routes through backend proxy
 */
export async function chatWithAI(
  history: Array<{ role: string; content: string }>,
  code: string,
  apiKey?: string
): Promise<string> {
  apiKey = resolveKey(apiKey)
  // If we have a Gemini API key, use it directly
  if (apiKey && apiKey.length > 8) {
    try {
      const systemMsg = `You are an expert programming assistant helping with code analysis and DSA problems. Current code context:\n\n${code}\n\nAnswer concisely and helpfully.`
      const lastUserMsg = history.filter(m => m.role === 'user').slice(-1)[0]?.content || ''
      const fullPrompt = `${systemMsg}\n\nUser: ${lastUserMsg}`
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
      const resp = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] }),
      })
      if (resp.ok) {
        const data = await resp.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) return text
      }
    } catch (err) {
      console.warn('Direct Gemini chat failed, trying backend proxy:', err)
    }
  }

  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'x-api-key': apiKey } : {})
      },
      body: JSON.stringify({ messages: history, code }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || `Chat error: ${response.status}`)
    }

    const data = await response.json()
    return data.content || 'No response from AI.'
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    // If server is down, give helpful message
    if (msg.includes('fetch') || msg.includes('network') || msg.includes('ECONNREFUSED') || msg.includes('Failed to fetch')) {
      return `## AI Not Available\n\nTo enable AI chat, either:\n1. **Add an API key** (click the 🔑 icon) — supports Gemini, OpenAI, or Anthropic keys\n2. **Start the backend server**: \`cd server && npm run dev\`\n\nThe visualizer and code tracing work without an API key! ⚡`
    }
    throw new Error(`AI chat failed: ${msg}`)
  }
}

/**
 * Call AI - wrapper for backend proxy for multi-lang engine
 */
export async function callAI(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  _apiKey: string
): Promise<string> {
  const userContent = messages.map(m => `${m.role}: ${m.content}`).join('\n')
  const fullPrompt = `${systemPrompt}\n\n${userContent}`

  try {
    const response = await fetch(`${API_BASE}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: fullPrompt, type: 'custom' }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || `Server error: ${response.status}`)
    }

    const data = await response.json()
    return data.result || 'No response from AI.'
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error))
  }
}
