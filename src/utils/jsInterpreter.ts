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

let _lastWindowStart: number | undefined
let _lastWindowEnd: number | undefined

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
  return `void (${parts.join(',')})`
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
          // Standard for(init; cond; increment) loop
          const init = parts[0]
          const cond = parts[1].trim() || 'true'
          const next = parts[2]
          out.push(`${prefix}${init}; (${captureExpr}, __trace__(${ln}), ${cond}); ${next}${suffix}`)
        } else if (inner.includes(' of ') || inner.includes(' in ')) {
          // for...of / for...in loop: instrument inside the opening brace
          const braceIdx = raw.lastIndexOf('{')
          if (braceIdx !== -1) {
            out.push(`${raw.substring(0, braceIdx + 1)} ${captureExpr}; __trace__(${ln});${raw.substring(braceIdx + 1)}`)
          } else {
            out.push(raw)
          }
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
                // During a destructuring swap [a[i], a[j]] = [a[j], a[i]], JS may create
                // an intermediate state where one value is duplicated:
                //   prev: [5, 2, 1, 8, 9]
                //   cur:  [5, 5, 1, 8, 9]  ← intermediate: a[1] was overwritten with a[0]
                //   next: [2, 5, 1, 8, 9]  ← final: swap complete
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
                  // Make sure cur is actually an intermediate state (has a duplicate value)
                  // and NOT the final swap state (curArr === nextArr)
                  if (curArr.join(',') !== nextArr.join(',')) {
                    // Patch: show prev state instead of intermediate to avoid visual glitch
                    cur.vars[activeArrayName] = [...prevArr]
                  }
                }
              }
            }
            
            // Also detect intermediate states when prev→cur shows a partial swap
            // (one index changed to create a duplicate, but full swap not yet complete)
            if (diffIndices.length === 0) {
              // prev and next are same — check if cur is an intermediate glitch
              const curDiffs: number[] = []
              for (let k = 0; k < curArr.length; k++) {
                if (curArr[k] !== prevArr[k]) curDiffs.push(k)
              }
              if (curDiffs.length > 0 && curDiffs.length <= 2) {
                // cur differs from both prev and next which are the same — patch it
                cur.vars[activeArrayName] = [...prevArr]
              }
            }
          }
        }
      }
    }
    
    // Also check current vs previous for 2-event swap sequences (no intermediate)
    // where two consecutive events on the same line show partial states
    if (filtered.length >= 1) {
      const prev = filtered[filtered.length - 1]
      if (cur.type === 'line' && prev.type === 'line' && cur.line === prev.line) {
        const prevArr = prev.vars[activeArrayName]
        const curArr = cur.vars[activeArrayName]
        if (Array.isArray(prevArr) && Array.isArray(curArr) && prevArr.length === curArr.length) {
          // Count differences
          const diffs: number[] = []
          for (let k = 0; k < prevArr.length; k++) {
            if (prevArr[k] !== curArr[k]) diffs.push(k)
          }
          // If only 1 position changed and it created a duplicate value, it's an intermediate
          if (diffs.length === 1) {
            const idx = diffs[0]
            const newVal = curArr[idx]
            // Check if this value now appears one extra time (duplicate)
            const prevCount = prevArr.filter((v: unknown) => v === newVal).length
            const curCount = curArr.filter((v: unknown) => v === newVal).length
            if (curCount > prevCount) {
              // This is a partial swap — patch to show prev state
              cur.vars[activeArrayName] = [...prevArr]
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
  _lastWindowStart = undefined
  _lastWindowEnd = undefined

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
  
  // Find all line event indices
  const lineEventIndices: number[] = []
  for (let idx = 0; idx < filteredEvents.length; idx++) {
    if (filteredEvents[idx].type === 'line') {
      lineEventIndices.push(idx)
    }
  }

  const steps: ExecutionStep[] = []
  let swaps = 0
  let comparisons = 0
  let prevArrState: number[] = []
  let prevPointers = ''

  for (let k = 0; k < lineEventIndices.length; k++) {
    const curIdx = lineEventIndices[k]
    const curEv = filteredEvents[curIdx]
    
    // Find next line event
    const nextIdx = k + 1 < lineEventIndices.length ? lineEventIndices[k + 1] : -1
    const nextEv = nextIdx !== -1 ? filteredEvents[nextIdx] : curEv
    
    // The variables, callstack, and scope for this step come from the next event (representing post-execution state of current line)
    const varsForStep = nextEv.vars
    const callStackForStep = nextEv.callStack
    const lineForStep = curEv.line
    
    // Collect all outputs between current line event and next line event
    const limitIdx = nextIdx !== -1 ? nextIdx : filteredEvents.length
    const outputs: string[] = []
    for (let oIdx = curIdx + 1; oIdx < limitIdx; oIdx++) {
      const oEv = filteredEvents[oIdx]
      if (oEv.type === 'output' && oEv.output) {
        outputs.push(oEv.output)
      }
    }

    const prevStep = steps[steps.length - 1]
    const prevVars = prevStep?.variables || []

    const currentVars: Variable[] = Object.entries(varsForStep)
      .filter(([name]) => !name.startsWith('__'))
      .map(([name, value]) => {
        const serialized = safeSerialize(value)
        const prev = prevVars.find(v => v.name === name)
        const changed = !prev || JSON.stringify(prev.value) !== JSON.stringify(serialized)
        return { name, value: serialized, type: typeOf(value), scope: callStackForStep[callStackForStep.length - 1] || 'main', changed }
      })

    const callStack: StackFrame[] = callStackForStep.map((name, idx) => ({
      id: `f${idx}`, name, line: lineForStep, variables: [], isActive: idx === callStackForStep.length - 1,
    }))

    const lineCode = codeLines[lineForStep - 1]?.trim() || ''
    const changedArray = currentVars.find(v => v.changed && v.type === 'Array' && Array.isArray(v.value) && (typeof v.value[0] === 'number' || typeof v.value[0] === 'string'))
    if (changedArray) activeArrayName = changedArray.name
    
    // Dynamically switch active array/string based on which one is accessed in the current line
    const accessedStructures = currentVars.filter(v => 
      (v.type === 'Array' && Array.isArray(v.value) && (typeof v.value[0] === 'number' || typeof v.value[0] === 'string')) || 
      (v.type === 'string' && typeof v.value === 'string' && v.value.length > 0)
    ).filter(v => new RegExp(`\\b${v.name}\\b`).test(lineCode))

    if (accessedStructures.length > 0) {
      activeArrayName = accessedStructures.reduce((best, cur) => {
        const bestLen = (best.value as any).length || 0;
        const curLen = (cur.value as any).length || 0;
        return curLen > bestLen ? cur : best;
      }).name;
    }

    if (!activeArrayName) {
      const fallback = currentVars.find(v => (v.name === 'arr' || v.name === 'nums' || v.name === 'array') && v.type === 'Array')
      if (fallback) activeArrayName = fallback.name
    }

    const dsaState = buildDSAState(varsForStep, activeArrayName, lineCode)
    const desc = buildDesc(lineCode, varsForStep)

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
      dsaState.auxiliaryData = dsaState.auxiliaryData || {}
      dsaState.auxiliaryData.isGeneric = true

      if (isSwap && prevArrState.length > 0) {
        // Find exactly which indices changed between previous and current array
        const changedIndices: number[] = []
        for (let ci = 0; ci < currentArr.length; ci++) {
          if (prevArrState[ci] !== undefined && currentArr[ci] !== prevArrState[ci]) {
            changedIndices.push(ci)
          }
        }
        
        // Only highlight exactly 2 indices for a proper swap
        // If we detect more than 2 (intermediate state leak), try to find the true swap pair
        let swapIndices: number[] = changedIndices
        
        if (changedIndices.length > 2) {
          // Find the pair where values are actually exchanged
          const swapPairs: number[][] = []
          for (let ci = 0; ci < changedIndices.length; ci++) {
            for (let cj = ci + 1; cj < changedIndices.length; cj++) {
              const a = changedIndices[ci]
              const b = changedIndices[cj]
              if (prevArrState[a] === currentArr[b] && prevArrState[b] === currentArr[a]) {
                swapPairs.push([a, b])
              }
            }
          }
          if (swapPairs.length > 0) {
            swapIndices = swapPairs[0]
          } else {
            // Fallback: just take the first 2
            swapIndices = changedIndices.slice(0, 2)
          }
        }
        
        dsaState.nodes.forEach((n, idx) => {
          if (swapIndices.includes(idx)) {
            n.highlight = 'swapping'
          }
        })
      }

      prevArrState = currentArr
      prevPointers = currentPointers
    }

    steps.push({
      line: lineForStep,
      description: desc,
      variables: currentVars,
      callStack,
      heap: [],
      output: outputs.join('\n'),
      dsaState,
    })
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

  const arrays = Object.values(vars).filter(v => Array.isArray(v) && (v as unknown[]).length > 1 && (typeof (v as unknown[])[0] === 'number' || typeof (v as unknown[])[0] === 'string'))
  if (arrays.length > 0) return 'array'

  const strs = Object.values(vars).filter(v => typeof v === 'string' && (v as string).length > 1)
  if (strs.length > 0 && (lower.includes('reverse') || lower.includes('palindrome') || lower.includes('char'))) return 'string'

  return 'generic'
}

// ─── DSA state builder ────────────────────────────────────────────────────────

function detectHashTableInfo(vars: Record<string, unknown>, excludeName: string, lineCode: string = ''): { table: Record<string, unknown>; name: string; label: string } | undefined {
  const mapEntries = Object.entries(vars).filter(([k, v]) => !k.startsWith('__') && v instanceof Map)
  if (mapEntries.length > 0) {
    const mapEntry = mapEntries.find(([k]) => new RegExp(`\\b${k}\\b`).test(lineCode)) || mapEntries[0]
    const [name, mapObj] = mapEntry
    const table: Record<string, unknown> = {}
    ;(mapObj as Map<unknown, unknown>).forEach((v, k) => { table[String(k)] = v })
    // If keys are numbers (common in twoSum), label is "value → index"
    const keysAreNumbers = Array.from((mapObj as Map<unknown, unknown>).keys()).every(k => typeof k === 'number' || !isNaN(Number(k)))
    const label = keysAreNumbers ? 'value → index' : 'key → value'
    return { table, name, label }
  }

  const setEntries = Object.entries(vars).filter(([k, v]) => !k.startsWith('__') && v instanceof Set)
  if (setEntries.length > 0) {
    const setEntry = setEntries.find(([k]) => new RegExp(`\\b${k}\\b`).test(lineCode)) || setEntries[0]
    const [name, setObj] = setEntry
    const table: Record<string, unknown> = {}
    ;(setObj as Set<unknown>).forEach((v) => { table[String(v)] = '✓' })
    return { table, name, label: 'presence' }
  }

  const objEntries = Object.entries(vars).filter(([k, v]) =>
    !k.startsWith('__') && k !== excludeName && k !== 'variables' && typeof v === 'object' && v !== null && !Array.isArray(v) &&
    !(v instanceof Map) && !(v instanceof Set)
  )
  if (objEntries.length > 0) {
    // Prefer objects accessed on the current line, otherwise fallback to any object with valid values
    const accessedObj = objEntries.find(([k]) => new RegExp(`\\b${k}\\b`).test(lineCode))
    const objEntry = accessedObj || objEntries.find(([, v]) => Object.values(v as object).some(val => typeof val === 'number' || typeof val === 'string' || typeof val === 'boolean'))
    
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
  }
  return undefined
}

function buildDSAState(vars: Record<string, unknown>, preferredName?: string, lineCode = ''): DSAState | undefined {

  // 1. STACK DETECTOR
  const stackVar = Object.entries(vars).find(([k, v]) => k.toLowerCase().includes('stack') && Array.isArray(v))
  const strEntriesForStack = Object.entries(vars).filter(([k, v]) => !k.startsWith('__') && typeof v === 'string' && (v as string).length > 0 && k !== 'type')
  const hasArrayForStack = Object.entries(vars).some(([k, v]) => !k.startsWith('__') && Array.isArray(v) && (v as unknown[]).length > 1 && (typeof (v as unknown[])[0] === 'number' || typeof (v as unknown[])[0] === 'string'))

  if (stackVar && strEntriesForStack.length === 0 && !hasArrayForStack) {
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
  const linkedListVars = Object.entries(vars).filter(([, v]) => 
    v && typeof v === 'object' && ('next' in v || 'val' in v || 'value' in v)
  )

  if (linkedListVars.length > 0) {
    const nodes: DSANode[] = []
    const edges: DSAEdge[] = []
    
    // Map node object references to the variable names that point to them
    const nodePointers = new Map<unknown, string[]>()
    for (const [k, v] of linkedListVars) {
      const existing = nodePointers.get(v) || []
      existing.push(k)
      nodePointers.set(v, existing)
    }

    // Determine the heads to start tracing from
    // Prioritize named lists, dummy nodes, or heads
    const preferredHeadNames = ['list1', 'list2', 'l1', 'l2', 'head1', 'head2', 'head', 'dummy', 'list']
    let startVars = linkedListVars.filter(([k]) => preferredHeadNames.includes(k))
    if (startVars.length === 0) startVars = linkedListVars

    const globalVisited = new Set<unknown>()
    let currentY = 80
    let listCount = 0

    for (const [varName, headNode] of startVars) {
      if (globalVisited.has(headNode)) continue // Already traced this node as part of another list

      let curr: any = headNode
      let idx = 0

      while (curr && !globalVisited.has(curr)) {
        globalVisited.add(curr)
        const val = curr.val !== undefined ? curr.val : curr.value
        const id = `ll-${listCount}-${idx}`
        
        let highlight: DSANode['highlight'] = 'none'
        const ptrNames = nodePointers.get(curr) || []
        
        // Determine highlighting based on variable names pointing to this node
        if (ptrNames.some(n => ['curr', 'current', 'list1', 'list2', 'l1', 'l2'].includes(n))) {
          highlight = 'active'
        } else if (ptrNames.some(n => ['prev', 'p'].includes(n))) {
          highlight = 'visited'
        } else if (ptrNames.some(n => ['next', 'nextTemp', 'q', 'temp'].includes(n))) {
          highlight = 'comparing'
        } else if (ptrNames.length > 0 && !ptrNames.includes(varName)) {
          // It has some other pointer pointing to it
          highlight = 'processing'
        }

        // Create a label showing which variables point to this node
        const label = ptrNames.join(', ')

        nodes.push({
          id,
          value: val !== undefined ? String(val) : `Node`,
          x: idx * 100 + 60,
          y: currentY,
          highlight,
          label: label || undefined
        })

        if (idx > 0) {
          edges.push({
            id: `e-ll-${listCount}-${idx-1}-${idx}`,
            from: `ll-${listCount}-${idx-1}`,
            to: id,
            directed: true
          })
        }
        
        curr = curr.next
        idx++
      }
      
      if (idx > 0) {
        currentY += 100 // Move down for the next list
        listCount++
      }
    }
    
    // If we have nodes, return the state
    if (nodes.length > 0) {
      return {
        type: 'linkedlist',
        nodes,
        edges,
        message: `Linked List Traversal (Lists: ${listCount}, Nodes: ${nodes.length})`
      }
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
    .filter(([k, v]) => !k.startsWith('__') && Array.isArray(v) && (v as unknown[]).length > 1 && (typeof (v as unknown[])[0] === 'number' || typeof (v as unknown[])[0] === 'string'))

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
    const values = (arr as (number|string)[]).slice(0, 24)

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

    // Dynamic pointer detection
    let pointer: number | undefined
    let pointer2: number | undefined

    const ignoredNumNames = new Set([
      'length', 'len', 'n', 'size', 'count', 'sum', 'total', 'max', 'min', 
      'target', 'diff', 'curr', 'current', 'temp', 'val', 'value', 'ans', 'res', 'result', 'pivot',
      'maxLength', 'maxLen', 'maxlength', 'zeroCount', 'zerocount', 'ones', 'zeros',
      'comparisons', 'swaps', 'shifts', 'k', 'windowLen', 'windowSize',
      'complement', 'profit', 'maxProfit', 'minPrice', 'currentSum', 'maxSum',
      'key', 'depth', 'level', 'step', 'steps', 'windowSum',
      'formed', 'required', 'minLen', 'start', 'minLength', 'minStart',
      'matches', 'maxMatches', 'maxmatches', 'best', 'bestWord', 'bestword',
      'maxVal', 'minVal', 'maxval', 'minval', 'score', 'bestScore'
    ]);

    const validIndices = Object.entries(vars)
      .filter(([k, v]) => !k.startsWith('__') && !ignoredNumNames.has(k.toLowerCase()) && typeof v === 'number' && (v as number) >= 0 && (v as number) <= values.length)
      .map(([k, v]) => ({ name: k, val: v as number }));

    // Priority naming list for pointers
    const pointerPriority = ['mid', 'm', 'left', 'l', 'right', 'r', 'i', 'j', 'p1', 'p2', 'idx', 'index'];
    
    validIndices.sort((a, b) => {
      const idxA = pointerPriority.indexOf(a.name.toLowerCase());
      const idxB = pointerPriority.indexOf(b.name.toLowerCase());
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });

    if (validIndices.length > 0) pointer = validIndices[0].val;
    if (validIndices.length > 1) pointer2 = validIndices[1].val;

    if (pointer === undefined && rangeStart !== undefined) pointer = rangeStart;
    if (pointer2 === undefined && rangeEnd !== undefined) pointer2 = rangeEnd;

    const pointerName = validIndices.length > 0 ? validIndices[0].name : foundStart || undefined
    const pointer2Name = validIndices.length > 1 ? validIndices[1].name : foundEnd || undefined

    // ── Array access parser (resolve arr[j], arr[j+1], arr[j-k], etc.) ──
    const accessedIndices = new Set<number>()
    const arrayAccessRegex = new RegExp(`\\b${name}\\s*\\[([^\\]]+)\\]`, 'g')
    let match;
    while ((match = arrayAccessRegex.exec(lineCode)) !== null) {
      const indexExpr = match[1].trim()
      let idx: number | null = null
      if (/^\d+$/.test(indexExpr)) {
        // Literal number: arr[0]
        idx = parseInt(indexExpr)
      } else if (vars[indexExpr] !== undefined && typeof vars[indexExpr] === 'number') {
        // Single variable: arr[j]
        idx = vars[indexExpr] as number
      } else {
        // Arithmetic: arr[j + 1] or arr[j - k]
        const arith = indexExpr.match(/^(\w+)\s*([+\-*])\s*(\w+)$/)
        if (arith) {
          const leftName = arith[1]
          const op = arith[2]
          const rightName = arith[3]
          // Resolve left operand
          let leftVal: number | null = null
          if (/^\d+$/.test(leftName)) leftVal = parseInt(leftName)
          else if (vars[leftName] !== undefined && typeof vars[leftName] === 'number') leftVal = vars[leftName] as number
          // Resolve right operand
          let rightVal: number | null = null
          if (/^\d+$/.test(rightName)) rightVal = parseInt(rightName)
          else if (vars[rightName] !== undefined && typeof vars[rightName] === 'number') rightVal = vars[rightName] as number

          if (leftVal !== null && rightVal !== null) {
            if (op === '+') idx = leftVal + rightVal
            else if (op === '-') idx = leftVal - rightVal
            else if (op === '*') idx = leftVal * rightVal
          }
        }
      }
      if (idx !== null && idx >= 0 && idx < values.length) {
        accessedIndices.add(idx)
      }
    }

    // ── Sliding window detection ──
    // When variable `k` (window size) exists, compute the window range dynamically.
    // IMPORTANT: The sliding phase only activates on lines that ACCESS the array.
    // This prevents the first loop's exit (i reaches k) from falsely triggering the sliding window.
    if (rangeStart === undefined && rangeEnd === undefined && typeof vars['k'] === 'number') {
      const kVal = vars['k'] as number
      if (kVal > 0 && kVal < values.length) {
        // Collect ALL valid loop indices to find the furthest-along pointer
        const allLoopVals = validIndices.map(vi => vi.val)
        const maxLoopVal = allLoopVals.length > 0 ? Math.max(...allLoopVals) : -1

        if (maxLoopVal >= kVal && accessedIndices.size > 0) {
          // Sliding phase: the window is [maxLoopVal - k + 1 .. maxLoopVal]
          // Only activates when the line actually accesses the array (e.g. arr[j-k] or arr[j])
          rangeStart = maxLoopVal - kVal + 1
          rangeEnd = maxLoopVal
          _lastWindowStart = rangeStart
          _lastWindowEnd = rangeEnd
        } else if (maxLoopVal >= 0 && maxLoopVal < kVal) {
          // Build phase: the window is growing from [0 .. maxLoopVal]
          rangeStart = 0
          rangeEnd = maxLoopVal
          _lastWindowStart = rangeStart
          _lastWindowEnd = rangeEnd
        } else if (_lastWindowStart !== undefined && _lastWindowEnd !== undefined) {
          // Persist the window on lines without array access (e.g. loop conditions, Math.max)
          rangeStart = _lastWindowStart
          rangeEnd = _lastWindowEnd
        }
      }
    }

    const isWindow = rangeStart !== undefined && rangeEnd !== undefined && rangeEnd >= rangeStart

    // Detect if this line is an actual element swap
    const isSwapLine = (
      (lineCode.includes('swap') || lineCode.includes('temp')) ||
      (/\[.*\]\s*=/.test(lineCode) && accessedIndices.size >= 2)
    )

    // Detect if this is a string array
    const isStringArr = values.length > 0 && typeof values[0] === 'string'

    const nodes: DSANode[] = values.map((v, idx) => {
      let highlight: DSANode['highlight'] = 'none'
      if (isStringArr) {
        // String array mode: highlight based on pointer position
        if (idx === pointer) {
          highlight = 'active'
        } else if (pointer !== undefined && idx < pointer) {
          highlight = 'skipped'
        }
      } else if (isWindow && rangeStart !== undefined && rangeEnd !== undefined) {
        // Window mode: elements in window are 'active', elements accessed on this line are 'comparing'
        if (idx >= rangeStart && idx <= rangeEnd) highlight = 'active'
        // Elements outside the window that were previously inside are 'visited'
        if (idx < rangeStart) highlight = 'visited'
        // Accessed elements get highlighted over the base window color
        if (accessedIndices.has(idx)) highlight = 'comparing'
      } else {
        if (idx === pivotIndex) {
          highlight = 'pivot'
        } else if (accessedIndices.has(idx)) {
          highlight = isSwapLine ? 'swapping' : 'comparing'
        } else if (idx === pointer || idx === pointer2) {
          highlight = 'active'
        } else if (rangeStart !== undefined && rangeEnd !== undefined && (idx < rangeStart || idx > rangeEnd)) {
          highlight = 'visited'
        }
      }
      return {
        id: `n${idx}`,
        value: v,
        highlight,
      }
    })

    const hashInfo = detectHashTableInfo(vars, name, lineCode)
    const detectedStackVar = Object.entries(vars).find(([k, v]) => k.toLowerCase().includes('stack') && Array.isArray(v))
    const stackItems = detectedStackVar ? [...(detectedStackVar[1] as (string|number)[])] : undefined

    // ── Secondary String Comparison Detection ──
    // Show character-by-character comparison when two strings exist
    let stringCompare: Record<string, any> | undefined;
    const stringVars = Object.entries(vars).filter(([k, v]) => !k.startsWith('__') && typeof v === 'string' && (v as string).length > 0)
    
    if (stringVars.length >= 2) {
      // Sort strings by length descending to pick the two most substantial strings (e.g. target and word)
      stringVars.sort((a, b) => (b[1] as string).length - (a[1] as string).length)
      const str1 = stringVars[0]
      const str2 = stringVars[1]
      
      // Only show string comparison if both strings are present on the line
      if (lineCode.includes(str1[0]) && lineCode.includes(str2[0])) {
        // Find a j-like index variable that could be the character index
      const jCandidates = ['j', 'k', 'idx', 'index', 'charIdx', 'ci']
      let matchIdx: number | undefined
      for (const jName of jCandidates) {
        if (typeof vars[jName] === 'number') {
          const val = vars[jName] as number;
          if (val >= 0 && val < Math.max((str1[1] as string).length, (str2[1] as string).length)) {
            matchIdx = val
            break
          }
        }
      }
      
      // Fallback: look for any index-like var accessed in bracket notation on the line
      if (matchIdx === undefined) {
        const bracketMatch = /\[(\w+)\]/.exec(lineCode)
        if (bracketMatch && typeof vars[bracketMatch[1]] === 'number') {
          const val = vars[bracketMatch[1]] as number
          if (val >= 0 && val < Math.max((str1[1] as string).length, (str2[1] as string).length)) {
            matchIdx = val
          }
        }
      }
      
        stringCompare = {
          str1Name: str1[0],
          str1Val: str1[1],
          str2Name: str2[0],
          str2Val: str2[1],
          idx: matchIdx
        }
      }
    }

    return {
      type: 'array',
      nodes,
      pointer,
      pointerName,
      pointer2,
      pointer2Name,
      rangeStart,
      rangeEnd,
      pivotIndex,
      message: `${name}: [${values.join(', ')}]`,
      hashTable: hashInfo?.table,
      arrayName: name,
      hashTableName: hashInfo?.name,
      hashTableLabel: hashInfo?.label,
      stackItems,
      stackName: detectedStackVar ? detectedStackVar[0] : undefined,
      auxiliaryData: stringCompare ? { stringCompare } : undefined
    }
  }

  // 7. STRING DETECTOR
  const strEntries = Object.entries(vars)
    .filter(([k, v]) => !k.startsWith('__') && typeof v === 'string' && (v as string).length > 0)
  if (strEntries.length > 0) {
    let target = strEntries[0]
    if (preferredName) {
      const match = strEntries.find(a => a[0] === preferredName)
      if (match) target = match
    } else {
      target = strEntries.reduce((best, cur) =>
        (cur[1] as string).length > (best[1] as string).length ? cur : best
      )
    }
    const [name, str] = target
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

    // Dynamic pointer detection for strings
    let pointer: number | undefined
    let pointer2: number | undefined

    const ignoredNumNames = new Set([
      'length', 'len', 'n', 'size', 'count', 'sum', 'total', 'max', 'min', 
      'target', 'diff', 'curr', 'current', 'temp', 'val', 'value', 'ans', 'res', 'result', 'pivot',
      'maxLength', 'maxLen', 'maxlength', 'zeroCount', 'zerocount', 'ones', 'zeros',
      'comparisons', 'swaps', 'shifts', 'k', 'windowLen', 'windowSize',
      'complement', 'profit', 'maxProfit', 'minPrice', 'currentSum', 'maxSum',
      'key', 'depth', 'level', 'step', 'steps',
      'formed', 'required', 'minLen', 'start', 'minLength', 'minStart'
    ]);

    const validIndices = Object.entries(vars)
      .filter(([k, v]) => !k.startsWith('__') && !ignoredNumNames.has(k.toLowerCase()) && typeof v === 'number' && (v as number) >= 0 && (v as number) <= chars.length)
      .map(([k, v]) => ({ name: k, val: v as number }));

    // Priority naming list for pointers
    const pointerPriority = ['mid', 'm', 'left', 'l', 'right', 'r', 'i', 'j', 'p1', 'p2', 'idx', 'index'];
    
    validIndices.sort((a, b) => {
      const idxA = pointerPriority.indexOf(a.name.toLowerCase());
      const idxB = pointerPriority.indexOf(b.name.toLowerCase());
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0; // maintain original order for others
    });

    if (validIndices.length > 0) pointer = validIndices[0].val;
    if (validIndices.length > 1) pointer2 = validIndices[1].val;

    if (pointer === undefined && rangeStart !== undefined) pointer = rangeStart;
    if (pointer2 === undefined && rangeEnd !== undefined) pointer2 = rangeEnd;

    const pointerName = validIndices.length > 0 ? validIndices[0].name : foundStart || undefined
    const pointer2Name = validIndices.length > 1 ? validIndices[1].name : foundEnd || undefined

    const isWindow = rangeStart !== undefined && rangeEnd !== undefined && rangeEnd >= rangeStart

    const hashInfo = detectHashTableInfo(vars, name, lineCode)
    const detectedStackVar = Object.entries(vars).find(([k, v]) => k.toLowerCase().includes('stack') && Array.isArray(v))
    const stackItems = detectedStackVar ? [...(detectedStackVar[1] as (string|number)[])] : undefined

    return {
      type: 'string',
      nodes: chars.map((c, i) => {
        let highlight: DSANode['highlight'] = 'none'
        if (isWindow && rangeStart !== undefined && rangeEnd !== undefined) {
          if (i >= rangeStart && i <= rangeEnd) highlight = 'active'
          if (i === pointer || i === pointer2) highlight = 'comparing'
        } else {
          highlight = i === pointer ? 'comparing' : i === pointer2 ? 'comparing' : 'none'
        }
        return {
          id: `c${i}`,
          value: c,
          highlight
        }
      }),
      pointer,
      pointerName,
      pointer2,
      pointer2Name,
      rangeStart,
      rangeEnd,
      message: `${name} = "${str}"`,
      hashTable: hashInfo?.table,
      arrayName: name,
      hashTableName: hashInfo?.name,
      hashTableLabel: hashInfo?.label,
      stackItems,
      stackName: detectedStackVar ? detectedStackVar[0] : undefined
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
