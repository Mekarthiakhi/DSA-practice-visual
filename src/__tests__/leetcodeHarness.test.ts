import { LEETCODE_PROBLEMS, LeetCodeProblem } from '../data/leetcodeProblems'
import { createLeetCodeHarness, splitLeetCodeInput } from '../utils/leetcodeHarness'

function problem(input: string): LeetCodeProblem {
  return {
    id: 'test',
    title: 'Harness Test',
    difficulty: 'Easy',
    category: 'Test',
    description: 'Test problem',
    examples: input ? [{ input, output: '' }] : [],
    constraints: [],
    starterCode: {},
    solution: {},
  }
}

describe('LeetCode visualization harness', () => {
  it('splits nested arrays and quoted commas at the top level only', () => {
    expect(splitLeetCodeInput('matrix = [[1,2],[3,4]], label = "a,b", k = 2')).toEqual([
      'matrix = [[1,2],[3,4]]',
      'label = "a,b"',
      'k = 2',
    ])
  })

  it('adds a JavaScript call in declared parameter order', () => {
    const result = createLeetCodeHarness(
      problem('target = 9, nums = [2,7,11,15]'),
      'var twoSum = function(nums, target) { return [0, 1]; };',
      'javascript',
    )

    expect(result.added).toBe(true)
    expect(result.code).toContain('twoSum([2,7,11,15], 9)')
  })

  it('builds linked-list fixtures and ignores non-parameter metadata', () => {
    const result = createLeetCodeHarness(
      problem('head = [3,2,0,-4], pos = 1'),
      '/** @param {ListNode} head */\nvar detectCycle = function(head) { return head; };',
      'javascript',
    )

    expect(result.added).toBe(true)
    expect(result.code).toContain('function __buildList(values)')
    expect(result.code).toContain('detectCycle(__buildList([3,2,0,-4]))')
    expect(result.code).not.toContain('detectCycle(__buildList([3,2,0,-4]), 1)')
  })

  it('makes an empty Python Solution starter syntactically runnable', () => {
    const result = createLeetCodeHarness(
      problem('nums = [1,2,3,1]'),
      'class Solution:\n    def containsDuplicate(self, nums: List[int]) -> bool:\n        ',
      'python',
    )

    expect(result.added).toBe(true)
    expect(result.code).toContain('from __future__ import annotations')
    expect(result.code).toContain('        pass')
    expect(result.code).toContain('Solution().containsDuplicate([1,2,3,1])')
  })

  it('returns an actionable message when the catalog has no example input', () => {
    const result = createLeetCodeHarness(problem(''), 'function solve(nums) { return nums; }', 'javascript')

    expect(result.added).toBe(false)
    expect(result.message).toContain('Add visualization input')
  })
})

describe('LeetCode catalog integrity', () => {
  // Keep the audit derived from the real catalog so coverage cannot silently
  // drift when problems are added or their examples are corrected.
  const catalogStats = {
    total: LEETCODE_PROBLEMS.length,
    withExamples: LEETCODE_PROBLEMS.filter(item => item.examples.length > 0).length,
    withJavaScriptSolutions: LEETCODE_PROBLEMS.filter(item => !!item.solution.javascript).length,
    withPythonSolutions: LEETCODE_PROBLEMS.filter(item => !!item.solution.python).length,
    autoJavaScriptHarnesses: LEETCODE_PROBLEMS.filter(item => {
      const source = item.starterCode.javascript
      return !!source && createLeetCodeHarness(item, source, 'javascript').added
    }).length,
    autoPythonHarnesses: LEETCODE_PROBLEMS.filter(item => {
      const source = item.starterCode.python
      return !!source && createLeetCodeHarness(item, source, 'python').added
    }).length,
  }

  it(`audits ${catalogStats.total} problems: ${catalogStats.withExamples} with auto input, ${catalogStats.withJavaScriptSolutions} JS solutions, ${catalogStats.withPythonSolutions} Python solutions`, () => {
    expect(catalogStats.total).toBeGreaterThan(0)
  })

  it(`builds automatic harnesses for ${catalogStats.autoJavaScriptHarnesses} JavaScript and ${catalogStats.autoPythonHarnesses} Python starters`, () => {
    expect(catalogStats.autoJavaScriptHarnesses).toBeGreaterThan(0)
    expect(catalogStats.autoPythonHarnesses).toBeGreaterThan(0)
  })

  it('has unique IDs and a runnable starter in at least one supported language', () => {
    const ids = LEETCODE_PROBLEMS.map(item => item.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const item of LEETCODE_PROBLEMS) {
      expect(item.title.trim()).not.toBe('')
      expect(item.starterCode.javascript || item.starterCode.python).toBeTruthy()
    }
  })
})
