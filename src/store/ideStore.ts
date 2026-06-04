import { create } from 'zustand'

export type Language = 'javascript' | 'typescript' | 'python' | 'java' | 'cpp' | 'c' | 'csharp' | 'go' | 'rust'
export type VisualizationTab = 'variables' | 'callstack' | 'heap' | 'flow' | 'dsa'
export type ExecutionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error'
export type AITab = 'explain' | 'complexity' | 'flowchart' | 'optimize'

export interface Variable {
  name: string
  value: unknown
  type: string
  scope: string
  changed?: boolean
  address?: string
}

export interface StackFrame {
  id: string
  name: string
  line: number
  variables: Variable[]
  isActive: boolean
  returnValue?: unknown
}

export interface HeapObject {
  id: string
  type: string
  value: unknown
  references: string[]
  size: number
  address: string
}

export interface ExecutionStep {
  line: number
  variables: Variable[]
  callStack: StackFrame[]
  heap: HeapObject[]
  output: string
  highlight?: string
  dsaState?: DSAState
  description: string
  codeHighlight?: number[]
}

export interface DSANode {
  id: string
  value: string | number
  x?: number
  y?: number
  left?: string
  right?: string
  next?: string
  prev?: string
  highlight?: 'active' | 'visited' | 'comparing' | 'swapping' | 'found' | 'none' | 'current' | 'pivot' | 'sorted' | 'processing'
  color?: string
  depth?: number
  parent?: string
  weight?: number
  label?: string
}

export interface DSAEdge {
  id: string
  from: string
  to: string
  weight?: number
  directed?: boolean
  highlight?: boolean
  label?: string
}

export interface DSAState {
  type: 'array' | 'linkedlist' | 'tree' | 'graph' | 'stack' | 'queue' | 'hashmap' | 'heap' | 'matrix' | 'string'
  nodes: DSANode[]
  edges?: DSAEdge[]
  auxiliaryData?: Record<string, unknown>
  comparisons?: number
  swaps?: number
  accesses?: number
  message?: string
  phase?: string
  pointer?: number
  pointer2?: number
  rangeStart?: number
  rangeEnd?: number
  pivotIndex?: number
  mergeGroups?: number[][]
  stackItems?: (string | number)[]
  queueItems?: (string | number)[]
  hashTable?: Record<string, unknown>
  treeLayout?: 'bfs' | 'inorder' | 'preorder' | 'postorder'
}

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  isLoading?: boolean
}

interface IDEStore {
  code: string
  language: Language
  currentLine: number
  selectedText: string
  setCode: (code: string) => void
  setLanguage: (lang: Language) => void
  setCurrentLine: (line: number) => void
  setSelectedText: (text: string) => void

  executionStatus: ExecutionStatus
  executionSteps: ExecutionStep[]
  currentStepIndex: number
  playbackSpeed: number
  setExecutionStatus: (status: ExecutionStatus) => void
  setExecutionSteps: (steps: ExecutionStep[]) => void
  setCurrentStepIndex: (index: number) => void
  setPlaybackSpeed: (speed: number) => void
  nextStep: () => void
  prevStep: () => void
  resetExecution: () => void

  activeVizTab: VisualizationTab
  setActiveVizTab: (tab: VisualizationTab) => void
  dsaType: DSAState['type'] | null
  setDsaType: (type: DSAState['type'] | null) => void

  consoleOutput: string[]
  addOutput: (line: string) => void
  clearOutput: () => void

  activeAITab: AITab
  setActiveAITab: (tab: AITab) => void
  aiMessages: AIMessage[]
  addAIMessage: (msg: AIMessage) => void
  clearAIMessages: () => void
  aiApiKey: string
  setAiApiKey: (key: string) => void

  leftPanelWidth: number
  rightPanelWidth: number
  setLeftPanelWidth: (w: number) => void
  setRightPanelWidth: (w: number) => void
  isFullscreen: boolean
  toggleFullscreen: () => void
  
  theme: 'dark' | 'cyberpunk' | 'forest'
  setTheme: (t: 'dark' | 'cyberpunk' | 'forest') => void
}

export const DEFAULT_CODE = `// AlgoVision IDE — Bubble Sort
// Click ▶ Visualize to watch it animate!

function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        let temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
  return arr;
}

const data = [64, 34, 25, 12, 22, 11, 90];
console.log("Input:", data);
const sorted = bubbleSort([...data]);
console.log("Sorted:", sorted);
`

export const useIDEStore = create<IDEStore>((set, get) => ({
  code: DEFAULT_CODE,
  language: 'javascript',
  currentLine: 0,
  selectedText: '',
  setCode: (code) => set({ code }),
  setLanguage: (language) => set({ language }),
  setCurrentLine: (currentLine) => set({ currentLine }),
  setSelectedText: (selectedText) => set({ selectedText }),

  executionStatus: 'idle',
  executionSteps: [],
  currentStepIndex: 0,
  playbackSpeed: 1,
  setExecutionStatus: (executionStatus) => set({ executionStatus }),
  setExecutionSteps: (executionSteps) => set({ executionSteps }),
  setCurrentStepIndex: (currentStepIndex) => set({ currentStepIndex }),
  setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
  nextStep: () => {
    const { currentStepIndex, executionSteps } = get()
    if (currentStepIndex < executionSteps.length - 1) {
      set({ currentStepIndex: currentStepIndex + 1 })
    }
  },
  prevStep: () => {
    const { currentStepIndex } = get()
    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1 })
    }
  },
  resetExecution: () => set({
    executionStatus: 'idle',
    executionSteps: [],
    currentStepIndex: 0,
    consoleOutput: []
  }),

  activeVizTab: 'dsa',
  setActiveVizTab: (activeVizTab) => set({ activeVizTab }),
  dsaType: null,
  setDsaType: (dsaType) => set({ dsaType }),

  consoleOutput: [],
  addOutput: (line) => set(state => ({ consoleOutput: [...state.consoleOutput, line] })),
  clearOutput: () => set({ consoleOutput: [] }),

  activeAITab: 'explain',
  setActiveAITab: (activeAITab) => set({ activeAITab }),
  aiMessages: [],
  addAIMessage: (msg) => set(state => ({ aiMessages: [...state.aiMessages, msg] })),
  clearAIMessages: () => set({ aiMessages: [] }),
  aiApiKey: '',
  setAiApiKey: (aiApiKey) => set({ aiApiKey }),

  leftPanelWidth: 36,
  rightPanelWidth: 28,
  setLeftPanelWidth: (leftPanelWidth) => set({ leftPanelWidth }),
  setRightPanelWidth: (rightPanelWidth) => set({ rightPanelWidth }),
  isFullscreen: false,
  toggleFullscreen: () => set(state => ({ isFullscreen: !state.isFullscreen })),
  
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
}))
