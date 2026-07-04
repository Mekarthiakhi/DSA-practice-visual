import { ExecutionStep, Variable, StackFrame, DSAState, DSANode, DSAEdge } from '../store/ideStore'
import { genHeapSort } from '../engines/sorting/heapSort'
import { interpretCode } from './jsInterpreter'

// ─── INPUT VALIDATION ────────────────────────────────────────────────────────

interface ValidationError {
  valid: false
  error: string
}

interface ValidationSuccess {
  valid: true
}

type ValidationResult = ValidationError | ValidationSuccess

export function validateNumberArray(arr: unknown, maxSize = 100000): ValidationResult {
  if (!Array.isArray(arr)) {
    return { valid: false, error: 'Input must be an array' }
  }
  if (arr.length === 0) {
    return { valid: false, error: 'Array cannot be empty' }
  }
  if (arr.length > maxSize) {
    return { valid: false, error: `Array too large (max ${maxSize} elements)` }
  }
  if (!arr.every(x => typeof x === 'number' && isFinite(x))) {
    return { valid: false, error: 'All array elements must be finite numbers' }
  }
  return { valid: true }
}

export function validateBinarySearchInput(arr: unknown, target: unknown): ValidationResult {
  const arrayValidation = validateNumberArray(arr)
  if (!arrayValidation.valid) return arrayValidation
  if (typeof target !== 'number' || !isFinite(target)) {
    return { valid: false, error: 'Target must be a finite number' }
  }
  return { valid: true }
}

export function createErrorStep(message: string, line = 1): ExecutionStep {
  return {
    line,
    variables: [],
    callStack: [],
    heap: [],
    output: message,
    description: `Error: ${message}`,
    dsaState: { type: 'array', nodes: [], message: `Error: ${message}` },
  }
}

// ─── Algorithm Detection ────────────────────────────────────────────────────

export type AlgoType =
  | 'bubbleSort' | 'selectionSort' | 'insertionSort' | 'mergeSort' | 'quickSort' | 'heapSort'
  | 'binarySearch' | 'linearSearch'
  | 'fibonacci' | 'factorial'
  | 'linkedList' | 'doublyLinkedList'
  | 'bst' | 'avl' | 'heap'
  | 'bfs' | 'dfs' | 'dijkstra'
  | 'stack' | 'queue'
  | 'hashMap'
  | 'twoSum' | 'reverseString' | 'isPalindrome' | 'fizzBuzz' | 'climbStairs' | 'containsDuplicate' | 'reverseList' | 'maxArea' | 'searchInsert'
  | 'validParentheses' | 'mergeTwoLists' | 'maxSubArray' | 'maxProfit'
  | 'longestSubstring'
  | 'nQueens' | 'knapsack'
  | 'matrixTraversal'
  | 'generic'
export function detectAlgorithm(code: string): AlgoType {
  const lower = code.toLowerCase().replace(/\s+/g, ' ')
  if (lower.includes('bubblesort') || (lower.includes('bubble') && lower.includes('sort'))) return 'bubbleSort'
  if (lower.includes('selectionsort') || (lower.includes('selection') && lower.includes('sort'))) return 'selectionSort'
  if (lower.includes('insertionsort') || (lower.includes('insertion') && lower.includes('sort'))) return 'insertionSort'
  if (lower.includes('mergesort') || (lower.includes('merge') && lower.includes('sort'))) return 'mergeSort'
  if (lower.includes('quicksort') || (lower.includes('quick') && lower.includes('sort')) || lower.includes('partition')) return 'quickSort'
  if (lower.includes('heapsort') || (lower.includes('heap') && lower.includes('sort')) || lower.includes('heapify')) return 'heapSort'
  if (lower.includes('binarysearch') || (lower.includes('binary') && lower.includes('search'))) return 'binarySearch'
  if (lower.includes('linearsearch') || (lower.includes('linear') && lower.includes('search'))) return 'linearSearch'
  if (lower.includes('fibonacci') || lower.includes('fib(')) return 'fibonacci'
  if (lower.includes('factorial') || lower.includes('fact(')) return 'factorial'

  if (lower.includes('dijkstra') || lower.includes('shortest path')) return 'dijkstra'
  if (lower.includes('breadth') || lower.includes('bfs(') || (lower.includes('queue') && lower.includes('graph'))) return 'bfs'
  if (lower.includes('depth') || lower.includes('dfs(') || (lower.includes('stack') && lower.includes('graph'))) return 'dfs'
  // ⚠️ twoSum MUST come before hashMap — Two Sum uses new Map() + target which would falsely match hashMap
  if (lower.includes('twosum') || lower.includes('two sum') || lower.includes('two_sum') ||
      (lower.includes('complement') && lower.includes('map')) ||
      (lower.includes('target') && lower.includes('nums') && lower.includes('map'))) return 'twoSum'
  // hashMap: require explicit hashmap keyword or key/value pair patterns — NOT just any use of Map()
  if (lower.includes('hashmap') || lower.includes('hash map') ||
      (lower.includes('map') && lower.includes('get') && !lower.includes('target') && !lower.includes('twosum'))) return 'hashMap'

  // ⚠️ LEETCODE PROBLEMS must come BEFORE generic data-structure detectors (BST, stack, linkedList, etc.)
  // These LeetCode solutions contain keywords that would falsely match generic detectors:
  //   - Valid Parentheses → `stack` + `push`/`pop` matches generic 'stack'
  //   - Merge Two Sorted Lists → `node` + `next` matches generic 'linkedList'
  //   - Climbing Stairs → `climbstairs` contains substring 'bst' matching BST
  //   - Search Insert → has `insert` + `left` + `right` matching BST heuristic
  if (lower.includes('isvalid') || lower.includes('valid parenthes') || lower.includes('validparenthes') ||
      (lower.includes('(') && lower.includes(')') && lower.includes('[') && lower.includes(']') && lower.includes('{') && lower.includes('}') && lower.includes('stack'))) return 'validParentheses'
  if (lower.includes('mergetwolists') || lower.includes('merge two lists') ||
      (lower.includes('list1') && lower.includes('list2') && lower.includes('next'))) return 'mergeTwoLists'
  if (lower.includes('reverselist') || lower.includes('reverse linked list') ||
      (lower.includes('prev') && lower.includes('curr') && lower.includes('next') && lower.includes('reverse'))) return 'reverseList'
  if (lower.includes('maxsubarray') || lower.includes('maximum subarray') || lower.includes('max_subarray')) return 'maxSubArray'
  if (lower.includes('maxprofit') || lower.includes('best time to buy') || lower.includes('max_profit')) return 'maxProfit'
  if (lower.includes('containsduplicate') || lower.includes('contains duplicate') || lower.includes('contains_duplicate')) return 'containsDuplicate'
  if (lower.includes('climbstairs') || lower.includes('climbing stairs') || lower.includes('climb_stairs')) return 'climbStairs'
  if (lower.includes('maxarea') || lower.includes('most water') || lower.includes('max_area')) return 'maxArea'
  if (lower.includes('searchinsert') || lower.includes('search insert') || lower.includes('search_insert')) return 'searchInsert'
  if (lower.includes('longestsubstring') || lower.includes('longest substring') || lower.includes('longest_substring') ||
      (lower.includes('longest') && lower.includes('without') && lower.includes('repeating')) ||
      (lower.includes('sliding') && lower.includes('window') && lower.includes('set')) ||
      (lower.includes('maxlength') && lower.includes('set') && (lower.includes('left') || lower.includes('right')))) return 'longestSubstring'
  if (lower.includes('nqueens') || lower.includes('n-queens') || lower.includes('n_queens') || 
      (lower.includes('board') && lower.includes('queen') && lower.includes('backtrack'))) return 'nQueens'
  if (lower.includes('knapsack') || lower.includes('knap sack') || 
      (lower.includes('weight') && lower.includes('value') && lower.includes('capacity') && lower.includes('dp'))) return 'knapsack'
  if (lower.includes('reverse') && lower.includes('string')) return 'reverseString'
  if (lower.includes('palindrome')) return 'isPalindrome'
  if (lower.includes('fizzbuzz') || lower.includes('fizz buzz')) return 'fizzBuzz'

  // Generic data structure detectors — AFTER all specific LeetCode patterns
  // BST: use word-boundary regex to avoid 'climbstairs' matching 'bst' as substring;
  //      also require insert+left+right BUT exclude searchInsert patterns
  if (/\bbst\b/.test(lower) || lower.includes('binary search tree') ||
      (lower.includes('insert') && lower.includes('left') && lower.includes('right') && !lower.includes('searchinsert'))) return 'bst'
  if (lower.includes('heap') && !lower.includes('heapsort')) return 'heap'
  if (lower.includes('stack') && (lower.includes('push') || lower.includes('pop'))) return 'stack'
  if (lower.includes('queue') && (lower.includes('enqueue') || lower.includes('dequeue'))) return 'queue'
  if ((lower.includes('doubly') || lower.includes('prev')) && lower.includes('next')) return 'doublyLinkedList'
  if (lower.includes('linkedlist') || lower.includes('linked list') || (lower.includes('node') && lower.includes('next'))) return 'linkedList'
  if (lower.includes('matrix') || (lower.includes('[i][j]'))) return 'matrixTraversal'
  return 'generic'
}

// ─── Helper ─────────────────────────────────────────────────────────────────

function makeFrame(name: string, line: number, vars: Variable[], isActive = true): StackFrame {
  return { id: `${name}-${Date.now()}-${Math.random()}`, name, line, variables: vars, isActive }
}

// ─── SORTING ALGORITHMS ─────────────────────────────────────────────────────

export function genBubbleSort(arr: number[]): ExecutionStep[] {
  // ✅ ADD VALIDATION
  const validation = validateNumberArray(arr)
  if (!validation.valid) {
    return [createErrorStep(validation.error)]
  }

  const steps: ExecutionStep[] = []
  const a = [...arr]
  const n = a.length
  let comps = 0, swaps = 0

  const snap = (line: number, desc: string, hl: Record<number, DSANode['highlight']>, changed?: string): ExecutionStep => ({
    line, description: desc,
    variables: [
      { name: 'arr', value: [...a], type: 'Array', scope: 'bubbleSort', changed: changed === 'arr' },
      { name: 'n', value: n, type: 'number', scope: 'bubbleSort' },
      { name: 'comparisons', value: comps, type: 'number', scope: 'bubbleSort', changed: changed === 'comps' },
      { name: 'swaps', value: swaps, type: 'number', scope: 'bubbleSort', changed: changed === 'swaps' },
    ],
    callStack: [makeFrame('main', line, []), makeFrame('bubbleSort', line, [], true)],
    heap: [], output: '',
    dsaState: {
      type: 'array', nodes: a.map((v, i) => ({ id: `n${i}`, value: v, highlight: hl[i] || 'none' })),
      comparisons: comps, swaps, message: desc
    }
  })

  steps.push(snap(2, `Starting Bubble Sort on [${arr.join(', ')}]`, {}))
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      comps++
      const h1: Record<number, DSANode['highlight']> = {}
      for (let k = n - i; k < n; k++) h1[k] = 'sorted'
      h1[j] = 'comparing'; h1[j + 1] = 'comparing'
      steps.push(snap(4, `Compare arr[${j}]=${a[j]} vs arr[${j+1}]=${a[j+1]}`, h1, 'comps'))
      if (a[j] > a[j + 1]) {
        swaps++
        const h2: Record<number, DSANode['highlight']> = { ...h1, [j]: 'swapping', [j + 1]: 'swapping' }
        steps.push(snap(5, `Swap ${a[j]} ↔ ${a[j+1]}`, h2, 'swaps'));
        [a[j], a[j + 1]] = [a[j + 1], a[j]]
        steps.push(snap(5, `After swap: ${a[j]} ↔ ${a[j+1]}`, h2, 'arr'))
      }
    }
    const hSorted: Record<number, DSANode['highlight']> = {}
    for (let k = n - i - 1; k < n; k++) hSorted[k] = 'sorted'
    steps.push(snap(3, `Pass ${i + 1} done — ${i + 1} element(s) in place`, hSorted))
  }
  const hAll: Record<number, DSANode['highlight']> = {}
  a.forEach((_, i) => { hAll[i] = 'found' })
  steps.push(snap(8, `✅ Sorted! [${a.join(', ')}] | ${comps} comparisons, ${swaps} swaps`, hAll, 'arr'))
  return steps
}

export function genSelectionSort(arr: number[]): ExecutionStep[] {
  // ✅ ADD VALIDATION
  const validation = validateNumberArray(arr)
  if (!validation.valid) {
    return [createErrorStep(validation.error)]
  }

  const steps: ExecutionStep[] = []
  const a = [...arr]
  const n = a.length
  let comps = 0, swaps = 0

  const snap = (line: number, desc: string, hl: Record<number, DSANode['highlight']>): ExecutionStep => ({
    line, description: desc,
    variables: [
      { name: 'arr', value: [...a], type: 'Array', scope: 'selectionSort' },
      { name: 'comparisons', value: comps, type: 'number', scope: 'selectionSort' },
      { name: 'swaps', value: swaps, type: 'number', scope: 'selectionSort' },
    ],
    callStack: [makeFrame('main', line, []), makeFrame('selectionSort', line, [], true)],
    heap: [], output: '',
    dsaState: { type: 'array', nodes: a.map((v, i) => ({ id: `n${i}`, value: v, highlight: hl[i] || 'none' })), comparisons: comps, swaps, message: desc }
  })

  steps.push(snap(1, `Selection Sort on [${arr.join(', ')}]`, {}))
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i
    const h1: Record<number, DSANode['highlight']> = {}
    for (let k = 0; k < i; k++) h1[k] = 'sorted'
    h1[i] = 'active'
    steps.push(snap(3, `Find minimum in arr[${i}..${n-1}], current min = arr[${i}]=${a[i]}`, h1))
    for (let j = i + 1; j < n; j++) {
      comps++
      const h2 = { ...h1, [minIdx]: 'comparing' as const, [j]: 'comparing' as const }
      steps.push(snap(5, `Compare arr[${j}]=${a[j]} with current min arr[${minIdx}]=${a[minIdx]}`, h2))
      if (a[j] < a[minIdx]) {
        minIdx = j
        steps.push(snap(6, `New minimum found: arr[${minIdx}]=${a[minIdx]}`, { ...h2, [minIdx]: 'active' }))
      }
    }
    if (minIdx !== i) {
      swaps++
      const h3 = { ...h1, [i]: 'swapping' as const, [minIdx]: 'swapping' as const }
      steps.push(snap(9, `Swap arr[${i}]=${a[i]} with min arr[${minIdx}]=${a[minIdx]}`, h3));
      [a[i], a[minIdx]] = [a[minIdx], a[i]]
    }
    const hS = { ...h1, [i]: 'sorted' as const }
    steps.push(snap(3, `Position ${i} sorted: ${a[i]}`, hS))
  }
  const hAll: Record<number, DSANode['highlight']> = {}
  a.forEach((_, i) => { hAll[i] = 'found' })
  steps.push(snap(12, `✅ Selection Sort complete! [${a.join(', ')}]`, hAll))
  return steps
}

export function genInsertionSort(arr: number[]): ExecutionStep[] {
  // ✅ VALIDATION: Check input array
  const validation = validateNumberArray(arr)
  if (!validation.valid) {
    return [createErrorStep(validation.error)]
  }

  const steps: ExecutionStep[] = []
  const a = [...arr]
  const n = a.length
  let comps = 0, shifts = 0

  const snap = (line: number, desc: string, hl: Record<number, DSANode['highlight']>): ExecutionStep => ({
    line, description: desc,
    variables: [
      { name: 'arr', value: [...a], type: 'Array', scope: 'insertionSort' },
      { name: 'comparisons', value: comps, type: 'number', scope: 'insertionSort' },
      { name: 'shifts', value: shifts, type: 'number', scope: 'insertionSort' },
    ],
    callStack: [makeFrame('main', line, []), makeFrame('insertionSort', line, [], true)],
    heap: [], output: '',
    dsaState: { type: 'array', nodes: a.map((v, i) => ({ id: `n${i}`, value: v, highlight: hl[i] || 'none' })), comparisons: comps, swaps: shifts, message: desc }
  })

  steps.push(snap(1, `Insertion Sort: [${arr.join(', ')}]`, { 0: 'sorted' }))
  for (let i = 1; i < n; i++) {
    const key = a[i]
    const h1: Record<number, DSANode['highlight']> = {}
    for (let k = 0; k <= i; k++) h1[k] = k < i ? 'sorted' : 'active'
    steps.push(snap(3, `Pick key = ${key} (index ${i})`, h1))
    let j = i - 1
    while (j >= 0 && a[j] > key) {
      comps++; shifts++
      const h2: Record<number, DSANode['highlight']> = { ...h1, [j]: 'comparing', [j + 1]: 'swapping' }
      steps.push(snap(5, `${a[j]} > ${key}, shift ${a[j]} right`, h2))
      a[j + 1] = a[j]; j--
    }
    a[j + 1] = key
    const h3: Record<number, DSANode['highlight']> = {}
    for (let k = 0; k <= i; k++) h3[k] = 'sorted'
    steps.push(snap(7, `Insert ${key} at position ${j + 1}`, { ...h3, [j + 1]: 'found' }))
  }
  const hAll: Record<number, DSANode['highlight']> = {}
  a.forEach((_, i) => { hAll[i] = 'found' })
  steps.push(snap(10, `✅ Insertion Sort complete! [${a.join(', ')}]`, hAll))
  return steps
}

export function genMergeSort(arr: number[]): ExecutionStep[] {
  // ✅ VALIDATION: Check input array
  const validation = validateNumberArray(arr)
  if (!validation.valid) {
    return [createErrorStep(validation.error)]
  }

  const steps: ExecutionStep[] = []
  const a = [...arr]
  let comps = 0

  const snap = (desc: string, currentArr: number[], hl: Record<number, DSANode['highlight']>, groups?: number[][]): ExecutionStep => ({
    line: 1, description: desc,
    variables: [
      { name: 'arr', value: [...currentArr], type: 'Array', scope: 'mergeSort' },
      { name: 'comparisons', value: comps, type: 'number', scope: 'mergeSort' },
    ],
    callStack: [makeFrame('main', 1, []), makeFrame('mergeSort', 1, [], true)],
    heap: [], output: '',
    dsaState: {
      type: 'array',
      nodes: currentArr.map((v, i) => ({ id: `n${i}`, value: v, highlight: hl[i] || 'none' })),
      comparisons: comps, message: desc, mergeGroups: groups
    }
  })

  function mergeSortHelper(arr2: number[], left: number, right: number): void {
    if (left >= right) return
    const mid = Math.floor((left + right) / 2)
    const h: Record<number, DSANode['highlight']> = {}
    for (let i = left; i <= right; i++) h[i] = 'active'
    steps.push(snap(`Divide [${left}..${right}] → [${left}..${mid}] | [${mid+1}..${right}]`, [...arr2], h))
    mergeSortHelper(arr2, left, mid)
    mergeSortHelper(arr2, mid + 1, right)
    // merge
    const L = arr2.slice(left, mid + 1)
    const R = arr2.slice(mid + 1, right + 1)
    let i = 0, j = 0, k = left
    while (i < L.length && j < R.length) {
      comps++
      const h2: Record<number, DSANode['highlight']> = {}
      h2[left + i] = 'comparing'; h2[mid + 1 + j] = 'comparing'
      steps.push(snap(`Merge: compare ${L[i]} vs ${R[j]}`, [...arr2], h2))
      if (L[i] <= R[j]) { arr2[k++] = L[i++] } else { arr2[k++] = R[j++] }
      const h3: Record<number, DSANode['highlight']> = {}
      for (let x = left; x < k; x++) h3[x] = 'visited'
      steps.push(snap(`Placed ${arr2[k-1]} at index ${k-1}`, [...arr2], h3))
    }
    while (i < L.length) { arr2[k++] = L[i++] }
    while (j < R.length) { arr2[k++] = R[j++] }
    const hMerged: Record<number, DSANode['highlight']> = {}
    for (let x = left; x <= right; x++) hMerged[x] = 'sorted'
    steps.push(snap(`Merged [${left}..${right}] = [${arr2.slice(left, right+1).join(', ')}]`, [...arr2], hMerged))
  }

  steps.push(snap(`Merge Sort on [${arr.join(', ')}]`, [...a], {}))
  mergeSortHelper(a, 0, a.length - 1)
  const hAll: Record<number, DSANode['highlight']> = {}
  a.forEach((_, i) => { hAll[i] = 'found' })
  steps.push(snap(`✅ Merge Sort complete! [${a.join(', ')}]`, a, hAll))
  return steps
}

export function genQuickSort(arr: number[]): ExecutionStep[] {
  // ✅ VALIDATION: Check input array
  const validation = validateNumberArray(arr)
  if (!validation.valid) {
    return [createErrorStep(validation.error)]
  }

  const steps: ExecutionStep[] = []
  const a = [...arr]
  let comps = 0

  const snap = (desc: string, currentArr: number[], hl: Record<number, DSANode['highlight']>, pivot?: number): ExecutionStep => ({
    line: 1, description: desc,
    variables: [
      { name: 'arr', value: [...currentArr], type: 'Array', scope: 'quickSort' },
      { name: 'pivot', value: pivot !== undefined ? currentArr[pivot] : '—', type: 'number', scope: 'quickSort' },
      { name: 'comparisons', value: comps, type: 'number', scope: 'quickSort' },
    ],
    callStack: [makeFrame('main', 1, []), makeFrame('quickSort', 1, [], true)],
    heap: [], output: '',
    dsaState: {
      type: 'array',
      nodes: currentArr.map((v, i) => ({ id: `n${i}`, value: v, highlight: hl[i] || 'none' })),
      comparisons: comps, pivotIndex: pivot, message: desc
    }
  })

  function partition(arr2: number[], low: number, high: number): number {
    const pivot = arr2[high]
    const ph: Record<number, DSANode['highlight']> = { [high]: 'pivot' as DSANode['highlight'] }
    steps.push(snap(`Pivot = ${pivot} at index ${high}`, [...arr2], ph, high))
    let i = low - 1
    for (let j = low; j < high; j++) {
      comps++
      const h1: Record<number, DSANode['highlight']> = { ...ph, [j]: 'comparing' }
      if (i >= low) h1[i] = 'active'
      steps.push(snap(`Compare arr[${j}]=${arr2[j]} with pivot ${pivot}`, [...arr2], h1, high))
      if (arr2[j] <= pivot) {
        i++
        if (i !== j) {
          const h2 = { ...ph, [i]: 'swapping' as const, [j]: 'swapping' as const };
          [arr2[i], arr2[j]] = [arr2[j], arr2[i]]
          steps.push(snap(`Swap arr[${i}]=${arr2[i]} with arr[${j}]=${arr2[j]}`, [...arr2], h2, high))
        }
      }
    }
    const h3: Record<number, DSANode['highlight']> = { [i + 1]: 'found' as const };
    [arr2[i + 1], arr2[high]] = [arr2[high], arr2[i + 1]]
    steps.push(snap(`Place pivot ${pivot} at index ${i + 1}`, [...arr2], h3))
    return i + 1
  }

  function quickSortHelper(arr2: number[], low: number, high: number): void {
    if (low < high) {
      const h: Record<number, DSANode['highlight']> = {}
      for (let i = low; i <= high; i++) h[i] = 'active'
      steps.push(snap(`QuickSort range [${low}..${high}]`, [...arr2], h))
      const pi = partition(arr2, low, high)
      quickSortHelper(arr2, low, pi - 1)
      quickSortHelper(arr2, pi + 1, high)
    }
  }

  steps.push(snap(`Quick Sort on [${arr.join(', ')}]`, [...a], {}))
  quickSortHelper(a, 0, a.length - 1)
  const hAll: Record<number, DSANode['highlight']> = {}
  a.forEach((_, i) => { hAll[i] = 'found' })
  steps.push(snap(`✅ Quick Sort complete! [${a.join(', ')}]`, a, hAll))
  return steps
}

// ─── SEARCHING ──────────────────────────────────────────────────────────────

export function genBinarySearch(arr: number[], target: number): ExecutionStep[] {
  // ✅ VALIDATION: Check input array and target
  const validation = validateBinarySearchInput(arr, target)
  if (!validation.valid) {
    return [createErrorStep(validation.error)]
  }

  const steps: ExecutionStep[] = []
  let left = 0, right = arr.length - 1, comps = 0

  const snap = (desc: string, l: number, r: number, mid: number | null, found: boolean): ExecutionStep => ({
    line: 1, description: desc,
    variables: [
      { name: 'left', value: l, type: 'number', scope: 'binarySearch', changed: true },
      { name: 'right', value: r, type: 'number', scope: 'binarySearch', changed: true },
      { name: 'mid', value: mid ?? '—', type: 'number', scope: 'binarySearch' },
      { name: 'target', value: target, type: 'number', scope: 'binarySearch' },
      { name: 'comparisons', value: comps, type: 'number', scope: 'binarySearch' },
    ],
    callStack: [makeFrame('main', 1, []), makeFrame('binarySearch', 1, [], true)],
    heap: [], output: '',
    dsaState: {
      type: 'array',
      nodes: arr.map((v, i) => ({
        id: `n${i}`, value: v,
        highlight: i < l || i > r ? 'visited' : mid !== null && i === mid ? (found ? 'found' : 'comparing') : i >= l && i <= r ? 'active' : 'none'
      })),
      comparisons: comps, rangeStart: l, rangeEnd: r, pointer: mid ?? undefined, message: desc
    }
  })

  steps.push(snap(`Binary Search for target=${target}`, left, right, null, false))
  while (left <= right) {
    const mid = Math.floor((left + right) / 2); comps++
    steps.push(snap(`mid=(${left}+${right})/2=${mid}, arr[mid]=${arr[mid]}`, left, right, mid, false))
    if (arr[mid] === target) {
      steps.push(snap(`✅ Found ${target} at index ${mid}!`, left, right, mid, true))
      return steps
    } else if (arr[mid] < target) {
      steps.push(snap(`${arr[mid]} < ${target}: search right half`, mid + 1, right, mid, false))
      left = mid + 1
    } else {
      steps.push(snap(`${arr[mid]} > ${target}: search left half`, left, mid - 1, mid, false))
      right = mid - 1
    }
  }
  steps.push(snap(`❌ ${target} not found in array`, left, right, null, false))
  return steps
}

export function genLinearSearch(arr: number[], target: number): ExecutionStep[] {
  // ✅ VALIDATION: Check input array and target
  const validation = validateBinarySearchInput(arr, target)
  if (!validation.valid) {
    return [createErrorStep(validation.error)]
  }

  const steps: ExecutionStep[] = []
  let comps = 0

  const snap = (desc: string, idx: number, found: boolean): ExecutionStep => ({
    line: 1, description: desc,
    variables: [
      { name: 'arr', value: arr, type: 'Array', scope: 'linearSearch' },
      { name: 'target', value: target, type: 'number', scope: 'linearSearch' },
      { name: 'i', value: idx, type: 'number', scope: 'linearSearch', changed: true },
      { name: 'comparisons', value: comps, type: 'number', scope: 'linearSearch' },
    ],
    callStack: [makeFrame('linearSearch', 1, [], true)],
    heap: [], output: '',
    dsaState: {
      type: 'array',
      nodes: arr.map((v, i) => ({
        id: `n${i}`, value: v,
        highlight: i < idx ? 'visited' : i === idx ? (found ? 'found' : 'comparing') : 'none'
      })),
      comparisons: comps, pointer: idx, message: desc
    }
  })

  steps.push(snap(`Linear Search for ${target} in [${arr.join(', ')}]`, -1, false))
  for (let i = 0; i < arr.length; i++) {
    comps++
    steps.push(snap(`Check arr[${i}]=${arr[i]} == ${target}?`, i, arr[i] === target))
    if (arr[i] === target) {
      steps.push(snap(`✅ Found ${target} at index ${i}!`, i, true))
      return steps
    }
  }
  steps.push(snap(`❌ ${target} not found after ${comps} comparisons`, arr.length, false))
  return steps
}

// ─── RECURSION ───────────────────────────────────────────────────────────────

export function genFibonacci(n: number): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  const memo: Record<number, number> = {}
  const callTree: DSANode[] = []
  const edges: DSAEdge[] = []

  function fib(x: number, depth: number, parentId?: string): number {
    const nodeId = `fib-${x}-${Date.now()}-${Math.random().toString(36).substr(2,4)}`
    const node: DSANode = { id: nodeId, value: `F(${x})`, depth, highlight: 'active', x: x * 60, y: depth * 80 }
    callTree.push(node)
    if (parentId) edges.push({ id: `e-${parentId}-${nodeId}`, from: parentId, to: nodeId })
    
    steps.push({
      line: depth + 1, description: `fibonacci(${x}) called`,
      variables: [
        { name: 'n', value: x, type: 'number', scope: `fib(${x})`, changed: true },
        { name: 'depth', value: depth, type: 'number', scope: `fib(${x})` },
        { name: 'memo', value: {...memo}, type: 'object', scope: 'global' },
      ],
      callStack: callTree.slice(-5).map((nd, i) => makeFrame(nd.value as string, i + 1, [], i === callTree.length - 1 - (callTree.length - callTree.indexOf(nd) > 5 ? callTree.length - 5 : 0))),
      heap: [], output: '',
      dsaState: {
        type: 'tree',
        nodes: callTree.map(nd => ({ ...nd, highlight: nd.id === nodeId ? 'active' : 'visited' })),
        edges: [...edges], message: `Computing F(${x})`
      }
    })

    if (x <= 1) {
      node.highlight = 'found'
      node.value = `F(${x})=${x}`
      steps.push({ ...steps[steps.length - 1], description: `Base case: F(${x}) = ${x}` })
      return x
    }
    if (memo[x] !== undefined) {
      node.highlight = 'visited'
      node.value = `F(${x})=${memo[x]} ✓`
      steps.push({ ...steps[steps.length - 1], description: `Memo hit: F(${x}) = ${memo[x]}` })
      return memo[x]
    }
    const result = fib(x - 1, depth + 1, nodeId) + fib(x - 2, depth + 1, nodeId)
    memo[x] = result
    node.highlight = 'found'
    node.value = `F(${x})=${result}`
    return result
  }

  const result = fib(Math.min(n, 7), 0)
  steps.push({
    line: 1, description: `✅ F(${n}) = ${result}`,
    variables: [{ name: 'result', value: result, type: 'number', scope: 'main', changed: true }, { name: 'memo', value: {...memo}, type: 'object', scope: 'global' }],
    callStack: [makeFrame('main', 1, [], true)],
    heap: [], output: `F(${n}) = ${result}`,
    dsaState: { type: 'tree', nodes: callTree.map(n => ({ ...n, highlight: 'found' })), edges: [...edges], message: `F(${n}) = ${result}` }
  })
  return steps
}

export function genFactorial(n: number): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  const callStack: StackFrame[] = []

  function fact(x: number): number {
    const frame = makeFrame(`fact(${x})`, x, [{ name: 'n', value: x, type: 'number', scope: `fact(${x})` }], true)
    callStack.push(frame)
    steps.push({
      line: x, description: x <= 1 ? `Base case: fact(1) = 1` : `fact(${x}) = ${x} × fact(${x-1})`,
      variables: [{ name: 'n', value: x, type: 'number', scope: `fact(${x})`, changed: true }],
      callStack: [...callStack.map((f, i) => ({ ...f, isActive: i === callStack.length - 1 }))],
      heap: [], output: '',
      dsaState: {
        type: 'stack', stackItems: callStack.map(f => f.name),
        nodes: callStack.map((f, i) => ({ id: f.id, value: f.name, highlight: i === callStack.length - 1 ? 'active' : 'visited' })),
        message: x <= 1 ? `Base case reached` : `Call stack depth: ${callStack.length}`
      }
    })
    if (x <= 1) { callStack.pop(); return 1 }
    const result = x * fact(x - 1)
    callStack.pop()
    steps.push({
      line: x, description: `fact(${x}) returns ${result}`,
      variables: [{ name: 'n', value: x, type: 'number', scope: `fact(${x})` }, { name: 'result', value: result, type: 'number', scope: `fact(${x})`, changed: true }],
      callStack: [...callStack.map((f, i) => ({ ...f, isActive: i === callStack.length - 1 }))],
      heap: [], output: '',
      dsaState: { type: 'stack', stackItems: callStack.map(f => f.name), nodes: callStack.map((f, i) => ({ id: f.id, value: f.name, highlight: i === callStack.length - 1 ? 'found' : 'visited' })), message: `Returning ${result}` }
    })
    return result
  }

  const result = fact(Math.min(n, 8))
  steps.push({
    line: 1, description: `✅ ${n}! = ${result}`,
    variables: [{ name: 'result', value: result, type: 'number', scope: 'main', changed: true }],
    callStack: [makeFrame('main', 1, [], true)], heap: [], output: `${n}! = ${result}`,
    dsaState: { type: 'stack', nodes: [{ id: 'res', value: `${n}! = ${result}`, highlight: 'found' }], message: `${n}! = ${result}` }
  })
  return steps
}

// ─── LINKED LIST ─────────────────────────────────────────────────────────────

export function genLinkedList(values: number[]): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  const nodes: DSANode[] = []
  const edges: DSAEdge[] = []

  steps.push({
    line: 1, description: `Create empty LinkedList`,
    variables: [{ name: 'head', value: null, type: 'null', scope: 'LinkedList' }],
    callStack: [makeFrame('main', 1, [], true)], heap: [], output: '',
    dsaState: { type: 'linkedlist', nodes: [], edges: [], message: 'Empty list' }
  })

  for (let i = 0; i < values.length; i++) {
    const v = values[i]
    const nodeId = `ll-${i}`
    const newNode: DSANode = { id: nodeId, value: v, highlight: 'active', next: undefined }
    nodes.push(newNode)
    if (i > 0) {
      nodes[i - 1].next = nodeId
      nodes[i - 1].highlight = 'visited'
      edges.push({ id: `e${i}`, from: nodes[i-1].id, to: nodeId, directed: true })
    }
    steps.push({
      line: i + 3, description: `Insert node(${v}) — node ${i + 1} of ${values.length}`,
      variables: [
        { name: 'head', value: values[0], type: 'number', scope: 'LinkedList' },
        { name: 'newNode.value', value: v, type: 'number', scope: 'push', changed: true },
        { name: 'size', value: i + 1, type: 'number', scope: 'LinkedList', changed: true },
      ],
      callStack: [makeFrame('main', 1, []), makeFrame('push', i + 3, [], true)],
      heap: nodes.map((n, k) => ({ id: n.id, type: 'Node', value: n.value, references: n.next ? [n.next] : [], size: 2, address: `0x${(0x1000 + k * 0x10).toString(16)}` })),
      output: '',
      dsaState: {
        type: 'linkedlist',
        nodes: nodes.map((n, k) => ({ ...n, highlight: k === i ? 'active' : 'visited', x: k * 120 + 60, y: 120 })),
        edges: [...edges], message: `Inserted ${v}. Size = ${i + 1}`
      }
    })
  }

  // Traversal
  for (let i = 0; i < nodes.length; i++) {
    steps.push({
      line: 15, description: `Traverse: visiting node(${values[i]}) at position ${i}`,
      variables: [{ name: 'current', value: values[i], type: 'number', scope: 'traverse', changed: true }, { name: 'index', value: i, type: 'number', scope: 'traverse' }],
      callStack: [makeFrame('main', 1, []), makeFrame('traverse', 15, [], true)],
      heap: [], output: '',
      dsaState: {
        type: 'linkedlist',
        nodes: nodes.map((n, k) => ({ ...n, highlight: k < i ? 'visited' : k === i ? 'comparing' : 'none', x: k * 120 + 60, y: 120 })),
        edges: [...edges], message: `Current = ${values[i]}`
      }
    })
  }

  steps.push({
    line: 18, description: `✅ LinkedList complete: ${values.join(' → ')} → null`,
    variables: [{ name: 'size', value: values.length, type: 'number', scope: 'LinkedList' }],
    callStack: [makeFrame('main', 18, [], true)], heap: [], output: `List: ${values.join(' → ')} → null`,
    dsaState: {
      type: 'linkedlist',
      nodes: nodes.map((n, k) => ({ ...n, highlight: 'found', x: k * 120 + 60, y: 120 })),
      edges: [...edges], message: `${values.join(' → ')} → null`
    }
  })
  return steps
}

// ─── BST ─────────────────────────────────────────────────────────────────────

export function genBST(values: number[]): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  const treeNodes: Map<number, { id: string; value: number; left?: string; right?: string; x: number; y: number }> = new Map()
  const edges: DSAEdge[] = []


  let rootVal: number | null = null

  function insertBST(val: number): string {
    const nodeId = `bst-${val}`
    treeNodes.set(val, { id: nodeId, value: val, x: 0, y: 0 })

    if (rootVal === null) { rootVal = val; return nodeId }

    let current = rootVal
    let path: number[] = [current]
    while (true) {
      const curNode = treeNodes.get(current)!
      if (val < current) {
        if (!curNode.left) { curNode.left = nodeId; break }
        current = parseInt(curNode.left.replace('bst-', ''))
      } else {
        if (!curNode.right) { curNode.right = nodeId; break }
        current = parseInt(curNode.right.replace('bst-', ''))
      }
      path.push(current)
    }
    return nodeId
  }

  function getTreeNodesArr(): DSANode[] {
    const arr: DSANode[] = []
    let level = [rootVal!]
    let y = 60, spread = 200
    while (level.length) {
      const next: number[] = []
      level.forEach((v, xi) => {
        if (v === null || v === undefined) return
        const n = treeNodes.get(v)
        if (!n) return
        n.x = (xi - (level.length - 1) / 2) * spread + 350
        n.y = y
        arr.push({ id: n.id, value: n.value, x: n.x, y: n.y, left: n.left, right: n.right })
        if (n.left) next.push(parseInt(n.left.replace('bst-', '')))
        if (n.right) next.push(parseInt(n.right.replace('bst-', '')))
      })
      y += 80; spread = Math.max(60, spread * 0.6)
      level = next
    }
    return arr
  }

  steps.push({ line: 1, description: 'Create empty BST', variables: [], callStack: [makeFrame('main', 1, [], true)], heap: [], output: '', dsaState: { type: 'tree', nodes: [], edges: [], message: 'Empty BST' } })

  for (let i = 0; i < values.length; i++) {
    const v = values[i]
    const nodeId = insertBST(v)
    // find parent and add edge
    if (i > 0) {
      for (const [pv, pn] of treeNodes) {
        if (pn.left === nodeId || pn.right === nodeId) {
          const existing = edges.find(e => e.to === nodeId)
          if (!existing) edges.push({ id: `e-${pv}-${v}`, from: `bst-${pv}`, to: nodeId, directed: true })
          break
        }
      }
    }
    const treeArr = getTreeNodesArr()
    steps.push({
      line: i + 3, description: `Insert ${v} into BST`,
      variables: [{ name: 'value', value: v, type: 'number', scope: 'insert', changed: true }],
      callStack: [makeFrame('main', 1, []), makeFrame('insert', i + 3, [], true)],
      heap: [], output: '',
      dsaState: {
        type: 'tree',
        nodes: treeArr.map(n => ({ ...n, highlight: n.value === v ? 'active' : 'visited' })),
        edges: [...edges], message: `Inserted ${v}`
      }
    })
  }

  // In-order traversal
  const inorder: number[] = []
  function inorderTraversal(val: number | null | undefined) {
    if (!val && val !== 0) return
    const n = treeNodes.get(val)
    if (!n) return
    if (n.left) inorderTraversal(parseInt(n.left.replace('bst-', '')))
    inorder.push(val)
    const treeArr = getTreeNodesArr()
    steps.push({
      line: 20, description: `In-order visit: ${val}`,
      variables: [{ name: 'current', value: val, type: 'number', scope: 'inorder', changed: true }, { name: 'visited', value: [...inorder], type: 'Array', scope: 'inorder' }],
      callStack: [makeFrame('inorder', 20, [], true)], heap: [], output: '',
      dsaState: { type: 'tree', nodes: treeArr.map(n => ({ ...n, highlight: inorder.includes(n.value as number) ? (n.value === val ? 'active' : 'visited') : 'none' })), edges: [...edges], message: `In-order: [${inorder.join(', ')}]` }
    })
    if (n.right) inorderTraversal(parseInt(n.right.replace('bst-', '')))
  }
  if (rootVal !== null) inorderTraversal(rootVal)

  const treeArr = getTreeNodesArr()
  steps.push({
    line: 25, description: `✅ BST complete. In-order: [${inorder.join(', ')}]`,
    variables: [{ name: 'inorder', value: inorder, type: 'Array', scope: 'main', changed: true }],
    callStack: [makeFrame('main', 25, [], true)], heap: [], output: `In-order traversal: [${inorder.join(', ')}]`,
    dsaState: { type: 'tree', nodes: treeArr.map(n => ({ ...n, highlight: 'found' })), edges: [...edges], message: `Sorted: [${inorder.join(', ')}]` }
  })
  return steps
}

// ─── GRAPH BFS/DFS ───────────────────────────────────────────────────────────

function buildGraphState(
  nodeIds: string[], adjList: Record<string, string[]>, visited: Set<string>,
  current: string | null, queue: string[], desc: string
): DSAState {
  const positions: Record<string, { x: number; y: number }> = {}
  const n = nodeIds.length
  nodeIds.forEach((id, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2
    positions[id] = { x: 220 + 160 * Math.cos(angle), y: 200 + 160 * Math.sin(angle) }
  })

  const nodes: DSANode[] = nodeIds.map(id => ({
    id, value: id,
    x: positions[id]?.x, y: positions[id]?.y,
    highlight: id === current ? 'active' : visited.has(id) ? 'found' : queue.includes(id) ? 'comparing' : 'none'
  }))

  const edges: DSAEdge[] = []
  const seen = new Set<string>()
  for (const [from, neighbors] of Object.entries(adjList)) {
    for (const to of neighbors) {
      const key = [from, to].sort().join('-')
      if (!seen.has(key)) { seen.add(key); edges.push({ id: `e-${from}-${to}`, from, to, directed: false }) }
    }
  }
  return { type: 'graph', nodes, edges, message: desc, queueItems: queue }
}

export function genBFS(nodeIds: string[], adjList: Record<string, string[]>, start: string): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  const visited = new Set<string>()
  const queue: string[] = [start]
  const order: string[] = []
  visited.add(start)

  steps.push({ line: 1, description: `BFS from node ${start}. Initialize queue: [${start}]`, variables: [{ name: 'queue', value: [start], type: 'Array', scope: 'bfs', changed: true }], callStack: [makeFrame('bfs', 1, [], true)], heap: [], output: '', dsaState: buildGraphState(nodeIds, adjList, visited, start, [...queue], `Start BFS from ${start}`) })

  while (queue.length) {
    const node = queue.shift()!
    order.push(node)
    steps.push({ line: 5, description: `Dequeue ${node}. Visited: [${order.join(', ')}]`, variables: [{ name: 'current', value: node, type: 'string', scope: 'bfs', changed: true }, { name: 'queue', value: [...queue], type: 'Array', scope: 'bfs' }, { name: 'visited', value: [...order], type: 'Array', scope: 'bfs' }], callStack: [makeFrame('bfs', 5, [], true)], heap: [], output: '', dsaState: buildGraphState(nodeIds, adjList, visited, node, [...queue], `Processing ${node}`) })

    for (const neighbor of (adjList[node] || [])) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor); queue.push(neighbor)
        steps.push({ line: 8, description: `Enqueue neighbor ${neighbor} of ${node}. Queue: [${queue.join(', ')}]`, variables: [{ name: 'neighbor', value: neighbor, type: 'string', scope: 'bfs', changed: true }, { name: 'queue', value: [...queue], type: 'Array', scope: 'bfs', changed: true }], callStack: [makeFrame('bfs', 8, [], true)], heap: [], output: '', dsaState: buildGraphState(nodeIds, adjList, visited, node, [...queue], `Enqueued ${neighbor}`) })
      }
    }
  }

  steps.push({ line: 12, description: `✅ BFS complete! Order: [${order.join(', ')}]`, variables: [{ name: 'visitedOrder', value: order, type: 'Array', scope: 'bfs', changed: true }], callStack: [makeFrame('main', 12, [], true)], heap: [], output: `BFS order: ${order.join(' → ')}`, dsaState: buildGraphState(nodeIds, adjList, new Set(order), null, [], `BFS order: [${order.join(', ')}]`) })
  return steps
}

export function genDFS(nodeIds: string[], adjList: Record<string, string[]>, start: string): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  const visited = new Set<string>()
  const order: string[] = []
  const callStack: string[] = []

  function dfsHelper(node: string) {
    visited.add(node); order.push(node); callStack.push(node)
    steps.push({ line: callStack.length, description: `DFS: visit ${node}. Stack: [${callStack.join(', ')}]`, variables: [{ name: 'current', value: node, type: 'string', scope: 'dfs', changed: true }, { name: 'visited', value: [...order], type: 'Array', scope: 'dfs' }, { name: 'callStack', value: [...callStack], type: 'Array', scope: 'dfs' }], callStack: callStack.map((n, i) => makeFrame(`dfs(${n})`, i + 1, [], i === callStack.length - 1)), heap: [], output: '', dsaState: buildGraphState(nodeIds, adjList, visited, node, [], `Visiting ${node}`) })
    for (const neighbor of (adjList[node] || [])) {
      if (!visited.has(neighbor)) {
        steps.push({ line: callStack.length + 1, description: `Explore edge ${node} → ${neighbor}`, variables: [{ name: 'neighbor', value: neighbor, type: 'string', scope: 'dfs', changed: true }], callStack: callStack.map((n, i) => makeFrame(`dfs(${n})`, i + 1, [], i === callStack.length - 1)), heap: [], output: '', dsaState: buildGraphState(nodeIds, adjList, visited, neighbor, [], `Exploring ${node} → ${neighbor}`) })
        dfsHelper(neighbor)
      }
    }
    callStack.pop()
  }

  dfsHelper(start)
  steps.push({ line: 15, description: `✅ DFS complete! Order: [${order.join(', ')}]`, variables: [{ name: 'dfsOrder', value: order, type: 'Array', scope: 'main', changed: true }], callStack: [makeFrame('main', 15, [], true)], heap: [], output: `DFS order: ${order.join(' → ')}`, dsaState: buildGraphState(nodeIds, adjList, new Set(order), null, [], `DFS order: [${order.join(', ')}]`) })
  return steps
}

// ─── STACK & QUEUE ───────────────────────────────────────────────────────────

export function genStack(ops: Array<{ op: 'push' | 'pop'; val?: number }>): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  const stack: number[] = []

  const snap = (desc: string, lastOp: string, changedIdx?: number): ExecutionStep => ({
    line: 1, description: desc,
    variables: [{ name: 'stack', value: [...stack], type: 'Array', scope: 'Stack', changed: true }, { name: 'size', value: stack.length, type: 'number', scope: 'Stack' }, { name: 'top', value: stack[stack.length - 1] ?? 'empty', type: 'number', scope: 'Stack' }],
    callStack: [makeFrame('main', 1, [], true)], heap: [], output: '',
    dsaState: {
      type: 'stack', stackItems: [...stack],
      nodes: stack.map((v, i) => ({ id: `s${i}`, value: v, highlight: i === stack.length - 1 ? (lastOp === 'push' ? 'active' : 'comparing') : i === changedIdx ? 'swapping' : 'visited' })),
      message: desc
    }
  })

  steps.push(snap('Create empty Stack', ''))
  for (const { op, val } of ops) {
    if (op === 'push' && val !== undefined) {
      stack.push(val)
      steps.push(snap(`push(${val}) → stack top is now ${val}`, 'push', stack.length - 1))
    } else if (op === 'pop') {
      const popped = stack.pop()
      steps.push(snap(`pop() → removed ${popped}, new top = ${stack[stack.length - 1] ?? 'empty'}`, 'pop'))
    }
  }
  return steps
}

export function genQueue(ops: Array<{ op: 'enqueue' | 'dequeue'; val?: number }>): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  const queue: number[] = []

  const snap = (desc: string, frontHighlight = false): ExecutionStep => ({
    line: 1, description: desc,
    variables: [{ name: 'queue', value: [...queue], type: 'Array', scope: 'Queue', changed: true }, { name: 'front', value: queue[0] ?? 'empty', type: 'number', scope: 'Queue' }, { name: 'rear', value: queue[queue.length - 1] ?? 'empty', type: 'number', scope: 'Queue' }],
    callStack: [makeFrame('main', 1, [], true)], heap: [], output: '',
    dsaState: {
      type: 'queue', queueItems: [...queue],
      nodes: queue.map((v, i) => ({ id: `q${i}`, value: v, highlight: frontHighlight && i === 0 ? 'swapping' : i === queue.length - 1 ? 'active' : 'visited' })),
      message: desc
    }
  })

  steps.push(snap('Create empty Queue'))
  for (const { op, val } of ops) {
    if (op === 'enqueue' && val !== undefined) {
      queue.push(val)
      steps.push(snap(`enqueue(${val}) → rear: ${val}`))
    } else if (op === 'dequeue') {
      const removed = queue.shift()
      steps.push(snap(`dequeue() → removed ${removed} from front`, true))
    }
  }
  return steps
}

// ─── HASH MAP ────────────────────────────────────────────────────────────────

export function genHashMap(entries: Array<[string, number]>): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  const map: Record<string, number> = {}
  const tableSize = 8
  const table: Array<Array<[string, number]>> = Array.from({ length: tableSize }, () => [])

  function hashFn(key: string): number {
    let h = 0
    for (const c of key) h = (h * 31 + c.charCodeAt(0)) % tableSize
    return h
  }

  const snap = (desc: string, hlKey?: string): ExecutionStep => ({
    line: 1, description: desc,
    variables: [{ name: 'map', value: {...map}, type: 'object', scope: 'HashMap', changed: true }, { name: 'size', value: Object.keys(map).length, type: 'number', scope: 'HashMap' }],
    callStack: [makeFrame('main', 1, [], true)], heap: [], output: '',
    dsaState: {
      type: 'hashmap', hashTable: {...map},
      nodes: table.flatMap((bucket, bi) => bucket.map((entry, ei) => ({ id: `bkt-${bi}-${ei}`, value: `${entry[0]}:${entry[1]}`, highlight: entry[0] === hlKey ? 'active' : 'visited' }))),
      message: desc
    }
  })

  steps.push(snap('Create empty HashMap'))
  for (const [key, val] of entries) {
    const h = hashFn(key)
    steps.push(snap(`hash("${key}") = ${h} % ${tableSize} = ${h}`, key))
    table[h].push([key, val])
    map[key] = val
    steps.push(snap(`set("${key}", ${val}) → bucket[${h}]`, key))
  }

  // lookups
  for (const [key] of entries.slice(0, 3)) {
    const h = hashFn(key)
    steps.push(snap(`get("${key}") → hash=${h} → found: ${map[key]}`, key))
  }

  steps.push(snap(`✅ HashMap complete: ${Object.keys(map).length} entries`))
  return steps
}

// ─── PROBLEM SAMPLES ─────────────────────────────────────────────────────────

export function genTwoSum(nums: number[], target: number): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  const map = new Map<number, number>()

  // Helper: build one step
  const step = (
    line: number,
    desc: string,
    hlMap: Record<number, DSANode['highlight']>,
    vars: Variable[],
    out = '',
    ht?: Record<string, unknown>
  ): ExecutionStep => ({
    line,
    description: desc,
    variables: vars,
    callStack: [makeFrame('main', 13, [], false), makeFrame('twoSum', line, [], true)],
    heap: [],
    output: out,
    dsaState: {
      type: 'array',
      nodes: nums.map((v, j) => ({ id: `n${j}`, value: v, highlight: hlMap[j] ?? 'none' } as DSANode)),
      message: desc,
      hashTable: ht ?? Object.fromEntries(map),
    },
  })

  const baseVars = (): Variable[] => [
    { name: 'nums',   value: [...nums], type: 'number[]', scope: 'twoSum' },
    { name: 'target', value: target,    type: 'number',   scope: 'twoSum' },
  ]
  const allNone = (): Record<number, DSANode['highlight']> =>
    Object.fromEntries(nums.map((_, j) => [j, 'none' as DSANode['highlight']]))
  const allVisited = (): Record<number, DSANode['highlight']> =>
    Object.fromEntries(nums.map((_, j) => [j, 'visited' as DSANode['highlight']]))

  // LINE 13 — call site
  steps.push({
    line: 13, description: `Calling  twoSum([${nums.join(', ')}], ${target})`,
    variables: [
      { name: 'nums',   value: [...nums], type: 'number[]', scope: 'global' },
      { name: 'target', value: target,    type: 'number',   scope: 'global' },
    ],
    callStack: [makeFrame('main', 13, [], true)], heap: [], output: '',
    dsaState: {
      type: 'array', nodes: nums.map((v, j) => ({ id: `n${j}`, value: v, highlight: 'none' } as DSANode)),
      message: `Goal: find two indices where nums[i] + nums[j] = ${target}`, hashTable: {},
    },
  })

  // LINE 1 — function entry
  steps.push(step(1,
    `function twoSum entered  —  nums=[${nums.join(',')}]  target=${target}`,
    allNone(), [...baseVars()], '', {}))

  // LINE 2 — const map = new Map()
  steps.push(step(2, 'const map = new Map()  →  empty HashMap created (will store: value → index)',
    allNone(),
    [...baseVars(), { name: 'map', value: {}, type: 'Map', scope: 'twoSum', changed: true }], '', {}))

  // LINE 3 — for init: let i = 0
  steps.push(step(3, `for loop initialised  →  let i = 0  (${nums.length} elements to check)`,
    { 0: 'active' },
    [...baseVars(),
      { name: 'map', value: {}, type: 'Map', scope: 'twoSum' },
      { name: 'i', value: 0, type: 'number', scope: 'twoSum', changed: true },
    ], '', {}))

  for (let i = 0; i < nums.length; i++) {

    // LINE 3 — loop condition i < nums.length
    steps.push(step(3,
      `Loop condition:  i(${i}) < nums.length(${nums.length})  →  ` + (i < nums.length ? '✅ true → enter loop body' : ''),
      { [i]: 'active' },
      [...baseVars(),
        { name: 'map', value: Object.fromEntries(map), type: 'Map', scope: 'twoSum' },
        { name: 'i', value: i, type: 'number', scope: 'twoSum', changed: true },
      ]))

    const complement = target - nums[i]

    // LINE 4 — const complement = target - nums[i]
    steps.push(step(4,
      `const complement = target − nums[${i}]  →  ${target} − ${nums[i]} = ${complement}`,
      { [i]: 'active' },
      [...baseVars(),
        { name: 'map', value: Object.fromEntries(map), type: 'Map', scope: 'twoSum' },
        { name: 'i', value: i, type: 'number', scope: 'twoSum' },
        { name: 'complement', value: complement, type: 'number', scope: 'twoSum', changed: true },
      ]))

    const found = map.has(complement)

    // LINE 5 — if (map.has(complement))
    steps.push(step(5,
      `if (map.has(${complement}))  →  ${found ? `✅ YES! index ${map.get(complement)} has value ${complement}` : `❌ no — ${complement} is not in map yet`}`,
      found ? { [i]: 'comparing', [map.get(complement)!]: 'comparing' } : { [i]: 'active' },
      [...baseVars(),
        { name: 'map', value: Object.fromEntries(map), type: 'Map', scope: 'twoSum' },
        { name: 'i', value: i, type: 'number', scope: 'twoSum' },
        { name: 'complement', value: complement, type: 'number', scope: 'twoSum' },
        { name: 'map.has(complement)', value: found, type: 'boolean', scope: 'twoSum', changed: true },
      ]))

    if (found) {
      const foundIdx = map.get(complement)!

      // LINE 6 — return [map.get(complement), i]
      steps.push(step(6,
        `return [map.get(${complement}), ${i}]  →  return [${foundIdx}, ${i}]  ✅ FOUND!`,
        { [foundIdx]: 'found', [i]: 'found' },
        [...baseVars(),
          { name: 'map', value: Object.fromEntries(map), type: 'Map', scope: 'twoSum' },
          { name: 'i', value: i, type: 'number', scope: 'twoSum' },
          { name: 'complement', value: complement, type: 'number', scope: 'twoSum' },
          { name: 'foundAt', value: foundIdx, type: 'number', scope: 'twoSum', changed: true },
          { name: 'result', value: [foundIdx, i], type: 'number[]', scope: 'twoSum', changed: true },
        ],
        `[${foundIdx}, ${i}]`))

      // LINE 13 — result = twoSum(...)
      steps.push({
        line: 13, description: `const result = [${foundIdx}, ${i}]  ← returned from twoSum()`,
        variables: [{ name: 'result', value: [foundIdx, i], type: 'number[]', scope: 'global', changed: true }],
        callStack: [makeFrame('main', 13, [], true)], heap: [], output: `[${foundIdx}, ${i}]`,
        dsaState: {
          type: 'array',
          nodes: nums.map((v, j) => ({ id: `n${j}`, value: v, highlight: j === foundIdx || j === i ? 'found' : 'visited' } as DSANode)),
          message: `🎉  nums[${foundIdx}](${nums[foundIdx]}) + nums[${i}](${nums[i]}) = ${target}`,
          hashTable: Object.fromEntries(map),
        },
      })

      // LINE 14 — console.log
      steps.push({
        line: 14, description: `console.log('Result:', [${foundIdx}, ${i}])  →  printed to console`,
        variables: [{ name: 'result', value: [foundIdx, i], type: 'number[]', scope: 'global' }],
        callStack: [makeFrame('main', 14, [], true)], heap: [],
        output: `Result: [${foundIdx}, ${i}]`,
        dsaState: {
          type: 'array',
          nodes: nums.map((v, j) => ({ id: `n${j}`, value: v, highlight: j === foundIdx || j === i ? 'found' : 'visited' } as DSANode)),
          message: `✅ Final answer: indices [${foundIdx}, ${i}]  (${nums[foundIdx]} + ${nums[i]} = ${target})`,
          hashTable: Object.fromEntries(map),
        },
      })
      return steps
    }

    // LINE 8 — map.set(nums[i], i)  — before storing
    steps.push(step(8,
      `map.set(${nums[i]}, ${i})  →  store: "value ${nums[i]} is at index ${i}"`,
      { [i]: 'visited' },
      [...baseVars(),
        { name: 'map', value: Object.fromEntries(map), type: 'Map', scope: 'twoSum' },
        { name: 'i', value: i, type: 'number', scope: 'twoSum' },
        { name: `map[${nums[i]}]`, value: `→ index ${i}`, type: 'string', scope: 'twoSum', changed: true },
      ]))

    map.set(nums[i], i)

    // LINE 8 continued — show map after update
    steps.push(step(8,
      `map updated  →  { ${[...map.entries()].map(([k, v]) => `${k} → index${v}`).join(',  ')} }`,
      { [i]: 'visited' },
      [...baseVars(),
        { name: 'map', value: Object.fromEntries(map), type: 'Map', scope: 'twoSum', changed: true },
        { name: 'i', value: i, type: 'number', scope: 'twoSum' },
      ]))

    // LINE 3 — i++  (loop increment)
    steps.push(step(3,
      `i++  →  i = ${i + 1}  (advance to next element)`,
      Object.fromEntries(nums.map((_, j) => [j, j <= i ? 'visited' : 'none'] as [number, DSANode['highlight']])),
      [...baseVars(),
        { name: 'map', value: Object.fromEntries(map), type: 'Map', scope: 'twoSum' },
        { name: 'i', value: i + 1, type: 'number', scope: 'twoSum', changed: true },
      ]))
  }

  // LINE 3 — loop exits
  steps.push(step(3,
    `Loop condition:  i(${nums.length}) < nums.length(${nums.length})  →  ❌ false → exit loop`,
    allVisited(),
    [...baseVars(),
      { name: 'map', value: Object.fromEntries(map), type: 'Map', scope: 'twoSum' },
      { name: 'i', value: nums.length, type: 'number', scope: 'twoSum' },
    ]))

  // LINE 10 — return []
  steps.push(step(10,
    `return []  →  no two numbers sum to ${target}  ❌`,
    allVisited(),
    [...baseVars(),
      { name: 'map', value: Object.fromEntries(map), type: 'Map', scope: 'twoSum' },
      { name: 'result', value: [], type: 'number[]', scope: 'twoSum', changed: true },
    ], '[]'))

  // LINE 13 — result = []
  steps.push({
    line: 13, description: `const result = []  ← no solution returned`,
    variables: [{ name: 'result', value: [], type: 'number[]', scope: 'global', changed: true }],
    callStack: [makeFrame('main', 13, [], true)], heap: [], output: '[]',
    dsaState: {
      type: 'array', nodes: nums.map((v, j) => ({ id: `n${j}`, value: v, highlight: 'visited' } as DSANode)),
      message: `❌ No pair sums to ${target} in [${nums.join(', ')}]`,
      hashTable: Object.fromEntries(map),
    },
  })

  // LINE 14 — console.log
  steps.push({
    line: 14, description: `console.log('Result:', [])  →  prints empty result`,
    variables: [{ name: 'result', value: [], type: 'number[]', scope: 'global' }],
    callStack: [makeFrame('main', 14, [], true)], heap: [], output: 'Result: []',
    dsaState: {
      type: 'array', nodes: nums.map((v, j) => ({ id: `n${j}`, value: v, highlight: 'visited' } as DSANode)),
      message: `No answer found — target ${target} cannot be reached`,
      hashTable: Object.fromEntries(map),
    },
  })

  return steps
}

export function genReverseString(s: string): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  const chars = s.split('')
  let left = 0, right = chars.length - 1

  const snap = (desc: string, l: number, r: number): ExecutionStep => ({
    line: 1, description: desc,
    variables: [{ name: 'str', value: chars.join(''), type: 'string', scope: 'reverse', changed: true }, { name: 'left', value: l, type: 'number', scope: 'reverse' }, { name: 'right', value: r, type: 'number', scope: 'reverse' }],
    callStack: [makeFrame('reverseString', 1, [], true)], heap: [], output: '',
    dsaState: {
      type: 'string',
      nodes: chars.map((c, i) => ({ id: `c${i}`, value: c, highlight: i === l ? 'comparing' : i === r ? 'comparing' : i < l || i > r ? 'found' : 'none' })),
      pointer: l, pointerName: 'l', pointer2: r, pointer2Name: 'r', message: desc
    }
  })

  steps.push(snap(`Reverse "${s}" using two pointers`, left, right))
  while (left < right) {
    steps.push(snap(`Swap chars[${left}]='${chars[left]}' ↔ chars[${right}]='${chars[right]}'`, left, right));
    [chars[left], chars[right]] = [chars[right], chars[left]]
    steps.push(snap(`After swap: "${chars.join('')}"`, left, right))
    left++; right--
  }
  steps.push(snap(`✅ Reversed: "${chars.join('')}"`, left, right))
  return steps
}

export function genFizzBuzz(n: number): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  const results: string[] = []

  for (let i = 1; i <= Math.min(n, 20); i++) {
    const isFizz = i % 3 === 0, isBuzz = i % 5 === 0
    const result = isFizz && isBuzz ? 'FizzBuzz' : isFizz ? 'Fizz' : isBuzz ? 'Buzz' : String(i)
    results.push(result)
    steps.push({
      line: i, description: `i=${i}: ${isFizz ? 'divisible by 3' : ''}${isFizz && isBuzz ? ' AND ' : ''}${isBuzz ? 'divisible by 5' : ''} → "${result}"`,
      variables: [
        { name: 'i', value: i, type: 'number', scope: 'fizzBuzz', changed: true },
        { name: 'result', value: result, type: 'string', scope: 'fizzBuzz', changed: true },
        { name: 'i%3', value: i % 3, type: 'number', scope: 'fizzBuzz' },
        { name: 'i%5', value: i % 5, type: 'number', scope: 'fizzBuzz' },
        { name: 'output', value: [...results], type: 'Array', scope: 'fizzBuzz' },
      ],
      callStack: [makeFrame('fizzBuzz', i, [], true)], heap: [], output: result,
      dsaState: {
        type: 'array',
        nodes: results.map((r, idx) => ({ id: `r${idx}`, value: r, highlight: idx === results.length - 1 ? (r === 'FizzBuzz' ? 'found' : r === 'Fizz' ? 'comparing' : r === 'Buzz' ? 'swapping' : 'active') : 'visited' })),
        message: `i=${i} → "${result}"`
      }
    })
  }
  return steps
}

export function genValidParentheses(s: string): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  const stack: string[] = []
  const map: Record<string, string> = { '(': ')', '[': ']', '{': '}' }
  const stringNodes = s.split('').map((c, i) => ({ id: `c${i}`, value: c, highlight: 'none' as const }))

  steps.push({ line: 1, description: `isValid("${s}")`, variables: [], callStack: [makeFrame('isValid', 1, [])], heap: [], output: '', dsaState: { type: 'string', nodes: stringNodes, stackItems: [...stack], message: 'Check valid parentheses', arrayName: 's', stackName: 'stack' } })

  for (let i = 0; i < s.length; i++) {
    const char = s[i]
    if (map[char]) {
      stack.push(map[char])
      steps.push({
        line: 11, description: `Push expected closing '${map[char]}' for open '${char}'`,
        variables: [{ name: 'char', value: char, type: 'string', scope: 'isValid' }],
        callStack: [makeFrame('isValid', 11, [])], heap: [], output: '',
        dsaState: { type: 'string', nodes: stringNodes.map((n, idx) => ({ ...n, highlight: idx === i ? 'comparing' : 'none' })), pointer: i, stackItems: [...stack], message: `Pushed '${map[char]}'`, arrayName: 's', stackName: 'stack' }
      })
    } else {
      if (stack.length === 0 || stack.pop() !== char) {
        steps.push({
          line: 13, description: `❌ Invalid char '${char}'`,
          variables: [{ name: 'char', value: char, type: 'string', scope: 'isValid' }],
          callStack: [makeFrame('isValid', 13, [])], heap: [], output: 'false',
          dsaState: { type: 'string', nodes: stringNodes.map((n, idx) => ({ ...n, highlight: idx === i ? 'swapping' : 'none' })), pointer: i, stackItems: [...stack], message: `Mismatch at '${char}'`, arrayName: 's', stackName: 'stack' }
        })
        return steps
      }
      steps.push({
        line: 13, description: `Matched closing '${char}'`,
        variables: [{ name: 'char', value: char, type: 'string', scope: 'isValid' }],
        callStack: [makeFrame('isValid', 13, [])], heap: [], output: '',
        dsaState: { type: 'string', nodes: stringNodes.map((n, idx) => ({ ...n, highlight: idx === i ? 'found' : 'none' })), pointer: i, stackItems: [...stack], message: `Popped '${char}'`, arrayName: 's', stackName: 'stack' }
      })
    }
  }

  const isValid = stack.length === 0
  steps.push({
    line: 17, description: isValid ? '✅ Valid string' : '❌ Leftover unclosed brackets',
    variables: [], callStack: [makeFrame('isValid', 17, [])], heap: [], output: String(isValid),
    dsaState: { type: 'string', nodes: stringNodes.map((n) => ({ ...n, highlight: 'none' })), stackItems: [...stack], message: isValid ? 'Valid!' : 'Invalid!', arrayName: 's', stackName: 'stack' }
  })
  return steps
}

export function genMergeTwoLists(list1: number[], list2: number[]): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  
  const nodes1: DSANode[] = list1.map((v, i) => ({ id: `l1-${i}`, value: String(v), x: i * 100 + 60, y: 80, highlight: 'none', label: i === 0 ? 'list1' : undefined }))
  const nodes2: DSANode[] = list2.map((v, i) => ({ id: `l2-${i}`, value: String(v), x: i * 100 + 60, y: 180, highlight: 'none', label: i === 0 ? 'list2' : undefined }))
  
  const edges1: DSAEdge[] = list1.slice(1).map((_, i) => ({ id: `e1-${i}`, from: `l1-${i}`, to: `l1-${i+1}`, directed: true }))
  const edges2: DSAEdge[] = list2.slice(1).map((_, i) => ({ id: `e2-${i}`, from: `l2-${i}`, to: `l2-${i+1}`, directed: true }))

  let i = 0, j = 0
  const mergedNodes: DSANode[] = []
  const mergedEdges: DSAEdge[] = []

  const getState = (msg: string): DSAState => ({
    type: 'linkedlist',
    nodes: [...nodes1, ...nodes2, ...mergedNodes],
    edges: [...edges1, ...edges2, ...mergedEdges],
    message: msg
  })

  steps.push({ line: 1, description: 'Merge two sorted lists', variables: [], callStack: [makeFrame('mergeTwoLists', 1, [])], heap: [], output: '', dsaState: getState('Initial Lists') })

  while (i < list1.length && j < list2.length) {
    if (list1[i] <= list2[j]) {
      nodes1[i].highlight = 'active'
      const newNode: DSANode = { id: `m-${mergedNodes.length}`, value: String(list1[i]), x: mergedNodes.length * 100 + 60, y: 280, highlight: 'processing', label: mergedNodes.length === 0 ? 'merged' : undefined }
      mergedNodes.push(newNode)
      if (mergedNodes.length > 1) {
        mergedEdges.push({ id: `em-${mergedNodes.length-1}`, from: `m-${mergedNodes.length-2}`, to: newNode.id, directed: true })
      }
      steps.push({ line: 10, description: `Take ${list1[i]} from list1`, variables: [], callStack: [makeFrame('merge', 10, [])], heap: [], output: '', dsaState: getState(`Added ${list1[i]}`) })
      nodes1[i].highlight = 'visited'
      newNode.highlight = 'none'
      i++
    } else {
      nodes2[j].highlight = 'active'
      const newNode: DSANode = { id: `m-${mergedNodes.length}`, value: String(list2[j]), x: mergedNodes.length * 100 + 60, y: 280, highlight: 'processing', label: mergedNodes.length === 0 ? 'merged' : undefined }
      mergedNodes.push(newNode)
      if (mergedNodes.length > 1) {
        mergedEdges.push({ id: `em-${mergedNodes.length-1}`, from: `m-${mergedNodes.length-2}`, to: newNode.id, directed: true })
      }
      steps.push({ line: 12, description: `Take ${list2[j]} from list2`, variables: [], callStack: [makeFrame('merge', 12, [])], heap: [], output: '', dsaState: getState(`Added ${list2[j]}`) })
      nodes2[j].highlight = 'visited'
      newNode.highlight = 'none'
      j++
    }
  }

  while (i < list1.length) {
    nodes1[i].highlight = 'active'
    const newNode: DSANode = { id: `m-${mergedNodes.length}`, value: String(list1[i]), x: mergedNodes.length * 100 + 60, y: 280, highlight: 'processing', label: mergedNodes.length === 0 ? 'merged' : undefined }
    mergedNodes.push(newNode)
    if (mergedNodes.length > 1) mergedEdges.push({ id: `em-${mergedNodes.length-1}`, from: `m-${mergedNodes.length-2}`, to: newNode.id, directed: true })
    steps.push({ line: 15, description: `Take remaining ${list1[i]} from list1`, variables: [], callStack: [makeFrame('merge', 15, [])], heap: [], output: '', dsaState: getState(`Added ${list1[i]}`) })
    nodes1[i].highlight = 'visited'
    newNode.highlight = 'none'
    i++
  }
  
  while (j < list2.length) {
    nodes2[j].highlight = 'active'
    const newNode: DSANode = { id: `m-${mergedNodes.length}`, value: String(list2[j]), x: mergedNodes.length * 100 + 60, y: 280, highlight: 'processing', label: mergedNodes.length === 0 ? 'merged' : undefined }
    mergedNodes.push(newNode)
    if (mergedNodes.length > 1) mergedEdges.push({ id: `em-${mergedNodes.length-1}`, from: `m-${mergedNodes.length-2}`, to: newNode.id, directed: true })
    steps.push({ line: 16, description: `Take remaining ${list2[j]} from list2`, variables: [], callStack: [makeFrame('merge', 16, [])], heap: [], output: '', dsaState: getState(`Added ${list2[j]}`) })
    nodes2[j].highlight = 'visited'
    newNode.highlight = 'none'
    j++
  }

  mergedNodes.forEach(n => n.highlight = 'found')
  steps.push({ line: 18, description: '✅ Merge completed', variables: [], callStack: [makeFrame('merge', 18, [])], heap: [], output: `[${mergedNodes.map(n => n.value).join(',')}]`, dsaState: getState('Done') })
  return steps
}

export function genMaxSubArray(nums: number[]): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  let maxSum = nums[0], currentSum = nums[0]

  steps.push({ line: 1, description: 'Initialize maxSubArray', variables: [], callStack: [makeFrame('maxSubArray', 1, [])], heap: [], output: '', dsaState: { type: 'array', nodes: nums.map((v, i) => ({ id: `n${i}`, value: v, highlight: i === 0 ? 'found' : 'none' })), message: `maxSum=${maxSum}` } })

  for (let i = 1; i < nums.length; i++) {
    currentSum = Math.max(nums[i], currentSum + nums[i])
    maxSum = Math.max(maxSum, currentSum)
    steps.push({
      line: 6, description: `i=${i}, currentSum=${currentSum}, maxSum=${maxSum}`,
      variables: [{ name: 'currentSum', value: currentSum, type: 'number', scope: 'maxSubArray' }, { name: 'maxSum', value: maxSum, type: 'number', scope: 'maxSubArray' }],
      callStack: [makeFrame('maxSubArray', 6, [])], heap: [], output: '',
      dsaState: { type: 'array', nodes: nums.map((v, idx) => ({ id: `n${idx}`, value: v, highlight: idx === i ? 'active' : idx < i ? 'visited' : 'none' })), message: `Max so far: ${maxSum}` }
    })
  }

  steps.push({ line: 10, description: `✅ Found Max Subarray Sum: ${maxSum}`, variables: [], callStack: [makeFrame('maxSubArray', 10, [])], heap: [], output: String(maxSum), dsaState: { type: 'array', nodes: nums.map((v, i) => ({ id: `n${i}`, value: v, highlight: 'found' })), message: `Max sum: ${maxSum}` } })
  return steps
}

export function genMaxProfit(prices: number[]): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  let minPrice = Infinity, maxProfit = 0

  steps.push({ line: 1, description: 'Find best time to buy and sell stock', variables: [], callStack: [makeFrame('maxProfit', 1, [])], heap: [], output: '', dsaState: { type: 'array', nodes: prices.map((v, i) => ({ id: `p${i}`, value: v, highlight: 'none' })), message: 'Tracking minPrice and maxProfit' } })

  for (let i = 0; i < prices.length; i++) {
    if (prices[i] < minPrice) {
      minPrice = prices[i]
      steps.push({ line: 6, description: `New minPrice: ${minPrice}`, variables: [{ name: 'minPrice', value: minPrice, type: 'number', scope: 'maxProfit' }], callStack: [makeFrame('maxProfit', 6, [])], heap: [], output: '', dsaState: { type: 'array', nodes: prices.map((v, idx) => ({ id: `p${idx}`, value: v, highlight: idx === i ? 'found' : 'none' })), message: `Min price: ${minPrice}` } })
    } else if (prices[i] - minPrice > maxProfit) {
      maxProfit = prices[i] - minPrice
      steps.push({ line: 8, description: `New maxProfit: ${maxProfit} (Sell at ${prices[i]})`, variables: [{ name: 'maxProfit', value: maxProfit, type: 'number', scope: 'maxProfit' }], callStack: [makeFrame('maxProfit', 8, [])], heap: [], output: '', dsaState: { type: 'array', nodes: prices.map((v, idx) => ({ id: `p${idx}`, value: v, highlight: idx === i ? 'active' : 'none' })), message: `Max profit: ${maxProfit}` } })
    }
  }

  steps.push({ line: 12, description: `✅ Final Max Profit: ${maxProfit}`, variables: [], callStack: [makeFrame('maxProfit', 12, [])], heap: [], output: String(maxProfit), dsaState: { type: 'array', nodes: prices.map((v, i) => ({ id: `p${i}`, value: v, highlight: 'visited' })), message: `Max profit: ${maxProfit}` } })
  return steps
}

// ─── MAIN DISPATCHER ─────────────────────────────────────────────────────────

function extractArray(code: string): number[] {
  // Find all array literals in the code
  const arrayMatches = [...code.matchAll(/\[([\d,\s.\-]+)\]/g)]
  const candidates: number[][] = []

  for (const m of arrayMatches) {
    const nums = m[1].split(',').map(n => parseFloat(n.trim())).filter(n => !isNaN(n))
    if (nums.length > 1) candidates.push(nums)
  }

  // Return the longest array found (most likely to be the main data)
  if (candidates.length > 0) {
    return candidates.reduce((a, b) => b.length > a.length ? b : a)
  }
  return [64, 34, 25, 12, 22, 11, 90]
}

function extractTarget(code: string): number {
  // Try various target patterns
  const patterns = [
    /(?:target|key|search\s*for|find|looking\s*for)\s*[=:]\s*(-?[\d.]+)/i,
    /binarySearch\s*\([^,)]+,\s*(-?[\d.]+)\)/i,
    /linearSearch\s*\([^,)]+,\s*(-?[\d.]+)\)/i,
    /search\s*\([^,)]+,\s*(-?[\d.]+)\)/i,
    /searchInsert\s*\([^,)]+,\s*(-?[\d.]+)\)/i,
    /const\s+target\s*=\s*(-?[\d.]+)/i,
  ]
  for (const p of patterns) {
    const m = code.match(p)
    if (m) return parseFloat(m[1])
  }
  return 23
}

// Extract Two Sum params: returns [nums, target]
function extractTwoSumParams(code: string): { nums: number[]; target: number } {
  // Try to find twoSum([...], target) call
  const callMatch = code.match(/twoSum\s*\(\s*(\[[\d,\s\-]+\])\s*,\s*(-?\d+)\s*\)/)
  if (callMatch) {
    try {
      const nums = JSON.parse(callMatch[1]) as number[]
      const target = parseInt(callMatch[2])
      if (Array.isArray(nums) && nums.length >= 2 && !isNaN(target)) {
        return { nums, target }
      }
    } catch { /* fall through */ }
  }

  // Try to find nums = [...] and target = N separately
  const numsMatch = code.match(/(?:const|let|var)\s+nums\s*=\s*(\[[\d,\s\-]+\])/)
  const targetMatch = code.match(/(?:const|let|var)\s+target\s*=\s*(-?\d+)/)
  if (numsMatch && targetMatch) {
    try {
      const nums = JSON.parse(numsMatch[1]) as number[]
      const target = parseInt(targetMatch[1])
      if (Array.isArray(nums) && nums.length >= 2 && !isNaN(target)) {
        return { nums, target }
      }
    } catch { /* fall through */ }
  }

  // Default example from LeetCode #1
  return { nums: [2, 7, 11, 15], target: 9 }
}

function extractNumber(code: string): number {
  // Patterns for fibonacci(n) or factorial(n) calls
  const patterns = [
    /(?:fibonacci|factorial|fib|fact|climbStairs|fizzBuzz)\s*\(\s*(-?[\d]+)\s*\)/i,
    /fib\(\s*(-?[\d]+)\s*\)/i,
    /n\s*=\s*([\d]+)/i,
    /const\s+n\s*=\s*([\d]+)/i,
  ]
  for (const p of patterns) {
    const m = code.match(p)
    if (m) return Math.min(parseInt(m[1]), 30) // cap at 30 to prevent massive rendering loops
  }
  return 8
}

function extractString(code: string): string | null {
  // Try function call patterns first: isPalindrome("racecar"), isValid("()[]{}"), reverseString("hello")
  const fnMatch = code.match(/(?:isValid|isPalindrome|reverseString|reverse|palindrome|search|check)\s*\(\s*(['"`])(.*?)\1\s*\)/i)
  if (fnMatch) return fnMatch[2]
  // Try variable declarations: const str = "hello", let s = 'world'
  const varMatch = code.match(/(?:const|let|var)\s+(?:str|s|string|input|text|word)\s*=\s*(['"`])(.*?)\1/i)
  if (varMatch) return varMatch[2]
  // Any string variable declaration
  const anyVarMatch = code.match(/(?:const|let|var)\s+[a-zA-Z_]\w*\s*=\s*(['"`])(.*?)\1/)
  if (anyVarMatch) return anyVarMatch[2]
  return null
}

function extractMultipleArrays(code: string): number[][] {
  const arrays: number[][] = []
  const matches = code.matchAll(/\[([\d,\s\-]*)\]/g)
  for (const match of matches) {
    try {
      const arr = JSON.parse(`[${match[1]}]`) as number[]
      if (Array.isArray(arr) && arr.every(n => typeof n === 'number')) {
        arrays.push(arr)
      }
    } catch { /* ignore */ }
  }
  return arrays
}

// ─── DYNAMIC EXTRACTION: Graph ──────────────────────────────────────────────

function extractGraph(code: string): { nodes: string[]; adj: Record<string, string[]>; start: string } {
  const defaultGraph = { nodes: ['A','B','C','D','E','F'], adj: { A:['B','C'], B:['D','E'], C:['F'], D:[] as string[], E:[] as string[], F:[] as string[] }, start: 'A' }

  // Match object literal with string-keyed arrays: { A:['B','C'], B:['D'], ... }
  // or { 'A': ['B','C'], 'B': ['D'], ... }
  const objMatch = code.match(/(?:graph|adj(?:acency)?(?:List)?|g)\s*=\s*\{([^}]+(?:\[[^\]]*\][^}]*)*)\}/i)
  if (objMatch) {
    try {
      const body = objMatch[1]
      const adj: Record<string, string[]> = {}
      // Parse entries like  A: ['B', 'C']  or  'A': ['B', 'C']  or  A: []  
      const entryPattern = /['"]?(\w+)['"]?\s*:\s*\[([^\]]*)\]/g
      let entry
      while ((entry = entryPattern.exec(body)) !== null) {
        const key = entry[1]
        const neighbors = entry[2]
          .split(',')
          .map(s => s.trim().replace(/^['"]|['"]$/g, ''))
          .filter(s => s.length > 0)
        adj[key] = neighbors
      }
      const nodes = Object.keys(adj)
      if (nodes.length >= 2) {
        // Also add any neighbor that isn't a key
        for (const neighbors of Object.values(adj)) {
          for (const n of neighbors) {
            if (!adj[n]) { adj[n] = []; nodes.push(n) }
          }
        }
        // Try to find start node from function call
        const startMatch = code.match(/(?:bfs|dfs)\s*\([^,]+,\s*['"]?(\w+)['"]?\s*\)/i)
        const start = startMatch ? startMatch[1] : nodes[0]
        return { nodes: [...new Set(nodes)], adj, start }
      }
    } catch { /* fall through */ }
  }

  // Try numeric adjacency list: [[1,2],[3],[],[4],[]]  
  const numAdjMatch = code.match(/(?:graph|adj)\s*=\s*(\[\s*\[.*?\]\s*\])/is)
  if (numAdjMatch) {
    try {
      const parsed = JSON.parse(numAdjMatch[1])
      if (Array.isArray(parsed)) {
        const adj: Record<string, string[]> = {}
        const nodes: string[] = []
        parsed.forEach((neighbors: number[], i: number) => {
          const id = String(i)
          nodes.push(id)
          adj[id] = Array.isArray(neighbors) ? neighbors.map(String) : []
        })
        return { nodes, adj, start: nodes[0] || '0' }
      }
    } catch { /* fall through */ }
  }

  return defaultGraph
}

// ─── DYNAMIC EXTRACTION: Stack Operations ────────────────────────────────────

function extractStackOps(code: string): Array<{ op: 'push' | 'pop'; val?: number }> {
  const ops: Array<{ op: 'push' | 'pop'; val?: number }> = []

  // Match stack.push(val) and stack.pop() patterns
  const opPattern = /\b(?:stack|s)\.?(push|pop)\s*\(\s*(-?\d+)?\s*\)/gi
  let m
  while ((m = opPattern.exec(code)) !== null) {
    const op = m[1].toLowerCase() as 'push' | 'pop'
    const val = m[2] !== undefined ? parseInt(m[2]) : undefined
    ops.push({ op, val })
  }

  // Also try: push(val) without object prefix
  if (ops.length === 0) {
    // We need to preserve order, so scan linearly
    const lines = code.split('\n')
    for (const line of lines) {
      const pushM = line.match(/push\s*\(\s*(-?\d+)\s*\)/)
      const popM = line.match(/pop\s*\(/)
      if (pushM) ops.push({ op: 'push', val: parseInt(pushM[1]) })
      if (popM && !pushM) ops.push({ op: 'pop' })
    }
  }

  // Also try extracting from array-based initialization: [10, 20, 30]
  if (ops.length === 0) {
    const arrMatch = code.match(/\[([\d,\s]+)\]/)
    if (arrMatch) {
      const nums = arrMatch[1].split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
      nums.forEach(val => ops.push({ op: 'push', val }))
    }
  }

  if (ops.length === 0) {
    return [{op:'push',val:10},{op:'push',val:20},{op:'push',val:30},{op:'pop'},{op:'push',val:40},{op:'pop'},{op:'pop'}]
  }
  return ops
}

// ─── DYNAMIC EXTRACTION: Queue Operations ────────────────────────────────────

function extractQueueOps(code: string): Array<{ op: 'enqueue' | 'dequeue'; val?: number }> {
  const ops: Array<{ op: 'enqueue' | 'dequeue'; val?: number }> = []

  // Match queue.enqueue(val) / queue.dequeue() / queue.push(val) / queue.shift()
  const opPattern = /\b(?:queue|q)\.?(enqueue|dequeue|push|shift|add|remove|offer|poll)\s*\(\s*(-?\d+)?\s*\)/gi
  let m
  while ((m = opPattern.exec(code)) !== null) {
    const rawOp = m[1].toLowerCase()
    const isEnqueue = ['enqueue', 'push', 'add', 'offer'].includes(rawOp)
    const val = m[2] !== undefined ? parseInt(m[2]) : undefined
    ops.push({ op: isEnqueue ? 'enqueue' : 'dequeue', val })
  }

  // Try extracting from array initialization
  if (ops.length === 0) {
    const arrMatch = code.match(/\[([\d,\s]+)\]/)
    if (arrMatch) {
      const nums = arrMatch[1].split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
      nums.forEach(val => ops.push({ op: 'enqueue', val }))
    }
  }

  if (ops.length === 0) {
    return [{op:'enqueue',val:1},{op:'enqueue',val:2},{op:'enqueue',val:3},{op:'dequeue'},{op:'enqueue',val:4},{op:'dequeue'}]
  }
  return ops
}

// ─── DYNAMIC EXTRACTION: HashMap Entries ─────────────────────────────────────

function extractHashMapEntries(code: string): Array<[string, number]> {
  const entries: Array<[string, number]> = []

  // Match map.set('key', value) patterns
  const setPattern = /\.set\s*\(\s*['"]([^'"]+)['"]\s*,\s*(-?\d+)\s*\)/g
  let m
  while ((m = setPattern.exec(code)) !== null) {
    entries.push([m[1], parseInt(m[2])])
  }

  // Match map['key'] = value or map.key = value patterns
  if (entries.length === 0) {
    const assignPattern = /\w+\[\s*['"]([^'"]+)['"]\s*\]\s*=\s*(-?\d+)/g
    while ((m = assignPattern.exec(code)) !== null) {
      entries.push([m[1], parseInt(m[2])])
    }
  }

  // Match object literal: { apple: 5, banana: 3 }
  if (entries.length === 0) {
    const objMatch = code.match(/(?:map|hash|table|dict)\s*=\s*\{([^}]+)\}/i)
    if (objMatch) {
      const entryPattern = /['"]?(\w+)['"]?\s*:\s*(-?\d+)/g
      while ((m = entryPattern.exec(objMatch[1])) !== null) {
        entries.push([m[1], parseInt(m[2])])
      }
    }
  }

  if (entries.length === 0) {
    return [['apple',5],['banana',3],['cherry',8],['date',2],['elderberry',7]]
  }
  return entries
}

// ─── DYNAMIC EXTRACTION: DP Knapsack ─────────────────────────────────────────

function extractKnapsackParams(code: string): { W: number; weights: number[]; values: number[] } {
  const arrays = extractMultipleArrays(code)
  const numbers = [...code.matchAll(/(?:const|let|var)\s+(?:W|capacity|Capacity)\s*=\s*(\d+)/g)]
  let W = 50
  if (numbers.length > 0) {
    W = parseInt(numbers[0][1])
  } else {
    // try to find from function call knapsack(W, weights, values)
    const callMatch = code.match(/knapsack\s*\(\s*(\d+)\s*,/)
    if (callMatch) W = parseInt(callMatch[1])
  }
  
  if (arrays.length >= 2) {
    // assuming values then weights, or weights then values. Typically values are larger
    const a1 = arrays[0]
    const a2 = arrays[1]
    const sum1 = a1.reduce((a,b)=>a+b,0)
    const sum2 = a2.reduce((a,b)=>a+b,0)
    if (sum1 > sum2) return { W, values: a1, weights: a2 }
    return { W, values: a2, weights: a1 }
  }
  
  return { W: 50, values: [60, 100, 120], weights: [10, 20, 30] }
}

// ─── DYNAMIC EXTRACTION: Heap Operations ─────────────────────────────────────

function extractHeapOps(code: string): Array<{ op: 'insert' | 'extract'; val?: number }> {
  const ops: Array<{ op: 'insert' | 'extract'; val?: number }> = []
  
  // Try finding insert(val) and extractMin() / extractMax() / poll() / pop()
  const opPattern = /\b(?:heap|pq|q)\.?(insert|add|push|extract|poll|pop|remove)\s*\(\s*(-?\d+)?\s*\)/gi
  let m
  while ((m = opPattern.exec(code)) !== null) {
    const rawOp = m[1].toLowerCase()
    const isInsert = ['insert', 'add', 'push'].includes(rawOp)
    const val = m[2] !== undefined ? parseInt(m[2]) : undefined
    ops.push({ op: isInsert ? 'insert' : 'extract', val })
  }
  
  // Fallback to array initialization => series of inserts
  if (ops.length === 0) {
    const arrMatch = code.match(/\[([\d,\s]+)\]/)
    if (arrMatch) {
      const nums = arrMatch[1].split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
      nums.forEach(val => ops.push({ op: 'insert', val }))
      ops.push({ op: 'extract' })
    }
  }
  
  if (ops.length === 0) {
    return [{op:'insert',val:10},{op:'insert',val:5},{op:'insert',val:20},{op:'insert',val:2},{op:'extract'},{op:'extract'}]
  }
  return ops
}

export function generateExecutionSteps(code: string): ExecutionStep[] {
  const algo = detectAlgorithm(code)
  const arr = extractArray(code)

  const LEETCODE_ALGOS = new Set([
    'twoSum', 'validParentheses', 'mergeTwoLists', 'maxSubArray', 'maxProfit',
    'reverseString', 'climbStairs', 'containsDuplicate', 'reverseList', 'maxArea',
    'searchInsert', 'fizzBuzz'
  ])

  // 1. Try dynamic interpreter first for LeetCode challenges
  if (LEETCODE_ALGOS.has(algo)) {
    try {
      const result = interpretCode(code)
      if (result.steps && result.steps.length > 1 && !result.error) {
        // Only prefer dynamic steps if they have meaningful dsaState visualization
        const hasDSA = result.steps.some(s => s.dsaState && s.dsaState.nodes && s.dsaState.nodes.length > 0)
        if (hasDSA) {
          return result.steps
        }
        // If no dsaState (e.g., simple scalar-only algos like climbStairs),
        // fall through to static generator which has built-in visualization
      }
    } catch (err) {
      console.warn('Dynamic interpreter failed, falling back to static simulator:', err)
    }
  }

  // 2. Otherwise run static visualizers
  if (algo !== 'generic') {
    switch (algo) {
      case 'bubbleSort': return genBubbleSort(arr)
      case 'selectionSort': return genSelectionSort(arr)
      case 'insertionSort': return genInsertionSort(arr)
      case 'mergeSort': return genMergeSort(arr)
      case 'quickSort': return genQuickSort(arr)
      case 'heapSort': return genHeapSort(arr)
      case 'binarySearch': {
        const bsArr = arr.length ? [...arr].sort((a, b) => a - b) : [2,5,8,12,16,23,38,56,72,91]
        return genBinarySearch(bsArr, extractTarget(code))
      }
      case 'linearSearch': return genLinearSearch(arr, extractTarget(code))
      case 'fibonacci': return genFibonacci(extractNumber(code))
      case 'factorial': return genFactorial(extractNumber(code))
      case 'linkedList': return genLinkedList(arr.length ? arr : [10,20,30,40,50])
      case 'doublyLinkedList': return genLinkedList(arr.length ? arr : [5,15,25,35,45])
      case 'bst': return genBST(arr.length ? arr : [50,30,70,20,40,60,80])
      case 'bfs': {
        const g = extractGraph(code)
        return genBFS(g.nodes, g.adj, g.start)
      }
      case 'dfs': {
        const g = extractGraph(code)
        return genDFS(g.nodes, g.adj, g.start)
      }
      case 'stack': return genStack(extractStackOps(code))
      case 'queue': return genQueue(extractQueueOps(code))
      case 'hashMap': return genHashMap(extractHashMapEntries(code))
      case 'twoSum': {
        const tsParams = extractTwoSumParams(code)
        return genTwoSum(tsParams.nums, tsParams.target)
      }
      case 'validParentheses': return genValidParentheses(extractString(code) || '()[]{}')
      case 'mergeTwoLists': {
        const arrays = extractMultipleArrays(code)
        const l1 = arrays.length > 0 ? arrays[0] : [1,2,4]
        const l2 = arrays.length > 1 ? arrays[1] : [1,3,4]
        return genMergeTwoLists(l1, l2)
      }
      case 'maxSubArray': return genMaxSubArray(arr.length ? arr : [-2,1,-3,4,-1,2,1,-5,4])
      case 'maxProfit': return genMaxProfit(arr.length ? arr : [7,1,5,3,6,4])
      case 'reverseString': return genReverseString(extractString(code) || 'hello')
      case 'isPalindrome': return genIsPalindrome(extractString(code) || 'racecar')
      case 'climbStairs': return genClimbStairs(extractNumber(code) || 5)
      case 'containsDuplicate': return genContainsDuplicate(arr.length ? arr : [1,2,3,1])
      case 'reverseList': return genReverseList(arr.length ? arr : [1,2,3,4,5])
      case 'maxArea': return genMaxArea(arr.length ? arr : [1,8,6,2,5,4,8,3,7])
      case 'searchInsert': return genSearchInsert(arr.length ? arr : [1,3,5,6], extractTarget(code) || 2)
      case 'fizzBuzz': return genFizzBuzz(extractNumber(code) || 15)
      case 'longestSubstring': return genLongestSubstring(extractString(code) || 'pwwkew')
      case 'nQueens': return genNQueens(extractNumber(code) || 4)
      case 'knapsack': {
        const kp = extractKnapsackParams(code)
        return genKnapsack(kp.W, kp.weights, kp.values)
      }
      case 'heap': return genHeap(extractHeapOps(code))
    }
  }

  // 3. Dynamic interpreter fallback for generic/custom code or failing static routes
  try {
    const result = interpretCode(code)
    if (result.steps && result.steps.length > 1) {
      return result.steps
    }
  } catch (err) {
    console.warn('Interpreter tracing failed:', err)
  }

  return [createErrorStep(`Algorithm execution failed or not supported. Try switching to 'Trace' mode.`)]
}

// ─── NEW GENERATORS ──────────────────────────────────────────────────────────

export function genClimbStairs(n: number): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  if (n > 20) n = 20
  steps.push({ line: 1, description: 'climbStairs(' + n + ')', variables: [{name:'n',value:n,type:'number',scope:'fn'}], callStack: [makeFrame('climbStairs', 1, [])], heap: [], output: '', dsaState: { type: 'array', nodes: [], message: 'Initialize' } })
  if (n <= 2) {
    steps.push({ line: 2, description: 'Return ' + n, variables: [{name:'n',value:n,type:'number',scope:'fn'}], callStack: [makeFrame('climbStairs', 2, [])], heap: [], output: String(n), dsaState: { type: 'array', nodes: [{id:'1', value:n, highlight:'found'}], message: 'Base case' } })
    return steps
  }
  let a = 1, b = 2
  steps.push({ line: 3, description: 'a=1, b=2', variables: [{name:'a',value:1,type:'number',scope:'fn'}, {name:'b',value:2,type:'number',scope:'fn'}], callStack: [makeFrame('climbStairs', 3, [])], heap: [], output: '', dsaState: { type: 'array', nodes: [{id:'a',value:1,highlight:'visited'}, {id:'b',value:2,highlight:'active'}], message: 'Initial steps' } })
  for (let i = 3; i <= n; i++) {
    steps.push({ line: 4, description: 'Loop i=' + i, variables: [{name:'i',value:i,type:'number',scope:'fn'}, {name:'a',value:a,type:'number',scope:'fn'}, {name:'b',value:b,type:'number',scope:'fn'}], callStack: [makeFrame('climbStairs', 4, [])], heap: [], output: '', dsaState: { type: 'array', nodes: [{id:'a',value:a,highlight:'visited'}, {id:'b',value:b,highlight:'active'}], message: 'Iteration ' + i } })
    let temp = a + b
    steps.push({ line: 5, description: 'temp = ' + a + ' + ' + b + ' = ' + temp, variables: [{name:'i',value:i,type:'number',scope:'fn'}, {name:'temp',value:temp,type:'number',scope:'fn'}], callStack: [makeFrame('climbStairs', 5, [])], heap: [], output: '', dsaState: { type: 'array', nodes: [{id:'a',value:a,highlight:'visited'}, {id:'b',value:b,highlight:'visited'}, {id:'t',value:temp,highlight:'active'}], message: 'Fibonacci sum: ' + temp } })
    a = b
    steps.push({ line: 6, description: 'a = b (' + b + ')', variables: [{name:'a',value:a,type:'number',scope:'fn'}], callStack: [makeFrame('climbStairs', 6, [])], heap: [], output: '', dsaState: { type: 'array', nodes: [{id:'a',value:a,highlight:'active'}, {id:'t',value:temp,highlight:'visited'}], message: 'a updated' } })
    b = temp
    steps.push({ line: 7, description: 'b = temp (' + temp + ')', variables: [{name:'b',value:b,type:'number',scope:'fn'}], callStack: [makeFrame('climbStairs', 7, [])], heap: [], output: '', dsaState: { type: 'array', nodes: [{id:'a',value:a,highlight:'visited'}, {id:'b',value:b,highlight:'active'}], message: 'b updated' } })
  }
  steps.push({ line: 9, description: 'Return ' + b, variables: [], callStack: [makeFrame('climbStairs', 9, [])], heap: [], output: String(b), dsaState: { type: 'array', nodes: [{id:'ans',value:b,highlight:'found'}], message: 'Done' } })
  return steps
}

export function genContainsDuplicate(nums: number[]): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  const set = new Set<number>()
  steps.push({ line: 1, description: 'containsDuplicate', variables: [{name:'nums',value:nums,type:'Array',scope:'fn'}], callStack: [makeFrame('fn', 1, [])], heap: [], output: '', dsaState: { type: 'array', nodes: nums.map((v,i) => ({id:'n'+i,value:v,highlight:'none'})), message: 'Start' } })
  steps.push({ line: 2, description: 'const set = new Set()', variables: [], callStack: [makeFrame('fn', 2, [])], heap: [], output: '', dsaState: { type: 'array', nodes: nums.map((v,i) => ({id:'n'+i,value:v,highlight:'none'})), message: 'Init Set' } })
  let setArr: number[] = []
  for (let i = 0; i < nums.length; i++) {
    const num = nums[i]
    steps.push({ line: 3, description: 'num = ' + num, variables: [{name:'num',value:num,type:'number',scope:'fn'}], callStack: [makeFrame('fn', 3, [])], heap: [], output: '', dsaState: { type: 'array', nodes: nums.map((v,k) => ({id:'n'+k,value:v,highlight:k===i?'active':set.has(v)?'visited':'none'})), message: 'Check ' + num } })
    steps.push({ line: 4, description: 'if (set.has(' + num + '))', variables: [], callStack: [makeFrame('fn', 4, [])], heap: [], output: '', dsaState: { type: 'array', nodes: nums.map((v,k) => ({id:'n'+k,value:v,highlight:k===i?'active':set.has(v)?'visited':'none'})), message: 'Check if set has ' + num } })
    if (set.has(num)) {
      steps.push({ line: 4, description: 'Found duplicate: ' + num + '!', variables: [], callStack: [makeFrame('fn', 4, [])], heap: [], output: 'true', dsaState: { type: 'array', nodes: nums.map((v,k) => ({id:'n'+k,value:v,highlight:v===num?'found':'none'})), message: 'Duplicate ' + num } })
      return steps
    }
    set.add(num)
    setArr.push(num)
    steps.push({ line: 5, description: 'set.add(' + num + ')', variables: [], callStack: [makeFrame('fn', 5, [])], heap: [], output: '', dsaState: { type: 'array', nodes: nums.map((v,k) => ({id:'n'+k,value:v,highlight:k<=i?'visited':'none'})), auxiliaryData: { set: [...setArr] }, message: 'Set added ' + num } })
  }
  steps.push({ line: 7, description: 'Return false', variables: [], callStack: [makeFrame('fn', 7, [])], heap: [], output: 'false', dsaState: { type: 'array', nodes: nums.map((v,k) => ({id:'n'+k,value:v,highlight:'visited'})), message: 'All unique' } })
  return steps
}

export function genReverseList(values: number[]): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  
  const buildState = (_vals: number[], revVals: number[], activeIdx: number, stepMsg: string): DSAState => {
    const nodes: DSANode[] = []
    const edges: DSAEdge[] = []
    
    // Reversed part (left side)
    revVals.forEach((v, i) => {
      nodes.push({ id: `r-${i}`, value: String(v), x: i * 100 + 60, y: 180, highlight: 'visited' })
      if (i > 0) edges.push({ id: `er-${i}`, from: `r-${i}`, to: `r-${i-1}`, directed: true })
    })
    
    // Current active node
    if (activeIdx < values.length) {
      nodes.push({ id: `c-${activeIdx}`, value: String(values[activeIdx]), x: (revVals.length) * 100 + 60, y: 180, highlight: 'active', label: 'curr' })
      if (revVals.length > 0) {
        // Show pointer from curr to prev
        edges.push({ id: `ec`, from: `c-${activeIdx}`, to: `r-${revVals.length-1}`, directed: true, highlight: true })
      }
    }
    
    // Remaining original list (right side)
    values.slice(activeIdx + 1).forEach((v, i) => {
      const actualIdx = activeIdx + 1 + i
      nodes.push({ id: `o-${actualIdx}`, value: String(v), x: (revVals.length + 1 + i) * 100 + 60, y: 180, highlight: 'none' })
      if (i === 0 && activeIdx < values.length) {
        // Pointer from curr to next
        edges.push({ id: `eo-0`, from: `c-${activeIdx}`, to: `o-${actualIdx}`, directed: true })
      } else if (i > 0) {
        edges.push({ id: `eo-${i}`, from: `o-${actualIdx-1}`, to: `o-${actualIdx}`, directed: true })
      }
    })

    return { type: 'linkedlist', nodes, edges, message: stepMsg }
  }
  
  steps.push({ line: 8, description: 'reverseList(head)', variables: [], callStack: [makeFrame('fn', 8, [])], heap: [], output: '', dsaState: buildState(values, [], 0, 'Start') })
  steps.push({ line: 9, description: 'let prev = null', variables: [{name:'prev',value:'null',type:'object',scope:'fn'}], callStack: [makeFrame('fn', 9, [])], heap: [], output: '', dsaState: buildState(values, [], 0, 'prev = null') })
  
  let reversedVals: number[] = []
  for (let i = 0; i < values.length; i++) {
    steps.push({ line: 11, description: 'while (curr !== null)', variables: [], callStack: [makeFrame('fn', 11, [])], heap: [], output: '', dsaState: buildState(values, reversedVals, i, `Processing ${values[i]}`) })
    steps.push({ line: 12, description: 'let nextTemp = curr.next', variables: [], callStack: [makeFrame('fn', 12, [])], heap: [], output: '', dsaState: buildState(values, reversedVals, i, 'Save nextTemp') })
    
    // Reverse pointer
    const stateWithReversedEdge = buildState(values, reversedVals, i, 'Reverse pointer')
    
    steps.push({ line: 13, description: 'curr.next = prev', variables: [], callStack: [makeFrame('fn', 13, [])], heap: [], output: '', dsaState: stateWithReversedEdge })
    
    reversedVals.push(values[i])
    
    steps.push({ line: 14, description: 'prev = curr', variables: [], callStack: [makeFrame('fn', 14, [])], heap: [], output: '', dsaState: buildState(values, reversedVals, i + 1, 'Move prev') })
    steps.push({ line: 15, description: 'curr = nextTemp', variables: [], callStack: [makeFrame('fn', 15, [])], heap: [], output: '', dsaState: buildState(values, reversedVals, i + 1, 'Move curr') })
  }
  
  const finalState = buildState(values, reversedVals, values.length, 'List fully reversed')
  finalState.nodes.forEach(n => n.highlight = 'found')
  
  steps.push({ line: 11, description: 'while (curr !== null) (null)', variables: [], callStack: [makeFrame('fn', 11, [])], heap: [], output: '', dsaState: finalState })
  steps.push({ line: 17, description: 'return prev', variables: [], callStack: [makeFrame('fn', 17, [])], heap: [], output: '[' + reversedVals.slice().reverse().join(',') + ']', dsaState: finalState })
  
  return steps
}

export function genMaxArea(height: number[]): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  steps.push({ line: 1, description: 'maxArea', variables: [], callStack: [makeFrame('fn', 1, [])], heap: [], output: '', dsaState: { type: 'array', nodes: height.map((v,i) => ({id:'h'+i,value:v,highlight:'none'})), message: 'Start' } })
  let left = 0, right = height.length - 1, maxArea = 0
  steps.push({ line: 2, description: 'let maxArea = 0', variables: [], callStack: [makeFrame('fn', 2, [])], heap: [], output: '', dsaState: { type: 'array', nodes: height.map((v,i) => ({id:'h'+i,value:v,highlight:'none'})), message: 'maxArea = 0' } })
  steps.push({ line: 3, description: 'let left = 0', variables: [], callStack: [makeFrame('fn', 3, [])], heap: [], output: '', dsaState: { type: 'array', nodes: height.map((v,i) => ({id:'h'+i,value:v,highlight:'none'})), pointer: left, message: 'left = 0' } })
  steps.push({ line: 4, description: 'let right = ' + right, variables: [], callStack: [makeFrame('fn', 4, [])], heap: [], output: '', dsaState: { type: 'array', nodes: height.map((v,i) => ({id:'h'+i,value:v,highlight:'none'})), pointer: left, pointerName: 'left', pointer2: right, pointer2Name: 'right', message: 'right = ' + right } })

  while (left < right) {
    steps.push({ line: 6, description: 'while (' + left + ' < ' + right + ')', variables: [], callStack: [makeFrame('fn', 6, [])], heap: [], output: '', dsaState: { type: 'array', nodes: height.map((v,k) => ({id:'h'+k,value:v,highlight:k===left||k===right?'active':'none'})), pointer: left, pointerName: 'left', pointer2: right, pointer2Name: 'right', message: 'Check condition' } })
    let h = Math.min(height[left], height[right])
    steps.push({ line: 7, description: 'h = Math.min(' + height[left] + ', ' + height[right] + ') = ' + h, variables: [], callStack: [makeFrame('fn', 7, [])], heap: [], output: '', dsaState: { type: 'array', nodes: height.map((v,k) => ({id:'h'+k,value:v,highlight:k===left||k===right?'comparing':'none'})), pointer: left, pointerName: 'left', pointer2: right, pointer2Name: 'right', message: 'Height = ' + h } })
    let w = right - left
    steps.push({ line: 8, description: 'w = ' + right + ' - ' + left + ' = ' + w, variables: [], callStack: [makeFrame('fn', 8, [])], heap: [], output: '', dsaState: { type: 'array', nodes: height.map((v,k) => ({id:'h'+k,value:v,highlight:k===left||k===right?'comparing':'none'})), pointer: left, pointerName: 'left', pointer2: right, pointer2Name: 'right', message: 'Width = ' + w } })
    let area = w * h
    if (area > maxArea) maxArea = area
    steps.push({ line: 9, description: 'maxArea = Math.max(' + maxArea + ', ' + area + ')', variables: [], callStack: [makeFrame('fn', 9, [])], heap: [], output: '', dsaState: { type: 'array', nodes: height.map((v,k) => ({id:'h'+k,value:v,highlight:k===left||k===right?'found':'none'})), pointer: left, pointerName: 'left', pointer2: right, pointer2Name: 'right', message: 'Area = ' + area + ', maxArea = ' + maxArea } })

    steps.push({ line: 11, description: 'if (' + height[left] + ' < ' + height[right] + ')', variables: [], callStack: [makeFrame('fn', 11, [])], heap: [], output: '', dsaState: { type: 'array', nodes: height.map((v,k) => ({id:'h'+k,value:v,highlight:k===left||k===right?'active':'none'})), pointer: left, pointerName: 'left', pointer2: right, pointer2Name: 'right', message: 'Compare heights' } })
    if (height[left] < height[right]) {
      left++
      steps.push({ line: 12, description: 'left++', variables: [], callStack: [makeFrame('fn', 12, [])], heap: [], output: '', dsaState: { type: 'array', nodes: height.map((v,k) => ({id:'h'+k,value:v,highlight:k===left||k===right?'active':'none'})), pointer: left, pointerName: 'left', pointer2: right, pointer2Name: 'right', message: 'left moved to ' + left } })
    } else {
      steps.push({ line: 13, description: 'else', variables: [], callStack: [makeFrame('fn', 13, [])], heap: [], output: '', dsaState: { type: 'array', nodes: height.map((v,k) => ({id:'h'+k,value:v,highlight:k===left||k===right?'active':'none'})), pointer: left, pointerName: 'left', pointer2: right, pointer2Name: 'right', message: 'else' } })
      right--
      steps.push({ line: 14, description: 'right--', variables: [], callStack: [makeFrame('fn', 14, [])], heap: [], output: '', dsaState: { type: 'array', nodes: height.map((v,k) => ({id:'h'+k,value:v,highlight:k===left||k===right?'active':'none'})), pointer: left, pointerName: 'left', pointer2: right, pointer2Name: 'right', message: 'right moved to ' + right } })
    }
  }
  steps.push({ line: 6, description: 'while (' + left + ' < ' + right + ')', variables: [], callStack: [makeFrame('fn', 6, [])], heap: [], output: '', dsaState: { type: 'array', nodes: height.map((v,k) => ({id:'h'+k,value:v,highlight:k===left||k===right?'active':'none'})), pointer: left, pointerName: 'left', pointer2: right, pointer2Name: 'right', message: 'Condition false' } })
  steps.push({ line: 18, description: 'Return ' + maxArea, variables: [], callStack: [makeFrame('fn', 18, [])], heap: [], output: String(maxArea), dsaState: { type: 'array', nodes: height.map((v,i) => ({id:'h'+i,value:v,highlight:'visited'})), message: 'Done' } })
  return steps
}

export function genSearchInsert(nums: number[], target: number): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  steps.push({ line: 1, description: 'searchInsert', variables: [], callStack: [makeFrame('fn', 1, [])], heap: [], output: '', dsaState: { type: 'array', nodes: nums.map((v,i) => ({id:'n'+i,value:v,highlight:'none'})), message: 'Find ' + target } })
  let left = 0, right = nums.length - 1
  steps.push({ line: 2, description: 'let left = 0', variables: [], callStack: [makeFrame('fn', 2, [])], heap: [], output: '', dsaState: { type: 'array', nodes: nums.map((v,i) => ({id:'n'+i,value:v,highlight:'none'})), pointer: left, message: 'left = 0' } })
  steps.push({ line: 3, description: 'let right = ' + right, variables: [], callStack: [makeFrame('fn', 3, [])], heap: [], output: '', dsaState: { type: 'array', nodes: nums.map((v,i) => ({id:'n'+i,value:v,highlight:'none'})), pointer: left, pointerName: 'left', pointer2: right, pointer2Name: 'right', message: 'right = ' + right } })

  while (left <= right) {
    steps.push({ line: 5, description: 'while (' + left + ' <= ' + right + ')', variables: [], callStack: [makeFrame('fn', 5, [])], heap: [], output: '', dsaState: { type: 'array', nodes: nums.map((v,k) => ({id:'n'+k,value:v,highlight:k>=left&&k<=right?'active':'none'})), pointer: left, pointerName: 'left', pointer2: right, pointer2Name: 'right', message: 'Loop condition' } })
    let mid = Math.floor((left + right) / 2)
    steps.push({ line: 6, description: 'mid = ' + mid, variables: [{name:'mid',value:mid,type:'number',scope:'fn'}], callStack: [makeFrame('fn', 6, [])], heap: [], output: '', dsaState: { type: 'array', nodes: nums.map((v,k) => ({id:'n'+k,value:v,highlight:k===mid?'comparing':k>=left&&k<=right?'active':'none'})), pointer: left, pointerName: 'left', pointer2: right, pointer2Name: 'right', message: 'mid = ' + mid } })
    
    steps.push({ line: 7, description: 'if (nums[mid] === target)', variables: [], callStack: [makeFrame('fn', 7, [])], heap: [], output: '', dsaState: { type: 'array', nodes: nums.map((v,k) => ({id:'n'+k,value:v,highlight:k===mid?'comparing':k>=left&&k<=right?'active':'none'})), pointer: left, pointerName: 'left', pointer2: right, pointer2Name: 'right', message: 'Check if ' + nums[mid] + ' == ' + target } })
    if (nums[mid] === target) {
      steps.push({ line: 7, description: 'Found target at ' + mid, variables: [], callStack: [makeFrame('fn', 7, [])], heap: [], output: String(mid), dsaState: { type: 'array', nodes: nums.map((v,k) => ({id:'n'+k,value:v,highlight:k===mid?'found':'none'})), pointer: left, pointerName: 'left', pointer2: right, pointer2Name: 'right', message: 'Found' } })
      return steps
    }
    steps.push({ line: 8, description: 'else if (nums[mid] < target)', variables: [], callStack: [makeFrame('fn', 8, [])], heap: [], output: '', dsaState: { type: 'array', nodes: nums.map((v,k) => ({id:'n'+k,value:v,highlight:k===mid?'comparing':k>=left&&k<=right?'active':'none'})), pointer: left, pointerName: 'left', pointer2: right, pointer2Name: 'right', message: 'Check if ' + nums[mid] + ' < ' + target } })
    if (nums[mid] < target) {
      left = mid + 1
      steps.push({ line: 8, description: 'left = ' + left, variables: [], callStack: [makeFrame('fn', 8, [])], heap: [], output: '', dsaState: { type: 'array', nodes: nums.map((v,k) => ({id:'n'+k,value:v,highlight:k===mid?'visited':k>=left&&k<=right?'active':'none'})), pointer: left, pointerName: 'left', pointer2: right, pointer2Name: 'right', message: 'Search right half' } })
    } else {
      steps.push({ line: 9, description: 'else right = mid - 1', variables: [], callStack: [makeFrame('fn', 9, [])], heap: [], output: '', dsaState: { type: 'array', nodes: nums.map((v,k) => ({id:'n'+k,value:v,highlight:k===mid?'visited':k>=left&&k<=right?'active':'none'})), pointer: left, pointerName: 'left', pointer2: right, pointer2Name: 'right', message: 'Search left half' } })
      right = mid - 1
    }
  }
  steps.push({ line: 5, description: 'while (' + left + ' <= ' + right + ')', variables: [], callStack: [makeFrame('fn', 5, [])], heap: [], output: '', dsaState: { type: 'array', nodes: nums.map((v,k) => ({id:'n'+k,value:v,highlight:'visited'})), pointer: left, pointerName: 'left', pointer2: right, pointer2Name: 'right', message: 'Not found' } })
  steps.push({ line: 12, description: 'return left (' + left + ')', variables: [], callStack: [makeFrame('fn', 12, [])], heap: [], output: String(left), dsaState: { type: 'array', nodes: nums.map((v,k) => ({id:'n'+k,value:v,highlight:k===left?'found':'none'})), pointer: left, pointerName: 'left', pointer2: right, pointer2Name: 'right', message: 'Insert position' } })
  return steps
}

// ─── IS PALINDROME GENERATOR ─────────────────────────────────────────────────

export function genIsPalindrome(s: string): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  const chars = s.split('')
  let left = 0, right = chars.length - 1

  const snap = (desc: string, l: number, r: number, result?: boolean): ExecutionStep => ({
    line: 1, description: desc,
    variables: [
      { name: 'str', value: s, type: 'string', scope: 'isPalindrome' },
      { name: 'left', value: l, type: 'number', scope: 'isPalindrome', changed: true },
      { name: 'right', value: r, type: 'number', scope: 'isPalindrome', changed: true },
    ],
    callStack: [makeFrame('isPalindrome', 1, [], true)],
    heap: [], output: result !== undefined ? String(result) : '',
    dsaState: {
      type: 'string',
      nodes: chars.map((c, i) => ({
        id: `c${i}`, value: c,
        highlight: i === l || i === r ? 'comparing'
          : (i < l || i > r) ? 'found'
          : 'none'
      })),
      pointer: l, pointerName: 'L',
      pointer2: r, pointer2Name: 'R',
      message: desc
    }
  })

  steps.push(snap(`Check if "${s}" is a palindrome`, left, right))

  while (left < right) {
    if (chars[left] !== chars[right]) {
      steps.push(snap(`'${chars[left]}' ≠ '${chars[right]}' → ❌ NOT a palindrome`, left, right, false))
      return steps
    }
    steps.push(snap(`'${chars[left]}' === '${chars[right]}' ✓ match`, left, right))
    left++
    right--
  }

  steps.push(snap(`✅ "${s}" IS a palindrome!`, left, right, true))
  return steps
}

// ─── LONGEST SUBSTRING GENERATOR ─────────────────────────────────────────────

export function genLongestSubstring(s: string): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  const chars = s.split('')
  const set = new Set<string>()
  let left = 0
  let maxLen = 0
  let bestLeft = 0, bestRight = 0

  const snap = (desc: string, l: number, r: number, hl?: Record<number, DSANode['highlight']>): ExecutionStep => {
    const highlights: Record<number, DSANode['highlight']> = hl || {}
    // Default: highlight window
    if (!hl) {
      for (let i = 0; i < chars.length; i++) {
        if (i < l) highlights[i] = 'visited'
        else if (i >= l && i <= r) highlights[i] = 'active'
        else highlights[i] = 'none'
      }
    }
    return {
      line: 1, description: desc,
      variables: [
        { name: 'str', value: s, type: 'string', scope: 'longestSubstring' },
        { name: 'left', value: l, type: 'number', scope: 'longestSubstring', changed: true },
        { name: 'right', value: r, type: 'number', scope: 'longestSubstring', changed: true },
        { name: 'maxLength', value: maxLen, type: 'number', scope: 'longestSubstring', changed: true },
        { name: 'set', value: [...set], type: 'Set', scope: 'longestSubstring', changed: true },
      ],
      callStack: [makeFrame('longestSubstring', 1, [], true)],
      heap: [], output: '',
      dsaState: {
        type: 'string',
        nodes: chars.map((c, i) => ({
          id: `c${i}`, value: c,
          highlight: highlights[i] || 'none'
        })),
        pointer: l, pointerName: 'L',
        pointer2: r, pointer2Name: 'R',
        stackItems: [...set] as (string | number)[],
        stackName: 'Set',
        message: desc
      }
    }
  }

  // Initial step
  steps.push(snap(`Longest Substring Without Repeating Characters: "${s}"`, 0, -1))
  steps.push(snap(`Initialize: left=0, right=0, maxLength=0, set={}`, 0, 0))

  for (let right = 0; right < chars.length; right++) {
    const char = chars[right]

    // Check if char already in set
    if (set.has(char)) {
      const hlDup: Record<number, DSANode['highlight']> = {}
      for (let i = 0; i < chars.length; i++) {
        if (i < left) hlDup[i] = 'visited'
        else if (i >= left && i <= right) hlDup[i] = i === right ? 'swapping' : 'active'
        else hlDup[i] = 'none'
      }
      steps.push(snap(`'${char}' already in Set! Shrink window from left`, left, right, hlDup))

      // Shrink window until duplicate is removed
      while (set.has(char)) {
        const removed = chars[left]
        set.delete(removed)
        left++
        const hlShrink: Record<number, DSANode['highlight']> = {}
        for (let i = 0; i < chars.length; i++) {
          if (i < left) hlShrink[i] = 'visited'
          else if (i >= left && i <= right) hlShrink[i] = i === right ? 'comparing' : 'active'
          else hlShrink[i] = 'none'
        }
        steps.push(snap(`Removed '${removed}' from Set, left=${left}. Set={${[...set].join(',')}}`, left, right, hlShrink))
      }
    }

    // Add current char
    set.add(char)
    const windowLen = right - left + 1
    if (windowLen > maxLen) {
      maxLen = windowLen
      bestLeft = left
      bestRight = right
    }

    const hlAdd: Record<number, DSANode['highlight']> = {}
    for (let i = 0; i < chars.length; i++) {
      if (i < left) hlAdd[i] = 'visited'
      else if (i >= left && i <= right) hlAdd[i] = 'found'
      else hlAdd[i] = 'none'
    }
    steps.push(snap(
      `Add '${char}'. Window "${chars.slice(left, right + 1).join('')}" len=${windowLen}, maxLength=${maxLen}`,
      left, right, hlAdd
    ))
  }

  // Final result
  const hlFinal: Record<number, DSANode['highlight']> = {}
  for (let i = 0; i < chars.length; i++) {
    if (i >= bestLeft && i <= bestRight) hlFinal[i] = 'found'
    else hlFinal[i] = 'visited'
  }
  steps.push(snap(
    `✅ Longest substring: "${chars.slice(bestLeft, bestRight + 1).join('')}" (length ${maxLen})`,
    bestLeft, bestRight, hlFinal
  ))

  return steps
}

// ─── GENERATORS: Heap, Knapsack, N-Queens ──────────────────────────────────

export function genHeap(ops: Array<{ op: 'insert' | 'extract'; val?: number }>): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  const heap: number[] = []

  const snap = (desc: string, active?: number, comparing?: number, swapping?: number): ExecutionStep => {
    return {
      line: 1, description: desc,
      variables: [
        { name: 'heap', value: [...heap], type: 'Array', scope: 'genHeap' },
      ],
      callStack: [makeFrame('heap', 1, [], true)],
      heap: [], output: '',
      dsaState: {
        type: 'tree',
        nodes: heap.map((val, i) => ({
          id: `n${i}`, value: val,
          highlight: i === swapping ? 'swapping' : i === comparing ? 'comparing' : i === active ? 'active' : 'none'
        })),
        edges: heap.map((_, i) => {
          const parent = Math.floor((i - 1) / 2)
          if (i > 0) return { id: `e${parent}-${i}`, from: `n${parent}`, to: `n${i}` }
          return null
        }).filter(e => e !== null) as DSAEdge[],
        message: desc
      }
    }
  }

  steps.push(snap(`Initialize empty Heap`))

  for (const { op, val } of ops) {
    if (op === 'insert' && val !== undefined) {
      heap.push(val)
      let curr = heap.length - 1
      steps.push(snap(`Insert ${val} at end of heap`, curr))
      
      while (curr > 0) {
        const parent = Math.floor((curr - 1) / 2)
        steps.push(snap(`Compare ${heap[curr]} with parent ${heap[parent]}`, curr, parent))
        if (heap[curr] < heap[parent]) {
          steps.push(snap(`Swap ${heap[curr]} and ${heap[parent]}`, curr, parent, curr))
          const temp = heap[curr]
          heap[curr] = heap[parent]
          heap[parent] = temp
          curr = parent
        } else {
          break
        }
      }
      steps.push(snap(`Heap after inserting ${val}`))
    } else if (op === 'extract' && heap.length > 0) {
      const min = heap[0]
      steps.push(snap(`Extract root (min): ${min}`, 0))
      const last = heap.pop()!
      if (heap.length > 0) {
        heap[0] = last
        let curr = 0
        steps.push(snap(`Move last element ${last} to root`, curr))
        
        while (true) {
          const left = 2 * curr + 1
          const right = 2 * curr + 2
          let smallest = curr
          
          if (left < heap.length) {
            steps.push(snap(`Compare ${heap[curr]} with left child ${heap[left]}`, curr, left))
            if (heap[left] < heap[smallest]) smallest = left
          }
          if (right < heap.length) {
            steps.push(snap(`Compare ${heap[smallest]} with right child ${heap[right]}`, smallest, right))
            if (heap[right] < heap[smallest]) smallest = right
          }
          
          if (smallest !== curr) {
            steps.push(snap(`Swap ${heap[curr]} and ${heap[smallest]}`, curr, smallest, curr))
            const temp = heap[curr]
            heap[curr] = heap[smallest]
            heap[smallest] = temp
            curr = smallest
          } else {
            break
          }
        }
      }
      steps.push(snap(`Heap after extraction`))
    }
  }

  return steps
}

export function genKnapsack(W: number, weights: number[], values: number[]): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  const n = weights.length
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(W + 1).fill(0))

  const snap = (desc: string, currN: number, currW: number, hl?: 'checking'|'matched'): ExecutionStep => {
    // Flatten DP table to 1D array for visualization
    const flatDP = dp.flat()
    return {
      line: 1, description: desc,
      variables: [
        { name: 'dp', value: dp, type: 'Array', scope: 'knapsack' },
        { name: 'W', value: W, type: 'number', scope: 'knapsack' },
        { name: 'weights', value: weights, type: 'Array', scope: 'knapsack' },
        { name: 'values', value: values, type: 'Array', scope: 'knapsack' }
      ],
      callStack: [makeFrame('knapsack', 1, [], true)],
      heap: [], output: '',
      dsaState: {
        type: 'array',
        nodes: flatDP.map((val, i) => {
          const r = Math.floor(i / (W + 1))
          const c = i % (W + 1)
          let highlight: DSANode['highlight'] = 'none'
          if (r === currN && c === currW) highlight = hl === 'checking' ? 'comparing' : 'active'
          else if (r <= currN) highlight = 'visited'
          return { id: `c${i}`, value: val, highlight }
        }),
        message: desc
      }
    }
  }

  steps.push(snap(`Initialize DP table (size ${n + 1}x${W + 1}) for 0/1 Knapsack`, 0, 0))

  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= W; w++) {
      steps.push(snap(`Checking item ${i} (weight: ${weights[i-1]}, value: ${values[i-1]}) at capacity ${w}`, i, w, 'checking'))
      if (weights[i - 1] <= w) {
        dp[i][w] = Math.max(
          values[i - 1] + dp[i - 1][w - weights[i - 1]],
          dp[i - 1][w]
        )
      } else {
        dp[i][w] = dp[i - 1][w]
      }
      steps.push(snap(`Computed max value: ${dp[i][w]}`, i, w, 'matched'))
    }
  }

  steps.push(snap(`Finished! Max value for capacity ${W} is ${dp[n][W]}`, n, W, 'matched'))
  return steps
}

export function genNQueens(n: number): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  const board = Array.from({ length: n }, () => Array(n).fill('.'))
  const res: string[][] = []

  const snap = (desc: string, row: number, col: number, hl?: 'checking'|'placed'|'invalid'): ExecutionStep => {
    return {
      line: 1, description: desc,
      variables: [
        { name: 'board', value: board.map(r => r.join('')), type: 'Array', scope: 'nQueens' },
        { name: 'solutions', value: res.length, type: 'number', scope: 'nQueens' }
      ],
      callStack: [makeFrame('nQueens', 1, [], true)],
      heap: [], output: '',
      dsaState: {
        type: 'matrix',
        nodes: board.flat().map((val, i) => {
          const r = Math.floor(i / n)
          const c = i % n
          let highlight: DSANode['highlight'] = 'none'
          if (r === row && c === col) {
            highlight = hl === 'invalid' ? 'comparing' : (hl === 'placed' ? 'active' : 'processing')
          } else if (val === 'Q') {
            highlight = 'found'
          }
          return { id: `c${i}`, value: val, highlight }
        }),
        message: desc
      }
    }
  }

  function isValid(r: number, c: number): boolean {
    for (let i = 0; i < r; i++) {
      if (board[i][c] === 'Q') return false
    }
    for (let i = r - 1, j = c - 1; i >= 0 && j >= 0; i--, j--) {
      if (board[i][j] === 'Q') return false
    }
    for (let i = r - 1, j = c + 1; i >= 0 && j < n; i--, j++) {
      if (board[i][j] === 'Q') return false
    }
    return true
  }

  function backtrack(r: number) {
    if (r === n) {
      res.push(board.map(row => row.join('')))
      steps.push(snap(`Found solution #${res.length}!`, r-1, 0, 'placed'))
      return
    }
    for (let c = 0; c < n; c++) {
      steps.push(snap(`Trying row ${r}, col ${c}`, r, c, 'checking'))
      if (isValid(r, c)) {
        board[r][c] = 'Q'
        steps.push(snap(`Placed Queen at row ${r}, col ${c}`, r, c, 'placed'))
        backtrack(r + 1)
        board[r][c] = '.'
        steps.push(snap(`Backtrack: Removed Queen at row ${r}, col ${c}`, r, c, 'checking'))
      } else {
        steps.push(snap(`Invalid position at row ${r}, col ${c}`, r, c, 'invalid'))
      }
    }
  }

  steps.push(snap(`Start ${n}-Queens Backtracking`, 0, 0))
  backtrack(0)
  steps.push(snap(`Finished! Found ${res.length} solutions.`, -1, -1))

  return steps
}

// ─── SAMPLE CODE LIBRARY ─────────────────────────────────────────────────────

export const SAMPLE_CODES: Record<string, { label: string; code: string; language: 'javascript' | 'python'; category: string }> = {
  bubbleSort: {
    label: 'Bubble Sort', category: 'Sorting', language: 'javascript',
    code: `// Bubble Sort — O(n²) time, O(1) space
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
console.log("Sorted:", bubbleSort([...data]));`
  },
  selectionSort: {
    label: 'Selection Sort', category: 'Sorting', language: 'javascript',
    code: `// Selection Sort — O(n²) time, O(1) space
function selectionSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      if (arr[j] < arr[minIdx]) minIdx = j;
    }
    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
    }
  }
  return arr;
}
const data = [64, 25, 12, 22, 11];
console.log("Sorted:", selectionSort([...data]));`
  },
  insertionSort: {
    label: 'Insertion Sort', category: 'Sorting', language: 'javascript',
    code: `// Insertion Sort — O(n²) worst, O(n) best
function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    let key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = key;
  }
  return arr;
}
const data = [12, 11, 13, 5, 6];
console.log("Sorted:", insertionSort([...data]));`
  },
  mergeSort: {
    label: 'Merge Sort', category: 'Sorting', language: 'javascript',
    code: `// Merge Sort — O(n log n) time, O(n) space
function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
}

function merge(left, right) {
  const result = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) result.push(left[i++]);
    else result.push(right[j++]);
  }
  return [...result, ...left.slice(i), ...right.slice(j)];
}
const data = [38, 27, 43, 3, 9, 82, 10];
console.log("Sorted:", mergeSort(data));`
  },
  quickSort: {
    label: 'Quick Sort', category: 'Sorting', language: 'javascript',
    code: `// Quick Sort — O(n log n) avg, O(n²) worst
function quickSort(arr, low = 0, high = arr.length - 1) {
  if (low < high) {
    const pi = partition(arr, low, high);
    quickSort(arr, low, pi - 1);
    quickSort(arr, pi + 1, high);
  }
  return arr;
}

function partition(arr, low, high) {
  const pivot = arr[high];
  let i = low - 1;
  for (let j = low; j < high; j++) {
    if (arr[j] <= pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
}
const data = [10, 7, 8, 9, 1, 5];
console.log("Sorted:", quickSort([...data]));`
  },
  binarySearch: {
    label: 'Binary Search', category: 'Searching', language: 'javascript',
    code: `// Binary Search — O(log n) time
function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    else if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}
const arr = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
const target = 23;
console.log("Found at:", binarySearch(arr, target));`
  },
  linearSearch: {
    label: 'Linear Search', category: 'Searching', language: 'javascript',
    code: `// Linear Search — O(n) time
function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}
const arr = [4, 2, 7, 1, 9, 3, 8, 5];
const target = 9;
console.log("Found at:", linearSearch(arr, target));`
  },
  fibonacci: {
    label: 'Fibonacci', category: 'Recursion', language: 'javascript',
    code: `// Fibonacci with Memoization
function fibonacci(n, memo = {}) {
  if (n <= 1) return n;
  if (memo[n]) return memo[n];
  memo[n] = fibonacci(n - 1, memo) + fibonacci(n - 2, memo);
  return memo[n];
}
console.log("F(8) =", fibonacci(8));`
  },
  factorial: {
    label: 'Factorial', category: 'Recursion', language: 'javascript',
    code: `// Factorial — recursive
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}
console.log("7! =", factorial(7));`
  },
  linkedList: {
    label: 'Linked List', category: 'Data Structures', language: 'javascript',
    code: `// Singly Linked List
class Node {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}
class LinkedList {
  constructor() { this.head = null; this.size = 0; }
  push(value) {
    const node = new Node(value);
    if (!this.head) { this.head = node; }
    else {
      let cur = this.head;
      while (cur.next) cur = cur.next;
      cur.next = node;
    }
    this.size++;
  }
}
const list = new LinkedList();
[10, 20, 30, 40, 50].forEach(v => list.push(v));`
  },
  bst: {
    label: 'Binary Search Tree', category: 'Data Structures', language: 'javascript',
    code: `// Binary Search Tree — insert & traverse
class BST {
  constructor() { this.root = null; }
  insert(val) {
    const node = { val, left: null, right: null };
    if (!this.root) { this.root = node; return; }
    let cur = this.root;
    while (true) {
      if (val < cur.val) {
        if (!cur.left) { cur.left = node; break; }
        cur = cur.left;
      } else {
        if (!cur.right) { cur.right = node; break; }
        cur = cur.right;
      }
    }
  }
}
const bst = new BST();
[50, 30, 70, 20, 40, 60, 80].forEach(v => bst.insert(v));`
  },
  bfs: {
    label: 'Graph BFS', category: 'Graphs', language: 'javascript',
    code: `// BFS — Breadth-First Search
function bfs(graph, start) {
  const visited = new Set();
  const queue = [start];
  visited.add(start);
  const order = [];
  while (queue.length) {
    const node = queue.shift();
    order.push(node);
    for (const neighbor of (graph[node] || [])) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return order;
}
const graph = { A:['B','C'], B:['D','E'], C:['F'], D:[], E:[], F:[] };
console.log("BFS:", bfs(graph, 'A'));`
  },
  dfs: {
    label: 'Graph DFS', category: 'Graphs', language: 'javascript',
    code: `// DFS — Depth-First Search
function dfs(graph, start, visited = new Set()) {
  visited.add(start);
  const order = [start];
  for (const neighbor of (graph[start] || [])) {
    if (!visited.has(neighbor)) {
      order.push(...dfs(graph, neighbor, visited));
    }
  }
  return order;
}
const graph = { A:['B','C'], B:['D','E'], C:['F'], D:[], E:[], F:[] };
console.log("DFS:", dfs(graph, 'A'));`
  },
  stack: {
    label: 'Stack', category: 'Data Structures', language: 'javascript',
    code: `// Stack — LIFO data structure
class Stack {
  constructor() { this.items = []; }
  push(val) { this.items.push(val); }
  pop() { return this.items.pop(); }
  peek() { return this.items[this.items.length - 1]; }
  isEmpty() { return this.items.length === 0; }
}
const stack = new Stack();
stack.push(10); stack.push(20); stack.push(30);
console.log("Pop:", stack.pop());
stack.push(40);
console.log("Pop:", stack.pop());`
  },
  queue: {
    label: 'Queue', category: 'Data Structures', language: 'javascript',
    code: `// Queue — FIFO data structure
class Queue {
  constructor() { this.items = []; }
  enqueue(val) { this.items.push(val); }
  dequeue() { return this.items.shift(); }
  front() { return this.items[0]; }
  isEmpty() { return this.items.length === 0; }
}
const queue = new Queue();
queue.enqueue(1); queue.enqueue(2); queue.enqueue(3);
console.log("Dequeue:", queue.dequeue());
queue.enqueue(4);
console.log("Dequeue:", queue.dequeue());`
  },
  hashMap: {
    label: 'Hash Map', category: 'Data Structures', language: 'javascript',
    code: `// Hash Map — key-value store
const map = new Map();
map.set('apple', 5);
map.set('banana', 3);
map.set('cherry', 8);
map.set('date', 2);
map.set('elderberry', 7);
console.log("apple:", map.get('apple'));
console.log("has banana:", map.has('banana'));
map.delete('date');
console.log("size:", map.size);`
  },
  twoSum: {
    label: 'Two Sum', category: 'Problems', language: 'javascript',
    code: `// Two Sum — LeetCode #1
// Find indices of two numbers that add to target
function twoSum(nums, target) {
  const map = {};
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map[complement] !== undefined) {
      return [map[complement], i];
    }
    map[nums[i]] = i;
  }
  return [-1, -1];
}
const nums = [2, 7, 11, 15];
const target = 9;
console.log("Answer:", twoSum(nums, target));`
  },
  reverseString: {
    label: 'Reverse String', category: 'Problems', language: 'javascript',
    code: `// Reverse a String — two pointer approach
function reverseString(str) {
  const chars = str.split('');
  let left = 0, right = chars.length - 1;
  while (left < right) {
    [chars[left], chars[right]] = [chars[right], chars[left]];
    left++;
    right--;
  }
  return chars.join('');
}
console.log(reverseString("hello"));`
  },
  fizzBuzz: {
    label: 'FizzBuzz', category: 'Problems', language: 'javascript',
    code: `// FizzBuzz — Classic problem
function fizzBuzz(n) {
  const result = [];
  for (let i = 1; i <= n; i++) {
    if (i % 3 === 0 && i % 5 === 0) result.push('FizzBuzz');
    else if (i % 3 === 0) result.push('Fizz');
    else if (i % 5 === 0) result.push('Buzz');
    else result.push(String(i));
  }
  return result;
}
console.log(fizzBuzz(15));`
  },
  nQueens: {
    label: 'N-Queens', category: 'Advanced', language: 'javascript',
    code: `// N-Queens Problem (Backtracking)
// Place N queens on an NxN chessboard so that no two queens attack each other.
function solveNQueens(n) {
  const res = [];
  const board = Array.from({ length: n }, () => Array(n).fill('.'));
  
  function isValid(r, c) {
    for (let i = 0; i < r; i++) {
      if (board[i][c] === 'Q') return false;
    }
    for (let i = r - 1, j = c - 1; i >= 0 && j >= 0; i--, j--) {
      if (board[i][j] === 'Q') return false;
    }
    for (let i = r - 1, j = c + 1; i >= 0 && j < n; i--, j++) {
      if (board[i][j] === 'Q') return false;
    }
    return true;
  }
  
  function backtrack(r) {
    if (r === n) {
      res.push(board.map(row => row.join('')));
      return;
    }
    for (let c = 0; c < n; c++) {
      if (isValid(r, c)) {
        board[r][c] = 'Q';
        backtrack(r + 1);
        board[r][c] = '.';
      }
    }
  }
  
  backtrack(0);
  return res;
}

const n = 4;
console.log(solveNQueens(n));`
  },
  knapsack: {
    label: '0/1 Knapsack', category: 'Advanced', language: 'javascript',
    code: `// 0/1 Knapsack Problem (Dynamic Programming)
// Find the maximum value of items that can be put in a knapsack of capacity W.
function knapsack(W, weights, values) {
  const n = weights.length;
  const dp = Array.from({ length: n + 1 }, () => Array(W + 1).fill(0));
  
  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= W; w++) {
      if (weights[i - 1] <= w) {
        dp[i][w] = Math.max(
          values[i - 1] + dp[i - 1][w - weights[i - 1]],
          dp[i - 1][w]
        );
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }
  return dp[n][W];
}

const values = [60, 100, 120];
const weights = [10, 20, 30];
const W = 50;
console.log("Max Value:", knapsack(W, weights, values));`
  },
  blankCanvas: {
    label: 'Blank Canvas', category: 'Custom Code', language: 'javascript',
    code: `// Write your custom code here!
// The visualizer supports generic code tracing natively.
// If you are writing DSA code, name your functions like 'bubbleSort' 
// or use arrays to trigger the visualizer features automatically.

function main() {
  const text = "Hello World";
  let reversed = "";
  
  for (let i = text.length - 1; i >= 0; i--) {
    reversed += text[i];
  }
  
  return reversed;
}

console.log(main());`
  }
}

