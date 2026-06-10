import sys
import re

with open('src/utils/executionEngine.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace genClimbStairs
text = re.sub(
    r'export function genClimbStairs.*?return steps\n}',
    """export function genClimbStairs(n: number): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  if (n > 20) n = 20
  steps.push({ line: 1, description: 'climbStairs(' + n + ')', variables: [{name:'n',value:n,type:'number',scope:'fn'}], callStack: [makeFrame('climbStairs', 1, [])], heap: [], output: '', dsaState: { type: 'array', nodes: [], message: 'Initialize' } })
  if (n <= 2) {
    steps.push({ line: 2, description: 'Return ' + n, variables: [{name:'n',value:n,type:'number',scope:'fn'}], callStack: [makeFrame('climbStairs', 2, [])], heap: [], output: String(n), dsaState: { type: 'array', nodes: [{id:'1', value:n, highlight:'found'}], message: 'Base case' } })
    return steps
  }
  let a = 1, b = 2
  steps.push({ line: 3, description: 'a=1, b=2', variables: [{name:'a',value:1,type:'number',scope:'fn'}, {name:'b',value:2,type:'number',scope:'fn'}], callStack: [makeFrame('climbStairs', 3, [])], heap: [], output: '', dsaState: { type: 'array', nodes: [{id:'a',value:1,highlight:'visited'}, {id:'b',value:2,highlight:'active'}], message: 'Initial steps' } })
  for (let i = 3; i <= n; i++) {
    steps.push({ line: 4, description: 'Loop i=' + i, variables: [{name:'i',value:i,type:'number',scope:'fn'}, {name:'a',value:a,type:'number',scope:'fn'}, {name:'b',value:b,type:'number',scope:'fn'}], callStack: [makeFrame('climbStairs', 4, [])], heap: [], output: '', dsaState: { type: 'array', nodes: [{id:'a',value:a,highlight:'visited'}, {id:'b',value:b,highlight:'active'}], message: 'Iteration ' + i } })
    let temp = a + b
    steps.push({ line: 5, description: 'temp = ' + a + ' + ' + b + ' = ' + temp, variables: [{name:'i',value:i,type:'number',scope:'fn'}, {name:'temp',value:temp,type:'number',scope:'fn'}], callStack: [makeFrame('climbStairs', 5, [])], heap: [], output: '', dsaState: { type: 'array', nodes: [{id:'a',value:a,highlight:'visited'}, {id:'b',value:b,highlight:'visited'}, {id:'t',value:temp,highlight:'active'}], message: 'Fibonacci sum: ' + temp } })
    a = b
    steps.push({ line: 6, description: 'a = b (' + b + ')', variables: [{name:'a',value:a,type:'number',scope:'fn'}], callStack: [makeFrame('climbStairs', 6, [])], heap: [], output: '', dsaState: { type: 'array', nodes: [{id:'a',value:a,highlight:'active'}, {id:'t',value:temp,highlight:'visited'}], message: 'a updated' } })
    b = temp
    steps.push({ line: 7, description: 'b = temp (' + temp + ')', variables: [{name:'b',value:b,type:'number',scope:'fn'}], callStack: [makeFrame('climbStairs', 7, [])], heap: [], output: '', dsaState: { type: 'array', nodes: [{id:'a',value:a,highlight:'visited'}, {id:'b',value:b,highlight:'active'}], message: 'b updated' } })
  }
  steps.push({ line: 9, description: 'Return ' + b, variables: [], callStack: [makeFrame('climbStairs', 9, [])], heap: [], output: String(b), dsaState: { type: 'array', nodes: [{id:'ans',value:b,highlight:'found'}], message: 'Done' } })
  return steps
}""",
    text,
    flags=re.DOTALL
)

# Replace genContainsDuplicate
text = re.sub(
    r'export function genContainsDuplicate.*?return steps\n}',
    """export function genContainsDuplicate(nums: number[]): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  const set = new Set<number>()
  steps.push({ line: 1, description: 'containsDuplicate', variables: [{name:'nums',value:nums,type:'Array',scope:'fn'}], callStack: [makeFrame('fn', 1, [])], heap: [], output: '', dsaState: { type: 'array', nodes: nums.map((v,i) => ({id:'n'+i,value:v,highlight:'none'})), message: 'Start' } })
  steps.push({ line: 2, description: 'const set = new Set()', variables: [], callStack: [makeFrame('fn', 2, [])], heap: [], output: '', dsaState: { type: 'array', nodes: nums.map((v,i) => ({id:'n'+i,value:v,highlight:'none'})), message: 'Init Set' } })
  let setArr: number[] = []
  for (let i = 0; i < nums.length; i++) {
    const num = nums[i]
    steps.push({ line: 3, description: 'num = ' + num, variables: [{name:'num',value:num,type:'number',scope:'fn'}], callStack: [makeFrame('fn', 3, [])], heap: [], output: '', dsaState: { type: 'array', nodes: nums.map((v,k) => ({id:'n'+k,value:v,highlight:k===i?'active':set.has(v)?'visited':'none'})), message: 'Check ' + num } })
    steps.push({ line: 4, description: 'if (set.has(' + num + '))', variables: [], callStack: [makeFrame('fn', 4, [])], heap: [], output: '', dsaState: { type: 'array', nodes: nums.map((v,k) => ({id:'n'+k,value:v,highlight:k===i?'active':set.has(v)?'visited':'none'})), message: 'Check if set has ' + num } })
    if (set.has(num)) {
      steps.push({ line: 4, description: 'Found duplicate: ' + num + '!', variables: [], callStack: [makeFrame('fn', 4, [])], heap: [], output: 'true', dsaState: { type: 'array', nodes: nums.map((v,k) => ({id:'n'+k,value:v,highlight:v===num?'found':'none'})), message: 'Duplicate ' + num } })
      return steps
    }
    set.add(num)
    setArr.push(num)
    steps.push({ line: 5, description: 'set.add(' + num + ')', variables: [], callStack: [makeFrame('fn', 5, [])], heap: [], output: '', dsaState: { type: 'array', nodes: nums.map((v,k) => ({id:'n'+k,value:v,highlight:k<=i?'visited':'none'})), auxiliaryData: { set: [...setArr] }, message: 'Set added ' + num } })
  }
  steps.push({ line: 7, description: 'Return false', variables: [], callStack: [makeFrame('fn', 7, [])], heap: [], output: 'false', dsaState: { type: 'array', nodes: nums.map((v,k) => ({id:'n'+k,value:v,highlight:'visited'})), message: 'All unique' } })
  return steps
}""",
    text,
    flags=re.DOTALL
)

# Replace genReverseList
text = re.sub(
    r'export function genReverseList.*?return steps\n}',
    """export function genReverseList(values: number[]): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  
  // Helper to build list nodes based on an array
  const buildNodes = (arr: number[]) => {
    return arr.map((v, i) => ({ id: 'n'+i, value: v, highlight: 'none' as const }))
  }
  
  let nodes = buildNodes(values)
  
  steps.push({ line: 8, description: 'reverseList(head)', variables: [], callStack: [makeFrame('fn', 8, [])], heap: [], output: '', dsaState: { type: 'linkedlist', nodes: [...nodes], message: 'Start' } })
  
  steps.push({ line: 9, description: 'let prev = null', variables: [{name:'prev',value:'null',type:'object',scope:'fn'}], callStack: [makeFrame('fn', 9, [])], heap: [], output: '', dsaState: { type: 'linkedlist', nodes: [...nodes], message: 'prev = null' } })
  
  steps.push({ line: 10, description: 'let curr = head', variables: [{name:'curr',value:values[0]||'null',type:'object',scope:'fn'}], callStack: [makeFrame('fn', 10, [])], heap: [], output: '', dsaState: { type: 'linkedlist', nodes: nodes.map((n, i) => i === 0 ? {...n, highlight: 'active'} : n), message: 'curr = head' } })
  
  let reversedVals: number[] = []
  for (let i = 0; i < values.length; i++) {
    steps.push({ line: 11, description: 'while (curr !== null)', variables: [], callStack: [makeFrame('fn', 11, [])], heap: [], output: '', dsaState: { type: 'linkedlist', nodes: buildNodes([...reversedVals, ...values.slice(i)]).map((n, k) => k === reversedVals.length ? {...n, highlight: 'active'} : (k < reversedVals.length ? {...n, highlight: 'visited'} : n)), message: 'Processing ' + values[i] } })
    
    steps.push({ line: 12, description: 'let nextTemp = curr.next', variables: [], callStack: [makeFrame('fn', 12, [])], heap: [], output: '', dsaState: { type: 'linkedlist', nodes: buildNodes([...reversedVals, ...values.slice(i)]).map((n, k) => k === reversedVals.length ? {...n, highlight: 'active'} : k === reversedVals.length+1 ? {...n, highlight: 'comparing'} : (k < reversedVals.length ? {...n, highlight: 'visited'} : n)), message: 'Save nextTemp' } })
    
    steps.push({ line: 13, description: 'curr.next = prev', variables: [], callStack: [makeFrame('fn', 13, [])], heap: [], output: '', dsaState: { type: 'linkedlist', nodes: buildNodes([...reversedVals, ...values.slice(i)]).map((n, k) => k === reversedVals.length ? {...n, highlight: 'active'} : (k < reversedVals.length ? {...n, highlight: 'visited'} : n)), message: 'Reverse pointer' } })
    
    reversedVals.unshift(values[i])
    
    steps.push({ line: 14, description: 'prev = curr', variables: [], callStack: [makeFrame('fn', 14, [])], heap: [], output: '', dsaState: { type: 'linkedlist', nodes: buildNodes([...reversedVals, ...values.slice(i+1)]).map((n, k) => k <= reversedVals.length-1 ? {...n, highlight: 'visited'} : n), message: 'Move prev' } })
    
    steps.push({ line: 15, description: 'curr = nextTemp', variables: [], callStack: [makeFrame('fn', 15, [])], heap: [], output: '', dsaState: { type: 'linkedlist', nodes: buildNodes([...reversedVals, ...values.slice(i+1)]).map((n, k) => k <= reversedVals.length-1 ? {...n, highlight: 'visited'} : k === reversedVals.length ? {...n, highlight: 'active'} : n), message: 'Move curr' } })
  }
  
  steps.push({ line: 11, description: 'while (curr !== null) (null)', variables: [], callStack: [makeFrame('fn', 11, [])], heap: [], output: '', dsaState: { type: 'linkedlist', nodes: buildNodes(reversedVals).map((n) => ({...n, highlight: 'found'})), message: 'List fully reversed' } })
  
  steps.push({ line: 17, description: 'return prev', variables: [], callStack: [makeFrame('fn', 17, [])], heap: [], output: '[' + [...values].reverse().join(',') + ']', dsaState: { type: 'linkedlist', nodes: buildNodes(reversedVals).map((n) => ({...n, highlight: 'found'})), message: 'Done' } })
  
  return steps
}""",
    text,
    flags=re.DOTALL
)

# Replace genMaxArea
text = re.sub(
    r'export function genMaxArea.*?return steps\n}',
    """export function genMaxArea(height: number[]): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  steps.push({ line: 1, description: 'maxArea', variables: [], callStack: [makeFrame('fn', 1, [])], heap: [], output: '', dsaState: { type: 'array', nodes: height.map((v,i) => ({id:'h'+i,value:v,highlight:'none'})), message: 'Start' } })
  let left = 0, right = height.length - 1, maxArea = 0
  steps.push({ line: 2, description: 'let maxArea = 0', variables: [], callStack: [makeFrame('fn', 2, [])], heap: [], output: '', dsaState: { type: 'array', nodes: height.map((v,i) => ({id:'h'+i,value:v,highlight:'none'})), message: 'maxArea = 0' } })
  steps.push({ line: 3, description: 'let left = 0', variables: [], callStack: [makeFrame('fn', 3, [])], heap: [], output: '', dsaState: { type: 'array', nodes: height.map((v,i) => ({id:'h'+i,value:v,highlight:'none'})), pointer: left, message: 'left = 0' } })
  steps.push({ line: 4, description: 'let right = ' + right, variables: [], callStack: [makeFrame('fn', 4, [])], heap: [], output: '', dsaState: { type: 'array', nodes: height.map((v,i) => ({id:'h'+i,value:v,highlight:'none'})), pointer: left, pointer2: right, message: 'right = ' + right } })

  while (left < right) {
    steps.push({ line: 6, description: 'while (' + left + ' < ' + right + ')', variables: [], callStack: [makeFrame('fn', 6, [])], heap: [], output: '', dsaState: { type: 'array', nodes: height.map((v,k) => ({id:'h'+k,value:v,highlight:k===left||k===right?'active':'none'})), pointer: left, pointer2: right, message: 'Check condition' } })
    let h = Math.min(height[left], height[right])
    steps.push({ line: 7, description: 'h = Math.min(' + height[left] + ', ' + height[right] + ') = ' + h, variables: [], callStack: [makeFrame('fn', 7, [])], heap: [], output: '', dsaState: { type: 'array', nodes: height.map((v,k) => ({id:'h'+k,value:v,highlight:k===left||k===right?'comparing':'none'})), pointer: left, pointer2: right, message: 'Height = ' + h } })
    let w = right - left
    steps.push({ line: 8, description: 'w = ' + right + ' - ' + left + ' = ' + w, variables: [], callStack: [makeFrame('fn', 8, [])], heap: [], output: '', dsaState: { type: 'array', nodes: height.map((v,k) => ({id:'h'+k,value:v,highlight:k===left||k===right?'comparing':'none'})), pointer: left, pointer2: right, message: 'Width = ' + w } })
    let area = w * h
    if (area > maxArea) maxArea = area
    steps.push({ line: 9, description: 'maxArea = Math.max(' + maxArea + ', ' + area + ')', variables: [], callStack: [makeFrame('fn', 9, [])], heap: [], output: '', dsaState: { type: 'array', nodes: height.map((v,k) => ({id:'h'+k,value:v,highlight:k===left||k===right?'found':'none'})), pointer: left, pointer2: right, message: 'Area = ' + area + ', maxArea = ' + maxArea } })

    steps.push({ line: 11, description: 'if (' + height[left] + ' < ' + height[right] + ')', variables: [], callStack: [makeFrame('fn', 11, [])], heap: [], output: '', dsaState: { type: 'array', nodes: height.map((v,k) => ({id:'h'+k,value:v,highlight:k===left||k===right?'active':'none'})), pointer: left, pointer2: right, message: 'Compare heights' } })
    if (height[left] < height[right]) {
      left++
      steps.push({ line: 12, description: 'left++', variables: [], callStack: [makeFrame('fn', 12, [])], heap: [], output: '', dsaState: { type: 'array', nodes: height.map((v,k) => ({id:'h'+k,value:v,highlight:k===left||k===right?'active':'none'})), pointer: left, pointer2: right, message: 'left moved to ' + left } })
    } else {
      steps.push({ line: 13, description: 'else', variables: [], callStack: [makeFrame('fn', 13, [])], heap: [], output: '', dsaState: { type: 'array', nodes: height.map((v,k) => ({id:'h'+k,value:v,highlight:k===left||k===right?'active':'none'})), pointer: left, pointer2: right, message: 'else' } })
      right--
      steps.push({ line: 14, description: 'right--', variables: [], callStack: [makeFrame('fn', 14, [])], heap: [], output: '', dsaState: { type: 'array', nodes: height.map((v,k) => ({id:'h'+k,value:v,highlight:k===left||k===right?'active':'none'})), pointer: left, pointer2: right, message: 'right moved to ' + right } })
    }
  }
  steps.push({ line: 6, description: 'while (' + left + ' < ' + right + ')', variables: [], callStack: [makeFrame('fn', 6, [])], heap: [], output: '', dsaState: { type: 'array', nodes: height.map((v,k) => ({id:'h'+k,value:v,highlight:k===left||k===right?'active':'none'})), pointer: left, pointer2: right, message: 'Condition false' } })
  steps.push({ line: 18, description: 'Return ' + maxArea, variables: [], callStack: [makeFrame('fn', 18, [])], heap: [], output: String(maxArea), dsaState: { type: 'array', nodes: height.map((v,i) => ({id:'h'+i,value:v,highlight:'visited'})), message: 'Done' } })
  return steps
}""",
    text,
    flags=re.DOTALL
)

# Replace genSearchInsert
text = re.sub(
    r'export function genSearchInsert.*?return steps\n}',
    """export function genSearchInsert(nums: number[], target: number): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  steps.push({ line: 1, description: 'searchInsert', variables: [], callStack: [makeFrame('fn', 1, [])], heap: [], output: '', dsaState: { type: 'array', nodes: nums.map((v,i) => ({id:'n'+i,value:v,highlight:'none'})), message: 'Find ' + target } })
  let left = 0, right = nums.length - 1
  steps.push({ line: 2, description: 'let left = 0', variables: [], callStack: [makeFrame('fn', 2, [])], heap: [], output: '', dsaState: { type: 'array', nodes: nums.map((v,i) => ({id:'n'+i,value:v,highlight:'none'})), pointer: left, message: 'left = 0' } })
  steps.push({ line: 3, description: 'let right = ' + right, variables: [], callStack: [makeFrame('fn', 3, [])], heap: [], output: '', dsaState: { type: 'array', nodes: nums.map((v,i) => ({id:'n'+i,value:v,highlight:'none'})), pointer: left, pointer2: right, message: 'right = ' + right } })

  while (left <= right) {
    steps.push({ line: 5, description: 'while (' + left + ' <= ' + right + ')', variables: [], callStack: [makeFrame('fn', 5, [])], heap: [], output: '', dsaState: { type: 'array', nodes: nums.map((v,k) => ({id:'n'+k,value:v,highlight:k>=left&&k<=right?'active':'none'})), pointer: left, pointer2: right, message: 'Loop condition' } })
    let mid = Math.floor((left + right) / 2)
    steps.push({ line: 6, description: 'mid = ' + mid, variables: [{name:'mid',value:mid,type:'number',scope:'fn'}], callStack: [makeFrame('fn', 6, [])], heap: [], output: '', dsaState: { type: 'array', nodes: nums.map((v,k) => ({id:'n'+k,value:v,highlight:k===mid?'comparing':k>=left&&k<=right?'active':'none'})), pointer: left, pointer2: right, message: 'mid = ' + mid } })
    
    steps.push({ line: 7, description: 'if (nums[mid] === target)', variables: [], callStack: [makeFrame('fn', 7, [])], heap: [], output: '', dsaState: { type: 'array', nodes: nums.map((v,k) => ({id:'n'+k,value:v,highlight:k===mid?'comparing':k>=left&&k<=right?'active':'none'})), pointer: left, pointer2: right, message: 'Check if ' + nums[mid] + ' == ' + target } })
    if (nums[mid] === target) {
      steps.push({ line: 7, description: 'Found target at ' + mid, variables: [], callStack: [makeFrame('fn', 7, [])], heap: [], output: String(mid), dsaState: { type: 'array', nodes: nums.map((v,k) => ({id:'n'+k,value:v,highlight:k===mid?'found':'none'})), pointer: left, pointer2: right, message: 'Found' } })
      return steps
    }
    steps.push({ line: 8, description: 'else if (nums[mid] < target)', variables: [], callStack: [makeFrame('fn', 8, [])], heap: [], output: '', dsaState: { type: 'array', nodes: nums.map((v,k) => ({id:'n'+k,value:v,highlight:k===mid?'comparing':k>=left&&k<=right?'active':'none'})), pointer: left, pointer2: right, message: 'Check if ' + nums[mid] + ' < ' + target } })
    if (nums[mid] < target) {
      left = mid + 1
      steps.push({ line: 8, description: 'left = ' + left, variables: [], callStack: [makeFrame('fn', 8, [])], heap: [], output: '', dsaState: { type: 'array', nodes: nums.map((v,k) => ({id:'n'+k,value:v,highlight:k===mid?'visited':k>=left&&k<=right?'active':'none'})), pointer: left, pointer2: right, message: 'Search right half' } })
    } else {
      steps.push({ line: 9, description: 'else right = mid - 1', variables: [], callStack: [makeFrame('fn', 9, [])], heap: [], output: '', dsaState: { type: 'array', nodes: nums.map((v,k) => ({id:'n'+k,value:v,highlight:k===mid?'visited':k>=left&&k<=right?'active':'none'})), pointer: left, pointer2: right, message: 'Search left half' } })
      right = mid - 1
    }
  }
  steps.push({ line: 5, description: 'while (' + left + ' <= ' + right + ')', variables: [], callStack: [makeFrame('fn', 5, [])], heap: [], output: '', dsaState: { type: 'array', nodes: nums.map((v,k) => ({id:'n'+k,value:v,highlight:'visited'})), pointer: left, pointer2: right, message: 'Not found' } })
  steps.push({ line: 12, description: 'return left (' + left + ')', variables: [], callStack: [makeFrame('fn', 12, [])], heap: [], output: String(left), dsaState: { type: 'array', nodes: nums.map((v,k) => ({id:'n'+k,value:v,highlight:k===left?'found':'none'})), pointer: left, pointer2: right, message: 'Insert position' } })
  return steps
}""",
    text,
    flags=re.DOTALL
)

with open('src/utils/executionEngine.ts', 'w', encoding='utf-8') as f:
    f.write(text)
print("Done")
