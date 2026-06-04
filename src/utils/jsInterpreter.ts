/**
 * Real JavaScript Interpreter / Tracer — v3
 *
 * Fixes vs v2:
 *  - Variables inside functions are now properly captured via inline try-catch
 *    assignments after every traced statement (not via Proxy on outer scope)
 *  - Block-opener lines (ending with {) get trace only, no capture
 *  - Return/throw/break/continue get capture BEFORE they exit the block
 *  - MAX_STEPS = 3000
 *  - Function params + for-loop vars are pre-collected for capture
 */

import { ExecutionStep, Variable, StackFrame, DSAState, DSANode } from '../store/ideStore'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TraceEvent {
  type: 'line' | 'output'
  line: number
  vars: Record<string, unknown>
  callStack: string[]
  output?: string
}

// ─── Safe value serializer ────────────────────────────────────────────────────

function safeSerialize(val: unknown, depth = 0): unknown {
  if (depth > 3) return '[deep]'
  if (val === null || val === undefined) return val
  if (typeof val === 'function') return `[fn: ${(val as {name?: string}).name || 'anon'}]`
  if (typeof val === 'symbol') return val.toString()
  if (typeof val !== 'object') return val
  if (val instanceof Map) {
    const obj: Record<string, unknown> = {}
    val.forEach((v, k) => { obj[String(k)] = safeSerialize(v, depth + 1) })
    return obj
  }
  if (val instanceof Set) return [...val].map(v => safeSerialize(v, depth + 1))
  if (Array.isArray(val)) return val.slice(0, 30).map(v => safeSerialize(v, depth + 1))
  const res: Record<string, unknown> = {}
  let cnt = 0
  for (const k of Object.keys(val as object)) {
    if (cnt++ > 20) { res['...'] = 'more'; break }
    res[k] = safeSerialize((val as Record<string, unknown>)[k], depth + 1)
  }
  return res
}

function deepClone(val: unknown, depth = 0): unknown {
  if (depth > 5) return '[deep]'
  if (val === null || val === undefined) return val
  const type = typeof val
  if (type !== 'object' && type !== 'function') return val
  if (type === 'function') return val

  if (Array.isArray(val)) {
    const copy = new Array(val.length)
    for (let i = 0; i < val.length; i++) {
      copy[i] = deepClone(val[i], depth + 1)
    }
    return copy
  }

  if (val instanceof Map) {
    const copy = new Map()
    val.forEach((v, k) => {
      copy.set(deepClone(k, depth + 1), deepClone(v, depth + 1))
    })
    return copy
  }

  if (val instanceof Set) {
    const copy = new Set()
    val.forEach(v => {
      copy.add(deepClone(v, depth + 1))
    })
    return copy
  }

  if (val instanceof Date) {
    return new Date(val.getTime())
  }

  if (val instanceof RegExp) {
    return new RegExp(val.source, val.flags)
  }

  try {
    const proto = Object.getPrototypeOf(val)
    if (proto === null || proto === Object.prototype) {
      const copy: Record<string, unknown> = {}
      for (const key of Object.keys(val as object)) {
        copy[key] = deepClone((val as Record<string, unknown>)[key], depth + 1)
      }
      return copy
    }
  } catch {
    // fallback
  }

  return val
}

function typeOf(val: unknown): string {
  if (val === null) return 'null'
  if (val === undefined) return 'undefined'
  if (Array.isArray(val)) return 'Array'
  if (val instanceof Map) return 'Map'
  if (val instanceof Set) return 'Set'
  return typeof val
}

// ─── Export types ─────────────────────────────────────────────────────────────

export interface InterpreterResult {
  steps: ExecutionStep[]
  output: string[]
  error?: string
  detectedType: 'array' | 'linkedlist' | 'tree' | 'graph' | 'stack' | 'queue' | 'hashmap' | 'string' | 'generic'
}

// ─── Pre-scan variable names ──────────────────────────────────────────────────

function collectVarNames(code: string): Set<string> {
  const names = new Set<string>()

  // let/const/var declarations
  for (const m of code.matchAll(/(?:let|const|var)\s+([a-zA-Z_$][\w$]*)/g))
    names.add(m[1])

  // function parameters: function foo(a, b, c = 0)
  for (const m of code.matchAll(/function\s+\w*\s*\(([^)]*)\)/g)) {
    m[1].split(',').map(p => p.trim().split('=')[0].trim().replace(/[.[\]]/g, ''))
      .filter(p => /^[a-zA-Z_$][\w$]*$/.test(p))
      .forEach(p => names.add(p))
  }

  // Arrow function params: (a, b) => or a =>
  for (const m of code.matchAll(/\(([^)]*)\)\s*=>/g)) {
    m[1].split(',').map(p => p.trim().split('=')[0].trim())
      .filter(p => /^[a-zA-Z_$][\w$]*$/.test(p))
      .forEach(p => names.add(p))
  }
  for (const m of code.matchAll(/([a-zA-Z_$][\w$]*)\s*=>/g))
    names.add(m[1])

  // Filter out keywords
  const SKIP = new Set(['true','false','null','undefined','NaN','Infinity','return','typeof','instanceof','in','of','new','delete','void','throw','catch','finally'])
  for (const k of SKIP) names.delete(k)

  return names
}

// ─── Build per-line capture string ────────────────────────────────────────────
// Each capture wraps the variable read in try{}catch{} so missing vars are silent.

function buildCaptureStr(names: Set<string>): string {
  return [...names].map(n => `try{__v__.${n}=${n}}catch{}`).join(';')
}

// ─── Instrument source code ───────────────────────────────────────────────────

function instrumentCode(code: string, captureStr: string): string {
  const lines = code.split('\n')
  const out: string[] = []
  let inMLComment = false

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const trimmed = raw.trim()
    const ln = i + 1

    // Multi-line comment tracking
    if (trimmed.startsWith('/*')) inMLComment = true
    if (inMLComment) {
      out.push(raw)
      if (trimmed.includes('*/')) inMLComment = false
      continue
    }

    // Skip blank / single-line comment
    if (!trimmed || trimmed.startsWith('//')) {
      out.push(raw)
      continue
    }

    const lastChar = trimmed[trimmed.length - 1]
    const opensBlock = lastChar === '{'
    const isJustBrace = /^[}\])]/.test(trimmed)
    const isReturn   = /^return\b/.test(trimmed)
    const isThrow    = /^throw\b/.test(trimmed)
    const isControl  = /^(break|continue)\b/.test(trimmed)

    if (isJustBrace) {
      // Closing brace: emit unchanged + capture so loop-end state is recorded
      out.push(raw)
      out.push(captureStr + ';')
      continue
    }

    if (opensBlock) {
      // Block opener: trace before, no capture after (can't add after {)
      out.push(`__trace__(${ln}); ${raw}`)
      continue
    }

    if (isReturn || isThrow || isControl) {
      // Capture state BEFORE the early exit
      out.push(`__trace__(${ln}); ${captureStr};`)
      out.push(raw)
      continue
    }

    // Normal statement: trace before + capture after
    out.push(`__trace__(${ln}); ${raw}`)
    out.push(captureStr + ';')
  }

  return out.join('\n')
}

// ─── Core interpret function ──────────────────────────────────────────────────

export function interpretCode(code: string): InterpreterResult {
  const events: TraceEvent[] = []
  const consoleLines: string[] = []
  let hasError = ''

  // Shared vars object — inline captures write into this
  const __v__: Record<string, unknown> = {}

  const varNames = collectVarNames(code)
  const captureStr = buildCaptureStr(varNames)
  const instrumentedCode = instrumentCode(code, captureStr)

  // Execution state
  let stepCount = 0
  const MAX_STEPS = 3000
  const callStackNames: string[] = ['main']

  function __trace__(line: number) {
    if (stepCount++ > MAX_STEPS) throw new Error('__MAX_STEPS__')
    
    // Deep clone each captured variable to avoid reference mutations
    const varsCopy: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(__v__)) {
      varsCopy[k] = deepClone(v)
    }

    events.push({
      type: 'line',
      line,
      vars: varsCopy,
      callStack: [...callStackNames],
    })
  }

  const safeConsole = {
    log: (...args: unknown[]) => {
      const str = args.map(a => {
        if (typeof a === 'object' && a !== null) {
          try { return JSON.stringify(safeSerialize(a)) } catch { return String(a) }
        }
        return String(a)
      }).join(' ')
      consoleLines.push(str)

      // Deep clone each captured variable for output events as well
      const varsCopy: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(__v__)) {
        varsCopy[k] = deepClone(v)
      }

      events.push({ type: 'output', line: 0, vars: varsCopy, callStack: [...callStackNames], output: str })
    },
    error: (...a: unknown[]) => safeConsole.log('[ERROR]', ...a),
    warn:  (...a: unknown[]) => safeConsole.log('[WARN]',  ...a),
    info:  (...a: unknown[]) => safeConsole.log('[INFO]',  ...a),
  }

  try {
    const sandbox: Record<string, unknown> = {
      __trace__,
      __v__,
      console: safeConsole,
      Math, JSON, Array, Object, String, Number, Boolean, Map, Set, Date,
      parseInt, parseFloat, isNaN, isFinite,
      Infinity, NaN, undefined,
      setTimeout: () => {}, setInterval: () => {},
      clearTimeout: () => {}, clearInterval: () => {},
    }

    const keys = Object.keys(sandbox)
    const vals = Object.values(sandbox)

    const linesCount = code.split('\n').length
    // eslint-disable-next-line no-new-func
    const fn = new Function(...keys, `"use strict";\n${instrumentedCode}\n${captureStr};\n__trace__(${linesCount});`)
    fn(...vals)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg !== '__MAX_STEPS__') {
      hasError = msg
      consoleLines.push(`❌ Runtime Error: ${msg}`)
    }
  }

  const steps = eventsToSteps(events, code)
  const detectedType = detectDataType(code, __v__)

  return { steps, output: consoleLines, error: hasError || undefined, detectedType }
}

// ─── Filter intermediate swap states ──────────────────────────────────────────

function filterSwapEvents(events: TraceEvent[], activeArrayName: string): TraceEvent[] {
  if (!activeArrayName) return events
  
  const filtered: TraceEvent[] = []
  
  for (let i = 0; i < events.length; i++) {
    const cur = events[i]
    
    // Check if we can look ahead
    if (i > 0 && i < events.length - 1) {
      const prev = filtered[filtered.length - 1]
      const next = events[i + 1]
      
      if (cur.type === 'line' && prev?.type === 'line' && next?.type === 'line') {
        const prevArr = prev.vars[activeArrayName]
        const curArr = cur.vars[activeArrayName]
        const nextArr = next.vars[activeArrayName]
        
        if (Array.isArray(prevArr) && Array.isArray(curArr) && Array.isArray(nextArr)) {
          if (prevArr.length === curArr.length && curArr.length === nextArr.length) {
            // Find positions where prev and next differ
            const diffIndices: number[] = []
            for (let k = 0; k < prevArr.length; k++) {
              if (prevArr[k] !== nextArr[k]) {
                diffIndices.push(k)
              }
            }
            
            if (diffIndices.length === 2) {
              const [idx1, idx2] = diffIndices
              // Check if they are swapped
              const isSwapped = prevArr[idx1] === nextArr[idx2] && prevArr[idx2] === nextArr[idx1]
              
              if (isSwapped) {
                // Check if curArr is an intermediate copy-over state
                let isIntermediate = true
                for (let k = 0; k < curArr.length; k++) {
                  if (k !== idx1 && k !== idx2) {
                    if (curArr[k] !== prevArr[k]) {
                      isIntermediate = false
                      break
                    }
                  }
                }
                
                if (isIntermediate) {
                  const val1 = curArr[idx1]
                  const val2 = curArr[idx2]
                  const expectedVal1 = prevArr[idx1]
                  const expectedVal2 = prevArr[idx2]
                  
                  if (
                    (val1 === expectedVal2 && val2 === expectedVal2) ||
                    (val1 === expectedVal1 && val2 === expectedVal1)
                  ) {
                    // Skip the intermediate state where duplicates exist
                    continue
                  }
                }
              }
            }
          }
        }
      }
    }
    
    filtered.push(cur)
  }
  
  return filtered
}

// ─── Events → Steps ──────────────────────────────────────────────────────────

function eventsToSteps(events: TraceEvent[], code: string): ExecutionStep[] {
  // 1. Detect active array name first to guide the filter
  let activeArrayName = ''
  for (const ev of events) {
    if (ev.type === 'line') {
      const fallback = Object.entries(ev.vars).find(v => (v[0] === 'arr' || v[0] === 'nums' || v[0] === 'array') && Array.isArray(v[1]))
      if (fallback) {
        activeArrayName = fallback[0]
        break
      }
    }
  }

  // 2. Filter intermediate states
  const filteredEvents = filterSwapEvents(events, activeArrayName)

  const codeLines = code.split('\n')
  const steps: ExecutionStep[] = []
  let pendingOutput: string[] = []
  let prevLine = -1
  let prevVarSnap = ''
  
  let swaps = 0
  let comparisons = 0
  let prevArrState: number[] = []
  let prevPointers = ''

  for (const ev of filteredEvents) {
    if (ev.type === 'output' && ev.output) {
      pendingOutput.push(ev.output)
      continue
    }

    const varSnap = JSON.stringify(ev.vars)

    // Skip if same line and same state (no meaningful change)
    if (ev.line === prevLine && varSnap === prevVarSnap && pendingOutput.length === 0) continue
    prevLine = ev.line
    prevVarSnap = varSnap

    const prevStep = steps[steps.length - 1]
    const prevVars = prevStep?.variables || []

    const currentVars: Variable[] = Object.entries(ev.vars)
      .filter(([k]) => !k.startsWith('__'))
      .map(([name, value]) => {
        const serialized = safeSerialize(value)
        const prev = prevVars.find(v => v.name === name)
        const changed = !prev || JSON.stringify(prev.value) !== JSON.stringify(serialized)
        return { name, value: serialized, type: typeOf(value), scope: ev.callStack[ev.callStack.length - 1] || 'main', changed }
      })

    const callStack: StackFrame[] = ev.callStack.map((name, idx) => ({
      id: `f${idx}`, name, line: ev.line, variables: [], isActive: idx === ev.callStack.length - 1,
    }))

    const lineCode = codeLines[ev.line - 1]?.trim() || ''
      const changedArray = currentVars.find(v => v.changed && v.type === 'Array' && Array.isArray(v.value) && typeof v.value[0] === 'number')
      if (changedArray) activeArrayName = changedArray.name
      if (!activeArrayName) {
        const fallback = currentVars.find(v => (v.name === 'arr' || v.name === 'nums' || v.name === 'array') && v.type === 'Array')
        if (fallback) activeArrayName = fallback.name
      }

    const dsaState = buildDSAState(ev.vars, activeArrayName, lineCode)
    const desc = buildDesc(lineCode, ev.vars)

    if (dsaState && dsaState.type === 'array') {
      const currentArr = dsaState.nodes.map(n => Number(n.value))
      const currentPointers = `${dsaState.pointer},${dsaState.pointer2}`
      let isSwap = false
      
      if (prevArrState.length > 0 && currentArr.join(',') !== prevArrState.join(',')) {
        isSwap = true
        swaps++
      } else if (currentPointers !== prevPointers && currentPointers !== 'undefined,undefined') {
        comparisons++
      }

      dsaState.swaps = swaps
      dsaState.comparisons = comparisons

      if (isSwap) {
        dsaState.nodes.forEach((n, idx) => {
          if (prevArrState[idx] !== undefined && Number(n.value) !== prevArrState[idx]) {
            n.highlight = 'swapping'
          }
        })
      }

      prevArrState = currentArr
      prevPointers = currentPointers
    }

    steps.push({
      line: ev.line,
      description: desc,
      variables: currentVars,
      callStack,
      heap: [],
      output: pendingOutput.join('\n'),
      dsaState,
    })
    pendingOutput = []
  }

  if (pendingOutput.length > 0 && steps.length > 0) {
    const last = steps[steps.length - 1]
    steps[steps.length - 1] = { ...last, output: [last.output, ...pendingOutput].filter(Boolean).join('\n') }
  }

  // Mark as sorted if strictly increasing at the end
  if (steps.length > 0) {
    const lastStep = steps[steps.length - 1]
    if (lastStep?.dsaState?.type === 'array') {
      const isSorted = lastStep.dsaState.nodes.every((n, i, a) => i === 0 || Number(n.value) >= Number(a[i-1].value))
      if (isSorted && lastStep.dsaState.swaps !== undefined && lastStep.dsaState.swaps > 0) {
        lastStep.dsaState.nodes.forEach(n => n.highlight = 'sorted')
      }
    }
  }

  return steps
}

// ─── Description builder ──────────────────────────────────────────────────────

function buildDesc(lineCode: string, vars: Record<string, unknown>): string {
  if (!lineCode) return 'Executing...'

  const assignMatch = lineCode.match(/(?:let|const|var)?\s*(\w+)\s*[+\-*/%&|^]?=(?!=)/)
  if (assignMatch) {
    const name = assignMatch[1]
    if (vars[name] !== undefined) {
      const val = JSON.stringify(safeSerialize(vars[name]))?.substring(0, 40) ?? '?'
      return `${name} = ${val}`
    }
  }
  if (/^if[\s(]/.test(lineCode)) return `Check: ${lineCode.replace(/^if\s*\(/, '').replace(/\)\s*\{?$/, '').substring(0, 50)}`
  if (/^for[\s(]/.test(lineCode)) return `Loop: ${lineCode.substring(0, 50)}`
  if (/^while[\s(]/.test(lineCode)) return `While: ${lineCode.substring(0, 50)}`
  if (/^return\b/.test(lineCode)) return `Return: ${lineCode.replace('return', '').trim().substring(0, 40)}`
  const callM = lineCode.match(/(\w+)\s*\(/)
  if (callM) return `Call ${callM[1]}()`
  return lineCode.substring(0, 60)
}

// ─── Detect data structure type ───────────────────────────────────────────────

function detectDataType(code: string, vars: Record<string, unknown>): InterpreterResult['detectedType'] {
  const lower = code.toLowerCase()
  const numArrays = Object.values(vars).filter(v => Array.isArray(v) && (v as unknown[]).length > 1 && typeof (v as unknown[])[0] === 'number')
  if (numArrays.length > 0) return 'array'
  const strs = Object.values(vars).filter(v => typeof v === 'string' && (v as string).length > 1)
  if (strs.length > 0 && (lower.includes('reverse') || lower.includes('palindrome') || lower.includes('char'))) return 'string'
  if (lower.includes('.next') || lower.includes('linkedlist')) return 'linkedlist'
  if (lower.includes('.left') || lower.includes('.right') || lower.includes('bst')) return 'tree'
  if (lower.includes('graph') || lower.includes('adjacency')) return 'graph'
  if (lower.includes('push') && lower.includes('pop') && !lower.includes('array.')) return 'stack'
  if (lower.includes('enqueue') || lower.includes('dequeue')) return 'queue'
  if (Object.values(vars).some(v => v instanceof Map)) return 'hashmap'
  return 'generic'
}

// ─── DSA state builder ────────────────────────────────────────────────────────

function buildDSAState(vars: Record<string, unknown>, preferredName?: string, lineCode = ''): DSAState | undefined {
  // Find the largest numeric array
  const numArrays = Object.entries(vars)
    .filter(([k, v]) => !k.startsWith('__') && Array.isArray(v) && (v as unknown[]).length > 1 && typeof (v as unknown[])[0] === 'number')

  if (numArrays.length > 0) {
    let target = numArrays[0]
    if (preferredName) {
      const match = numArrays.find(a => a[0] === preferredName)
      if (match) target = match
    } else {
      target = numArrays.reduce((best, cur) =>
        (cur[1] as unknown[]).length > (best[1] as unknown[]).length ? cur : best
      )
    }
    const [name, arr] = target
    const values = (arr as number[]).slice(0, 24)

    // Prioritized pointer-resolution
    const rangePointers = ['mid', 'm', 'left', 'l', 'right', 'r', 'low', 'high', 'start', 'end']
    const activeRangePointers = rangePointers.filter(p => typeof vars[p] === 'number' && (vars[p] as number) >= 0 && (vars[p] as number) < values.length)

    let pointer: number | undefined
    let pointer2: number | undefined

    if (activeRangePointers.length > 0) {
      pointer = vars[activeRangePointers[0]] as number
      if (activeRangePointers.length > 1) {
        pointer2 = vars[activeRangePointers[1]] as number
      }
    } else {
      const hasJ = typeof vars['j'] === 'number' && (vars['j'] as number) >= 0 && (vars['j'] as number) < values.length
      const hasI = typeof vars['i'] === 'number' && (vars['i'] as number) >= 0 && (vars['i'] as number) < values.length

      if (hasJ) {
        pointer = vars['j'] as number
        
        const selectionPointers = ['min_idx', 'minIndex', 'min', 'k']
        const foundSel = selectionPointers.find(p => typeof vars[p] === 'number' && (vars[p] as number) >= 0 && (vars[p] as number) < values.length)
        
        if (foundSel) {
          pointer2 = vars[foundSel] as number
        } else if (lineCode.includes('j - 1') || lineCode.includes('j-1') || lineCode.includes('j- 1')) {
          pointer2 = pointer - 1
        } else {
          // Default to j + 1 for bubble sort / default inner loop comparisons
          pointer2 = pointer + 1
        }
      } else if (hasI) {
        pointer = vars['i'] as number
      }
    }

    // Ensure pointer2 is within array bounds
    if (pointer2 !== undefined && (pointer2 < 0 || pointer2 >= values.length)) {
      pointer2 = undefined
    }

    const nodes: DSANode[] = values.map((v, idx) => ({
      id: `n${idx}`,
      value: v,
      highlight: idx === pointer ? 'comparing' : idx === pointer2 ? 'comparing' : 'none' as const,
    }))

    return {
      type: 'array',
      nodes,
      pointer,
      pointer2,
      message: `${name}: [${values.join(', ')}]`,
    }
  }

  // String variable
  const strEntries = Object.entries(vars)
    .filter(([k, v]) => !k.startsWith('__') && typeof v === 'string' && (v as string).length > 0)
  if (strEntries.length > 0) {
    const [name, str] = strEntries[0]
    const chars = (str as string).split('').slice(0, 20)
    return {
      type: 'string',
      nodes: chars.map((c, i) => ({ id: `c${i}`, value: c, highlight: 'none' as const })),
      message: `${name} = "${str}"`,
    }
  }

  // Map → hashmap
  const mapEntry = Object.entries(vars).find(([, v]) => v instanceof Map)
  if (mapEntry) {
    const [name, mapObj] = mapEntry
    const table: Record<string, unknown> = {}
    ;(mapObj as Map<unknown, unknown>).forEach((v, k) => { table[String(k)] = v })
    return {
      type: 'hashmap', nodes: [], hashTable: table,
      message: `${name}: ${(mapObj as Map<unknown, unknown>).size} entries`,
    }
  }

  // Plain object with numeric values → hashmap
  const objEntry = Object.entries(vars).find(([k, v]) =>
    !k.startsWith('__') && typeof v === 'object' && v !== null && !Array.isArray(v) &&
    !(v instanceof Map) && !(v instanceof Set) &&
    Object.values(v as object).some(val => typeof val === 'number')
  )
  if (objEntry) {
    const [name, obj] = objEntry
    const table: Record<string, unknown> = {}
    Object.entries(obj as Record<string, unknown>)
      .filter(([, v]) => typeof v === 'number')
      .slice(0, 20)
      .forEach(([k, v]) => { table[k] = v })
    return {
      type: 'hashmap', nodes: [], hashTable: table,
      message: `${name}: ${Object.keys(table).length} entries`,
    }
  }

  return undefined
}
