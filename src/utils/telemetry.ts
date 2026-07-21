import { useLearningStore } from '../store/learningStore'

export type TelemetryEvent = 'runtime_error' | 'judge_complete' | 'worker_timeout' | 'ui_error'

interface TelemetryPayload {
  event: TelemetryEvent
  language?: string
  errorType?: string
  passed?: number
  total?: number
  durationMs?: number
  appVersion: string
  sessionId: string
  timestamp: string
}

const endpoint = String(import.meta.env.VITE_TELEMETRY_ENDPOINT || '/api/telemetry')
const sessionId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
  ? crypto.randomUUID()
  : Math.random().toString(36).slice(2)

export function captureTelemetry(
  event: TelemetryEvent,
  fields: Omit<Partial<TelemetryPayload>, 'event' | 'appVersion' | 'sessionId' | 'timestamp'> = {},
): void {
  if (!useLearningStore.getState().telemetryConsent || typeof navigator === 'undefined') return
  const payload: TelemetryPayload = {
    event,
    ...fields,
    appVersion: '3.0.0',
    sessionId,
    timestamp: new Date().toISOString(),
  }
  const body = JSON.stringify(payload)
  if (typeof navigator.sendBeacon === 'function') {
    navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }))
    return
  }
  void fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true })
}

export function installGlobalErrorTelemetry(): () => void {
  if (typeof window === 'undefined') return () => undefined
  const onError = (event: ErrorEvent) => captureTelemetry('ui_error', { errorType: event.error?.name || 'Error' })
  const onRejection = (event: PromiseRejectionEvent) => captureTelemetry('ui_error', {
    errorType: event.reason instanceof Error ? event.reason.name : 'UnhandledRejection',
  })
  window.addEventListener('error', onError)
  window.addEventListener('unhandledrejection', onRejection)
  return () => {
    window.removeEventListener('error', onError)
    window.removeEventListener('unhandledrejection', onRejection)
  }
}
