import JavaScriptExecutionWorker from './javascriptExecution.worker?worker'
import type { ExecutionMode, RunResult } from './universalEngine'

interface WorkerResponse {
  type: 'result' | 'error'
  requestId: number
  nonce: string
  result?: RunResult
  error?: string
}

let activeWorker: Worker | undefined
let requestSequence = 0

export function cancelJavaScriptExecution(): void {
  activeWorker?.terminate()
  activeWorker = undefined
}

function createNonce(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function runJavaScriptInWorker(
  code: string,
  mode: ExecutionMode = 'auto',
  timeoutMs = 8_000,
): Promise<RunResult> {
  cancelJavaScriptExecution()
  const worker = new JavaScriptExecutionWorker({ name: 'algovision-javascript-runtime' })
  activeWorker = worker
  const requestId = ++requestSequence
  const nonce = createNonce()

  return new Promise((resolve, reject) => {
    const finish = () => {
      clearTimeout(timer)
      worker.terminate()
      if (activeWorker === worker) activeWorker = undefined
    }

    const timer = setTimeout(() => {
      finish()
      reject(new Error(`JavaScript execution timed out after ${Math.round(timeoutMs / 1000)} seconds.`))
    }, timeoutMs)

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data
      if (response.requestId !== requestId || response.nonce !== nonce) return
      finish()
      if (response.type === 'error' || !response.result) reject(new Error(response.error || 'JavaScript worker failed'))
      else resolve(response.result)
    }

    worker.onerror = (event) => {
      finish()
      reject(new Error(event.message || 'JavaScript worker crashed'))
    }

    worker.postMessage({ requestId, nonce, code, mode })
  })
}
