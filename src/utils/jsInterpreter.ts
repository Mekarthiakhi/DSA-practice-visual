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

import { ExecutionStep, Variable, StackFrame, DSAState, DSANode, DSAEdge } from '../store/ideStore'

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

function collectFunctionNames(code: string): Set<string> {
  const names = new Set<string>()
  for (const m of code.matchAll(/function\s+([a-zA-Z0-9_$]+)/g)) {
    names.add(m[1])
  }
  for (const m of code.matchAll(/(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:function|\([^)]*\)\s*=>)/g)) {
    names.add(m[1])
  }
  for (const m of code.matchAll(/([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*\{/g)) {
    if (!['if', 'for', 'while', 'switch', 'catch', 'function'].includes(m[1])) {
      names.add(m[1])
    }
  }
  return names;
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

function buildCaptureExpr(names: Set<string>): string {
  if (names.size === 0) return 'void 0'
  const parts = [...names].map(n => `__v__.${n}=(() => { try { return ${n}; } catch { return __v__.${n}; } })()`)
  return `(${parts.join(',')})`
}

// ─── Tokenizer & Recursive Bracer ─────────────────────────────────────────────

function tokenize(code: string): { type: string; value: string; line: number }[] {
  const tokens: { type: string; value: string; line: number }[] = []
  let i = 0
  let line = 1
  const len = code.length

  while (i < len) {
    const char = code[i]

    if (char === '\n') {
      tokens.push({ type: 'whitespace', value: '\n', line })
      line++
      i++
      continue
    }

    if (/\s/.test(char)) {
      let val = ''
      while (i < len && /\s/.test(code[i]) && code[i] !== '\n') {
        val += code[i]
        i++
      }
      tokens.push({ type: 'whitespace', value: val, line })
      continue
    }

    if (char === '/' && code[i + 1] === '/') {
      let val = ''
      while (i < len && code[i] !== '\n') {
        val += code[i]
        i++
      }
      tokens.push({ type: 'comment', value: val, line })
      continue
    }

    if (char === '/' && code[i + 1] === '*') {
      let val = ''
      const startLine = line
      while (i < len) {
        val += code[i]
        if (code[i] === '\n') line++
        if (code[i] === '*' && code[i + 1] === '/') {
          val += '/'
          i += 2
          break
        }
        i++
      }
      tokens.push({ type: 'comment', value: val, line: startLine })
      continue
    }

    if (char === '"' || char === "'" || char === '`') {
      const quote = char
      let val = quote
      i++
      while (i < len) {
        const c = code[i]
        val += c
        if (c === '\n') line++
        if (c === quote && code[i - 1] !== '\\') {
          i++
          break
        }
        i++
      }
      tokens.push({ type: 'string', value: val, line })
      continue
    }

    if (char === '/') {
      let lastToken = tokens[tokens.length - 1]
      let j = tokens.length - 1
      while (j >= 0 && tokens[j].type === 'whitespace') {
        lastToken = tokens[--j]
      }
      const isRegexPredecessor = !lastToken || 
        ['punctuator', 'operator', 'keyword'].includes(lastToken.type) ||
        (lastToken.type === 'identifier' && ['return', 'throw'].includes(lastToken.value))
      
      if (isRegexPredecessor) {
        let val = '/'
        i++
        while (i < len) {
          const c = code[i]
          val += c
          if (c === '\n') line++
          if (c === '/' && code[i - 1] !== '\\') {
            i++
            while (i < len && /[a-z]/i.test(code[i])) {
              val += code[i]
              i++
            }
            break
          }
          i++
        }
        tokens.push({ type: 'string', value: val, line })
        continue
      }
    }

    if (/\d/.test(char) || (char === '.' && /\d/.test(code[i + 1] || ''))) {
      let val = ''
      while (i < len && /[\d.a-zA-Z]/.test(code[i])) {
        val += code[i]
        i++
      }
      tokens.push({ type: 'number', value: val, line })
      continue
    }

    if (/[a-zA-Z_$]/.test(char)) {
      let val = ''
      while (i < len && /[\w$]/.test(code[i])) {
        val += code[i]
        i++
      }
      const isKwd = ['if', 'else', 'for', 'while', 'do', 'function', 'class', 'return', 'let', 'const', 'var', 'break', 'continue', 'throw', 'try', 'catch', 'finally'].includes(val)
      tokens.push({ type: isKwd ? 'keyword' : 'identifier', value: val, line })
      continue
    }

    const punctuators = ['{', '}', '(', ')', '[', ']', ';', ',', '.', '?', ':', '===', '==', '=', '!==', '!=', '!', '+=', '-=', '*=', '/=', '++', '--', '+', '-', '*', '%', '&&', '||', '&', '|', '^', '<<', '>>', '>>>', '=>', '<=', '>=', '<', '>']
    let matchedPunc = ''
    for (const p of punctuators) {
      if (code.startsWith(p, i)) {
        matchedPunc = p
        break
      }
    }
    if (matchedPunc) {
      tokens.push({ type: 'punctuator', value: matchedPunc, line })
      i += matchedPunc.length
      continue
    }

    tokens.push({ type: 'other', value: char, line })
    i++
  }

  return tokens
}

function ensureBracesOnce(code: string): string {
  const tokens = tokenize(code)
  const out: string[] = []
  let i = 0
  const len = tokens.length

  function skipWhitespace(idx: number): number {
    while (idx < len && (tokens[idx].type === 'whitespace' || tokens[idx].type === 'comment')) {
      idx++
    }
    return idx
  }

  while (i < len) {
    const tok = tokens[i]

    if (tok.type === 'keyword' && ['if', 'for', 'while'].includes(tok.value)) {
      out.push(tok.value)
      i++
      
      let j = skipWhitespace(i)
      if (j < len && tokens[j].value === '(') {
        for (let k = i; k <= j; k++) out.push(tokens[k].value)
        i = j + 1
        
        let parenDepth = 1
        while (i < len && parenDepth > 0) {
          const t = tokens[i]
          if (t.value === '(') parenDepth++
          if (t.value === ')') parenDepth--
          out.push(t.value)
          i++
        }
        
        let nextNonSpace = skipWhitespace(i)
        if (nextNonSpace < len) {
          if (tokens[nextNonSpace].value !== '{') {
            for (let k = i; k < nextNonSpace; k++) out.push(tokens[k].value)
            out.push('{ ')
            
            let scan = nextNonSpace
            let bracketDepth = 0
            let innerParenDepth = 0
            let braceDepth = 0
            
            while (scan < len) {
              const t = tokens[scan]
              
              if (t.value === '(') innerParenDepth++
              if (t.value === ')') innerParenDepth--
              if (t.value === '[') bracketDepth++
              if (t.value === ']') bracketDepth--
              if (t.value === '{') braceDepth++
              if (t.value === '}') braceDepth--
              
              out.push(t.value)
              scan++
              
              if (innerParenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
                if (t.value === ';') break
                if (scan < len && tokens[scan].value === '\n') break
                let nextNext = skipWhitespace(scan)
                if (nextNext < len && tokens[nextNext].type === 'keyword' && ['else', 'return', 'break', 'continue'].includes(tokens[nextNext].value)) {
                  break
                }
              }
            }
            out.push(' }')
            i = scan
          }
        }
      }
      continue
    }

    if (tok.type === 'keyword' && tok.value === 'else') {
      out.push('else')
      i++
      
      let nextNonSpace = skipWhitespace(i)
      if (nextNonSpace < len) {
        if (tokens[nextNonSpace].type === 'keyword' && tokens[nextNonSpace].value === 'if') {
          continue
        }
        
        if (tokens[nextNonSpace].value !== '{') {
          for (let k = i; k < nextNonSpace; k++) out.push(tokens[k].value)
          out.push('{ ')
          
          let scan = nextNonSpace
          let bracketDepth = 0
          let innerParenDepth = 0
          let braceDepth = 0
          
          while (scan < len) {
            const t = tokens[scan]
            
            if (t.value === '(') innerParenDepth++
            if (t.value === ')') innerParenDepth--
            if (t.value === '[') bracketDepth++
            if (t.value === ']') bracketDepth--
            if (t.value === '{') braceDepth++
            if (t.value === '}') braceDepth--
            
            out.push(t.value)
            scan++
            
            if (innerParenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
              if (t.value === ';') break
              if (scan < len && tokens[scan].value === '\n') break
              let nextNext = skipWhitespace(scan)
              if (nextNext < len && tokens[nextNext].type === 'keyword' && ['else', 'return', 'break', 'continue'].includes(tokens[nextNext].value)) {
                break
              }
            }
          }
          out.push(' }')
          i = scan
        }
      }
      continue
    }

    out.push(tok.value)
    i++
  }

  return out.join('')
}

function ensureBraces(code: string): string {
  try {
    let prev = code
    let safety = 0
    while (safety++ < 10) {
      const braced = ensureBracesOnce(prev)
      if (braced === prev) return braced
      prev = braced
    }
    return prev
  } catch (e) {
    console.error('ensureBraces failed, falling back to original code:', e)
    return code
  }
}

// ─── Instrument source code ───────────────────────────────────────────────────

function findMatchingParen(str: string, startIdx: number): number {
  if (startIdx === -1) return -1
  let depth = 0
  for (let i = startIdx; i < str.length; i++) {
    if (str[i] === '(') depth++
    if (str[i] === ')') {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

function instrumentCode(code: string, names: Set<string>): string {
  const bracedCode = ensureBraces(code)
  const lines = bracedCode.split('\n')
  const out: string[] = []
  let inMLComment = false
  
  const captureExpr = buildCaptureExpr(names)

  let braceDepth = 0
  let parenDepth = 0
  let bracketDepth = 0
  let classDepths: number[] = []

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const trimmed = raw.trim()
    const ln = i + 1

    if (trimmed.startsWith('/*')) inMLComment = true
    if (inMLComment) {
      out.push(raw)
      if (trimmed.includes('*/')) inMLComment = false
      continue
    }

    if (!trimmed || trimmed.startsWith('//')) {
      out.push(raw)
      continue
    }

    let opens = 0
    let closes = 0
    let parenOpens = 0
    let parenCloses = 0
    let bracketOpens = 0
    let bracketCloses = 0
    
    let inString = false
    let stringChar = ''
    for (let charIdx = 0; charIdx < trimmed.length; charIdx++) {
      const char = trimmed[charIdx]
      if ((char === '"' || char === "'" || char === '`') && trimmed[charIdx - 1] !== '\\') {
        if (!inString) {
          inString = true
          stringChar = char
        } else if (stringChar === char) {
          inString = false
        }
      }
      if (!inString) {
        if (char === '{') opens++
        if (char === '}') closes++
        if (char === '(') parenOpens++
        if (char === ')') parenCloses++
        if (char === '[') bracketOpens++
        if (char === ']') bracketCloses++
      }
    }

    const startsWithClose = trimmed.startsWith('}')
    if (startsWithClose) {
      braceDepth -= closes
    }

    const inClassBody = classDepths.length > 0 && braceDepth === classDepths[classDepths.length - 1]

    const isClassDecl = trimmed.startsWith('class ')
    if (isClassDecl) {
      classDepths.push(braceDepth + 1)
    }

    const inExpressionContinuation = parenDepth > 0 || bracketDepth > 0

    if (inExpressionContinuation) {
      out.push(raw)
    } else if (isClassDecl) {
      out.push(raw)
    } else if (inClassBody && !startsWithClose && !trimmed.endsWith('{')) {
      out.push(raw)
    } else if (trimmed.startsWith('if') || trimmed.startsWith('} if') || trimmed.startsWith('else if') || trimmed.startsWith('} else if')) {
      const condStart = raw.indexOf('(')
      const condEnd = findMatchingParen(raw, condStart)
      if (condStart !== -1 && condEnd !== -1) {
        const prefix = raw.substring(0, condStart + 1)
        const cond = raw.substring(condStart + 1, condEnd)
        const suffix = raw.substring(condEnd)
        out.push(`${prefix}(${captureExpr}, __trace__(${ln}), ${cond})${suffix}`)
      } else {
        out.push(raw)
      }
    } else if (trimmed.startsWith('while') || trimmed.startsWith('} while')) {
      const condStart = raw.indexOf('(')
      const condEnd = findMatchingParen(raw, condStart)
      if (condStart !== -1 && condEnd !== -1) {
        const prefix = raw.substring(0, condStart + 1)
        const cond = raw.substring(condStart + 1, condEnd)
        const suffix = raw.substring(condEnd)
        out.push(`${prefix}(${captureExpr}, __trace__(${ln}), ${cond})${suffix}`)
      } else {
        out.push(raw)
      }
    } else if (trimmed.startsWith('for') || trimmed.startsWith('} for')) {
      const condStart = raw.indexOf('(')
      const condEnd = findMatchingParen(raw, condStart)
      if (condStart !== -1 && condEnd !== -1) {
        const prefix = raw.substring(0, condStart + 1)
        const inner = raw.substring(condStart + 1, condEnd)
        const suffix = raw.substring(condEnd)
        const parts = inner.split(';')
        if (parts.length === 3) {
          const init = parts[0]
          const cond = parts[1].trim() || 'true'
          const next = parts[2]
          out.push(`${prefix}${init}; (${captureExpr}, __trace__(${ln}), ${cond}); ${next}${suffix}`)
        } else {
          out.push(raw)
        }
      } else {
        out.push(raw)
      }
    } else if (trimmed.startsWith('else') || trimmed.startsWith('} else')) {
      const braceIdx = raw.lastIndexOf('{')
      if (braceIdx !== -1) {
        out.push(`${raw.substring(0, braceIdx + 1)} ${captureExpr}; __trace__(${ln}); ${raw.substring(braceIdx + 1)}`)
      } else {
        out.push(raw)
      }
    } else if (trimmed.endsWith('{') && !trimmed.startsWith('}')) {
      const braceIdx = raw.lastIndexOf('{')
      out.push(`${raw.substring(0, braceIdx + 1)} ${captureExpr}; __trace__(${ln}); ${raw.substring(braceIdx + 1)}`)
    } else if (trimmed.startsWith('return') || trimmed.startsWith('throw') || trimmed.startsWith('break') || trimmed.startsWith('continue')) {
      out.push(`${captureExpr}; __trace__(${ln}); ${raw}`)
    } else if (trimmed === '}' || trimmed.startsWith('}')) {
      out.push(raw)
    } else {
      out.push(`${captureExpr}; __trace__(${ln}); ${raw}`)
    }

    if (!startsWithClose) {
      braceDepth += opens
      braceDepth -= closes
    } else {
      braceDepth += opens
    }
    parenDepth += parenOpens - parenCloses
    bracketDepth += bracketOpens - bracketCloses

    if (classDepths.length > 0 && braceDepth < classDepths[classDepths.length - 1]) {
      classDepths.pop()
    }
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
  const instrumentedCode = instrumentCode(code, varNames)

  // Execution state
  let stepCount = 0
  const MAX_STEPS = 3000
  const functionNames = collectFunctionNames(code)

  function getCallStack(): string[] {
    const stack = new Error().stack || ''
    const frames: string[] = []
    const lines = stack.split('\n')
    for (const l of lines) {
      const trimmed = l.trim()
      if (!trimmed) continue
      
      const v8Match = trimmed.match(/^at\s+([a-zA-Z0-9_$.]+)/)
      if (v8Match) {
        const fullName = v8Match[1]
        const parts = fullName.split('.')
        const hasMatch = parts.some(p => functionNames.has(p))
        if (hasMatch) {
          frames.push(parts[parts.length - 1])
        }
        continue
      }
      
      const ffMatch = trimmed.match(/^([a-zA-Z0-9_$]+)@/)
      if (ffMatch) {
        const name = ffMatch[1]
        if (functionNames.has(name)) {
          frames.push(name)
        }
      }
    }
    return ['main', ...frames.reverse()]
  }

  function __trace__(line: number) {
    if (stepCount++ > MAX_STEPS) throw new Error('__MAX_STEPS__')
    
    const callStack = getCallStack()

    // Deep clone each captured variable to avoid reference mutations
    const varsCopy: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(__v__)) {
      varsCopy[k] = deepClone(v)
    }

    events.push({
      type: 'line',
      line,
      vars: varsCopy,
      callStack,
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

      events.push({ type: 'output', line: 0, vars: varsCopy, callStack: getCallStack(), output: str })
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

  // Backfill dsaState for early steps that don't have one
  const firstWithDSA = steps.find(s => s.dsaState && s.dsaState.nodes && s.dsaState.nodes.length > 0)
  if (firstWithDSA && firstWithDSA.dsaState) {
    const defaultDSA = { 
      ...firstWithDSA.dsaState, 
      nodes: firstWithDSA.dsaState.nodes.map(n => ({ ...n, highlight: 'none' as const })),
      pointer: undefined,
      pointer2: undefined,
      message: 'Initializing...'
    }
    for (let i = 0; i < steps.length; i++) {
      if (!steps[i].dsaState) {
        steps[i].dsaState = { ...defaultDSA }
      }
    }
  }

  return steps
}

// ─── Substitution & Evaluation helpers ────────────────────────────────────────

function substituteVars(expr: string, vars: Record<string, unknown>): string {
  let result = expr.trim()
  
  // Clean up braces, semi-colons
  result = result.replace(/;\s*$/, '').replace(/^if\s*\(/, '').replace(/\)\s*\{?$/, '')

  // 1. Replace array accesses like arr[j + 1] or nums[i]
  const arrayAccessRegex = /(\b[a-zA-Z_$][\w$]*)\s*\[([^\]]+)\]/g
  let match
  let safetyCounter = 0
  while (safetyCounter++ < 20 && (match = arrayAccessRegex.exec(result)) !== null) {
    const fullMatch = match[0]
    const arrName = match[1]
    const indexExpr = match[2].trim()
    
    const arrVal = vars[arrName]
    if (Array.isArray(arrVal)) {
      let indexVal: number | null = null
      if (/^\d+$/.test(indexExpr)) {
        indexVal = parseInt(indexExpr)
      } else if (vars[indexExpr] !== undefined && typeof vars[indexExpr] === 'number') {
        indexVal = vars[indexExpr] as number
      } else {
        // Simple index expression like j + 1 or i - 1
        const simpleArith = indexExpr.match(/^(\w+)\s*([+-])\s*(\d+)$/)
        if (simpleArith) {
          const varName = simpleArith[1]
          const op = simpleArith[2]
          const val = parseInt(simpleArith[3])
          if (vars[varName] !== undefined && typeof vars[varName] === 'number') {
            const base = vars[varName] as number
            indexVal = op === '+' ? base + val : base - val
          }
        }
      }
      
      if (indexVal !== null && indexVal >= 0 && indexVal < arrVal.length) {
        const val = arrVal[indexVal]
        result = result.replace(fullMatch, String(val))
        arrayAccessRegex.lastIndex = 0
      }
    }
  }

  // 2. Replace map/set has/get checks
  const methodCallRegex = /(\b[a-zA-Z_$][\w$]*)\s*\.(has|get)\(([^)]+)\)/g
  safetyCounter = 0
  while (safetyCounter++ < 20 && (match = methodCallRegex.exec(result)) !== null) {
    const fullMatch = match[0]
    const objName = match[1]
    const method = match[2]
    const argExpr = match[3].trim()
    
    const objVal = vars[objName]
    const argVal = vars[argExpr] !== undefined ? vars[argExpr] : argExpr
    
    let evalVal = 'false'
    if (objVal instanceof Map) {
      if (method === 'has') {
        evalVal = String(objVal.has(Number(argVal)) || objVal.has(argVal))
      } else {
        evalVal = String(objVal.get(Number(argVal)) ?? objVal.get(argVal) ?? 'undefined')
      }
    } else if (objVal instanceof Set) {
      if (method === 'has') {
        evalVal = String(objVal.has(Number(argVal)) || objVal.has(argVal))
      }
    } else if (objVal && typeof objVal === 'object') {
      if (method === 'has') {
        evalVal = String(String(argVal) in objVal)
      } else {
        evalVal = String((objVal as Record<string, unknown>)[String(argVal)] ?? 'undefined')
      }
    }
    
    result = result.replace(fullMatch, evalVal)
    methodCallRegex.lastIndex = 0
  }
  
  // 3. Replace plain variables
  const wordRegex = /\b([a-zA-Z_$][\w$]*)\b/g
  const wordsToReplace: Array<{ word: string; valStr: string }> = []
  while ((match = wordRegex.exec(result)) !== null) {
    const word = match[1]
    if (vars[word] !== undefined && typeof vars[word] !== 'object' && typeof vars[word] !== 'function') {
      wordsToReplace.push({ word, valStr: String(vars[word]) })
    }
  }
  wordsToReplace.sort((a, b) => b.word.length - a.word.length)
  const replacedWords = new Set<string>()
  for (const { word, valStr } of wordsToReplace) {
    if (replacedWords.has(word)) continue
    replacedWords.add(word)
    const regex = new RegExp(`\\b${word}\\b`, 'g')
    result = result.replace(regex, valStr)
  }
  
  return result
}

function tryEvaluateBoolean(substituted: string): boolean | null {
  try {
    if (/^-?\d+(?:\s*[-+*/%]\s*-?\d+)*\s*(?:==|===|!=|!==|>|>=|<|<=)\s*-?\d+(?:\s*[-+*/%]\s*-?\d+)*$/.test(substituted.trim())) {
      // eslint-disable-next-line no-eval
      return !!eval(substituted)
    }
  } catch {
    // ignore
  }
  return null
}

// ─── Description builder ──────────────────────────────────────────────────────

function buildDesc(lineCode: string, vars: Record<string, unknown>): string {
  if (!lineCode) return 'Executing...'

  const trimmed = lineCode.trim()

  // 1. Assignment
  const assignMatch = trimmed.match(/(?:let|const|var)?\s*(\w+)\s*([+\-*/%]?=)\s*(.+)/)
  if (assignMatch) {
    const name = assignMatch[1]
    const op = assignMatch[2]
    const rhs = assignMatch[3].replace(/;$/, '').trim()
    
    if (vars[name] !== undefined) {
      const valStr = JSON.stringify(safeSerialize(vars[name]))?.substring(0, 40) ?? '?'
      if (op === '=') {
        const subRHS = substituteVars(rhs, vars)
        if (subRHS !== rhs && subRHS !== valStr) {
          return `${name} = ${rhs}  →  ${subRHS} = ${valStr}`
        }
      }
      return `${name} = ${valStr}`
    }
  }

  // 2. If condition
  if (/^if\s*\(/.test(trimmed)) {
    const condMatch = trimmed.match(/^if\s*\((.+)\)/)
    if (condMatch) {
      const cond = condMatch[1]
      const sub = substituteVars(cond, vars)
      const evalResult = tryEvaluateBoolean(sub)
      return `Check: ${cond}  →  ${sub}${evalResult !== null ? ` (${evalResult ? 'true' : 'false'})` : ''}`
    }
  }

  // 3. For/While condition
  if (/^(for|while)\s*\(/.test(trimmed)) {
    const condMatch = trimmed.match(/^(?:for|while)\s*\((.+)\)/)
    if (condMatch) {
      const inner = condMatch[1]
      const parts = inner.split(';')
      const cond = parts.length === 3 ? parts[1].trim() : inner
      const sub = substituteVars(cond, vars)
      const evalResult = tryEvaluateBoolean(sub)
      return `Loop condition: ${cond}  →  ${sub}${evalResult !== null ? ` (${evalResult ? 'true' : 'false'})` : ''}`
    }
  }

  // 4. Return statement
  if (/^return\b/.test(trimmed)) {
    const expr = trimmed.replace(/^return\s*/, '').replace(/;$/, '').trim()
    if (expr) {
      const sub = substituteVars(expr, vars)
      return `Return: ${sub}`
    }
    return 'Return'
  }

  // 5. Console log
  const logMatch = trimmed.match(/console\.log\((.+)\)/)
  if (logMatch) {
    const expr = logMatch[1]
    const sub = substituteVars(expr, vars)
    return `print: ${sub}`
  }

  return trimmed.substring(0, 60)
}

// ─── Detect data structure type ───────────────────────────────────────────────

function detectDataType(code: string, vars: Record<string, unknown>): InterpreterResult['detectedType'] {
  const lower = code.toLowerCase()
  
  const hasGraphNode = Object.values(vars).some(v => 
    v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Map) && !(v instanceof Set) &&
    Object.values(v).every(val => Array.isArray(val) && val.every(item => typeof item === 'string' || typeof item === 'number'))
  )
  if (hasGraphNode || lower.includes('graph') || lower.includes('adjacency')) return 'graph'

  const hasTreeNode = Object.values(vars).some(v => 
    v && typeof v === 'object' && ('left' in v || 'right' in v)
  )
  if (hasTreeNode || lower.includes('.left') || lower.includes('.right') || lower.includes('bst')) return 'tree'

  const hasLLNode = Object.values(vars).some(v => 
    v && typeof v === 'object' && 'next' in v
  )
  if (hasLLNode || lower.includes('.next') || lower.includes('linkedlist')) return 'linkedlist'

  if (Object.keys(vars).some(k => k.toLowerCase().includes('stack')) || (lower.includes('push') && lower.includes('pop') && !lower.includes('array.'))) return 'stack'
  if (Object.keys(vars).some(k => k.toLowerCase().includes('queue')) || lower.includes('enqueue') || lower.includes('dequeue')) return 'queue'

  if (Object.values(vars).some(v => v instanceof Map) || lower.includes('hashmap') || lower.includes('hash map')) return 'hashmap'

  const numArrays = Object.values(vars).filter(v => Array.isArray(v) && (v as unknown[]).length > 1 && typeof (v as unknown[])[0] === 'number')
  if (numArrays.length > 0) return 'array'

  const strs = Object.values(vars).filter(v => typeof v === 'string' && (v as string).length > 1)
  if (strs.length > 0 && (lower.includes('reverse') || lower.includes('palindrome') || lower.includes('char'))) return 'string'

  return 'generic'
}

// ─── DSA state builder ────────────────────────────────────────────────────────

function detectHashTableInfo(vars: Record<string, unknown>, excludeName: string): { table: Record<string, unknown>; name: string; label: string } | undefined {
  const mapEntry = Object.entries(vars).find(([k, v]) => !k.startsWith('__') && v instanceof Map)
  if (mapEntry) {
    const [name, mapObj] = mapEntry
    const table: Record<string, unknown> = {}
    ;(mapObj as Map<unknown, unknown>).forEach((v, k) => { table[String(k)] = v })
    // If keys are numbers (common in twoSum), label is "value → index"
    const keysAreNumbers = Array.from((mapObj as Map<unknown, unknown>).keys()).every(k => typeof k === 'number' || !isNaN(Number(k)))
    const label = keysAreNumbers ? 'value → index' : 'key → value'
    return { table, name, label }
  }

  const setEntry = Object.entries(vars).find(([k, v]) => !k.startsWith('__') && v instanceof Set)
  if (setEntry) {
    const [name, setObj] = setEntry
    const table: Record<string, unknown> = {}
    ;(setObj as Set<unknown>).forEach((v) => { table[String(v)] = '✓' })
    return { table, name, label: 'presence' }
  }

  const objEntry = Object.entries(vars).find(([k, v]) =>
    !k.startsWith('__') && k !== excludeName && k !== 'variables' && typeof v === 'object' && v !== null && !Array.isArray(v) &&
    !(v instanceof Map) && !(v instanceof Set) &&
    Object.values(v as object).some(val => typeof val === 'number' || typeof val === 'string' || typeof val === 'boolean')
  )
  if (objEntry) {
    const [name, obj] = objEntry
    const table: Record<string, unknown> = {}
    Object.entries(obj as Record<string, unknown>)
      .filter(([, v]) => typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean')
      .slice(0, 20)
      .forEach(([k, v]) => { table[k] = v })
    const keysAreNumbers = Object.keys(table).every(k => !isNaN(Number(k)))
    const label = keysAreNumbers ? 'value → index' : 'key → value'
    return { table, name, label }
  }
  return undefined
}

function buildDSAState(vars: Record<string, unknown>, preferredName?: string, lineCode = ''): DSAState | undefined {

  // 1. STACK DETECTOR
  const stackVar = Object.entries(vars).find(([k, v]) => k.toLowerCase().includes('stack') && Array.isArray(v))
  if (stackVar) {
    const [name, arr] = stackVar
    const items = arr as (string | number)[]
    return {
      type: 'stack',
      stackItems: [...items],
      nodes: items.map((v, i) => ({
        id: `s${i}`,
        value: String(v),
        highlight: i === items.length - 1 ? 'active' : 'visited'
      })),
      message: `${name}: [${items.join(', ')}]`
    }
  }

  // 2. QUEUE DETECTOR
  const queueVar = Object.entries(vars).find(([k, v]) => k.toLowerCase().includes('queue') && Array.isArray(v))
  if (queueVar) {
    const [name, arr] = queueVar
    const items = arr as (string | number)[]
    return {
      type: 'queue',
      queueItems: [...items],
      nodes: items.map((v, i) => ({
        id: `q${i}`,
        value: String(v),
        highlight: i === 0 ? 'active' : i === items.length - 1 ? 'comparing' : 'visited'
      })),
      message: `${name}: [${items.join(', ')}]`
    }
  }

  // 3. TREE / BST DETECTOR
  const findTreeRoot = (vrs: Record<string, unknown>) => {
    const candidates = Object.entries(vrs).filter(([, v]) => 
      v && typeof v === 'object' && ('left' in v || 'right' in v)
    )
    if (candidates.length === 0) return null
    const preferred = candidates.find(([k]) => k === 'root' || k === 'tree' || k === 'bst')
    return preferred ? preferred[1] : candidates[0][1]
  }
  const root = findTreeRoot(vars)
  if (root) {
    const nodes: DSANode[] = []
    const edges: DSAEdge[] = []
    
    interface QueueItem {
      node: any
      x: number
      y: number
      spread: number
      parentId?: string
    }
    const q: QueueItem[] = [{ node: root, x: 350, y: 60, spread: 160 }]
    let idCounter = 0
    const visited = new Set<unknown>()

    while (q.length > 0) {
      const { node, x, y, spread, parentId } = q.shift()!
      if (!node || visited.has(node)) continue
      visited.add(node)

      const id = `t-${idCounter++}`
      const val = node.val !== undefined ? node.val : node.value
      
      let highlight: DSANode['highlight'] = 'none'
      if (vars['curr'] && (vars['curr'] as any).val === val) highlight = 'active'
      else if (vars['node'] && (vars['node'] as any).val === val) highlight = 'active'

      nodes.push({
        id,
        value: val !== undefined ? String(val) : 'T',
        x,
        y,
        highlight
      })

      if (parentId) {
        edges.push({
          id: `e-${parentId}-${id}`,
          from: parentId,
          to: id,
          directed: true
        })
      }

      if (node.left) {
        q.push({
          node: node.left,
          x: x - spread,
          y: y + 80,
          spread: spread * 0.5,
          parentId: id
        })
      }
      if (node.right) {
        q.push({
          node: node.right,
          x: x + spread,
          y: y + 80,
          spread: spread * 0.5,
          parentId: id
        })
      }
    }

    return {
      type: 'tree',
      nodes,
      edges,
      message: `Binary Tree Layout (Nodes: ${nodes.length})`
    }
  }

  // 4. LINKED LIST DETECTOR
  const findLinkedListHead = (vrs: Record<string, unknown>) => {
    const candidates = Object.entries(vrs).filter(([, v]) => 
      v && typeof v === 'object' && 'next' in v
    )
    if (candidates.length === 0) return null
    const preferred = candidates.find(([k]) => ['head', 'list', 'curr', 'current', 'list1', 'list2', 'l1', 'l2', 'head1', 'head2'].includes(k))
    return preferred ? preferred[1] : candidates[0][1]
  }
  const head = findLinkedListHead(vars)
  if (head) {
    const nodes: DSANode[] = []
    const edges: DSAEdge[] = []
    const visited = new Set<unknown>()
    let curr: any = head
    let idx = 0
    
    const pointers: Record<string, string> = {}
    for (const [k, v] of Object.entries(vars)) {
      if (v && typeof v === 'object' && ('next' in v || 'value' in v || 'val' in v)) {
        const valStr = String((v as any).val !== undefined ? (v as any).val : (v as any).value)
        pointers[valStr] = k
      }
    }

    while (curr && !visited.has(curr)) {
      visited.add(curr)
      const val = curr.val !== undefined ? curr.val : curr.value
      const id = `ll-${idx}`
      
      let highlight: DSANode['highlight'] = 'none'
      const ptrName = pointers[String(val)]
      if (ptrName) {
        if (['curr', 'current', 'list1', 'list2', 'l1', 'l2'].includes(ptrName)) {
          highlight = 'active'
        } else if (['prev', 'p'].includes(ptrName)) {
          highlight = 'visited'
        } else if (['next', 'nextTemp', 'q', 'temp'].includes(ptrName)) {
          highlight = 'comparing'
        } else {
          highlight = 'processing'
        }
      }

      nodes.push({
        id,
        value: val !== undefined ? String(val) : `Node`,
        x: idx * 120 + 60,
        y: 120,
        highlight
      })

      if (idx > 0) {
        edges.push({
          id: `e-ll-${idx-1}-${idx}`,
          from: `ll-${idx-1}`,
          to: id,
          directed: true
        })
      }
      
      curr = curr.next
      idx++
    }
    
    return {
      type: 'linkedlist',
      nodes,
      edges,
      message: `Linked List Traversal (Length: ${nodes.length})`
    }
  }

  // 5. GRAPH DETECTOR
  const findGraph = (vrs: Record<string, unknown>) => {
    const candidates = Object.entries(vrs).filter(([, v]) => 
      v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Map) && !(v instanceof Set) &&
      Object.values(v).every(val => Array.isArray(val) && val.every(item => typeof item === 'string' || typeof item === 'number'))
    )
    if (candidates.length === 0) return null
    return candidates[0]
  }
  const graphEntry = findGraph(vars)
  if (graphEntry) {
    const [name, graphObj] = graphEntry
    const adjList = graphObj as Record<string, (string | number)[]>
    const nodeIds = Object.keys(adjList)
    const n = nodeIds.length
    
    const visitedVar = Object.values(vars).find(v => (v instanceof Set || Array.isArray(v)) && [...v].every(item => typeof item === 'string' || typeof item === 'number'))
    const visitedSet = visitedVar ? new Set([...visitedVar as any]) : new Set<string>()
    
    const queueVar = Object.entries(vars).find(([k, v]) => (k === 'queue' || k === 'stack') && Array.isArray(v))
    const queueItems = queueVar ? queueVar[1] as (string | number)[] : []

    const currentVar = Object.entries(vars).find(([k, v]) => (k === 'node' || k === 'curr' || k === 'current') && (typeof v === 'string' || typeof v === 'number'))
    const currentVal = currentVar ? String(currentVar[1]) : null

    const positions: Record<string, { x: number; y: number }> = {}
    nodeIds.forEach((id, i) => {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2
      positions[id] = { x: 220 + 160 * Math.cos(angle), y: 200 + 160 * Math.sin(angle) }
    })

    const nodes: DSANode[] = nodeIds.map(id => {
      let highlight: DSANode['highlight'] = 'none'
      if (id === currentVal) highlight = 'active'
      else if (visitedSet.has(id)) highlight = 'found'
      else if (queueItems.includes(id)) highlight = 'comparing'
      
      return {
        id,
        value: id,
        x: positions[id].x,
        y: positions[id].y,
        highlight
      }
    })

    const edges: DSAEdge[] = []
    const seenEdges = new Set<string>()
    for (const [from, neighbors] of Object.entries(adjList)) {
      for (const to of neighbors) {
        const key = [from, to].sort().join('-')
        if (!seenEdges.has(key)) {
          seenEdges.add(key)
          edges.push({
            id: `e-g-${from}-${to}`,
            from,
            to: String(to),
            directed: false
          })
        }
      }
    }

    return {
      type: 'graph',
      nodes,
      edges,
      message: `${name}: Graph Adjacency Layout`
    }
  }

  // 6. ARRAY DETECTOR
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

    // Range pointers
    let rangeStart: number | undefined
    let rangeEnd: number | undefined
    const startCandidates = ['left', 'l', 'low', 'start']
    const endCandidates = ['right', 'r', 'high', 'end']
    
    const foundStart = startCandidates.find(p => typeof vars[p] === 'number' && (vars[p] as number) >= 0 && (vars[p] as number) < values.length)
    if (foundStart !== undefined) {
      rangeStart = vars[foundStart] as number
    }
    const foundEnd = endCandidates.find(p => typeof vars[p] === 'number' && (vars[p] as number) >= 0 && (vars[p] as number) < values.length)
    if (foundEnd !== undefined) {
      rangeEnd = vars[foundEnd] as number
    }

    // Pivot Index detection
    let pivotIndex: number | undefined
    const pivotIdxCandidates = ['pivotIndex', 'pivotIdx', 'pi']
    const foundPivotIdx = pivotIdxCandidates.find(p => typeof vars[p] === 'number' && (vars[p] as number) >= 0 && (vars[p] as number) < values.length)
    if (foundPivotIdx !== undefined) {
      pivotIndex = vars[foundPivotIdx] as number
    } else if (typeof vars['high'] === 'number' && vars['high'] >= 0 && vars['high'] < values.length) {
      if (vars['pivot'] !== undefined || lineCode.includes('pivot')) {
        pivotIndex = vars['high'] as number
      }
    }

    // Active pointer-resolution (mid, i, j, etc.)
    const activeMid = ['mid', 'm'].find(p => typeof vars[p] === 'number' && (vars[p] as number) >= 0 && (vars[p] as number) < values.length)
    const activeI = typeof vars['i'] === 'number' && (vars['i'] as number) >= 0 && (vars['i'] as number) < values.length ? (vars['i'] as number) : undefined
    const activeJ = typeof vars['j'] === 'number' && (vars['j'] as number) >= 0 && (vars['j'] as number) < values.length ? (vars['j'] as number) : undefined

    let pointer: number | undefined
    let pointer2: number | undefined

    if (activeMid !== undefined) {
      pointer = vars[activeMid] as number
      if (activeI !== undefined) pointer2 = activeI
      else if (activeJ !== undefined) pointer2 = activeJ
    } else {
      if (activeI !== undefined && activeJ !== undefined) {
        pointer = activeI
        pointer2 = activeJ
      } else if (activeI !== undefined) {
        pointer = activeI
      } else if (activeJ !== undefined) {
        pointer = activeJ
      } else {
        if (rangeStart !== undefined) pointer = rangeStart
        if (rangeEnd !== undefined) pointer2 = rangeEnd
      }
    }

    if (pointer2 !== undefined && (pointer2 < 0 || pointer2 >= values.length)) {
      pointer2 = undefined
    }

    const nodes: DSANode[] = values.map((v, idx) => {
      let highlight: DSANode['highlight'] = 'none'
      if (idx === pivotIndex) {
        highlight = 'pivot'
      } else if (idx === pointer || idx === pointer2) {
        if (lineCode.includes('swap') || lineCode.includes('temp')) {
          highlight = 'swapping'
        } else {
          highlight = 'comparing'
        }
      } else if (rangeStart !== undefined && rangeEnd !== undefined && (idx < rangeStart || idx > rangeEnd)) {
        highlight = 'visited'
      }
      return {
        id: `n${idx}`,
        value: v,
        highlight,
      }
    })

    const hashInfo = detectHashTableInfo(vars, name)

    return {
      type: 'array',
      nodes,
      pointer,
      pointer2,
      rangeStart,
      rangeEnd,
      pivotIndex,
      message: `${name}: [${values.join(', ')}]`,
      hashTable: hashInfo?.table,
      arrayName: name,
      hashTableName: hashInfo?.name,
      hashTableLabel: hashInfo?.label
    }
  }

  // 7. STRING DETECTOR
  const strEntries = Object.entries(vars)
    .filter(([k, v]) => !k.startsWith('__') && typeof v === 'string' && (v as string).length > 0)
  if (strEntries.length > 0) {
    const [name, str] = strEntries[0]
    const chars = (str as string).split('').slice(0, 20)
    
    // Extract range start/end if present
    let rangeStart: number | undefined
    let rangeEnd: number | undefined
    const startCandidates = ['left', 'l', 'low', 'start']
    const endCandidates = ['right', 'r', 'high', 'end']
    
    const foundStart = startCandidates.find(p => typeof vars[p] === 'number' && (vars[p] as number) >= 0 && (vars[p] as number) < chars.length)
    if (foundStart !== undefined) {
      rangeStart = vars[foundStart] as number
    }
    const foundEnd = endCandidates.find(p => typeof vars[p] === 'number' && (vars[p] as number) >= 0 && (vars[p] as number) < chars.length)
    if (foundEnd !== undefined) {
      rangeEnd = vars[foundEnd] as number
    }

    const activeStrPointers = ['left', 'l', 'right', 'r', 'i', 'j'].filter(p => typeof vars[p] === 'number' && (vars[p] as number) >= 0 && (vars[p] as number) < chars.length)
    let pointer = activeStrPointers.length > 0 ? vars[activeStrPointers[0]] as number : undefined
    let pointer2 = activeStrPointers.length > 1 ? vars[activeStrPointers[1]] as number : undefined

    if (pointer === undefined && rangeStart !== undefined) pointer = rangeStart
    if (pointer2 === undefined && rangeEnd !== undefined) pointer2 = rangeEnd

    const hashInfo = detectHashTableInfo(vars, name)

    return {
      type: 'string',
      nodes: chars.map((c, i) => ({
        id: `c${i}`,
        value: c,
        highlight: i === pointer ? 'comparing' : i === pointer2 ? 'comparing' : 'none' as const
      })),
      pointer,
      pointer2,
      rangeStart,
      rangeEnd,
      message: `${name} = "${str}"`,
      hashTable: hashInfo?.table,
      arrayName: name,
      hashTableName: hashInfo?.name,
      hashTableLabel: hashInfo?.label
    }
  }

  // 8. HASHMAP DETECTOR
  const mapEntry = Object.entries(vars).find(([, v]) => v instanceof Map)
  if (mapEntry) {
    const [name, mapObj] = mapEntry
    const table: Record<string, unknown> = {}
    ;(mapObj as Map<unknown, unknown>).forEach((v, k) => { table[String(k)] = v })
    return {
      type: 'hashmap', nodes: [], hashTable: table,
      message: `${name}: ${(mapObj as Map<unknown, unknown>).size} entries`,
      hashTableName: name,
      hashTableLabel: 'key → value'
    }
  }

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
      hashTableName: name,
      hashTableLabel: 'key → value'
    }
  }

  return undefined
}
