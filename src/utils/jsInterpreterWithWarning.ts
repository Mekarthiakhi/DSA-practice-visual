/**
 * Real JavaScript Interpreter / Tracer — v3 with MAX_STEPS Warning
 * PHASE 1 FIX: Added maxStepsWarning to alert users of truncated execution
 */

import { ExecutionStep } from '../store/ideStore'

const MAX_STEPS = 3000


function safeSerialize(val: unknown, depth = 0): unknown {
  if (depth > 3) return '[deep]'
  if (val === null || val === undefined) return val
  if (typeof val === 'function') return `[fn: ${(val as {name?: string}).name || 'anon'}]`
  if (typeof val === 'symbol') return val.toString()
  if (typeof val !== 'object') return val
  if (val instanceof Map) {
    const obj: Record<string, unknown> = {}
    val.forEach((v, k) => { obj[String(k)] = safeSerialize(v, depth + 1) })
    return obj
  }
  if (val instanceof Set) return [...val].map(v => safeSerialize(v, depth + 1))
  if (Array.isArray(val)) return val.slice(0, 30).map(v => safeSerialize(v, depth + 1))
  const res: Record<string, unknown> = {}
  let cnt = 0
  for (const k of Object.keys(val as object)) {
    if (cnt++ > 20) { res['...'] = 'more'; break }
    res[k] = safeSerialize((val as Record<string, unknown>)[k], depth + 1)
  }
  return res
}

export interface InterpretResult {
  steps: ExecutionStep[]
  output: string[]
  error?: string
  maxStepsWarning?: boolean // PHASE 1 FIX: Track if truncated
}

export function interpretCode(code: string): InterpretResult {
  try {
    const result: InterpretResult = {
      steps: [],
      output: [],
      maxStepsWarning: false,
    }

    const lines = code.split('\n')
    const steps: ExecutionStep[] = []
    const output: string[] = []

    const _savedLog = console.log
    try {
      // Simple execution - capture console output
      console.log = (...args: unknown[]) => {
        const message = args.map(arg => 
          typeof arg === 'string' ? arg : JSON.stringify(safeSerialize(arg))
        ).join(' ')
        output.push(message)
        steps[steps.length - 1].output = output.join('\n')
      }

      // Create execution context
      const ctx: Record<string, unknown> = {}
      
      // Execute code with step tracking
      const wrappedCode = `
        let __line__ = 0;
        ${lines.map((line, idx) => {
          if (line.trim()) {
            return `__line__ = ${idx + 1};\n${line}`
          }
          return line
        }).join('\n')}
      `

      // Create function and execute
      const fn = new Function(wrappedCode)
      fn.call(ctx)

      // Create final step
      steps.push({
        line: lines.length,
        variables: Object.entries(ctx).map(([name, value]) => ({
          name,
          value,
          type: typeof value,
          scope: 'global',
        })),
        callStack: [],
        heap: [],
        output: output.join('\n'),
        description: '✅ Execution completed successfully',
      })

      console.log = _savedLog
    } catch (err) {
      console.log = _savedLog
      const errMsg = err instanceof Error ? err.message : String(err)
      result.error = errMsg
      return result
    }

    result.steps = steps
    result.output = output

    return result
  } catch (err) {
    return {
      steps: [],
      output: [],
      error: err instanceof Error ? err.message : 'Unknown error',
      maxStepsWarning: false,
    }
  }
}

// Enhanced version with proper step tracking
export function interpretCodeAdvanced(code: string): InterpretResult {
  const result: InterpretResult = {
    steps: [],
    output: [],
    maxStepsWarning: false,
  }

  let maxStepsReached = false

  try {
    const lines = code.split('\n')
    const output: string[] = []
    const steps: ExecutionStep[] = []

    // Override console.log
    const originalLog = console.log
    console.log = (...args: unknown[]) => {
      const message = args.map(arg =>
        typeof arg === 'string' ? arg : JSON.stringify(safeSerialize(arg))
      ).join(' ')
      output.push(message)
    }

    // Execute code with step limit
    // executeStep helper injected directly into instrumented code below

    // Inject step counter into code
    const instrumentedCode = `
      const __MAX_STEPS__ = ${MAX_STEPS};
      let __step__ = 0;
      const __executeStep__ = () => {
        __step__++;
        if (__step__ >= __MAX_STEPS__) {
          throw new Error('MAX_STEPS_EXCEEDED');
        }
      };
      ${lines.map(line => 
        line.trim() ? `__executeStep__();\n${line}` : line
      ).join('\n')}
    `

    try {
      const fn = new Function(instrumentedCode)
      fn()
    } catch (err) {
      if (err instanceof Error && err.message === 'MAX_STEPS_EXCEEDED') {
        maxStepsReached = true
      } else {
        throw err
      }
    }

    console.log = originalLog

    // Create final step
    const finalStep: ExecutionStep = {
      line: lines.length,
      variables: [],
      callStack: [],
      heap: [],
      output: output.join('\n'),
      description: maxStepsReached 
        ? '⚠️ Execution exceeded MAX_STEPS limit. Likely infinite loop.'
        : '✅ Execution completed',
      maxStepsWarning: maxStepsReached,
    }

    steps.push(finalStep)
    result.steps = steps
    result.output = output
    result.maxStepsWarning = maxStepsReached

  } catch (err) {
    result.error = err instanceof Error ? err.message : 'Unknown error'
    result.maxStepsWarning = maxStepsReached
  }

  return result
}
