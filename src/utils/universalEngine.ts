/**
 * Universal Execution Engine
 * Routes code through DSA visualizer, JS interpreter, or custom code support
 * UPDATED: Support for Heap Sort and custom algorithms
 */

import { ExecutionStep, DSAState, DSANode } from '../store/ideStore'
import {
  detectAlgorithm,
  generateExecutionSteps as genDSA,
  genBubbleSort,
  genSelectionSort,
  genInsertionSort,
  genMergeSort,
  genQuickSort,
  genBinarySearch,
  genLinearSearch,
  genFibonacci,
  genFactorial,
  genLinkedList,
  genBST,
  genBFS,
  genDFS,
  genStack,
  genQueue,
  genHashMap,
  genTwoSum,
  genReverseString,
  genFizzBuzz,
} from './executionEngine'
import { genHeapSort } from '../engines/sorting/heapSort'
import { interpretCode } from './jsInterpreter'
import { executeCustomAlgorithm, validateCustomCode, CustomAlgorithmConfig } from './customCodeSupport'

export type ExecutionMode = 'dsa' | 'interpreter' | 'auto' | 'custom'

export interface RunResult {
  steps: ExecutionStep[]
  output: string[]
  mode: 'dsa' | 'interpreter' | 'custom'
  algo?: string
  error?: string
  visualization?: {
    type: string
    synchronized: boolean
  }
}

// DSA algorithms that have rich hand-crafted visualizations
const DSA_ALGOS = new Set([
  'bubbleSort',
  'selectionSort',
  'insertionSort',
  'mergeSort',
  'quickSort',
  'heapSort', // NEW: Heap Sort
  'binarySearch',
  'linearSearch',
  'fibonacci',
  'factorial',
  'linkedList',
  'doublyLinkedList',
  'bst',
  'avl',
  'bfs',
  'dfs',
  'dijkstra',
  'stack',
  'queue',
  'hashMap',
  'twoSum',
  'reverseString',
  'isPalindrome',
  'fizzBuzz',
])

/**
 * Run code with appropriate execution engine
 * Supports: DSA patterns, custom JavaScript, and custom algorithms
 */
export function runCode(
  code: string,
  mode: ExecutionMode = 'auto',
  customConfig?: CustomAlgorithmConfig
): RunResult {
  const algo = detectAlgorithm(code)
  const isDSA = DSA_ALGOS.has(algo)

  // ============================================
  // CUSTOM ALGORITHM MODE
  // ============================================
  if (mode === 'custom' || (customConfig && mode !== 'dsa' && mode !== 'interpreter')) {
    const config = customConfig || {
      name: 'CustomAlgorithm',
      customCode: code,
      isVisualizable: true,
    }

    // Validate custom code
    const validation = validateCustomCode(code)
    if (!validation.valid) {
      return {
        steps: [],
        output: [],
        mode: 'custom',
        error: validation.error || 'Invalid code',
      }
    }

    // Execute custom algorithm
    const result = executeCustomAlgorithm(config)
    return {
      steps: result.steps,
      output: [],
      mode: 'custom',
      error: result.error,
      visualization: {
        type: 'custom',
        synchronized: true,
      },
    }
  }

  // ============================================
  // DSA VISUALIZER MODE
  // ============================================
  if (mode === 'dsa') {
    try {
      const steps = genDSA(code)
      if (steps.length > 3) {
        const output = extractOutputFromSteps(steps)
        return {
          steps,
          output,
          mode: 'dsa',
          algo,
          visualization: {
            type: 'dsa',
            synchronized: true,
          },
        }
      }
    } catch (err) {
      // Fall through to interpreter
    }
  }

  // ============================================
  // JAVASCRIPT INTERPRETER MODE
  // ============================================
  if (mode === 'interpreter' || mode === 'auto') {
    try {
      const result = interpretCode(code)

      if (result.steps.length > 0 || result.error) {
        return {
          steps: result.steps.length > 0 ? result.steps : generateFallbackSteps(code, result.output),
          output: result.output,
          mode: 'interpreter',
          algo: algo !== 'generic' ? algo : undefined,
          error: result.error,
          visualization: {
            type: 'generic',
            synchronized: true,
          },
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return {
        steps: generateFallbackSteps(code, []),
        output: [`❌ ${msg}`],
        mode: 'interpreter',
        error: msg,
      }
    }
  }

  // Absolute fallback
  return {
    steps: generateFallbackSteps(code, []),
    output: [],
    mode: 'interpreter',
    algo: algo !== 'generic' ? algo : undefined,
    error: 'Execution produced no steps.',
  }
}

/**
 * Extract output from execution steps
 */
function extractOutputFromSteps(steps: ExecutionStep[]): string[] {
  const out: string[] = []
  for (const s of steps) {
    if (s.output && s.output.length > 0) {
      out.push(s.output)
    }
  }
  return out
}

/**
 * Generate fallback execution steps
 */
function generateFallbackSteps(code: string, output: string[]): ExecutionStep[] {
  return [
    {
      line: 1,
      description: '⚠️ Unable to visualize - unsupported algorithm pattern',
      variables: [
        { name: 'code', value: code.substring(0, 50) + '...', type: 'string', scope: 'fallback' },
      ],
      callStack: [
        {
          id: 'fallback',
          name: 'main',
          line: 1,
          variables: [],
          isActive: true,
        },
      ],
      heap: [],
      output: output.join('\n'),
      dsaState: {
        type: 'array',
        nodes: [],
        message: 'Fallback execution - try Trace mode for step-by-step execution',
      },
    },
  ]
}
