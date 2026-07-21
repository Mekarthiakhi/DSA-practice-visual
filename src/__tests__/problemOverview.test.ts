import { LEETCODE_PROBLEMS, LeetCodeProblem } from '../data/leetcodeProblems'
import type { ExecutionStep } from '../store/ideStore'
import {
  analyzeProblemDirection,
  getMilestoneEvidence,
  getProblemVisualizationProfile,
} from '../utils/problemOverview'

function problem(category: string, title = 'Test Problem'): LeetCodeProblem {
  return {
    id: 'overview-test', title, category, difficulty: 'Medium', description: 'Test',
    examples: [{ input: 'nums = [1,2]', output: '[1,2]' }], constraints: [],
    starterCode: { javascript: 'function solve(nums) { return nums; }' }, solution: {},
  }
}

const step = (line: number, diagnostic = false): ExecutionStep => ({
  line, variables: [], callStack: [], heap: [], output: '', description: `line ${line}`,
  diagnostic: diagnostic ? { severity: 'error', type: 'TypeError', message: 'bad value', line } : undefined,
})

describe('problem overview profiles', () => {
  it('gives every catalog problem a complete overview', () => {
    for (const item of LEETCODE_PROBLEMS) {
      const profile = getProblemVisualizationProfile(item)
      expect(profile.label).not.toBe('')
      expect(profile.summary).not.toBe('')
      expect(profile.canvas).not.toBe('')
      expect(profile.watch.length).toBeGreaterThanOrEqual(3)
      expect(profile.invariants.length).toBeGreaterThanOrEqual(3)
      expect(profile.milestones.length).toBeGreaterThanOrEqual(3)
    }
  })

  it.each([
    ['Arrays & Hashing', 'hashmap'], ['Two Pointers', 'two-pointer'],
    ['Sliding Window', 'sliding-window'], ['Linked List', 'linked-list'],
    ['Trees', 'tree'], ['Graphs', 'graph'], ['Advanced Graphs', 'graph'],
    ['Heap / Priority Queue', 'heap'], ['Tries', 'trie'],
    ['1-D Dynamic Programming', 'dynamic-programming'], ['2-D Dynamic Programming', 'dynamic-programming'],
    ['Backtracking', 'backtracking'], ['Intervals', 'intervals'],
    ['Binary Search', 'binary-search'], ['Bit Manipulation', 'bit'],
    ['Math & Geometry', 'math'], ['Greedy', 'greedy'], ['Stack', 'stack'],
  ])('maps %s to the %s overview', (category, family) => {
    expect(getProblemVisualizationProfile(problem(category)).family).toBe(family)
  })

  it('keeps an overview for future unknown categories', () => {
    const profile = getProblemVisualizationProfile(problem('Future Category'))
    expect(profile.family).toBe('generic')
    expect(profile.source).toBe('fallback')
  })

  it('detects approach evidence without claiming correctness', () => {
    const profile = getProblemVisualizationProfile(problem('Two Pointers'))
    const code = 'function solve(nums) { let left = 0, right = nums.length - 1; while (left < right) left++; return left; }'
    expect(getMilestoneEvidence(profile, code)).toEqual([true, true, true, true])
    const signals = analyzeProblemDirection(profile, code, [step(1), step(2)], 'paused')
    expect(signals.find(signal => signal.id === 'runtime')?.tone).toBe('positive')
    expect(signals.find(signal => signal.id === 'judge')?.label).toContain('not verified')
  })

  it('surfaces runtime failures and judge evidence separately', () => {
    const profile = getProblemVisualizationProfile(problem('Trees'))
    const signals = analyzeProblemDirection(profile, 'function solve(root) { return root; }', [step(4, true)], 'error', 0.5)
    expect(signals.find(signal => signal.id === 'runtime')?.label).toContain('line 4')
    expect(signals.find(signal => signal.id === 'judge')?.tone).toBe('warning')
  })
})
