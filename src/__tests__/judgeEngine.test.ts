import { evaluateJudgeCase, extractJudgeActual, judgeValuesEqual } from '../utils/judgeEngine'
import type { ExecutionStep } from '../store/ideStore'

const step = (line: number, output = '', error?: string): ExecutionStep => ({
  line,
  variables: [],
  callStack: [],
  heap: [],
  output,
  description: `line ${line}`,
  diagnostic: error ? { severity: 'error', type: 'RuntimeError', message: error, line } : undefined,
})

describe('judge engine', () => {
  it('extracts the final Result output', () => {
    expect(extractJudgeActual(['debug', 'Result: [1,2,3]'])).toBe('[1,2,3]')
  })

  it('compares structured values semantically', () => {
    expect(judgeValuesEqual('{"b":2,"a":1}', '{ "a": 1, "b": 2 }')).toBe(true)
    expect(judgeValuesEqual('[True, None]', '[true, null]')).toBe(true)
  })

  it('reports the result-producing step for a wrong answer', () => {
    const result = evaluateJudgeCase(
      { id: 'case-1', input: 'nums = [2,1]', expected: '[1,2]' },
      { steps: [step(1), step(7, 'Result: [2,1]')], output: ['Result: [2,1]'] },
      4,
    )
    expect(result.status).toBe('failed')
    expect(result.failingStepIndex).toBe(1)
    expect(result.failingLine).toBe(7)
  })

  it('prioritizes the exact diagnostic step for runtime errors', () => {
    const result = evaluateJudgeCase(
      { id: 'case-2', input: 'head = []', expected: 'null' },
      { steps: [step(2), step(5, '', 'undefined access')], output: [], error: 'undefined access' },
      6,
    )
    expect(result.status).toBe('error')
    expect(result.failingStepIndex).toBe(1)
    expect(result.failingLine).toBe(5)
  })
})
