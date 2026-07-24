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

  it('does not require a function call result to use the variable name result', () => {
    const renamedResultCode = bubbleSortCode.replace(
      'const result = bubbleSort([5, 2, 8, 1, 9]);',
      'const sortedValues = bubbleSort([9, 4, 2]);',
    )
    const result = runCode(renamedResultCode, 'auto')

    expect(result.error).toBeUndefined()
    expect(result.algo).toBe('bubbleSort')
    expect(result.steps.some(step =>
      step.dsaState?.nodes.map(node => node.value).join(',') === '2,4,9'
    )).toBe(true)
    expect(result.steps.some(step =>
      step.variables.some(variable => variable.name === 'sortedValues')
    )).toBe(true)
  })

  it('supports let anyVariable = anyFunction(anyArgs) without naming conventions', () => {
    const code = `function arrangeItems(items, descending) {
  const copy = [...items];
  copy.sort((a, b) => descending ? b - a : a - b);
  return copy;
}
let test = arrangeItems([8, 3, 6, 1], false);`
    const result = runCode(code, 'auto')

    expect(result.error).toBeUndefined()
    expect(result.steps.some(step =>
      step.variables.some(variable =>
        variable.name === 'test' && JSON.stringify(variable.value) === '[1,3,6,8]'
      )
    )).toBe(true)
    expect(result.steps.some(step =>
      step.dsaState?.nodes.map(node => node.value).join(',') === '1,3,6,8'
    )).toBe(true)
  })

  it('accepts a separately named input variable and a direct unassigned call', () => {
    const withNamedInput = bubbleSortCode.replace(
      'const result = bubbleSort([5, 2, 8, 1, 9]);',
      'const customValues = [7, 3, 5];\nconst answer = bubbleSort(customValues);',
    )
    const directCall = bubbleSortCode.replace(
      'const result = bubbleSort([5, 2, 8, 1, 9]);',
      'bubbleSort([6, 1, 4]);',
    )

    const namedResult = runCode(withNamedInput, 'auto')
    const directResult = runCode(directCall, 'auto')

    expect(namedResult.error).toBeUndefined()
    expect(namedResult.steps.some(step =>
      step.dsaState?.nodes.map(node => node.value).join(',') === '3,5,7'
    )).toBe(true)
    expect(directResult.error).toBeUndefined()
    expect(directResult.steps.some(step =>
      step.dsaState?.nodes.map(node => node.value).join(',') === '1,4,6'
    )).toBe(true)
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

  it('keeps nested loop-control pointers on the loop currently executing', () => {
    const result = runCode(bubbleSortCode, 'auto')
    const innerLoopSteps = result.steps.filter(step => step.line === 4 && step.dsaState?.type === 'array')
    const outerLoopSteps = result.steps.filter(step => step.line === 3 && step.dsaState?.type === 'array')

    expect(innerLoopSteps.length).toBeGreaterThan(0)
    expect(outerLoopSteps.length).toBeGreaterThan(1)

    for (const step of innerLoopSteps) {
      expect(step.dsaState?.pointerName).toBe('j')
      expect(step.dsaState?.pointer2).toBeUndefined()
      expect(step.dsaState?.auxiliaryData?.outerLoopPointer).toEqual({
        index: step.variables.find(variable => variable.name === 'i')?.value,
        name: 'i',
      })
      expect(step.dsaState?.nodes.filter(node => node.highlight === 'active')).toHaveLength(
        typeof step.dsaState?.pointer === 'number' ? 1 : 0,
      )
    }

    for (const step of outerLoopSteps) {
      expect(step.dsaState?.pointerName).toBe('i')
      expect(step.dsaState?.pointer2).toBeUndefined()
    }
  })

  it('keeps i fixed while j moves across inner-loop comparisons', () => {
    const result = runCode(bubbleSortCode, 'auto')
    const comparisons = result.steps.filter(step => step.line === 5 && step.dsaState?.type === 'array')

    expect(comparisons.length).toBeGreaterThan(0)
    for (const step of comparisons) {
      const i = step.variables.find(variable => variable.name === 'i')?.value
      expect(step.dsaState?.auxiliaryData?.outerLoopPointer).toEqual({ index: i, name: 'i' })
      expect(step.dsaState?.pointerName).toBe('j')
      expect(step.dsaState?.pointer2Name).toBe('j + 1')
      expect(step.dsaState?.nodes[i as number]?.highlight).not.toBe('active')
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

  it('visualizes nested arrays as a live matrix with row and column state', () => {
    const result = runCode(`function incrementGrid(grid) {
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      grid[i][j] += 1;
    }
  }
  return grid;
}
let transformed = incrementGrid([[1, 2], [3, 4]]);`, 'auto')
    const matrixSteps = result.steps.filter(step => step.dsaState?.type === 'matrix')

    expect(result.error).toBeUndefined()
    expect(matrixSteps.length).toBeGreaterThan(0)
    expect(matrixSteps.some(step =>
      step.dsaState?.nodes.map(node => node.value).join(',') === '2,3,4,5'
    )).toBe(true)
    expect(matrixSteps.some(step =>
      step.dsaState?.nodes.some(node => node.highlight === 'swapping')
    )).toBe(true)
    expect(matrixSteps.some(step => step.dsaState?.auxiliaryData?.matrix)).toBe(true)
  })
})
