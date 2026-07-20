/**
 * Multi-Language Execution Engine
 *
 * JavaScript/TypeScript → real local browser execution
 * Python → real CPython execution through Pyodide/WebAssembly
 * Compiled languages → configured isolated trace API, or labelled AI simulation
 */

import { ExecutionStep, Variable, StackFrame, DSAState, DSANode } from '../store/ideStore'
import { buildDSAState, interpretCode, resetDynamicVisualizationState } from './jsInterpreter'
import { callAI } from './aiService'
import { PythonTraceEvent, PythonTraceResult, runPythonDynamic } from './pythonRuntime'

export type SupportedLang = 'javascript' | 'typescript' | 'python' | 'java' | 'cpp' | 'c' | 'csharp' | 'go' | 'rust'

export interface LangRunResult {
  steps: ExecutionStep[]
  output: string[]
  mode: 'browser' | 'ai-simulated' | 'runtime-api' | 'dsa'
  language: SupportedLang
  error?: string
}

function getExecutionApiUrl(): string {
  return (globalThis as typeof globalThis & { __ALGOVISION_EXECUTION_API_URL__?: string })
    .__ALGOVISION_EXECUTION_API_URL__ || ''
}

// ─── Main dispatcher ──────────────────────────────────────────────────────────

export async function runMultiLang(
  code: string,
  language: SupportedLang,
  apiKey?: string
): Promise<LangRunResult> {

  if (language === 'javascript') {
    const result = interpretCode(code)
    return {
      steps: result.steps.length > 0 ? result.steps : makeFallbackSteps(code),
      output: result.output,
      mode: 'browser',
      language,
      error: result.error,
    }
  }

  if (language === 'typescript') {
    return runTypeScriptDynamic(code)
  }

  if (language === 'python') {
    return runPythonInBrowser(code)
  }

  if (getExecutionApiUrl()) {
    return runWithExecutionAPI(code, language)
  }

  // AI is an explicitly labelled simulation fallback for compiled languages.
  if (apiKey) {
    return simulateWithAI(code, language, apiKey)
  }

  // Without a runtime, return an actionable diagnostic rather than fake steps.
  return staticTrace(code, language)
}

// ─── AI Simulation ────────────────────────────────────────────────────────────

async function runTypeScriptDynamic(code: string): Promise<LangRunResult> {
  try {
    const ts = await import('typescript')
    const transpiled = ts.transpileModule(code, {
      fileName: 'algorithm.ts',
      reportDiagnostics: true,
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.None,
        removeComments: false,
        newLine: ts.NewLineKind.LineFeed,
      },
    })
    const errorDiagnostic = transpiled.diagnostics?.find(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error)
    if (errorDiagnostic) {
      const location = errorDiagnostic.file && errorDiagnostic.start !== undefined
        ? errorDiagnostic.file.getLineAndCharacterOfPosition(errorDiagnostic.start)
        : { line: 0, character: 0 }
      const message = ts.flattenDiagnosticMessageText(errorDiagnostic.messageText, '\n')
      return makeRuntimeError(code, 'typescript', 'TypeScriptError', message, location.line + 1, location.character + 1)
    }
    const result = interpretCode(transpiled.outputText)
    return {
      steps: result.steps.length > 0 ? result.steps : makeFallbackSteps(code),
      output: result.output,
      mode: 'browser',
      language: 'typescript',
      error: result.error,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return makeRuntimeError(code, 'typescript', 'TypeScriptRuntimeError', message, 1)
  }
}

function pythonVariableWritten(name: string, line: string): boolean {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  if (new RegExp(`^\\s*${escaped}\\s*(?:[+\\-*/%]?=|:)`).test(line)) return true
  if (new RegExp(`^\\s*(?:for|with)\\s+${escaped}\\b`).test(line)) return true
  if (new RegExp(`\\b${escaped}\\s*\\.(?:append|extend|insert|pop|remove|clear|sort|reverse|update|add|discard)\\s*\\(`).test(line)) return true
  const assignment = /(^|[^=!<>:])=(?!=)/.exec(line)
  if (assignment) {
    const lhs = line.slice(0, assignment.index + assignment[1].length)
    if (new RegExp(`\\b${escaped}\\s*(?:\\[|\\.)`).test(lhs)) return true
  }
  return false
}

function mergePythonVariables(current: PythonTraceEvent, next: PythonTraceEvent, line: string): Record<string, unknown> {
  const merged: Record<string, unknown> = {}
  const names = new Set([...Object.keys(current.variables), ...Object.keys(next.variables)])
  for (const name of names) {
    merged[name] = pythonVariableWritten(name, line) && name in next.variables
      ? next.variables[name]
      : name in current.variables ? current.variables[name] : next.variables[name]
  }
  return merged
}

function describePythonLine(line: string, variables: Record<string, unknown>): string {
  const trimmed = line.trim()
  if (trimmed.startsWith('if ')) return `Check: ${trimmed.slice(3).replace(/:$/, '')}`
  if (trimmed.startsWith('elif ')) return `Check: ${trimmed.slice(5).replace(/:$/, '')}`
  if (trimmed.startsWith('for ')) return `Loop: ${trimmed.replace(/:$/, '')}`
  if (trimmed.startsWith('while ')) return `Loop condition: ${trimmed.slice(6).replace(/:$/, '')}`
  if (trimmed.startsWith('return')) return `Return ${trimmed.slice(6).trim()}`
  const assignment = trimmed.match(/^([A-Za-z_]\w*)\s*(?:[+\-*/%]?=)/)
  if (assignment && assignment[1] in variables) {
    const value = JSON.stringify(variables[assignment[1]])
    return `${assignment[1]} = ${value?.slice(0, 80) ?? 'undefined'}`
  }
  return trimmed.slice(0, 100) || 'Execute line'
}

function explainPythonError(type: string, message: string): string {
  if (type === 'ExecutionLimitError') return `${message}. Check for an infinite loop or a condition that never becomes false.`
  if (type === 'NameError') return `${message}. Check the variable name and make sure it is assigned before this line.`
  if (type === 'TypeError') return `${message}. Check the value and data type used on this line.`
  if (type === 'IndexError') return `${message}. Check the index against the list or string length.`
  if (type === 'SyntaxError' || type === 'IndentationError') return `${message}. Check indentation, colons, brackets, and operators near this line.`
  return message
}

export function pythonTraceToSteps(trace: PythonTraceResult, code: string): ExecutionStep[] {
  resetDynamicVisualizationState()
  const lines = code.split('\n')
  const steps: ExecutionStep[] = []
  for (let index = 0; index < trace.events.length; index++) {
    const current = trace.events[index]
    const next = trace.events[index + 1] || current
    const line = Math.max(1, Math.min(current.line, lines.length))
    const lineCode = lines[line - 1] || ''
    const values = mergePythonVariables(current, next, lineCode)
    const previousVariables = steps[steps.length - 1]?.variables || []
    const variables: Variable[] = Object.entries(values).map(([name, value]) => {
      const previous = previousVariables.find(variable => variable.name === name)
      return {
        name,
        value,
        type: Array.isArray(value) ? 'Array' : value === null ? 'null' : typeof value,
        scope: current.callStack[current.callStack.length - 1] || 'main',
        changed: !previous || JSON.stringify(previous.value) !== JSON.stringify(value),
      }
    })
    const preferredName = Object.entries(values).find(([name, value]) =>
      (Array.isArray(value) || typeof value === 'string') && new RegExp(`\\b${name}\\b`).test(lineCode)
    )?.[0]
    const dsaState = buildDSAState(values, preferredName, lineCode)
    const callStack: StackFrame[] = current.callStack.map((name, frameIndex, stack) => ({
      id: `py-${index}-${frameIndex}`,
      name,
      line,
      variables: [],
      isActive: frameIndex === stack.length - 1,
    }))
    steps.push({
      line,
      description: describePythonLine(lineCode, values),
      variables,
      callStack,
      heap: [],
      output: '',
      dsaState,
    })
  }

  if (trace.error) {
    const previous = steps[steps.length - 1]
    const errorLine = Math.max(1, Math.min(trace.error.line, lines.length))
    const message = explainPythonError(trace.error.type, trace.error.message)
    steps.push({
      line: errorLine,
      description: `${trace.error.type} on line ${errorLine}: ${message}`,
      variables: previous?.variables || [],
      callStack: previous?.callStack || [],
      heap: previous?.heap || [],
      output: message,
      dsaState: previous?.dsaState,
      diagnostic: {
        severity: 'error',
        type: trace.error.type,
        message,
        line: errorLine,
        column: trace.error.column,
      },
      maxStepsWarning: trace.error.type === 'ExecutionLimitError',
    })
  } else {
    const functionMatch = code.match(/^\s*def\s+([A-Za-z_]\w*)\s*\(/m)
    const functionWasCalled = functionMatch && trace.events.some(event => event.callStack.includes(functionMatch[1]))
    if (functionMatch && !functionWasCalled) {
      const line = lines.findIndex(sourceLine => new RegExp(`^\\s*def\\s+${functionMatch[1]}\\b`).test(sourceLine)) + 1 || 1
      const message = `${functionMatch[1]} is defined but was never called. Add an example call with test input to generate a complete execution flow.`
      const previous = steps[steps.length - 1]
      steps.push({
        line,
        description: `Waiting for input: ${message}`,
        variables: previous?.variables || [],
        callStack: previous?.callStack || [],
        heap: previous?.heap || [],
        output: '',
        dsaState: previous?.dsaState,
        diagnostic: { severity: 'warning', type: 'NoTestInput', message, line, column: 1 },
      })
    }
  }
  return steps
}

async function runPythonInBrowser(code: string): Promise<LangRunResult> {
  try {
    const trace = await runPythonDynamic(code)
    const steps = pythonTraceToSteps(trace, code)
    return {
      steps: steps.length > 0 ? steps : makeFallbackSteps(code),
      output: trace.output,
      mode: 'browser',
      language: 'python',
      error: trace.error?.message,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return makeRuntimeError(code, 'python', 'PythonRuntimeError', message, 1)
  }
}

async function runWithExecutionAPI(code: string, language: SupportedLang): Promise<LangRunResult> {
  try {
    const response = await fetch(getExecutionApiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language, trace: true, maxSteps: 3000 }),
    })
    const payload = await response.json() as Partial<LangRunResult> & { error?: string }
    if (!response.ok) throw new Error(payload.error || `Execution service returned ${response.status}`)
    if (!Array.isArray(payload.steps)) throw new Error('Execution service did not return a step trace')
    return {
      steps: payload.steps,
      output: Array.isArray(payload.output) ? payload.output : [],
      mode: 'runtime-api',
      language,
      error: payload.error,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return makeRuntimeError(code, language, 'RuntimeServiceError', message, 1)
  }
}

function makeRuntimeError(
  code: string,
  language: SupportedLang,
  type: string,
  message: string,
  line: number,
  column = 1,
): LangRunResult {
  const boundedLine = Math.max(1, Math.min(line, code.split('\n').length))
  return {
    steps: [{
      line: boundedLine,
      description: `${type}: ${message}`,
      variables: [],
      callStack: [],
      heap: [],
      output: message,
      diagnostic: { severity: 'error', type, message, line: boundedLine, column },
    }],
    output: [`${type}: ${message}`],
    mode: type === 'RuntimeUnavailable' || type === 'RuntimeServiceError' ? 'runtime-api' : 'browser',
    language,
    error: message,
  }
}

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
    const failure = makeRuntimeError(code, language, 'AISimulationError', msg, 1)
    return {
      ...failure,
      output: [`AI simulation failed: ${msg}`],
      mode: 'ai-simulated',
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

// ─── Missing runtime diagnostic ───────────────────────────────────────────────

function staticTrace(code: string, language: SupportedLang): LangRunResult {
  return makeRuntimeError(
    code,
    language,
    'RuntimeUnavailable',
    `True dynamic ${language.toUpperCase()} tracing requires an isolated execution service. Configure VITE_EXECUTION_API_URL, or add an AI key for clearly labelled simulation.`,
    1,
  )
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
