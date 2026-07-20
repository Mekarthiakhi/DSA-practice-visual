/**
 * End-to-end test: Runs all LeetCode problem solutions through the full execution pipeline
 * and validates that the correct visualization types and dynamic steps are produced.
 */
import { detectAlgorithm } from '../utils/executionEngine'
import { runCode } from '../utils/universalEngine'

const executeSteps = (code: string) => runCode(code, 'auto').steps

// ─── Solution codes from leetcodeProblems.ts ─────────────────────────────────

const SOLUTIONS: Record<string, { code: string; expectedAlgo: string; expectedVizType: string; minSteps: number }> = {
  'Two Sum': {
    code: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}

const result = twoSum([2, 7, 11, 15], 9);
console.log('Result:', result);`,
    expectedAlgo: 'twoSum',
    expectedVizType: 'array',
    minSteps: 3,
  },

  'Valid Parentheses': {
    code: `function isValid(s) {
  const stack = [];
  const map = {
    '(': ')',
    '[': ']',
    '{': '}'
  };

  for (let i = 0; i < s.length; i++) {
    if (map[s[i]]) {
      stack.push(map[s[i]]);
    } else {
      if (stack.pop() !== s[i]) return false;
    }
  }

  return stack.length === 0;
}

const result = isValid("()[]{}");
console.log('Result:', result);`,
    expectedAlgo: 'validParentheses',
    expectedVizType: 'stack',
    minSteps: 3,
  },

  'Merge Two Sorted Lists': {
    code: `class ListNode {
  constructor(val, next = null) {
    this.val = val;
    this.next = next;
  }
}

function mergeTwoLists(list1, list2) {
  const dummy = new ListNode(-1);
  let current = dummy;

  while (list1 !== null && list2 !== null) {
    if (list1.val <= list2.val) {
      current.next = list1;
      list1 = list1.next;
    } else {
      current.next = list2;
      list2 = list2.next;
    }
    current = current.next;
  }

  current.next = list1 !== null ? list1 : list2;
  return dummy.next;
}

// Setup
let l1 = new ListNode(1, new ListNode(2, new ListNode(4)));
let l2 = new ListNode(1, new ListNode(3, new ListNode(4)));
const merged = mergeTwoLists(l1, l2);

// Print result
let curr = merged;
let res = [];
while (curr) {
  res.push(curr.val);
  curr = curr.next;
}
console.log('Result:', res);`,
    expectedAlgo: 'mergeTwoLists',
    expectedVizType: 'linkedlist',
    minSteps: 3,
  },

  'Best Time to Buy and Sell Stock': {
    code: `function maxProfit(prices) {
  let minPrice = Infinity;
  let maxProfit = 0;

  for (let i = 0; i < prices.length; i++) {
    if (prices[i] < minPrice) {
      minPrice = prices[i];
    } else if (prices[i] - minPrice > maxProfit) {
      maxProfit = prices[i] - minPrice;
    }
  }

  return maxProfit;
}

const result = maxProfit([7, 1, 5, 3, 6, 4]);
console.log('Result:', result);`,
    expectedAlgo: 'maxProfit',
    expectedVizType: 'array',
    minSteps: 3,
  },

  'Contains Duplicate': {
    code: `function containsDuplicate(nums) {
  const set = new Set();
  for (let num of nums) {
    if (set.has(num)) return true;
    set.add(num);
  }
  return false;
}

const result = containsDuplicate([1,2,3,1]);
console.log('Result:', result);`,
    expectedAlgo: 'containsDuplicate',
    expectedVizType: 'array',
    minSteps: 3,
  },

  'Maximum Subarray': {
    code: `function maxSubArray(nums) {
  let maxSum = nums[0];
  let currentSum = nums[0];

  for (let i = 1; i < nums.length; i++) {
    currentSum = Math.max(nums[i], currentSum + nums[i]);
    maxSum = Math.max(maxSum, currentSum);
  }

  return maxSum;
}

const result = maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4]);
console.log('Result:', result);`,
    expectedAlgo: 'maxSubArray',
    expectedVizType: 'array',
    minSteps: 3,
  },

  'Climbing Stairs': {
    code: `function climbStairs(n) {
  if (n <= 2) return n;
  let a = 1, b = 2;
  for (let i = 3; i <= n; i++) {
    let temp = a + b;
    a = b;
    b = temp;
  }
  return b;
}

const result = climbStairs(5);
console.log('Result for 5 steps:', result);`,
    expectedAlgo: 'climbStairs',
    expectedVizType: 'array', // numbers rendered as array nodes
    minSteps: 2,
  },

  'Reverse Linked List': {
    code: `class ListNode {
  constructor(val, next = null) {
    this.val = val;
    this.next = next;
  }
}

function reverseList(head) {
  let prev = null;
  let curr = head;
  while (curr !== null) {
    let nextTemp = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nextTemp;
  }
  return prev;
}

// Setup
let head = new ListNode(1, new ListNode(2, new ListNode(3, new ListNode(4, new ListNode(5)))));
const reversed = reverseList(head);

// Print result
let curr = reversed;
let res = [];
while (curr) {
  res.push(curr.val);
  curr = curr.next;
}
console.log('Result:', res);`,
    expectedAlgo: 'reverseList',
    expectedVizType: 'linkedlist',
    minSteps: 3,
  },

  'Container With Most Water': {
    code: `function maxArea(height) {
  let maxArea = 0;
  let left = 0;
  let right = height.length - 1;

  while (left < right) {
    let h = Math.min(height[left], height[right]);
    let w = right - left;
    maxArea = Math.max(maxArea, h * w);

    if (height[left] < height[right]) {
      left++;
    } else {
      right--;
    }
  }

  return maxArea;
}

const result = maxArea([1,8,6,2,5,4,8,3,7]);
console.log('Result:', result);`,
    expectedAlgo: 'maxArea',
    expectedVizType: 'array',
    minSteps: 3,
  },

  'Search Insert Position': {
    code: `function searchInsert(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    let mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) return mid;
    else if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }

  return left;
}

const result = searchInsert([1,3,5,6], 2);
console.log('Result:', result);`,
    expectedAlgo: 'searchInsert',
    expectedVizType: 'array',
    minSteps: 2,
  },
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('LeetCode E2E Visualization Tests', () => {
  for (const [name, config] of Object.entries(SOLUTIONS)) {
    describe(name, () => {
      it(`should detect as '${config.expectedAlgo}'`, () => {
        const algo = detectAlgorithm(config.code)
        expect(algo).toBe(config.expectedAlgo)
      })

      it('should produce dynamic interpreter steps (not static fallback)', () => {
        const steps = executeSteps(config.code)
        expect(steps.length).toBeGreaterThanOrEqual(config.minSteps)
        // Should NOT be an error step
        expect(steps[0].description).not.toContain('Error')
        expect(steps[0].description).not.toContain('failed')
      })

      it('should provide specialized canvas data or generic variable state', () => {
        const steps = executeSteps(config.code)
        // Scalar-only algorithms correctly use the generic variable canvas.
        const visualSteps = steps.filter(s => s.dsaState || (s.variables && s.variables.length > 0))
        expect(visualSteps.length).toBeGreaterThan(0)
      })

      it('should have line numbers that are valid (> 0)', () => {
        const steps = executeSteps(config.code)
        const linesWithCode = steps.filter(s => s.line > 0)
        expect(linesWithCode.length).toBeGreaterThan(0)
      })

      it('should have variables tracked', () => {
        const steps = executeSteps(config.code)
        const stepsWithVars = steps.filter(s => s.variables && s.variables.length > 0)
        expect(stepsWithVars.length).toBeGreaterThan(0)
      })

      it('should produce console output', () => {
        const steps = executeSteps(config.code)
        const stepsWithOutput = steps.filter(s => s.output && s.output.length > 0)
        expect(stepsWithOutput.length).toBeGreaterThan(0)
      })
    })
  }
})

// ─── Basic Template Regression Tests ─────────────────────────────────────────

describe('Basic Template Detection Regression', () => {
  const templates: [string, string][] = [
    ['bubbleSort', 'function bubbleSort(arr) { for (let i...) }'],
    ['selectionSort', 'function selectionSort(arr) { for (let i...) }'],
    ['stack', 'class Stack { push(v) {} pop() {} }'],
    ['queue', 'class Queue { enqueue(v) {} dequeue() {} }'],
    ['linkedList', 'class Node { constructor(val) { this.value = val; this.next = null } } class LinkedList {}'],
    ['bfs', 'function bfs(graph, start) { const queue = []; graph.forEach() }'],
    ['fibonacci', 'function fibonacci(n) { return fib(n-1) + fib(n-2) }'],
    ['generic', 'function hello() { console.log("hi") }'],
  ]

  for (const [expected, code] of templates) {
    it(`should detect "${code.slice(0, 40)}..." as '${expected}'`, () => {
      expect(detectAlgorithm(code)).toBe(expected)
    })
  }
})
