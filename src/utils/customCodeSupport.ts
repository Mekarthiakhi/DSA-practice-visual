/**
 * Custom Code Support System
 * Enable users to create and visualize custom algorithms
 * Support for: custom sorting, searching, DSA patterns
 */

import { ExecutionStep } from '../store/ideStore'

export interface CustomAlgorithmConfig {
  name: string
  description?: string
  inputArray?: number[]
  customCode: string
  isRecursive?: boolean
  isVisualizable?: boolean
}

export interface CustomExecutionResult {
  steps: ExecutionStep[]
  success: boolean
  error?: string
  customAlgoName: string
}

/**
 * Execute custom algorithm with step tracking
 * Wraps user code with instrumentation for visualization
 */
export function executeCustomAlgorithm(
  config: CustomAlgorithmConfig,
  inputData: number[] = [5, 2, 8, 1, 9]
): CustomExecutionResult {
  try {
    const steps: ExecutionStep[] = []
    const output: string[] = []
    // Create instrumented version of user code
    const instrumentedCode = instrumentUserCode(config.customCode, config.name)

    // Override console.log to capture output
    const originalLog = console.log
    console.log = (...args: unknown[]) => {
      const msg = args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')
      output.push(msg)
    }

    try {

      // Execute the instrumented code
      const fn = new Function('arr', 'steps', 'console', 'Math', instrumentedCode)
      fn(inputData, steps, { log: console.log }, Math)

      // If no steps were captured, create a basic execution step
      if (steps.length === 0) {
        steps.push({
          line: 1,
          description: `Custom algorithm: ${config.name}`,
          variables: [{ name: 'arr', value: inputData, type: 'Array', scope: 'custom' }],
          callStack: [
            {
              id: 'main-custom',
              name: config.name,
              line: 1,
              variables: [],
              isActive: true,
            },
          ],
          heap: [],
          output: output.join('\n'),
          dsaState: {
            type: 'array',
            nodes: inputData.map((v, i) => ({
              id: `n${i}`,
              value: v,
              highlight: 'none' as const,
            })),
            message: `${config.name} executed`,
          },
        })
      }

      console.log = originalLog

      return {
        steps,
        success: true,
        customAlgoName: config.name,
      }
    } catch (execError) {
      console.log = originalLog
      return {
        steps,
        success: false,
        error: execError instanceof Error ? execError.message : 'Execution failed',
        customAlgoName: config.name,
      }
    }
  } catch (error) {
    return {
      steps: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      customAlgoName: config.name,
    }
  }
}

/**
 * Instrument user code with step tracking
 */
function instrumentUserCode(code: string, algoName: string): string {
  return `
    // Custom algorithm: ${algoName}
    let __step__ = 0;
    const __captureStep__ = (desc, highlights = {}) => {
      __step__++;
      if (__step__ > 5000) throw new Error('MAX_STEPS exceeded');
      const snapshot = {
        line: __step__,
        description: desc,
        variables: [
          { name: 'arr', value: [...arr], type: 'Array', scope: '${algoName}' }
        ],
        callStack: [{
          id: 'main-custom',
          name: '${algoName}',
          line: __step__,
          variables: [],
          isActive: true
        }],
        heap: [],
        output: '',
        dsaState: {
          type: 'array',
          nodes: arr.map((v, i) => ({
            id: 'n' + i,
            value: v,
            highlight: highlights[i] || 'none'
          })),
          message: desc
        }
      };
      steps.push(snapshot);
    };

    // User's algorithm code
    ${code}
  `
}



/**
 * Validate custom code for security and syntax
 */
export function validateCustomCode(code: string): { valid: boolean; error?: string } {
  // Check for dangerous operations
  const dangerousPatterns = ['eval(', 'Function(', 'setTimeout', 'setInterval', 'fetch', 'XMLHttpRequest']

  for (const pattern of dangerousPatterns) {
    if (code.includes(pattern)) {
      return { valid: false, error: `Dangerous operation not allowed: ${pattern}` }
    }
  }

  // Check for basic syntax
  try {
    new Function(code)
    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid syntax',
    }
  }
}

/**
 * Parse custom code to extract algorithm metadata
 */
export function parseAlgorithmMetadata(code: string): { name?: string; description?: string } {
  const nameMatch = code.match(/\/\/\s*@name\s*:\s*(\w+)/i)
  const descMatch = code.match(/\/\/\s*@description\s*:\s*(.+)/i)

  return {
    name: nameMatch?.[1],
    description: descMatch?.[1],
  }
}

/**
 * Generate template for custom algorithm
 */
export function generateCustomAlgorithmTemplate(algoType: 'sort' | 'search' | 'traversal'): string {
  const templates = {
    sort: `
// @name: CustomSort
// @description: Custom sorting algorithm
function customSort(arr) {
  const n = arr.length;
  
  // Add your algorithm here
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      __captureStep__(\`Compare arr[\${j}] and arr[\${j+1}]\`, { [j]: 'comparing', [j+1]: 'comparing' });
      
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        __captureStep__(\`Swap arr[\${j}] and arr[\${j+1}]\`, { [j]: 'swapping', [j+1]: 'swapping' });
      }
    }
  }
  
  __captureStep__(\`Sorting complete: [\${arr.join(', ')}]\`, {});
  return arr;
}

customSort(arr);
    `,
    search: `
// @name: CustomSearch
// @description: Custom search algorithm
function customSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    __captureStep__(\`Check index \${i}, value: \${arr[i]}\`, { [i]: 'comparing' });
    
    if (arr[i] === target) {
      __captureStep__(\`Found target \${target} at index \${i}\`, { [i]: 'found' });
      return i;
    }
  }
  
  __captureStep__(\`Target \${target} not found\`, {});
  return -1;
}

customSearch(arr, 5);
    `,
    traversal: `
// @name: CustomTraversal
// @description: Custom array traversal
function customTraversal(arr) {
  const visited = new Array(arr.length).fill(false);
  
  for (let i = 0; i < arr.length; i++) {
    __captureStep__(\`Visit index \${i}, value: \${arr[i]}\`, { [i]: 'visited' });
    visited[i] = true;
  }
  
  __captureStep__(\`Traversal complete\`, {});
  return visited;
}

customTraversal(arr);
    `,
  }

  return templates[algoType]
}
