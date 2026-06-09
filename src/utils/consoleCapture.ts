/**
 * Enhanced Console Output Capture
 * Captures and formats console output with color coding and timestamps
 */

export interface ConsoleMessage {
  level: 'log' | 'warn' | 'error' | 'info'
  content: string
  timestamp: string
  formatted: string
}

export class ConsoleCapture {
  private messages: ConsoleMessage[] = []
  private originalLog = console.log
  private originalWarn = console.warn
  private originalError = console.error
  private originalInfo = console.info

  constructor() {
    this.setupCapture()
  }

  private setupCapture() {
    console.log = (...args: any[]) => {
      this.captureMessage('log', args)
      this.originalLog(...args)
    }

    console.warn = (...args: any[]) => {
      this.captureMessage('warn', args)
      this.originalWarn(...args)
    }

    console.error = (...args: any[]) => {
      this.captureMessage('error', args)
      this.originalError(...args)
    }

    console.info = (...args: any[]) => {
      this.captureMessage('info', args)
      this.originalInfo(...args)
    }
  }

  private captureMessage(level: ConsoleMessage['level'], args: any[]) {
    const content = args
      .map(arg => this.formatArg(arg))
      .join(' ')

    const timestamp = new Date().toISOString()
    const formatted = `[${timestamp}] [${level.toUpperCase()}] ${content}`

    this.messages.push({
      level,
      content,
      timestamp,
      formatted,
    })
  }

  private formatArg(arg: any): string {
    if (arg === null) return 'null'
    if (arg === undefined) return 'undefined'
    if (typeof arg === 'string') return arg
    if (typeof arg === 'number') return String(arg)
    if (typeof arg === 'boolean') return String(arg)
    if (Array.isArray(arg)) {
      return `[${arg.slice(0, 5).map(v => this.formatArg(v)).join(', ')}${arg.length > 5 ? ', ...' : ''}]`
    }
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg)
      } catch {
        return String(arg)
      }
    }
    return String(arg)
  }

  getMessages(): ConsoleMessage[] {
    return [...this.messages]
  }

  getFormattedOutput(): string {
    return this.messages.map(m => m.formatted).join('\n')
  }

  getColoredOutput(): string {
    return this.messages.map(m => {
      const colors: Record<ConsoleMessage['level'], string> = {
        log: '\x1b[36m',    // Cyan
        warn: '\x1b[33m',   // Yellow
        error: '\x1b[31m',  // Red
        info: '\x1b[34m',   // Blue
      }
      const reset = '\x1b[0m'
      return `${colors[m.level]}${m.formatted}${reset}`
    }).join('\n')
  }

  clear() {
    this.messages = []
  }

  restore() {
    console.log = this.originalLog
    console.warn = this.originalWarn
    console.error = this.originalError
    console.info = this.originalInfo
  }
}

/**
 * Create mock console for code execution
 */
export function createMockConsole() {
  const outputs: ConsoleMessage[] = []

  return {
    log: (...args: any[]) => {
      outputs.push({
        level: 'log',
        content: args.map(formatValue).join(' '),
        timestamp: new Date().toISOString(),
        formatted: args.map(formatValue).join(' '),
      })
    },
    warn: (...args: any[]) => {
      outputs.push({
        level: 'warn',
        content: args.map(formatValue).join(' '),
        timestamp: new Date().toISOString(),
        formatted: `⚠️ ${args.map(formatValue).join(' ')}`,
      })
    },
    error: (...args: any[]) => {
      outputs.push({
        level: 'error',
        content: args.map(formatValue).join(' '),
        timestamp: new Date().toISOString(),
        formatted: `❌ ${args.map(formatValue).join(' ')}`,
      })
    },
    info: (...args: any[]) => {
      outputs.push({
        level: 'info',
        content: args.map(formatValue).join(' '),
        timestamp: new Date().toISOString(),
        formatted: `ℹ️ ${args.map(formatValue).join(' ')}`,
      })
    },
    getOutput: () => outputs,
  }
}

function formatValue(val: any): string {
  if (val === null) return 'null'
  if (val === undefined) return 'undefined'
  if (typeof val === 'string') return val
  if (typeof val === 'number') return String(val)
  if (typeof val === 'boolean') return String(val)
  if (Array.isArray(val)) {
    return `[${val.slice(0, 3).map(formatValue).join(', ')}${val.length > 3 ? ', ...' : ''}]`
  }
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val)
    } catch {
      return '[Object]'
    }
  }
  return String(val)
}
