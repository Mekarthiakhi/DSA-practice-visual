/**
 * Heap Sort Tests
 * PHASE 2: Comprehensive test coverage for Heap Sort
 */

import { genHeapSort } from '../engines/sorting/heapSort'

describe('Heap Sort', () => {
  describe('Basic Functionality', () => {
    it('should sort array in ascending order', () => {
      const result = genHeapSort([5, 2, 8, 1, 9])
      const lastStep = result[result.length - 1]
      const sortedArr = lastStep.variables.find((v) => v.name === 'arr')?.value as number[]
      expect(sortedArr).toEqual([1, 2, 5, 8, 9])
    })

    it('should handle single element array', () => {
      const result = genHeapSort([42])
      const lastStep = result[result.length - 1]
      const sortedArr = lastStep.variables.find((v) => v.name === 'arr')?.value as number[]
      expect(sortedArr).toEqual([42])
    })

    it('should handle two element array', () => {
      const result = genHeapSort([2, 1])
      const lastStep = result[result.length - 1]
      const sortedArr = lastStep.variables.find((v) => v.name === 'arr')?.value as number[]
      expect(sortedArr).toEqual([1, 2])
    })

    it('should handle already sorted array', () => {
      const result = genHeapSort([1, 2, 3, 4, 5])
      const lastStep = result[result.length - 1]
      const sortedArr = lastStep.variables.find((v) => v.name === 'arr')?.value as number[]
      expect(sortedArr).toEqual([1, 2, 3, 4, 5])
    })

    it('should handle reverse sorted array', () => {
      const result = genHeapSort([5, 4, 3, 2, 1])
      const lastStep = result[result.length - 1]
      const sortedArr = lastStep.variables.find((v) => v.name === 'arr')?.value as number[]
      expect(sortedArr).toEqual([1, 2, 3, 4, 5])
    })

    it('should handle array with duplicates', () => {
      const result = genHeapSort([3, 1, 4, 1, 5, 9, 2, 6, 5])
      const lastStep = result[result.length - 1]
      const sortedArr = lastStep.variables.find((v) => v.name === 'arr')?.value as number[]
      expect(sortedArr).toEqual([1, 1, 2, 3, 4, 5, 5, 6, 9])
    })

    it('should handle negative numbers', () => {
      const result = genHeapSort([-5, 3, -1, 0, 2])
      const lastStep = result[result.length - 1]
      const sortedArr = lastStep.variables.find((v) => v.name === 'arr')?.value as number[]
      expect(sortedArr).toEqual([-5, -1, 0, 2, 3])
    })
  })

  describe('Execution Steps', () => {
    it('should generate multiple steps', () => {
      const result = genHeapSort([5, 2, 8, 1])
      expect(result.length).toBeGreaterThan(10)
    })

    it('should have descriptions for each step', () => {
      const result = genHeapSort([5, 2, 8])
      result.forEach((step) => {
        expect(step.description).toBeDefined()
        expect(step.description.length).toBeGreaterThan(0)
      })
    })

    it('should have line numbers for each step', () => {
      const result = genHeapSort([5, 2, 8])
      result.forEach((step) => {
        expect(step.line).toBeGreaterThan(0)
      })
    })

    it('should have variables for each step', () => {
      const result = genHeapSort([5, 2, 8])
      result.forEach((step) => {
        expect(Array.isArray(step.variables)).toBe(true)
        expect(step.variables.length).toBeGreaterThan(0)
      })
    })

    it('should track comparisons', () => {
      const result = genHeapSort([5, 2, 8, 1])
      const lastStep = result[result.length - 1]
      const comps = lastStep.variables.find((v) => v.name === 'comparisons')?.value as number
      expect(comps).toBeGreaterThan(0)
    })

    it('should track swaps', () => {
      const result = genHeapSort([5, 2, 8, 1])
      const lastStep = result[result.length - 1]
      const swaps = lastStep.variables.find((v) => v.name === 'swaps')?.value as number
      expect(swaps).toBeGreaterThanOrEqual(0)
    })

    it('should track heapify operations', () => {
      const result = genHeapSort([5, 2, 8, 1])
      const lastStep = result[result.length - 1]
      const heapifyOps = lastStep.variables.find((v) => v.name === 'heapifyOps')?.value as number
      expect(heapifyOps).toBeGreaterThan(0)
    })
  })

  describe('Visualization State', () => {
    it('should have DSA state for visualization', () => {
      const result = genHeapSort([5, 2, 8])
      result.forEach((step) => {
        expect(step.dsaState).toBeDefined()
        expect(step.dsaState?.type).toBe('array')
      })
    })

    it('should have nodes representing array elements', () => {
      const result = genHeapSort([5, 2, 8, 1])
      const step = result[result.length - 1]
      expect(step.dsaState?.nodes.length).toBe(4)
      step.dsaState?.nodes.forEach((node) => {
        expect(node.id).toBeDefined()
        expect(node.value).toBeDefined()
        expect(node.highlight).toBeDefined()
      })
    })

    it('should mark elements as sorted at end', () => {
      const result = genHeapSort([5, 2, 8])
      const lastStep = result[result.length - 1]
      const allSorted = lastStep.dsaState?.nodes.every((n) => n.highlight === 'sorted')
      expect(allSorted).toBe(true)
    })

    it('should include heap parent-child relationships', () => {
      const result = genHeapSort([5, 2, 8, 1, 9])
      const step = result[5] // Somewhere during heap building
      const nodes = step.dsaState?.nodes || []
      
      // Check that nodes have parent/child relationships
      nodes.forEach((node, idx) => {
        if (idx > 0) {
          expect(node.parent).toBeDefined()
        }
        const leftChildIdx = 2 * idx + 1
        const rightChildIdx = 2 * idx + 2
        if (leftChildIdx < nodes.length) {
          expect(node.left).toBeDefined()
        }
        if (rightChildIdx < nodes.length) {
          expect(node.right).toBeDefined()
        }
      })
    })
  })

  describe('Call Stack', () => {
    it('should have call stack frames', () => {
      const result = genHeapSort([5, 2, 8])
      result.forEach((step) => {
        expect(Array.isArray(step.callStack)).toBe(true)
        expect(step.callStack.length).toBeGreaterThan(0)
      })
    })

    it('should track main and heapSort frames', () => {
      const result = genHeapSort([5, 2, 8])
      const step = result[0]
      const frameNames = step.callStack.map((f) => f.name)
      expect(frameNames).toContain('main')
      expect(frameNames).toContain('heapSort')
    })
  })

  describe('Edge Cases', () => {
    it('should handle large array', () => {
      const largeArr = Array.from({ length: 100 }, () => Math.floor(Math.random() * 1000))
      const result = genHeapSort(largeArr)
      const lastStep = result[result.length - 1]
      const sortedArr = lastStep.variables.find((v) => v.name === 'arr')?.value as number[]
      
      // Verify sorted
      for (let i = 1; i < sortedArr.length; i++) {
        expect(sortedArr[i]).toBeGreaterThanOrEqual(sortedArr[i - 1])
      }
    })

    it('should handle all zeros', () => {
      const result = genHeapSort([0, 0, 0, 0])
      const lastStep = result[result.length - 1]
      const sortedArr = lastStep.variables.find((v) => v.name === 'arr')?.value as number[]
      expect(sortedArr).toEqual([0, 0, 0, 0])
    })

    it('should handle mixed positive and negative', () => {
      const result = genHeapSort([-10, 5, -3, 8, 0, -15])
      const lastStep = result[result.length - 1]
      const sortedArr = lastStep.variables.find((v) => v.name === 'arr')?.value as number[]
      expect(sortedArr).toEqual([-15, -10, -3, 0, 5, 8])
    })
  })
})
