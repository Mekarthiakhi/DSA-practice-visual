import type { LeetCodeProblem } from '../data/leetcodeProblems'

export type LeetCodeHarnessLanguage = 'javascript' | 'python'

export interface LeetCodeHarnessResult {
  code: string
  added: boolean
  message?: string
}

export type StructuredFixtureKind = 'graph' | 'random-list' | 'operations' | 'trie'

export function stripGeneratedHarness(code: string, language: LeetCodeHarnessLanguage): string {
  const marker = language === 'javascript' ? '// Visualization input' : '# Visualization input'
  return code.split(marker)[0].trimEnd()
}

interface InputAssignment {
  name: string
  value: string
}

interface CallableInfo {
  name: string
  params: string[]
  classMethod?: boolean
}

function stripJavaScriptComments(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, comment => comment.replace(/[^\n]/g, ' '))
    .replace(/\/\/.*$/gm, '')
}

export function splitLeetCodeInput(input: string): string[] {
  const normalized = input
    .replace(/^\s*Input\s*:\s*/i, '')
    .replace(/\r/g, '')
    .replace(/\n(?=\s*[A-Za-z_$][\w$]*\s*=)/g, ', ')
  const parts: string[] = []
  let start = 0
  let depth = 0
  let quote = ''

  for (let index = 0; index < normalized.length; index++) {
    const char = normalized[index]
    if (quote) {
      if (char === quote && normalized[index - 1] !== '\\') quote = ''
      continue
    }
    if (char === '"' || char === "'" || char === '`') quote = char
    else if ('[{('.includes(char)) depth++
    else if (']})'.includes(char)) depth--
    else if (char === ',' && depth === 0) {
      parts.push(normalized.slice(start, index).trim())
      start = index + 1
    }
  }
  parts.push(normalized.slice(start).trim())
  return parts.filter(Boolean)
}

function findTopLevelEquals(part: string): number {
  let depth = 0
  let quote = ''
  for (let index = 0; index < part.length; index++) {
    const char = part[index]
    if (quote) {
      if (char === quote && part[index - 1] !== '\\') quote = ''
      continue
    }
    if (char === '"' || char === "'" || char === '`') quote = char
    else if ('[{('.includes(char)) depth++
    else if (']})'.includes(char)) depth--
    else if (char === '=' && depth === 0) return index
  }
  return -1
}

function parseAssignments(input: string): InputAssignment[] {
  return splitLeetCodeInput(input).map(part => {
    const equals = findTopLevelEquals(part)
    return equals > 0
      ? { name: part.slice(0, equals).trim(), value: part.slice(equals + 1).trim() }
      : { name: '', value: part.trim() }
  })
}

function cleanParam(param: string): string {
  return param
    .replace(/^\.\.\./, '')
    .split('=')[0]
    .split(':')[0]
    .trim()
}

function findJavaScriptCallable(code: string): CallableInfo | undefined {
  const executableCode = stripJavaScriptComments(code)
  const declaration = executableCode.match(/function\s+([\w$]+)\s*\(([^)]*)\)/)
  const expression = executableCode.match(/(?:var|let|const)\s+([\w$]+)\s*=\s*function\s*\(([^)]*)\)/)
  const arrow = executableCode.match(/(?:var|let|const)\s+([\w$]+)\s*=\s*\(([^)]*)\)\s*=>/)
  const match = declaration || expression || arrow
  if (!match) return undefined
  return { name: match[1], params: splitLeetCodeInput(match[2]).map(cleanParam).filter(Boolean) }
}

function findPythonCallable(code: string): CallableInfo | undefined {
  const solutionDeclaration = /^class\s+Solution(?:\([^)]*\))?\s*:\s*$/m.exec(code)
  if (solutionDeclaration?.index !== undefined) {
    const afterDeclaration = code.slice(solutionDeclaration.index + solutionDeclaration[0].length)
    const nextTopLevel = afterDeclaration.search(/^\S/m)
    const solutionBody = nextTopLevel >= 0 ? afterDeclaration.slice(0, nextTopLevel) : afterDeclaration
    const classMethod = solutionBody.match(/^\s+def\s+(?!__)([\w$]+)\s*\(\s*self\s*,?([^)]*)\)/m)
    if (classMethod) {
      return {
        name: classMethod[1],
        params: splitLeetCodeInput(classMethod[2]).map(cleanParam).filter(Boolean),
        classMethod: true,
      }
    }
  }
  const fn = code.match(/^def\s+(?!__)([\w$]+)\s*\(([^)]*)\)/m)
  if (fn) return { name: fn[1], params: splitLeetCodeInput(fn[2]).map(cleanParam).filter(Boolean) }

  const classMethod = code.match(/^\s+def\s+(?!__)([\w$]+)\s*\(\s*self\s*,?([^)]*)\)/m)
  if (classMethod) {
    return {
      name: classMethod[1],
      params: splitLeetCodeInput(classMethod[2]).map(cleanParam).filter(Boolean),
      classMethod: true,
    }
  }
  return undefined
}

function ensurePythonFunctionBodies(code: string): string {
  const lines = code.replace(/[ \t]+$/gm, '').split('\n')
  const result: string[] = []
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]
    result.push(line)
    if (!/^\s*def\s+\w+\s*\(.*\)\s*(?:->\s*[^:]+)?\s*:\s*$/.test(line)) continue

    const indentation = line.match(/^\s*/)?.[0].length || 0
    let next = index + 1
    while (next < lines.length && !lines[next].trim()) next++
    const nextIndentation = next < lines.length ? lines[next].match(/^\s*/)?.[0].length || 0 : -1
    if (next >= lines.length || nextIndentation <= indentation) {
      result.push(`${' '.repeat(indentation + 4)}pass`)
    }
  }
  return result.join('\n')
}

function normalizeValue(value: string, language: LeetCodeHarnessLanguage): string {
  if (language === 'javascript') {
    return value.replace(/\bNone\b/g, 'null').replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false')
  }
  return value.replace(/\bnull\b/g, 'None').replace(/\btrue\b/g, 'True').replace(/\bfalse\b/g, 'False')
}

function selectArguments(callable: CallableInfo, assignments: InputAssignment[]): InputAssignment[] | undefined {
  if (callable.params.length === 0) return []
  const unused = [...assignments]
  const selected: InputAssignment[] = []
  for (const param of callable.params) {
    const namedIndex = unused.findIndex(input => input.name === param)
    const positionalIndex = unused.findIndex(input => !input.name)
    // LeetCode examples occasionally use a descriptive input name that differs
    // from the starter signature. Preserve signature order as a safe fallback.
    const index = namedIndex >= 0 ? namedIndex : positionalIndex >= 0 ? positionalIndex : unused.length ? 0 : -1
    if (index < 0 || !unused[index].value) return undefined
    selected.push(unused[index])
    unused.splice(index, 1)
  }
  return selected
}

function nodeKind(code: string, param: string): 'list' | 'listCollection' | 'tree' | undefined {
  if (/ListNode/.test(code) && /^lists$/i.test(param)) return 'listCollection'
  if (/ListNode/.test(code) && /^(?:head|list\d*|l\d*)$/i.test(param)) return 'list'
  if (/TreeNode/.test(code) && /^(?:root|tree|p|q|subRoot)$/i.test(param)) return 'tree'
  return undefined
}

function javascriptHelpers(kinds: Set<string>, code: string): string {
  const chunks: string[] = []
  if (kinds.has('list')) {
    chunks.push(`${/class\s+ListNode\b/.test(code) ? '' : 'class ListNode { constructor(val, next = null) { this.val = val; this.next = next; } }\n'}function __buildList(values) {
  const dummy = new ListNode(0);
  let current = dummy;
  for (const value of values) { current.next = new ListNode(value); current = current.next; }
  return dummy.next;
}`)
  }
  if (kinds.has('tree')) {
    chunks.push(`${/class\s+TreeNode\b/.test(code) ? '' : 'class TreeNode { constructor(val, left = null, right = null) { this.val = val; this.left = left; this.right = right; } }\n'}function __buildTree(values) {
  if (!values.length || values[0] == null) return null;
  const root = new TreeNode(values[0]);
  const queue = [root];
  let index = 1;
  while (queue.length && index < values.length) {
    const node = queue.shift();
    if (values[index] != null) { node.left = new TreeNode(values[index]); queue.push(node.left); }
    index++;
    if (index < values.length && values[index] != null) { node.right = new TreeNode(values[index]); queue.push(node.right); }
    index++;
  }
  return root;
}`)
  }
  return chunks.join('\n\n')
}

function pythonHelpers(kinds: Set<string>, code: string): string {
  const chunks: string[] = []
  if (kinds.has('list')) {
    chunks.push(`${/^class\s+ListNode\b/m.test(code) ? '' : 'class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\n'}def __build_list(values):
    dummy = ListNode()
    current = dummy
    for value in values:
        current.next = ListNode(value)
        current = current.next
    return dummy.next`)
  }
  if (kinds.has('tree')) {
    chunks.push(`${/^class\s+TreeNode\b/m.test(code) ? '' : 'class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\n'}def __build_tree(values):
    if not values or values[0] is None:
        return None
    root = TreeNode(values[0])
    queue = [root]
    index = 1
    while queue and index < len(values):
        node = queue.pop(0)
        if values[index] is not None:
            node.left = TreeNode(values[index])
            queue.append(node.left)
        index += 1
        if index < len(values) and values[index] is not None:
            node.right = TreeNode(values[index])
            queue.append(node.right)
        index += 1
    return root`)
  }
  return chunks.join('\n\n')
}

export function createLeetCodeHarness(
  problem: LeetCodeProblem,
  source: string,
  language: LeetCodeHarnessLanguage,
  inputOverride?: string,
): LeetCodeHarnessResult {
  const input = (inputOverride ?? problem.examples[0]?.input ?? '').trim()
  const preparedSource = language === 'python' ? ensurePythonFunctionBodies(source) : source
  if (!input) {
    return { code: preparedSource, added: false, message: 'Add visualization input, then load the code again.' }
  }

  const callable = language === 'javascript' ? findJavaScriptCallable(preparedSource) : findPythonCallable(preparedSource)
  if (!callable) {
    return { code: preparedSource, added: false, message: 'No callable function or Solution method was found.' }
  }

  const assignments = parseAssignments(input)
  const selected = selectArguments(callable, assignments)
  if (!selected) {
    return { code: preparedSource, added: false, message: `Input must provide: ${callable.params.join(', ') || 'no arguments'}.` }
  }

  const kinds = new Set<string>()
  if (/\brandom\b/.test(preparedSource) && /\bNode\b/.test(preparedSource)) {
    return { code: preparedSource, added: false, message: 'Random-pointer nodes require a custom fixture in the editor.' }
  }
  if (/\bneighbors\b/.test(preparedSource) && /\bNode\b/.test(preparedSource)) {
    return { code: preparedSource, added: false, message: 'Graph Node inputs require a custom adjacency-list fixture in the editor.' }
  }
  const args = selected.map((assignment, index) => {
    const param = callable.params[index]
    const kind = nodeKind(preparedSource, param)
    if (kind) kinds.add(kind === 'listCollection' ? 'list' : kind)
    const value = normalizeValue(assignment.value, language)
    if (kind === 'list') return language === 'javascript' ? `__buildList(${value})` : `__build_list(${value})`
    if (kind === 'listCollection') {
      return language === 'javascript'
        ? `${value}.map(values => __buildList(values))`
        : `[__build_list(values) for values in ${value}]`
    }
    if (kind === 'tree') return language === 'javascript' ? `__buildTree(${value})` : `__build_tree(${value})`
    return value
  })

  if (language === 'javascript') {
    const helpers = javascriptHelpers(kinds, preparedSource)
    const invocation = `${callable.name}(${args.join(', ')})`
    return {
      code: `${preparedSource}\n\n// Visualization input${helpers ? `\n${helpers}` : ''}\nconst visualizationResult = ${invocation};\nconsole.log('Result:', visualizationResult);`,
      added: true,
    }
  }

  const helpers = pythonHelpers(kinds, preparedSource)
  const invocation = callable.classMethod
    ? `Solution().${callable.name}(${args.join(', ')})`
    : `${callable.name}(${args.join(', ')})`
  return {
    code: `from __future__ import annotations\n\n${preparedSource}\n\n# Visualization input${helpers ? `\n${helpers}` : ''}\nvisualization_result = ${invocation}\nprint('Result:', visualization_result)`,
    added: true,
  }
}

function findDesignClass(code: string, language: LeetCodeHarnessLanguage): string | undefined {
  if (language === 'javascript') {
    const executable = stripJavaScriptComments(code)
    return executable.match(/class\s+([\w$]+)/)?.[1]
      || executable.match(/(?:var|let|const)\s+([\w$]+)\s*=\s*function\s*\(/)?.[1]
  }
  return [...code.matchAll(/^class\s+(\w+)\s*[:(]/gm)].map(match => match[1]).find(name => name !== 'Solution')
}

function toPythonLiteral(value: unknown): string {
  if (value === null || value === undefined) return 'None'
  if (typeof value === 'boolean') return value ? 'True' : 'False'
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'None'
  if (typeof value === 'string') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(toPythonLiteral).join(', ')}]`
  if (typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>).map(([key, item]) => `${JSON.stringify(key)}: ${toPythonLiteral(item)}`).join(', ')}}`
  }
  return 'None'
}

export function createStructuredFixtureHarness(
  source: string,
  language: LeetCodeHarnessLanguage,
  kind: StructuredFixtureKind,
  fixtureJson: string,
): LeetCodeHarnessResult {
  const preparedSource = language === 'python' ? ensurePythonFunctionBodies(source) : source
  let fixture: unknown
  try {
    fixture = JSON.parse(fixtureJson)
  } catch (error) {
    return {
      code: preparedSource,
      added: false,
      message: `Fixture must be valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    }
  }

  const marker = language === 'javascript' ? '// Visualization input' : '# Visualization input'
  if (kind === 'operations' || kind === 'trie') {
    const record = fixture as { operations?: unknown; arguments?: unknown }
    const operations = record?.operations
    const args = record?.arguments
    if (!Array.isArray(operations) || !Array.isArray(args) || operations.length !== args.length || operations.length === 0) {
      return { code: preparedSource, added: false, message: 'Operations fixture needs equal-length operations and arguments arrays.' }
    }
    const className = findDesignClass(preparedSource, language)
    if (!className) return { code: preparedSource, added: false, message: 'No design class was found in the starter code.' }
    const serializedOps = JSON.stringify(operations)
    const serializedArgs = JSON.stringify(args)
    if (language === 'javascript') {
      return {
        added: true,
        code: `${preparedSource}\n\n${marker}\nconst __operations = ${serializedOps};\nconst __arguments = ${serializedArgs};\nconst __instance = new ${className}(...(__arguments[0] || []));\nconst visualizationResult = [null];\nfor (let i = 1; i < __operations.length; i++) {\n  visualizationResult.push(__instance[__operations[i]](...(__arguments[i] || [])));\n}\nconsole.log('Result:', visualizationResult);`,
      }
    }
    return {
      added: true,
      code: `from __future__ import annotations\n\n${preparedSource}\n\n${marker}\n__operations = ${toPythonLiteral(operations)}\n__arguments = ${toPythonLiteral(args)}\n__instance = ${className}(*(__arguments[0] or []))\nvisualization_result = [None]\nfor __index in range(1, len(__operations)):\n    visualization_result.append(getattr(__instance, __operations[__index])(*(__arguments[__index] or [])))\nprint('Result:', visualization_result)`,
    }
  }

  const callable = language === 'javascript' ? findJavaScriptCallable(preparedSource) : findPythonCallable(preparedSource)
  if (!callable) return { code: preparedSource, added: false, message: 'No callable function or Solution method was found.' }

  if (kind === 'graph') {
    const adjacency = Array.isArray(fixture) ? fixture : (fixture as { adjList?: unknown })?.adjList
    if (!Array.isArray(adjacency) || !adjacency.every(row => Array.isArray(row))) {
      return { code: preparedSource, added: false, message: 'Graph fixture needs {"adjList":[[2,4],[1,3],...]}.' }
    }
    const data = JSON.stringify(adjacency)
    if (language === 'javascript') {
      return {
        added: true,
        code: `${preparedSource}\n\n${marker}\n${/class\s+Node\b/.test(stripJavaScriptComments(preparedSource)) ? '' : 'class Node { constructor(val = 0, neighbors = []) { this.val = val; this.neighbors = neighbors; } }\n'}const __adjacency = ${data};\nconst __nodes = __adjacency.map((_, index) => new Node(index + 1));\n__adjacency.forEach((neighbors, index) => { __nodes[index].neighbors = neighbors.map(value => __nodes[value - 1]); });\nconst visualizationResult = ${callable.name}(__nodes[0] || null);\nconsole.log('Result:', visualizationResult);`,
      }
    }
    const invocation = callable.classMethod ? `Solution().${callable.name}` : callable.name
    return {
      added: true,
      code: `from __future__ import annotations\n\n${preparedSource}\n\n${marker}\n${/^class\s+Node\b/m.test(preparedSource) ? '' : 'class Node:\n    def __init__(self, val=0, neighbors=None):\n        self.val = val\n        self.neighbors = neighbors or []\n\n'}__adjacency = ${toPythonLiteral(adjacency)}\n__nodes = [Node(index + 1) for index in range(len(__adjacency))]\nfor __index, __neighbors in enumerate(__adjacency):\n    __nodes[__index].neighbors = [__nodes[value - 1] for value in __neighbors]\nvisualization_result = ${invocation}(__nodes[0] if __nodes else None)\nprint('Result:', visualization_result)`,
    }
  }

  const nodes = Array.isArray(fixture) ? fixture : (fixture as { nodes?: unknown })?.nodes
  if (!Array.isArray(nodes) || !nodes.every(row => Array.isArray(row) && row.length >= 2)) {
    return { code: preparedSource, added: false, message: 'Random-list fixture needs {"nodes":[[value,randomIndex],...]}.' }
  }
  const data = JSON.stringify(nodes)
  if (language === 'javascript') {
    return {
      added: true,
      code: `${preparedSource}\n\n${marker}\n${/class\s+Node\b/.test(stripJavaScriptComments(preparedSource)) ? '' : 'class Node { constructor(val = 0, next = null, random = null) { this.val = val; this.next = next; this.random = random; } }\n'}const __pairs = ${data};\nconst __nodes = __pairs.map(pair => new Node(pair[0]));\n__nodes.forEach((node, index) => { node.next = __nodes[index + 1] || null; node.random = __pairs[index][1] == null ? null : __nodes[__pairs[index][1]]; });\nconst visualizationResult = ${callable.name}(__nodes[0] || null);\nconsole.log('Result:', visualizationResult);`,
    }
  }
  const invocation = callable.classMethod ? `Solution().${callable.name}` : callable.name
  return {
    added: true,
    code: `from __future__ import annotations\n\n${preparedSource}\n\n${marker}\n${/^class\s+Node\b/m.test(preparedSource) ? '' : 'class Node:\n    def __init__(self, val=0, next=None, random=None):\n        self.val = val\n        self.next = next\n        self.random = random\n\n'}__pairs = ${toPythonLiteral(nodes)}\n__nodes = [Node(pair[0]) for pair in __pairs]\nfor __index, __node in enumerate(__nodes):\n    __node.next = __nodes[__index + 1] if __index + 1 < len(__nodes) else None\n    __random_index = __pairs[__index][1]\n    __node.random = None if __random_index is None else __nodes[__random_index]\nvisualization_result = ${invocation}(__nodes[0] if __nodes else None)\nprint('Result:', visualization_result)`,
  }
}
