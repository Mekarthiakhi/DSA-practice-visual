import type { LeetCodeProblem } from '../data/leetcodeProblems'
import type { ExecutionStatus, ExecutionStep } from '../store/ideStore'

export type VisualizationFamily =
  | 'array' | 'hashmap' | 'two-pointer' | 'sliding-window' | 'stack'
  | 'linked-list' | 'tree' | 'graph' | 'heap' | 'trie' | 'dynamic-programming'
  | 'backtracking' | 'intervals' | 'binary-search' | 'greedy' | 'bit'
  | 'math' | 'design' | 'generic'

export interface ProblemMilestone {
  label: string
  purpose: string
  evidence: RegExp[]
}

export interface ProblemVisualizationProfile {
  family: VisualizationFamily
  label: string
  summary: string
  canvas: string
  watch: string[]
  invariants: string[]
  milestones: ProblemMilestone[]
  source: 'category' | 'title/code' | 'fallback'
}

export interface DirectionSignal {
  id: string
  tone: 'positive' | 'warning' | 'neutral'
  label: string
  detail: string
}

const commonStart: ProblemMilestone = {
  label: 'Define the state',
  purpose: 'Create the function/class and the state needed to process the input.',
  evidence: [/\b(?:function|class|def)\b/, /=>/],
}

const commonFinish: ProblemMilestone = {
  label: 'Produce an answer',
  purpose: 'Return or emit the value required by the problem.',
  evidence: [/\breturn\b/, /\b(?:console\.log|print)\s*\(/],
}

const loopMilestone: ProblemMilestone = {
  label: 'Make measurable progress',
  purpose: 'Advance an index, pointer, queue, stack, or recursive subproblem.',
  evidence: [/\b(?:for|while)\b/, /\b\w+\s*\([^)]*\)\s*[;}]?\s*$/m, /\b(?:push|pop|shift|append|popleft)\s*\(/],
}

function milestone(label: string, purpose: string, ...evidence: RegExp[]): ProblemMilestone {
  return { label, purpose, evidence }
}

const PROFILES: Record<VisualizationFamily, Omit<ProblemVisualizationProfile, 'family' | 'source'>> = {
  array: {
    label: 'Array / sequence', summary: 'Follow indexes, values, comparisons, and writes across the sequence.', canvas: 'Indexed cells and pointer markers',
    watch: ['input array', 'current index', 'candidate/result', 'changed cells'],
    invariants: ['Indexes stay in bounds', 'Each iteration advances', 'Only intended cells are mutated'],
    milestones: [commonStart, milestone('Traverse or transform', 'Visit the relevant values and update the candidate state.', /\b(?:for|while)\b/, /\.(?:map|filter|reduce|sort)\s*\(/), commonFinish],
  },
  hashmap: {
    label: 'Array + lookup table', summary: 'Track each value alongside the keys accumulated in a map or set.', canvas: 'Indexed cells with map/set state',
    watch: ['current value', 'Map/Set keys', 'frequency/complement', 'answer'],
    invariants: ['Stored keys represent already-processed input', 'Lookup and insertion order matches the strategy', 'Duplicate handling is intentional'],
    milestones: [commonStart, milestone('Build lookup state', 'Record values, frequencies, or complements for fast reuse.', /\b(?:Map|Set|dict|set|Counter)\b/, /\[[^\]]+\]\s*(?:=|\+=)/), loopMilestone, commonFinish],
  },
  'two-pointer': {
    label: 'Two pointers', summary: 'Show two positions moving through a sequence and the range they delimit.', canvas: 'Sequence with left/right pointer markers',
    watch: ['left pointer', 'right pointer', 'current pair/range', 'answer'],
    invariants: ['Both pointers stay in bounds', 'At least one pointer moves per iteration', 'The remaining search range does not grow unexpectedly'],
    milestones: [commonStart, milestone('Initialize both pointers', 'Place pointers at meaningful starting positions.', /\b(?:left|right|start|end|lo|hi)\b/, /\b(?:l|r)\s*=/), milestone('Shrink or advance', 'Move a pointer based on the current condition.', /(?:left|right|start|end|lo|hi|\bl\b|\br\b)\s*(?:\+\+|--|[+\-]=|=)/), commonFinish],
  },
  'sliding-window': {
    label: 'Sliding window', summary: 'Visualize the active range and the state added or removed as it moves.', canvas: 'Highlighted window over a sequence',
    watch: ['window start', 'window end', 'window state', 'best answer'],
    invariants: ['Window boundaries remain ordered', 'Expansion or contraction happens each iteration', 'Removed values leave the window state'],
    milestones: [commonStart, milestone('Expand the window', 'Advance the right boundary and include new state.', /\b(?:right|end)\b/, /\b(?:for|while)\b/), milestone('Restore validity', 'Move the left boundary while the window violates its condition.', /\b(?:left|start)\s*(?:\+\+|\+=|=)/, /\bwhile\b/), commonFinish],
  },
  stack: {
    label: 'Stack', summary: 'Follow last-in-first-out state as values are pushed, inspected, and removed.', canvas: 'Vertical stack and operation timeline',
    watch: ['top item', 'stack size', 'incoming value', 'answer'],
    invariants: ['Never pop an empty stack unintentionally', 'The top represents the latest unresolved item', 'Each processed value is handled once'],
    milestones: [commonStart, milestone('Maintain stack state', 'Push unresolved values and pop them when their condition is satisfied.', /\.(?:push|pop|append)\s*\(/, /\bstack\b/), loopMilestone, commonFinish],
  },
  'linked-list': {
    label: 'Linked list', summary: 'Render nodes and pointer rewiring so ownership and traversal remain visible.', canvas: 'Node chain with next/previous/random edges',
    watch: ['head', 'current node', 'next/previous node', 'rewired edge'],
    invariants: ['Save a next pointer before destructive rewiring', 'Traversal eventually reaches null or a known cycle', 'Returned head belongs to the intended chain'],
    milestones: [commonStart, milestone('Walk node references', 'Advance through node links without losing the remaining chain.', /\.next\b/, /\b(?:head|current|slow|fast|prev)\b/), milestone('Rewire or select nodes', 'Update links or identify the requested node safely.', /\.next\s*=/, /\b(?:slow|fast)\s*=/), commonFinish],
  },
  tree: {
    label: 'Tree traversal', summary: 'Show the active node, traversal frontier, and result at each tree level.', canvas: 'Tree nodes with traversal path/frontier',
    watch: ['current node', 'left/right child', 'queue/stack', 'depth/result'],
    invariants: ['Null children are handled', 'Every required node is visited once', 'Recursive/base cases reduce the remaining subtree'],
    milestones: [commonStart, milestone('Handle the base case', 'Stop safely at an empty node or completed subtree.', /\bif\b[^\n]*(?:null|None|!\s*\w+)/), milestone('Visit child subtrees', 'Traverse left/right children using recursion or a frontier.', /\.left\b/, /\.right\b/, /\b(?:queue|stack)\b/), commonFinish],
  },
  graph: {
    label: 'Graph traversal', summary: 'Display nodes, edges, the traversal frontier, and visited-state changes.', canvas: 'Node-edge graph with frontier and visited colors',
    watch: ['current node', 'neighbors', 'visited set', 'queue/stack/distance'],
    invariants: ['Visited state prevents unintended repeated work', 'Only reachable neighbors enter the frontier', 'Distance/cost updates follow the chosen rule'],
    milestones: [commonStart, milestone('Track visited nodes', 'Record processed or discovered nodes to control revisits.', /\bvisited\b/, /\b(?:Set|set|Map|dict)\b/), milestone('Process the frontier', 'Remove a node, inspect neighbors, and add eligible neighbors.', /\b(?:queue|stack|heap)\b/, /\bneighbors?\b/, /\.(?:push|shift|pop|append|popleft)\s*\(/), commonFinish],
  },
  heap: {
    label: 'Heap / priority queue', summary: 'Track the priority frontier and which candidate is removed next.', canvas: 'Heap tree with priority-operation timeline',
    watch: ['heap root', 'heap size', 'inserted candidate', 'removed priority'],
    invariants: ['The heap ordering rule is restored after each operation', 'Heap size matches inserted minus removed items', 'The root is the next intended priority'],
    milestones: [commonStart, milestone('Maintain priority state', 'Insert candidates and remove the current best priority.', /\b(?:heap|PriorityQueue|MinPriorityQueue|MaxPriorityQueue)\b/, /\bheapq\b/), loopMilestone, commonFinish],
  },
  trie: {
    label: 'Trie', summary: 'Follow characters through prefix nodes and show terminal-word markers.', canvas: 'Character tree with active prefix path',
    watch: ['current character', 'current trie node', 'children map', 'end-of-word flag'],
    invariants: ['Each edge represents one character', 'Prefix traversal stops cleanly on a missing child', 'Terminal markers distinguish words from prefixes'],
    milestones: [commonStart, milestone('Walk characters', 'Advance through one child edge for each character.', /\b(?:for|while)\b/, /\b(?:char|character|word|prefix)\b/), milestone('Maintain trie nodes', 'Create/read children and update terminal state.', /\bchildren\b/, /\b(?:isEnd|endOfWord|terminal)\b/), commonFinish],
  },
  'dynamic-programming': {
    label: 'Dynamic programming', summary: 'Show subproblems, transitions, and the memo/table cells that become final.', canvas: '1-D or 2-D state table with changed cells',
    watch: ['state index/cell', 'transition candidates', 'memo/table', 'base cases'],
    invariants: ['Base cases are initialized', 'Each transition reads already-valid states', 'State dimensions cover the requested answer'],
    milestones: [commonStart, milestone('Initialize base cases', 'Seed the smallest subproblems before transitions use them.', /\b(?:dp|memo|cache)\b/, /\[[^\]]*\]\s*=/), milestone('Apply a transition', 'Combine smaller states into the current state.', /\b(?:dp|memo|cache)\b[^\n]*(?:min|max|\+|=)/, /\breturn\b[^\n]*(?:\w+\()/), commonFinish],
  },
  backtracking: {
    label: 'Backtracking', summary: 'Render the decision tree, current path, accepted choices, and rollback actions.', canvas: 'Decision tree with active path and rollback',
    watch: ['current choice', 'path', 'remaining candidates', 'solutions'],
    invariants: ['Every recursive call reduces or advances the search', 'State is restored after exploring a branch', 'Only valid completed paths are recorded'],
    milestones: [commonStart, milestone('Choose and recurse', 'Add a candidate and explore the smaller decision problem.', /\b(?:path|current|choice)\b/, /\b(?:backtrack|dfs)\s*\(/), milestone('Undo the choice', 'Restore mutable state before exploring the next branch.', /\.(?:pop|delete|remove)\s*\(/, /\b(?:path|current)\s*=/), commonFinish],
  },
  intervals: {
    label: 'Intervals', summary: 'Show sorted ranges, overlap decisions, and the merged/selected result.', canvas: 'Number-line ranges with overlap highlighting',
    watch: ['current interval', 'previous interval', 'start/end boundaries', 'result ranges'],
    invariants: ['Intervals are processed in the required order', 'Merged boundaries cover both ranges', 'Non-overlapping intervals remain distinct'],
    milestones: [commonStart, milestone('Order the intervals', 'Sort or otherwise establish a safe processing order.', /\.sort\s*\(/, /\bsorted\s*\(/), milestone('Resolve overlap', 'Compare boundaries and merge/select ranges.', /\b(?:start|end|interval)\b/, /\b(?:Math\.max|max|Math\.min|min)\b/), commonFinish],
  },
  'binary-search': {
    label: 'Binary search', summary: 'Highlight the current ordered range, midpoint, and discarded half.', canvas: 'Ordered cells with low/mid/high markers',
    watch: ['low boundary', 'midpoint', 'high boundary', 'comparison target'],
    invariants: ['The candidate range remains valid', 'Each iteration strictly shrinks the range', 'Midpoint calculation stays inside the range'],
    milestones: [commonStart, milestone('Initialize the range', 'Set lower and upper boundaries around all candidates.', /\b(?:left|right|low|high|lo|hi)\b/), milestone('Choose and compare midpoint', 'Calculate a midpoint and discard an impossible half.', /\bmid\b/, /(?:left|right|low|high|lo|hi)\s*(?:=|\+\+|--)/), commonFinish],
  },
  greedy: {
    label: 'Greedy choice', summary: 'Show candidate ordering, the local choice, and accumulated result.', canvas: 'Candidate timeline with accepted/rejected choices',
    watch: ['current candidate', 'local best choice', 'remaining capacity/range', 'result'],
    invariants: ['Each accepted choice preserves feasibility', 'Candidates are considered in the required order', 'A rejected choice cannot improve the current feasible result'],
    milestones: [commonStart, milestone('Establish choice order', 'Sort or scan candidates in the order required by the greedy proof.', /\.sort\s*\(/, /\bsorted\s*\(/, /\b(?:for|while)\b/), milestone('Accept or reject', 'Update the result only when the local choice remains feasible.', /\bif\b/, /\b(?:result|answer|count|total)\b/), commonFinish],
  },
  bit: {
    label: 'Bit manipulation', summary: 'Display operands in binary and highlight each mask/shift/XOR update.', canvas: 'Binary rows with active bit positions',
    watch: ['operand bits', 'mask', 'shift count', 'accumulator'],
    invariants: ['Bit width/sign behavior is intentional', 'Each shift advances toward termination', 'Mask operations preserve unrelated bits'],
    milestones: [commonStart, milestone('Apply bit operations', 'Use masks, shifts, XOR, AND, or OR to transform the state.', /(?:<<|>>|>>>|\^|&|\|)/), loopMilestone, commonFinish],
  },
  math: {
    label: 'Math / geometry', summary: 'Track numeric state, formulas, coordinates, and convergence toward the result.', canvas: 'Numeric state and coordinate/formula timeline',
    watch: ['current operands', 'accumulator', 'coordinates/formula', 'termination condition'],
    invariants: ['Arithmetic stays within the intended domain', 'Each iteration reduces the remaining work', 'Boundary and zero cases are handled'],
    milestones: [commonStart, milestone('Transform numeric state', 'Apply the formula or recurrence to reduce the problem.', /\b(?:Math|abs|min|max|sqrt|pow|gcd)\b/, /[+\-*/%]=?/), loopMilestone, commonFinish],
  },
  design: {
    label: 'Operation sequence', summary: 'Show each method call and the object state before and after the operation.', canvas: 'Operation timeline with object-state snapshots',
    watch: ['operation', 'arguments', 'object fields', 'return value'],
    invariants: ['Constructor establishes valid state', 'Every operation preserves the data-structure invariant', 'Return values match post-operation state'],
    milestones: [commonStart, milestone('Initialize object state', 'Set the fields required by later operations.', /\bconstructor\s*\(/, /\b__init__\s*\(/), milestone('Implement state transitions', 'Methods update or query the object state consistently.', /\bclass\b/, /\b(?:push|pop|get|put|add|remove|insert|search)\s*\(/), commonFinish],
  },
  generic: {
    label: 'Control-flow overview', summary: 'Follow executed lines, variables, calls, branches, and produced output.', canvas: 'Variable timeline and call-flow steps',
    watch: ['inputs', 'changed variables', 'branch decisions', 'return/output'],
    invariants: ['Execution makes progress', 'Inputs and boundary cases are handled', 'The produced output has the required shape'],
    milestones: [commonStart, loopMilestone, commonFinish],
  },
}

function detectFamily(problem: LeetCodeProblem): { family: VisualizationFamily; source: ProblemVisualizationProfile['source'] } {
  const category = problem.category.toLowerCase()
  const title = problem.title.toLowerCase()
  const sourceCode = Object.values(problem.starterCode).filter(Boolean).join('\n').toLowerCase()

  const categories: Array<[RegExp, VisualizationFamily]> = [
    [/tries?/, 'trie'], [/linked list/, 'linked-list'], [/advanced graphs?|graphs?/, 'graph'],
    [/trees?/, 'tree'], [/heap|priority queue/, 'heap'], [/backtracking/, 'backtracking'],
    [/dynamic programming/, 'dynamic-programming'], [/sliding window/, 'sliding-window'],
    [/two pointers?/, 'two-pointer'], [/binary search/, 'binary-search'], [/intervals?/, 'intervals'],
    [/stacks?/, 'stack'], [/bit manipulation/, 'bit'], [/math|geometry/, 'math'],
    [/greedy/, 'greedy'], [/arrays?\s*&\s*hashing/, 'hashmap'], [/arrays?/, 'array'],
  ]
  const matched = categories.find(([pattern]) => pattern.test(category))
  if (matched) return { family: matched[1], source: 'category' }
  if (/\b(?:trie|prefix tree)\b/.test(title)) return { family: 'trie', source: 'title/code' }
  if (/\b(?:cache|design|twitter|iterator|codec|median finder)\b/.test(title) || /\bclass\b/.test(sourceCode)) {
    return { family: 'design', source: 'title/code' }
  }
  return { family: 'generic', source: 'fallback' }
}

export function getProblemVisualizationProfile(problem: LeetCodeProblem): ProblemVisualizationProfile {
  const detected = detectFamily(problem)
  return { family: detected.family, source: detected.source, ...PROFILES[detected.family] }
}

function hasEvidence(code: string, milestone: ProblemMilestone): boolean {
  return milestone.evidence.some(pattern => {
    pattern.lastIndex = 0
    return pattern.test(code)
  })
}

function canvasTypes(family: VisualizationFamily): string[] {
  if (['array', 'hashmap', 'two-pointer', 'sliding-window', 'binary-search', 'intervals', 'greedy'].includes(family)) return ['array', 'hashmap', 'string']
  if (family === 'linked-list') return ['linkedlist']
  if (family === 'tree' || family === 'heap' || family === 'trie') return ['tree', 'heap']
  if (family === 'graph') return ['graph']
  if (family === 'stack' || family === 'backtracking') return ['stack']
  if (family === 'dynamic-programming') return ['matrix', 'array']
  return []
}

export function analyzeProblemDirection(
  profile: ProblemVisualizationProfile,
  code: string,
  steps: ExecutionStep[],
  executionStatus: ExecutionStatus,
  lastJudgeScore?: number,
): DirectionSignal[] {
  const signals: DirectionSignal[] = []
  const meaningfulSource = code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').trim()
  const observedMilestones = profile.milestones.filter(item => hasEvidence(meaningfulSource, item)).length
  const diagnostic = steps.find(step => step.diagnostic?.severity === 'error')?.diagnostic

  signals.push({
    id: 'strategy',
    tone: observedMilestones >= Math.min(2, profile.milestones.length) ? 'positive' : 'neutral',
    label: `${observedMilestones}/${profile.milestones.length} strategy signals found`,
    detail: observedMilestones > 0
      ? 'The source contains structural evidence for this approach. This is guidance, not a correctness proof.'
      : 'Start implementing the milestones below; no approach-specific evidence is visible yet.',
  })

  if (diagnostic) {
    signals.push({ id: 'runtime', tone: 'warning', label: `Execution stops at line ${diagnostic.line}`, detail: `${diagnostic.type}: ${diagnostic.message}` })
  } else if (steps.length > 0) {
    const distinctLines = new Set(steps.map(step => step.line)).size
    signals.push({
      id: 'runtime', tone: executionStatus === 'error' ? 'warning' : 'positive',
      label: `${steps.length} runtime steps across ${distinctLines} source lines`,
      detail: 'The overview is derived from the current execution, not from a prerecorded animation.',
    })
  } else {
    signals.push({ id: 'runtime', tone: 'neutral', label: 'Run the code for runtime evidence', detail: 'Visualization and direction feedback become more precise after a real test execution.' })
  }

  const specializedState = steps.find(step => step.dsaState)?.dsaState
  const expectedTypes = canvasTypes(profile.family)
  if (specializedState && (expectedTypes.length === 0 || expectedTypes.includes(specializedState.type))) {
    signals.push({ id: 'canvas', tone: 'positive', label: `${profile.label} state detected`, detail: `The canvas recognized live ${specializedState.type} data.` })
  } else if (steps.length > 0) {
    signals.push({ id: 'canvas', tone: 'neutral', label: 'Generic trace active', detail: `Line, variable, and call-flow evidence is available; ${profile.canvas.toLowerCase()} needs recognizable runtime state or a fixture.` })
  }

  if (lastJudgeScore === 1) {
    signals.push({ id: 'judge', tone: 'positive', label: 'All last-run judge cases passed', detail: 'This is the strongest available correctness signal for the configured cases.' })
  } else if (lastJudgeScore !== undefined) {
    signals.push({ id: 'judge', tone: 'warning', label: `${Math.round(lastJudgeScore * 100)}% of last-run cases passed`, detail: 'Review the first failing execution step in the judge panel.' })
  } else {
    signals.push({ id: 'judge', tone: 'neutral', label: 'Correctness not verified yet', detail: 'Run all judge cases before treating the approach as correct.' })
  }

  return signals
}

export function getMilestoneEvidence(profile: ProblemVisualizationProfile, code: string): boolean[] {
  return profile.milestones.map(item => hasEvidence(code, item))
}
