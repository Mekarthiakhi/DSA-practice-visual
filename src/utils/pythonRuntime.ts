const PYODIDE_INDEX_URL = 'https://cdn.jsdelivr.net/pyodide/v314.0.2/full/'
// The first run downloads and initializes Pyodide. Keep its timeout generous
// enough for normal mobile connections; subsequent runs reuse the same worker.
const EXECUTION_TIMEOUT_MS = 45_000

export interface PythonTraceEvent {
  line: number
  variables: Record<string, unknown>
  callStack: string[]
}

export interface PythonTraceResult {
  events: PythonTraceEvent[]
  output: string[]
  error?: {
    type: string
    message: string
    line: number
    column?: number
  }
  truncated?: boolean
}

interface PendingRun {
  resolve: (result: PythonTraceResult) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
}

let worker: Worker | undefined
let runSequence = 0
const pending = new Map<number, PendingRun>()

function buildPythonWrapper(code: string): string {
  return `
import contextlib
import io
import json
import math
import sys
import traceback

_USER_CODE = ${JSON.stringify(code)}
_events = []
_step_count = 0
_max_steps = 3000
_truncated = False

class _ExecutionLimitError(Exception):
    pass

def _safe(value, depth=0, seen=None):
    if seen is None:
        seen = set()
    if depth > 4:
        return "[deep]"
    if isinstance(value, float) and not math.isfinite(value):
        return str(value)
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    value_id = id(value)
    if value_id in seen:
        return "[circular]"
    seen.add(value_id)
    try:
        if isinstance(value, (list, tuple)):
            return [_safe(item, depth + 1, seen) for item in list(value)[:30]]
        if isinstance(value, (set, frozenset)):
            return [_safe(item, depth + 1, seen) for item in list(value)[:30]]
        if isinstance(value, dict):
            result = {}
            for index, (key, item) in enumerate(value.items()):
                if index >= 30:
                    result["..."] = "more"
                    break
                result[str(key)] = _safe(item, depth + 1, seen)
            return result
        if hasattr(value, "__dict__"):
            result = {"__class__": value.__class__.__name__}
            for index, (key, item) in enumerate(vars(value).items()):
                if index >= 20:
                    break
                result[str(key)] = _safe(item, depth + 1, seen)
            return result
        return repr(value)[:160]
    except Exception:
        return "[unavailable]"
    finally:
        seen.discard(value_id)

def _user_stack(frame):
    names = []
    current = frame
    while current is not None:
        if current.f_code.co_filename == "<user_code>":
            names.append(current.f_code.co_name if current.f_code.co_name != "<module>" else "main")
        current = current.f_back
    names.reverse()
    return names or ["main"]

def _trace(frame, event, arg):
    global _step_count, _truncated
    if frame.f_code.co_filename != "<user_code>":
        return _trace
    if event == "line":
        _step_count += 1
        if _step_count > _max_steps:
            _truncated = True
            raise _ExecutionLimitError("Execution stopped after 3,000 steps")
        local_values = {}
        for key, value in frame.f_locals.items():
            if not key.startswith("__"):
                local_values[key] = _safe(value)
        _events.append({
            "line": frame.f_lineno,
            "variables": local_values,
            "callStack": _user_stack(frame),
        })
    return _trace

_stdout = io.StringIO()
_error = None
try:
    _compiled = compile(_USER_CODE, "<user_code>", "exec")
    _globals = {"__name__": "__main__"}
    with contextlib.redirect_stdout(_stdout), contextlib.redirect_stderr(_stdout):
        sys.settrace(_trace)
        try:
            exec(_compiled, _globals, _globals)
        finally:
            sys.settrace(None)
except BaseException as exc:
    sys.settrace(None)
    error_line = getattr(exc, "lineno", None)
    error_column = getattr(exc, "offset", None)
    current_tb = exc.__traceback__
    while current_tb is not None:
        if current_tb.tb_frame.f_code.co_filename == "<user_code>":
            error_line = current_tb.tb_lineno
        current_tb = current_tb.tb_next
    _error = {
        "type": "ExecutionLimitError" if isinstance(exc, _ExecutionLimitError) else exc.__class__.__name__,
        "message": str(exc),
        "line": int(error_line or (_events[-1]["line"] if _events else 1)),
        "column": int(error_column or 1),
    }

json.dumps({
    "events": _events,
    "output": _stdout.getvalue().splitlines(),
    "error": _error,
    "truncated": _truncated,
})
`
}

function createWorker(): Worker {
  const workerSource = `
    import { loadPyodide } from ${JSON.stringify(`${PYODIDE_INDEX_URL}pyodide.mjs`)};
    const INDEX_URL = ${JSON.stringify(PYODIDE_INDEX_URL)};
    const runtimePromise = loadPyodide({ indexURL: INDEX_URL });

    function getRuntime() {
      return runtimePromise;
    }

    self.onmessage = async (event) => {
      const { id, wrapper } = event.data;
      try {
        const runtime = await getRuntime();
        const value = await runtime.runPythonAsync(wrapper);
        self.postMessage({ id, result: JSON.parse(String(value)) });
      } catch (error) {
        self.postMessage({ id, error: error instanceof Error ? error.message : String(error) });
      }
    };
  `
  const blob = new Blob([workerSource], { type: 'text/javascript' })
  const url = URL.createObjectURL(blob)
  const created = new Worker(url, { type: 'module', name: 'algovision-python-runtime' })
  URL.revokeObjectURL(url)

  created.onmessage = (event: MessageEvent<{ id: number; result?: PythonTraceResult; error?: string }>) => {
    const request = pending.get(event.data.id)
    if (!request) return
    clearTimeout(request.timer)
    pending.delete(event.data.id)
    if (event.data.error) request.reject(new Error(event.data.error))
    else request.resolve(event.data.result || { events: [], output: [] })
  }
  created.onerror = (event) => {
    const error = new Error(event.message || 'Python worker failed')
    for (const request of pending.values()) {
      clearTimeout(request.timer)
      request.reject(error)
    }
    pending.clear()
    created.terminate()
    worker = undefined
  }
  return created
}

export function runPythonDynamic(code: string): Promise<PythonTraceResult> {
  if (typeof Worker === 'undefined') {
    return Promise.reject(new Error('This browser does not support Web Workers required for Python execution.'))
  }
  if (!worker) worker = createWorker()
  const id = ++runSequence

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id)
      worker?.terminate()
      worker = undefined
      reject(new Error('Python execution timed out after 45 seconds. Check for blocking code or an infinite loop.'))
    }, EXECUTION_TIMEOUT_MS)

    pending.set(id, { resolve, reject, timer })
    worker!.postMessage({ id, wrapper: buildPythonWrapper(code) })
  })
}
