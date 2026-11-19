import { interpretCode } from '../utils/jsInterpreter'
import { detectAlgorithm, generateExecutionSteps, genTwoSum, genMaxArea, genIsPalindrome, genReverseString } from '../utils/executionEngine'
import { runCode } from '../utils/universalEngine'

describe('Arrays and Two Pointers Audit', () => {
  test('Two Sum - interpreter & genDSA', () => {
    const code = `
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
`
    const interp = interpretCode(code)
    console.log('TwoSum interp steps count:', interp.steps.length)
    const dsaSteps = interp.steps.filter(s => !!s.dsaState)
    console.log('TwoSum interp dsaSteps count:', dsaSteps.length)
    if (dsaSteps.length > 0) {
      const lastWithHash = dsaSteps.find(s => s.dsaState?.hashTable && Object.keys(s.dsaState.hashTable).length > 0)
      console.log('TwoSum sample dsaState:', {
        type: dsaSteps[0].dsaState?.type,
        hashTable: lastWithHash?.dsaState?.hashTable,
        pointer: lastWithHash?.dsaState?.pointer,
        pointerName: lastWithHash?.dsaState?.pointerName,
        pointer2: lastWithHash?.dsaState?.pointer2,
        pointer2Name: lastWithHash?.dsaState?.pointer2Name,
      })
    }

    const staticSteps = genTwoSum([2, 7, 11, 15], 9)
    console.log('TwoSum static steps count:', staticSteps.length)
    const staticLast = staticSteps[staticSteps.length - 1]
    console.log('TwoSum static last dsaState:', {
      type: staticLast.dsaState?.type,
      pointer: staticLast.dsaState?.pointer,
      pointerName: staticLast.dsaState?.pointerName,
      hashTable: staticLast.dsaState?.hashTable,
    })
  })

  test('3Sum - interpreter', () => {
    const code = `
function threeSum(nums) {
  nums.sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    let left = i + 1;
    let right = nums.length - 1;
    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];
      if (sum === 0) {
        result.push([nums[i], nums[left], nums[right]]);
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
`
    const interp = interpretCode(code)
    console.log('3Sum interp steps:', interp.steps.length)
    interp.steps.forEach((s, idx) => {
      if (s.dsaState?.pointer !== undefined || s.dsaState?.pointer2 !== undefined || s.dsaState?.auxiliaryData?.outerLoopPointer) {
        console.log(`Step ${idx} [Line ${s.line}] desc="${s.description.slice(0, 30)}": p1=${s.dsaState?.pointerName}(${s.dsaState?.pointer}), p2=${s.dsaState?.pointer2Name}(${s.dsaState?.pointer2}), outer=${JSON.stringify(s.dsaState?.auxiliaryData?.outerLoopPointer)}`)
      }
    })
  })

  test('Container With Most Water - interpreter & genMaxArea', () => {
    const code = `
function maxArea(height) {
  let left = 0;
  let right = height.length - 1;
  let max = 0;
  while (left < right) {
    const h = Math.min(height[left], height[right]);
    const area = h * (right - left);
    if (area > max) max = area;
    if (height[left] < height[right]) {
      left++;
    } else {
      right--;
    }
  }
  return max;
}
const result = maxArea([1, 8, 6, 2, 5, 4, 8, 3, 7]);
`
    const interp = interpretCode(code)
    console.log('Container interp steps:', interp.steps.length)
    const stepsWithBothPtrs = interp.steps.filter(s => s.dsaState?.pointer !== undefined && s.dsaState?.pointer2 !== undefined)
    console.log('Container steps with both pointers:', stepsWithBothPtrs.length)
    if (stepsWithBothPtrs.length > 0) {
      console.log('Container sample ptrs:', {
        p1: stepsWithBothPtrs[0].dsaState?.pointer,
        n1: stepsWithBothPtrs[0].dsaState?.pointerName,
        p2: stepsWithBothPtrs[0].dsaState?.pointer2,
        n2: stepsWithBothPtrs[0].dsaState?.pointer2Name,
      })
    }
  })

  test('Trapping Rain Water - interpreter', () => {
    const code = `
function trap(height) {
  let left = 0;
  let right = height.length - 1;
  let leftMax = 0;
  let rightMax = 0;
  let water = 0;
  while (left < right) {
    if (height[left] < height[right]) {
      if (height[left] >= leftMax) {
        leftMax = height[left];
      } else {
        water += leftMax - height[left];
      }
      left++;
    } else {
      if (height[right] >= rightMax) {
        rightMax = height[right];
      } else {
        water += rightMax - height[right];
      }
      right--;
    }
  }
  return water;
}
const result = trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]);
`
    const interp = interpretCode(code)
    console.log('Trapping Rain Water steps:', interp.steps.length)
    const stepsWithBothPtrs = interp.steps.filter(s => s.dsaState?.pointer !== undefined && s.dsaState?.pointer2 !== undefined)
    console.log('Trapping Rain Water steps with both pointers:', stepsWithBothPtrs.length)
  })

  test('Valid Palindrome - interpreter & genIsPalindrome', () => {
    const code = `
function isPalindrome(s) {
  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  let left = 0;
  let right = clean.length - 1;
  while (left < right) {
    if (clean[left] !== clean[right]) return false;
    left++;
    right--;
  }
  return true;
}
const result = isPalindrome("racecar");
`
    const interp = interpretCode(code)
    console.log('Valid Palindrome steps:', interp.steps.length)
    const dsaSteps = interp.steps.filter(s => !!s.dsaState)
    console.log('Valid Palindrome dsaSteps:', dsaSteps.length, 'type:', dsaSteps[0]?.dsaState?.type)
  })

  test('Reverse String - interpreter & genReverseString', () => {
    const code = `
function reverseString(s) {
  let left = 0;
  let right = s.length - 1;
  while (left < right) {
    const temp = s[left];
    s[left] = s[right];
    s[right] = temp;
    left++;
    right--;
  }
  return s;
}
const result = reverseString(["h","e","l","l","o"]);
`
    const interp = interpretCode(code)
    console.log('Reverse String steps:', interp.steps.length)
    const dsaSteps = interp.steps.filter(s => !!s.dsaState)
    console.log('Reverse String dsaSteps:', dsaSteps.length, 'type:', dsaSteps[0]?.dsaState?.type)
  })

  test('Remove Duplicates - interpreter', () => {
    const code = `
function removeDuplicates(nums) {
  if (nums.length === 0) return 0;
  let slow = 0;
  for (let fast = 1; fast < nums.length; fast++) {
    if (nums[fast] !== nums[slow]) {
      slow++;
      nums[slow] = nums[fast];
    }
  }
  return slow + 1;
}
const result = removeDuplicates([1, 1, 2, 2, 3, 4, 4]);
`
    const interp = interpretCode(code)
    console.log('Remove Duplicates steps:', interp.steps.length)
    const stepsWithPtrs = interp.steps.filter(s => s.dsaState?.pointer !== undefined || s.dsaState?.pointer2 !== undefined)
    console.log('Remove Duplicates steps with pointers:', stepsWithPtrs.length)
    if (stepsWithPtrs.length > 0) {
      console.log('Remove Duplicates sample pointer state:', {
        p1: stepsWithPtrs[0].dsaState?.pointer,
        n1: stepsWithPtrs[0].dsaState?.pointerName,
        p2: stepsWithPtrs[0].dsaState?.pointer2,
        n2: stepsWithPtrs[0].dsaState?.pointer2Name,
      })
    }
  })
})
