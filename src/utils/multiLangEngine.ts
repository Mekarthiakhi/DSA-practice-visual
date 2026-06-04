/**
 * Multi-Language Execution Engine
 *
 * JavaScript/TypeScript  → real in-browser JS interpreter (Proxy tracing)
 * Python / Java / C / C++ / C# → AI-powered simulation via Anthropic API
 *   The AI returns a structured JSON trace that matches our ExecutionStep format,
 *   so the visualizer, variable panel, call stack all work identically.
 */

import { ExecutionStep, Variable, StackFrame, DSAState, DSANode } from '../store/ideStore'
import { interpretCode } from './jsInterpreter'
import { callAI } from './aiService'

export type SupportedLang = 'javascript' | 'typescript' | 'python' | 'java' | 'cpp' | 'c' | 'csharp' | 'go' | 'rust'

export interface LangRunResult {
  steps: ExecutionStep[]
  output: string[]
  mode: 'browser' | 'ai-simulated' | 'dsa'
  language: SupportedLang
  error?: string
}

// Languages that run natively in-browser
const BROWSER_LANGS: SupportedLang[] = ['javascript', 'typescript']

// DSA algos with rich step generators
const DSA_ALGO_SET = new Set([
  'bubbleSort','selectionSort','insertionSort','mergeSort','quickSort',
  'binarySearch','linearSearch','fibonacci','factorial',
  'linkedList','doublyLinkedList','bst','avl',
  'bfs','dfs','dijkstra','stack','queue','hashMap',
  'twoSum','reverseString','fizzBuzz',
])

// ─── Main dispatcher ──────────────────────────────────────────────────────────

export async function runMultiLang(
  code: string,
  language: SupportedLang,
  apiKey?: string
): Promise<LangRunResult> {

  // 1. JS/TS: run natively in browser
  if (BROWSER_LANGS.includes(language)) {
    const result = interpretCode(code)
    return {
      steps: result.steps.length > 0 ? result.steps : makeFallbackSteps(code),
      output: result.output,
      mode: 'browser',
      language,
      error: result.error,
    }
  }

  // 2. Other languages: AI simulation
  if (apiKey) {
    return simulateWithAI(code, language, apiKey)
  }

  // 3. No API key — return syntax-highlighted static trace
  return staticTrace(code, language)
}

// ─── AI Simulation ────────────────────────────────────────────────────────────

async function simulateWithAI(
  code: string,
  language: SupportedLang,
  apiKey: string
): Promise<LangRunResult> {
  const prompt = buildSimulationPrompt(code, language)

  try {
    const systemPrompt = `You are a ${language} code execution simulator for an IDE visualizer.
You receive code and return a PRECISE JSON trace of its execution.
Return ONLY valid JSON, no markdown, no explanation.`

    const text = await callAI([{ role: 'user', content: prompt }], systemPrompt, apiKey)
    const clean = text.replace(/```(?:json)?\n?|\n?```/gi, '').trim()
    const parsed = JSON.parse(clean) as AITraceResponse

    return {
      steps: aiTraceToSteps(parsed, code),
      output: parsed.console_output || [],
      mode: 'ai-simulated',
      language,
      error: parsed.error ?? undefined,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      steps: makeFallbackSteps(code),
      output: [`⚠️ AI simulation failed: ${msg}`, 'Showing static trace instead.'],
      mode: 'ai-simulated',
      language,
      error: msg,
    }
  }
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildSimulationPrompt(code: string, language: SupportedLang): string {
  return `Simulate execution of this ${language} code step by step.

CODE:
\`\`\`${language}
${code}
\`\`\`

Return a JSON object with this EXACT structure:
{
  "language": "${language as string}",
  "console_output": ["line1", "line2"],
  "error": null,
  "steps": [
    {
      "line": 1,
      "description": "Human-readable description of what happens",
      "variables": [
        {
          "name": "variableName",
          "value": <actual value - number/string/array/object>,
          "type": "int|string|array|bool|float|object|null",
          "scope": "main|functionName|global",
          "changed": true
        }
      ],
      "call_stack": ["main", "functionName"],
      "output": "",
      "dsa_hint": {
        "type": "array|none",
        "array_values": [1,2,3],
        "highlight": {},
        "message": "optional message"
      }
    }
  ]
}

RULES:
- Maximum 60 steps (skip trivial consecutive lines that don't change state)
- Include EVERY variable assignment, loop iteration, function call, return
- For arrays/lists, show the ACTUAL values at each step
- For sorting: in dsa_hint.highlight use {index: "comparing"|"swapping"|"sorted"|"active"|"none"}
- For searching: show left/right/mid pointers
- For recursion: show the call stack depth
- console_output: array of strings that would print to stdout
- error: null if no error, else the error message string
- Keep descriptions short (under 60 chars) but informative
- Show at most 20 variables per step
- RETURN ONLY JSON`
}

// ─── AI Trace Response → ExecutionSteps ──────────────────────────────────────

interface AIVariable {
  name: string
  value: unknown
  type: string
  scope: string
  changed?: boolean
}

interface AIStep {
  line: number
  description: string
  variables: AIVariable[]
  call_stack: string[]
  output?: string
  dsa_hint?: {
    type: string
    array_values?: unknown[]
    highlight?: Record<string, string>
    message?: string
  }
}

interface AITraceResponse {
  language: string
  console_output: string[]
  error?: string | null
  steps: AIStep[]
}

function aiTraceToSteps(trace: AITraceResponse, code: string): ExecutionStep[] {
  const codeLines = code.split('\n')

  return trace.steps.map((s): ExecutionStep => {
    const variables: Variable[] = (s.variables || []).map(v => ({
      name: v.name,
      value: v.value,
      type: v.type || 'unknown',
      scope: v.scope || 'main',
      changed: v.changed ?? false,
    }))

    const callStack: StackFrame[] = (s.call_stack || ['main']).map((name, i, arr) => ({
      id: `f${i}`,
      name,
      line: s.line,
      variables: [],
      isActive: i === arr.length - 1,
    }))

    const dsaState = buildDSAFromHint(s.dsa_hint, variables)

    return {
      line: s.line,
      description: s.description || codeLines[s.line - 1]?.trim() || `Line ${s.line}`,
      variables,
      callStack,
      heap: [],
      output: s.output || '',
      dsaState,
    }
  })
}

function buildDSAFromHint(
  hint: AIStep['dsa_hint'],
  variables: Variable[]
): DSAState | undefined {
  // If AI gave an explicit array hint
  if (hint?.type === 'array' && hint.array_values) {
    const hl = hint.highlight || {}
    const nodes: DSANode[] = hint.array_values.map((v, i) => ({
      id: `n${i}`,
      value: String(v),
      highlight: (hl[i] || hl[String(i)] || 'none') as DSANode['highlight'],
    }))
    return { type: 'array', nodes, message: hint.message }
  }

  // Auto-detect from variables: find any numeric array
  const arrVar = variables.find(v =>
    Array.isArray(v.value) &&
    (v.value as unknown[]).length > 0 &&
    typeof (v.value as unknown[])[0] === 'number'
  )
  if (arrVar) {
    const arr = arrVar.value as number[]
    const nodes: DSANode[] = arr.slice(0, 20).map((v, i) => ({
      id: `n${i}`, value: v, highlight: 'none' as const,
    }))
    return { type: 'array', nodes, message: `${arrVar.name}: [${arr.join(', ')}]` }
  }

  return undefined
}

// ─── Static trace (no API key) ────────────────────────────────────────────────

function staticTrace(code: string, language: SupportedLang): LangRunResult {
  const lines = code.split('\n')
  const steps: ExecutionStep[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line.startsWith('//') || line.startsWith('#') || line.startsWith('*')) continue

    steps.push({
      line: i + 1,
      description: describeCodeLine(line, language),
      variables: [],
      callStack: [{ id: 'f0', name: 'main', line: i + 1, variables: [], isActive: true }],
      heap: [],
      output: '',
      dsaState: undefined,
    })
  }

  if (steps.length === 0) {
    steps.push({
      line: 1, description: 'Empty program',
      variables: [], callStack: [], heap: [], output: '',
    })
  }

  return {
    steps,
    output: [
      `ℹ️  ${language.toUpperCase()} code loaded (${lines.length} lines)`,
      `💡 Add your Anthropic API key in the AI panel for live execution tracing`,
      `   DSA algorithms (sort, search, etc.) will visualize automatically`,
    ],
    mode: 'ai-simulated',
    language,
  }
}

function describeCodeLine(line: string, lang: SupportedLang): string {
  // Python
  if (lang === 'python') {
    if (line.startsWith('def ')) return `Define function ${line.slice(4).split('(')[0]}`
    if (line.startsWith('class ')) return `Define class ${line.slice(6).split(':')[0]}`
    if (line.startsWith('for ')) return `Loop: ${line}`
    if (line.startsWith('while ')) return `While loop`
    if (line.startsWith('if ')) return `Condition: ${line.slice(3)}`
    if (line.startsWith('return ')) return `Return ${line.slice(7)}`
    if (line.startsWith('print(')) return `Print output`
    if (line.includes('=') && !line.includes('==')) return `Assign: ${line}`
  }
  // Java / C++ / C
  if (['java','cpp','c','csharp'].includes(lang)) {
    if (line.includes('System.out.println') || line.includes('printf') || line.includes('cout'))
      return 'Print output'
    if (line.match(/^\w+\s+\w+\s*=/)) return `Declare: ${line}`
    if (line.startsWith('for ') || line.startsWith('for(')) return `For loop: ${line.substring(0, 40)}`
    if (line.startsWith('while')) return 'While loop iteration'
    if (line.startsWith('if ') || line.startsWith('if(')) return `Check: ${line.substring(3, 40)}`
    if (line.startsWith('return')) return `Return: ${line.substring(7, 40)}`
    if (line.includes('(') && line.endsWith(';')) return `Call: ${line.split('(')[0].trim()}`
  }
  return line.substring(0, 60)
}

function makeFallbackSteps(code: string): ExecutionStep[] {
  return code.split('\n').filter(l => l.trim()).map((line, i) => ({
    line: i + 1,
    description: line.trim().substring(0, 60),
    variables: [],
    callStack: [{ id: 'f0', name: 'main', line: i + 1, variables: [], isActive: true }],
    heap: [],
    output: '',
  }))
}
