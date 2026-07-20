import { runCode } from '../utils/universalEngine'
import { useIDEStore } from '../store/ideStore'

describe('dynamic source synchronization', () => {
  const bubbleSortCode = `function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}

const result = bubbleSort([5, 2, 8, 1, 9]);`

  it('executes edited source instead of a canonical algorithm demo', () => {
    const code = `function bubbleSort(arr) {
  arr[0] = 42;
  return arr;
}
const result = bubbleSort([3, 2, 1]);
console.log(result);`

    const result = runCode(code, 'auto')

    expect(result.algo).toBe('bubbleSort')
    expect(result.output).toContain('[42,2,1]')
    expect(result.output).not.toContain('[1,2,3]')
    expect(result.visualization?.synchronized).toBe(true)
  })

  it('adds a runtime error step at the failing source line', () => {
    const result = runCode('const nums = [1, 2];\nconsole.log(missingValue);', 'auto')
    const errorStep = result.steps.find(step => step.diagnostic?.severity === 'error')

    expect(result.error).toContain('missingValue')
    expect(errorStep?.line).toBe(2)
    expect(errorStep?.diagnostic?.type).toBe('ReferenceError')
    expect(errorStep?.description).toContain('Error on line 2')
  })

  it('explains when a problem function has no test invocation', () => {
    const result = runCode('function twoSum(nums, target) {\n  return [];\n}', 'auto')
    const warning = result.steps.find(step => step.diagnostic?.type === 'NoTestInput')

    expect(warning?.diagnostic?.severity).toBe('warning')
    expect(warning?.diagnostic?.message).toContain('never called')
    expect(warning?.line).toBe(1)
  })

  it('turns runaway loops into a visible execution-limit error', () => {
    const result = runCode('let i = 0;\nwhile (true) {\n  i++;\n}', 'auto')
    const errorStep = result.steps.find(step => step.diagnostic?.type === 'ExecutionLimitError')

    expect(result.error).toContain('infinite loop')
    expect(errorStep?.diagnostic?.severity).toBe('error')
    expect(errorStep?.maxStepsWarning).toBe(true)
  })

  it('turns syntax failures into editor diagnostics', () => {
    const result = runCode('const nums = [1, 2;\nconsole.log(nums);', 'auto')
    const errorStep = result.steps.find(step => step.diagnostic?.type === 'SyntaxError')

    expect(result.error).toContain('Check brackets')
    expect(errorStep?.diagnostic?.severity).toBe('error')
    expect(errorStep?.line).toBeGreaterThan(0)
  })

  it('invalidates old execution steps as soon as source changes', () => {
    const originalCode = useIDEStore.getState().code
    useIDEStore.setState({
      executionSteps: [{
        line: 5,
        description: 'old trace',
        variables: [],
        callStack: [],
        heap: [],
        output: '',
      }],
      currentStepIndex: 0,
      executionStatus: 'paused',
    })

    useIDEStore.getState().setCode(`${originalCode}\n// edited`)

    expect(useIDEStore.getState().executionSteps).toEqual([])
    expect(useIDEStore.getState().executionStatus).toBe('idle')
  })

  it('keeps currentLine synchronized when jumping through the flow', () => {
    useIDEStore.setState({
      executionSteps: [
        { line: 2, description: 'first', variables: [], callStack: [], heap: [], output: '' },
        { line: 7, description: 'second', variables: [], callStack: [], heap: [], output: '' },
      ],
      currentStepIndex: 0,
      currentLine: 2,
    })

    useIDEStore.getState().setCurrentStepIndex(1)

    expect(useIDEStore.getState().currentLine).toBe(7)
  })

  it('uses j and j + 1 as the only comparison pointers', () => {
    const result = runCode(bubbleSortCode, 'auto')
    const comparisons = result.steps.filter(step => step.line === 5 && step.dsaState?.type === 'array')

    expect(comparisons.length).toBeGreaterThan(0)
    for (const step of comparisons) {
      expect(step.variables.find(variable => variable.name === 'j')?.value).toBe(step.dsaState?.pointer)
      expect(step.dsaState?.pointerName).toBe('j')
      expect(step.dsaState?.pointer2Name).toBe('j + 1')
      expect(step.dsaState?.nodes.filter(node => node.highlight === 'comparing')).toHaveLength(2)
      expect(step.dsaState?.nodes.filter(node => node.highlight === 'active')).toHaveLength(0)
    }
  })

  it('writes and highlights exactly the two swapped elements', () => {
    const result = runCode(bubbleSortCode, 'auto')
    const firstSwap = result.steps.find(step => step.line === 6 && step.dsaState?.nodes.some(node => node.highlight === 'swapping'))

    expect(firstSwap?.dsaState?.nodes.map(node => node.value)).toEqual([2, 5, 8, 1, 9])
    expect(firstSwap?.dsaState?.pointerName).toBe('j')
    expect(firstSwap?.dsaState?.pointer2Name).toBe('j + 1')
    expect(firstSwap?.dsaState?.nodes.filter(node => node.highlight === 'swapping')).toHaveLength(2)
  })

  it('resolves multi-operator array index expressions', () => {
    const result = runCode(`const arr = [10, 20, 30, 40, 50];
const i = 1;
const ordered = arr[2 * i] < arr[2 * i + 1];`, 'auto')
    const comparison = result.steps.find(step => step.line === 3)

    expect(comparison?.dsaState?.pointer).toBe(2)
    expect(comparison?.dsaState?.pointer2).toBe(3)
    expect(comparison?.dsaState?.pointerName).toBe('2 * i')
    expect(comparison?.dsaState?.pointer2Name).toBe('2 * i + 1')
    expect(comparison?.dsaState?.nodes.filter(node => node.highlight === 'comparing')).toHaveLength(2)
  })

  it('derives string pointers from the expressions on the current line', () => {
    const result = runCode(`const text = "abcd";
const j = 1;
const same = text[j] === text[j + 1];`, 'auto')
    const comparison = result.steps.find(step => step.line === 3)

    expect(comparison?.dsaState?.type).toBe('string')
    expect(comparison?.dsaState?.pointerName).toBe('j')
    expect(comparison?.dsaState?.pointer2Name).toBe('j + 1')
    expect(comparison?.dsaState?.nodes.filter(node => node.highlight === 'comparing')).toHaveLength(2)
  })

  it('traces multiline object literals used as LeetCode lookup tables', () => {
    const result = runCode(`function isValid(s) {
  const stack = [];
  const pairs = {
    '(': ')',
    '[': ']',
    '{': '}'
  };
  for (let i = 0; i < s.length; i++) {
    if (pairs[s[i]]) stack.push(pairs[s[i]]);
    else if (stack.pop() !== s[i]) return false;
  }
  return stack.length === 0;
}
console.log(isValid('()[]{}'));`, 'auto')

    expect(result.error).toBeUndefined()
    expect(result.output).toContain('true')
    expect(result.steps.length).toBeGreaterThan(3)
    expect(result.steps.some(step => step.variables.some(variable => variable.name === 'stack'))).toBe(true)
  })
})
