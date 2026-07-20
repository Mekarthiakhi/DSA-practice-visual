/**
 * Universal Execution Engine
 * Routes code through DSA visualizer, JS interpreter, or custom code support
 * UPDATED: Support for Heap Sort and custom algorithms
 */

import { ExecutionStep } from '../store/ideStore'
import {
  detectAlgorithm,
  generateExecutionSteps as genDSA,
  SAMPLE_CODES,
} from './executionEngine'
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
    const result = executeCustomAlgorithm(config as CustomAlgorithmConfig)
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
  // DSA VISUALIZER MODE — also tried in 'auto' when a known algo is detected
  // ============================================
  // Execute the current editor source before considering a canonical demo.
  // Runtime-derived steps keep source lines, variables, and canvas data aligned.
  try {
    const result = interpretCode(code)
    if (result.steps.length > 0 || result.error) {
      const steps = result.steps.length > 0 ? result.steps : generateFallbackSteps(code, result.output)
      return {
        steps,
        output: result.output,
        mode: steps.some(step => !!step.dsaState) ? 'dsa' : 'interpreter',
        algo: algo !== 'generic' ? algo : undefined,
        error: result.error,
        visualization: {
          type: result.detectedType,
          synchronized: true,
        },
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      steps: generateFallbackSteps(code, []),
      output: [`Error: ${msg}`],
      mode: 'interpreter',
      error: msg,
    }
  }

  // Only reached when real execution produced no trace at all.
  if (mode === 'dsa' || (mode === 'auto' && algo !== 'generic')) {
    try {
      const steps = genDSA(code)
      if (steps.length > 1 && steps[0]?.dsaState) {
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
  // JAVASCRIPT INTERPRETER MODE (Fallback for all modes)
  // ============================================
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

// ─── General Samples & Categories (used by TopBar) ─────────────────────────

export const GENERAL_SAMPLES: Record<string, { code: string; label: string; category: string; language: string; description?: string }> = {
  'custom_counter': {
    label: 'Simple Counter',
    category: 'Basics',
    language: 'javascript',
    description: 'Basic counting loop',
    code: `// Simple counter\nlet count = 0;\nfor (let i = 0; i < 10; i++) {\n  count += i;\n  console.log('count:', count);\n}\nconsole.log('Final:', count);`,
  },
  'custom_fizzbuzz': {
    label: 'FizzBuzz',
    category: 'Basics',
    language: 'javascript',
    description: 'Classic FizzBuzz',
    code: `for (let i = 1; i <= 20; i++) {\n  if (i % 15 === 0) console.log('FizzBuzz');\n  else if (i % 3 === 0) console.log('Fizz');\n  else if (i % 5 === 0) console.log('Buzz');\n  else console.log(i);\n}`,
  },
  'custom_twosum': {
    label: 'Two Sum',
    category: 'Hash Map',
    language: 'javascript',
    description: 'Find two numbers that add to target',
    code: `function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}\n\nconst result = twoSum([2, 7, 11, 15], 9);\nconsole.log('Result:', result);`,
  },
}

const SAMPLE_CATEGORIES = Object.values(SAMPLE_CODES).map(s => s.category)
const GENERAL_CATEGORIES = Object.values(GENERAL_SAMPLES).map(s => s.category)

export const ALL_CATEGORIES: string[] = [
  ...new Set([...SAMPLE_CATEGORIES, ...GENERAL_CATEGORIES]),
]
