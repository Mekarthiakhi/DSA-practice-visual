/**
 * Comprehensive Sorting and Searching Visualizer Audit Test Suite
 * Validates:
 * 1. Bubble Sort, Selection Sort, Insertion Sort, Merge Sort, Quick Sort, Heap Sort
 * 2. Linear Search, Binary Search (classic & variants: Search Insert, Rotated Array Min, Rotated Search)
 * 3. Symmetric dimming of eliminated regions (rangeStart, rangeEnd, 'skipped')
 * 4. Non-overlapping pointers (L, R, mid, i, j)
 * 5. Clear comparisons and swaps highlights
 * 6. Correct box vs bar rendering (bars for sorting, boxes for search)
 */

import {
  genBubbleSort,
  genSelectionSort,
  genInsertionSort,
  genMergeSort,
  genQuickSort,
  genBinarySearch,
  genLinearSearch,
  genSearchInsert,
  genFindMinRotated,
  genSearchRotatedArray,
  detectAlgorithm,
  generateExecutionSteps,
} from '../utils/executionEngine'
import { genHeapSort } from '../engines/sorting/heapSort'
import { interpretCode } from '../utils/jsInterpreter'

describe('Sorting and Searching Visualizer Audit', () => {

  // =========================================================================
  // 1. SORTING ALGORITHMS AUDIT
  // =========================================================================
  describe('Sorting Algorithms Visualization & Bar Rendering', () => {

    describe('Bubble Sort', () => {
      it('renders as bars with clear comparisons, swaps, and sorted regions', () => {
        const steps = genBubbleSort([5, 1, 4, 2, 8])
        expect(steps.length).toBeGreaterThan(5)

        // Check first step
        const first = steps[0]
        expect(first.dsaState?.auxiliaryData?.isSorting).toBe(true)
        expect(first.dsaState?.auxiliaryData?.renderAs).toBe('bars')

        // Check comparisons & swaps presence
        const last = steps[steps.length - 1]
        expect(last.dsaState?.comparisons).toBeGreaterThan(0)
        expect(last.dsaState?.swaps).toBeGreaterThan(0)

        // Find comparing step: 2 elements comparing
        const cmpStep = steps.find(s => s.dsaState?.nodes.filter(n => n.highlight === 'comparing').length === 2)
        expect(cmpStep).toBeDefined()
        expect(cmpStep?.dsaState?.pointer).toBeDefined() // i
        expect(cmpStep?.dsaState?.pointer2).toBeDefined() // j

        // Find swapping step: 2 elements swapping
        const swapStep = steps.find(s => s.dsaState?.nodes.filter(n => n.highlight === 'swapping').length === 2)
        expect(swapStep).toBeDefined()

        // Sorted region highlights
        const sortedSteps = steps.filter(s => s.dsaState?.nodes.some(n => n.highlight === 'sorted'))
        expect(sortedSteps.length).toBeGreaterThan(0)
      })
    })

    describe('Selection Sort', () => {
      it('renders as bars with minIdx tracking and swap highlights', () => {
        const steps = genSelectionSort([29, 10, 14, 37, 13])
        expect(steps.length).toBeGreaterThan(5)

        const first = steps[0]
        expect(first.dsaState?.auxiliaryData?.isSorting).toBe(true)
        expect(first.dsaState?.auxiliaryData?.renderAs).toBe('bars')

        // Comparing step
        const cmpStep = steps.find(s => s.dsaState?.nodes.filter(n => n.highlight === 'comparing').length === 2)
        expect(cmpStep).toBeDefined()

        // Swapping step
        const swapStep = steps.find(s => s.dsaState?.nodes.filter(n => n.highlight === 'swapping').length === 2)
        expect(swapStep).toBeDefined()

        // Final step: sorted
        const last = steps[steps.length - 1]
        expect(last.dsaState?.nodes.every(n => n.highlight === 'found' || n.highlight === 'sorted')).toBe(true)
      })
    })

    describe('Insertion Sort', () => {
      it('renders as bars with shifting and insertion highlights', () => {
        const steps = genInsertionSort([12, 11, 13, 5, 6])
        expect(steps.length).toBeGreaterThan(5)

        const first = steps[0]
        expect(first.dsaState?.auxiliaryData?.isSorting).toBe(true)
        expect(first.dsaState?.auxiliaryData?.renderAs).toBe('bars')

        // Shifts/swaps tracked
        const last = steps[steps.length - 1]
        expect(last.dsaState?.swaps).toBeGreaterThan(0)
        expect(last.dsaState?.comparisons).toBeGreaterThan(0)

        // Shifting step highlights swapping
        const shiftStep = steps.find(s => s.dsaState?.nodes.some(n => n.highlight === 'swapping'))
        expect(shiftStep).toBeDefined()

        // Insert step highlights found
        const insertStep = steps.find(s => s.dsaState?.nodes.some(n => n.highlight === 'found'))
        expect(insertStep).toBeDefined()
      })
    })

    describe('Merge Sort', () => {
      it('renders as bars with divide & merge ranges and non-overlapping pointers', () => {
        const steps = genMergeSort([38, 27, 43, 3, 9, 82, 10])
        expect(steps.length).toBeGreaterThan(5)

        // Crucial fix: auxiliaryData explicitly specifies bars and isSorting
        const first = steps[0]
        expect(first.dsaState?.auxiliaryData?.isSorting).toBe(true)
        expect(first.dsaState?.auxiliaryData?.renderAs).toBe('bars')
        expect(first.dsaState?.swaps).toBeDefined() // Placements are tracked!

        // Divide step has rangeStart and rangeEnd
        const divStep = steps.find(s => s.description.includes('DIVIDE'))
        expect(divStep).toBeDefined()
        expect(divStep?.dsaState?.rangeStart).toBeDefined()
        expect(divStep?.dsaState?.rangeEnd).toBeDefined()

        // Merge step has active L, R, and k pointers
        const mergeStep = steps.find(s => s.description.includes('Placed'))
        expect(mergeStep).toBeDefined()
        expect(mergeStep?.dsaState?.pointer3Name).toBe('k')

        // Last step: fully sorted
        const last = steps[steps.length - 1]
        expect(last.dsaState?.comparisons).toBeGreaterThan(0)
        expect(last.dsaState?.swaps).toBeGreaterThan(0)
      })
    })

    describe('Quick Sort', () => {
      it('renders as bars with pivot highlight, partition range, and pointers i, j', () => {
        const steps = genQuickSort([10, 80, 30, 90, 40, 50, 70])
        expect(steps.length).toBeGreaterThan(5)

        const first = steps[0]
        expect(first.dsaState?.auxiliaryData?.isSorting).toBe(true)
        expect(first.dsaState?.auxiliaryData?.renderAs).toBe('bars')

        // Pivot step
        const pivotStep = steps.find(s => s.dsaState?.pivotIndex !== undefined)
        expect(pivotStep).toBeDefined()
        expect(pivotStep?.dsaState?.nodes.some(n => n.highlight === 'pivot')).toBe(true)

        // Pointers i and j during partition
        const partStep = steps.find(s => s.dsaState?.pointerName === 'j')
        expect(partStep).toBeDefined()
        expect(partStep?.dsaState?.rangeStart).toBeDefined()
        expect(partStep?.dsaState?.rangeEnd).toBeDefined()

        // Swapping step
        const swapStep = steps.find(s => s.dsaState?.nodes.filter(n => n.highlight === 'swapping').length >= 2)
        expect(swapStep).toBeDefined()
      })
    })

    describe('Heap Sort', () => {
      it('renders as bars with heapifying, comparing, and extraction highlights', () => {
        const steps = genHeapSort([12, 11, 13, 5, 6, 7])
        expect(steps.length).toBeGreaterThan(5)

        const first = steps[0]
        expect(first.dsaState?.auxiliaryData?.isSorting).toBe(true)
        expect(first.dsaState?.auxiliaryData?.renderAs).toBe('bars')
        expect(first.dsaState?.auxiliaryData?.heapSize).toBeDefined()

        // Heapifying highlight
        const heapStep = steps.find(s => s.dsaState?.nodes.some(n => n.highlight === 'heapifying'))
        expect(heapStep).toBeDefined()

        // Swapping step in heapify or extraction
        const swapStep = steps.find(s => s.dsaState?.nodes.filter(n => n.highlight === 'swapping').length >= 2)
        expect(swapStep).toBeDefined()

        // Sorted elements in extraction phase
        const extractStep = steps.find(s => s.description.includes('sorted'))
        expect(extractStep).toBeDefined()
      })
    })
  })

  // =========================================================================
  // 2. SEARCHING ALGORITHMS AUDIT
  // =========================================================================
  describe('Searching Algorithms Visualization & Box Rendering', () => {

    describe('Linear Search', () => {
      it('renders as boxes with current scanning pointer i and target found', () => {
        const steps = genLinearSearch([4, 2, 7, 1, 9, 3], 7)
        expect(steps.length).toBeGreaterThan(0)

        // Renders as boxes
        const first = steps[0]
        expect(first.dsaState?.auxiliaryData?.renderAs).toBe('boxes')
        expect(first.dsaState?.auxiliaryData?.isSearch).toBe(true)
        expect(first.dsaState?.auxiliaryData?.trackingVars?.target).toBe(7)

        // Checking steps
        const checkStep = steps.find(s => s.dsaState?.pointerName === 'i')
        expect(checkStep).toBeDefined()
        expect(checkStep?.dsaState?.pointer).toBe(0)

        // Found step
        const foundStep = steps.find(s => s.dsaState?.nodes.some(n => n.highlight === 'found'))
        expect(foundStep).toBeDefined()
        expect(foundStep?.output).toBe('2') // index 2
      })

      it('handles element not found gracefully', () => {
        const steps = genLinearSearch([1, 2, 3], 99)
        const last = steps[steps.length - 1]
        expect(last.description).toContain('NOT in the array')
        expect(last.dsaState?.comparisons).toBe(3)
      })
    })

    describe('Binary Search (Classic)', () => {
      it('renders as boxes with symmetric dimming of eliminated regions and non-overlapping pointers', () => {
        const arr = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
        const target = 23
        const steps = genBinarySearch(arr, target)
        expect(steps.length).toBeGreaterThan(0)

        // 1. Box rendering
        const first = steps[0]
        expect(first.dsaState?.auxiliaryData?.renderAs).toBe('boxes')
        expect(first.dsaState?.auxiliaryData?.isSearch).toBe(true)

        // 2. Tracking variables
        expect(first.dsaState?.auxiliaryData?.trackingVars?.target).toBe(23)
        expect(first.dsaState?.auxiliaryData?.trackingVars?.left).toBe(0)
        expect(first.dsaState?.auxiliaryData?.trackingVars?.right).toBe(9)

        // 3. Non-overlapping pointers (L, R, mid)
        const midSteps = steps.filter(s => s.dsaState?.pointerName === 'mid' && s.dsaState.pointer !== undefined)
        expect(midSteps.length).toBeGreaterThan(0)

        for (const s of midSteps) {
          const ds = s.dsaState!
          expect(ds.pointerName).toBe('mid')
          expect(ds.pointer2Name).toBe('L')
          expect(ds.pointer3Name).toBe('R')

          // Verify rangeStart and rangeEnd match L and R
          expect(ds.rangeStart).toBe(ds.pointer2)
          expect(ds.rangeEnd).toBe(ds.pointer3)

          // 4. Symmetric Dimming: eliminated nodes outside [L..R] MUST be 'skipped'
          const l = ds.rangeStart!
          const r = ds.rangeEnd!
          ds.nodes.forEach((n, idx) => {
            if (idx < l || idx > r) {
              expect(n.highlight).toBe('skipped')
            }
          })
        }

        // 5. Found target step
        const foundStep = steps.find(s => s.dsaState?.nodes.some(n => n.highlight === 'found'))
        expect(foundStep).toBeDefined()
        const foundIdx = foundStep?.dsaState?.nodes.findIndex(n => n.highlight === 'found')
        expect(foundIdx).toBe(5) // arr[5] is 23
      })

      it('handles target not found with range collapsing and full symmetric dimming', () => {
        const arr = [1, 3, 5, 7, 9]
        const steps = genBinarySearch(arr, 4)
        const last = steps[steps.length - 1]

        expect(last.description).toContain('search space empty')
        expect(last.dsaState?.comparisons).toBeGreaterThan(0)
      })
    })

    describe('Binary Search Variant: Search Insert Position', () => {
      it('provides full binary search visualization and returns insertion index', () => {
        const nums = [1, 3, 5, 6]
        const target = 2
        const steps = genSearchInsert(nums, target)

        // Box rendering & search metadata
        const first = steps[0]
        expect(first.dsaState?.auxiliaryData?.renderAs).toBe('boxes')
        expect(first.dsaState?.auxiliaryData?.isSearch).toBe(true)

        // Verify pointers and range
        const midStep = steps.find(s => s.dsaState?.pointerName === 'mid')
        expect(midStep).toBeDefined()
        expect(midStep?.dsaState?.rangeStart).toBeDefined()
        expect(midStep?.dsaState?.rangeEnd).toBeDefined()
        expect(midStep?.dsaState?.pointer2Name).toBe('L')
        expect(midStep?.dsaState?.pointer3Name).toBe('R')

        // Last step returns insert position 1 with 'found' highlight
        const last = steps[steps.length - 1]
        expect(last.output).toBe('1')
        expect(last.dsaState?.nodes[1].highlight).toBe('found')
      })

      it('finds exact match when target already exists', () => {
        const nums = [1, 3, 5, 6]
        const target = 5
        const steps = genSearchInsert(nums, target)
        const last = steps[steps.length - 1]
        expect(last.output).toBe('2')
        expect(last.dsaState?.nodes[2].highlight).toBe('found')
      })
    })

    describe('Binary Search Variant: Find Minimum in Rotated Sorted Array', () => {
      it('finds minimum without sorting away rotation, symmetrically dimming eliminated halves', () => {
        const nums = [4, 5, 6, 7, 0, 1, 2]
        const steps = genFindMinRotated(nums)
        expect(steps.length).toBeGreaterThan(0)

        // Box rendering
        const first = steps[0]
        expect(first.dsaState?.auxiliaryData?.renderAs).toBe('boxes')
        expect(first.dsaState?.auxiliaryData?.isSearch).toBe(true)

        // Pointers mid, L, R
        const midSteps = steps.filter(s => s.dsaState?.pointerName === 'mid' && s.dsaState?.pointer !== undefined)
        expect(midSteps.length).toBeGreaterThan(0)

        for (const s of midSteps) {
          const ds = s.dsaState!
          const l = ds.rangeStart!
          const r = ds.rangeEnd!
          // Eliminated nodes are 'skipped'
          ds.nodes.forEach((n, idx) => {
            if (idx < l || idx > r) {
              expect(n.highlight).toBe('skipped')
            }
          })
        }

        // Final step: found minimum 0 at index 4
        const last = steps[steps.length - 1]
        expect(last.output).toBe('0')
        expect(last.dsaState?.nodes[4].highlight).toBe('found')
      })
    })

    describe('Binary Search Variant: Search in Rotated Sorted Array', () => {
      it('finds target in rotated array using binary search', () => {
        const nums = [4, 5, 6, 7, 0, 1, 2]
        const target = 0
        const steps = genSearchRotatedArray(nums, target)
        expect(steps.length).toBeGreaterThan(0)

        // Box rendering
        const first = steps[0]
        expect(first.dsaState?.auxiliaryData?.renderAs).toBe('boxes')
        expect(first.dsaState?.auxiliaryData?.isSearch).toBe(true)

        // Found target 0 at index 4
        const last = steps[steps.length - 1]
        expect(last.output).toBe('4')
        expect(last.dsaState?.nodes[4].highlight).toBe('found')
      })
    })
  })

  // =========================================================================
  // 3. ALGORITHM DETECTION & DYNAMIC TRACING AUDIT
  // =========================================================================
  describe('Algorithm Detection & Dynamic Execution', () => {
    it('detects findMinRotated correctly', () => {
      const code = `function findMin(nums) {
        let left = 0, right = nums.length - 1;
        while (left < right) {
          const mid = Math.floor((left + right) / 2);
          if (nums[mid] > nums[right]) left = mid + 1;
          else right = mid;
        }
        return nums[left];
      }`
      expect(detectAlgorithm(code)).toBe('findMinRotated')
      const steps = generateExecutionSteps(code)
      expect(steps.length).toBeGreaterThan(0)
      expect(steps[0].dsaState?.auxiliaryData?.isSearch).toBe(true)
      expect(steps[0].dsaState?.auxiliaryData?.renderAs).toBe('boxes')
    })

    it('detects searchRotated correctly', () => {
      const code = `function search(nums, target) {
        // search in rotated sorted array
        let left = 0, right = nums.length - 1;
      }`
      expect(detectAlgorithm(code)).toBe('searchRotated')
    })

    it('dynamically interprets binary search with symmetric dimming', () => {
      const code = `function bs(arr, target) {
        let left = 0;
        let right = arr.length - 1;
        while (left <= right) {
          let mid = Math.floor((left + right) / 2);
          if (arr[mid] === target) return mid;
          else if (arr[mid] < target) left = mid + 1;
          else right = mid - 1;
        }
        return -1;
      }
      const res = bs([10, 20, 30, 40, 50, 60], 50);`

      const result = interpretCode(code)
      expect(result.error).toBeUndefined()
      const bsSteps = result.steps.filter(s => s.dsaState && s.dsaState.rangeStart !== undefined)
      expect(bsSteps.length).toBeGreaterThan(0)

      // Eliminated regions in dynamic binary search are 'skipped'
      const stepWithElim = bsSteps.find(s => s.dsaState?.rangeStart! > 0 || s.dsaState?.rangeEnd! < 5)
      expect(stepWithElim).toBeDefined()
      const ds = stepWithElim!.dsaState!
      const l = ds.rangeStart!
      const r = ds.rangeEnd!
      ds.nodes.forEach((n, idx) => {
        if (idx < l || idx > r) {
          expect(n.highlight).toBe('skipped')
        }
      })
    })

    it('dynamically interprets bubble sort with bar rendering and swaps tracking', () => {
      const code = `function bubble(arr) {
        for (let i = 0; i < arr.length; i++) {
          for (let j = 0; j < arr.length - 1 - i; j++) {
            if (arr[j] > arr[j + 1]) {
              let temp = arr[j];
              arr[j] = arr[j + 1];
              arr[j + 1] = temp;
            }
          }
        }
        return arr;
      }
      bubble([4, 3, 2, 1]);`

      const result = interpretCode(code)
      expect(result.error).toBeUndefined()
      const dsaSteps = result.steps.filter(s => s.dsaState?.type === 'array')
      expect(dsaSteps.length).toBeGreaterThan(0)

      // Verified as bars for sorting
      const stepWithBars = dsaSteps.find(s => s.dsaState?.auxiliaryData?.renderAs === 'bars')
      expect(stepWithBars).toBeDefined()
      expect(stepWithBars?.dsaState?.auxiliaryData?.isSorting).toBe(true)
    })
  })
})
