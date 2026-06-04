/**
 * AI Service — supports both OpenAI and Anthropic
 * Auto-detects the key type by prefix:
 *   sk-ant-...  → Anthropic Claude
 *   sk-proj-... or sk-... → OpenAI GPT-4o-mini
 */

interface Msg { role: 'user' | 'assistant'; content: string }

// ─── Key detection ────────────────────────────────────────────────────────────

export function isOpenAIKey(key: string): boolean {
  return key.startsWith('sk-') && !key.startsWith('sk-ant-')
}

function getApiKey(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const store = (window as any).__ideStore__
    return store?.getState?.()?.aiApiKey || ''
  } catch {
    return ''
  }
}

// ─── OpenAI call ─────────────────────────────────────────────────────────────

async function callOpenAI(messages: Msg[], systemPrompt: string, key: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 1500,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    }),
  })

  if (!response.ok) {
    const errBody = await response.text().catch(() => '')
    throw new Error(`OpenAI error ${response.status}: ${errBody.slice(0, 120)}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || 'No response received.'
}

// ─── Anthropic call ───────────────────────────────────────────────────────────

async function callAnthropic(messages: Msg[], systemPrompt: string, key: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages,
    }),
  })

  if (!response.ok) {
    const errBody = await response.text().catch(() => '')
    throw new Error(`Anthropic error ${response.status}: ${errBody.slice(0, 120)}`)
  }

  const data = await response.json()
  const textBlock = data.content?.find((b: { type: string }) => b.type === 'text')
  return textBlock?.text || 'No response received.'
}

// ─── Unified router ───────────────────────────────────────────────────────────

export async function callAI(messages: Msg[], systemPrompt: string, apiKey?: string): Promise<string> {
  const key = apiKey || getApiKey()
  if (!key) {
    throw new Error('No API key set. Click the 🔑 icon in the AI panel to add your OpenAI or Anthropic API key.')
  }

  try {
    if (isOpenAIKey(key)) {
      return await callOpenAI(messages, systemPrompt, key)
    } else {
      return await callAnthropic(messages, systemPrompt, key)
    }
  } catch (err) {
    console.error('AI call failed:', err)
    throw err
  }
}

// ─── Exported functions ───────────────────────────────────────────────────────

export async function explainCode(code: string, currentLine?: number, apiKey?: string): Promise<string> {
  const system = `You are AlgoVision's AI tutor — an expert in algorithms, data structures, and CS education.
Explain clearly and visually. Use analogies. Keep responses concise but insightful.
Format with markdown: **bold** for key terms, \`code\` for variables, bullet points for steps.`

  const ctx = currentLine ? `Focus on line ${currentLine} but explain the overall algorithm. ` : ''
  return callAI([{ role: 'user', content: `Explain this code. ${ctx}\n\n\`\`\`javascript\n${code}\n\`\`\`` }], system, apiKey)
}

export async function analyzeComplexity(code: string, apiKey?: string): Promise<string> {
  const system = `You are an algorithm complexity expert. Analyze code and provide:
1. Time complexity with Big O notation and explanation
2. Space complexity with reasoning
3. Best/Average/Worst case analysis
4. Comparison to alternative algorithms
Use clear formatting with headers and tables where helpful.`

  return callAI([{ role: 'user', content: `Analyze the time and space complexity:\n\n\`\`\`javascript\n${code}\n\`\`\`` }], system, apiKey)
}

export async function generateFlowchart(code: string, apiKey?: string): Promise<string> {
  const system = `You are a software architect specializing in algorithm visualization.
Generate a Mermaid.js flowchart that visually represents the algorithm logic.
Return ONLY the mermaid code block, nothing else. Use clear node labels.`

  return callAI([{ role: 'user', content: `Generate a Mermaid flowchart for this algorithm:\n\n\`\`\`javascript\n${code}\n\`\`\`\n\nReturn only the mermaid code.` }], system, apiKey)
}

export async function suggestOptimizations(code: string, apiKey?: string): Promise<string> {
  const system = `You are a senior software engineer and performance optimization expert.
Review code and provide:
1. Specific optimization opportunities with code examples
2. Data structure improvements
3. Algorithm alternatives if applicable
4. Memory usage improvements
Be concrete with before/after examples.`

  return callAI([{ role: 'user', content: `Review and suggest optimizations:\n\n\`\`\`javascript\n${code}\n\`\`\`` }], system, apiKey)
}

export async function detectBugs(code: string, apiKey?: string): Promise<string> {
  const system = `You are an expert code reviewer and debugging specialist.
Analyze code for:
1. Logic errors and edge cases
2. Off-by-one errors
3. Null/undefined issues
4. Performance anti-patterns
Be specific about line numbers and provide fixes.`

  return callAI([{ role: 'user', content: `Review this code for bugs and issues:\n\n\`\`\`javascript\n${code}\n\`\`\`` }], system, apiKey)
}

export async function chatWithAI(messages: Msg[], code: string, apiKey?: string): Promise<string> {
  const system = `You are AlgoVision IDE's AI assistant — an expert algorithm tutor.
The user is currently working with this code:
\`\`\`javascript
${code}
\`\`\`
Help them understand algorithms, debug issues, and learn CS concepts.
Be conversational, educational, and use examples. Format with markdown when helpful.`

  return callAI(messages, system, apiKey)
}
