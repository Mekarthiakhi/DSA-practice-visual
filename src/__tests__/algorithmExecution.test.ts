/**
 * Comprehensive Algorithm Execution Test Suite
 * Tests Greedy, Sliding Window, and Binary Search algorithms
 * across JavaScript (universalEngine / jsInterpreter) and Python (multiLangEngine)
 */

jest.mock('../utils/aiService', () => ({
  callAI: jest.fn(),
  resolveKey: jest.fn((apiKey?: string) => apiKey || ''),
}))

import { runCode } from '../utils/universalEngine'
import { interpretCode } from '../utils/jsInterpreter'
import { pythonTraceToSteps, runMultiLang } from '../utils/multiLangEngine'
import { PythonTraceResult } from '../utils/pythonRuntime'
import { extractJudgeActual, judgeValuesEqual } from '../utils/judgeEngine'
import { spawnSync } from 'child_process'

function runPythonDirect(code: string): PythonTraceResult {
  const wrapper = `
import contextlib
import io
import json
import math
import sys

_USER_CODE = ${JSON.stringify(code)}
_events = []
_step_count = 0
_max_steps = 3000
_truncated = False

class _ExecutionLimitError(Exception):
    pass

def _safe(value, depth=0, seen=None):
    if seen is None:
        seen = set()
    if depth > 4:
        return "[deep]"
    if isinstance(value, float) and not math.isfinite(value):
        return str(value)
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    value_id = id(value)
    if value_id in seen:
        return "[circular]"
    seen.add(value_id)
    try:
        if isinstance(value, (list, tuple)):
            return [_safe(item, depth + 1, seen) for item in list(value)[:30]]
        if isinstance(value, (set, frozenset)):
            return [_safe(item, depth + 1, seen) for item in list(value)[:30]]
        if isinstance(value, dict):
            result = {}
            for index, (key, item) in enumerate(value.items()):
                if index >= 30:
                    result["..."] = "more"
                    break
                result[str(key)] = _safe(item, depth + 1, seen)
            return result
        if hasattr(value, "__dict__"):
            result = {"__class__": value.__class__.__name__}
            for index, (key, item) in enumerate(vars(value).items()):
                if index >= 20:
                    break
                result[str(key)] = _safe(item, depth + 1, seen)
            return result
        return repr(value)[:160]
    except Exception:
        return "[unavailable]"
    finally:
        seen.discard(value_id)

def _user_stack(frame):
    names = []
    current = frame
    while current is not None:
        if current.f_code.co_filename == "<user_code>":
            names.append(current.f_code.co_name if current.f_code.co_name != "<module>" else "main")
        current = current.f_back
    names.reverse()
    return names or ["main"]

def _trace(frame, event, arg):
    global _step_count, _truncated
    if frame.f_code.co_filename != "<user_code>":
        return _trace
    if event == "line":
        _step_count += 1
        if _step_count > _max_steps:
            _truncated = True
            raise _ExecutionLimitError("Execution stopped after 3,000 steps")
        local_values = {}
        for key, value in frame.f_locals.items():
            if not key.startswith("__"):
                local_values[key] = _safe(value)
        _events.append({
            "line": frame.f_lineno,
            "variables": local_values,
            "callStack": _user_stack(frame),
        })
    return _trace

_stdout = io.StringIO()
_error = None
try:
    _compiled = compile(_USER_CODE, "<user_code>", "exec")
    _globals = {"__name__": "__main__"}
    with contextlib.redirect_stdout(_stdout), contextlib.redirect_stderr(_stdout):
        sys.settrace(_trace)
        try:
            exec(_compiled, _globals, _globals)
        finally:
            sys.settrace(None)
except BaseException as exc:
    sys.settrace(None)
    error_line = getattr(exc, "lineno", None)
    error_column = getattr(exc, "offset", None)
    current_tb = exc.__traceback__
    while current_tb is not None:
        if current_tb.tb_frame.f_code.co_filename == "<user_code>":
            error_line = current_tb.tb_lineno
        current_tb = current_tb.tb_next
    _error = {
        "type": "ExecutionLimitError" if isinstance(exc, _ExecutionLimitError) else exc.__class__.__name__,
        "message": str(exc),
        "line": int(error_line or (_events[-1]["line"] if _events else 1)),
        "column": int(error_column or 1),
    }

print(json.dumps({
    "events": _events,
    "output": _stdout.getvalue().splitlines(),
    "error": _error,
    "truncated": _truncated,
}))
`
  const res = spawnSync('python', ['-c', wrapper], { encoding: 'utf-8' })
  if (res.error) throw res.error
  return JSON.parse(res.stdout) as PythonTraceResult
}

describe('Algorithm Execution Tests', () => {

  // =========================================================================
  // 1. GREEDY ALGORITHMS
  // =========================================================================
  describe('1. Greedy Algorithms', () => {

    describe('Best Time to Buy and Sell Stock (maxProfit)', () => {
      const jsCode = `function maxProfit(prices) {
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
console.log('Result:', result);`

      it('executes cleanly in JavaScript via universalEngine and jsInterpreter', () => {
        const runRes = runCode(jsCode, 'auto')
        expect(runRes.error).toBeUndefined()
        expect(runRes.steps.length).toBeGreaterThan(0)
        expect(runRes.mode).toBe('dsa')

        const interpRes = interpretCode(jsCode)
        expect(interpRes.error).toBeUndefined()
        expect(interpRes.steps.length).toBeGreaterThan(0)

        // Verify output
        const actual = extractJudgeActual(interpRes.output)
        expect(judgeValuesEqual(actual, '5')).toBe(true)

        // Verify dsaState populated
        const dsaSteps = interpRes.steps.filter(s => s.dsaState && s.dsaState.nodes.length > 0)
        expect(dsaSteps.length).toBeGreaterThan(0)
        const sampleDSA = dsaSteps.find(s => s.dsaState?.type === 'array')
        expect(sampleDSA).toBeDefined()
        expect(sampleDSA!.dsaState!.type).toBe('array')
        expect(sampleDSA!.dsaState!.nodes.map(n => n.value)).toEqual([7, 1, 5, 3, 6, 4])

        // Verify variables tracked
        const trackedVarNames = new Set(interpRes.steps.flatMap(s => s.variables.map(v => v.name)))
        expect(trackedVarNames.has('minPrice')).toBe(true)
        expect(trackedVarNames.has('maxProfit')).toBe(true)
        expect(trackedVarNames.has('i')).toBe(true)
      })

      it('executes cleanly in Python via multiLangEngine', () => {
        const pyCode = `def maxProfit(prices):
    min_price = float('inf')
    max_profit = 0
    for i in range(len(prices)):
        if prices[i] < min_price:
            min_price = prices[i]
        elif prices[i] - min_price > max_profit:
            max_profit = prices[i] - min_price
    return max_profit

result = maxProfit([7, 1, 5, 3, 6, 4])
print("Result:", result)`

        const trace = runPythonDirect(pyCode)
        expect(trace.error).toBeNull()
        expect(trace.events.length).toBeGreaterThan(0)
        expect(trace.output).toContain('Result: 5')

        const steps = pythonTraceToSteps(trace, pyCode)
        expect(steps.length).toBeGreaterThan(0)
        expect(steps.some(s => s.diagnostic?.severity === 'error')).toBe(false)

        // Verify dsaState in Python steps
        const dsaSteps = steps.filter(s => s.dsaState && s.dsaState.nodes.length > 0)
        expect(dsaSteps.length).toBeGreaterThan(0)
        expect(dsaSteps[0].dsaState?.type).toBe('array')
      })
    })

    describe('Maximum Subarray (Kadane)', () => {
      const jsCode = `function maxSubArray(nums) {
  let maxSum = nums[0];
  let currentSum = nums[0];

  for (let i = 1; i < nums.length; i++) {
    currentSum = Math.max(nums[i], currentSum + nums[i]);
    maxSum = Math.max(maxSum, currentSum);
  }

  return maxSum;
}

const result = maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4]);
console.log('Result:', result);`

      it('executes cleanly in JavaScript via universalEngine and jsInterpreter', () => {
        const runRes = runCode(jsCode, 'auto')
        expect(runRes.error).toBeUndefined()
        expect(runRes.steps.length).toBeGreaterThan(0)

        const interpRes = interpretCode(jsCode)
        expect(interpRes.error).toBeUndefined()
        expect(interpRes.steps.length).toBeGreaterThan(0)

        const actual = extractJudgeActual(interpRes.output)
        expect(judgeValuesEqual(actual, '6')).toBe(true)

        // dsaState populated with array nodes
        const dsaSteps = interpRes.steps.filter(s => s.dsaState && s.dsaState.nodes.length > 0)
        expect(dsaSteps.length).toBeGreaterThan(0)
        const stepWithArray = dsaSteps.find(s => s.dsaState?.type === 'array')
        expect(stepWithArray).toBeDefined()
        expect(stepWithArray!.dsaState!.nodes.length).toBe(9)

        // Variables tracked
        const varNames = new Set(interpRes.steps.flatMap(s => s.variables.map(v => v.name)))
        expect(varNames.has('maxSum')).toBe(true)
        expect(varNames.has('currentSum')).toBe(true)
        expect(varNames.has('i')).toBe(true)
      })

      it('executes cleanly in Python via multiLangEngine', () => {
        const pyCode = `def maxSubArray(nums):
    max_sum = nums[0]
    current_sum = nums[0]
    for i in range(1, len(nums)):
        current_sum = max(nums[i], current_sum + nums[i])
        max_sum = max(max_sum, current_sum)
    return max_sum

result = maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4])
print("Result:", result)`

        const trace = runPythonDirect(pyCode)
        expect(trace.error).toBeNull()
        expect(trace.events.length).toBeGreaterThan(0)
        expect(trace.output).toContain('Result: 6')

        const steps = pythonTraceToSteps(trace, pyCode)
        expect(steps.length).toBeGreaterThan(0)
        expect(steps.some(s => s.diagnostic?.severity === 'error')).toBe(false)
        const dsaSteps = steps.filter(s => s.dsaState && s.dsaState.nodes.length > 0)
        expect(dsaSteps.length).toBeGreaterThan(0)
      })
    })

    describe('Jump Game (canJump)', () => {
      const jsCode = `function canJump(nums) {
  let maxReach = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i > maxReach) return false;
    maxReach = Math.max(maxReach, i + nums[i]);
    if (maxReach >= nums.length - 1) return true;
  }
  return true;
}

const result1 = canJump([2, 3, 1, 1, 4]);
console.log('Result:', result1);`

      it('executes cleanly in JavaScript (true case)', () => {
        const interpRes = interpretCode(jsCode)
        expect(interpRes.error).toBeUndefined()
        expect(interpRes.steps.length).toBeGreaterThan(0)

        const actual = extractJudgeActual(interpRes.output)
        expect(judgeValuesEqual(actual, 'true')).toBe(true)

        const dsaSteps = interpRes.steps.filter(s => s.dsaState && s.dsaState.nodes.length > 0)
        expect(dsaSteps.length).toBeGreaterThan(0)
        expect(dsaSteps[0].dsaState?.nodes.map(n => n.value)).toEqual([2, 3, 1, 1, 4])
      })

      it('executes cleanly in JavaScript (false case: [3, 2, 1, 0, 4])', () => {
        const codeFalse = `function canJump(nums) {
  let maxReach = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i > maxReach) return false;
    maxReach = Math.max(maxReach, i + nums[i]);
    if (maxReach >= nums.length - 1) return true;
  }
  return true;
}

const result2 = canJump([3, 2, 1, 0, 4]);
console.log('Result:', result2);`

        const interpRes = interpretCode(codeFalse)
        expect(interpRes.error).toBeUndefined()
        const actual = extractJudgeActual(interpRes.output)
        expect(judgeValuesEqual(actual, 'false')).toBe(true)
      })

      it('executes cleanly in Python via multiLangEngine', () => {
        const pyCode = `def canJump(nums):
    max_reach = 0
    for i in range(len(nums)):
        if i > max_reach:
            return False
        max_reach = max(max_reach, i + nums[i])
        if max_reach >= len(nums) - 1:
            return True
    return True

result = canJump([2, 3, 1, 1, 4])
print("Result:", result)`

        const trace = runPythonDirect(pyCode)
        expect(trace.error).toBeNull()
        expect(trace.output).toContain('Result: True')

        const steps = pythonTraceToSteps(trace, pyCode)
        expect(steps.length).toBeGreaterThan(0)
        expect(steps.some(s => s.diagnostic?.severity === 'error')).toBe(false)
      })
    })

  })

  // =========================================================================
  // 2. SLIDING WINDOW ALGORITHMS
  // =========================================================================
  describe('2. Sliding Window Algorithms', () => {

    describe('Max Sum Subarray of size K (array sliding window)', () => {
      const jsCode = `function maxSumSubarray(arr, k) {
  let windowSum = 0;
  let maxSum = 0;

  for (let i = 0; i < k; i++) {
    windowSum += arr[i];
  }
  maxSum = windowSum;

  for (let i = k; i < arr.length; i++) {
    windowSum += arr[i] - arr[i - k];
    maxSum = Math.max(maxSum, windowSum);
  }

  return maxSum;
}

const result = maxSumSubarray([2, 1, 5, 1, 3, 2], 3);
console.log('Result:', result);`

      it('executes cleanly in JavaScript via universalEngine and jsInterpreter', () => {
        const runRes = runCode(jsCode, 'auto')
        expect(runRes.error).toBeUndefined()
        expect(runRes.steps.length).toBeGreaterThan(0)

        const interpRes = interpretCode(jsCode)
        expect(interpRes.error).toBeUndefined()
        expect(interpRes.steps.length).toBeGreaterThan(0)

        const actual = extractJudgeActual(interpRes.output)
        expect(judgeValuesEqual(actual, '9')).toBe(true)

        // Sliding window detection check: rangeStart and rangeEnd or window highlight
        const windowSteps = interpRes.steps.filter(s =>
          s.dsaState &&
          (s.dsaState.rangeStart !== undefined || s.dsaState.nodes.some(n => n.highlight === 'active'))
        )
        expect(windowSteps.length).toBeGreaterThan(0)

        // Verify array elements in dsaState
        const sampleStep = interpRes.steps.find(s => s.dsaState?.type === 'array')
        expect(sampleStep).toBeDefined()
        expect(sampleStep!.dsaState!.nodes.map(n => n.value)).toEqual([2, 1, 5, 1, 3, 2])

        // Verify tracked variables: windowSum, maxSum, k, i
        const varNames = new Set(interpRes.steps.flatMap(s => s.variables.map(v => v.name)))
        expect(varNames.has('windowSum')).toBe(true)
        expect(varNames.has('maxSum')).toBe(true)
        expect(varNames.has('k')).toBe(true)
        expect(varNames.has('i')).toBe(true)
      })

      it('executes cleanly in Python via multiLangEngine', () => {
        const pyCode = `def maxSumSubarray(arr, k):
    window_sum = 0
    for i in range(k):
        window_sum += arr[i]
    max_sum = window_sum
    for i in range(k, len(arr)):
        window_sum += arr[i] - arr[i - k]
        max_sum = max(max_sum, window_sum)
    return max_sum

result = maxSumSubarray([2, 1, 5, 1, 3, 2], 3)
print("Result:", result)`

        const trace = runPythonDirect(pyCode)
        expect(trace.error).toBeNull()
        expect(trace.output).toContain('Result: 9')

        const steps = pythonTraceToSteps(trace, pyCode)
        expect(steps.length).toBeGreaterThan(0)
        expect(steps.some(s => s.diagnostic?.severity === 'error')).toBe(false)
        const dsaSteps = steps.filter(s => s.dsaState && s.dsaState.nodes.length > 0)
        expect(dsaSteps.length).toBeGreaterThan(0)
      })
    })

    describe('Longest Substring Without Repeating Characters (string + set sliding window)', () => {
      const jsCode = `function lengthOfLongestSubstring(s) {
  let charSet = new Set();
  let left = 0;
  let maxLength = 0;

  for (let right = 0; right < s.length; right++) {
    while (charSet.has(s[right])) {
      charSet.delete(s[left]);
      left++;
    }
    charSet.add(s[right]);
    maxLength = Math.max(maxLength, right - left + 1);
  }

  return maxLength;
}

const result = lengthOfLongestSubstring("abcabcbb");
console.log('Result:', result);`

      it('executes cleanly in JavaScript via universalEngine and jsInterpreter', () => {
        const runRes = runCode(jsCode, 'auto')
        expect(runRes.error).toBeUndefined()
        expect(runRes.steps.length).toBeGreaterThan(0)

        const interpRes = interpretCode(jsCode)
        expect(interpRes.error).toBeUndefined()
        expect(interpRes.steps.length).toBeGreaterThan(0)

        const actual = extractJudgeActual(interpRes.output)
        expect(judgeValuesEqual(actual, '3')).toBe(true)

        // String visualization with sliding window pointers (left, right)
        const stringSteps = interpRes.steps.filter(s => s.dsaState && s.dsaState.type === 'string')
        expect(stringSteps.length).toBeGreaterThan(0)

        // Set / Hash table presence in dsaState
        const stepsWithHashTable = interpRes.steps.filter(s => s.dsaState?.hashTable && Object.keys(s.dsaState.hashTable).length > 0)
        expect(stepsWithHashTable.length).toBeGreaterThan(0)

        // Variables tracked
        const varNames = new Set(interpRes.steps.flatMap(s => s.variables.map(v => v.name)))
        expect(varNames.has('charSet')).toBe(true)
        expect(varNames.has('left')).toBe(true)
        expect(varNames.has('right')).toBe(true)
        expect(varNames.has('maxLength')).toBe(true)
      })

      it('correctly handles edge cases: "bbbbb" (len 1) and "pwwkew" (len 3)', () => {
        const codeB = `function lengthOfLongestSubstring(s) {
  let charSet = new Set();
  let left = 0, maxLength = 0;
  for (let right = 0; right < s.length; right++) {
    while (charSet.has(s[right])) { charSet.delete(s[left]); left++; }
    charSet.add(s[right]);
    maxLength = Math.max(maxLength, right - left + 1);
  }
  return maxLength;
}
console.log('Result:', lengthOfLongestSubstring("bbbbb"));`

        const resB = interpretCode(codeB)
        expect(resB.error).toBeUndefined()
        expect(extractJudgeActual(resB.output)).toBe('1')

        const codeP = `function lengthOfLongestSubstring(s) {
  let charSet = new Set();
  let left = 0, maxLength = 0;
  for (let right = 0; right < s.length; right++) {
    while (charSet.has(s[right])) { charSet.delete(s[left]); left++; }
    charSet.add(s[right]);
    maxLength = Math.max(maxLength, right - left + 1);
  }
  return maxLength;
}
console.log('Result:', lengthOfLongestSubstring("pwwkew"));`

        const resP = interpretCode(codeP)
        expect(resP.error).toBeUndefined()
        expect(extractJudgeActual(resP.output)).toBe('3')
      })

      it('executes cleanly in Python via multiLangEngine', () => {
        const pyCode = `def lengthOfLongestSubstring(s):
    char_set = set()
    left = 0
    max_length = 0
    for right in range(len(s)):
        while s[right] in char_set:
            char_set.remove(s[left])
            left += 1
        char_set.add(s[right])
        max_length = max(max_length, right - left + 1)
    return max_length

result = lengthOfLongestSubstring("abcabcbb")
print("Result:", result)`

        const trace = runPythonDirect(pyCode)
        expect(trace.error).toBeNull()
        expect(trace.output).toContain('Result: 3')

        const steps = pythonTraceToSteps(trace, pyCode)
        expect(steps.length).toBeGreaterThan(0)
        expect(steps.some(s => s.diagnostic?.severity === 'error')).toBe(false)
        const dsaSteps = steps.filter(s => s.dsaState && s.dsaState.nodes.length > 0)
        expect(dsaSteps.length).toBeGreaterThan(0)
      })
    })

  })

  // =========================================================================
  // 3. BINARY SEARCH ALGORITHMS
  // =========================================================================
  describe('3. Binary Search Algorithms', () => {

    describe('Classic Binary Search', () => {
      const bsTemplate = (nums: number[], target: number) => `function binarySearch(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    let mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) {
      return mid;
    } else if (nums[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1;
}

const result = binarySearch(${JSON.stringify(nums)}, ${target});
console.log('Result:', result);`

      it('executes cleanly with Target Found (target = 9 -> index 4)', () => {
        const code = bsTemplate([-1, 0, 3, 5, 9, 12], 9)
        const interpRes = interpretCode(code)
        expect(interpRes.error).toBeUndefined()
        expect(interpRes.steps.length).toBeGreaterThan(0)

        const actual = extractJudgeActual(interpRes.output)
        expect(judgeValuesEqual(actual, '4')).toBe(true)

        // dsaState has pointers left, right, mid
        const dsaSteps = interpRes.steps.filter(s => s.dsaState && s.dsaState.nodes.length > 0)
        expect(dsaSteps.length).toBeGreaterThan(0)
        expect(dsaSteps[0].dsaState?.nodes.map(n => n.value)).toEqual([-1, 0, 3, 5, 9, 12])

        // Verify pointers tracked
        const stepWithPointers = interpRes.steps.find(s => s.dsaState?.pointer !== undefined || s.dsaState?.rangeStart !== undefined)
        expect(stepWithPointers).toBeDefined()

        // Tracked variables
        const varNames = new Set(interpRes.steps.flatMap(s => s.variables.map(v => v.name)))
        expect(varNames.has('left')).toBe(true)
        expect(varNames.has('right')).toBe(true)
        expect(varNames.has('mid')).toBe(true)
      })

      it('executes cleanly with Target Not Found (target = 2 -> index -1)', () => {
        const code = bsTemplate([-1, 0, 3, 5, 9, 12], 2)
        const interpRes = interpretCode(code)
        expect(interpRes.error).toBeUndefined()
        expect(interpRes.steps.length).toBeGreaterThan(0)

        const actual = extractJudgeActual(interpRes.output)
        expect(judgeValuesEqual(actual, '-1')).toBe(true)
      })

      it('executes cleanly in Python via multiLangEngine (Target Found & Not Found)', () => {
        const pyCodeFound = `def binarySearch(nums, target):
    left = 0
    right = len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1

result = binarySearch([-1, 0, 3, 5, 9, 12], 9)
print("Result:", result)`

        const traceFound = runPythonDirect(pyCodeFound)
        expect(traceFound.error).toBeNull()
        expect(traceFound.output).toContain('Result: 4')
        const stepsFound = pythonTraceToSteps(traceFound, pyCodeFound)
        expect(stepsFound.length).toBeGreaterThan(0)
        expect(stepsFound.some(s => s.diagnostic?.severity === 'error')).toBe(false)

        const pyCodeNotFound = `def binarySearch(nums, target):
    left = 0
    right = len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1

result = binarySearch([-1, 0, 3, 5, 9, 12], 2)
print("Result:", result)`

        const traceNotFound = runPythonDirect(pyCodeNotFound)
        expect(traceNotFound.error).toBeNull()
        expect(traceNotFound.output).toContain('Result: -1')
        const stepsNotFound = pythonTraceToSteps(traceNotFound, pyCodeNotFound)
        expect(stepsNotFound.length).toBeGreaterThan(0)
      })
    })

    describe('Search Insert Position', () => {
      const searchInsertTemplate = (nums: number[], target: number) => `function searchInsert(nums, target) {
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

const result = searchInsert(${JSON.stringify(nums)}, ${target});
console.log('Result:', result);`

      it('executes cleanly when target exists in array (target = 5 -> index 2)', () => {
        const code = searchInsertTemplate([1, 3, 5, 6], 5)
        const runRes = runCode(code, 'auto')
        expect(runRes.error).toBeUndefined()
        expect(runRes.steps.length).toBeGreaterThan(0)

        const interpRes = interpretCode(code)
        expect(interpRes.error).toBeUndefined()
        const actual = extractJudgeActual(interpRes.output)
        expect(judgeValuesEqual(actual, '2')).toBe(true)

        const dsaSteps = interpRes.steps.filter(s => s.dsaState && s.dsaState.nodes.length > 0)
        expect(dsaSteps.length).toBeGreaterThan(0)
        expect(dsaSteps[0].dsaState?.nodes.map(n => n.value)).toEqual([1, 3, 5, 6])
      })

      it('executes cleanly when target needs insertion in middle (target = 2 -> index 1)', () => {
        const code = searchInsertTemplate([1, 3, 5, 6], 2)
        const interpRes = interpretCode(code)
        expect(interpRes.error).toBeUndefined()
        const actual = extractJudgeActual(interpRes.output)
        expect(judgeValuesEqual(actual, '1')).toBe(true)
      })

      it('executes cleanly when target needs insertion at end (target = 7 -> index 4)', () => {
        const code = searchInsertTemplate([1, 3, 5, 6], 7)
        const interpRes = interpretCode(code)
        expect(interpRes.error).toBeUndefined()
        const actual = extractJudgeActual(interpRes.output)
        expect(judgeValuesEqual(actual, '4')).toBe(true)
      })

      it('executes cleanly in Python via multiLangEngine', () => {
        const pyCode = `def searchInsert(nums, target):
    left = 0
    right = len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return left

result = searchInsert([1, 3, 5, 6], 5)
print("Result:", result)`

        const trace = runPythonDirect(pyCode)
        expect(trace.error).toBeNull()
        expect(trace.output).toContain('Result: 2')

        const steps = pythonTraceToSteps(trace, pyCode)
        expect(steps.length).toBeGreaterThan(0)
        expect(steps.some(s => s.diagnostic?.severity === 'error')).toBe(false)
        const dsaSteps = steps.filter(s => s.dsaState && s.dsaState.nodes.length > 0)
        expect(dsaSteps.length).toBeGreaterThan(0)
      })
    })

  })

  // =========================================================================
  // DETAILED METRICS COMPILATION
  // =========================================================================
  describe('Detailed Metrics Compilation', () => {
    it('compiles comprehensive execution metrics for all tested algorithms', () => {
      const fs = require('fs')
      const path = require('path')

      interface TestCaseRecord {
        category: string
        name: string
        language: 'JavaScript' | 'Python'
        input: string
        expected: string
        actual: string
        accepted: boolean
        stepCount: number
        error: string | null
        variables: string[]
        dsaStateType: string | null
        dsaNodesCount: number | null
        dsaPointers: string[]
        hasHashTable: boolean
      }

      const records: TestCaseRecord[] = []

      // Helper to evaluate JS test case
      function testJS(
        category: string,
        name: string,
        code: string,
        inputStr: string,
        expectedStr: string
      ) {
        const res = interpretCode(code)
        const actual = extractJudgeActual(res.output)
        const accepted = judgeValuesEqual(actual, expectedStr) && !res.error

        const allVars = Array.from(new Set(res.steps.flatMap(s => s.variables.map(v => v.name))))
        const dsaStep = res.steps.find(s => s.dsaState && s.dsaState.nodes && s.dsaState.nodes.length > 0)
        const pointers: string[] = []
        
        // Check across all steps for active pointers, rangeStart/rangeEnd, highlights
        const stepsWithPointers = res.steps.filter(s => s.dsaState && (s.dsaState.pointerName || s.dsaState.pointer !== undefined || s.dsaState.rangeStart !== undefined))
        const stepsWithHighlights = res.steps.filter(s => s.dsaState && s.dsaState.nodes.some(n => n.highlight !== 'none'))
        
        const pointerNamesFound = Array.from(new Set(res.steps.map(s => s.dsaState?.pointerName).filter(Boolean)))
        const pointer2NamesFound = Array.from(new Set(res.steps.map(s => s.dsaState?.pointer2Name).filter(Boolean)))
        if (pointerNamesFound.length > 0) pointers.push(`pointer: ${pointerNamesFound.join(', ')}`)
        if (pointer2NamesFound.length > 0) pointers.push(`pointer2: ${pointer2NamesFound.join(', ')}`)
        
        const hasRange = res.steps.some(s => s.dsaState?.rangeStart !== undefined)
        if (hasRange) {
          const sampleRange = res.steps.find(s => s.dsaState?.rangeStart !== undefined)
          pointers.push(`windowRange: [${sampleRange?.dsaState?.rangeStart}..${sampleRange?.dsaState?.rangeEnd}]`)
        }
        if (stepsWithHighlights.length > 0) {
          const highlightsUsed = Array.from(new Set(res.steps.flatMap(s => s.dsaState?.nodes.map(n => n.highlight) || []))).filter(h => h !== 'none')
          pointers.push(`highlights: ${highlightsUsed.join(', ')}`)
        }

        records.push({
          category,
          name,
          language: 'JavaScript',
          input: inputStr,
          expected: expectedStr,
          actual,
          accepted,
          stepCount: res.steps.length,
          error: res.error || null,
          variables: allVars,
          dsaStateType: dsaStep?.dsaState?.type || null,
          dsaNodesCount: dsaStep?.dsaState?.nodes ? dsaStep.dsaState.nodes.length : null,
          dsaPointers: pointers,
          hasHashTable: res.steps.some(s => s.dsaState?.hashTable && Object.keys(s.dsaState.hashTable).length > 0)
        })
      }

      // Helper to evaluate Python test case
      function testPY(
        category: string,
        name: string,
        code: string,
        inputStr: string,
        expectedStr: string
      ) {
        const trace = runPythonDirect(code)
        const steps = pythonTraceToSteps(trace, code)
        const actual = extractJudgeActual(trace.output)
        const accepted = judgeValuesEqual(actual, expectedStr) && !trace.error

        const allVars = Array.from(new Set(steps.flatMap(s => s.variables.map(v => v.name))))
        const dsaStep = steps.find(s => s.dsaState && s.dsaState.nodes && s.dsaState.nodes.length > 0)
        const pointers: string[] = []

        const pointerNamesFound = Array.from(new Set(steps.map(s => s.dsaState?.pointerName).filter(Boolean)))
        const pointer2NamesFound = Array.from(new Set(steps.map(s => s.dsaState?.pointer2Name).filter(Boolean)))
        if (pointerNamesFound.length > 0) pointers.push(`pointer: ${pointerNamesFound.join(', ')}`)
        if (pointer2NamesFound.length > 0) pointers.push(`pointer2: ${pointer2NamesFound.join(', ')}`)

        const hasRange = steps.some(s => s.dsaState?.rangeStart !== undefined)
        if (hasRange) {
          const sampleRange = steps.find(s => s.dsaState?.rangeStart !== undefined)
          pointers.push(`windowRange: [${sampleRange?.dsaState?.rangeStart}..${sampleRange?.dsaState?.rangeEnd}]`)
        }
        const stepsWithHighlights = steps.filter(s => s.dsaState && s.dsaState.nodes.some(n => n.highlight !== 'none'))
        if (stepsWithHighlights.length > 0) {
          const highlightsUsed = Array.from(new Set(steps.flatMap(s => s.dsaState?.nodes.map(n => n.highlight) || []))).filter(h => h !== 'none')
          pointers.push(`highlights: ${highlightsUsed.join(', ')}`)
        }

        records.push({
          category,
          name,
          language: 'Python',
          input: inputStr,
          expected: expectedStr,
          actual,
          accepted,
          stepCount: steps.length,
          error: trace.error ? trace.error.message : null,
          variables: allVars,
          dsaStateType: dsaStep?.dsaState?.type || null,
          dsaNodesCount: dsaStep?.dsaState?.nodes ? dsaStep.dsaState.nodes.length : null,
          dsaPointers: pointers,
          hasHashTable: steps.some(s => s.dsaState?.hashTable && Object.keys(s.dsaState.hashTable).length > 0)
        })
      }

      // 1. Greedy
      // 1a. Best Time to Buy and Sell Stock
      testJS(
        'Greedy',
        'Best Time to Buy and Sell Stock',
        `function maxProfit(prices) {
  let minPrice = Infinity;
  let maxProfit = 0;
  for (let i = 0; i < prices.length; i++) {
    if (prices[i] < minPrice) { minPrice = prices[i]; }
    else if (prices[i] - minPrice > maxProfit) { maxProfit = prices[i] - minPrice; }
  }
  return maxProfit;
}
console.log('Result:', maxProfit([7, 1, 5, 3, 6, 4]));`,
        'prices = [7, 1, 5, 3, 6, 4]',
        '5'
      )
      testPY(
        'Greedy',
        'Best Time to Buy and Sell Stock',
        `def maxProfit(prices):
    min_price = float('inf')
    max_profit = 0
    for i in range(len(prices)):
        if prices[i] < min_price:
            min_price = prices[i]
        elif prices[i] - min_price > max_profit:
            max_profit = prices[i] - min_price
    return max_profit
print("Result:", maxProfit([7, 1, 5, 3, 6, 4]))`,
        'prices = [7, 1, 5, 3, 6, 4]',
        '5'
      )

      // 1b. Maximum Subarray (Kadane)
      testJS(
        'Greedy',
        'Maximum Subarray (Kadane)',
        `function maxSubArray(nums) {
  let maxSum = nums[0];
  let currentSum = nums[0];
  for (let i = 1; i < nums.length; i++) {
    currentSum = Math.max(nums[i], currentSum + nums[i]);
    maxSum = Math.max(maxSum, currentSum);
  }
  return maxSum;
}
console.log('Result:', maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4]));`,
        'nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]',
        '6'
      )
      testPY(
        'Greedy',
        'Maximum Subarray (Kadane)',
        `def maxSubArray(nums):
    max_sum = nums[0]
    current_sum = nums[0]
    for i in range(1, len(nums)):
        current_sum = max(nums[i], current_sum + nums[i])
        max_sum = max(max_sum, current_sum)
    return max_sum
print("Result:", maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4]))`,
        'nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]',
        '6'
      )

      // 1c. Jump Game
      testJS(
        'Greedy',
        'Jump Game (Valid Jump)',
        `function canJump(nums) {
  let maxReach = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i > maxReach) return false;
    maxReach = Math.max(maxReach, i + nums[i]);
    if (maxReach >= nums.length - 1) return true;
  }
  return true;
}
console.log('Result:', canJump([2, 3, 1, 1, 4]));`,
        'nums = [2, 3, 1, 1, 4]',
        'true'
      )
      testJS(
        'Greedy',
        'Jump Game (Blocked Jump)',
        `function canJump(nums) {
  let maxReach = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i > maxReach) return false;
    maxReach = Math.max(maxReach, i + nums[i]);
    if (maxReach >= nums.length - 1) return true;
  }
  return true;
}
console.log('Result:', canJump([3, 2, 1, 0, 4]));`,
        'nums = [3, 2, 1, 0, 4]',
        'false'
      )
      testPY(
        'Greedy',
        'Jump Game',
        `def canJump(nums):
    max_reach = 0
    for i in range(len(nums)):
        if i > max_reach:
            return False
        max_reach = max(max_reach, i + nums[i])
        if max_reach >= len(nums) - 1:
            return True
    return True
print("Result:", canJump([2, 3, 1, 1, 4]))`,
        'nums = [2, 3, 1, 1, 4]',
        'True'
      )

      // 2. Sliding Window
      // 2a. Max Sum Subarray of size K
      testJS(
        'Sliding Window',
        'Max Sum Subarray of Size K',
        `function maxSumSubarray(arr, k) {
  let windowSum = 0;
  let maxSum = 0;
  for (let i = 0; i < k; i++) { windowSum += arr[i]; }
  maxSum = windowSum;
  for (let i = k; i < arr.length; i++) {
    windowSum += arr[i] - arr[i - k];
    maxSum = Math.max(maxSum, windowSum);
  }
  return maxSum;
}
console.log('Result:', maxSumSubarray([2, 1, 5, 1, 3, 2], 3));`,
        'arr = [2, 1, 5, 1, 3, 2], k = 3',
        '9'
      )
      testPY(
        'Sliding Window',
        'Max Sum Subarray of Size K',
        `def maxSumSubarray(arr, k):
    window_sum = 0
    for i in range(k):
        window_sum += arr[i]
    max_sum = window_sum
    for i in range(k, len(arr)):
        window_sum += arr[i] - arr[i - k]
        max_sum = max(max_sum, window_sum)
    return max_sum
print("Result:", maxSumSubarray([2, 1, 5, 1, 3, 2], 3))`,
        'arr = [2, 1, 5, 1, 3, 2], k = 3',
        '9'
      )

      // 2b. Longest Substring Without Repeating Characters
      testJS(
        'Sliding Window',
        'Longest Substring Without Repeating Characters',
        `function lengthOfLongestSubstring(s) {
  let charSet = new Set();
  let left = 0;
  let maxLength = 0;
  for (let right = 0; right < s.length; right++) {
    while (charSet.has(s[right])) { charSet.delete(s[left]); left++; }
    charSet.add(s[right]);
    maxLength = Math.max(maxLength, right - left + 1);
  }
  return maxLength;
}
console.log('Result:', lengthOfLongestSubstring("abcabcbb"));`,
        's = "abcabcbb"',
        '3'
      )
      testPY(
        'Sliding Window',
        'Longest Substring Without Repeating Characters',
        `def lengthOfLongestSubstring(s):
    char_set = set()
    left = 0
    max_length = 0
    for right in range(len(s)):
        while s[right] in char_set:
            char_set.remove(s[left])
            left += 1
        char_set.add(s[right])
        max_length = max(max_length, right - left + 1)
    return max_length
print("Result:", lengthOfLongestSubstring("abcabcbb"))`,
        's = "abcabcbb"',
        '3'
      )

      // 3. Binary Search
      // 3a. Classic Binary Search (Found)
      testJS(
        'Binary Search',
        'Classic Binary Search (Found)',
        `function binarySearch(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  while (left <= right) {
    let mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) return mid;
    else if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}
console.log('Result:', binarySearch([-1, 0, 3, 5, 9, 12], 9));`,
        'nums = [-1, 0, 3, 5, 9, 12], target = 9',
        '4'
      )
      // 3b. Classic Binary Search (Not Found)
      testJS(
        'Binary Search',
        'Classic Binary Search (Not Found)',
        `function binarySearch(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  while (left <= right) {
    let mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) return mid;
    else if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}
console.log('Result:', binarySearch([-1, 0, 3, 5, 9, 12], 2));`,
        'nums = [-1, 0, 3, 5, 9, 12], target = 2',
        '-1'
      )
      testPY(
        'Binary Search',
        'Classic Binary Search (Found)',
        `def binarySearch(nums, target):
    left = 0
    right = len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1
print("Result:", binarySearch([-1, 0, 3, 5, 9, 12], 9))`,
        'nums = [-1, 0, 3, 5, 9, 12], target = 9',
        '4'
      )
      testPY(
        'Binary Search',
        'Classic Binary Search (Not Found)',
        `def binarySearch(nums, target):
    left = 0
    right = len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1
print("Result:", binarySearch([-1, 0, 3, 5, 9, 12], 2))`,
        'nums = [-1, 0, 3, 5, 9, 12], target = 2',
        '-1'
      )

      // 3c. Search Insert Position
      testJS(
        'Binary Search',
        'Search Insert Position (Exact Match)',
        `function searchInsert(nums, target) {
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
console.log('Result:', searchInsert([1, 3, 5, 6], 5));`,
        'nums = [1, 3, 5, 6], target = 5',
        '2'
      )
      testJS(
        'Binary Search',
        'Search Insert Position (Middle Insert)',
        `function searchInsert(nums, target) {
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
console.log('Result:', searchInsert([1, 3, 5, 6], 2));`,
        'nums = [1, 3, 5, 6], target = 2',
        '1'
      )
      testJS(
        'Binary Search',
        'Search Insert Position (End Insert)',
        `function searchInsert(nums, target) {
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
console.log('Result:', searchInsert([1, 3, 5, 6], 7));`,
        'nums = [1, 3, 5, 6], target = 7',
        '4'
      )
      testPY(
        'Binary Search',
        'Search Insert Position',
        `def searchInsert(nums, target):
    left = 0
    right = len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return left
print("Result:", searchInsert([1, 3, 5, 6], 5))`,
        'nums = [1, 3, 5, 6], target = 5',
        '2'
      )

      // Save metrics file for reporting
      const metricsPath = path.join(__dirname, 'algorithm_metrics_report.json')
      fs.writeFileSync(metricsPath, JSON.stringify(records, null, 2))

      expect(records.length).toBe(19)
      expect(records.every(r => r.accepted)).toBe(true)
      expect(records.every(r => r.stepCount > 0)).toBe(true)
      expect(records.every(r => r.error === null)).toBe(true)
    })
  })

})
