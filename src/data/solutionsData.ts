/**
 * Top-30 NeetCode Solutions
 * Each solution is a complete, runnable JS string with console.log('Result:', ...) at the end.
 * Variable names are chosen to trigger the visualizer's auto-detection
 * (e.g. left/right for two-pointers, stack for stack problems, map for hashmaps, etc.)
 */
export const SOLUTIONS: Record<string, string> = {

  // ──────────────────────────────────────────────────────────────────
  // Arrays & Hashing
  // ──────────────────────────────────────────────────────────────────

  "217": `// Contains Duplicate — HashSet O(n) time, O(n) space
// Pattern: HashSet — insert each element; if already in set, duplicate found
function containsDuplicate(nums) {
  const seen = new Set();
  for (let i = 0; i < nums.length; i++) {
    if (seen.has(nums[i])) return true;  // duplicate!
    seen.add(nums[i]);
  }
  return false;
}
const result = containsDuplicate([1, 2, 3, 1]);
console.log('Result:', result);`,

  "242": `// Valid Anagram — Character frequency count O(n)
// Pattern: HashMap — count chars in s, subtract for t; zero map = anagram
function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  const count = new Map();
  for (let i = 0; i < s.length; i++) {
    count.set(s[i], (count.get(s[i]) || 0) + 1);
  }
  for (let i = 0; i < t.length; i++) {
    if (!count.has(t[i])) return false;
    count.set(t[i], count.get(t[i]) - 1);
    if (count.get(t[i]) === 0) count.delete(t[i]);
  }
  return count.size === 0;
}
const result = isAnagram("anagram", "nagaram");
console.log('Result:', result);`,

  "1": `// Two Sum — HashMap for complement lookup O(n)
// Pattern: HashMap — store value->index; for each num, check if complement exists
function twoSum(nums, target) {
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

  "49": `// Group Anagrams — Sorted key as group identifier O(n * k log k)
// Pattern: HashMap — sort each word as the key, group all anagrams together
function groupAnagrams(strs) {
  const map = new Map();
  for (let i = 0; i < strs.length; i++) {
    const key = strs[i].split('').sort().join('');
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(strs[i]);
  }
  return Array.from(map.values());
}
const result = groupAnagrams(["eat","tea","tan","ate","nat","bat"]);
console.log('Result:', JSON.stringify(result));`,

  "347": `// Top K Frequent Elements — Bucket Sort O(n)
// Pattern: Bucket Sort — use frequency as bucket index, scan from high to low
function topKFrequent(nums, k) {
  const count = new Map();
  for (let i = 0; i < nums.length; i++) {
    count.set(nums[i], (count.get(nums[i]) || 0) + 1);
  }
  // buckets[freq] = [num1, num2, ...]
  const buckets = Array.from({ length: nums.length + 1 }, () => []);
  for (const [num, freq] of count) {
    buckets[freq].push(num);
  }
  const result = [];
  for (let i = buckets.length - 1; i >= 0 && result.length < k; i--) {
    for (const num of buckets[i]) {
      result.push(num);
      if (result.length === k) break;
    }
  }
  return result;
}
const result = topKFrequent([1,1,1,2,2,3], 2);
console.log('Result:', result);`,

  "128": `// Longest Consecutive Sequence — HashSet O(n)
// Pattern: HashSet — only start counting from the START of a sequence
function longestConsecutive(nums) {
  const numSet = new Set(nums);
  let longest = 0;
  for (let i = 0; i < nums.length; i++) {
    // Only start counting if nums[i]-1 is NOT in set (sequence start)
    if (!numSet.has(nums[i] - 1)) {
      let length = 1;
      let curr = nums[i];
      while (numSet.has(curr + 1)) {
        curr++;
        length++;
      }
      longest = Math.max(longest, length);
    }
  }
  return longest;
}
const result = longestConsecutive([100,4,200,1,3,2]);
console.log('Result:', result);`,

  // ──────────────────────────────────────────────────────────────────
  // Two Pointers
  // ──────────────────────────────────────────────────────────────────

  "125": `// Valid Palindrome — Two Pointers O(n)
// Pattern: Two Pointers — start from both ends, skip non-alphanumeric
function isPalindrome(s) {
  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  let left = 0;
  let right = clean.length - 1;
  while (left < right) {
    if (clean[left] !== clean[right]) return false;  // mismatch
    left++;
    right--;
  }
  return true;
}
const result = isPalindrome("A man, a plan, a canal: Panama");
console.log('Result:', result);`,

  "167": `// Two Sum II (Sorted Array) — Two Pointers O(n)
// Pattern: Two Pointers — sum too small: move left right; too big: move right left
function twoSum(numbers, target) {
  let left = 0;
  let right = numbers.length - 1;
  while (left < right) {
    const sum = numbers[left] + numbers[right];
    if (sum === target) return [left + 1, right + 1];  // 1-indexed answer
    if (sum < target) left++;   // need a bigger sum
    else right--;               // need a smaller sum
  }
  return [];
}
const result = twoSum([2,7,11,15], 9);
console.log('Result:', result);`,

  "15": `// 3Sum — Sort + Two Pointers O(n²)
// Pattern: Sort first, then for each element use two-pointer to find pair
function threeSum(nums) {
  nums.sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue;  // skip duplicate i
    let left = i + 1;
    let right = nums.length - 1;
    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];
      if (sum === 0) {
        result.push([nums[i], nums[left], nums[right]]);
        while (left < right && nums[left] === nums[left + 1]) left++;
        while (left < right && nums[right] === nums[right - 1]) right--;
        left++;
        right--;
      } else if (sum < 0) {
        left++;
      } else {
        right--;
      }
    }
  }
  return result;
}
const result = threeSum([-1, 0, 1, 2, -1, -4]);
console.log('Result:', JSON.stringify(result));`,

  "11": `// Container With Most Water — Two Pointers O(n)
// Pattern: Greedy Two Pointers — always move the shorter wall inward
function maxArea(height) {
  let left = 0;
  let right = height.length - 1;
  let maxWater = 0;
  while (left < right) {
    const h = Math.min(height[left], height[right]);
    const water = h * (right - left);
    maxWater = Math.max(maxWater, water);
    // Moving the taller side can't increase water, so move the shorter
    if (height[left] < height[right]) left++;
    else right--;
  }
  return maxWater;
}
const result = maxArea([1,8,6,2,5,4,8,3,7]);
console.log('Result:', result);`,

  // ──────────────────────────────────────────────────────────────────
  // Sliding Window
  // ──────────────────────────────────────────────────────────────────

  "121": `// Best Time to Buy and Sell Stock — Sliding Window O(n)
// Pattern: Track min price so far; profit = current - min
function maxProfit(prices) {
  let left = 0;   // buy day pointer
  let right = 1;  // sell day pointer
  let maxProfit = 0;
  while (right < prices.length) {
    if (prices[left] < prices[right]) {
      const profit = prices[right] - prices[left];
      maxProfit = Math.max(maxProfit, profit);
    } else {
      left = right;  // new cheaper buy day found
    }
    right++;
  }
  return maxProfit;
}
const result = maxProfit([7, 1, 5, 3, 6, 4]);
console.log('Result:', result);`,

  "3": `// Longest Substring Without Repeating Characters — Sliding Window O(n)
// Pattern: Expand right, shrink left when duplicate found
function lengthOfLongestSubstring(s) {
  const seen = new Map();   // char -> last index
  let left = 0;
  let maxLen = 0;
  for (let right = 0; right < s.length; right++) {
    if (seen.has(s[right]) && seen.get(s[right]) >= left) {
      left = seen.get(s[right]) + 1;  // shrink: jump past the duplicate
    }
    seen.set(s[right], right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}
const result = lengthOfLongestSubstring("abcabcbb");
console.log('Result:', result);`,

  "424": `// Longest Repeating Character Replacement — Sliding Window O(n)
// Pattern: Window is valid if (window size - max freq char) <= k
function characterReplacement(s, k) {
  const count = new Array(26).fill(0);
  let maxCount = 0;  // highest freq of any single char in current window
  let left = 0;
  let maxLen = 0;
  for (let right = 0; right < s.length; right++) {
    const idx = s.charCodeAt(right) - 65;
    count[idx]++;
    maxCount = Math.max(maxCount, count[idx]);
    // If replacements needed exceed k, shrink from left
    while ((right - left + 1) - maxCount > k) {
      count[s.charCodeAt(left) - 65]--;
      left++;
    }
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}
const result = characterReplacement("AABABBA", 1);
console.log('Result:', result);`,

  // ──────────────────────────────────────────────────────────────────
  // Stack
  // ──────────────────────────────────────────────────────────────────

  "20": `// Valid Parentheses — Monotonic Stack O(n)
// Pattern: Push opening brackets; pop on closing and verify match
function isValid(s) {
  const stack = [];
  const map = { ')': '(', ']': '[', '}': '{' };
  for (let i = 0; i < s.length; i++) {
    if ('([{'.includes(s[i])) {
      stack.push(s[i]);  // opening bracket — push
    } else {
      if (stack.pop() !== map[s[i]]) return false;  // closing — must match
    }
  }
  return stack.length === 0;
}
const result = isValid("()[]{}")
console.log('Result:', result);`,

  "739": `// Daily Temperatures — Monotonic Decreasing Stack O(n)
// Pattern: Stack stores indices; pop when we find a warmer day
function dailyTemperatures(temperatures) {
  const result = new Array(temperatures.length).fill(0);
  const stack = [];  // stores indices of days waiting for warmer temp
  for (let i = 0; i < temperatures.length; i++) {
    while (stack.length > 0 && temperatures[i] > temperatures[stack[stack.length - 1]]) {
      const prevIdx = stack.pop();
      result[prevIdx] = i - prevIdx;  // days waited = current - popped index
    }
    stack.push(i);
  }
  return result;
}
const result = dailyTemperatures([73,74,75,71,69,72,76,73]);
console.log('Result:', result);`,

  "155": `// Min Stack — Auxiliary Stack O(1) all ops
// Pattern: Track current minimum at every height with a secondary min-stack
class MinStack {
  constructor() {
    this.stack = [];
    this.minStack = [];
  }
  push(val) {
    this.stack.push(val);
    const min = this.minStack.length === 0 ? val : Math.min(val, this.minStack[this.minStack.length - 1]);
    this.minStack.push(min);
  }
  pop() {
    this.stack.pop();
    this.minStack.pop();
  }
  top() {
    return this.stack[this.stack.length - 1];
  }
  getMin() {
    return this.minStack[this.minStack.length - 1];
  }
}
const ms = new MinStack();
ms.push(-2);
ms.push(0);
ms.push(-3);
console.log('min:', ms.getMin());
ms.pop();
console.log('top:', ms.top());
console.log('min:', ms.getMin());`,

  // ──────────────────────────────────────────────────────────────────
  // Binary Search
  // ──────────────────────────────────────────────────────────────────

  "704": `// Binary Search — Classic O(log n)
// Pattern: Eliminate half the search space each step
function binarySearch(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) return mid;      // found!
    if (nums[mid] < target) left = mid + 1;   // target is in right half
    else right = mid - 1;                     // target is in left half
  }
  return -1;
}
const result = binarySearch([-1,0,3,5,9,12], 9);
console.log('Result:', result);`,

  "153": `// Find Minimum in Rotated Sorted Array — Binary Search O(log n)
// Pattern: The side where nums[mid] > nums[right] is the inflated side
function findMin(nums) {
  let left = 0;
  let right = nums.length - 1;
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] > nums[right]) {
      left = mid + 1;  // minimum is in the right half
    } else {
      right = mid;     // minimum is in the left half (including mid)
    }
  }
  return nums[left];
}
const result = findMin([3,4,5,1,2]);
console.log('Result:', result);`,

  // ──────────────────────────────────────────────────────────────────
  // Linked List
  // ──────────────────────────────────────────────────────────────────

  "206": `// Reverse Linked List — Iterative O(n)
// Pattern: Three-pointer (prev, curr, next) — reverse one link at a time
function ListNode(val, next) { this.val = val; this.next = next || null; }
function reverseList(head) {
  let prev = null;
  let curr = head;
  while (curr !== null) {
    const nextNode = curr.next;  // save next before overwriting
    curr.next = prev;            // reverse the link
    prev = curr;                 // move prev forward
    curr = nextNode;             // move curr forward
  }
  return prev;  // prev is the new head
}
const head = new ListNode(1, new ListNode(2, new ListNode(3, new ListNode(4, new ListNode(5)))));
const result = reverseList(head);
let node = result; const vals = [];
while (node) { vals.push(node.val); node = node.next; }
console.log('Result:', vals);`,

  "21": `// Merge Two Sorted Lists — Iterative with dummy head O(n+m)
// Pattern: Compare heads, attach smaller, advance that pointer
function ListNode(val, next) { this.val = val; this.next = next || null; }
function mergeTwoLists(list1, list2) {
  const dummy = new ListNode(0);
  let curr = dummy;
  while (list1 !== null && list2 !== null) {
    if (list1.val <= list2.val) {
      curr.next = list1;
      list1 = list1.next;
    } else {
      curr.next = list2;
      list2 = list2.next;
    }
    curr = curr.next;
  }
  curr.next = list1 !== null ? list1 : list2;  // attach remaining
  return dummy.next;
}
const l1 = new ListNode(1, new ListNode(2, new ListNode(4)));
const l2 = new ListNode(1, new ListNode(3, new ListNode(4)));
const result = mergeTwoLists(l1, l2);
let node = result; const vals = [];
while (node) { vals.push(node.val); node = node.next; }
console.log('Result:', vals);`,

  "143": `// Reorder List — Find mid + Reverse + Merge O(n)
// Pattern: Three-step: slow/fast to find mid, reverse 2nd half, merge halves
function ListNode(val, next) { this.val = val; this.next = next || null; }
function reorderList(head) {
  // Step 1: Find middle with slow/fast pointers
  let slow = head, fast = head.next;
  while (fast && fast.next) { slow = slow.next; fast = fast.next.next; }
  // Step 2: Reverse second half
  let prev = null, curr = slow.next;
  slow.next = null;  // cut list in half
  while (curr) { const next = curr.next; curr.next = prev; prev = curr; curr = next; }
  // Step 3: Merge two halves
  let first = head, second = prev;
  while (second) {
    const tmp1 = first.next, tmp2 = second.next;
    first.next = second; second.next = tmp1;
    first = tmp1; second = tmp2;
  }
  return head;
}
const head = new ListNode(1, new ListNode(2, new ListNode(3, new ListNode(4))));
reorderList(head);
let node = head; const vals = [];
while (node) { vals.push(node.val); node = node.next; }
console.log('Result:', vals);`,

  "141": `// Linked List Cycle — Floyd's Tortoise and Hare O(n) time, O(1) space
function ListNode(val, next) { this.val = val; this.next = next || null; }
function hasCycle(head) {
  let slow = head;
  let fast = head;
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
const result = hasCycle(node1);
console.log('Result:', result);`,

  "19": `// Remove Nth Node From End of List — Two Pointers O(n) time, O(1) space
function ListNode(val, next) { this.val = val; this.next = next || null; }
function removeNthFromEnd(head, n) {
  const dummy = new ListNode(0, head);
  let fast = dummy;
  let slow = dummy;
  for (let i = 0; i <= n; i++) {
    fast = fast.next;
  }
  while (fast !== null) {
    slow = slow.next;
    fast = fast.next;
  }
  slow.next = slow.next.next;
  return dummy.next;
}
const head = new ListNode(1, new ListNode(2, new ListNode(3, new ListNode(4, new ListNode(5)))));
const result = removeNthFromEnd(head, 2);
let node = result; const vals = [];
while (node) { vals.push(node.val); node = node.next; }
console.log('Result:', vals);`,

  // ──────────────────────────────────────────────────────────────────
  // Trees
  // ──────────────────────────────────────────────────────────────────

  "226": `// Invert Binary Tree — Recursive DFS O(n)
// Pattern: Post-order — invert children first, then swap
function TreeNode(val, left, right) { this.val = val; this.left = left||null; this.right = right||null; }
function invertTree(root) {
  if (root === null) return null;
  const temp = root.left;
  root.left = invertTree(root.right);
  root.right = invertTree(temp);
  return root;
}
const root = new TreeNode(4,
  new TreeNode(2, new TreeNode(1), new TreeNode(3)),
  new TreeNode(7, new TreeNode(6), new TreeNode(9))
);
const inverted = invertTree(root);
console.log('Result: root=', inverted.val, 'left=', inverted.left.val, 'right=', inverted.right.val);`,

  "104": `// Maximum Depth of Binary Tree — Recursive DFS O(n)
// Pattern: depth(node) = 1 + max(depth(left), depth(right))
function TreeNode(val, left, right) { this.val = val; this.left = left||null; this.right = right||null; }
function maxDepth(root) {
  if (root === null) return 0;
  const leftDepth = maxDepth(root.left);
  const rightDepth = maxDepth(root.right);
  return 1 + Math.max(leftDepth, rightDepth);
}
const root = new TreeNode(3,
  new TreeNode(9),
  new TreeNode(20, new TreeNode(15), new TreeNode(7))
);
const result = maxDepth(root);
console.log('Result:', result);`,

  "100": `// Same Tree — Recursive DFS O(n)
// Pattern: Two trees are identical if root values match and both left & right subtrees match
function TreeNode(val, left, right) { this.val = val; this.left = left||null; this.right = right||null; }
function isSameTree(p, q) {
  if (p === null && q === null) return true;
  if (p === null || q === null) return false;
  if (p.val !== q.val) return false;
  return isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
}
const p = new TreeNode(1, new TreeNode(2), new TreeNode(3));
const q = new TreeNode(1, new TreeNode(2), new TreeNode(3));
const result = isSameTree(p, q);
console.log('Result:', result);`,

  "543": `// Diameter of Binary Tree — DFS, track max path through each node
// Pattern: At each node, diameter candidate = left height + right height
function TreeNode(val, left, right) { this.val = val; this.left = left||null; this.right = right||null; }
function diameterOfBinaryTree(root) {
  let diameter = 0;
  function dfs(node) {
    if (node === null) return 0;
    const left = dfs(node.left);
    const right = dfs(node.right);
    diameter = Math.max(diameter, left + right);  // path through this node
    return 1 + Math.max(left, right);             // return height to parent
  }
  dfs(root);
  return diameter;
}
const root = new TreeNode(1,
  new TreeNode(2, new TreeNode(4), new TreeNode(5)),
  new TreeNode(3)
);
const result = diameterOfBinaryTree(root);
console.log('Result:', result);`,

  "102": `// Binary Tree Level Order Traversal — BFS with Queue O(n)
// Pattern: Process one level at a time using queue, track level boundaries
function TreeNode(val, left, right) { this.val = val; this.left = left||null; this.right = right||null; }
function levelOrder(root) {
  if (!root) return [];
  const result = [];
  const queue = [root];
  while (queue.length > 0) {
    const levelSize = queue.length;  // freeze current level count
    const level = [];
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();    // dequeue front
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(level);
  }
  return result;
}
const root = new TreeNode(3,
  new TreeNode(9),
  new TreeNode(20, new TreeNode(15), new TreeNode(7))
);
const result = levelOrder(root);
console.log('Result:', JSON.stringify(result));`,

  "98": `// Validate Binary Search Tree — DFS with bounds O(n)
// Pattern: Each node must satisfy min < node.val < max (passed from parent)
function TreeNode(val, left, right) { this.val = val; this.left = left||null; this.right = right||null; }
function isValidBST(root) {
  function validate(node, min, max) {
    if (node === null) return true;
    if (node.val <= min || node.val >= max) return false;  // violates BST
    return validate(node.left, min, node.val) &&
           validate(node.right, node.val, max);
  }
  return validate(root, -Infinity, Infinity);
}
const root = new TreeNode(2, new TreeNode(1), new TreeNode(3));
const result = isValidBST(root);
console.log('Result:', result);`,

  "230": `// Kth Smallest Element in a BST — In-order Traversal O(H + k)
// Pattern: In-order traversal visits BST in ascending order; k-th node visited is the answer
function TreeNode(val, left, right) { this.val = val; this.left = left||null; this.right = right||null; }
function kthSmallest(root, k) {
  let count = 0;
  let result = null;
  function inorder(node) {
    if (!node || result !== null) return;
    inorder(node.left);
    count++;
    if (count === k) {
      result = node.val;
      return;
    }
    inorder(node.right);
  }
  inorder(root);
  return result;
}
const root = new TreeNode(3,
  new TreeNode(1, null, new TreeNode(2)),
  new TreeNode(4)
);
const result = kthSmallest(root, 1);
console.log('Result:', result);`,

  // ──────────────────────────────────────────────────────────────────
  // Heap / Priority Queue
  // ──────────────────────────────────────────────────────────────────

  "703": `// Kth Largest Element in a Stream — Min-Heap O(log k)
// Pattern: Maintain min-heap of size k; top of heap is always kth largest
class KthLargest {
  constructor(k, nums) {
    this.k = k;
    this.heap = [];
    for (const n of nums) this.add(n);
  }
  add(val) {
    this.heap.push(val);
    let i = this.heap.length - 1;
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (this.heap[i] < this.heap[p]) {
        [this.heap[i], this.heap[p]] = [this.heap[p], this.heap[i]];
        i = p;
      } else break;
    }
    if (this.heap.length > this.k) {
      this.heap[0] = this.heap.pop();
      let curr = 0;
      while (true) {
        let smallest = curr;
        const l = 2 * curr + 1, r = 2 * curr + 2;
        if (l < this.heap.length && this.heap[l] < this.heap[smallest]) smallest = l;
        if (r < this.heap.length && this.heap[r] < this.heap[smallest]) smallest = r;
        if (smallest !== curr) {
          [this.heap[curr], this.heap[smallest]] = [this.heap[smallest], this.heap[curr]];
          curr = smallest;
        } else break;
      }
    }
    return this.heap[0];
  }
}
const kthLargest = new KthLargest(3, [4, 5, 8, 2]);
console.log('add(3):', kthLargest.add(3));
console.log('add(5):', kthLargest.add(5));
console.log('add(10):', kthLargest.add(10));`,

  "215": `// Kth Largest Element in an Array — Min-Heap O(n log k)
// Pattern: Keep min-heap of size k; elements smaller than root are discarded
function findKthLargest(nums, k) {
  const heap = [];
  function push(val) {
    heap.push(val);
    let i = heap.length - 1;
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (heap[i] < heap[p]) {
        [heap[i], heap[p]] = [heap[p], heap[i]];
        i = p;
      } else break;
    }
  }
  function pop() {
    const min = heap[0];
    const last = heap.pop();
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      while (true) {
        let smallest = i;
        const l = 2 * i + 1, r = 2 * i + 2;
        if (l < heap.length && heap[l] < heap[smallest]) smallest = l;
        if (r < heap.length && heap[r] < heap[smallest]) smallest = r;
        if (smallest !== i) {
          [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
          i = smallest;
        } else break;
      }
    }
    return min;
  }
  for (const num of nums) {
    push(num);
    if (heap.length > k) pop();
  }
  return heap[0];
}
const result = findKthLargest([3, 2, 1, 5, 6, 4], 2);
console.log('Result:', result);`,

  // ──────────────────────────────────────────────────────────────────
  // 1-D Dynamic Programming
  // ──────────────────────────────────────────────────────────────────

  "70": `// Climbing Stairs — DP (Fibonacci) O(n), O(1) space
// Pattern: dp[i] = dp[i-1] + dp[i-2] — ways to climb i stairs
function climbStairs(n) {
  if (n <= 2) return n;
  let prev2 = 1;   // dp[i-2]: ways to reach step 1
  let prev1 = 2;   // dp[i-1]: ways to reach step 2
  for (let i = 3; i <= n; i++) {
    const curr = prev1 + prev2;
    prev2 = prev1;
    prev1 = curr;
  }
  return prev1;
}
const result = climbStairs(6);
console.log('Result:', result);`,

  "198": `// House Robber — DP O(n), O(1) space
// Pattern: At each house, take max of (rob this + 2 ago) vs (skip = prev)
function rob(nums) {
  let prev2 = 0;
  let prev1 = 0;
  for (let i = 0; i < nums.length; i++) {
    const curr = Math.max(prev1, prev2 + nums[i]);
    prev2 = prev1;
    prev1 = curr;
  }
  return prev1;
}
const result = rob([2, 7, 9, 3, 1]);
console.log('Result:', result);`,

  "322": `// Coin Change — DP bottom-up O(amount * coins)
// Pattern: dp[i] = min coins to make amount i; build from 0 up to target
function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;  // 0 coins needed for amount 0
  for (let i = 1; i <= amount; i++) {
    for (let j = 0; j < coins.length; j++) {
      if (coins[j] <= i && dp[i - coins[j]] + 1 < dp[i]) {
        dp[i] = dp[i - coins[j]] + 1;
      }
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}
const result = coinChange([1, 5, 10, 25], 41);
console.log('Result:', result);`,

  "300": `// Longest Increasing Subsequence — DP O(n²)
// Pattern: dp[i] = LIS ending at index i; check all j < i where nums[j] < nums[i]
function lengthOfLIS(nums) {
  const dp = new Array(nums.length).fill(1);
  let maxLen = 1;
  for (let i = 1; i < nums.length; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) {
        dp[i] = Math.max(dp[i], dp[j] + 1);
      }
    }
    maxLen = Math.max(maxLen, dp[i]);
  }
  return maxLen;
}
const result = lengthOfLIS([10,9,2,5,3,7,101,18]);
console.log('Result:', result);`,

  // ──────────────────────────────────────────────────────────────────
  // Backtracking
  // ──────────────────────────────────────────────────────────────────

  "51": `// N-Queens — Backtracking O(N!)
// Pattern: Place queens row-by-row; validate column and diagonals
function solveNQueens(n) {
  const result = [];
  const board = Array.from({ length: n }, () => Array(n).fill('.'));

  function isValid(r, c) {
    for (let i = 0; i < r; i++) {
      if (board[i][c] === 'Q') return false;
      const cDiff = Math.abs(c - board[i].indexOf('Q'));
      if (cDiff === r - i) return false;
    }
    return true;
  }

  function backtrack(r) {
    if (r === n) {
      result.push(board.map(row => row.join('')));
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
  return result;
}
const result = solveNQueens(4);
console.log('Solutions:', result.length);`,

  // ──────────────────────────────────────────────────────────────────
  // Graphs
  // ──────────────────────────────────────────────────────────────────

  "200": `// Number of Islands — DFS Flood Fill O(m*n)
// Pattern: For each unvisited '1', DFS and mark whole island as visited
function numIslands(grid) {
  let count = 0;
  function dfs(r, c) {
    if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length) return;
    if (grid[r][c] !== '1') return;
    grid[r][c] = '0';  // mark visited by sinking the island
    dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1);
  }
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c] === '1') { count++; dfs(r, c); }
    }
  }
  return count;
}
const grid = [
  ['1','1','0','0','0'],
  ['1','1','0','0','0'],
  ['0','0','1','0','0'],
  ['0','0','0','1','1']
];
const result = numIslands(grid);
console.log('Result:', result);`,

  "207": `// Course Schedule — Cycle detection with DFS O(V+E)
// Pattern: UNVISITED=0, VISITING=1, VISITED=2; cycle = VISITING node found again
function canFinish(numCourses, prerequisites) {
  const graph = {};
  for (let i = 0; i < numCourses; i++) graph[i] = [];
  for (const [a, b] of prerequisites) graph[a].push(b);
  const state = new Array(numCourses).fill(0); // 0=unvisited, 1=visiting, 2=visited
  function dfs(node) {
    if (state[node] === 1) return false;  // back edge = cycle!
    if (state[node] === 2) return true;   // already fully processed
    state[node] = 1;  // mark as in-progress
    for (const neighbor of graph[node]) {
      if (!dfs(neighbor)) return false;
    }
    state[node] = 2;  // fully processed
    return true;
  }
  for (let i = 0; i < numCourses; i++) {
    if (!dfs(i)) return false;
  }
  return true;
}
const result = canFinish(5, [[1,0],[2,0],[3,1],[3,2]]);
console.log('Result:', result);`,

  "695": `// Max Area of Island — DFS Traversal O(m*n)
// Pattern: Sinking island cells to 0 and counting connected component size
function maxAreaOfIsland(grid) {
  let maxArea = 0;
  function dfs(r, c) {
    if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] === 0) {
      return 0;
    }
    grid[r][c] = 0; // sink cell
    let area = 1;
    area += dfs(r + 1, c);
    area += dfs(r - 1, c);
    area += dfs(r, c + 1);
    area += dfs(r, c - 1);
    return area;
  }
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c] === 1) {
        const area = dfs(r, c);
        if (area > maxArea) maxArea = area;
      }
    }
  }
  return maxArea;
}
const grid = [
  [0, 1, 1, 0, 0],
  [0, 1, 1, 0, 0],
  [0, 0, 0, 1, 1],
  [0, 0, 0, 1, 1]
];
const result = maxAreaOfIsland(grid);
console.log('Result:', result);`,

  "133": `// Clone Graph — BFS Traversal O(V+E)
// Pattern: Map original nodes to copies, propagate neighbors with queue
function cloneGraph(graph, start = 1) {
  if (!graph || Object.keys(graph).length === 0) return {};
  const cloned = {};
  const queue = [start];
  cloned[start] = [];
  while (queue.length > 0) {
    const curr = queue.shift();
    const neighbors = graph[curr] || [];
    for (const neighbor of neighbors) {
      if (!cloned[neighbor]) {
        cloned[neighbor] = [];
        queue.push(neighbor);
      }
      cloned[curr].push(neighbor);
    }
  }
  return cloned;
}
const graph = {
  1: [2, 4],
  2: [1, 3],
  3: [2, 4],
  4: [1, 3]
};
const result = cloneGraph(graph, 1);
console.log('Result:', result);`,

  "1036": `// Rotting Oranges — Multi-Source BFS O(m*n)
// Pattern: Enqueue all initial rotten oranges (2), spread rotting to fresh (1) level by level
function orangesRotting(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const queue = [];
  let fresh = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 2) {
        queue.push([r, c]);
      } else if (grid[r][c] === 1) {
        fresh++;
      }
    }
  }
  if (fresh === 0) return 0;
  let minutes = 0;
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (queue.length > 0 && fresh > 0) {
    const size = queue.length;
    for (let i = 0; i < size; i++) {
      const curr = queue.shift();
      const r = curr[0];
      const c = curr[1];
      for (const d of dirs) {
        const nr = r + d[0];
        const nc = c + d[1];
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1) {
          grid[nr][nc] = 2; // rot the orange
          fresh--;
          queue.push([nr, nc]);
        }
      }
    }
    minutes++;
  }
  return fresh === 0 ? minutes : -1;
}
const grid = [
  [2, 1, 1],
  [1, 1, 0],
  [0, 1, 1]
];
const result = orangesRotting(grid);
console.log('Result:', result);`,

  "994": `// Rotting Oranges — Multi-Source BFS O(m*n)
function orangesRotting(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const queue = [];
  let fresh = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 2) queue.push([r, c]);
      else if (grid[r][c] === 1) fresh++;
    }
  }
  if (fresh === 0) return 0;
  let minutes = 0;
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (queue.length > 0 && fresh > 0) {
    const size = queue.length;
    for (let i = 0; i < size; i++) {
      const curr = queue.shift();
      const r = curr[0];
      const c = curr[1];
      for (const d of dirs) {
        const nr = r + d[0];
        const nc = c + d[1];
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1) {
          grid[nr][nc] = 2;
          fresh--;
          queue.push([nr, nc]);
        }
      }
    }
    minutes++;
  }
  return fresh === 0 ? minutes : -1;
}
const grid = [
  [2, 1, 1],
  [1, 1, 0],
  [0, 1, 1]
];
const result = orangesRotting(grid);
console.log('Result:', result);`,

  "417": `// Pacific Atlantic Water Flow — Multi-Source Reverse DFS O(m*n)
// Pattern: Start DFS from Pacific & Atlantic borders flowing inward to higher/equal ground
function pacificAtlantic(heights) {
  const rows = heights.length;
  const cols = heights[0].length;
  const pac = [];
  const atl = [];
  for (let r = 0; r < rows; r++) {
    pac.push(new Array(cols).fill(false));
    atl.push(new Array(cols).fill(false));
  }
  function dfs(r, c, ocean) {
    ocean[r][c] = true;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const d of dirs) {
      const nr = r + d[0];
      const nc = c + d[1];
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !ocean[nr][nc] && heights[nr][nc] >= heights[r][c]) {
        dfs(nr, nc, ocean);
      }
    }
  }
  for (let r = 0; r < rows; r++) {
    dfs(r, 0, pac);
    dfs(r, cols - 1, atl);
  }
  for (let c = 0; c < cols; c++) {
    dfs(0, c, pac);
    dfs(rows - 1, c, atl);
  }
  const result = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (pac[r][c] && atl[r][c]) {
        result.push([r, c]);
      }
    }
  }
  return result;
}
const heights = [
  [1, 2, 2, 3, 5],
  [3, 2, 3, 4, 4],
  [2, 4, 5, 3, 1]
];
const result = pacificAtlantic(heights);
console.log('Result:', result);`,

  "54": `// Spiral Matrix — Layer by layer traversal O(m*n)
// Pattern: Traverse top, right, bottom, left boundaries while tightening borders
function spiralOrder(matrix) {
  const result = [];
  if (!matrix.length) return result;
  let top = 0, bottom = matrix.length - 1;
  let left = 0, right = matrix[0].length - 1;
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) {
      result.push(matrix[top][c]);
    }
    top++;
    for (let r = top; r <= bottom; r++) {
      result.push(matrix[r][right]);
    }
    right--;
    if (top <= bottom) {
      for (let c = right; c >= left; c--) {
        result.push(matrix[bottom][c]);
      }
      bottom--;
    }
    if (left <= right) {
      for (let r = bottom; r >= top; r--) {
        result.push(matrix[r][left]);
      }
      left++;
    }
  }
  return result;
}
const matrix = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
];
const result = spiralOrder(matrix);
console.log('Result:', result);`,

  "73": `// Set Matrix Zeroes — In-Place O(1) Space Matrix Marking O(m*n)
// Pattern: Use first row & column as marker flags, handle edge overlap
function setZeroes(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  let firstRowZero = false;
  let firstColZero = false;
  for (let r = 0; r < rows; r++) {
    if (matrix[r][0] === 0) firstColZero = true;
  }
  for (let c = 0; c < cols; c++) {
    if (matrix[0][c] === 0) firstRowZero = true;
  }
  for (let r = 1; r < rows; r++) {
    for (let c = 1; c < cols; c++) {
      if (matrix[r][c] === 0) {
        matrix[r][0] = 0;
        matrix[0][c] = 0;
      }
    }
  }
  for (let r = 1; r < rows; r++) {
    for (let c = 1; c < cols; c++) {
      if (matrix[r][0] === 0 || matrix[0][c] === 0) {
        matrix[r][c] = 0;
      }
    }
  }
  if (firstRowZero) {
    for (let c = 0; c < cols; c++) matrix[0][c] = 0;
  }
  if (firstColZero) {
    for (let r = 0; r < rows; r++) matrix[r][0] = 0;
  }
  return matrix;
}
const matrix = [
  [1, 1, 1],
  [1, 0, 1],
  [1, 1, 1]
];
const result = setZeroes(matrix);
console.log('Result:', result);`,
};
