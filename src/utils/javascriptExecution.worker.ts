/// <reference lib="webworker" />

import { ExecutionMode, runCode } from './universalEngine'

interface WorkerRequest {
  requestId: number
  nonce: string
  code: string
  mode: ExecutionMode
}

const send = self.postMessage.bind(self)

function restrictWorkerCapabilities(): void {
  // The dedicated worker already has no DOM, cookies, localStorage, or access
  // to the IDE's in-memory state. Hide direct network primitives as an extra
  // guardrail; the worker is terminated after every execution.
  const blocked = ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'indexedDB', 'caches'] as const
  for (const key of blocked) {
    try {
      Object.defineProperty(self, key, { value: undefined, writable: false, configurable: false })
    } catch {
      // A browser may expose a non-configurable host property. Worker isolation
      // still prevents DOM and application-state access in that case.
    }
  }
}

restrictWorkerCapabilities()

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { requestId, nonce, code, mode } = event.data
  try {
    const result = runCode(code, mode)
    send({ type: 'result', requestId, nonce, result })
  } catch (error) {
    send({
      type: 'error',
      requestId,
      nonce,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

export {}
