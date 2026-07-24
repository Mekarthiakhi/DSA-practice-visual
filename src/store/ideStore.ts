import { create } from 'zustand'

// JS/TS/Python run locally; compiled languages use a configured runtime service or labelled AI simulation.
export type Language = 'javascript' | 'typescript' | 'python' | 'java' | 'cpp' | 'c' | 'csharp' | 'go' | 'rust'
export type VisualizationTab = 'variables' | 'callstack' | 'heap' | 'flow' | 'dsa'
export type ExecutionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error'
export type AITab = 'explain' | 'complexity' | 'flowchart' | 'optimize'

import { LeetCodeProblem } from '../data/leetcodeProblems'


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
  diagnostic?: ExecutionDiagnostic
}

export interface ExecutionDiagnostic {
  severity: 'error' | 'warning'
  type: string
  message: string
  line: number
  column?: number
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
  highlight?: 'active' | 'visited' | 'comparing' | 'swapping' | 'found' | 'none' | 'current' | 'pivot' | 'sorted' | 'processing' | 'heapifying' | 'skipped'
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
  // Pointers & range (used by search / two-pointer / quickSort visualizations)
  pointer?: number
  pointerName?: string
  pointer2?: number
  pointer2Name?: string
  rangeStart?: number
  rangeEnd?: number
  pivotIndex?: number
  // Stack / Queue items
  stackItems?: (string | number)[]
  queueItems?: (string | number)[]
  stackName?: string
  // Hash map table
  hashTable?: Record<string, unknown>
  // Merge sort groups
  mergeGroups?: number[][]
  // Dynamic names/labels for arrays and maps/sets
  arrayName?: string
  hashTableName?: string
  hashTableLabel?: string
  // Secondary string nodes (for dual-string comparison, e.g. word vs target)
  secondaryNodes?: DSANode[]
  secondaryName?: string
}

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  isLoading?: boolean
}

export interface IDEState {
  // Code & Language
  code: string
  language: Language
  fileName: string
  setCode: (code: string) => void
  setLanguage: (lang: Language) => void
  setFileName: (name: string) => void

  // Execution
  executionSteps: ExecutionStep[]
  currentStepIndex: number
  executionStatus: ExecutionStatus
  setExecutionSteps: (steps: ExecutionStep[]) => void
  setCurrentStepIndex: (index: number) => void
  setExecutionStatus: (status: ExecutionStatus) => void
  nextStep: () => void
  prevStep: () => void
  resetExecution: () => void

  // UI State
  leftPanelWidth: number
  rightPanelWidth: number
  setLeftPanelWidth: (width: number) => void
  setRightPanelWidth: (width: number) => void
  currentLine: number
  setCurrentLine: (line: number) => void
  selectedText: string
  setSelectedText: (text: string) => void

  // Playback speed control
  playbackSpeed: number
  setPlaybackSpeed: (speed: number) => void

  // Console output
  consoleOutput: string[]
  addOutput: (line: string) => void
  clearOutput: () => void

  // Visualization
  activeVisualizationTab: VisualizationTab
  setActiveVisualizationTab: (tab: VisualizationTab) => void
  // Aliases used by components
  activeVizTab: VisualizationTab
  setActiveVizTab: (tab: VisualizationTab) => void

  // AI Features
  showAIPanel: boolean
  setShowAIPanel: (show: boolean) => void
  activeAITab: AITab
  setActiveAITab: (tab: AITab) => void
  sessionToken?: string
  setSessionToken: (token: string) => void
  clearSessionToken: () => void
  // AI Chat
  aiMessages: AIMessage[]
  addAIMessage: (msg: AIMessage) => void
  clearAIMessages: () => void
  aiApiKey: string
  setAiApiKey: (key: string) => void

  // Algorithm Detection
  detectedAlgorithm?: string
  setDetectedAlgorithm: (algo: string) => void

  // LeetCode Integration
  showLeetCodePanel: boolean
  setShowLeetCodePanel: (show: boolean) => void
  activeLeetCodeProblem?: LeetCodeProblem
  setActiveLeetCodeProblem: (problem?: LeetCodeProblem) => void

  execMode: 'auto' | 'dsa' | 'trace'
  setExecMode: (mode: 'auto' | 'dsa' | 'trace') => void
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

// Any valid variable name and direct function arguments are supported.
let sortedValues = bubbleSort([5, 2, 8, 1, 9]);`,
  language: 'javascript',
  fileName: 'algorithm',
  // Never leave an old trace attached to new source code. A fresh trace is
  // produced by the live runner after the editor debounce.
  setCode: (code: string) => set((state) => state.code === code ? state : ({
    code,
    executionSteps: [],
    currentStepIndex: 0,
    currentLine: 1,
    executionStatus: 'idle',
    consoleOutput: [],
    detectedAlgorithm: undefined,
  })),
  setLanguage: (lang: Language) => set((state) => state.language === lang ? state : ({
    language: lang,
    executionSteps: [],
    currentStepIndex: 0,
    currentLine: 1,
    executionStatus: 'idle',
    consoleOutput: [],
    detectedAlgorithm: undefined,
  })),
  setFileName: (name: string) => set({ fileName: name }),

  executionSteps: [],
  currentStepIndex: 0,
  executionStatus: 'idle',
  setExecutionSteps: (steps: ExecutionStep[]) => set({
    executionSteps: steps,
    currentStepIndex: 0,
    currentLine: steps[0]?.line || 1,
  }),
  setCurrentStepIndex: (index: number) => set((state) => {
    if (state.executionSteps.length === 0) return { currentStepIndex: 0 }
    const bounded = Math.max(0, Math.min(index, state.executionSteps.length - 1))
    return {
      currentStepIndex: bounded,
      currentLine: state.executionSteps[bounded]?.line || state.currentLine,
    }
  }),
  setExecutionStatus: (status: ExecutionStatus) => set({ executionStatus: status }),
  nextStep: () => set((s) => {
    if (s.executionSteps.length === 0) return { currentStepIndex: 0 }
    const index = Math.min(s.currentStepIndex + 1, s.executionSteps.length - 1)
    return { currentStepIndex: index, currentLine: s.executionSteps[index]?.line || s.currentLine }
  }),
  prevStep: () => set((s) => {
    const index = Math.max(s.currentStepIndex - 1, 0)
    return { currentStepIndex: index, currentLine: s.executionSteps[index]?.line || s.currentLine }
  }),
  resetExecution: () => set({
    executionSteps: [],
    currentStepIndex: 0,
    currentLine: 1,
    executionStatus: 'idle',
    consoleOutput: [],
    detectedAlgorithm: undefined,
  }),

  leftPanelWidth: 35,
  rightPanelWidth: 25,
  setLeftPanelWidth: (width: number) => set({ leftPanelWidth: width }),
  setRightPanelWidth: (width: number) => set({ rightPanelWidth: width }),
  currentLine: 1,
  setCurrentLine: (line: number) => set({ currentLine: line }),
  selectedText: '',
  setSelectedText: (text: string) => set({ selectedText: text }),

  playbackSpeed: 0.5,
  setPlaybackSpeed: (speed: number) => set({ playbackSpeed: speed }),

  consoleOutput: [],
  addOutput: (line: string) => set((s) => ({ consoleOutput: [...s.consoleOutput, line] })),
  clearOutput: () => set({ consoleOutput: [] }),

  activeVisualizationTab: 'dsa',
  setActiveVisualizationTab: (tab: VisualizationTab) => set({ activeVisualizationTab: tab, activeVizTab: tab }),
  activeVizTab: 'dsa',
  setActiveVizTab: (tab: VisualizationTab) => set({ activeVisualizationTab: tab, activeVizTab: tab }),

  showAIPanel: false,
  setShowAIPanel: (show: boolean) => set({ showAIPanel: show }),
  activeAITab: 'explain',
  setActiveAITab: (tab: AITab) => set({ activeAITab: tab }),
  sessionToken: undefined,
  setSessionToken: (token: string) => set({ sessionToken: token }),
  clearSessionToken: () => set({ sessionToken: undefined }),

  aiMessages: [],
  addAIMessage: (msg: AIMessage) => set((s) => ({ aiMessages: [...s.aiMessages, msg] })),
  clearAIMessages: () => set({ aiMessages: [] }),
  aiApiKey: '',
  setAiApiKey: (key: string) => set({ aiApiKey: key }),

  detectedAlgorithm: undefined,
  setDetectedAlgorithm: (algo: string) => set({ detectedAlgorithm: algo }),

  showLeetCodePanel: false,
  setShowLeetCodePanel: (show: boolean) => set({ showLeetCodePanel: show }),
  activeLeetCodeProblem: undefined,
  setActiveLeetCodeProblem: (problem?: LeetCodeProblem) => set({ activeLeetCodeProblem: problem }),

  execMode: 'auto',
  setExecMode: (mode: 'auto' | 'dsa' | 'trace') => set({ execMode: mode }),
}))
