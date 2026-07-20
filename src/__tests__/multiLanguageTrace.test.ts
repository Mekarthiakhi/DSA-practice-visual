jest.mock('../utils/aiService', () => ({ callAI: jest.fn() }))

import { pythonTraceToSteps, runMultiLang } from '../utils/multiLangEngine'
import { PythonTraceResult } from '../utils/pythonRuntime'

describe('Python dynamic trace conversion', () => {
  const code = `def bubble_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        for j in range(n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr`

  it('keeps Python comparisons and writes synchronized to two elements', () => {
    const trace: PythonTraceResult = {
      output: [],
      events: [
        { line: 5, variables: { arr: [5, 2, 8], n: 3, i: 0, j: 0 }, callStack: ['main', 'bubble_sort'] },
        { line: 6, variables: { arr: [5, 2, 8], n: 3, i: 0, j: 0 }, callStack: ['main', 'bubble_sort'] },
        { line: 4, variables: { arr: [2, 5, 8], n: 3, i: 0, j: 1 }, callStack: ['main', 'bubble_sort'] },
      ],
    }

    const steps = pythonTraceToSteps(trace, code)
    const comparison = steps[0]
    const swap = steps[1]

    expect(comparison.dsaState?.pointerName).toBe('j')
    expect(comparison.dsaState?.pointer2Name).toBe('j + 1')
    expect(comparison.dsaState?.nodes.filter(node => node.highlight === 'comparing')).toHaveLength(2)
    expect(swap.dsaState?.nodes.map(node => node.value)).toEqual([2, 5, 8])
    expect(swap.dsaState?.nodes.filter(node => node.highlight === 'swapping')).toHaveLength(2)
    expect(swap.variables.find(variable => variable.name === 'j')?.value).toBe(0)
  })

  it('turns Python failures into flow and editor diagnostics', () => {
    const trace: PythonTraceResult = {
      output: [],
      events: [{ line: 2, variables: { nums: [1, 2] }, callStack: ['main'] }],
      error: { type: 'NameError', message: "name 'missing' is not defined", line: 2, column: 7 },
    }
    const steps = pythonTraceToSteps(trace, 'nums = [1, 2]\nprint(missing)')
    const diagnostic = steps[steps.length - 1].diagnostic

    expect(diagnostic).toEqual(expect.objectContaining({ type: 'NameError', line: 2, column: 7 }))
  })

  it('warns when a Python function has no test input', () => {
    const steps = pythonTraceToSteps({
      output: [],
      events: [{ line: 1, variables: {}, callStack: ['main'] }],
    }, 'def search(nums, target):\n    return -1')

    expect(steps[steps.length - 1].diagnostic).toEqual(expect.objectContaining({
      severity: 'warning',
      type: 'NoTestInput',
      line: 1,
    }))
  })
})

describe('TypeScript dynamic execution', () => {
  it('transpiles typed DSA code and traces its real output', async () => {
    const result = await runMultiLang(`function swapFirst(values: number[]): number[] {
  [values[0], values[1]] = [values[1], values[0]];
  return values;
}
const result: number[] = swapFirst([5, 2, 8]);
console.log(result);`, 'typescript')

    expect(result.mode).toBe('browser')
    expect(result.error).toBeUndefined()
    expect(result.output).toContain('[2,5,8]')
    expect(result.steps.some(step => step.dsaState?.nodes.map(node => node.value).join(',') === '2,5,8')).toBe(true)
  })
})

describe('compiled-language runtime routing', () => {
  it('does not pretend a static scan is dynamic execution', async () => {
    const result = await runMultiLang('public class Main {}', 'java')

    expect(result.mode).toBe('runtime-api')
    expect(result.error).toContain('isolated execution service')
    expect(result.steps[0].diagnostic?.type).toBe('RuntimeUnavailable')
  })
})
