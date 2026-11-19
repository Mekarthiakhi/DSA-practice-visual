import { ExecutionStep, Variable, StackFrame, DSAState, DSANode, DSAEdge } from '../store/ideStore'
import { genHeapSort } from '../engines/sorting/heapSort'
import { interpretCode } from './jsInterpreter'
import { computeTreeLayout, computeHeapLayout } from './treeLayout'

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
  | 'binarySearch' | 'linearSearch' | 'findMinRotated' | 'searchRotated'
  | 'fibonacci' | 'factorial'
  | 'linkedList' | 'doublyLinkedList'
  | 'bst' | 'avl' | 'heap'
  | 'bfs' | 'dfs' | 'dijkstra'
  | 'stack' | 'queue'
  | 'hashMap'
  | 'twoSum' | 'threeSum' | 'reverseString' | 'isPalindrome' | 'fizzBuzz' | 'climbStairs' | 'containsDuplicate' | 'reverseList' | 'maxArea' | 'trappingRainWater' | 'removeDuplicates' | 'searchInsert'
  | 'validParentheses' | 'mergeTwoLists' | 'reorderList' | 'hasCycle' | 'removeNthFromEnd' | 'maxSubArray' | 'maxProfit'
  | 'longestSubstring'
  | 'nQueens' | 'knapsack'
  | 'matrixTraversal'
  | 'dailyTemperatures' | 'minStack' | 'houseRobber' | 'coinChange' | 'lengthOfLIS'
  | 'invertTree' | 'maxDepth' | 'sameTree' | 'levelOrder' | 'validateBST' | 'kthSmallest'
  | 'numIslands' | 'maxAreaOfIsland' | 'cloneGraph' | 'courseSchedule' | 'rottingOranges' | 'pacificAtlantic' | 'spiralMatrix' | 'setMatrixZeroes'
  | 'generic'
export function detectAlgorithm(code: string): AlgoType {
  const lower = code.toLowerCase().replace(/\s+/g, ' ')
  if (lower.includes('bubblesort') || (lower.includes('bubble') && lower.includes('sort'))) return 'bubbleSort'
  if (lower.includes('selectionsort') || (lower.includes('selection') && lower.includes('sort'))) return 'selectionSort'
  if (lower.includes('insertionsort') || (lower.includes('insertion') && lower.includes('sort'))) return 'insertionSort'
  if (lower.includes('mergesort') || (lower.includes('merge') && lower.includes('sort'))) return 'mergeSort'
  if (lower.includes('quicksort') || (lower.includes('quick') && lower.includes('sort')) || lower.includes('partition')) return 'quickSort'
  if (lower.includes('heapsort') || (lower.includes('heap') && lower.includes('sort')) || lower.includes('heapify')) return 'heapSort'
  if (lower.includes('findmin') || lower.includes('find min') || (lower.includes('minimum') && lower.includes('rotated'))) return 'findMinRotated'
  if ((lower.includes('search') && lower.includes('rotated')) || lower.includes('searchrotated')) return 'searchRotated'
  if (lower.includes('binarysearch') || (lower.includes('binary') && lower.includes('search'))) return 'binarySearch'
  if (lower.includes('linearsearch') || (lower.includes('linear') && lower.includes('search'))) return 'linearSearch'
  if (lower.includes('fibonacci') || lower.includes('fib(')) return 'fibonacci'
  if (lower.includes('factorial') || lower.includes('fact(')) return 'factorial'

  // ─── Trees & BST Problems ──────────────────────────────────────
  if (lower.includes('inverttree') || lower.includes('invert tree') || lower.includes('invert_tree') ||
      (lower.includes('invert') && lower.includes('root'))) return 'invertTree'
  if (lower.includes('maxdepth') || lower.includes('maximum depth') || lower.includes('max_depth') ||
      (lower.includes('depth') && lower.includes('root') && (lower.includes('left') || lower.includes('right')))) return 'maxDepth'
  if (lower.includes('sametree') || lower.includes('same tree') || lower.includes('same_tree') || lower.includes('issametree') ||
      (lower.includes('p') && lower.includes('q') && lower.includes('left') && lower.includes('right') && lower.includes('val'))) return 'sameTree'
  if (lower.includes('levelorder') || lower.includes('level order') || lower.includes('level_order') ||
      (lower.includes('level') && lower.includes('queue') && lower.includes('root'))) return 'levelOrder'
  if (lower.includes('isvalidbst') || lower.includes('validate binary search tree') || lower.includes('validate bst') || lower.includes('validbst') ||
      (lower.includes('min') && lower.includes('max') && lower.includes('bst'))) return 'validateBST'
  if (lower.includes('kthsmallest') || lower.includes('kth smallest') || lower.includes('kth_smallest') ||
      (lower.includes('kth') && lower.includes('bst')) || (lower.includes('k') && lower.includes('inorder') && lower.includes('root'))) return 'kthSmallest'

  if (lower.includes('dijkstra') || lower.includes('shortest path')) return 'dijkstra'
  if (lower.includes('breadth') || lower.includes('bfs(') || (lower.includes('queue') && lower.includes('graph'))) return 'bfs'
  if (lower.includes('depth') || lower.includes('dfs(') || (lower.includes('stack') && lower.includes('graph'))) return 'dfs'
  // ⚠️ twoSum MUST come before hashMap — Two Sum uses new Map() + target which would falsely match hashMap
  if (lower.includes('twosum') || lower.includes('two sum') || lower.includes('two_sum') ||
      (lower.includes('complement') && lower.includes('map')) ||
      (lower.includes('target') && lower.includes('nums') && lower.includes('map'))) return 'twoSum'
  if (lower.includes('threesum') || lower.includes('three sum') || lower.includes('three_sum') ||
      (lower.includes('nums[left]') && lower.includes('nums[right]') && lower.includes('nums[i]'))) return 'threeSum'
  if (lower.includes('trap(') || lower.includes('trapping') ||
      (lower.includes('height') && lower.includes('water') && (lower.includes('leftmax') || lower.includes('rightmax')))) return 'trappingRainWater'
  if (lower.includes('removeduplicates') || lower.includes('remove duplicates') || lower.includes('remove_duplicates') ||
      (lower.includes('nums[fast]') && lower.includes('nums[slow]'))) return 'removeDuplicates'
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
  if (lower.includes('removenthfromend') || lower.includes('remove nth') || lower.includes('remove_nth') ||
      (lower.includes('nth') && lower.includes('end') && lower.includes('next'))) return 'removeNthFromEnd'
  if (lower.includes('reorderlist') || lower.includes('reorder list') || lower.includes('reorder_list')) return 'reorderList'
  if (lower.includes('hascycle') || lower.includes('has cycle') || lower.includes('linked list cycle') ||
      (lower.includes('fast') && lower.includes('slow') && (lower.includes('cycle') || lower.includes('slow === fast') || lower.includes('slow == fast')))) return 'hasCycle'
  if (lower.includes('reverselist') || lower.includes('reverse linked list') ||
      (lower.includes('prev') && lower.includes('curr') && lower.includes('next') && lower.includes('reverse'))) return 'reverseList'
  if (lower.includes('maxsubarray') || lower.includes('maximum subarray') || lower.includes('max_subarray')) return 'maxSubArray'
  if (lower.includes('maxprofit') || lower.includes('best time to buy') || lower.includes('max_profit')) return 'maxProfit'
  if (lower.includes('containsduplicate') || lower.includes('contains duplicate') || lower.includes('contains_duplicate')) return 'containsDuplicate'
  if (lower.includes('climbstairs') || lower.includes('climbing stairs') || lower.includes('climb_stairs')) return 'climbStairs'
  // ─── Graph & Matrix Problems (must check maxAreaOfIsland before maxArea) ───
  if (lower.includes('maxareaofisland') || lower.includes('max area of island') || lower.includes('max_area_of_island')) return 'maxAreaOfIsland'
  if (lower.includes('numislands') || lower.includes('number of islands') || lower.includes('num_islands')) return 'numIslands'
  if (lower.includes('clonegraph') || lower.includes('clone graph') || lower.includes('clone_graph')) return 'cloneGraph'
  if (lower.includes('canfinish') || lower.includes('courseschedule') || lower.includes('course schedule') || lower.includes('course_schedule')) return 'courseSchedule'
  if (lower.includes('orangesrotting') || lower.includes('rottingoranges') || lower.includes('rotting oranges') || lower.includes('rotting_oranges')) return 'rottingOranges'
  if (lower.includes('pacificatlantic') || lower.includes('pacific atlantic') || lower.includes('pacific_atlantic')) return 'pacificAtlantic'
  if (lower.includes('spiralorder') || lower.includes('spiralmatrix') || lower.includes('spiral matrix') || lower.includes('spiral_matrix')) return 'spiralMatrix'
  if (lower.includes('setzeroes') || lower.includes('setmatrixzeroes') || lower.includes('set matrix zeroes') || lower.includes('set_matrix_zeroes')) return 'setMatrixZeroes'
  if (lower.includes('maxarea') || lower.includes('most water') || lower.includes('max_area')) return 'maxArea'
  if (lower.includes('searchinsert') || lower.includes('search insert') || lower.includes('search_insert')) return 'searchInsert'
  if (lower.includes('longestsubstring') || lower.includes('longest substring') || lower.includes('longest_substring') ||
      lower.includes('longestsubarray') || lower.includes('lengthoflongestsubstring') ||
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
  if (lower.includes('dailytemperatures') || lower.includes('daily temperatures') || lower.includes('daily_temperatures') ||
      (lower.includes('temperatures') && (lower.includes('stack') || lower.includes('warmer')))) return 'dailyTemperatures'
  if (lower.includes('minstack') || lower.includes('min stack') || lower.includes('min_stack') ||
      (lower.includes('getmin') && (lower.includes('stack') || lower.includes('push')))) return 'minStack'
  if (lower.includes('houserobber') || lower.includes('house robber') || lower.includes('house_robber') ||
      lower.includes('function rob(') || (lower.includes('nums') && lower.includes('prev1') && lower.includes('prev2'))) return 'houseRobber'
  if (lower.includes('coinchange') || lower.includes('coin change') || lower.includes('coin_change') ||
      (lower.includes('coins') && lower.includes('amount') && (lower.includes('dp') || lower.includes('math.min')))) return 'coinChange'
  if (lower.includes('lengthoflis') || lower.includes('longest increasing') || lower.includes('longestincreasing') || (lower.includes('lis') && lower.includes('subsequence')) ||
      (lower.includes('nums[j] < nums[i]') && lower.includes('dp['))) return 'lengthOfLIS'

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
  const validation = validateNumberArray(arr)
  if (!validation.valid) return [createErrorStep(validation.error)]

  const steps: ExecutionStep[] = []
  // Stable IDs: each element carries its original slot so Framer Motion
  // can animate the physical swap (not just value teleportation).
  const a = arr.map((v, i) => ({ id: `bs${i}-${v}`, value: v }))
  const n = a.length
  let comps = 0, swaps = 0

  const sortedHL = (firstSorted: number): Record<number, DSANode['highlight']> => {
    const h: Record<number, DSANode['highlight']> = {}
    for (let k = firstSorted; k < n; k++) h[k] = 'sorted'
    return h
  }

  const snap = (
    line: number, desc: string,
    hl: Record<number, DSANode['highlight']>,
    changed?: string, iPtr?: number, jPtr?: number
  ): ExecutionStep => ({
    line, description: desc,
    variables: [
      { name: 'arr', value: a.map(el => el.value), type: 'Array', scope: 'bubbleSort', changed: changed === 'arr' },
      { name: 'n', value: n, type: 'number', scope: 'bubbleSort' },
      { name: 'comparisons', value: comps, type: 'number', scope: 'bubbleSort', changed: changed === 'comps' },
      { name: 'swaps', value: swaps, type: 'number', scope: 'bubbleSort', changed: changed === 'swaps' },
    ],
    callStack: [makeFrame('main', line, []), makeFrame('bubbleSort', line, [], true)],
    heap: [], output: '',
    dsaState: {
      type: 'array',
      nodes: a.map((el, i) => ({ id: el.id, value: el.value, highlight: hl[i] || 'none' })),
      comparisons: comps, swaps, message: desc,
      pointer: iPtr, pointerName: 'i',
      pointer2: jPtr, pointer2Name: 'j',
      auxiliaryData: { isSorting: true, renderAs: 'bars' },
    }
  })

  steps.push(snap(2, '🚀 Bubble Sort: compare adjacent pairs and "bubble" the largest value to the end each pass', {}))

  for (let i = 0; i < n - 1; i++) {
    const sortedBase = sortedHL(n - i)

    steps.push(snap(3, `Pass ${i + 1}/${n - 1}: scanning arr[0..${n - i - 2}], will bubble max to index ${n - i - 1}`,
      sortedBase, undefined, i))

    for (let j = 0; j < n - i - 1; j++) {
      comps++
      const hCompare: Record<number, DSANode['highlight']> = {
        ...sortedBase, [j]: 'comparing', [j + 1]: 'comparing'
      }
      steps.push(snap(4, `🔍 Compare arr[${j}]=${a[j].value} vs arr[${j + 1}]=${a[j + 1].value}`,
        hCompare, 'comps', i, j))

      if (a[j].value > a[j + 1].value) {
        swaps++
        const hSwap: Record<number, DSANode['highlight']> = {
          ...sortedBase, [j]: 'swapping', [j + 1]: 'swapping'
        }
        steps.push(snap(6,
          `🔄 Swap! ${a[j].value} > ${a[j + 1].value} → swap arr[${j}] and arr[${j + 1}]`,
          hSwap, 'swaps', i, j))
        ;[a[j], a[j + 1]] = [a[j + 1], a[j]]
        steps.push(snap(6,
          `✅ After swap: arr[${j}]=${a[j].value}, arr[${j + 1}]=${a[j + 1].value} — larger value moved right`,
          { ...sortedBase, [j]: 'active', [j + 1]: 'active' }, 'arr', i, j))
      } else {
        steps.push(snap(5,
          `⏭ No swap: ${a[j].value} ≤ ${a[j + 1].value} → already in order, move pointer right`,
          { ...sortedBase, [j]: 'visited', [j + 1]: 'none' }, undefined, i, j))
      }
    }

    const hPassDone = sortedHL(n - i - 1)
    steps.push(snap(3,
      `Pass ${i + 1} done → arr[${n - i - 1}]=${a[n - i - 1].value} is in its FINAL sorted position ✅`,
      hPassDone, undefined, i))
  }

  const hAll: Record<number, DSANode['highlight']> = {}
  a.forEach((_, i) => { hAll[i] = 'found' })
  steps.push(snap(10, `✅ Bubble Sort complete! [${a.map(el => el.value).join(', ')}] | ${comps} comparisons, ${swaps} swaps`, hAll, 'arr'))
  return steps
}

export function genSelectionSort(arr: number[]): ExecutionStep[] {
  const validation = validateNumberArray(arr)
  if (!validation.valid) return [createErrorStep(validation.error)]

  const steps: ExecutionStep[] = []
  const a = arr.map((v, i) => ({ id: `ss${i}-${v}`, value: v }))
  const n = a.length
  let comps = 0, swaps = 0

  const snap = (
    line: number, desc: string,
    hl: Record<number, DSANode['highlight']>,
    iPtr?: number, jPtr?: number
  ): ExecutionStep => ({
    line, description: desc,
    variables: [
      { name: 'arr', value: a.map(el => el.value), type: 'Array', scope: 'selectionSort' },
      { name: 'comparisons', value: comps, type: 'number', scope: 'selectionSort' },
      { name: 'swaps', value: swaps, type: 'number', scope: 'selectionSort' },
    ],
    callStack: [makeFrame('main', line, []), makeFrame('selectionSort', line, [], true)],
    heap: [], output: '',
    dsaState: {
      type: 'array',
      nodes: a.map((el, i) => ({ id: el.id, value: el.value, highlight: hl[i] || 'none' })),
      comparisons: comps, swaps, message: desc,
      pointer: iPtr, pointerName: 'i',
      pointer2: jPtr, pointer2Name: 'j',
      auxiliaryData: { isSorting: true, renderAs: 'bars' },
    }
  })

  steps.push(snap(1, '🚀 Selection Sort: scan for the minimum each pass and place it at the start of unsorted region', {}))

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i
    const sortedBase: Record<number, DSANode['highlight']> = {}
    for (let k = 0; k < i; k++) sortedBase[k] = 'sorted'

    steps.push(snap(3,
      `Pass ${i + 1}: find minimum in arr[${i}..${n - 1}]. Assume arr[${i}]=${a[i].value} is min for now`,
      { ...sortedBase, [i]: 'active' }, i))

    for (let j = i + 1; j < n; j++) {
      comps++
      const hCompare: Record<number, DSANode['highlight']> = {
        ...sortedBase, [minIdx]: 'comparing', [j]: 'comparing'
      }
      steps.push(snap(5,
        `🔍 Compare arr[${j}]=${a[j].value} with current min arr[${minIdx}]=${a[minIdx].value}`,
        hCompare, i, j))

      if (a[j].value < a[minIdx].value) {
        minIdx = j
        steps.push(snap(6,
          `✅ New minimum! arr[${j}]=${a[j].value} < ${a[minIdx].value} → update minIdx = ${j}`,
          { ...sortedBase, [minIdx]: 'active' }, i, j))
      } else {
        steps.push(snap(6,
          `⏭ arr[${j}]=${a[j].value} ≥ current min=${a[minIdx].value} → no change, minIdx stays ${minIdx}`,
          { ...sortedBase, [minIdx]: 'active' }, i, j))
      }
    }

    if (minIdx !== i) {
      swaps++
      const hSwap: Record<number, DSANode['highlight']> = {
        ...sortedBase, [i]: 'swapping', [minIdx]: 'swapping'
      }
      steps.push(snap(9,
        `🔄 Swap arr[${i}]=${a[i].value} ↔ arr[${minIdx}]=${a[minIdx].value} — minimum goes to position ${i}`,
        hSwap, i))
      ;[a[i], a[minIdx]] = [a[minIdx], a[i]]
      steps.push(snap(9,
        `✅ After swap → arr[${i}]=${a[i].value} is now in its FINAL sorted position`,
        { ...sortedBase, [i]: 'sorted' }, i))
    } else {
      steps.push(snap(9,
        `ℹ️ arr[${i}]=${a[i].value} is already the minimum — no swap needed, it's in place ✅`,
        { ...sortedBase, [i]: 'sorted' }, i))
    }
  }

  const hAll: Record<number, DSANode['highlight']> = {}
  a.forEach((_, i) => { hAll[i] = 'found' })
  steps.push(snap(12,
    `✅ Selection Sort complete! [${a.map(el => el.value).join(', ')}] | ${comps} comparisons, ${swaps} swaps`,
    hAll))
  return steps
}

export function genInsertionSort(arr: number[]): ExecutionStep[] {
  const validation = validateNumberArray(arr)
  if (!validation.valid) return [createErrorStep(validation.error)]

  const steps: ExecutionStep[] = []
  const a = arr.map((v, i) => ({ id: `is${i}-${v}`, value: v }))
  const n = a.length
  let comps = 0, shifts = 0

  const snap = (
    line: number, desc: string,
    hl: Record<number, DSANode['highlight']>,
    iPtr?: number, jPtr?: number
  ): ExecutionStep => ({
    line, description: desc,
    variables: [
      { name: 'arr', value: a.map(el => el.value), type: 'Array', scope: 'insertionSort' },
      { name: 'comparisons', value: comps, type: 'number', scope: 'insertionSort' },
      { name: 'shifts', value: shifts, type: 'number', scope: 'insertionSort' },
    ],
    callStack: [makeFrame('main', line, []), makeFrame('insertionSort', line, [], true)],
    heap: [], output: '',
    dsaState: {
      type: 'array',
      nodes: a.map((el, i) => ({ id: el.id, value: el.value, highlight: hl[i] || 'none' })),
      comparisons: comps, swaps: shifts, message: desc,
      pointer: iPtr, pointerName: 'i',
      pointer2: jPtr, pointer2Name: 'j',
      auxiliaryData: { isSorting: true, renderAs: 'bars' },
    }
  })

  steps.push(snap(1, '🚀 Insertion Sort: grow the sorted portion left-to-right by inserting each element at the right place', { 0: 'sorted' }))

  for (let i = 1; i < n; i++) {
    const keyId = a[i].id
    const keyVal = a[i].value

    const hlPick: Record<number, DSANode['highlight']> = {}
    for (let k = 0; k < i; k++) hlPick[k] = 'sorted'
    hlPick[i] = 'active'

    steps.push(snap(3,
      `Pick key = arr[${i}] = ${keyVal}. Sorted portion so far: arr[0..${i - 1}]`,
      hlPick, i))

    let j = i - 1
    let didShift = false

    while (j >= 0) {
      comps++
      const hlCmp: Record<number, DSANode['highlight']> = {}
      for (let k = 0; k < i; k++) hlCmp[k] = 'sorted'
      hlCmp[j] = 'comparing'
      hlCmp[j + 1] = 'active'

      if (a[j].value > keyVal) {
        shifts++
        steps.push(snap(5,
          `🔍 arr[${j}]=${a[j].value} > key=${keyVal} → shift arr[${j}] right to make room`,
          { ...hlCmp, [j + 1]: 'swapping' }, i, j))
        a[j + 1] = a[j]
        steps.push(snap(5,
          `↪ Shifted ${a[j + 1].value} from index ${j} → ${j + 1}`,
          { ...hlCmp, [j + 1]: 'swapping' }, i, j))
        j--
        didShift = true
      } else {
        steps.push(snap(6,
          `✅ arr[${j}]=${a[j].value} ≤ key=${keyVal} → found insertion point at index ${j + 1}`,
          { ...hlCmp, [j]: 'visited', [j + 1]: 'active' }, i, j))
        break
      }
    }

    a[j + 1] = { id: keyId, value: keyVal }
    const hlInsert: Record<number, DSANode['highlight']> = {}
    for (let k = 0; k <= i; k++) hlInsert[k] = 'sorted'
    hlInsert[j + 1] = 'found'

    steps.push(snap(7,
      didShift
        ? `📌 Insert key=${keyVal} at index ${j + 1} — sorted portion now arr[0..${i}]`
        : `📌 key=${keyVal} already in correct spot at index ${i} — no shifts needed ✅`,
      hlInsert, i))
  }

  const hAll: Record<number, DSANode['highlight']> = {}
  a.forEach((_, i) => { hAll[i] = 'found' })
  steps.push(snap(10,
    `✅ Insertion Sort complete! [${a.map(el => el.value).join(', ')}] | ${comps} comparisons, ${shifts} shifts`,
    hAll))
  return steps
}

export function genMergeSort(arr: number[]): ExecutionStep[] {
  const validation = validateNumberArray(arr)
  if (!validation.valid) return [createErrorStep(validation.error)]

  const steps: ExecutionStep[] = []
  // items carries stable {id, value} pairs through all splits and merges
  const items = arr.map((v, i) => ({ id: `ms${i}-${v}`, value: v }))
  let comps = 0, swaps = 0

  const snap = (
    desc: string,
    currentItems: typeof items,
    hl: Record<number, DSANode['highlight']>,
    range?: { start: number; end: number },
    p1?: { idx?: number; name?: string },
    p2?: { idx?: number; name?: string },
    p3?: { idx?: number; name?: string }
  ): ExecutionStep => ({
    line: 1, description: desc,
    variables: [
      { name: 'arr', value: currentItems.map(el => el.value), type: 'Array', scope: 'mergeSort' },
      { name: 'comparisons', value: comps, type: 'number', scope: 'mergeSort' },
      { name: 'swaps', value: swaps, type: 'number', scope: 'mergeSort' },
    ],
    callStack: [makeFrame('main', 1, []), makeFrame('mergeSort', 1, [], true)],
    heap: [], output: '',
    dsaState: {
      type: 'array',
      nodes: currentItems.map((el, i) => ({ id: el.id, value: el.value, highlight: hl[i] || 'none' })),
      comparisons: comps,
      swaps,
      rangeStart: range?.start,
      rangeEnd: range?.end,
      pointer: p1?.idx,
      pointerName: p1?.name,
      pointer2: p2?.idx,
      pointer2Name: p2?.name,
      pointer3: p3?.idx,
      pointer3Name: p3?.name,
      auxiliaryData: { isSorting: true, renderAs: 'bars' },
      message: desc,
    }
  })

  steps.push(snap('🚀 Merge Sort on [' + arr.join(', ') + '] — DIVIDE until single elements, then MERGE back in sorted order', items, {}, { start: 0, end: items.length - 1 }))

  function mergeHelper(left: number, right: number): void {
    if (left >= right) {
      steps.push(snap(
        `📌 Single element arr[${left}]=${items[left].value} — a single element is always sorted by definition`,
        items, { [left]: 'sorted' }, { start: left, end: right }, { idx: left, name: 'curr' }))
      return
    }
    const mid = Math.floor((left + right) / 2)
    const hDiv: Record<number, DSANode['highlight']> = {}
    for (let i = left; i <= mid; i++) hDiv[i] = 'comparing'
    for (let i = mid + 1; i <= right; i++) hDiv[i] = 'active'

    steps.push(snap(
      `✂️ DIVIDE arr[${left}..${right}] → LEFT: arr[${left}..${mid}] | RIGHT: arr[${mid + 1}..${right}]`,
      items, hDiv, { start: left, end: right }, { idx: left, name: 'L' }, { idx: right, name: 'R' }, { idx: mid, name: 'mid' }))

    mergeHelper(left, mid)
    mergeHelper(mid + 1, right)

    // Merge the two sorted halves
    const L = items.slice(left, mid + 1)
    const R = items.slice(mid + 1, right + 1)
    let i = 0, j = 0, k = left

    const hMerge: Record<number, DSANode['highlight']> = {}
    for (let x = left; x <= right; x++) hMerge[x] = 'active'
    steps.push(snap(
      `🔀 MERGE: L=[${L.map(el => el.value).join(',')}] and R=[${R.map(el => el.value).join(',')}] → compare smallest of each`,
      items, hMerge, { start: left, end: right }, { idx: left, name: 'L' }, { idx: mid + 1, name: 'R' }, { idx: k, name: 'k' }))

    while (i < L.length && j < R.length) {
      comps++
      const hCmp: Record<number, DSANode['highlight']> = {}
      for (let x = left; x < k; x++) hCmp[x] = 'visited'
      for (let x = k; x <= right; x++) hCmp[x] = 'active'

      const leftIdx = left + i
      const rightIdx = mid + 1 + j

      if (L[i].value <= R[j].value) {
        steps.push(snap(
          `🔍 L[${i}]=${L[i].value} ≤ R[${j}]=${R[j].value} → take from LEFT, place at index ${k}`,
          items, { ...hCmp, [leftIdx]: 'comparing', [rightIdx]: 'comparing' },
          { start: left, end: right }, { idx: leftIdx, name: 'L' }, { idx: rightIdx, name: 'R' }, { idx: k, name: 'k' }))
        items[k] = L[i++]
        swaps++
        steps.push(snap(
          `↙ Placed ${items[k].value} at index ${k}`,
          items, { ...hCmp, [k]: 'sorted' },
          { start: left, end: right }, { idx: left + i, name: 'L' }, { idx: rightIdx, name: 'R' }, { idx: k, name: 'k' }))
      } else {
        steps.push(snap(
          `🔍 R[${j}]=${R[j].value} < L[${i}]=${L[i].value} → take from RIGHT, place at index ${k}`,
          items, { ...hCmp, [leftIdx]: 'comparing', [rightIdx]: 'comparing' },
          { start: left, end: right }, { idx: leftIdx, name: 'L' }, { idx: rightIdx, name: 'R' }, { idx: k, name: 'k' }))
        items[k] = R[j++]
        swaps++
        steps.push(snap(
          `↘ Placed ${items[k].value} at index ${k}`,
          items, { ...hCmp, [k]: 'sorted' },
          { start: left, end: right }, { idx: leftIdx, name: 'L' }, { idx: mid + 1 + j, name: 'R' }, { idx: k, name: 'k' }))
      }
      k++
    }
    while (i < L.length) { items[k++] = L[i++]; swaps++; }
    while (j < R.length) { items[k++] = R[j++]; swaps++; }

    const hDone: Record<number, DSANode['highlight']> = {}
    for (let x = left; x <= right; x++) hDone[x] = 'sorted'
    steps.push(snap(
      `✅ Merged arr[${left}..${right}] = [${items.slice(left, right + 1).map(el => el.value).join(', ')}] — this range is sorted`,
      items, hDone, { start: left, end: right }))
  }

  mergeHelper(0, items.length - 1)

  const hAll: Record<number, DSANode['highlight']> = {}
  items.forEach((_, i) => { hAll[i] = 'found' })
  steps.push(snap(`✅ Merge Sort complete! [${items.map(el => el.value).join(', ')}] | ${comps} comparisons, ${swaps} placements`, items, hAll))
  return steps
}

export function genQuickSort(arr: number[]): ExecutionStep[] {
  const validation = validateNumberArray(arr)
  if (!validation.valid) return [createErrorStep(validation.error)]

  const steps: ExecutionStep[] = []
  const a = arr.map((v, i) => ({ id: `qs${i}-${v}`, value: v }))
  const n = a.length
  let comps = 0, swaps = 0

  const snap = (
    desc: string,
    hl: Record<number, DSANode['highlight']>,
    pivot?: number,
    iPtr?: number,
    jPtr?: number,
    range?: { start: number; end: number }
  ): ExecutionStep => ({
    line: 1, description: desc,
    variables: [
      { name: 'arr', value: a.map(el => el.value), type: 'Array', scope: 'quickSort' },
      { name: 'pivot', value: pivot !== undefined ? a[pivot].value : '—', type: 'number', scope: 'quickSort' },
      { name: 'comparisons', value: comps, type: 'number', scope: 'quickSort' },
      { name: 'swaps', value: swaps, type: 'number', scope: 'quickSort' },
    ],
    callStack: [makeFrame('main', 1, []), makeFrame('quickSort', 1, [], true)],
    heap: [], output: '',
    dsaState: {
      type: 'array',
      nodes: a.map((el, i) => ({ id: el.id, value: el.value, highlight: hl[i] || 'none' })),
      comparisons: comps,
      swaps,
      pivotIndex: pivot,
      pointer: jPtr,
      pointerName: 'j',
      pointer2: iPtr !== undefined && iPtr >= 0 ? iPtr : undefined,
      pointer2Name: 'i',
      rangeStart: range?.start,
      rangeEnd: range?.end,
      auxiliaryData: { isSorting: true, renderAs: 'bars' },
      message: desc,
    }
  })

  function partition(low: number, high: number): number {
    const pivotVal = a[high].value
    const ph: Record<number, DSANode['highlight']> = { [high]: 'pivot' as DSANode['highlight'] }

    steps.push(snap(
      `🎯 Pivot = arr[${high}]=${pivotVal}. Elements ≤ ${pivotVal} go LEFT, elements > ${pivotVal} go RIGHT`,
      ph, high, undefined, undefined, { start: low, end: high }))

    let i = low - 1
    for (let j = low; j < high; j++) {
      comps++
      const hCmp: Record<number, DSANode['highlight']> = { ...ph, [j]: 'comparing' }
      if (i >= low) hCmp[i] = 'active'
      steps.push(snap(
        `🔍 Compare arr[${j}]=${a[j].value} with pivot ${pivotVal}`,
        hCmp, high, i, j, { start: low, end: high }))

      if (a[j].value <= pivotVal) {
        i++
        if (i !== j) {
          swaps++
          const hSwap: Record<number, DSANode['highlight']> = {
            ...ph, [i]: 'swapping', [j]: 'swapping'
          }
          steps.push(snap(
            `🔄 arr[${j}]=${a[j].value} ≤ pivot → swap arr[${i}] and arr[${j}] (move into left partition)`,
            hSwap, high, i, j, { start: low, end: high }))
          ;[a[i], a[j]] = [a[j], a[i]]
          steps.push(snap(
            `✅ Swapped → arr[${i}]=${a[i].value} now in left partition`,
            { ...ph, [i]: 'visited', [j]: 'none' }, high, i, j, { start: low, end: high }))
        } else {
          steps.push(snap(
            `↩ arr[${j}]=${a[j].value} ≤ pivot and already at boundary → no swap needed (i=j=${i})`,
            { ...ph, [j]: 'visited' }, high, i, j, { start: low, end: high }))
        }
      } else {
        steps.push(snap(
          `⏭ arr[${j}]=${a[j].value} > pivot ${pivotVal} → stays in right partition, no move`,
          { ...ph, [j]: 'none' }, high, i, j, { start: low, end: high }))
      }
    }

    swaps++
    const hFinal: Record<number, DSANode['highlight']> = { [i + 1]: 'found' }
    steps.push(snap(
      `📌 Place pivot ${pivotVal} at index ${i + 1} — this is its FINAL correct position!`,
      { [high]: 'swapping', [i + 1]: 'swapping' }, high, i, high, { start: low, end: high }))
    ;[a[i + 1], a[high]] = [a[high], a[i + 1]]
    steps.push(snap(
      `✅ Pivot ${pivotVal} placed at index ${i + 1} — everything left is ≤ ${pivotVal}, everything right is >`,
      hFinal, i + 1, undefined, undefined, { start: low, end: high }))
    return i + 1
  }

  function quickHelper(low: number, high: number): void {
    if (low >= high) {
      if (low === high)
        steps.push(snap(`📌 arr[${low}]=${a[low].value} is alone in its partition → already sorted`, { [low]: 'sorted' }, undefined, undefined, undefined, { start: low, end: high }))
      return
    }
    const hRange: Record<number, DSANode['highlight']> = {}
    for (let i = low; i <= high; i++) hRange[i] = 'active'
    steps.push(snap(
      `🔀 QuickSort range arr[${low}..${high}] = [${a.slice(low, high + 1).map(el => el.value).join(', ')}]`,
      hRange, undefined, undefined, undefined, { start: low, end: high }))

    const pi = partition(low, high)
    quickHelper(low, pi - 1)
    quickHelper(pi + 1, high)
  }

  steps.push(snap('🚀 Quick Sort — pick a pivot, partition around it, then recursively sort each side', {}, undefined, undefined, undefined, { start: 0, end: n - 1 }))
  quickHelper(0, n - 1)

  const hAll: Record<number, DSANode['highlight']> = {}
  a.forEach((_, i) => { hAll[i] = 'found' })
  steps.push(snap(`✅ Quick Sort complete! [${a.map(el => el.value).join(', ')}] | ${comps} comparisons, ${swaps} swaps`, hAll))
  return steps
}

// ─── SEARCHING ──────────────────────────────────────────────────────────────

export function genBinarySearch(arr: number[], target: number): ExecutionStep[] {
  const validation = validateBinarySearchInput(arr, target)
  if (!validation.valid) return [createErrorStep(validation.error)]

  const steps: ExecutionStep[] = []
  let left = 0, right = arr.length - 1, comps = 0

  const snap = (
    desc: string, l: number, r: number, mid: number | null, found: boolean
  ): ExecutionStep => ({
    line: 1, description: desc,
    variables: [
      { name: 'left', value: l, type: 'number', scope: 'binarySearch', changed: true },
      { name: 'right', value: r, type: 'number', scope: 'binarySearch', changed: true },
      { name: 'mid', value: mid ?? '—', type: 'number', scope: 'binarySearch' },
      { name: 'target', value: target, type: 'number', scope: 'binarySearch' },
      { name: 'comparisons', value: comps, type: 'number', scope: 'binarySearch' },
    ],
    callStack: [makeFrame('main', 1, []), makeFrame('binarySearch', 1, [], true)],
    heap: [], output: found && mid !== null ? String(mid) : '',
    dsaState: {
      type: 'array',
      nodes: arr.map((v, i) => {
        const isEliminated = i < l || i > r
        const isMid = mid !== null && i === mid
        let highlight: DSANode['highlight'] = 'none'
        if (isEliminated) {
          highlight = 'skipped'
        } else if (isMid) {
          highlight = found ? 'found' : 'comparing'
        } else if (i >= l && i <= r) {
          highlight = 'active'
        }
        return {
          id: `bn${i}`,
          value: v,
          highlight,
        }
      }),
      comparisons: comps,
      rangeStart: l,
      rangeEnd: r,
      pointer: mid !== null ? mid : undefined,
      pointerName: 'mid',
      pointer2: l >= 0 && l < arr.length ? l : undefined,
      pointer2Name: 'L',
      pointer3: r >= 0 && r < arr.length ? r : undefined,
      pointer3Name: 'R',
      auxiliaryData: {
        isSearch: true,
        renderAs: 'boxes',
        target,
        trackingVars: {
          target,
          left: l,
          right: r,
          mid: mid !== null ? mid : '—',
          'arr[mid]': mid !== null && arr[mid] !== undefined ? arr[mid] : '—',
        }
      },
      message: desc,
    }
  })

  steps.push(snap(`🚀 Binary Search for target=${target} in sorted array [${arr.join(', ')}]`, left, right, null, false))
  steps.push(snap('💡 KEY INSIGHT: Works ONLY on sorted arrays! Each step eliminates HALF the remaining elements → O(log n)', left, right, null, false))

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    comps++
    steps.push(snap(
      `🔍 Search range [${left}..${right}] → mid=((${left}+${right})÷2)=${mid}, arr[mid]=${arr[mid]}`,
      left, right, mid, false))

    if (arr[mid] === target) {
      steps.push(snap(`🎉 arr[${mid}]=${arr[mid]} === target=${target} → FOUND at index ${mid}! ✅`,
        left, right, mid, true))
      return steps
    } else if (arr[mid] < target) {
      steps.push(snap(
        `➡ arr[mid]=${arr[mid]} < target=${target} → target must be in RIGHT half → set left = ${mid + 1} (eliminate left half)`,
        left, right, mid, false))
      left = mid + 1
    } else {
      steps.push(snap(
        `⬅ arr[mid]=${arr[mid]} > target=${target} → target must be in LEFT half → set right = ${mid - 1} (eliminate right half)`,
        left, right, mid, false))
      right = mid - 1
    }
  }
  steps.push(snap(`❌ left(${left}) > right(${right}) — search space empty. target ${target} is NOT in this array.`,
    left, right, null, false))
  return steps
}

export function genLinearSearch(arr: number[], target: number): ExecutionStep[] {
  const validation = validateBinarySearchInput(arr, target)
  if (!validation.valid) return [createErrorStep(validation.error)]

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
    heap: [], output: found && idx >= 0 ? String(idx) : '',
    dsaState: {
      type: 'array',
      nodes: arr.map((v, i) => ({
        id: `ln${i}`, value: v,
        highlight: i < idx ? 'visited' : i === idx ? (found ? 'found' : 'comparing') : 'none'
      })),
      comparisons: comps,
      pointer: idx >= 0 && idx < arr.length ? idx : undefined,
      pointerName: idx >= 0 && idx < arr.length ? 'i' : undefined,
      auxiliaryData: {
        isSearch: true,
        renderAs: 'boxes',
        target,
        trackingVars: {
          target,
          i: idx >= 0 && idx < arr.length ? idx : '—',
          'arr[i]': idx >= 0 && idx < arr.length ? arr[idx] : '—',
        }
      },
      message: desc,
    }
  })

  steps.push(snap(`🚀 Linear Search for target=${target} — scan left to right, checking every element (O(n))`, -1, false))

  for (let i = 0; i < arr.length; i++) {
    comps++
    const isMatch = arr[i] === target
    steps.push(snap(
      isMatch
        ? `🎉 arr[${i}]=${arr[i]} === target=${target} → FOUND!`
        : `🔍 arr[${i}]=${arr[i]} ≠ target=${target} → not a match, move to next`,
      i, isMatch))
    if (isMatch) {
      steps.push(snap(`✅ Found target=${target} at index ${i} after ${comps} comparison${comps === 1 ? '' : 's'}!`, i, true))
      return steps
    }
  }
  steps.push(snap(`❌ Checked all ${arr.length} elements — target ${target} is NOT in the array (took ${comps} comparisons)`, arr.length, false))
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
    const rawNodes: DSANode[] = Array.from(treeNodes.values()).map(n => ({
      id: n.id,
      value: n.value,
      left: n.left,
      right: n.right,
    }))
    return computeTreeLayout(rawNodes, edges, { width: 620, height: 380 }).nodes
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
    ht?: Record<string, unknown>,
    ptr?: number,
    ptrName?: string,
    ptr2?: number,
    ptr2Name?: string
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
      pointer: ptr,
      pointerName: ptrName,
      pointer2: ptr2,
      pointer2Name: ptr2Name,
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
    ], '', {}, 0, 'i'))

  for (let i = 0; i < nums.length; i++) {

    // LINE 3 — loop condition i < nums.length
    steps.push(step(3,
      `Loop condition:  i(${i}) < nums.length(${nums.length})  →  ` + (i < nums.length ? '✅ true → enter loop body' : ''),
      { [i]: 'active' },
      [...baseVars(),
        { name: 'map', value: Object.fromEntries(map), type: 'Map', scope: 'twoSum' },
        { name: 'i', value: i, type: 'number', scope: 'twoSum', changed: true },
      ], '', undefined, i, 'i'))

    const complement = target - nums[i]

    // LINE 4 — const complement = target - nums[i]
    steps.push(step(4,
      `const complement = target − nums[${i}]  →  ${target} − ${nums[i]} = ${complement}`,
      { [i]: 'active' },
      [...baseVars(),
        { name: 'map', value: Object.fromEntries(map), type: 'Map', scope: 'twoSum' },
        { name: 'i', value: i, type: 'number', scope: 'twoSum' },
        { name: 'complement', value: complement, type: 'number', scope: 'twoSum', changed: true },
      ], '', undefined, i, 'i'))

    const found = map.has(complement)
    const foundIdx = found ? map.get(complement)! : undefined

    // LINE 5 — if (map.has(complement))
    steps.push(step(5,
      `if (map.has(${complement}))  →  ${found ? `✅ YES! index ${foundIdx} has value ${complement}` : `❌ no — ${complement} is not in map yet`}`,
      found ? { [i]: 'comparing', [foundIdx!]: 'comparing' } : { [i]: 'active' },
      [...baseVars(),
        { name: 'map', value: Object.fromEntries(map), type: 'Map', scope: 'twoSum' },
        { name: 'i', value: i, type: 'number', scope: 'twoSum' },
        { name: 'complement', value: complement, type: 'number', scope: 'twoSum' },
        { name: 'map.has(complement)', value: found, type: 'boolean', scope: 'twoSum', changed: true },
      ], '', undefined, i, 'i', foundIdx, found ? 'complement' : undefined))

    if (found && foundIdx !== undefined) {
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
        `[${foundIdx}, ${i}]`,
        undefined,
        i, 'i', foundIdx, 'complement'))

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
          pointer: i,
          pointerName: 'i',
          pointer2: foundIdx,
          pointer2Name: 'complement',
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
          pointer: i,
          pointerName: 'i',
          pointer2: foundIdx,
          pointer2Name: 'complement',
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
      ], '', undefined, i, 'i'))

    map.set(nums[i], i)

    // LINE 8 continued — show map after update
    steps.push(step(8,
      `map updated  →  { ${[...map.entries()].map(([k, v]) => `${k} → index${v}`).join(',  ')} }`,
      { [i]: 'visited' },
      [...baseVars(),
        { name: 'map', value: Object.fromEntries(map), type: 'Map', scope: 'twoSum', changed: true },
        { name: 'i', value: i, type: 'number', scope: 'twoSum' },
      ], '', undefined, i, 'i'))

    // LINE 3 — i++  (loop increment)
    steps.push(step(3,
      `i++  →  i = ${i + 1}  (advance to next element)`,
      Object.fromEntries(nums.map((_, j) => [j, j <= i ? 'visited' : 'none'] as [number, DSANode['highlight']])),
      [...baseVars(),
        { name: 'map', value: Object.fromEntries(map), type: 'Map', scope: 'twoSum' },
        { name: 'i', value: i + 1, type: 'number', scope: 'twoSum', changed: true },
      ], '', undefined, i + 1, 'i'))
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
  const chars = s.split('').map((c, i) => ({ id: `c${i}`, val: c }))
  let left = 0, right = chars.length - 1

  const snap = (desc: string, l: number, r: number): ExecutionStep => ({
    line: 1, description: desc,
    variables: [{ name: 'str', value: chars.map(c => c.val).join(''), type: 'string', scope: 'reverse', changed: true }, { name: 'left', value: l, type: 'number', scope: 'reverse' }, { name: 'right', value: r, type: 'number', scope: 'reverse' }],
    callStack: [makeFrame('reverseString', 1, [], true)], heap: [], output: '',
    dsaState: {
      type: 'string',
      nodes: chars.map((c, i) => ({ id: c.id, value: c.val, highlight: i === l ? 'comparing' : i === r ? 'comparing' : i < l || i > r ? 'found' : 'none' })),
      pointer: l, pointerName: 'l', pointer2: r, pointer2Name: 'r', message: desc
    }
  })

  steps.push(snap(`Reverse "${s}" using two pointers`, left, right))
  while (left < right) {
    steps.push(snap(`Swap chars[${left}]='${chars[left].val}' ↔ chars[${right}]='${chars[right].val}'`, left, right));
    [chars[left], chars[right]] = [chars[right], chars[left]]
    steps.push(snap(`After swap: "${chars.map(c => c.val).join('')}"`, left, right))
    left++; right--
  }
  steps.push(snap(`✅ Reversed: "${chars.map(c => c.val).join('')}"`, left, right))
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
  
  const l1 = list1.length > 0 ? list1 : [1, 2, 4]
  const l2 = list2.length > 0 ? list2 : [1, 3, 4]

  let i = 0, j = 0
  const mergedVals: number[] = []

  const buildMergeState = (
    currI: number, 
    currJ: number, 
    comparingSide: 'none' | 'l1' | 'l2' | 'both',
    stepMsg: string
  ): DSAState => {
    const nodes: DSANode[] = []
    const edges: DSAEdge[] = []

    // 1. List1 row (y = 80)
    l1.forEach((v, idx) => {
      let hl: DSANode['highlight'] = 'none'
      let label: string | undefined = undefined
      if (idx === currI) {
        label = 'list1'
        hl = comparingSide === 'l1' || comparingSide === 'both' ? 'comparing' : 'active'
      } else if (idx < currI) {
        hl = 'visited'
      }
      nodes.push({ id: `l1-${idx}`, value: v, x: idx * 125 + 90, y: 80, highlight: hl, label })
      if (idx < l1.length - 1) {
        edges.push({ id: `e-l1-${idx}`, from: `l1-${idx}`, to: `l1-${idx+1}`, directed: true })
      }
    })

    // 2. List2 row (y = 175)
    l2.forEach((v, idx) => {
      let hl: DSANode['highlight'] = 'none'
      let label: string | undefined = undefined
      if (idx === currJ) {
        label = 'list2'
        hl = comparingSide === 'l2' || comparingSide === 'both' ? 'comparing' : 'active'
      } else if (idx < currJ) {
        hl = 'visited'
      }
      nodes.push({ id: `l2-${idx}`, value: v, x: idx * 125 + 90, y: 175, highlight: hl, label })
      if (idx < l2.length - 1) {
        edges.push({ id: `e-l2-${idx}`, from: `l2-${idx}`, to: `l2-${idx+1}`, directed: true })
      }
    })

    // 3. Merged list row with dummy head (y = 270)
    const dummyNode: DSANode = {
      id: 'dummy',
      value: 0,
      x: 90,
      y: 270,
      highlight: mergedVals.length === 0 ? 'active' : 'none',
      label: mergedVals.length === 0 ? 'dummy, curr' : 'dummy'
    }
    nodes.push(dummyNode)

    let prevMergedId = 'dummy'
    mergedVals.forEach((val, mIdx) => {
      const mId = `m-${mIdx}`
      const isCurr = mIdx === mergedVals.length - 1
      nodes.push({
        id: mId,
        value: val,
        x: (mIdx + 1) * 125 + 90,
        y: 270,
        highlight: isCurr ? 'active' : 'found',
        label: isCurr ? 'curr' : undefined
      })
      edges.push({
        id: `e-m-${mIdx}`,
        from: prevMergedId,
        to: mId,
        directed: true,
        highlight: isCurr
      })
      prevMergedId = mId
    })

    return { type: 'linkedlist', nodes, edges, message: stepMsg }
  }

  // Step 1: Start
  steps.push({
    line: 1,
    description: `mergeTwoLists([${l1.join(', ')}], [${l2.join(', ')}])`,
    variables: [
      { name: 'list1', value: l1[0], type: 'ListNode', scope: 'mergeTwoLists' },
      { name: 'list2', value: l2[0], type: 'ListNode', scope: 'mergeTwoLists' }
    ],
    callStack: [makeFrame('mergeTwoLists', 1, [])],
    heap: [],
    output: '',
    dsaState: buildMergeState(0, 0, 'none', 'Initialize list1, list2, and dummy head')
  })

  // Step 2: Dummy created
  steps.push({
    line: 2,
    description: 'const dummy = new ListNode(0); let curr = dummy;',
    variables: [
      { name: 'dummy', value: 0, type: 'ListNode', scope: 'mergeTwoLists' },
      { name: 'curr', value: 0, type: 'ListNode', scope: 'mergeTwoLists' }
    ],
    callStack: [makeFrame('mergeTwoLists', 2, [])],
    heap: [],
    output: '',
    dsaState: buildMergeState(0, 0, 'none', 'dummy node created; curr points to dummy')
  })

  while (i < l1.length && j < l2.length) {
    // Comparison step
    steps.push({
      line: 4,
      description: `Compare: list1.val (${l1[i]}) ${l1[i] <= l2[j] ? '<=' : '>'} list2.val (${l2[j]})`,
      variables: [
        { name: 'list1.val', value: l1[i], type: 'number', scope: 'mergeTwoLists' },
        { name: 'list2.val', value: l2[j], type: 'number', scope: 'mergeTwoLists' }
      ],
      callStack: [makeFrame('mergeTwoLists', 4, [])],
      heap: [],
      output: '',
      dsaState: buildMergeState(i, j, 'both', `Compare list1 (${l1[i]}) and list2 (${l2[j]})`)
    })

    if (l1[i] <= l2[j]) {
      mergedVals.push(l1[i])
      steps.push({
        line: 5,
        description: `curr.next = list1 (${l1[i]}); list1 = list1.next;`,
        variables: [
          { name: 'attached', value: l1[i], type: 'number', scope: 'mergeTwoLists' },
          { name: 'curr', value: l1[i], type: 'ListNode', scope: 'mergeTwoLists' }
        ],
        callStack: [makeFrame('mergeTwoLists', 5, [])],
        heap: [],
        output: '',
        dsaState: buildMergeState(i + 1, j, 'l1', `Attached ${l1[i]} from list1 to merged list`)
      })
      i++
    } else {
      mergedVals.push(l2[j])
      steps.push({
        line: 8,
        description: `curr.next = list2 (${l2[j]}); list2 = list2.next;`,
        variables: [
          { name: 'attached', value: l2[j], type: 'number', scope: 'mergeTwoLists' },
          { name: 'curr', value: l2[j], type: 'ListNode', scope: 'mergeTwoLists' }
        ],
        callStack: [makeFrame('mergeTwoLists', 8, [])],
        heap: [],
        output: '',
        dsaState: buildMergeState(i, j + 1, 'l2', `Attached ${l2[j]} from list2 to merged list`)
      })
      j++
    }
  }

  // Attach remaining
  while (i < l1.length) {
    mergedVals.push(l1[i])
    steps.push({
      line: 13,
      description: `Attach remaining list1 node: ${l1[i]}`,
      variables: [{ name: 'curr', value: l1[i], type: 'ListNode', scope: 'mergeTwoLists' }],
      callStack: [makeFrame('mergeTwoLists', 13, [])],
      heap: [],
      output: '',
      dsaState: buildMergeState(i + 1, j, 'none', `Attached remaining list1 node ${l1[i]}`)
    })
    i++
  }

  while (j < l2.length) {
    mergedVals.push(l2[j])
    steps.push({
      line: 13,
      description: `Attach remaining list2 node: ${l2[j]}`,
      variables: [{ name: 'curr', value: l2[j], type: 'ListNode', scope: 'mergeTwoLists' }],
      callStack: [makeFrame('mergeTwoLists', 13, [])],
      heap: [],
      output: '',
      dsaState: buildMergeState(i, j + 1, 'none', `Attached remaining list2 node ${l2[j]}`)
    })
    j++
  }

  // Completion step
  const finalState = buildMergeState(i, j, 'none', `✅ Merged: [${mergedVals.join(' → ')}]`)
  finalState.nodes.forEach(n => {
    if (n.id.startsWith('m-')) n.highlight = 'found'
  })
  steps.push({
    line: 14,
    description: `return dummy.next; // [${mergedVals.join(', ')}]`,
    variables: [{ name: 'result', value: mergedVals.join(' → '), type: 'string', scope: 'mergeTwoLists' }],
    callStack: [makeFrame('mergeTwoLists', 14, [])],
    heap: [],
    output: `[${mergedVals.join(',')}]`,
    dsaState: finalState
  })

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

function extractNthParam(code: string): number {
  const match = code.match(/(?:removeNthFromEnd|removeNth)\s*\([^,]+,\s*(\d+)\)/i) ||
                code.match(/\bn\s*[:=]\s*(\d+)/i) ||
                code.match(/,\s*(\d+)\s*\)/)
  return match ? Math.max(1, parseInt(match[1], 10)) : 2
}

function extractCyclePos(code: string): number {
  const match = code.match(/pos\s*[:=]\s*(-?\d+)/i) || code.match(/cyclePos\s*[:=]\s*(-?\d+)/i)
  return match ? parseInt(match[1], 10) : 1
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
  // Generic function call with string argument: longestSubArray('abcabcbb'), anyFunc("test")
  const genericCallMatch = code.match(/[a-zA-Z_]\w*\s*\(\s*(['"`])(.*?)\1\s*\)/)
  if (genericCallMatch) return genericCallMatch[2]
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

// ─── DYNAMIC EXTRACTION: Tree & BST Parameters ───────────────────────────────

function extractTreeArray(code: string): (number | null)[] {
  const arrMatch = code.match(/\[\s*(-?\d+|null)(?:\s*,\s*(-?\d+|null))*\s*\]/)
  if (arrMatch) {
    try {
      const parsed = JSON.parse(arrMatch[0])
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    } catch {}
  }
  const treeNodeMatches = Array.from(code.matchAll(/TreeNode\s*\(\s*(-?\d+)/g)).map(m => parseInt(m[1], 10))
  if (treeNodeMatches.length > 0) {
    return treeNodeMatches
  }
  return []
}

function extractTwoTreeArrays(code: string): { p: (number | null)[]; q: (number | null)[] } {
  const matches = Array.from(code.matchAll(/\[\s*(-?\d+|null)(?:\s*,\s*(-?\d+|null))*\s*\]/g))
  if (matches.length >= 2) {
    try {
      const p = JSON.parse(matches[0][0])
      const q = JSON.parse(matches[1][0])
      return { p, q }
    } catch {}
  }
  return { p: [1, 2, 3], q: [1, 2, 3] }
}

function extractK(code: string): number {
  const kMatch = code.match(/\bk\s*=\s*(\d+)/i) || code.match(/,\s*(\d+)\s*\)/)
  if (kMatch) return parseInt(kMatch[1], 10)
  return 1
}

function extractCoinChangeParams(code: string): { coins: number[]; amount: number } {
  let coins = [1, 2, 5]
  let amount = 11

  const callMatch = code.match(/coinChange\s*\(\s*\[([0-9,\s]+)\]\s*,\s*(\d+)\s*\)/i)
  if (callMatch) {
    const parsedCoins = callMatch[1].split(',').map(s => Number(s.trim())).filter(n => !isNaN(n))
    if (parsedCoins.length > 0) coins = parsedCoins
    amount = Number(callMatch[2])
  } else {
    const arrays = extractMultipleArrays(code)
    if (arrays.length > 0 && arrays[0].length > 0) coins = arrays[0]
    const amountMatch = code.match(/amount\s*=\s*(\d+)/i)
    if (amountMatch) amount = Number(amountMatch[1])
  }
  return { coins: coins.slice(0, 5), amount: Math.min(amount || 11, 20) }
}

function extractMinStackOps(code: string): Array<{ op: 'push' | 'pop' | 'top' | 'getMin'; val?: number }> {
  const ops: Array<{ op: 'push' | 'pop' | 'top' | 'getMin'; val?: number }> = []
  const lines = code.split('\n')
  for (const line of lines) {
    const pMatch = line.match(/\.push\s*\(\s*(-?\d+)\s*\)/)
    if (pMatch) {
      ops.push({ op: 'push', val: Number(pMatch[1]) })
      continue
    }
    if (line.includes('.pop()')) {
      ops.push({ op: 'pop' })
      continue
    }
    if (line.includes('.top()')) {
      ops.push({ op: 'top' })
      continue
    }
    if (line.includes('.getMin()')) {
      ops.push({ op: 'getMin' })
      continue
    }
  }
  if (ops.length === 0) {
    return [
      { op: 'push', val: -2 },
      { op: 'push', val: 0 },
      { op: 'push', val: -3 },
      { op: 'getMin' },
      { op: 'pop' },
      { op: 'top' },
      { op: 'getMin' },
    ]
  }
  return ops
}


export function genFindMinRotated(nums: number[]): ExecutionStep[] {
  const validation = validateNumberArray(nums)
  if (!validation.valid) return [createErrorStep(validation.error)]

  const steps: ExecutionStep[] = []
  let left = 0, right = nums.length - 1, comps = 0

  const snap = (desc: string, l: number, r: number, mid: number | null, found: boolean): ExecutionStep => ({
    line: 1, description: desc,
    variables: [
      { name: 'left', value: l, type: 'number', scope: 'findMin', changed: true },
      { name: 'right', value: r, type: 'number', scope: 'findMin', changed: true },
      { name: 'mid', value: mid ?? '—', type: 'number', scope: 'findMin' },
      { name: 'comparisons', value: comps, type: 'number', scope: 'findMin' },
    ],
    callStack: [makeFrame('main', 1, []), makeFrame('findMin', 1, [], true)],
    heap: [], output: found && l >= 0 ? String(nums[l]) : '',
    dsaState: {
      type: 'array',
      nodes: nums.map((v, i) => {
        const isEliminated = i < l || i > r
        const isMid = mid !== null && i === mid
        let highlight: DSANode['highlight'] = 'none'
        if (isEliminated) {
          highlight = 'skipped'
        } else if (found && i === l) {
          highlight = 'found'
        } else if (isMid) {
          highlight = 'comparing'
        } else if (i >= l && i <= r) {
          highlight = 'active'
        }
        return { id: `fm${i}`, value: v, highlight }
      }),
      comparisons: comps,
      rangeStart: l,
      rangeEnd: r,
      pointer: mid !== null ? mid : undefined,
      pointerName: 'mid',
      pointer2: l >= 0 && l < nums.length ? l : undefined,
      pointer2Name: 'L',
      pointer3: r >= 0 && r < nums.length ? r : undefined,
      pointer3Name: 'R',
      auxiliaryData: {
        isSearch: true,
        renderAs: 'boxes',
        trackingVars: {
          left: l,
          right: r,
          mid: mid !== null ? mid : '—',
          'nums[mid]': mid !== null ? nums[mid] : '—',
          'nums[right]': r >= 0 ? nums[r] : '—',
        }
      },
      message: desc,
    }
  })

  steps.push(snap(`🚀 Find Minimum in Rotated Sorted Array [${nums.join(', ')}] via Binary Search O(log n)`, left, right, null, false))

  while (left < right) {
    const mid = Math.floor((left + right) / 2)
    comps++
    steps.push(snap(
      `🔍 Compare nums[mid=${mid}]=${nums[mid]} with nums[right=${right}]=${nums[right]}`,
      left, right, mid, false
    ))

    if (nums[mid] > nums[right]) {
      steps.push(snap(
        `➡ nums[${mid}]=${nums[mid]} > nums[${right}]=${nums[right]} → Minimum is in RIGHT half → set left = ${mid + 1}`,
        left, right, mid, false
      ))
      left = mid + 1
    } else {
      steps.push(snap(
        `⬅ nums[${mid}]=${nums[mid]} ≤ nums[${right}]=${nums[right]} → Minimum is in LEFT half (incl. mid) → set right = ${mid}`,
        left, right, mid, false
      ))
      right = mid
    }
  }

  steps.push(snap(
    `🎉 left=right=${left} → Found minimum element: nums[${left}] = ${nums[left]}! ✅`,
    left, right, left, true
  ))

  return steps
}

export function genSearchRotatedArray(nums: number[], target: number): ExecutionStep[] {
  const validation = validateBinarySearchInput(nums, target)
  if (!validation.valid) return [createErrorStep(validation.error)]

  const steps: ExecutionStep[] = []
  let left = 0, right = nums.length - 1, comps = 0

  const snap = (desc: string, l: number, r: number, mid: number | null, found: boolean): ExecutionStep => ({
    line: 1, description: desc,
    variables: [
      { name: 'left', value: l, type: 'number', scope: 'searchRotated', changed: true },
      { name: 'right', value: r, type: 'number', scope: 'searchRotated', changed: true },
      { name: 'mid', value: mid ?? '—', type: 'number', scope: 'searchRotated' },
      { name: 'target', value: target, type: 'number', scope: 'searchRotated' },
      { name: 'comparisons', value: comps, type: 'number', scope: 'searchRotated' },
    ],
    callStack: [makeFrame('main', 1, []), makeFrame('searchRotated', 1, [], true)],
    heap: [], output: found && mid !== null ? String(mid) : '',
    dsaState: {
      type: 'array',
      nodes: nums.map((v, i) => {
        const isEliminated = i < l || i > r
        const isMid = mid !== null && i === mid
        let highlight: DSANode['highlight'] = 'none'
        if (isMid) {
          highlight = found ? 'found' : 'comparing'
        } else if (isEliminated) {
          highlight = 'skipped'
        } else if (i >= l && i <= r) {
          highlight = 'active'
        }
        return { id: `sr${i}`, value: v, highlight }
      }),
      comparisons: comps,
      rangeStart: l,
      rangeEnd: r,
      pointer: mid !== null ? mid : undefined,
      pointerName: 'mid',
      pointer2: l >= 0 && l < nums.length ? l : undefined,
      pointer2Name: 'L',
      pointer3: r >= 0 && r < nums.length ? r : undefined,
      pointer3Name: 'R',
      auxiliaryData: {
        isSearch: true,
        renderAs: 'boxes',
        target,
        trackingVars: {
          target,
          left: l,
          right: r,
          mid: mid !== null ? mid : '—',
          'nums[mid]': mid !== null ? nums[mid] : '—',
        }
      },
      message: desc,
    }
  })

  steps.push(snap(`🚀 Search for target=${target} in Rotated Sorted Array [${nums.join(', ')}]`, left, right, null, false))

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    comps++
    steps.push(snap(
      `🔍 Range [${left}..${right}] → mid=${mid}, nums[mid]=${nums[mid]} vs target=${target}`,
      left, right, mid, false
    ))

    if (nums[mid] === target) {
      steps.push(snap(`🎉 Found target=${target} at index ${mid}! ✅`, left, right, mid, true))
      return steps
    }

    if (nums[left] <= nums[mid]) {
      if (nums[left] <= target && target < nums[mid]) {
        steps.push(snap(`⬅ Left half is sorted and target is within [${nums[left]}..${nums[mid]}] → search left half`, left, mid - 1, mid, false))
        right = mid - 1
      } else {
        steps.push(snap(`➡ Left half is sorted but target is NOT within [${nums[left]}..${nums[mid]}] → search right half`, mid + 1, right, mid, false))
        left = mid + 1
      }
    } else {
      if (nums[mid] < target && target <= nums[right]) {
        steps.push(snap(`➡ Right half is sorted and target is within [${nums[mid]}..${nums[right]}] → search right half`, mid + 1, right, mid, false))
        left = mid + 1
      } else {
        steps.push(snap(`⬅ Right half is sorted but target is NOT within [${nums[mid]}..${nums[right]}] → search left half`, left, mid - 1, mid, false))
        right = mid - 1
      }
    }
  }

  steps.push(snap(`❌ Target ${target} not found in array`, left, right, null, false))
  return steps
}

export function generateExecutionSteps(code: string): ExecutionStep[] {
  // ─────────────────────────────────────────────────────────────────────────
  // PRIORITY ORDER:
  //  1. Detect algorithm → run the hand-crafted static visualizer (correct,
  //     beginner-friendly, stable IDs, swap animation)
  //  2. For truly GENERIC / unknown code → fall back to dynamic interpreter
  //     which traces actual JS execution line-by-line
  //
  // WHY: the interpreter runs real JS and can tell WHEN variables change, but
  // it does NOT know about the algorithm's logic so it produces incorrect DSA
  // highlights (e.g. marks 3 bars as "swapping" instead of 2).
  // ─────────────────────────────────────────────────────────────────────────

  const algo = detectAlgorithm(code)
  const arr = extractArray(code)

  // 1. Static visualizers for all known algorithms (highest quality output)
  if (algo !== 'generic') {
    switch (algo) {
      case 'bubbleSort':    return genBubbleSort(arr)
      case 'selectionSort': return genSelectionSort(arr)
      case 'insertionSort': return genInsertionSort(arr)
      case 'mergeSort':     return genMergeSort(arr)
      case 'quickSort':     return genQuickSort(arr)
      case 'heapSort':      return genHeapSort(arr)
      case 'binarySearch': {
        const bsArr = arr.length ? [...arr].sort((a, b) => a - b) : [2,5,8,12,16,23,38,56,72,91]
        return genBinarySearch(bsArr, extractTarget(code))
      }
      case 'findMinRotated': return genFindMinRotated(arr.length ? arr : [3,4,5,1,2])
      case 'searchRotated': return genSearchRotatedArray(arr.length ? arr : [4,5,6,7,0,1,2], extractTarget(code) || 0)
      case 'linearSearch':   return genLinearSearch(arr, extractTarget(code))
      case 'fibonacci':      return genFibonacci(extractNumber(code))
      case 'factorial':      return genFactorial(extractNumber(code))
      case 'linkedList':     return genLinkedList(arr.length ? arr : [10,20,30,40,50])
      case 'doublyLinkedList': return genLinkedList(arr.length ? arr : [5,15,25,35,45])
      case 'bst':            return genBST(arr.length ? arr : [50,30,70,20,40,60,80])
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
      case 'reorderList': return genReorderList(arr.length ? arr : [1, 2, 3, 4])
      case 'hasCycle': return genHasCycle(arr.length ? arr : [3, 2, 0, -4], extractCyclePos(code))
      case 'removeNthFromEnd': return genRemoveNthFromEnd(arr.length ? arr : [1, 2, 3, 4, 5], extractNthParam(code))
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
      case 'invertTree': return genInvertTree(extractTreeArray(code))
      case 'maxDepth': return genMaxDepth(extractTreeArray(code))
      case 'sameTree': {
        const trees = extractTwoTreeArrays(code)
        return genSameTree(trees.p, trees.q)
      }
      case 'levelOrder': return genLevelOrder(extractTreeArray(code))
      case 'validateBST': return genValidateBST(extractTreeArray(code))
      case 'kthSmallest': return genKthSmallest(extractTreeArray(code), extractK(code))
      case 'dailyTemperatures': return genDailyTemperatures(extractArray(code).length ? extractArray(code) : [73, 74, 75, 71, 69, 72, 76, 73])
      case 'minStack': return genMinStack(extractMinStackOps(code))
      case 'houseRobber': return genHouseRobber(extractArray(code).length ? extractArray(code) : [2, 7, 9, 3, 1])
      case 'coinChange': {
        const cp = extractCoinChangeParams(code)
        return genCoinChange(cp.coins, cp.amount)
      }
      case 'lengthOfLIS': return genLIS(extractArray(code).length ? extractArray(code) : [10, 9, 2, 5, 3, 7, 101, 18])
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
  if (n > 12) n = 12
  if (n < 1) n = 1

  const dp = new Array(n + 1).fill(0)
  dp[0] = 1

  const makeSnap = (desc: string, currentStep: number, depIndices: number[] = [], calcStr = ''): ExecutionStep => ({
    line: 1,
    description: desc,
    variables: [
      { name: 'n', value: n, type: 'number', scope: 'climbStairs' },
      { name: 'dp', value: [...dp], type: 'Array', scope: 'climbStairs', changed: true },
      { name: 'i', value: currentStep, type: 'number', scope: 'climbStairs' },
    ],
    callStack: [makeFrame('climbStairs', 1, [])],
    heap: [],
    output: '',
    dsaState: {
      type: 'dp',
      nodes: dp.map((v, idx) => ({
        id: `dp_${idx}`,
        value: v,
        highlight: idx === currentStep ? 'active' : depIndices.includes(idx) ? 'comparing' : (v > 0 ? 'visited' : 'none')
      })),
      pointer: currentStep,
      pointerName: 'i',
      message: desc,
      auxiliaryData: {
        isDP: true,
        formula: 'dp[i] = dp[i-1] + dp[i-2]',
        calculation: calcStr,
        dpArray: [...dp],
        targetIndex: currentStep,
        dependencyIndices: depIndices,
      }
    }
  })

  steps.push(makeSnap(`climbStairs(${n}): dp[i] represents distinct ways to reach stair i`, 0, [], 'dp[0] = 1 (ground level)'))

  dp[1] = 1
  steps.push(makeSnap(`Base case: dp[1] = 1 (only 1 step: [1])`, 1, [0], 'dp[1] = 1'))

  if (n >= 2) {
    dp[2] = 2
    steps.push(makeSnap(`Base case: dp[2] = 2 (ways: [1+1, 2])`, 2, [0, 1], 'dp[2] = 2'))
  }

  for (let i = 3; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2]
    const calc = `dp[${i}] = dp[${i - 1}] (${dp[i - 1]}) + dp[${i - 2}] (${dp[i - 2]}) = ${dp[i]}`
    steps.push(makeSnap(`Stair ${i}: ${calc}`, i, [i - 1, i - 2], calc))
  }

  steps.push({
    line: 9,
    description: `Done! Total distinct ways to climb ${n} stairs = ${dp[n]}`,
    variables: [{ name: 'result', value: dp[n], type: 'number', scope: 'climbStairs' }],
    callStack: [makeFrame('climbStairs', 9, [])],
    heap: [],
    output: String(dp[n]),
    dsaState: {
      type: 'dp',
      nodes: dp.map((v, idx) => ({
        id: `dp_${idx}`,
        value: v,
        highlight: idx === n ? 'found' : 'visited'
      })),
      pointer: n,
      pointerName: 'ans',
      message: `Final Answer: ${dp[n]} ways`,
      auxiliaryData: {
        isDP: true,
        formula: 'dp[i] = dp[i-1] + dp[i-2]',
        calculation: `Result: dp[${n}] = ${dp[n]}`,
        dpArray: [...dp],
        targetIndex: n,
      }
    }
  })

  return steps
}

export function genHouseRobber(nums: number[]): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  if (!nums.length) nums = [2, 7, 9, 3, 1]
  if (nums.length > 8) nums = nums.slice(0, 8)
  const n = nums.length

  const dp = new Array(n).fill(0)

  const makeSnap = (desc: string, currentIdx: number, depIndices: number[] = [], calcStr = '', choice = ''): ExecutionStep => ({
    line: 1,
    description: desc,
    variables: [
      { name: 'nums', value: [...nums], type: 'Array', scope: 'rob' },
      { name: 'dp', value: [...dp], type: 'Array', scope: 'rob', changed: true },
      { name: 'i', value: currentIdx, type: 'number', scope: 'rob' },
    ],
    callStack: [makeFrame('rob', 1, [])],
    heap: [],
    output: '',
    dsaState: {
      type: 'dp',
      nodes: dp.map((v, idx) => ({
        id: `dp_${idx}`,
        value: `${v}`,
        highlight: idx === currentIdx ? 'active' : depIndices.includes(idx) ? 'comparing' : (v > 0 ? 'visited' : 'none')
      })),
      pointer: currentIdx,
      pointerName: 'i',
      message: desc,
      auxiliaryData: {
        isDP: true,
        formula: 'dp[i] = max(dp[i-1], dp[i-2] + nums[i])',
        inputName: 'houses (loot)',
        inputValues: nums.map(v => `${v}`),
        inputIndex: currentIdx,
        calculation: calcStr,
        dpArray: dp.map(v => `${v}`),
        targetIndex: currentIdx,
        dependencyIndices: depIndices,
        choice,
      }
    }
  })

  steps.push(makeSnap(`rob([${nums.map(x => `${x}`).join(', ')}]): Maximize loot without alerting police (no 2 adjacent houses)`, 0, [], 'dp[i] = max(skip, rob)'))

  dp[0] = nums[0]
  steps.push(makeSnap(`House 0 (${nums[0]}): Base case, rob house 0 → dp[0] = ${dp[0]}`, 0, [], `dp[0] = ${dp[0]}`, `Rob house 0 (+${nums[0]})`))

  if (n > 1) {
    dp[1] = Math.max(nums[0], nums[1])
    steps.push(makeSnap(
      `House 1 (${nums[1]}): Base case, max of house 0 vs 1 → dp[1] = ${dp[1]}`,
      1,
      [0],
      `dp[1] = max(${nums[0]}, ${nums[1]}) = ${dp[1]}`,
      nums[1] > nums[0] ? `Rob house 1 (+${nums[1]})` : `Rob house 0 (+${nums[0]})`
    ))
  }

  for (let i = 2; i < n; i++) {
    const robChoice = dp[i - 2] + nums[i]
    const skipChoice = dp[i - 1]
    dp[i] = Math.max(robChoice, skipChoice)
    const calc = `max(skip: ${skipChoice}, rob: ${dp[i - 2]} + ${nums[i]} = ${robChoice}) = ${dp[i]}`
    const choice = robChoice > skipChoice ? `Rob house ${i} (+${nums[i]})` : `Skip house ${i} (keep ${skipChoice})`
    steps.push(makeSnap(`House ${i} (${nums[i]}): ${calc}`, i, [i - 1, i - 2], `dp[${i}] = ${calc}`, choice))
  }

  steps.push({
    line: 8,
    description: `Done! Max loot from all houses = ${dp[n - 1]}`,
    variables: [{ name: 'maxLoot', value: dp[n - 1], type: 'number', scope: 'rob' }],
    callStack: [makeFrame('rob', 8, [])],
    heap: [],
    output: String(dp[n - 1]),
    dsaState: {
      type: 'dp',
      nodes: dp.map((v, idx) => ({
        id: `dp_${idx}`,
        value: `${v}`,
        highlight: idx === n - 1 ? 'found' : 'visited'
      })),
      pointer: n - 1,
      pointerName: 'max',
      message: `Max Loot: ${dp[n - 1]}`,
      auxiliaryData: {
        isDP: true,
        formula: 'dp[i] = max(dp[i-1], dp[i-2] + nums[i])',
        inputName: 'houses (loot)',
        inputValues: nums.map(v => `${v}`),
        dpArray: dp.map(v => `${v}`),
        targetIndex: n - 1,
        calculation: `Result: ${dp[n - 1]}`,
      }
    }
  })

  return steps
}

export function genCoinChange(coins: number[], amount: number): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  if (!coins.length) coins = [1, 2, 5]
  if (amount > 15) amount = 15
  if (amount < 1) amount = 1

  const dp = new Array(amount + 1).fill(Infinity)
  dp[0] = 0

  const makeSnap = (desc: string, currentAmount: number, depIndices: number[] = [], calcStr = '', coinUsed?: number): ExecutionStep => ({
    line: 1,
    description: desc,
    variables: [
      { name: 'coins', value: [...coins], type: 'Array', scope: 'coinChange' },
      { name: 'amount', value: amount, type: 'number', scope: 'coinChange' },
      { name: 'dp', value: dp.map(v => v === Infinity ? '∞' : v), type: 'Array', scope: 'coinChange', changed: true },
    ],
    callStack: [makeFrame('coinChange', 1, [])],
    heap: [],
    output: '',
    dsaState: {
      type: 'dp',
      nodes: dp.map((v, idx) => ({
        id: `dp_${idx}`,
        value: v === Infinity ? '∞' : v,
        highlight: idx === currentAmount ? 'active' : depIndices.includes(idx) ? 'comparing' : (v !== Infinity ? 'visited' : 'none')
      })),
      pointer: currentAmount,
      pointerName: 'amt',
      message: desc,
      auxiliaryData: {
        isDP: true,
        formula: 'dp[i] = min(dp[i], dp[i - coin] + 1)',
        inputName: 'coins',
        inputValues: [...coins],
        inputIndex: coinUsed !== undefined ? coins.indexOf(coinUsed) : undefined,
        calculation: calcStr,
        dpArray: dp.map(v => v === Infinity ? '∞' : v),
        targetIndex: currentAmount,
        dependencyIndices: depIndices,
      }
    }
  })

  steps.push(makeSnap(`coinChange([${coins.join(', ')}], target: ${amount}): Find min coins to make amount`, 0, [], 'dp[0] = 0, dp[1..amount] = ∞'))

  for (let i = 1; i <= amount; i++) {
    for (const c of coins) {
      if (c <= i) {
        const prev = dp[i - c]
        if (prev !== Infinity && prev + 1 < dp[i]) {
          dp[i] = prev + 1
          const calc = `dp[${i} - ${c}] (${prev}) + 1 = ${dp[i]} coins`
          steps.push(makeSnap(`Amount ${i}: Using coin ${c} gives ${calc}`, i, [i - c], `dp[${i}] = ${calc}`, c))
        }
      }
    }
  }

  const ans = dp[amount] === Infinity ? -1 : dp[amount]
  steps.push({
    line: 10,
    description: `Done! Minimum coins to make ${amount} = ${ans}`,
    variables: [{ name: 'result', value: ans, type: 'number', scope: 'coinChange' }],
    callStack: [makeFrame('coinChange', 10, [])],
    heap: [],
    output: String(ans),
    dsaState: {
      type: 'dp',
      nodes: dp.map((v, idx) => ({
        id: `dp_${idx}`,
        value: v === Infinity ? '∞' : v,
        highlight: idx === amount ? 'found' : (v !== Infinity ? 'visited' : 'none')
      })),
      pointer: amount,
      pointerName: 'ans',
      message: `Minimum coins: ${ans}`,
      auxiliaryData: {
        isDP: true,
        formula: 'dp[i] = min(dp[i], dp[i - coin] + 1)',
        inputName: 'coins',
        inputValues: [...coins],
        dpArray: dp.map(v => v === Infinity ? '∞' : v),
        targetIndex: amount,
        calculation: `Result: ${ans} coins`,
      }
    }
  })

  return steps
}

export function genLIS(nums: number[]): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  if (!nums.length) nums = [10, 9, 2, 5, 3, 7, 101, 18]
  if (nums.length > 8) nums = nums.slice(0, 8)
  const n = nums.length

  const dp = new Array(n).fill(1)
  let maxLen = 1

  const makeSnap = (desc: string, iIdx: number, jIdx: number = -1, calcStr = ''): ExecutionStep => ({
    line: 1,
    description: desc,
    variables: [
      { name: 'nums', value: [...nums], type: 'Array', scope: 'lengthOfLIS' },
      { name: 'dp', value: [...dp], type: 'Array', scope: 'lengthOfLIS', changed: true },
      { name: 'i', value: iIdx, type: 'number', scope: 'lengthOfLIS' },
      ...(jIdx >= 0 ? [{ name: 'j', value: jIdx, type: 'number', scope: 'lengthOfLIS' }] : []),
    ],
    callStack: [makeFrame('lengthOfLIS', 1, [])],
    heap: [],
    output: '',
    dsaState: {
      type: 'dp',
      nodes: dp.map((v, idx) => ({
        id: `dp_${idx}`,
        value: v,
        highlight: idx === iIdx ? 'active' : idx === jIdx ? 'comparing' : 'visited'
      })),
      pointer: iIdx,
      pointerName: 'i',
      pointer2: jIdx >= 0 ? jIdx : undefined,
      pointer2Name: jIdx >= 0 ? 'j' : undefined,
      message: desc,
      auxiliaryData: {
        isDP: true,
        formula: 'dp[i] = max(dp[i], dp[j] + 1) for j < i where nums[j] < nums[i]',
        inputName: 'nums',
        inputValues: [...nums],
        inputIndex: iIdx,
        secondaryIndex: jIdx >= 0 ? jIdx : undefined,
        calculation: calcStr,
        dpArray: [...dp],
        targetIndex: iIdx,
        dependencyIndices: jIdx >= 0 ? [jIdx] : [],
      }
    }
  })

  steps.push(makeSnap(`lengthOfLIS([${nums.join(', ')}]): dp[i] = longest increasing subsequence ending at index i`, 0, -1, 'All dp[i] initialized to 1'))

  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) {
        const canExtend = dp[j] + 1 > dp[i]
        if (canExtend) {
          dp[i] = dp[j] + 1
          maxLen = Math.max(maxLen, dp[i])
          steps.push(makeSnap(
            `nums[${j}] (${nums[j]}) < nums[${i}] (${nums[i]}): Extend! dp[${i}] = dp[${j}] + 1 = ${dp[i]}`,
            i,
            j,
            `dp[${i}] = max(dp[${i}], dp[${j}] + 1) = ${dp[i]}`
          ))
        } else {
          steps.push(makeSnap(
            `nums[${j}] (${nums[j]}) < nums[${i}] (${nums[i]}): Can extend, but dp[${j}]+1 (${dp[j]+1}) <= dp[${i}] (${dp[i]})`,
            i,
            j,
            `dp[${i}] stays ${dp[i]}`
          ))
        }
      }
    }
  }

  steps.push({
    line: 10,
    description: `Done! Longest Increasing Subsequence length = ${maxLen}`,
    variables: [{ name: 'maxLen', value: maxLen, type: 'number', scope: 'lengthOfLIS' }],
    callStack: [makeFrame('lengthOfLIS', 10, [])],
    heap: [],
    output: String(maxLen),
    dsaState: {
      type: 'dp',
      nodes: dp.map((v, idx) => ({
        id: `dp_${idx}`,
        value: v,
        highlight: v === maxLen ? 'found' : 'visited'
      })),
      pointer: dp.indexOf(maxLen),
      pointerName: 'max',
      message: `LIS Length = ${maxLen}`,
      auxiliaryData: {
        isDP: true,
        formula: 'max(dp)',
        inputName: 'nums',
        inputValues: [...nums],
        dpArray: [...dp],
        calculation: `Result = ${maxLen}`,
      }
    }
  })

  return steps
}

export function genDailyTemperatures(temperatures: number[]): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  if (!temperatures.length) temperatures = [73, 74, 75, 71, 69, 72, 76, 73]
  if (temperatures.length > 8) temperatures = temperatures.slice(0, 8)
  const n = temperatures.length

  const result = new Array(n).fill(0)
  const stack: number[] = []

  const makeSnap = (desc: string, currentI: number, prevIdx = -1): ExecutionStep => ({
    line: 1,
    description: desc,
    variables: [
      { name: 'temperatures', value: [...temperatures], type: 'Array', scope: 'dailyTemperatures' },
      { name: 'result', value: [...result], type: 'Array', scope: 'dailyTemperatures', changed: true },
      { name: 'stack', value: [...stack], type: 'Array', scope: 'dailyTemperatures' },
      { name: 'i', value: currentI, type: 'number', scope: 'dailyTemperatures' },
    ],
    callStack: [makeFrame('dailyTemperatures', 1, [])],
    heap: [],
    output: '',
    dsaState: {
      type: 'array',
      nodes: temperatures.map((temp, idx) => ({
        id: `t_${idx}`,
        value: `${temp}°`,
        highlight: idx === currentI ? 'active' : idx === prevIdx ? 'swapping' : stack.includes(idx) ? 'comparing' : (result[idx] > 0 ? 'found' : 'none')
      })),
      pointer: currentI,
      pointerName: 'i',
      pointer2: prevIdx >= 0 ? prevIdx : undefined,
      pointer2Name: prevIdx >= 0 ? 'prev' : undefined,
      stackItems: stack.map(idx => `Day ${idx} (${temperatures[idx]}°)`),
      stackName: 'Monotonic Stack (Indices)',
      message: desc,
      auxiliaryData: {
        isDailyTemperatures: true,
        resultArray: [...result],
        temperatures: [...temperatures],
        currentDay: currentI,
        poppedDay: prevIdx >= 0 ? prevIdx : undefined,
        stackIndices: [...stack],
      }
    }
  })

  steps.push(makeSnap(`dailyTemperatures([${temperatures.join(', ')}]): Find days until a warmer temperature`, 0))

  for (let i = 0; i < n; i++) {
    steps.push(makeSnap(`Day ${i}: Temperature is ${temperatures[i]}°. Check stack.`, i))

    while (stack.length > 0 && temperatures[i] > temperatures[stack[stack.length - 1]]) {
      const prevIdx = stack.pop()!
      const waitDays = i - prevIdx
      result[prevIdx] = waitDays
      steps.push(makeSnap(
        `Day ${i} (${temperatures[i]}°) > Day ${prevIdx} (${temperatures[prevIdx]}°)! Pop Day ${prevIdx}. Waited ${waitDays} day(s).`,
        i,
        prevIdx
      ))
    }

    stack.push(i)
    steps.push(makeSnap(`Push Day ${i} (${temperatures[i]}°) to stack. Waiting for a warmer future day.`, i))
  }

  steps.push({
    line: 9,
    description: `Done! Remaining days in stack [${stack.join(', ')}] have no warmer day ahead (0).`,
    variables: [{ name: 'result', value: [...result], type: 'Array', scope: 'dailyTemperatures' }],
    callStack: [makeFrame('dailyTemperatures', 9, [])],
    heap: [],
    output: `[${result.join(', ')}]`,
    dsaState: {
      type: 'array',
      nodes: temperatures.map((_, idx) => ({
        id: `t_${idx}`,
        value: `${result[idx]}d`,
        highlight: 'found'
      })),
      pointer: n - 1,
      pointerName: 'end',
      stackItems: stack.map(idx => `Day ${idx} (${temperatures[idx]}°)`),
      stackName: 'Monotonic Stack',
      message: `Result: [${result.join(', ')}]`,
      auxiliaryData: {
        isDailyTemperatures: true,
        resultArray: [...result],
        temperatures: [...temperatures],
        currentDay: n - 1,
        stackIndices: [...stack],
      }
    }
  })

  return steps
}

export function genMinStack(ops?: Array<{ op: 'push' | 'pop' | 'top' | 'getMin'; val?: number }>): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  if (!ops || !ops.length) {
    ops = [
      { op: 'push', val: -2 },
      { op: 'push', val: 0 },
      { op: 'push', val: -3 },
      { op: 'getMin' },
      { op: 'pop' },
      { op: 'top' },
      { op: 'getMin' },
    ]
  }

  const stack: number[] = []
  const minStack: number[] = []

  const makeSnap = (desc: string, opName: string): ExecutionStep => {
    const topVal = stack.length > 0 ? stack[stack.length - 1] : null
    const minVal = minStack.length > 0 ? minStack[minStack.length - 1] : null
    return {
      line: 1,
      description: desc,
      variables: [
        { name: 'stack', value: [...stack], type: 'Array', scope: 'MinStack' },
        { name: 'minStack', value: [...minStack], type: 'Array', scope: 'MinStack', changed: true },
        { name: 'top', value: topVal, type: 'number', scope: 'MinStack' },
        { name: 'getMin', value: minVal, type: 'number', scope: 'MinStack' },
      ],
      callStack: [makeFrame('MinStack', 1, [])],
      heap: [],
      output: '',
      dsaState: {
        type: 'minstack',
        nodes: stack.map((v, idx) => ({
          id: `s_${idx}`,
          value: v,
          highlight: idx === stack.length - 1 ? 'active' : 'visited'
        })),
        stackItems: [...stack],
        message: desc,
        auxiliaryData: {
          isMinStack: true,
          minStackItems: [...minStack],
          currentOp: opName,
          topVal,
          minVal,
        }
      }
    }
  }

  steps.push(makeSnap('MinStack initialized: tracks minimum element in O(1) time using auxiliary minStack', 'init()'))

  for (const op of ops) {
    if (op.op === 'push' && op.val !== undefined) {
      stack.push(op.val)
      const currentMin = minStack.length === 0 ? op.val : Math.min(op.val, minStack[minStack.length - 1])
      minStack.push(currentMin)
      steps.push(makeSnap(`push(${op.val}) → Stack gets ${op.val}, MinStack gets min(${op.val}, ${minStack[minStack.length - 2] ?? op.val}) = ${currentMin}`, `push(${op.val})`))
    } else if (op.op === 'pop') {
      const popped = stack.pop()
      minStack.pop()
      steps.push(makeSnap(`pop() → Removed ${popped}. Top is now ${stack[stack.length - 1] ?? 'empty'}, min is ${minStack[minStack.length - 1] ?? 'empty'}`, 'pop()'))
    } else if (op.op === 'top') {
      const topVal = stack[stack.length - 1]
      steps.push(makeSnap(`top() → Returns topmost element: ${topVal}`, `top() = ${topVal}`))
    } else if (op.op === 'getMin') {
      const minVal = minStack[minStack.length - 1]
      steps.push(makeSnap(`getMin() → Returns minimum in O(1) time: ${minVal}`, `getMin() = ${minVal}`))
    }
  }

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
  const vals = values.length ? values : [1, 2, 3, 4, 5]
  const n = vals.length

  const buildRevState = (
    prevIdx: number,
    currIdx: number,
    nextIdx: number,
    reversedEdgesCount: number,
    stepMsg: string
  ): DSAState => {
    const nodes: DSANode[] = []
    const edges: DSAEdge[] = []

    vals.forEach((v, idx) => {
      let hl: DSANode['highlight'] = 'none'
      const labels: string[] = []

      if (idx === prevIdx) {
        labels.push('prev')
        hl = 'visited'
      }
      if (idx === currIdx) {
        labels.push('curr')
        hl = 'active'
      }
      if (idx === nextIdx) {
        labels.push('next')
        hl = 'comparing'
      }

      nodes.push({
        id: `ll-${idx}`,
        value: v,
        x: idx * 135 + 80,
        y: 140,
        highlight: hl,
        label: labels.length > 0 ? labels.join(', ') : undefined
      })
    })

    // Reversed edges (point backward: i -> i-1)
    for (let i = 0; i < reversedEdgesCount; i++) {
      if (i > 0) {
        edges.push({
          id: `e-rev-${i}`,
          from: `ll-${i}`,
          to: `ll-${i-1}`,
          directed: true,
          highlight: i === currIdx
        })
      }
    }

    // Unreversed forward edges (point forward: i -> i+1)
    for (let i = Math.max(currIdx + 1, reversedEdgesCount); i < n - 1; i++) {
      edges.push({
        id: `e-fwd-${i}`,
        from: `ll-${i}`,
        to: `ll-${i+1}`,
        directed: true
      })
    }

    return { type: 'linkedlist', nodes, edges, message: stepMsg }
  }

  // Step 1: Start
  steps.push({
    line: 1,
    description: `reverseList(head) — list: ${vals.join(' → ')} → null`,
    variables: [{ name: 'head', value: vals[0], type: 'ListNode', scope: 'reverseList' }],
    callStack: [makeFrame('reverseList', 1, [])],
    heap: [],
    output: '',
    dsaState: buildRevState(-1, 0, 1, 0, 'Start: head at node 1')
  })

  // Step 2: prev = null, curr = head
  steps.push({
    line: 2,
    description: 'let prev = null; let curr = head;',
    variables: [
      { name: 'prev', value: null, type: 'null', scope: 'reverseList' },
      { name: 'curr', value: vals[0], type: 'ListNode', scope: 'reverseList' }
    ],
    callStack: [makeFrame('reverseList', 2, [])],
    heap: [],
    output: '',
    dsaState: buildRevState(-1, 0, 1, 0, 'prev = null, curr = head')
  })

  for (let i = 0; i < n; i++) {
    // while (curr !== null)
    steps.push({
      line: 4,
      description: `while (curr !== null) — curr is at node ${vals[i]}`,
      variables: [
        { name: 'prev', value: i > 0 ? vals[i-1] : null, type: 'ListNode', scope: 'reverseList' },
        { name: 'curr', value: vals[i], type: 'ListNode', scope: 'reverseList' }
      ],
      callStack: [makeFrame('reverseList', 4, [])],
      heap: [],
      output: '',
      dsaState: buildRevState(i - 1, i, i + 1, i, `Processing node ${vals[i]}`)
    })

    // const nextNode = curr.next
    steps.push({
      line: 5,
      description: `const nextNode = curr.next; // save reference to ${i + 1 < n ? vals[i+1] : 'null'}`,
      variables: [
        { name: 'curr', value: vals[i], type: 'ListNode', scope: 'reverseList' },
        { name: 'nextNode', value: i + 1 < n ? vals[i+1] : null, type: 'ListNode', scope: 'reverseList' }
      ],
      callStack: [makeFrame('reverseList', 5, [])],
      heap: [],
      output: '',
      dsaState: buildRevState(i - 1, i, i + 1, i, `Save nextNode = ${i + 1 < n ? vals[i+1] : 'null'}`)
    })

    // curr.next = prev
    steps.push({
      line: 6,
      description: `curr.next = prev; // reverse link from ${vals[i]} to ${i > 0 ? vals[i-1] : 'null'}`,
      variables: [
        { name: 'curr.val', value: vals[i], type: 'number', scope: 'reverseList' },
        { name: 'curr.next', value: i > 0 ? vals[i-1] : null, type: 'ListNode', scope: 'reverseList' }
      ],
      callStack: [makeFrame('reverseList', 6, [])],
      heap: [],
      output: '',
      dsaState: buildRevState(i - 1, i, i + 1, i + 1, `Reversed link: ${vals[i]} → ${i > 0 ? vals[i-1] : 'null'}`)
    })

    // prev = curr
    steps.push({
      line: 7,
      description: `prev = curr; // move prev forward to ${vals[i]}`,
      variables: [{ name: 'prev', value: vals[i], type: 'ListNode', scope: 'reverseList' }],
      callStack: [makeFrame('reverseList', 7, [])],
      heap: [],
      output: '',
      dsaState: buildRevState(i, i, i + 1, i + 1, `prev moved to ${vals[i]}`)
    })

    // curr = nextNode
    steps.push({
      line: 8,
      description: `curr = nextNode; // move curr forward to ${i + 1 < n ? vals[i+1] : 'null'}`,
      variables: [
        { name: 'prev', value: vals[i], type: 'ListNode', scope: 'reverseList' },
        { name: 'curr', value: i + 1 < n ? vals[i+1] : null, type: 'ListNode', scope: 'reverseList' }
      ],
      callStack: [makeFrame('reverseList', 8, [])],
      heap: [],
      output: '',
      dsaState: buildRevState(i, i + 1, i + 2, i + 1, `curr moved to ${i + 1 < n ? vals[i+1] : 'null'}`)
    })
  }

  // Completion
  const finalState = buildRevState(n - 1, n, n, n, `✅ Reversed: ${[...vals].reverse().join(' → ')} → null`)
  finalState.nodes.forEach(node => node.highlight = 'found')
  finalState.nodes[n - 1].label = 'new head, prev'

  steps.push({
    line: 10,
    description: `return prev; // new head is ${vals[n-1]}`,
    variables: [
      { name: 'prev', value: vals[n-1], type: 'ListNode', scope: 'reverseList' },
      { name: 'reversed', value: [...vals].reverse().join(' → '), type: 'string', scope: 'reverseList' }
    ],
    callStack: [makeFrame('reverseList', 10, [])],
    heap: [],
    output: `[${[...vals].reverse().join(',')}]`,
    dsaState: finalState
  })

  return steps
}

export function genReorderList(values: number[]): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  const vals = values.length >= 2 ? values : [1, 2, 3, 4]
  const n = vals.length

  // Phase 1: slow/fast finding mid
  let slow = 0, fast = 1
  while (fast < n && fast + 1 < n) {
    const nodes: DSANode[] = vals.map((v, idx) => ({
      id: `ro-${idx}`,
      value: v,
      x: idx * 135 + 80,
      y: 140,
      highlight: idx === slow ? 'visited' : idx === fast ? 'swapping' : 'none',
      label: idx === slow && idx === fast ? 'slow, fast' : idx === slow ? 'slow' : idx === fast ? 'fast' : undefined
    }))
    const edges: DSAEdge[] = []
    for (let i = 0; i < n - 1; i++) {
      edges.push({ id: `e-ro-${i}`, from: `ro-${i}`, to: `ro-${i+1}`, directed: true })
    }

    steps.push({
      line: 4,
      description: `Find middle: slow at index ${slow} (${vals[slow]}), fast at index ${fast} (${vals[fast]})`,
      variables: [
        { name: 'slow', value: vals[slow], type: 'number', scope: 'reorderList' },
        { name: 'fast', value: vals[fast], type: 'number', scope: 'reorderList' }
      ],
      callStack: [makeFrame('reorderList', 4, [])],
      heap: [],
      output: '',
      dsaState: { type: 'linkedlist', nodes, edges, message: 'slow moves 1 step, fast moves 2 steps' }
    })

    slow += 1
    fast += 2
  }

  // Mid found step
  steps.push({
    line: 8,
    description: `Midpoint identified at index ${slow} (${vals[slow]}). Splitting list into two halves.`,
    variables: [{ name: 'mid', value: vals[slow], type: 'number', scope: 'reorderList' }],
    callStack: [makeFrame('reorderList', 8, [])],
    heap: [],
    output: '',
    dsaState: {
      type: 'linkedlist',
      nodes: vals.map((v, idx) => ({
        id: `ro-${idx}`,
        value: v,
        x: idx * 135 + 80,
        y: idx <= slow ? 90 : 200,
        highlight: idx === slow ? 'active' : 'none',
        label: idx === slow ? 'mid (cut)' : idx === slow + 1 ? 'second half' : undefined
      })),
      edges: [
        ...Array.from({ length: slow }, (_, i) => ({ id: `e-h1-${i}`, from: `ro-${i}`, to: `ro-${i+1}`, directed: true })),
        ...Array.from({ length: n - slow - 2 }, (_, i) => ({ id: `e-h2-${i}`, from: `ro-${slow+1+i}`, to: `ro-${slow+2+i}`, directed: true }))
      ],
      message: 'Cut list: slow.next = null'
    }
  })

  // Phase 2: Reverse second half
  const secondHalfVals = vals.slice(slow + 1)
  const revSecondVals = [...secondHalfVals].reverse()

  steps.push({
    line: 9,
    description: `Reversed second half: [${secondHalfVals.join(' → ')}] becomes [${revSecondVals.join(' → ')}]`,
    variables: [{ name: 'reversedHalf', value: revSecondVals.join(' → '), type: 'string', scope: 'reorderList' }],
    callStack: [makeFrame('reorderList', 9, [])],
    heap: [],
    output: '',
    dsaState: {
      type: 'linkedlist',
      nodes: [
        ...vals.slice(0, slow + 1).map((v, i) => ({ id: `ro-${i}`, value: v, x: i * 135 + 80, y: 90, highlight: 'none' as const, label: i === 0 ? 'first' : undefined })),
        ...revSecondVals.map((v, i) => ({ id: `ro-rev-${i}`, value: v, x: i * 135 + 80, y: 200, highlight: 'visited' as const, label: i === 0 ? 'second' : undefined }))
      ],
      edges: [
        ...Array.from({ length: slow }, (_, i) => ({ id: `e-h1-${i}`, from: `ro-${i}`, to: `ro-${i+1}`, directed: true })),
        ...Array.from({ length: revSecondVals.length - 1 }, (_, i) => ({ id: `e-rev-${i}`, from: `ro-rev-${i}`, to: `ro-rev-${i+1}`, directed: true }))
      ],
      message: 'Second half reversed: ready to merge alternate nodes'
    }
  })

  // Phase 3: Alternating merge
  const reordered: number[] = []
  let p1 = 0, p2 = 0
  const firstHalf = vals.slice(0, slow + 1)
  while (p1 < firstHalf.length || p2 < revSecondVals.length) {
    if (p1 < firstHalf.length) {
      reordered.push(firstHalf[p1])
      p1++
    }
    if (p2 < revSecondVals.length) {
      reordered.push(revSecondVals[p2])
      p2++
    }
  }

  // Interleave step
  steps.push({
    line: 15,
    description: 'Weave alternate nodes: first.next = second; second.next = tmp1;',
    variables: [{ name: 'order', value: reordered.join(' → '), type: 'string', scope: 'reorderList' }],
    callStack: [makeFrame('reorderList', 15, [])],
    heap: [],
    output: '',
    dsaState: {
      type: 'linkedlist',
      nodes: reordered.map((v, idx) => ({
        id: `fin-${idx}`,
        value: v,
        x: idx * 135 + 80,
        y: 140,
        highlight: 'active' as const
      })),
      edges: Array.from({ length: reordered.length - 1 }, (_, i) => ({
        id: `e-fin-${i}`,
        from: `fin-${i}`,
        to: `fin-${i+1}`,
        directed: true
      })),
      message: `Interleaved: ${reordered.join(' → ')}`
    }
  })

  // Final step
  const finalState: DSAState = {
    type: 'linkedlist',
    nodes: reordered.map((v, idx) => ({
      id: `fin-${idx}`,
      value: v,
      x: idx * 135 + 80,
      y: 140,
      highlight: 'found' as const,
      label: idx === 0 ? 'head' : undefined
    })),
    edges: Array.from({ length: reordered.length - 1 }, (_, i) => ({
      id: `e-fin-${i}`,
      from: `fin-${i}`,
      to: `fin-${i+1}`,
      directed: true
    })),
    message: `✅ Reorder complete: ${reordered.join(' → ')} → null`
  }

  steps.push({
    line: 18,
    description: `Reorder finished: ${reordered.join(' → ')} → null`,
    variables: [{ name: 'result', value: reordered.join(', '), type: 'string', scope: 'reorderList' }],
    callStack: [makeFrame('reorderList', 18, [])],
    heap: [],
    output: `[${reordered.join(',')}]`,
    dsaState: finalState
  })

  return steps
}

export function genHasCycle(values: number[], cyclePos: number = 1): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  const vals = values.length >= 2 ? values : [3, 2, 0, -4]
  const n = vals.length
  const pos = cyclePos >= -1 && cyclePos < n ? cyclePos : 1

  const buildCycleState = (slowIdx: number, fastIdx: number, stepMsg: string, isCollision: boolean = false): DSAState => {
    const nodes: DSANode[] = vals.map((v, idx) => {
      let hl: DSANode['highlight'] = 'none'
      const labels: string[] = []

      if (isCollision && idx === slowIdx && idx === fastIdx) {
        labels.push('slow', 'fast')
        hl = 'found'
      } else if (idx === slowIdx && idx === fastIdx) {
        labels.push('head')
        hl = 'active'
      } else if (idx === slowIdx) {
        labels.push('slow')
        hl = 'visited'
      } else if (idx === fastIdx) {
        labels.push('fast')
        hl = 'swapping'
      }

      return {
        id: `c-node-${idx}`,
        value: v,
        x: idx * 135 + 80,
        y: 140,
        highlight: hl,
        label: labels.length > 0 ? labels.join(', ') : undefined
      }
    })

    const edges: DSAEdge[] = []
    // Forward links
    for (let i = 0; i < n - 1; i++) {
      edges.push({ id: `e-c-${i}`, from: `c-node-${i}`, to: `c-node-${i+1}`, directed: true })
    }

    // Cycle link
    if (pos >= 0 && pos < n) {
      edges.push({
        id: 'e-cycle-tail',
        from: `c-node-${n-1}`,
        to: `c-node-${pos}`,
        directed: true,
        highlight: true,
        label: 'cycle'
      })
    }

    return { type: 'linkedlist', nodes, edges, message: stepMsg }
  }

  // Step 1: Start
  steps.push({
    line: 1,
    description: `hasCycle(head) — checking for cycle in list with tail pointing to index ${pos}`,
    variables: [
      { name: 'head', value: vals[0], type: 'ListNode', scope: 'hasCycle' },
      { name: 'cyclePos', value: pos, type: 'number', scope: 'hasCycle' }
    ],
    callStack: [makeFrame('hasCycle', 1, [])],
    heap: [],
    output: '',
    dsaState: buildCycleState(0, 0, `Initialize slow and fast at head (val: ${vals[0]})`)
  })

  let slow = 0, fast = 0
  let stepCount = 0
  const maxSteps = 15

  while (stepCount < maxSteps) {
    stepCount++

    // Advance slow by 1
    if (slow === n - 1 && pos >= 0) {
      slow = pos
    } else {
      slow += 1
    }

    // Advance fast by 2
    for (let k = 0; k < 2; k++) {
      if (fast === n - 1 && pos >= 0) {
        fast = pos
      } else if (fast < n - 1) {
        fast += 1
      } else {
        fast = -1
        break
      }
    }

    if (fast === -1) {
      // Reached null — no cycle
      steps.push({
        line: 8,
        description: 'fast reached null — no cycle in the linked list',
        variables: [
          { name: 'slow', value: slow < n ? vals[slow] : 'null', type: 'number', scope: 'hasCycle' },
          { name: 'fast', value: null, type: 'null', scope: 'hasCycle' }
        ],
        callStack: [makeFrame('hasCycle', 8, [])],
        heap: [],
        output: 'false',
        dsaState: buildCycleState(slow, -1, 'fast pointer reached null: no cycle')
      })
      break
    }

    steps.push({
      line: 6,
      description: `slow advanced to node ${vals[slow]} (idx: ${slow}), fast advanced to node ${vals[fast]} (idx: ${fast})`,
      variables: [
        { name: 'slow', value: vals[slow], type: 'number', scope: 'hasCycle' },
        { name: 'fast', value: vals[fast], type: 'number', scope: 'hasCycle' }
      ],
      callStack: [makeFrame('hasCycle', 6, [])],
      heap: [],
      output: '',
      dsaState: buildCycleState(slow, fast, `slow = ${vals[slow]}, fast = ${vals[fast]}`)
    })

    if (slow === fast) {
      steps.push({
        line: 7,
        description: `⚡ slow === fast! Both pointers met at node with value ${vals[slow]} (index ${slow}). Cycle detected!`,
        variables: [
          { name: 'slow', value: vals[slow], type: 'number', scope: 'hasCycle' },
          { name: 'fast', value: vals[fast], type: 'number', scope: 'hasCycle' },
          { name: 'hasCycle', value: true, type: 'boolean', scope: 'hasCycle' }
        ],
        callStack: [makeFrame('hasCycle', 7, [])],
        heap: [],
        output: 'true',
        dsaState: buildCycleState(slow, fast, `✅ Cycle Detected! slow and fast met at node (${vals[slow]})`, true)
      })
      break
    }
  }

  return steps
}

export function genRemoveNthFromEnd(values: number[], n: number = 2): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  const vals = values.length ? values : [1, 2, 3, 4, 5]
  const total = vals.length
  const nParam = Math.max(1, Math.min(n, total))
  const targetRemoveIdx = total - nParam

  const buildRemoveState = (
    slowSlot: number,
    fastSlot: number,
    removed: boolean,
    stepMsg: string
  ): DSAState => {
    const nodes: DSANode[] = []
    const edges: DSAEdge[] = []

    // Dummy node
    const dummyLabels: string[] = []
    if (slowSlot === -1) dummyLabels.push('slow')
    if (fastSlot === -1) dummyLabels.push('fast')
    nodes.push({
      id: 'n-dummy',
      value: 0,
      x: 70,
      y: 140,
      highlight: dummyLabels.length > 0 ? 'active' : 'none',
      label: dummyLabels.length > 0 ? `dummy, ${dummyLabels.join(', ')}` : 'dummy'
    })

    // List nodes
    vals.forEach((v, idx) => {
      const isTarget = idx === targetRemoveIdx
      const labels: string[] = []
      let hl: DSANode['highlight'] = 'none'

      if (idx === slowSlot) {
        labels.push('slow')
        hl = 'visited'
      }
      if (idx === fastSlot) {
        labels.push('fast')
        hl = 'swapping'
      }
      if (removed && isTarget) {
        labels.push('removed')
        hl = 'skipped'
      } else if (!removed && isTarget && fastSlot === total) {
        labels.push('target')
        hl = 'comparing'
      }

      nodes.push({
        id: `node-${idx}`,
        value: v,
        x: (idx + 1) * 125 + 70,
        y: 140,
        highlight: hl,
        label: labels.length > 0 ? labels.join(', ') : undefined
      })
    })

    // Edges
    if (!removed) {
      edges.push({ id: 'e-d-0', from: 'n-dummy', to: 'node-0', directed: true })
      for (let i = 0; i < total - 1; i++) {
        edges.push({ id: `e-${i}`, from: `node-${i}`, to: `node-${i+1}`, directed: true })
      }
    } else {
      if (targetRemoveIdx === 0) {
        if (total > 1) {
          edges.push({ id: 'e-skip-d', from: 'n-dummy', to: 'node-1', directed: true, highlight: true })
        }
      } else {
        edges.push({ id: 'e-d-0', from: 'n-dummy', to: 'node-0', directed: true })
        for (let i = 0; i < total - 1; i++) {
          if (i === targetRemoveIdx - 1) {
            if (i + 2 < total) {
              edges.push({ id: `e-skip-${i}`, from: `node-${i}`, to: `node-${i+2}`, directed: true, highlight: true })
            }
          } else if (i !== targetRemoveIdx) {
            edges.push({ id: `e-${i}`, from: `node-${i}`, to: `node-${i+1}`, directed: true })
          }
        }
      }
    }

    return { type: 'linkedlist', nodes, edges, message: stepMsg }
  }

  // Step 1: Start with dummy
  steps.push({
    line: 1,
    description: `removeNthFromEnd(head, ${nParam}) — remove node ${nParam} from end of [${vals.join(' → ')}]`,
    variables: [
      { name: 'head', value: vals[0], type: 'ListNode', scope: 'removeNthFromEnd' },
      { name: 'n', value: nParam, type: 'number', scope: 'removeNthFromEnd' }
    ],
    callStack: [makeFrame('removeNthFromEnd', 1, [])],
    heap: [],
    output: '',
    dsaState: buildRemoveState(-1, -1, false, `Create dummy node (val: 0) pointing to head`)
  })

  // Phase 1: advance fast nParam + 1 times
  let fast = -1
  for (let step = 0; step <= nParam; step++) {
    fast = step - 1
    steps.push({
      line: 6,
      description: `Advance fast pointer: step ${step} of ${nParam} (fast is at ${fast === -1 ? 'dummy' : `node ${vals[fast]}`})`,
      variables: [
        { name: 'fast', value: fast === -1 ? 'dummy' : vals[fast], type: 'ListNode', scope: 'removeNthFromEnd' },
        { name: 'slow', value: 'dummy', type: 'ListNode', scope: 'removeNthFromEnd' }
      ],
      callStack: [makeFrame('removeNthFromEnd', 6, [])],
      heap: [],
      output: '',
      dsaState: buildRemoveState(-1, fast, false, `Fast pointer advanced ${step + 1} steps ahead of slow`)
    })
  }

  // Phase 2: Move slow and fast together until fast === null
  let slow = -1
  while (fast < total - 1) {
    slow++
    fast++
    steps.push({
      line: 9,
      description: `Move both pointers: slow at ${slow === -1 ? 'dummy' : `node ${vals[slow]}`}, fast at ${fast === -1 ? 'dummy' : `node ${vals[fast]}`}`,
      variables: [
        { name: 'slow', value: slow === -1 ? 'dummy' : vals[slow], type: 'ListNode', scope: 'removeNthFromEnd' },
        { name: 'fast', value: fast === -1 ? 'dummy' : vals[fast], type: 'ListNode', scope: 'removeNthFromEnd' }
      ],
      callStack: [makeFrame('removeNthFromEnd', 9, [])],
      heap: [],
      output: '',
      dsaState: buildRemoveState(slow, fast, false, `Synchronized step: gap of ${nParam} maintained`)
    })
  }

  // Final move: fast reaches null
  slow++
  fast = total
  steps.push({
    line: 8,
    description: `fast reached null! slow is at ${slow === -1 ? 'dummy' : `node ${vals[slow]}`} (predecessor of target node ${vals[targetRemoveIdx]})`,
    variables: [
      { name: 'slow', value: slow === -1 ? 'dummy' : vals[slow], type: 'ListNode', scope: 'removeNthFromEnd' },
      { name: 'fast', value: null, type: 'null', scope: 'removeNthFromEnd' },
      { name: 'nodeToRemove', value: vals[targetRemoveIdx], type: 'number', scope: 'removeNthFromEnd' }
    ],
    callStack: [makeFrame('removeNthFromEnd', 8, [])],
    heap: [],
    output: '',
    dsaState: buildRemoveState(slow, fast, false, `slow is immediately before target node ${vals[targetRemoveIdx]}`)
  })

  // Phase 3: Rewire slow.next = slow.next.next (skip node)
  steps.push({
    line: 12,
    description: `✂️ slow.next = slow.next.next; // bypassed node ${vals[targetRemoveIdx]}`,
    variables: [
      { name: 'slow', value: slow === -1 ? 'dummy' : vals[slow], type: 'ListNode', scope: 'removeNthFromEnd' },
      { name: 'removedNode', value: vals[targetRemoveIdx], type: 'number', scope: 'removeNthFromEnd' }
    ],
    callStack: [makeFrame('removeNthFromEnd', 12, [])],
    heap: [],
    output: '',
    dsaState: buildRemoveState(slow, fast, true, `Bypassed node ${vals[targetRemoveIdx]}`)
  })

  // Phase 4: Return dummy.next
  const remainingVals = vals.filter((_, idx) => idx !== targetRemoveIdx)
  const finalState = buildRemoveState(-1, fast, true, `✅ Node ${vals[targetRemoveIdx]} removed. List: ${remainingVals.join(' → ')} → null`)
  finalState.nodes.forEach(n => {
    if (n.id !== 'n-dummy' && !n.label?.includes('removed')) {
      n.highlight = 'found'
    }
  })

  steps.push({
    line: 13,
    description: `return dummy.next; // [${remainingVals.join(', ')}]`,
    variables: [{ name: 'result', value: remainingVals.join(' → '), type: 'string', scope: 'removeNthFromEnd' }],
    callStack: [makeFrame('removeNthFromEnd', 13, [])],
    heap: [],
    output: `[${remainingVals.join(',')}]`,
    dsaState: finalState
  })

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
  const validation = validateBinarySearchInput(nums, target)
  if (!validation.valid) return [createErrorStep(validation.error)]

  const steps: ExecutionStep[] = []
  let left = 0, right = nums.length - 1, comps = 0

  const snap = (desc: string, l: number, r: number, mid: number | null, found: boolean, insertIdx?: number): ExecutionStep => ({
    line: 1, description: desc,
    variables: [
      { name: 'left', value: l, type: 'number', scope: 'searchInsert', changed: true },
      { name: 'right', value: r, type: 'number', scope: 'searchInsert', changed: true },
      { name: 'mid', value: mid ?? '—', type: 'number', scope: 'searchInsert' },
      { name: 'target', value: target, type: 'number', scope: 'searchInsert' },
      { name: 'comparisons', value: comps, type: 'number', scope: 'searchInsert' },
    ],
    callStack: [makeFrame('searchInsert', 1, [], true)],
    heap: [], output: insertIdx !== undefined ? String(insertIdx) : '',
    dsaState: {
      type: 'array',
      nodes: nums.map((v, i) => {
        const isEliminated = i < l || i > r
        const isMid = mid !== null && i === mid
        let highlight: DSANode['highlight'] = 'none'
        if (insertIdx !== undefined && i === insertIdx) {
          highlight = 'found'
        } else if (isMid) {
          highlight = found ? 'found' : 'comparing'
        } else if (isEliminated) {
          highlight = 'skipped'
        } else if (i >= l && i <= r) {
          highlight = 'active'
        }
        return { id: `si${i}`, value: v, highlight }
      }),
      comparisons: comps,
      rangeStart: l,
      rangeEnd: r,
      pointer: mid !== null ? mid : undefined,
      pointerName: 'mid',
      pointer2: l >= 0 && l < nums.length ? l : undefined,
      pointer2Name: 'L',
      pointer3: r >= 0 && r < nums.length ? r : undefined,
      pointer3Name: 'R',
      auxiliaryData: {
        isSearch: true,
        renderAs: 'boxes',
        target,
        trackingVars: {
          target,
          left: l,
          right: r,
          mid: mid !== null ? mid : '—',
          'nums[mid]': mid !== null && nums[mid] !== undefined ? nums[mid] : '—',
        }
      },
      message: desc,
    }
  })

  steps.push(snap(`🚀 Search Insert Position for target=${target} in [${nums.join(', ')}]`, left, right, null, false))

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    comps++
    steps.push(snap(
      `🔍 Search range [${left}..${right}] → mid=${mid}, nums[mid]=${nums[mid]} vs target=${target}`,
      left, right, mid, false))

    if (nums[mid] === target) {
      steps.push(snap(`🎉 Found target=${target} at index ${mid}! ✅`, left, right, mid, true, mid))
      return steps
    } else if (nums[mid] < target) {
      steps.push(snap(
        `➡ nums[${mid}]=${nums[mid]} < ${target} → target must be in right half → set left = ${mid + 1}`,
        mid + 1, right, mid, false))
      left = mid + 1
    } else {
      steps.push(snap(
        `⬅ nums[${mid}]=${nums[mid]} > ${target} → target must be in left half → set right = ${mid - 1}`,
        left, mid - 1, mid, false))
      right = mid - 1
    }
  }

  steps.push(snap(
    `📌 Target ${target} not in array → insert at index ${left} to keep sorted order! ✅`,
    left, right, null, false, left))
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
    // Default: highlight window as active, everything else gray
    if (!hl) {
      for (let i = 0; i < chars.length; i++) {
        if (i >= l && i <= r) highlights[i] = 'active'
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
        if (i < left) hlDup[i] = 'none'           // passed — gray
        else if (i === right) hlDup[i] = 'swapping' // duplicate — red
        else if (i >= left && i < right) hlDup[i] = 'active'  // current window — cyan
        else hlDup[i] = 'none'                     // not yet reached — gray
      }
      steps.push(snap(`'${char}' already in Set! Shrink window from left`, left, right, hlDup))

      // Shrink window until duplicate is removed
      while (set.has(char)) {
        const removed = chars[left]
        set.delete(removed)
        left++
        const hlShrink: Record<number, DSANode['highlight']> = {}
        for (let i = 0; i < chars.length; i++) {
          if (i < left) hlShrink[i] = 'none'       // passed — gray
          else if (i === left - 1) hlShrink[i] = 'none' // just removed — gray
          else if (i === right) hlShrink[i] = 'comparing' // waiting to add — amber
          else if (i >= left && i < right) hlShrink[i] = 'active' // remaining window — cyan
          else hlShrink[i] = 'none'                 // not yet reached — gray
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
      if (i >= left && i <= right) hlAdd[i] = 'found'  // valid window — green
      else hlAdd[i] = 'none'                            // everything else — gray
    }
    steps.push(snap(
      `Add '${char}'. Window "${chars.slice(left, right + 1).join('')}" len=${windowLen}, maxLength=${maxLen}`,
      left, right, hlAdd
    ))
  }

  // Final result — only highlight the best substring, everything else gray
  const hlFinal: Record<number, DSANode['highlight']> = {}
  for (let i = 0; i < chars.length; i++) {
    if (i >= bestLeft && i <= bestRight) hlFinal[i] = 'found'
    else hlFinal[i] = 'none'
  }
  steps.push(snap(
    `✅ Longest substring: "${chars.slice(bestLeft, bestRight + 1).join('')}" (length ${maxLen})`,
    bestLeft, bestRight, hlFinal
  ))

  return steps
}

// ─── GENERATORS: Tree & BST Visualizers ──────────────────────────────────────

export interface SimTreeNode {
  id: string
  val: number
  left: SimTreeNode | null
  right: SimTreeNode | null
}

export function buildTreeFromLevelOrder(arr: (number | null)[]): SimTreeNode | null {
  if (!arr.length || arr[0] === null || arr[0] === undefined) return null
  const root: SimTreeNode = { id: `t-0-${arr[0]}`, val: arr[0], left: null, right: null }
  const queue: SimTreeNode[] = [root]
  let i = 1
  while (queue.length > 0 && i < arr.length) {
    const curr = queue.shift()!
    if (i < arr.length && arr[i] !== null && arr[i] !== undefined) {
      curr.left = { id: `t-${i}-${arr[i]}`, val: arr[i]!, left: null, right: null }
      queue.push(curr.left)
    }
    i++
    if (i < arr.length && arr[i] !== null && arr[i] !== undefined) {
      curr.right = { id: `t-${i}-${arr[i]}`, val: arr[i]!, left: null, right: null }
      queue.push(curr.right)
    }
    i++
  }
  return root
}

export function treeToDSANodes(
  root: SimTreeNode | null,
  highlights: Record<string, DSANode['highlight']> = {},
  labels: Record<string, string> = {}
): { nodes: DSANode[]; edges: DSAEdge[] } {
  if (!root) return { nodes: [], edges: [] }
  const rawNodes: DSANode[] = []
  const rawEdges: DSAEdge[] = []

  const traverse = (node: SimTreeNode) => {
    rawNodes.push({
      id: node.id,
      value: node.val,
      left: node.left ? node.left.id : undefined,
      right: node.right ? node.right.id : undefined,
      highlight: highlights[node.id] || 'none',
      label: labels[node.id],
    })
    if (node.left) {
      rawEdges.push({
        id: `e-${node.id}-${node.left.id}`,
        from: node.id,
        to: node.left.id,
        directed: true,
        label: 'L',
      })
      traverse(node.left)
    }
    if (node.right) {
      rawEdges.push({
        id: `e-${node.id}-${node.right.id}`,
        from: node.id,
        to: node.right.id,
        directed: true,
        label: 'R',
      })
      traverse(node.right)
    }
  }
  traverse(root)
  return computeTreeLayout(rawNodes, rawEdges, { width: 640, height: 380 })
}

export function genInvertTree(initialValues?: (number | null)[]): ExecutionStep[] {
  const values = initialValues && initialValues.length ? initialValues : [4, 2, 7, 1, 3, 6, 9]
  const root = buildTreeFromLevelOrder(values)
  if (!root) return []
  const steps: ExecutionStep[] = []
  const highlights: Record<string, DSANode['highlight']> = {}

  const snap = (desc: string, line: number, current?: SimTreeNode, swapping?: SimTreeNode[]) => {
    const hl = { ...highlights }
    if (current) hl[current.id] = 'active'
    if (swapping) swapping.forEach(s => { hl[s.id] = 'swapping' })
    const { nodes, edges } = treeToDSANodes(root, hl)
    steps.push({
      line,
      description: desc,
      variables: current ? [{ name: 'root', value: current.val, type: 'TreeNode', scope: 'invertTree', changed: true }] : [],
      callStack: [makeFrame('main', 1, []), makeFrame('invertTree', line, [], true)],
      heap: [],
      output: '',
      dsaState: {
        type: 'tree',
        nodes,
        edges,
        message: desc,
      }
    })
  }

  snap('Initialize Binary Tree for Inversion', 1, root)

  function invert(node: SimTreeNode | null): SimTreeNode | null {
    if (!node) return null
    snap(`Visiting node ${node.val}: invert left & right subtrees`, 3, node)

    if (node.left) invert(node.left)
    if (node.right) invert(node.right)

    // Swap children
    const leftChild = node.left
    const rightChild = node.right
    const childrenToSwap = [leftChild, rightChild].filter(Boolean) as SimTreeNode[]
    if (childrenToSwap.length > 0) {
      snap(`Swap left (${leftChild?.val ?? 'null'}) and right (${rightChild?.val ?? 'null'}) of node ${node.val}`, 6, node, childrenToSwap)
    }

    const temp = node.left
    node.left = node.right
    node.right = temp

    highlights[node.id] = 'visited'
    snap(`Subtree at node ${node.val} successfully inverted`, 7, node)
    return node
  }

  invert(root)

  // Mark all found
  const allHl: Record<string, DSANode['highlight']> = {}
  const markAll = (n: SimTreeNode | null) => {
    if (!n) return
    allHl[n.id] = 'found'
    markAll(n.left)
    markAll(n.right)
  }
  markAll(root)
  const finalLayout = treeToDSANodes(root, allHl)
  steps.push({
    line: 8,
    description: '✅ Invert Binary Tree complete: all subtrees mirrored!',
    variables: [{ name: 'invertedRoot', value: root.val, type: 'TreeNode', scope: 'main', changed: true }],
    callStack: [makeFrame('main', 8, [], true)],
    heap: [],
    output: `Tree inverted. New root: ${root.val}`,
    dsaState: {
      type: 'tree',
      nodes: finalLayout.nodes,
      edges: finalLayout.edges,
      message: '✅ Binary Tree successfully inverted',
    }
  })

  return steps
}

export function genMaxDepth(initialValues?: (number | null)[]): ExecutionStep[] {
  const values = initialValues && initialValues.length ? initialValues : [3, 9, 20, null, null, 15, 7]
  const root = buildTreeFromLevelOrder(values)
  if (!root) return []
  const steps: ExecutionStep[] = []
  const highlights: Record<string, DSANode['highlight']> = {}
  const labels: Record<string, string> = {}

  const snap = (desc: string, line: number, current?: SimTreeNode) => {
    const hl = { ...highlights }
    if (current) hl[current.id] = 'active'
    const { nodes, edges } = treeToDSANodes(root, hl, labels)
    steps.push({
      line,
      description: desc,
      variables: current ? [{ name: 'node', value: current.val, type: 'TreeNode', scope: 'maxDepth' }] : [],
      callStack: [makeFrame('main', 1, []), makeFrame('maxDepth', line, [], true)],
      heap: [],
      output: '',
      dsaState: {
        type: 'tree',
        nodes,
        edges,
        message: desc,
      }
    })
  }

  snap('Initialize tree to calculate Maximum Depth', 1, root)

  function dfs(node: SimTreeNode | null, d: number): number {
    if (!node) return 0
    snap(`DFS visit node ${node.val} at depth ${d}`, 3, node)

    const leftDepth = dfs(node.left, d + 1)
    const rightDepth = dfs(node.right, d + 1)
    const curDepth = 1 + Math.max(leftDepth, rightDepth)

    labels[node.id] = `depth:${curDepth}`
    highlights[node.id] = 'visited'
    snap(`node ${node.val}: 1 + max(left=${leftDepth}, right=${rightDepth}) = ${curDepth}`, 6, node)
    return curDepth
  }

  const maxD = dfs(root, 1)

  // Highlight deepest path
  let currPath: SimTreeNode | null = root
  while (currPath) {
    highlights[currPath.id] = 'found'
    labels[currPath.id] = `depth:${labels[currPath.id]?.replace('depth:', '')} ★`
    const lD: number = currPath.left ? parseInt(labels[currPath.left.id]?.replace('depth:', '') || '0', 10) : 0
    const rD: number = currPath.right ? parseInt(labels[currPath.right.id]?.replace('depth:', '') || '0', 10) : 0
    currPath = lD >= rD ? currPath.left : currPath.right
  }

  const { nodes, edges } = treeToDSANodes(root, highlights, labels)
  steps.push({
    line: 8,
    description: `✅ Maximum Depth = ${maxD}`,
    variables: [{ name: 'maxDepth', value: maxD, type: 'number', scope: 'main', changed: true }],
    callStack: [makeFrame('main', 8, [], true)],
    heap: [],
    output: `Max depth: ${maxD}`,
    dsaState: {
      type: 'tree',
      nodes,
      edges,
      message: `✅ Maximum Depth = ${maxD}`,
    }
  })

  return steps
}

export function genSameTree(
  pValues?: (number | null)[],
  qValues?: (number | null)[]
): ExecutionStep[] {
  const pArr = pValues && pValues.length ? pValues : [1, 2, 3]
  const qArr = qValues && qValues.length ? qValues : [1, 2, 3]
  const rootP = buildTreeFromLevelOrder(pArr)
  const rootQ = buildTreeFromLevelOrder(qArr)
  if (!rootP || !rootQ) return []

  const renameTree = (n: SimTreeNode | null, prefix: string) => {
    if (!n) return
    n.id = `${prefix}-${n.id}`
    renameTree(n.left, prefix)
    renameTree(n.right, prefix)
  }
  renameTree(rootP, 'p')
  renameTree(rootQ, 'q')

  const steps: ExecutionStep[] = []
  const highlights: Record<string, DSANode['highlight']> = {}
  const labels: Record<string, string> = {
    [rootP.id]: 'Tree P (root)',
    [rootQ.id]: 'Tree Q (root)',
  }

  const renderBoth = (): { nodes: DSANode[]; edges: DSAEdge[] } => {
    const rawP = treeToDSANodes(rootP, highlights, labels)
    const rawQ = treeToDSANodes(rootQ, highlights, labels)
    const allRawNodes = [...rawP.nodes, ...rawQ.nodes]
    const allRawEdges = [...rawP.edges, ...rawQ.edges]
    return computeTreeLayout(allRawNodes, allRawEdges, { width: 700, height: 380 })
  }

  const snap = (desc: string, line: number, pNode?: SimTreeNode | null, qNode?: SimTreeNode | null) => {
    const { nodes, edges } = renderBoth()
    steps.push({
      line,
      description: desc,
      variables: [
        { name: 'p', value: pNode ? pNode.val : null, type: 'TreeNode', scope: 'isSameTree' },
        { name: 'q', value: qNode ? qNode.val : null, type: 'TreeNode', scope: 'isSameTree' },
      ],
      callStack: [makeFrame('main', 1, []), makeFrame('isSameTree', line, [], true)],
      heap: [],
      output: '',
      dsaState: {
        type: 'tree',
        nodes,
        edges,
        message: desc,
      }
    })
  }

  snap('Initialize comparison: Tree P and Tree Q', 1, rootP, rootQ)

  function compare(p: SimTreeNode | null, q: SimTreeNode | null): boolean {
    if (!p && !q) return true
    if (!p || !q) {
      if (p) highlights[p.id] = 'swapping'
      if (q) highlights[q.id] = 'swapping'
      snap(`❌ Structural mismatch: one node is null while the other is not`, 4, p, q)
      return false
    }

    highlights[p.id] = 'comparing'
    highlights[q.id] = 'comparing'
    snap(`Compare P(${p.val}) and Q(${q.val})`, 5, p, q)

    if (p.val !== q.val) {
      highlights[p.id] = 'swapping'
      highlights[q.id] = 'swapping'
      snap(`❌ Value mismatch: P(${p.val}) !== Q(${q.val})`, 6, p, q)
      return false
    }

    highlights[p.id] = 'found'
    highlights[q.id] = 'found'
    snap(`P(${p.val}) === Q(${q.val}) ✓ Values match! Now check left and right subtrees.`, 7, p, q)

    const leftSame = compare(p.left, q.left)
    if (!leftSame) return false
    const rightSame = compare(p.right, q.right)
    return rightSame
  }

  const result = compare(rootP, rootQ)
  const finalDesc = result
    ? '✅ Both trees are structurally and value identical: return true!'
    : '❌ Trees are not identical: return false!'

  const { nodes, edges } = renderBoth()
  steps.push({
    line: 10,
    description: finalDesc,
    variables: [{ name: 'result', value: result, type: 'boolean', scope: 'main', changed: true }],
    callStack: [makeFrame('main', 10, [], true)],
    heap: [],
    output: `Result: ${result}`,
    dsaState: {
      type: 'tree',
      nodes,
      edges,
      message: finalDesc,
    }
  })

  return steps
}

export function genLevelOrder(initialValues?: (number | null)[]): ExecutionStep[] {
  const values = initialValues && initialValues.length ? initialValues : [3, 9, 20, null, null, 15, 7]
  const root = buildTreeFromLevelOrder(values)
  if (!root) return []
  const steps: ExecutionStep[] = []
  const highlights: Record<string, DSANode['highlight']> = {}
  const labels: Record<string, string> = {}

  let queueItems: (string | number)[] = [root.val]

  const snap = (desc: string, line: number, activeNode?: SimTreeNode) => {
    const hl = { ...highlights }
    if (activeNode) hl[activeNode.id] = 'active'
    const { nodes, edges } = treeToDSANodes(root, hl, labels)
    steps.push({
      line,
      description: desc,
      variables: [
        { name: 'queue', value: [...queueItems], type: 'Array', scope: 'levelOrder' },
        ...(activeNode ? [{ name: 'current', value: activeNode.val, type: 'TreeNode', scope: 'levelOrder' }] : [])
      ],
      callStack: [makeFrame('main', 1, []), makeFrame('levelOrder', line, [], true)],
      heap: [],
      output: '',
      dsaState: {
        type: 'tree',
        nodes,
        edges,
        queueItems: [...queueItems],
        message: desc,
      }
    })
  }

  snap('Initialize BFS Queue with root', 1, root)

  const queue: SimTreeNode[] = [root]
  const result: number[][] = []
  let levelIdx = 0

  while (queue.length > 0) {
    const levelSize = queue.length
    const currentLevel: number[] = []
    snap(`Begin Level ${levelIdx} with ${levelSize} node(s)`, 4)

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift()!
      queueItems = queue.map(q => q.val)
      currentLevel.push(node.val)
      labels[node.id] = `L${levelIdx}`
      highlights[node.id] = 'active'
      snap(`Dequeue node ${node.val} into level ${levelIdx}`, 6, node)

      if (node.left) {
        queue.push(node.left)
        highlights[node.left.id] = 'comparing'
        queueItems = queue.map(q => q.val)
        snap(`Enqueue left child ${node.left.val}`, 8, node.left)
      }
      if (node.right) {
        queue.push(node.right)
        highlights[node.right.id] = 'comparing'
        queueItems = queue.map(q => q.val)
        snap(`Enqueue right child ${node.right.val}`, 10, node.right)
      }
      highlights[node.id] = 'visited'
    }

    result.push(currentLevel)
    snap(`Finished Level ${levelIdx}: [${currentLevel.join(', ')}]`, 12)
    levelIdx++
  }

  const allHl: Record<string, DSANode['highlight']> = {}
  const mark = (n: SimTreeNode | null) => {
    if (!n) return
    allHl[n.id] = 'found'
    mark(n.left)
    mark(n.right)
  }
  mark(root)

  const { nodes, edges } = treeToDSANodes(root, allHl, labels)
  steps.push({
    line: 14,
    description: `✅ Level Order Traversal: ${JSON.stringify(result)}`,
    variables: [{ name: 'result', value: result, type: 'Array', scope: 'main', changed: true }],
    callStack: [makeFrame('main', 14, [], true)],
    heap: [],
    output: `Result: ${JSON.stringify(result)}`,
    dsaState: {
      type: 'tree',
      nodes,
      edges,
      queueItems: [],
      message: `✅ Traversal: ${JSON.stringify(result)}`,
    }
  })

  return steps
}

export function genValidateBST(initialValues?: (number | null)[]): ExecutionStep[] {
  const values = initialValues && initialValues.length ? initialValues : [2, 1, 3]
  const root = buildTreeFromLevelOrder(values)
  if (!root) return []
  const steps: ExecutionStep[] = []
  const highlights: Record<string, DSANode['highlight']> = {}
  const labels: Record<string, string> = {}

  const snap = (desc: string, line: number, curr?: SimTreeNode, isViolation?: boolean) => {
    const hl = { ...highlights }
    if (curr) hl[curr.id] = isViolation ? 'swapping' : 'active'
    const { nodes, edges } = treeToDSANodes(root, hl, labels)
    steps.push({
      line,
      description: desc,
      variables: curr ? [
        { name: 'node', value: curr.val, type: 'TreeNode', scope: 'isValidBST' },
        { name: 'range', value: labels[curr.id] || '', type: 'string', scope: 'isValidBST' }
      ] : [],
      callStack: [makeFrame('main', 1, []), makeFrame('isValidBST', line, [], true)],
      heap: [],
      output: '',
      dsaState: {
        type: 'tree',
        nodes,
        edges,
        message: desc,
      }
    })
  }

  snap('Initialize BST validation with bounds (-∞, +∞)', 1, root)

  function validate(node: SimTreeNode | null, min: number, max: number): boolean {
    if (!node) return true

    const minStr = min === -Infinity ? '-∞' : String(min)
    const maxStr = max === Infinity ? '+∞' : String(max)
    labels[node.id] = `(${minStr}, ${maxStr})`

    snap(`Validate node ${node.val} within bounds (${minStr}, ${maxStr})`, 4, node)

    if (node.val <= min || node.val >= max) {
      highlights[node.id] = 'swapping'
      snap(`❌ Violation at node ${node.val}: not in (${minStr}, ${maxStr})!`, 5, node, true)
      return false
    }

    highlights[node.id] = 'visited'
    snap(`Node ${node.val} is valid. Validate left and right subtrees.`, 6, node)

    const leftValid = validate(node.left, min, node.val)
    if (!leftValid) return false
    const rightValid = validate(node.right, node.val, max)
    return rightValid
  }

  const result = validate(root, -Infinity, Infinity)

  if (result) {
    const markAll = (n: SimTreeNode | null) => {
      if (!n) return
      highlights[n.id] = 'found'
      markAll(n.left)
      markAll(n.right)
    }
    markAll(root)
  }

  const finalDesc = result
    ? '✅ Valid Binary Search Tree! All nodes satisfy min < val < max.'
    : '❌ Invalid Binary Search Tree: BST property violated.'

  const { nodes, edges } = treeToDSANodes(root, highlights, labels)
  steps.push({
    line: 10,
    description: finalDesc,
    variables: [{ name: 'isValid', value: result, type: 'boolean', scope: 'main', changed: true }],
    callStack: [makeFrame('main', 10, [], true)],
    heap: [],
    output: `Result: ${result}`,
    dsaState: {
      type: 'tree',
      nodes,
      edges,
      message: finalDesc,
    }
  })

  return steps
}

export function genKthSmallest(
  initialValues?: (number | null)[],
  k = 1
): ExecutionStep[] {
  const values = initialValues && initialValues.length ? initialValues : [3, 1, 4, null, 2]
  const root = buildTreeFromLevelOrder(values)
  if (!root) return []
  const steps: ExecutionStep[] = []
  const highlights: Record<string, DSANode['highlight']> = {}
  const labels: Record<string, string> = {}

  let count = 0
  let answer: number | null = null

  const snap = (desc: string, line: number, curr?: SimTreeNode, isFound?: boolean) => {
    const hl = { ...highlights }
    if (curr) hl[curr.id] = isFound ? 'found' : 'active'
    const { nodes, edges } = treeToDSANodes(root, hl, labels)
    steps.push({
      line,
      description: desc,
      variables: [
        { name: 'k', value: k, type: 'number', scope: 'kthSmallest' },
        { name: 'count', value: count, type: 'number', scope: 'kthSmallest' },
        ...(curr ? [{ name: 'current', value: curr.val, type: 'TreeNode', scope: 'kthSmallest' }] : [])
      ],
      callStack: [makeFrame('main', 1, []), makeFrame('kthSmallest', line, [], true)],
      heap: [],
      output: '',
      dsaState: {
        type: 'tree',
        nodes,
        edges,
        message: desc,
      }
    })
  }

  snap(`Initialize in-order traversal to find k=${k} smallest element`, 1, root)

  function inorder(node: SimTreeNode | null) {
    if (!node || answer !== null) return

    inorder(node.left)
    if (answer !== null) return

    count++
    labels[node.id] = `#${count}`
    if (count === k) {
      answer = node.val
      highlights[node.id] = 'found'
      labels[node.id] = `k=${k} (Answer)`
      snap(`🎯 Node ${node.val} is the ${k}-th visited in in-order! FOUND!`, 7, node, true)
      return
    }

    highlights[node.id] = 'visited'
    snap(`In-order visit #${count}: node ${node.val} (looking for k=${k})`, 8, node)

    inorder(node.right)
  }

  inorder(root)

  const finalDesc = answer !== null
    ? `✅ The ${k}-th smallest element in the BST is ${answer}`
    : `Finished traversal.`

  const { nodes, edges } = treeToDSANodes(root, highlights, labels)
  steps.push({
    line: 12,
    description: finalDesc,
    variables: [{ name: 'result', value: answer, type: 'number', scope: 'main', changed: true }],
    callStack: [makeFrame('main', 12, [], true)],
    heap: [],
    output: `kthSmallest: ${answer}`,
    dsaState: {
      type: 'tree',
      nodes,
      edges,
      message: finalDesc,
    }
  })

  return steps
}

// ─── GENERATORS: Heap, Knapsack, N-Queens ──────────────────────────────────

export function genHeap(
  ops?: Array<{ op: 'insert' | 'extract'; val?: number }>,
  isMaxHeap = false
): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  const heap: number[] = []
  const opList = ops && ops.length > 0 ? ops : [
    { op: 'insert' as const, val: 30 },
    { op: 'insert' as const, val: 20 },
    { op: 'insert' as const, val: 40 },
    { op: 'insert' as const, val: 10 },
    { op: 'insert' as const, val: 15 },
    { op: 'insert' as const, val: 5 },
    { op: 'extract' as const }
  ]

  let comparisons = 0
  let swaps = 0

  const snap = (
    desc: string,
    activeIdx?: number,
    comparingIdx?: number,
    swappingIdx?: number
  ): ExecutionStep => {
    const rawNodes = heap.map((val, i) => {
      let highlight: DSANode['highlight'] = 'none'
      if (i === swappingIdx || (swappingIdx !== undefined && i === activeIdx)) {
        highlight = 'swapping'
      } else if (i === comparingIdx || (comparingIdx !== undefined && i === activeIdx)) {
        highlight = 'comparing'
      } else if (i === activeIdx) {
        highlight = 'active'
      }
      return {
        id: `heap-n-${i}`,
        value: val,
        highlight,
        label: i === 0 ? 'root' : `[${i}]`,
      }
    })

    const { nodes, edges } = computeHeapLayout(rawNodes, { width: 620, height: 320 })

    return {
      line: 1,
      description: desc,
      variables: [
        { name: 'heap', value: [...heap], type: 'Array', scope: 'genHeap', changed: true },
        { name: 'comparisons', value: comparisons, type: 'number', scope: 'genHeap' },
        { name: 'swaps', value: swaps, type: 'number', scope: 'genHeap' },
      ],
      callStack: [makeFrame('heap', 1, [], true)],
      heap: [],
      output: '',
      dsaState: {
        type: 'heap',
        nodes,
        edges,
        comparisons,
        swaps,
        message: desc,
        auxiliaryData: {
          heapSize: heap.length,
          heapType: isMaxHeap ? 'Max-Heap' : 'Min-Heap',
          isMaxHeap,
        }
      }
    }
  }

  steps.push(snap(`Initialize empty ${isMaxHeap ? 'Max-Heap' : 'Min-Heap'}`))

  for (const { op, val } of opList) {
    if (op === 'insert' && val !== undefined) {
      heap.push(val)
      let curr = heap.length - 1
      steps.push(snap(`Insert ${val} at end of heap (index ${curr})`, curr))

      while (curr > 0) {
        const parent = Math.floor((curr - 1) / 2)
        comparisons++
        steps.push(snap(`Compare child ${heap[curr]} (idx ${curr}) with parent ${heap[parent]} (idx ${parent})`, curr, parent))

        const shouldSwap = isMaxHeap ? heap[curr] > heap[parent] : heap[curr] < heap[parent]
        if (shouldSwap) {
          swaps++
          steps.push(snap(`Swap child ${heap[curr]} and parent ${heap[parent]} to restore heap order`, curr, undefined, parent))
          const temp = heap[curr]
          heap[curr] = heap[parent]
          heap[parent] = temp
          curr = parent
          steps.push(snap(`After swap: value ${heap[curr]} is now at parent index ${curr}`, curr))
        } else {
          steps.push(snap(`Heap order satisfied: child ${heap[curr]} vs parent ${heap[parent]}`, curr))
          break
        }
      }
      steps.push(snap(`Heap after inserting ${val}`))
    } else if (op === 'extract' && heap.length > 0) {
      const rootVal = heap[0]
      steps.push(snap(`Extract root (${isMaxHeap ? 'max' : 'min'}): ${rootVal}`, 0))
      const last = heap.pop()!
      if (heap.length > 0) {
        heap[0] = last
        let curr = 0
        steps.push(snap(`Move last element ${last} to root index 0`, curr))

        while (true) {
          const left = 2 * curr + 1
          const right = 2 * curr + 2
          let target = curr

          if (left < heap.length) {
            comparisons++
            steps.push(snap(`Compare current ${heap[curr]} with left child ${heap[left]}`, curr, left))
            const leftBetter = isMaxHeap ? heap[left] > heap[target] : heap[left] < heap[target]
            if (leftBetter) target = left
          }
          if (right < heap.length) {
            comparisons++
            steps.push(snap(`Compare current ${heap[target]} with right child ${heap[right]}`, target, right))
            const rightBetter = isMaxHeap ? heap[right] > heap[target] : heap[right] < heap[target]
            if (rightBetter) target = right
          }

          if (target !== curr) {
            swaps++
            steps.push(snap(`Swap ${heap[curr]} with child ${heap[target]}`, curr, undefined, target))
            const temp = heap[curr]
            heap[curr] = heap[target]
            heap[target] = temp
            curr = target
            steps.push(snap(`After swap: current node is now at index ${curr}`, curr))
          } else {
            steps.push(snap(`Heap property restored at index ${curr}`, curr))
            break
          }
        }
      }
      steps.push(snap(`Heap after extraction. Current size: ${heap.length}`))
    }
  }

  return steps
}

export function genKnapsack(W: number, weights: number[], values: number[]): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  const n = weights.length
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(W + 1).fill(0))

  const snap = (desc: string, currN: number, currW: number, hl?: 'checking'|'matched'): ExecutionStep => {
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
        type: 'matrix',
        nodes: flatDP.map((val, i) => {
          const r = Math.floor(i / (W + 1))
          const c = i % (W + 1)
          let highlight: DSANode['highlight'] = 'none'
          if (r === currN && c === currW) highlight = hl === 'checking' ? 'comparing' : 'active'
          else if (r <= currN) highlight = 'visited'
          return { id: `c${r}_${c}`, value: val, highlight, x: c, y: r }
        }),
        message: desc,
        auxiliaryData: {
          matrix: {
            name: '0/1 Knapsack DP Table',
            rows: n + 1,
            columns: W + 1,
            rowPointer: currN,
            rowPointerName: `item ${currN}`,
            columnPointer: currW,
            columnPointerName: `w=${currW}`,
          }
        }
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
            highlight = hl === 'invalid' ? 'swapping' : (hl === 'placed' ? 'active' : 'comparing')
          } else if (val === 'Q') {
            highlight = 'found'
          }
          return { id: `c${r}_${c}`, value: val, highlight, x: c, y: r }
        }),
        message: desc,
        auxiliaryData: {
          matrix: {
            name: `${n}-Queens`,
            rows: n,
            columns: n,
            rowPointer: row >= 0 ? row : undefined,
            rowPointerName: 'row',
            columnPointer: col >= 0 ? col : undefined,
            columnPointerName: 'col',
            isChessboard: true,
            queensPlaced: board.flat().filter(x => x === 'Q').length,
            solutionsCount: res.length,
          }
        }
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
        steps.push(snap(`Invalid position (conflict) at row ${r}, col ${c}`, r, c, 'invalid'))
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
  reorderList: {
    label: 'Reorder List', category: 'Linked Lists', language: 'javascript',
    code: `// Reorder List — O(n) time, O(1) space
function ListNode(val, next) { this.val = val; this.next = next || null; }
function reorderList(head) {
  if (!head || !head.next) return head;
  let slow = head, fast = head.next;
  while (fast && fast.next) { slow = slow.next; fast = fast.next.next; }
  let prev = null, curr = slow.next;
  slow.next = null;
  while (curr) { const next = curr.next; curr.next = prev; prev = curr; curr = next; }
  let first = head, second = prev;
  while (second) {
    const tmp1 = first.next, tmp2 = second.next;
    first.next = second; second.next = tmp1;
    first = tmp1; second = tmp2;
  }
  return head;
}
const head = new ListNode(1, new ListNode(2, new ListNode(3, new ListNode(4))));
reorderList(head);`,
  },
  hasCycle: {
    label: 'Linked List Cycle', category: 'Linked Lists', language: 'javascript',
    code: `// Linked List Cycle (Floyd's Tortoise and Hare) — O(n) time, O(1) space
function ListNode(val, next) { this.val = val; this.next = next || null; }
function hasCycle(head) {
  let slow = head, fast = head;
  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}
const node1 = new ListNode(3);
const node2 = new ListNode(2);
const node3 = new ListNode(0);
const node4 = new ListNode(-4);
node1.next = node2; node2.next = node3; node3.next = node4; node4.next = node2;
console.log("Has cycle:", hasCycle(node1));`,
  },
  removeNthFromEnd: {
    label: 'Remove Nth Node From End', category: 'Linked Lists', language: 'javascript',
    code: `// Remove Nth Node From End of List — O(n) time, O(1) space
function ListNode(val, next) { this.val = val; this.next = next || null; }
function removeNthFromEnd(head, n) {
  const dummy = new ListNode(0, head);
  let fast = dummy, slow = dummy;
  for (let i = 0; i <= n; i++) fast = fast.next;
  while (fast !== null) {
    slow = slow.next;
    fast = fast.next;
  }
  slow.next = slow.next.next;
  return dummy.next;
}
const head = new ListNode(1, new ListNode(2, new ListNode(3, new ListNode(4, new ListNode(5)))));
const result = removeNthFromEnd(head, 2);`,
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

