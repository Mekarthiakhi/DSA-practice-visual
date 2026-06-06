/**
 * AI Service - Claude API Integration
 * FIXED: Proper error handling, retry logic, and custom code support
 * Supports both Claude API and custom code analysis
 */

import { useIDEStore } from '../store/ideStore'

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

const ANTHROPIC_API_BASE = 'https://api.anthropic.com/v1'
const MAX_RETRIES = 3
const RETRY_DELAY = 1000

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

  let stepNum = 1
  let indent = '  '

  lines.forEach((line) => {
    const trimmed = line.trim()

    if (trimmed.includes('if')) {
      flowchart += `Node${stepNum}{Decision: ${trimmed.substring(0, 30)}...}\n`
      flowchart += `Start --> Node${stepNum}\n`
    } else if (trimmed.includes('for') || trimmed.includes('while')) {
      flowchart += `Loop${stepNum}[Loop: ${trimmed.substring(0, 30)}...]\n`
      flowchart += `Start --> Loop${stepNum}\n`
    } else if (trimmed.includes('return')) {
      flowchart += `End${stepNum}([End: ${trimmed.substring(0, 30)}...])\n`
      flowchart += `Loop${stepNum} --> End${stepNum}\n`
    }

    stepNum++
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
 * Call Claude API with retry logic
 */
async function callClaudeAPI(prompt: string, sessionToken?: string): Promise<string> {
  if (!sessionToken) {
    throw new Error('Session token required for Claude API')
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${ANTHROPIC_API_BASE}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || `API Error: ${response.status}`)
      }

      const data = await response.json()
      return data.content?.[0]?.text || 'No response'
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt < MAX_RETRIES - 1) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * (attempt + 1)))
      }
    }
  }

  throw lastError || new Error('Claude API call failed')
}

/**
 * Explain code using Claude or local analysis
 */
export async function explainCode(code: string, sessionToken?: string): Promise<AIResponse> {
  try {
    // Try Claude first if token available
    if (sessionToken) {
      try {
        const content = await callClaudeAPI(`Explain this code concisely:\n\`\`\`\n${code}\n\`\`\``, sessionToken)
        return { success: true, content, type: 'explain' }
      } catch (error) {
        console.warn('Claude API failed, using local analysis:', error)
      }
    }

    // Fallback to local analysis
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
 * Analyze complexity using Claude or local analysis
 */
export async function analyzeComplexity(code: string, sessionToken?: string): Promise<AIResponse> {
  try {
    // Try Claude first if token available
    if (sessionToken) {
      try {
        const content = await callClaudeAPI(`Analyze time and space complexity:\n\`\`\`\n${code}\n\`\`\``, sessionToken)
        return { success: true, content, type: 'complexity' }
      } catch (error) {
        console.warn('Claude API failed, using local analysis:', error)
      }
    }

    // Fallback to local analysis
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
export async function generateFlowchart(code: string, sessionToken?: string): Promise<AIResponse> {
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
  try {
    // Try Claude first if token available
    if (sessionToken) {
      try {
        const content = await callClaudeAPI(`Suggest optimizations for this code:\n\`\`\`\n${code}\n\`\`\``, sessionToken)
        return { success: true, content, type: 'optimize' }
      } catch (error) {
        console.warn('Claude API failed, using local analysis:', error)
      }
    }

    // Fallback to local analysis
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
  sessionToken?: string
): Promise<AIResponse> {
  try {
    const prompt = `Analyze this custom algorithm named "${algorithmName}":\n\`\`\`\n${code}\n\`\`\`\n\nProvide:\n1. What it does\n2. Time complexity\n3. Space complexity\n4. Potential improvements`

    // Try Claude first if token available
    if (sessionToken) {
      try {
        const content = await callClaudeAPI(prompt, sessionToken)
        return { success: true, content, type: 'custom' }
      } catch (error) {
        console.warn('Claude API failed, using basic analysis:', error)
      }
    }

    // Fallback to basic analysis
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
