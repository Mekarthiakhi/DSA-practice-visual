import type { ExecutionStep } from '../store/ideStore'

export interface JudgeTestCase {
  id: string
  input: string
  expected: string
}

export interface JudgeExecution {
  steps: ExecutionStep[]
  output: string[]
  error?: string
}

export interface JudgeCaseResult extends JudgeTestCase {
  status: 'passed' | 'failed' | 'error' | 'fixture-required'
  actual: string
  message?: string
  failingStepIndex?: number
  failingLine?: number
  durationMs: number
  steps: ExecutionStep[]
}

function parseComparable(value: string): unknown {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const normalized = trimmed
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/\bNone\b/g, 'null')
  try {
    return JSON.parse(normalized)
  } catch {
    return normalized.replace(/\s+/g, ' ')
  }
}

function stableValue(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableValue).join(',')}]`
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${stableValue(record[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

export function extractJudgeActual(output: string[]): string {
  const resultLine = [...output].reverse().find(line => /^Result:\s*/.test(line.trim()))
  return resultLine ? resultLine.replace(/^\s*Result:\s*/, '').trim() : output[output.length - 1]?.trim() || ''
}

export function judgeValuesEqual(actual: string, expected: string): boolean {
  return stableValue(parseComparable(actual)) === stableValue(parseComparable(expected))
}

export function evaluateJudgeCase(
  testCase: JudgeTestCase,
  execution: JudgeExecution,
  durationMs: number,
): JudgeCaseResult {
  const diagnosticIndex = execution.steps.findIndex(step => step.diagnostic?.severity === 'error')
  let outputStepIndex = -1
  for (let index = execution.steps.length - 1; index >= 0; index--) {
    if (/^Result:\s*/m.test(execution.steps[index].output || '')) {
      outputStepIndex = index
      break
    }
  }
  const failureIndex = diagnosticIndex >= 0
    ? diagnosticIndex
    : outputStepIndex >= 0 ? outputStepIndex : Math.max(0, execution.steps.length - 1)
  const actual = extractJudgeActual(execution.output)
  const status = execution.error ? 'error' : judgeValuesEqual(actual, testCase.expected) ? 'passed' : 'failed'
  return {
    ...testCase,
    status,
    actual,
    message: execution.error || (status === 'failed' ? 'Output differs from expected result.' : undefined),
    failingStepIndex: status === 'passed' ? undefined : failureIndex,
    failingLine: status === 'passed' ? undefined : execution.steps[failureIndex]?.line,
    durationMs,
    steps: execution.steps,
  }
}
