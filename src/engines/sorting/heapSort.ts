/**
 * Heap Sort Implementation
 * Time Complexity: O(n log n)
 * Space Complexity: O(1) - in-place sorting
 * PHASE 2 EXTENSION: Complete algorithm with synchronized visualization
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

/**
 * Helper function to get parent index
 */
function getParent(i: number): number {
  return Math.floor((i - 1) / 2)
}

/**
 * Helper function to get left child index
 */
function getLeftChild(i: number): number {
  return 2 * i + 1
}

/**
 * Helper function to get right child index
 */
function getRightChild(i: number): number {
  return 2 * i + 2
}

/**
 * Helper function to swap elements
 */
function swap<T>(arr: T[], i: number, j: number): void {
  ;[arr[i], arr[j]] = [arr[j], arr[i]]
}

/**
 * Generate execution steps for Heap Sort
 * Includes:
 * - Heap building phase
 * - Sorting phase with extraction
 * - Synchronized visualization states
 */
export function genHeapSort(arr: number[]): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  const a = [...arr]
  const nodesArr = arr.map((v, i) => ({ id: `n${i}-${v}`, value: v }))
  const n = a.length
  let comparisons = 0
  let swaps = 0
  let heapifyOps = 0

  /**
   * Create snapshot of current state
   * Synchronized with visualization
   */
  const snap = (
    line: number,
    desc: string,
    highlights: Record<number, 'active' | 'visited' | 'comparing' | 'swapping' | 'sorted' | 'heapifying' | 'none'>,
    changed?: 'arr' | 'comparisons' | 'swaps' | 'heapifyOps',
    heapRange?: { start: number; end: number }
  ): ExecutionStep => ({
    line,
    description: desc,
    variables: [
      { name: 'arr', value: [...a], type: 'Array', scope: 'heapSort', changed: changed === 'arr' },
      { name: 'n', value: n, type: 'number', scope: 'heapSort' },
      { name: 'comparisons', value: comparisons, type: 'number', scope: 'heapSort', changed: changed === 'comparisons' },
      { name: 'swaps', value: swaps, type: 'number', scope: 'heapSort', changed: changed === 'swaps' },
      { name: 'heapifyOps', value: heapifyOps, type: 'number', scope: 'heapSort', changed: changed === 'heapifyOps' },
    ],
    callStack: [makeFrame('main', line), makeFrame('heapSort', line)],
    heap: [],
    output: '',
    dsaState: {
      type: 'array',
      nodes: nodesArr.map((item, i) => {
        // Visual state based on algorithm phase
        let highlight: DSANode['highlight'] = highlights[i] || 'none'

        // Add visual tree structure info for heap phase
        return {
          id: item.id,
          value: item.value,
          highlight,
          left: getLeftChild(i) < n ? nodesArr[getLeftChild(i)].id : undefined,
          right: getRightChild(i) < n ? nodesArr[getRightChild(i)].id : undefined,
          parent: i > 0 ? nodesArr[getParent(i)].id : undefined,
          depth: Math.floor(Math.log2(i + 1)),
        }
      }),
      comparisons,
      swaps,
      message: desc,
      auxiliaryData: {
        heapSize: heapRange?.end ?? n,
        heapStart: heapRange?.start ?? 0,
      },
    },
  })

  // Initialize
  steps.push(snap(1, `Starting Heap Sort on [${arr.join(', ')}]`, {}))
  steps.push(snap(2, `Array size: ${n}`, {}))

  // ============================================
  // PHASE 1: BUILD MAX HEAP
  // ============================================
  steps.push(snap(4, '=== PHASE 1: BUILD MAX HEAP ===', {}))

  // Start from last non-leaf node
  const startIdx = Math.floor(n / 2) - 1
  steps.push(snap(5, `Building max heap from index ${startIdx} to 0`, {}))

  for (let i = startIdx; i >= 0; i--) {
    heapifyOps++
    
    // Heapify subtree rooted at i with recursive comparison
    let current = i
    
    while (true) {
      const highlights: Record<number, any> = {}
      
      // Mark current node being heapified
      highlights[current] = 'heapifying'
      steps.push(snap(6, `Heapifying subtree rooted at index ${current}`, highlights, 'heapifyOps'))
      
      let largest = current
      let left = getLeftChild(current)
      let right = getRightChild(current)

      // Check left child
      if (left < n) {
        comparisons++
        highlights[left] = 'comparing'
        steps.push(snap(7, `Compare arr[${current}]=${a[current]} with left child arr[${left}]=${a[left]}`, highlights, 'comparisons'))
        if (a[left] > a[largest]) {
          largest = left
        }
      }

      // Check right child
      if (right < n) {
        comparisons++
        highlights[right] = 'comparing'
        steps.push(snap(8, `Compare arr[${largest}]=${a[largest]} with right child arr[${right}]=${a[right]}`, highlights, 'comparisons'))
        if (a[right] > a[largest]) {
          largest = right
        }
      }

      // If no swap needed, heap property satisfied
      if (largest === current) {
        break
      }

      // Swap and continue down
      swaps++
      highlights[current] = 'swapping'
      highlights[largest] = 'swapping'
      steps.push(snap(9, `Swap arr[${current}]=${a[current]} ↔ arr[${largest}]=${a[largest]}`, highlights, 'swaps'))
      swap(a, current, largest)
      swap(nodesArr, current, largest)
      steps.push(snap(10, `After swap: arr = [${a.join(', ')}]`, highlights, 'arr'))
      
      current = largest
    }
  }

  steps.push(snap(11, `✅ Max heap built! Comparisons: ${comparisons}`, {}))

  // ============================================
  // PHASE 2: EXTRACT ELEMENTS FROM HEAP
  // ============================================
  steps.push(snap(12, '=== PHASE 2: EXTRACT FROM HEAP ===', {}))
  steps.push(snap(13, `Extracting ${n} elements from heap`, {}))

  for (let i = n - 1; i > 0; i--) {
    const highlights: Record<number, any> = {}

    // Mark sorted elements
    for (let j = i + 1; j < n; j++) {
      highlights[j] = 'sorted'
    }

    // Mark current max element
    highlights[0] = 'active'
    steps.push(snap(14, `Step ${n - i}: Move max element arr[0]=${a[0]} to position ${i}`, highlights))

    // Swap root with last element of heap
    swaps++
    highlights[0] = 'swapping'
    highlights[i] = 'swapping'
    steps.push(snap(15, `Swap arr[0]=${a[0]} ↔ arr[${i}]=${a[i]}`, highlights, 'swaps'))
    swap(a, 0, i)
    swap(nodesArr, 0, i)
    steps.push(snap(16, `After swap: [${a.slice(0, i + 1).join(', ')}] | sorted: [${a.slice(i + 1).join(', ')}]`, highlights, 'arr'))

    // Heapify reduced heap
    let largest = 0
    let current = 0
    let heapSize = i

    while (true) {
      largest = current
      const left = getLeftChild(current)
      const right = getRightChild(current)

      highlights[current] = 'heapifying'

      if (left < heapSize) {
        comparisons++
        highlights[left] = 'comparing'
        steps.push(snap(17, `Compare arr[${current}]=${a[current]} with left child arr[${left}]=${a[left]}`, highlights, 'comparisons'))
        if (a[left] > a[largest]) {
          largest = left
        }
      }

      if (right < heapSize) {
        comparisons++
        highlights[right] = 'comparing'
        steps.push(snap(18, `Compare arr[${largest}]=${a[largest]} with right child arr[${right}]=${a[right]}`, highlights, 'comparisons'))
        if (a[right] > a[largest]) {
          largest = right
        }
      }

      if (largest === current) {
        break
      }

      swaps++
      highlights[current] = 'swapping'
      highlights[largest] = 'swapping'
      steps.push(snap(19, `Swap arr[${current}]=${a[current]} ↔ arr[${largest}]=${a[largest]}`, highlights, 'swaps'))
      swap(a, current, largest)
      swap(nodesArr, current, largest)
      steps.push(snap(20, `After swap: [${a.slice(0, i + 1).join(', ')}] | sorted: [${a.slice(i + 1).join(', ')}]`, highlights, 'arr'))

      current = largest
    }

    heapifyOps++
  }

  // Mark all as sorted
  const finalHighlights: Record<number, any> = {}
  a.forEach((_, i) => {
    finalHighlights[i] = 'sorted'
  })

  steps.push(snap(21, `✅ Heap Sort Complete!`, finalHighlights))
  steps.push(
    snap(
      22,
      `Sorted: [${a.join(', ')}] | Comparisons: ${comparisons} | Swaps: ${swaps} | Heapify Ops: ${heapifyOps}`,
      finalHighlights
    )
  )

  return steps
}
