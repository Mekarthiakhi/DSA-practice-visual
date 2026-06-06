# AlgoVision IDE - API Reference

Complete guide to extending AlgoVision IDE with new algorithms and features.

## Table of Contents

1. [Adding Algorithms](#adding-algorithms)
2. [Data Types](#data-types)
3. [State Management](#state-management)
4. [Components API](#components-api)
5. [Hooks API](#hooks-api)
6. [Utilities](#utilities)

---

## Adding Algorithms

### Quick Start

```typescript
// 1. Create algorithm file: src/engines/sorting/yourAlgorithm.ts
export function genYourAlgorithm(arr: number[]): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  // Implementation
  return steps
}

// 2. Export from barrel: src/engines/sorting/index.ts
export { genYourAlgorithm } from './yourAlgorithm'

// 3. Add detection: src/utils/executionEngine.ts
if (lower.includes('youralgorithm')) return 'yourAlgorithm'

// 4. Write tests: src/__tests__/yourAlgorithm.test.ts
describe('Your Algorithm', () => {
  it('should sort correctly', () => {
    const result = genYourAlgorithm([5, 2, 8])
    expect(result.length).toBeGreaterThan(0)
  })
})
```

### Algorithm Template

```typescript
/**
 * Your Algorithm Name
 * Time Complexity: O(n log n)
 * Space Complexity: O(n)
 */

import { ExecutionStep, DSANode } from '../../store/ideStore'

function makeFrame(name: string, line: number) {
  return {
    id: `${name}-${Date.now()}-${Math.random()}`,
    name,
    line,
    variables: [],
    isActive: true,
  }
}

export function genYourAlgorithm(
  arr: number[],
  options?: { showComparisons?: boolean }
): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  const a = [...arr]
  const n = a.length
  let comparisons = 0
  let swaps = 0

  // Helper to create execution step snapshot
  const snap = (
    line: number,
    description: string,
    highlights: Record<number, DSANode['highlight']>,
    changed?: 'arr' | 'comps' | 'swaps'
  ): ExecutionStep => ({
    line,
    description,
    variables: [
      { name: 'arr', value: [...a], type: 'Array', scope: 'yourAlgorithm', changed: changed === 'arr' },
      { name: 'n', value: n, type: 'number', scope: 'yourAlgorithm' },
      { name: 'comparisons', value: comparisons, type: 'number', scope: 'yourAlgorithm', changed: changed === 'comps' },
      { name: 'swaps', value: swaps, type: 'number', scope: 'yourAlgorithm', changed: changed === 'swaps' },
    ],
    callStack: [
      makeFrame('main', line),
      makeFrame('yourAlgorithm', line),
    ],
    heap: [],
    output: '',
    dsaState: {
      type: 'array',
      nodes: a.map((v, i) => ({
        id: `n${i}`,
        value: v,
        highlight: highlights[i] || 'none',
      })),
      comparisons,
      swaps,
      message: description,
    },
  })

  // Implementation
  steps.push(snap(1, `Starting Your Algorithm on [${arr.join(', ')}]`, {}))

  // Your algorithm logic here
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      comparisons++
      steps.push(snap(5, `Compare arr[${j}] vs arr[${j + 1}]`, { [j]: 'comparing', [j + 1]: 'comparing' }, 'comps'))

      if (a[j] > a[j + 1]) {
        swaps++
        ;[a[j], a[j + 1]] = [a[j + 1], a[j]]
        steps.push(snap(7, `Swap elements`, { [j]: 'swapping', [j + 1]: 'swapping' }, 'arr'))
      }
    }
  }

  steps.push(snap(n + 1, `✅ Complete! Comparisons: ${comparisons}, Swaps: ${swaps}`, {}))

  return steps
}
```

### ExecutionStep Structure

```typescript
interface ExecutionStep {
  line: number                    // Source code line
  description: string             // Human-readable step description
  variables: Variable[]           // Current scope variables
  callStack: StackFrame[]         // Function call stack
  heap: HeapObject[]             // Heap objects (rarely used)
  output: string                  // Console output
  dsaState?: DSAState            // DSA visualization data
  maxStepsWarning?: boolean       // True if execution truncated
}
```

### DSAState Structure

```typescript
interface DSAState {
  type: 'array' | 'tree' | 'graph' | 'linkedlist' | 'stack' | 'queue' | 'hashmap' | 'heap' | 'matrix' | 'string'
  nodes: DSANode[]               // Visual elements
  edges?: DSAEdge[]              // Connections (graphs)
  auxiliaryData?: Record<string, unknown>
  comparisons?: number
  swaps?: number
  message?: string               // Status message
  operations?: string[]          // Operation history
}
```

### DSANode.highlight States

```typescript
type Highlight = 
  | 'active'       // Currently being operated on
  | 'visited'      // Already processed
  | 'comparing'    // Being compared with another
  | 'swapping'     // About to swap
  | 'found'        // Search target found
  | 'sorted'       // Already in correct position
  | 'current'      // Current pointer/focus
  | 'pivot'        // Pivot element (QuickSort)
  | 'processing'   // Being processed
  | 'none'         // No special highlight
```

---

## Data Types

### Variable

```typescript
interface Variable {
  name: string              // Variable name
  value: unknown           // Current value
  type: string             // Type name ('number', 'Array', 'object', etc.)
  scope: string            // Function scope name
  changed?: boolean        // Changed in this step?
  address?: string         // Memory address (optional)
}
```

### StackFrame

```typescript
interface StackFrame {
  id: string               // Unique ID
  name: string             // Function name
  line: number             // Current line
  variables: Variable[]    // Local variables
  isActive: boolean        // Currently executing?
  returnValue?: unknown    // Return value (if completed)
}
```

### DSANode

```typescript
interface DSANode {
  id: string               // Unique identifier
  value: string | number   // Display value
  x?: number              // X coordinate (for positioning)
  y?: number              // Y coordinate
  left?: string           // Left child ID (trees)
  right?: string          // Right child ID (trees)
  next?: string           // Next node ID (linked lists)
  prev?: string           // Previous node ID (doubly linked)
  highlight?: Highlight   // Visual highlight state
  color?: string          // Custom color
  depth?: number          // Tree depth
  parent?: string         // Parent node ID
  weight?: number         // Edge weight
  label?: string          // Display label
}
```

---

## State Management

### Store API

```typescript
import { useIDEStore } from './store/ideStore'

// Get entire state
const store = useIDEStore()

// Subscribe to specific fields
const code = useIDEStore((state) => state.code)
const steps = useIDEStore((state) => state.executionSteps)

// Update state
useIDEStore.setState({ code: 'new code' })
```

### Available State

```typescript
interface IDEState {
  // Code
  code: string
  language: 'javascript' | 'typescript'
  setCode: (code: string) => void
  setLanguage: (lang: Language) => void

  // Execution
  executionSteps: ExecutionStep[]
  currentStepIndex: number
  executionStatus: ExecutionStatus
  setExecutionSteps: (steps: ExecutionStep[]) => void
  setCurrentStepIndex: (index: number) => void
  setExecutionStatus: (status: ExecutionStatus) => void

  // UI Layout
  leftPanelWidth: number
  rightPanelWidth: number
  setLeftPanelWidth: (width: number) => void
  setRightPanelWidth: (width: number) => void

  // Playback (PHASE 3)
  playbackSpeed: number
  setPlaybackSpeed: (speed: number) => void

  // AI
  sessionToken?: string
  setSessionToken: (token: string) => void
  clearSessionToken: () => void

  // Algorithm Detection
  detectedAlgorithm?: string
  setDetectedAlgorithm: (algo: string) => void
}
```

---

## Components API

### ErrorBoundary

Catches errors in child components and displays fallback UI.

```typescript
import { ErrorBoundary } from './components/ErrorBoundary'

<ErrorBoundary componentName="My Component">
  <SomeComponent />
</ErrorBoundary>
```

**Props:**
- `children: React.ReactNode` - Child elements
- `componentName?: string` - Component name for error message

### PlaybackControls

Speed control and step navigation.

```typescript
import { PlaybackControls } from './components/PlaybackControls'

<PlaybackControls
  onPlay={() => setPlaying(true)}
  onPause={() => setPlaying(false)}
  onNextStep={() => nextStep()}
  onPrevStep={() => prevStep()}
  isPlaying={isPlaying}
  currentStep={stepIndex}
  totalSteps={steps.length}
/>
```

**Props:**
- `onPlay: () => void` - Play callback
- `onPause: () => void` - Pause callback
- `onNextStep: () => void` - Next step callback
- `onPrevStep: () => void` - Previous step callback
- `isPlaying: boolean` - Is playback active?
- `currentStep: number` - Current step index
- `totalSteps: number` - Total steps

### KeyboardShortcutsHelp

Displays keyboard shortcuts help modal.

```typescript
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp'

const [showHelp, setShowHelp] = useState(false)

<KeyboardShortcutsHelp isOpen={showHelp} onClose={() => setShowHelp(false)} />
```

**Props:**
- `isOpen: boolean` - Modal visibility
- `onClose: () => void` - Close callback

---

## Hooks API

### usePanelResize

Handles panel resizing with automatic event listener cleanup.

```typescript
import { usePanelResize } from './hooks/usePanelResize'

const containerRef = useRef<HTMLDivElement>(null)

const { startDrag } = usePanelResize(
  containerRef,
  (width) => setLeftPanelWidth(width),
  (width) => setRightPanelWidth(width),
  {
    minLeftWidth: 20,
    maxLeftWidth: 55,
    minRightWidth: 18,
    maxRightWidth: 45,
  }
)

return (
  <div ref={containerRef}>
    <div onMouseDown={startDrag(true)}>Left Panel</div>
    <div onMouseDown={startDrag(false)}>Right Panel</div>
  </div>
)
```

**Parameters:**
- `containerRef: React.RefObject<HTMLDivElement>` - Container element
- `onLeftWidthChange: (width: number) => void` - Left panel width callback
- `onRightWidthChange: (width: number) => void` - Right panel width callback
- `options?: UsePanelResizeOptions` - Configuration options

**Returns:**
```typescript
{
  startDrag: (isLeft: boolean) => (e: React.MouseEvent) => void
  cleanup: () => void
}
```

---

## Utilities

### executionEngine

Generate execution steps for DSA algorithms.

```typescript
import {
  detectAlgorithm,
  genBubbleSort,
  genQuickSort,
  genBinarySearch,
  genBFS,
} from './utils/executionEngine'

// Detect algorithm type
const algoType = detectAlgorithm(code) // 'bubbleSort', 'generic', etc.

// Generate steps
const steps = genBubbleSort([5, 2, 8, 1])
```

**Available Functions:**

| Function | Parameters | Returns |
|----------|-----------|---------|
| `genBubbleSort` | `arr: number[]` | `ExecutionStep[]` |
| `genSelectionSort` | `arr: number[]` | `ExecutionStep[]` |
| `genInsertionSort` | `arr: number[]` | `ExecutionStep[]` |
| `genMergeSort` | `arr: number[]` | `ExecutionStep[]` |
| `genQuickSort` | `arr: number[]` | `ExecutionStep[]` |
| `genBinarySearch` | `arr: number[], target: number` | `ExecutionStep[]` |
| `genLinearSearch` | `arr: number[], target: number` | `ExecutionStep[]` |
| `genBFS` | `nodes, edges, start` | `ExecutionStep[]` |
| `genDFS` | `nodes, edges, start` | `ExecutionStep[]` |

### jsInterpreter

Execute arbitrary JavaScript code and track variable changes.

```typescript
import { interpretCode } from './utils/jsInterpreter'

const result = interpretCode(`
  const arr = [5, 2, 8];
  arr.sort((a, b) => a - b);
  console.log(arr);
`)

console.log(result.steps)      // ExecutionStep[]
console.log(result.output)     // ['2,5,8']
console.log(result.error)      // Error message if failed
console.log(result.maxStepsWarning) // True if truncated
```

**Returns:**
```typescript
interface InterpretResult {
  steps: ExecutionStep[]
  output: string[]
  error?: string
  maxStepsWarning?: boolean
}
```

### universalEngine

Route code to appropriate execution engine (DSA or interpreter).

```typescript
import { runCode } from './utils/universalEngine'

// Auto-detect algorithm and route
const result = runCode(code, 'auto')

// Force DSA visualizer
const result = runCode(code, 'dsa')

// Force JavaScript interpreter
const result = runCode(code, 'interpreter')
```

**Returns:**
```typescript
interface RunResult {
  steps: ExecutionStep[]
  output: string[]
  mode: 'dsa' | 'interpreter'
  algo?: string
  error?: string
}
```

### aiService

Call Claude API for code analysis.

```typescript
import { explainCode, analyzeComplexity } from './utils/aiService'

// Explain code
const explanation = await explainCode(code, sessionToken)

// Analyze time complexity
const complexity = await analyzeComplexity(code, sessionToken)

// Generate flowchart
const flowchart = await generateFlowchart(code, sessionToken)

// Optimize code
const optimized = await optimizeCode(code, sessionToken)
```

---

## Configuration

### Algorithm Detection

Customize algorithm detection in `src/utils/executionEngine.ts`:

```typescript
export function detectAlgorithm(code: string): AlgoType {
  const lower = code.toLowerCase()
  
  // Add custom detection rules
  if (lower.includes('custom')) return 'customAlgorithm'
  
  // ... other checks ...
  
  return 'generic'
}
```

### Execution Limits

Modify `src/utils/jsInterpreterWithWarning.ts`:

```typescript
const MAX_STEPS = 3000  // Increase if needed
```

### UI Theme

Customize colors in `src/styles/globals.css` and Tailwind config.

---

## Examples

### Example 1: Custom Algorithm

```typescript
// src/engines/custom/mySort.ts
export function genMySort(arr: number[]): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  // Implementation...
  return steps
}
```

### Example 2: Custom Hook

```typescript
// src/hooks/useExecutionPlayback.ts
export function useExecutionPlayback(steps: ExecutionStep[]) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (!isPlaying) return
    const timer = setInterval(() => {
      setCurrentIndex(idx => idx < steps.length - 1 ? idx + 1 : idx)
    }, 500)
    return () => clearInterval(timer)
  }, [isPlaying, steps])

  return { currentIndex, isPlaying, setIsPlaying, setCurrentIndex }
}
```

### Example 3: Custom Component

```typescript
// src/components/custom/MyVisualizer.tsx
import React from 'react'
import { ExecutionStep } from '../store/ideStore'

interface Props {
  step: ExecutionStep
}

export const MyVisualizer: React.FC<Props> = ({ step }) => {
  return (
    <div className="p-4">
      <div>Line: {step.line}</div>
      <div>{step.description}</div>
    </div>
  )
}
```

---

## Performance Tips

1. **Use React.memo** for expensive components
2. **Use useMemo** to prevent recalculation
3. **Avoid creating objects in render**
4. **Use custom comparison functions** for React.memo
5. **Lazy load** large algorithms
6. **Virtual scroll** for large lists

---

## Troubleshooting

### Infinite Loop

If your algorithm creates infinite loop:
- Execution stops at MAX_STEPS (3000)
- Warning displayed: "⚠️ Execution exceeded MAX_STEPS"
- Check your algorithm logic for unbounded loops

### Memory Issues

Large arrays (10k+) cause performance issues:
- Reduce visualization size
- Use sampling instead of all elements
- Consider virtual scrolling

### TypeScript Errors

Enable strict mode for early detection:
```bash
npm run build
```

---

**Last Updated**: June 6, 2026  
**Version**: 3.0
