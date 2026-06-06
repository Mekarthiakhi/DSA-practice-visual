
# AlgoVision IDE - Architecture Guide

## Overview

AlgoVision IDE is a universal visual code execution environment built with React 18, TypeScript, and Vite. It provides rich visualization for Data Structures & Algorithms (DSA) code with support for arbitrary JavaScript execution.

```
┌─────────────────────────────────────────────────────────────┐
│                        AlgoVision IDE                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Code Editor  │  │ Visualization│  │  AI Panel    │       │
│  │   (Monaco)   │  │   (Canvas)   │  │  (Claude)    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│         │                  │                  │               │
│         └──────────────────┼──────────────────┘               │
│                            │                                   │
│                    ┌───────▼────────┐                         │
│                    │   Zustand      │                         │
│                    │   Store        │                         │
│                    │  (IDE State)   │                         │
│                    └───────┬────────┘                         │
│                            │                                   │
│         ┌──────────────────┼──────────────────┐               │
│         │                  │                  │               │
│    ┌────▼────┐      ┌─────▼──────┐     ┌────▼────┐          │
│    │ Execution│     │ JavaScript │     │  Backend │          │
│    │ Engine   │     │ Interpreter│     │  (Auth)  │          │
│    │          │     │            │     │          │          │
│    └──────────┘     └────────────┘     └──────────┘          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── components/              # React components
│   ├── ErrorBoundary.tsx   # Error handling wrapper
│   ├── PlaybackControls.tsx# Playback speed & step control
│   ├── KeyboardShortcutsHelp.tsx # Keyboard help modal
│   ├── ai-panel/           # Claude AI integration
│   ├── dsa/                # DSA visualization
│   ├── editor/             # Code editor (Monaco)
│   ├── layout/             # Top bar & layout
│   └── visualization/      # Visualization panels
│
├── engines/                 # Algorithm generators (PHASE 2 SPLIT)
│   ├── sorting/
│   │   ├── bubbleSort.ts
│   │   ├── quickSort.ts
│   │   └── index.ts
│   ├── searching/
│   ├── dataStructures/
│   ├── graphs/
│   └── index.ts
│
├── hooks/                   # Custom React hooks
│   └── usePanelResize.ts   # Panel resize with cleanup
│
├── store/
│   └── ideStore.ts         # Zustand state management
│
├── utils/
│   ├── executionEngine.ts   # DSA algorithm generators
│   ├── jsInterpreter.ts     # JS code tracer
│   ├── jsInterpreterWithWarning.ts  # Enhanced with MAX_STEPS
│   ├── universalEngine.ts   # Routing logic
│   └── aiService.ts         # Claude API integration
│
├── __tests__/              # Test suite (PHASE 2)
│   ├── setup.ts
│   └── executionEngine.test.ts
│
└── App.tsx                 # Root component

server/
├── src/
│   ├── routes/
│   │   └── auth.ts         # PHASE 1: Secure API key handling
│   └── index.ts
└── package.json
```

## Data Flow

### 1. User Writes Code

```
User Types Code
      ↓
store.setCode(code)
      ↓
Code Editor displays with highlighting
```

### 2. User Runs Code

```
Click Run Button
      ↓
universalEngine.runCode(code, mode)
      ↓
Algorithm Detection
      ├─ Match known DSA pattern?
      └─ Route to: DSA Visualizer OR JS Interpreter
      ↓
Generate ExecutionStep[]
      ↓
store.setExecutionSteps(steps)
      ↓
VisualizationPanel renders steps
```

### 3. Playback

```
User clicks Play
      ↓
useEffect watches: isPlaying + playbackSpeed
      ↓
setTimeout delayed by (500ms / speed)
      ↓
nextStep() increments currentStepIndex
      ↓
Components re-render with new step data
```

### 4. AI Features

```
User clicks "Explain"
      ↓
AIPanel.tsx calls aiService.explainCode()
      ↓
Exchange API Key → Session Token (backend)
      ↓
Call Claude API with sessionToken
      ↓
Display explanation
```

## Key Concepts

### ExecutionStep

Each step in code execution contains:
- `line`: Source code line number
- `variables`: Current scope variables
- `callStack`: Function call stack
- `dsaState`: DSA-specific visualization data (array highlights, tree structure, etc.)
- `description`: Human-readable step description
- `maxStepsWarning`: Flag if execution was truncated (PHASE 1 FIX)

### DSAState

Describes visual structure for DSA animations:
- `type`: 'array' | 'tree' | 'graph' | 'linkedlist' | 'stack' | 'queue' | 'hashmap' | 'heap' | 'matrix' | 'string'
- `nodes`: DSANode[] (visual elements)
- `edges`: DSAEdge[] (connections for graphs)
- `auxiliaryData`: Additional state

### DSANode.highlight

Visual states during execution:
- `'comparing'`: Currently being compared
- `'swapping'`: About to swap
- `'sorted'`: Already sorted
- `'visited'`: Traversed in graph/tree
- `'processing'`: Currently processing
- `'found'`: Search target found
- `'none'`: No special state

## Execution Modes

### 1. DSA Visualizer (Hand-crafted)

Used for known algorithms (bubble sort, quick sort, BFS, etc.)

**Pros:**
- Rich, detailed animations
- Step-by-step algorithm walkthrough
- Accurate operation counting (swaps, comparisons)

**Code Path:**
```
genBubbleSort(arr)
  ├─ Manual step generation with visualizations
  └─ Returns ExecutionStep[] with detailed DSAState
```

### 2. Live Code Tracer (Interpreter)

Used for arbitrary JavaScript code

**Pros:**
- Works with any JS code
- Tracks variable changes in real-time
- Shows console output

**Code Path:**
```
interpretCode(code)
  ├─ Wrap code with step tracking
  ├─ Execute in Function() sandbox
  ├─ Capture console.log output
  └─ Return ExecutionStep[] with variable snapshots
```

### 3. Auto Mode (Smart Detection)

Detects algorithm type and chooses best visualizer

**Logic:**
```
detectAlgorithm(code)
  ├─ Regex pattern matching on function names
  ├─ Return AlgoType ('bubbleSort', 'binarySearch', 'generic', etc.)
  └─ Route accordingly
```

## State Management (Zustand)

```typescript
interface IDEState {
  // Code
  code: string
  language: Language  // 'javascript' | 'typescript'
  
  // Execution
  executionSteps: ExecutionStep[]
  currentStepIndex: number
  executionStatus: 'idle' | 'running' | 'paused' | 'completed' | 'error'
  
  // UI
  leftPanelWidth: number      // 35%
  rightPanelWidth: number     // 25%
  playbackSpeed: number       // 1.0 (PHASE 3)
  
  // AI
  sessionToken?: string       // (PHASE 1) Secure token, not raw API key
  
  // Methods
  setCode, setLanguage, setExecutionSteps, ...
}
```

## Component Hierarchy

```
App.tsx (Main Layout)
├── ErrorBoundary (PHASE 1)
│   ├── CodeEditor
│   ├── VisualizationPanel
│   │   ├── PlaybackControls (PHASE 3)
│   │   ├── GenericCodeViz (Memoized, PHASE 2)
│   │   ├── DSAVisualizer
│   │   ├── VariablesPanel
│   │   ├── CallStackPanel
│   │   └── ConsolePanel
│   ├── AIPanel
│   └── TopBar
│       └── KeyboardShortcutsHelp (PHASE 3)
└── Resizer (with usePanelResize hook, PHASE 1)
```

## Performance Optimizations (PHASE 2)

### React.memo

Components wrapped to prevent unnecessary re-renders:
- `VariableCard`: Only re-renders if variable value changes
- `GenericCodeViz`: Only re-renders if currentIndex changes
- `TreeNode`: Only re-renders if highlight changes

### useMemo

Values memoized to prevent recalculation:
- `visibleVariables`: Filtered variable list
- `timelineData`: Historical variable changes
- `allVarNames`: Set of variable names

### Custom Hooks

- `usePanelResize`: Drag resize with automatic cleanup (PHASE 1)

## Testing Strategy (PHASE 2)

```
Tests organized by component/module:

src/__tests__/
├── executionEngine.test.ts
│   ├── Sorting algorithms (genBubbleSort, genSelectionSort, ...)
│   ├── Searching algorithms (genBinarySearch, ...)
│   ├── Algorithm detection
│   └── Execution steps validation
│
├── components/
│   ├── ErrorBoundary.test.tsx
│   ├── PlaybackControls.test.tsx
│   └── KeyboardShortcutsHelp.test.tsx
│
└── utils/
    ├── jsInterpreter.test.ts
    └── universalEngine.test.ts

Coverage Target: 70%+
```

## TypeScript Strict Mode (PHASE 2)

All files comply with:
- `noImplicitAny`: Explicit types required
- `strictNullChecks`: Null safety enforced
- `strictFunctionTypes`: Function type safety

## Security (PHASE 1)

### API Key Handling

**Before (Vulnerable):**
```
Raw API key stored in Zustand state
→ Exposed in DevTools, localStorage
```

**After (Secure):**
```
1. User enters API key in UI
2. Frontend sends to backend: POST /api/auth/exchange
3. Backend validates key, generates sessionToken
4. Frontend stores only sessionToken (30-min expiry)
5. All AI requests use sessionToken
6. Raw key never stored client-side
```

### Code Execution

- JavaScript code executed in `Function()` sandbox
- No access to global scope
- Variables captured via inline tracking
- Safe from prototype pollution

## Error Handling (PHASE 1)

### Error Boundaries

Each major panel wrapped with ErrorBoundary:
- Visualization Panel
- AI Panel
- Code Editor
- Prevents entire app from crashing

### MAX_STEPS Warning (PHASE 1)

If execution exceeds 3000 steps:
- Set `maxStepsWarning: true` in ExecutionStep
- Display warning banner to user
- Prevents infinite loop hangs

## Future Enhancements

### Multi-Language Support

Current: JavaScript/TypeScript only

Planned:
- Python (Pyodide WebAssembly)
- C++ (Clang WebAssembly)
- Java (TeaVM)

### Advanced Features

- [ ] Step breakpoints
- [ ] Variable watches
- [ ] Code export/share
- [ ] Algorithm gallery browser
- [ ] Dark/Light mode toggle
- [ ] Mobile responsive layout
- [ ] Custom algorithm templates
- [ ] Collaborative editing (WebSocket)

## Dependencies

**Core:**
- React 18.2
- Zustand 4.5 (state)
- TypeScript 5.4
- Vite 5.2 (build)

**UI:**
- Tailwind CSS 3.4
- Framer Motion 11 (animations)
- Lucide React 0.363 (icons)

**Visualization:**
- D3 7.9 (data visualization)
- ReactFlow 11.11 (node graphs)
- Monaco Editor 0.45 (code editing)

**AI:**
- Anthropic SDK (Claude API)

**Testing:**
- Jest (unit tests)
- React Testing Library (component tests)

## Running Locally

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:5173

# Build for production
npm run build

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:
- Setting up dev environment
- Adding new algorithms
- Writing tests
- Submitting PRs

---

**Last Updated**: June 6, 2026
**Author**: Raccoon AI
**Version**: 3.0 (Post-PHASE 2)
