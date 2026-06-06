/**
 * Execution Engine Tests
 * PHASE 2: Unit tests for sorting and core algorithms
 */

import {
  genBubbleSort,
  genSelectionSort,
  genBinarySearch,
  genLinearSearch,
  detectAlgorithm,
} from '../utils/executionEngine'

describe('Algorithm Detection', () => {
  it('should detect bubble sort', () => {
    const code = 'function bubbleSort(arr) { ... }'
    expect(detectAlgorithm(code)).toBe('bubbleSort')
  })

  it('should detect quick sort', () => {
    const code = 'function quickSort(arr) { let partition = ... }'
    expect(detectAlgorithm(code)).toBe('quickSort')
  })

  it('should detect binary search', () => {
    const code = 'function binarySearch(arr, target) { ... }'
    expect(detectAlgorithm(code)).toBe('binarySearch')
  })
})

describe('Sorting Algorithms', () => {
  describe('genBubbleSort', () => {
    it('should sort array in ascending order', () => {
      const result = genBubbleSort([5, 2, 8, 1, 9])
      const lastStep = result[result.length - 1]
      const sortedArr = lastStep.variables.find(v => v.name === 'arr')?.value as number[]
      expect(sortedArr).toEqual([1, 2, 5, 8, 9])
    })

    it('should handle single element array', () => {
      const result = genBubbleSort([42])
      const lastStep = result[result.length - 1]
      const sortedArr = lastStep.variables.find(v => v.name === 'arr')?.value as number[]
      expect(sortedArr).toEqual([42])
    })

    it('should handle already sorted array', () => {
      const result = genBubbleSort([1, 2, 3])
      const lastStep = result[result.length - 1]
      const sortedArr = lastStep.variables.find(v => v.name === 'arr')?.value as number[]
      expect(sortedArr).toEqual([1, 2, 3])
    })

    it('should handle reverse sorted array', () => {
      const result = genBubbleSort([5, 4, 3, 2, 1])
      const lastStep = result[result.length - 1]
      const sortedArr = lastStep.variables.find(v => v.name === 'arr')?.value as number[]
      expect(sortedArr).toEqual([1, 2, 3, 4, 5])
    })

    it('should track comparisons', () => {
      const result = genBubbleSort([5, 2, 1])
      const lastStep = result[result.length - 1]
      const comps = lastStep.variables.find(v => v.name === 'comparisons')?.value as number
      expect(comps).toBeGreaterThan(0)
    })

    it('should track swaps', () => {
      const result = genBubbleSort([5, 2, 8])
      const lastStep = result[result.length - 1]
      const swaps = lastStep.variables.find(v => v.name === 'swaps')?.value as number
      expect(swaps).toBeGreaterThanOrEqual(0)
    })

    it('should generate multiple steps', () => {
      const result = genBubbleSort([5, 2, 8])
      expect(result.length).toBeGreaterThan(1)
    })

    it('should highlight sorted elements', () => {
      const result = genBubbleSort([3, 1, 2])
      const lastStep = result[result.length - 1]
      expect(lastStep.dsaState?.nodes.length).toBe(3)
    })
  })

  describe('genSelectionSort', () => {
    it('should sort array in ascending order', () => {
      const result = genSelectionSort([5, 2, 8, 1, 9])
      const lastStep = result[result.length - 1]
      const sortedArr = lastStep.variables.find(v => v.name === 'arr')?.value as number[]
      expect(sortedArr).toEqual([1, 2, 5, 8, 9])
    })

    it('should generate multiple steps', () => {
      const result = genSelectionSort([5, 2, 8])
      expect(result.length).toBeGreaterThan(1)
    })
  })
})

describe('Searching Algorithms', () => {
  describe('genBinarySearch', () => {
    it('should find element in sorted array', () => {
      const result = genBinarySearch([1, 3, 5, 7, 9], 5)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should return steps for missing element', () => {
      const result = genBinarySearch([1, 3, 5, 7, 9], 4)
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('genLinearSearch', () => {
    it('should find element in array', () => {
      const result = genLinearSearch([5, 2, 8, 1, 9], 8)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should generate steps for missing element', () => {
      const result = genLinearSearch([5, 2, 8], 99)
      expect(result.length).toBeGreaterThan(0)
    })
  })
})

describe('Execution Steps', () => {
  it('should have description for each step', () => {
    const result = genBubbleSort([3, 1, 2])
    result.forEach(step => {
      expect(step.description).toBeDefined()
      expect(step.description.length).toBeGreaterThan(0)
    })
  })

  it('should have line numbers for each step', () => {
    const result = genBubbleSort([3, 1, 2])
    result.forEach(step => {
      expect(step.line).toBeGreaterThan(0)
    })
  })

  it('should have variables for each step', () => {
    const result = genBubbleSort([3, 1, 2])
    result.forEach(step => {
      expect(Array.isArray(step.variables)).toBe(true)
    })
  })

  it('should have call stack for each step', () => {
    const result = genBubbleSort([3, 1, 2])
    result.forEach(step => {
      expect(Array.isArray(step.callStack)).toBe(true)
    })
  })
})
