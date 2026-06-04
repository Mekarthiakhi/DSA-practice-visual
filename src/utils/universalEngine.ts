/**
 * Universal Execution Engine
 * Routes code through:
 *  1. Named-algorithm generator (rich DSA steps with highlighting)
 *  2. Real JS interpreter (arbitrary code with live variable tracing)
 *
 * The caller always gets ExecutionStep[] regardless of which path was taken.
 */

import { ExecutionStep, DSAState, DSANode } from '../store/ideStore'
import {
  detectAlgorithm, generateExecutionSteps as genDSA,
  genBubbleSort, genSelectionSort, genInsertionSort, genMergeSort, genQuickSort,
  genBinarySearch, genLinearSearch,
  genFibonacci, genFactorial,
  genLinkedList, genBST,
  genBFS, genDFS,
  genStack, genQueue, genHashMap,
  genTwoSum, genReverseString, genFizzBuzz,
} from './executionEngine'
import { interpretCode } from './jsInterpreter'

export type ExecutionMode = 'dsa' | 'interpreter' | 'auto'

export interface RunResult {
  steps: ExecutionStep[]
  output: string[]
  mode: 'dsa' | 'interpreter'
  algo?: string
  error?: string
}

// DSA algorithms that have rich hand-crafted visualizations
const DSA_ALGOS = new Set([
  'bubbleSort', 'selectionSort', 'insertionSort', 'mergeSort', 'quickSort',
  'binarySearch', 'linearSearch',
  'fibonacci', 'factorial',
  'linkedList', 'doublyLinkedList',
  'bst', 'avl',
  'bfs', 'dfs', 'dijkstra',
  'stack', 'queue',
  'hashMap',
  'twoSum', 'reverseString', 'isPalindrome', 'fizzBuzz',
])

export function runCode(code: string, mode: ExecutionMode = 'auto'): RunResult {
  const algo = detectAlgorithm(code)
  const isDSA = DSA_ALGOS.has(algo)

  // If explicitly 'dsa' mode, use the hand-crafted generators
  if (mode === 'dsa') {
    try {
      const steps = genDSA(code)
      if (steps.length > 3) {
        const output = extractOutputFromSteps(steps)
        return { steps, output, mode: 'dsa', algo }
      }
    } catch {
      // Fall through
    }
  }

  // Always prefer the REAL JS interpreter first
  try {
    const result = interpretCode(code)
    
    // If interpreter succeeded or had an error (like SyntaxError), we still want to show the trace/error!
    // But if it's completely empty (0 steps) and it's a known DSA, we could fallback, but let's just return it.
    if (result.steps.length > 0 || result.error) {
      return {
        steps: result.steps.length > 0 ? result.steps : generateFallbackSteps(code, result.output),
        output: result.output,
        mode: 'interpreter',
        algo: algo !== 'generic' ? algo : undefined,
        error: result.error,
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      steps: generateFallbackSteps(code, []),
      output: [`❌ ${msg}`],
      mode: 'interpreter',
      error: msg,
    }
  }

  // Absolute fallback
  return {
    steps: generateFallbackSteps(code, []),
    output: [],
    mode: 'interpreter',
    algo: algo !== 'generic' ? algo : undefined,
    error: 'Execution produced no steps.',
  }
}

function extractOutputFromSteps(steps: ExecutionStep[]): string[] {
  const out: string[] = []
  for (const s of steps) {
    if (s.output && !out.includes(s.output)) out.push(s.output)
  }
  return out
}

function generateFallbackSteps(code: string, output: string[]): ExecutionStep[] {
  const lines = code.split('\n').filter(l => l.trim())
  return lines.map((line, i) => ({
    line: i + 1,
    description: line.trim().substring(0, 80),
    variables: [],
    callStack: [{ id: 'f0', name: 'main', line: i + 1, variables: [], isActive: true }],
    heap: [],
    output: output[i] || '',
    dsaState: undefined,
  }))
}

function generateErrorSteps(code: string, error: string): ExecutionStep[] {
  return [{
    line: 1,
    description: `Error: ${error}`,
    variables: [],
    callStack: [{ id: 'f0', name: 'main', line: 1, variables: [], isActive: true }],
    heap: [],
    output: `❌ ${error}`,
    dsaState: {
      type: 'array',
      nodes: [],
      message: `Runtime Error: ${error}`,
    },
  }]
}

// Re-export SAMPLE_CODES with additional general programming examples
export { SAMPLE_CODES as DSA_SAMPLE_CODES } from './executionEngine'

export const GENERAL_SAMPLES: Record<string, { label: string; code: string; category: string; language: 'javascript' }> = {
  // ─── Math & Numbers ──────────────────────────────────────────────────────────
  primes: {
    label: 'Prime Numbers', category: 'Math', language: 'javascript',
    code: `// Sieve of Eratosthenes — find all primes up to n
function sieve(n) {
  const isPrime = new Array(n + 1).fill(true);
  isPrime[0] = isPrime[1] = false;
  
  for (let i = 2; i * i <= n; i++) {
    if (isPrime[i]) {
      for (let j = i * i; j <= n; j += i) {
        isPrime[j] = false;
      }
    }
  }
  
  return isPrime
    .map((p, i) => p ? i : null)
    .filter(Boolean);
}

const primes = sieve(50);
console.log("Primes up to 50:", primes);
console.log("Count:", primes.length);`,
  },
  gcd: {
    label: 'GCD / LCM', category: 'Math', language: 'javascript',
    code: `// Euclidean Algorithm — GCD and LCM
function gcd(a, b) {
  while (b !== 0) {
    let temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

function lcm(a, b) {
  return (a * b) / gcd(a, b);
}

const a = 48, b = 18;
console.log("GCD(" + a + ", " + b + ") =", gcd(a, b));
console.log("LCM(" + a + ", " + b + ") =", lcm(a, b));`,
  },
  power: {
    label: 'Fast Power', category: 'Math', language: 'javascript',
    code: `// Fast Exponentiation — O(log n)
function fastPow(base, exp) {
  if (exp === 0) return 1;
  if (exp % 2 === 0) {
    const half = fastPow(base, exp / 2);
    return half * half;
  }
  return base * fastPow(base, exp - 1);
}

console.log("2^10 =", fastPow(2, 10));
console.log("3^5 =", fastPow(3, 5));
console.log("5^0 =", fastPow(5, 0));`,
  },

  // ─── Arrays ──────────────────────────────────────────────────────────────────
  maxSubarray: {
    label: "Kadane's Algorithm", category: 'Arrays', language: 'javascript',
    code: `// Kadane's Algorithm — Maximum Subarray Sum
function maxSubarray(nums) {
  let maxSum = nums[0];
  let currentSum = nums[0];
  let start = 0, end = 0, tempStart = 0;
  
  for (let i = 1; i < nums.length; i++) {
    if (currentSum + nums[i] < nums[i]) {
      currentSum = nums[i];
      tempStart = i;
    } else {
      currentSum += nums[i];
    }
    
    if (currentSum > maxSum) {
      maxSum = currentSum;
      start = tempStart;
      end = i;
    }
  }
  
  return { maxSum, subarray: nums.slice(start, end + 1) };
}

const nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4];
const result = maxSubarray(nums);
console.log("Max sum:", result.maxSum);
console.log("Subarray:", result.subarray);`,
  },
  slidingWindow: {
    label: 'Sliding Window', category: 'Arrays', language: 'javascript',
    code: `// Sliding Window — Max sum subarray of size k
function maxSumWindow(arr, k) {
  let windowSum = 0;
  let maxSum = 0;
  
  // Calculate sum of first window
  for (let i = 0; i < k; i++) {
    windowSum += arr[i];
  }
  maxSum = windowSum;
  
  // Slide the window
  for (let i = k; i < arr.length; i++) {
    windowSum += arr[i] - arr[i - k];
    maxSum = Math.max(maxSum, windowSum);
    console.log("Window [" + (i-k+1) + ".." + i + "] sum =", windowSum);
  }
  
  return maxSum;
}

const arr = [2, 1, 5, 1, 3, 2];
const k = 3;
console.log("Max sum of window size", k, "=", maxSumWindow(arr, k));`,
  },
  prefixSum: {
    label: 'Prefix Sum', category: 'Arrays', language: 'javascript',
    code: `// Prefix Sum Array — O(1) range queries
function buildPrefix(arr) {
  const prefix = [0];
  for (let i = 0; i < arr.length; i++) {
    prefix.push(prefix[i] + arr[i]);
  }
  return prefix;
}

function rangeSum(prefix, left, right) {
  return prefix[right + 1] - prefix[left];
}

const arr = [3, 1, 4, 1, 5, 9, 2, 6];
const prefix = buildPrefix(arr);
console.log("Array:", arr);
console.log("Prefix:", prefix);
console.log("Sum [1..4]:", rangeSum(prefix, 1, 4));
console.log("Sum [2..6]:", rangeSum(prefix, 2, 6));`,
  },
  twoPointers: {
    label: 'Two Pointers', category: 'Arrays', language: 'javascript',
    code: `// Two Pointers — Find pair with target sum in sorted array
function twoPointerSum(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  const pairs = [];
  
  while (left < right) {
    const sum = arr[left] + arr[right];
    console.log("left=" + arr[left] + " right=" + arr[right] + " sum=" + sum);
    
    if (sum === target) {
      pairs.push([arr[left], arr[right]]);
      left++;
      right--;
    } else if (sum < target) {
      left++;
    } else {
      right--;
    }
  }
  return pairs;
}

const arr = [1, 2, 3, 4, 6, 8, 9];
console.log("Pairs summing to 10:", twoPointerSum(arr, 10));`,
  },

  // ─── Strings ─────────────────────────────────────────────────────────────────
  longestSubstring: {
    label: 'Longest Unique Substring', category: 'Strings', language: 'javascript',
    code: `// Longest Substring Without Repeating Characters
function lengthOfLongest(s) {
  const map = new Map();
  let maxLen = 0;
  let start = 0;
  
  for (let end = 0; end < s.length; end++) {
    const char = s[end];
    
    if (map.has(char) && map.get(char) >= start) {
      start = map.get(char) + 1;
    }
    
    map.set(char, end);
    const len = end - start + 1;
    maxLen = Math.max(maxLen, len);
    
    const window = s.substring(start, end + 1);
    console.log("Window: [" + window + "] len=" + len);
  }
  
  return maxLen;
}

console.log("abcabcbb →", lengthOfLongest("abcabcbb"));
console.log("pwwkew  →", lengthOfLongest("pwwkew"));`,
  },
  anagram: {
    label: 'Anagram Check', category: 'Strings', language: 'javascript',
    code: `// Check if two strings are anagrams
function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  
  const count = {};
  
  for (const char of s) {
    count[char] = (count[char] || 0) + 1;
  }
  
  for (const char of t) {
    if (!count[char]) return false;
    count[char]--;
  }
  
  return true;
}

console.log("'anagram' & 'nagaram':", isAnagram("anagram", "nagaram"));
console.log("'rat' & 'car':", isAnagram("rat", "car"));
console.log("'listen' & 'silent':", isAnagram("listen", "silent"));`,
  },
  countVowels: {
    label: 'Count Vowels/Words', category: 'Strings', language: 'javascript',
    code: `// String analysis — count vowels, words, chars
function analyzeString(str) {
  const vowels = 'aeiouAEIOU';
  let vowelCount = 0;
  let wordCount = 0;
  let charCount = 0;
  
  const words = str.trim().split(/\s+/);
  wordCount = words.length;
  
  for (const char of str) {
    if (char !== ' ') charCount++;
    if (vowels.includes(char)) vowelCount++;
  }
  
  return { vowelCount, wordCount, charCount };
}

const text = "Hello World from AlgoVision IDE";
const result = analyzeString(text);
console.log("Text:", text);
console.log("Words:", result.wordCount);
console.log("Chars:", result.charCount);
console.log("Vowels:", result.vowelCount);`,
  },

  // ─── Dynamic Programming ─────────────────────────────────────────────────────
  knapsack: {
    label: '0/1 Knapsack', category: 'Dynamic Programming', language: 'javascript',
    code: `// 0/1 Knapsack Problem — Dynamic Programming
function knapsack(weights, values, capacity) {
  const n = weights.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(capacity + 1).fill(0));
  
  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      // Don't take item i
      dp[i][w] = dp[i-1][w];
      
      // Take item i if it fits
      if (weights[i-1] <= w) {
        const withItem = values[i-1] + dp[i-1][w - weights[i-1]];
        dp[i][w] = Math.max(dp[i][w], withItem);
      }
    }
  }
  
  return dp[n][capacity];
}

const weights = [2, 3, 4, 5];
const values = [3, 4, 5, 6];
const capacity = 8;
console.log("Max value:", knapsack(weights, values, capacity));`,
  },
  coinChange: {
    label: 'Coin Change', category: 'Dynamic Programming', language: 'javascript',
    code: `// Coin Change — Minimum coins to make amount
function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  
  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (coin <= i && dp[i - coin] + 1 < dp[i]) {
        dp[i] = dp[i - coin] + 1;
        console.log("dp[" + i + "] = " + dp[i] + " (using coin " + coin + ")");
      }
    }
  }
  
  return dp[amount] === Infinity ? -1 : dp[amount];
}

const coins = [1, 5, 6, 9];
const amount = 11;
console.log("Min coins for", amount, ":", coinChange(coins, amount));`,
  },
  longestCommonSubseq: {
    label: 'Longest Common Subsequence', category: 'Dynamic Programming', language: 'javascript',
    code: `// LCS — Longest Common Subsequence
function lcs(text1, text2) {
  const m = text1.length, n = text2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i-1] === text2[j-1]) {
        dp[i][j] = dp[i-1][j-1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
      }
    }
  }
  
  return dp[m][n];
}

console.log("LCS('abcde','ace') =", lcs("abcde", "ace"));
console.log("LCS('abc','abc') =", lcs("abc", "abc"));`,
  },

  // ─── Patterns ────────────────────────────────────────────────────────────────
  closureCounter: {
    label: 'Closure Counter', category: 'JavaScript Patterns', language: 'javascript',
    code: `// Closures — counter factory
function makeCounter(start = 0, step = 1) {
  let count = start;
  
  return {
    increment() { count += step; return count; },
    decrement() { count -= step; return count; },
    reset()     { count = start; return count; },
    value()     { return count; },
  };
}

const counter = makeCounter(0, 2);
console.log("Start:", counter.value());
console.log("Inc:", counter.increment());
console.log("Inc:", counter.increment());
console.log("Inc:", counter.increment());
console.log("Dec:", counter.decrement());
console.log("Reset:", counter.reset());`,
  },
  promiseChain: {
    label: 'Array Methods Chain', category: 'JavaScript Patterns', language: 'javascript',
    code: `// Functional Array methods — map, filter, reduce
const students = [
  { name: 'Alice', score: 92, grade: 'A' },
  { name: 'Bob',   score: 78, grade: 'B' },
  { name: 'Carol', score: 88, grade: 'A' },
  { name: 'Dave',  score: 65, grade: 'C' },
  { name: 'Eve',   score: 95, grade: 'A' },
];

// Get A-grade students, sorted by score
const topStudents = students
  .filter(s => s.grade === 'A')
  .sort((a, b) => b.score - a.score)
  .map(s => s.name + ' (' + s.score + ')');

const average = students.reduce((sum, s) => sum + s.score, 0) / students.length;

console.log("Top students:", topStudents);
console.log("Class average:", average.toFixed(1));`,
  },
  recursiveTree: {
    label: 'Recursive Patterns', category: 'JavaScript Patterns', language: 'javascript',
    code: `// Memoization pattern
function memoize(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      console.log("Cache hit for", args[0]);
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

const fib = memoize(function(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
});

for (let i = 0; i <= 8; i++) {
  console.log("F(" + i + ") =", fib(i));
}`,
  },

  // ─── OOP ────────────────────────────────────────────────────────────────────
  classInheritance: {
    label: 'Class Inheritance', category: 'OOP', language: 'javascript',
    code: `// OOP — Inheritance & Polymorphism
class Shape {
  constructor(color) {
    this.color = color;
  }
  area() { return 0; }
  toString() { return this.color + ' ' + this.constructor.name + ' area=' + this.area().toFixed(2); }
}

class Circle extends Shape {
  constructor(color, radius) {
    super(color);
    this.radius = radius;
  }
  area() { return Math.PI * this.radius ** 2; }
}

class Rectangle extends Shape {
  constructor(color, w, h) {
    super(color);
    this.width = w;
    this.height = h;
  }
  area() { return this.width * this.height; }
}

const shapes = [
  new Circle('red', 5),
  new Rectangle('blue', 4, 6),
  new Circle('green', 3),
];

shapes.forEach(s => console.log(s.toString()));
const total = shapes.reduce((sum, s) => sum + s.area(), 0);
console.log("Total area:", total.toFixed(2));`,
  },

  // ─── Bit Manipulation ────────────────────────────────────────────────────────
  bitOps: {
    label: 'Bit Manipulation', category: 'Bit Ops', language: 'javascript',
    code: `// Bit Manipulation Tricks
function countBits(n) {
  let count = 0;
  while (n > 0) {
    count += n & 1;
    n >>= 1;
  }
  return count;
}

function isPowerOfTwo(n) {
  return n > 0 && (n & (n - 1)) === 0;
}

function swapWithoutTemp(a, b) {
  a ^= b; b ^= a; a ^= b;
  return [a, b];
}

for (let i = 0; i <= 8; i++) {
  console.log(i + ": bits=" + countBits(i) + " pow2=" + isPowerOfTwo(i));
}
console.log("Swap 5,9:", swapWithoutTemp(5, 9));`,
  },

  // ─── Misc ────────────────────────────────────────────────────────────────────
  numberPatterns: {
    label: 'Number Patterns', category: 'Misc', language: 'javascript',
    code: `// Number Patterns — Pascal's Triangle, Armstrong, Perfect numbers
function pascal(rows) {
  const tri = [[1]];
  for (let i = 1; i < rows; i++) {
    const row = [1];
    for (let j = 1; j < i; j++) {
      row.push(tri[i-1][j-1] + tri[i-1][j]);
    }
    row.push(1);
    tri.push(row);
  }
  return tri;
}

const tri = pascal(6);
tri.forEach(row => console.log(row.join(' ')));`,
  },
  matrixOps: {
    label: 'Matrix Operations', category: 'Misc', language: 'javascript',
    code: `// Matrix — rotate 90°, transpose, spiral order
function rotate90(matrix) {
  const n = matrix.length;
  // Transpose
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
    }
  }
  // Reverse each row
  for (let i = 0; i < n; i++) {
    matrix[i].reverse();
  }
  return matrix;
}

const m = [[1,2,3],[4,5,6],[7,8,9]];
console.log("Before:", JSON.stringify(m));
const rotated = rotate90(m);
rotated.forEach((row, i) => console.log("Row " + i + ":", row));`,
  },
}

// All samples merged (imported at top of file)
export const ALL_SAMPLES = { ...GENERAL_SAMPLES }

export const ALL_CATEGORIES = [
  'Sorting', 'Searching', 'Recursion',
  'Data Structures', 'Graphs', 'Problems',
  'Arrays', 'Strings', 'Math',
  'Dynamic Programming', 'JavaScript Patterns', 'OOP', 'Bit Ops', 'Misc',
]
