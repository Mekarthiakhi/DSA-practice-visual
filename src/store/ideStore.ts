import { create } from 'zustand'

// PHASE 1 FIX: Remove false multi-language claims - support only JS/TS
export type Language = 'javascript' | 'typescript'
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
  maxStepsWarning?: boolean // PHASE 1 FIX: Track if execution was truncated
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
  message?: string
  operations?: string[]
}

export interface IDEState {
  // Code & Language
  code: string
  language: Language
  setCode: (code: string) => void
  setLanguage: (lang: Language) => void

  // Execution
  executionSteps: ExecutionStep[]
  currentStepIndex: number
  executionStatus: ExecutionStatus
  setExecutionSteps: (steps: ExecutionStep[]) => void
  setCurrentStepIndex: (index: number) => void
  setExecutionStatus: (status: ExecutionStatus) => void

  // UI State
  leftPanelWidth: number
  rightPanelWidth: number
  setLeftPanelWidth: (width: number) => void
  setRightPanelWidth: (width: number) => void
  currentLine: number
  setCurrentLine: (line: number) => void
  selectedText: string
  setSelectedText: (text: string) => void

  // PHASE 3 FIX: Add playback speed control
  playbackSpeed: number
  setPlaybackSpeed: (speed: number) => void

  // Visualization
  activeVisualizationTab: VisualizationTab
  setActiveVisualizationTab: (tab: VisualizationTab) => void

  // AI Features
  showAIPanel: boolean
  setShowAIPanel: (show: boolean) => void
  activeAITab: AITab
  setActiveAITab: (tab: AITab) => void
  sessionToken?: string // PHASE 1 FIX: Use session token instead of raw API key
  setSessionToken: (token: string) => void
  clearSessionToken: () => void

  // Algorithm Detection
  detectedAlgorithm?: string
  setDetectedAlgorithm: (algo: string) => void
}

export const useIDEStore = create<IDEState>((set) => ({
  code: `function bubbleSort(arr) {
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

const result = bubbleSort([5, 2, 8, 1, 9]);`,
  language: 'javascript',
  setCode: (code: string) => set({ code }),
  setLanguage: (lang: Language) => set({ language: lang }),

  executionSteps: [],
  currentStepIndex: 0,
  executionStatus: 'idle',
  setExecutionSteps: (steps: ExecutionStep[]) => set({ executionSteps: steps, currentStepIndex: 0 }),
  setCurrentStepIndex: (index: number) => set({ currentStepIndex: index }),
  setExecutionStatus: (status: ExecutionStatus) => set({ executionStatus: status }),

  leftPanelWidth: 35,
  rightPanelWidth: 25,
  setLeftPanelWidth: (width: number) => set({ leftPanelWidth: width }),
  setRightPanelWidth: (width: number) => set({ rightPanelWidth: width }),
  currentLine: 1,
  setCurrentLine: (line: number) => set({ currentLine: line }),
  selectedText: '',
  setSelectedText: (text: string) => set({ selectedText: text }),

  playbackSpeed: 1,
  setPlaybackSpeed: (speed: number) => set({ playbackSpeed: speed }),

  activeVisualizationTab: 'variables',
  setActiveVisualizationTab: (tab: VisualizationTab) => set({ activeVisualizationTab: tab }),

  showAIPanel: false,
  setShowAIPanel: (show: boolean) => set({ showAIPanel: show }),
  activeAITab: 'explain',
  setActiveAITab: (tab: AITab) => set({ activeAITab: tab }),
  sessionToken: undefined,
  setSessionToken: (token: string) => set({ sessionToken: token }),
  clearSessionToken: () => set({ sessionToken: undefined }),

  detectedAlgorithm: undefined,
  setDetectedAlgorithm: (algo: string) => set({ detectedAlgorithm: algo }),
}))
