import React from 'react'
import { AlertTriangle, CheckCircle2, FlaskConical, Plus, Trash2, XCircle } from 'lucide-react'
import type { LeetCodeProblem } from '../../data/leetcodeProblems'
import { useIDEStore } from '../../store/ideStore'
import { useLearningStore } from '../../store/learningStore'
import { evaluateJudgeCase, JudgeCaseResult, JudgeTestCase } from '../../utils/judgeEngine'
import { createLeetCodeHarness, LeetCodeHarnessLanguage, stripGeneratedHarness } from '../../utils/leetcodeHarness'
import { runJavaScriptInWorker } from '../../utils/javascriptWorkerClient'
import { runMultiLang } from '../../utils/multiLangEngine'
import { captureTelemetry } from '../../utils/telemetry'

interface Props {
  problem: LeetCodeProblem
}

function casesFromProblem(problem: LeetCodeProblem): JudgeTestCase[] {
  return problem.examples.map((example, index) => ({
    id: `${problem.id}-${index}`,
    input: example.input,
    expected: example.output,
  }))
}

export const JudgePanel: React.FC<Props> = ({ problem }) => {
  const {
    code, language, setExecutionSteps, setCurrentStepIndex, setExecutionStatus,
  } = useIDEStore()
  const recordJudgeResult = useLearningStore(state => state.recordJudgeResult)
  const [testCases, setTestCases] = React.useState<JudgeTestCase[]>(() => casesFromProblem(problem))
  const [results, setResults] = React.useState<JudgeCaseResult[]>([])
  const [running, setRunning] = React.useState(false)
  const runId = React.useRef(0)

  React.useEffect(() => {
    runId.current += 1
    setTestCases(casesFromProblem(problem))
    setResults([])
    setRunning(false)
  }, [problem])

  const updateCase = (id: string, field: 'input' | 'expected', value: string) => {
    setTestCases(current => current.map(test => test.id === id ? { ...test, [field]: value } : test))
    setResults([])
  }

  const addCase = () => setTestCases(current => [
    ...current,
    { id: `${problem.id}-custom-${Date.now()}`, input: '', expected: '' },
  ])

  const runJudge = async () => {
    if (language !== 'javascript' && language !== 'python') return
    const currentRun = ++runId.current
    const lang = language as LeetCodeHarnessLanguage
    const source = stripGeneratedHarness(code, lang)
    const nextResults: JudgeCaseResult[] = []
    setResults([])
    setRunning(true)

    for (const testCase of testCases) {
      if (currentRun !== runId.current) return
      const harness = createLeetCodeHarness(problem, source, lang, testCase.input)
      if (!harness.added) {
        nextResults.push({
          ...testCase,
          status: 'fixture-required',
          actual: '',
          message: harness.message,
          durationMs: 0,
          steps: [],
        })
        setResults([...nextResults])
        continue
      }

      const startedAt = performance.now()
      try {
        const execution = lang === 'javascript'
          ? await runJavaScriptInWorker(harness.code, 'auto')
          : await runMultiLang(harness.code, 'python')
        const result = evaluateJudgeCase(testCase, execution, performance.now() - startedAt)
        nextResults.push(result)
      } catch (error) {
        nextResults.push({
          ...testCase,
          status: 'error',
          actual: '',
          message: error instanceof Error ? error.message : String(error),
          durationMs: performance.now() - startedAt,
          steps: [],
        })
      }
      setResults([...nextResults])
    }

    if (currentRun !== runId.current) return
    const passed = nextResults.filter(result => result.status === 'passed').length
    recordJudgeResult(problem.id, passed, nextResults.length)
    captureTelemetry('judge_complete', {
      language: lang,
      passed,
      total: nextResults.length,
      durationMs: Math.round(nextResults.reduce((sum, result) => sum + result.durationMs, 0)),
    })
    const firstFailure = nextResults.find(result => result.status !== 'passed' && result.steps.length > 0)
    if (firstFailure) {
      setExecutionSteps(firstFailure.steps)
      setCurrentStepIndex(firstFailure.failingStepIndex || 0)
      setExecutionStatus(firstFailure.status === 'error' ? 'error' : 'paused')
    }
    setRunning(false)
  }

  const passed = results.filter(result => result.status === 'passed').length
  const unsupportedLanguage = language !== 'javascript' && language !== 'python'

  return (
    <div className="space-y-3 border-t border-[#1e2130] pt-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-white"><FlaskConical size={14} className="text-emerald-400" /> Test judge</h3>
          <p className="mt-0.5 text-[10px] text-gray-500">Runs every case separately and opens the first failing execution step.</p>
        </div>
        {results.length > 0 && <span className="text-[10px] font-mono text-gray-400">{passed}/{results.length} passed</span>}
      </div>

      <div className="space-y-2">
        {testCases.map((testCase, index) => {
          const result = results.find(item => item.id === testCase.id)
          return (
            <div key={testCase.id} className="rounded-lg border border-[#262938] bg-[#10121a] p-2.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-gray-400">Case {index + 1}</span>
                <div className="flex items-center gap-2">
                  {result?.status === 'passed' && <CheckCircle2 size={13} className="text-emerald-400" />}
                  {result?.status === 'failed' && <XCircle size={13} className="text-red-400" />}
                  {(result?.status === 'error' || result?.status === 'fixture-required') && <AlertTriangle size={13} className="text-amber-400" />}
                  {testCase.id.includes('-custom-') && (
                    <button aria-label={`Remove test case ${index + 1}`} onClick={() => setTestCases(current => current.filter(item => item.id !== testCase.id))} className="text-gray-600 hover:text-red-400">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
              <textarea aria-label={`Input for case ${index + 1}`} value={testCase.input} onChange={event => updateCase(testCase.id, 'input', event.target.value)} rows={2} placeholder="nums = [1,2,3]" className="mb-1.5 w-full resize-y rounded border border-[#292c3b] bg-[#0c0e14] px-2 py-1.5 font-mono text-[10px] text-gray-300 focus:border-emerald-500/40 focus:outline-none" />
              <input aria-label={`Expected output for case ${index + 1}`} value={testCase.expected} onChange={event => updateCase(testCase.id, 'expected', event.target.value)} placeholder="Expected output" className="w-full rounded border border-[#292c3b] bg-[#0c0e14] px-2 py-1.5 font-mono text-[10px] text-gray-300 focus:border-emerald-500/40 focus:outline-none" />
              {result && (
                <div className={`mt-2 rounded px-2 py-1.5 text-[10px] ${result.status === 'passed' ? 'bg-emerald-500/8 text-emerald-300' : 'bg-red-500/8 text-red-300'}`}>
                  <div>Actual: <span className="font-mono">{result.actual || 'no output'}</span></div>
                  {result.failingLine && <div>Failure step {Number(result.failingStepIndex) + 1}, source line {result.failingLine}</div>}
                  {result.message && <div>{result.message}</div>}
                  <div className="text-gray-500">{result.durationMs.toFixed(1)} ms</div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex gap-2">
        <button onClick={addCase} className="flex items-center gap-1 rounded-md border border-[#2a2d3e] px-2.5 py-2 text-[10px] text-gray-400 hover:text-white"><Plus size={11} /> Case</button>
        <button disabled={running || unsupportedLanguage || testCases.length === 0} onClick={() => void runJudge()} className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40">
          <FlaskConical size={12} /> {running ? 'Running cases…' : `Run ${testCases.length} cases`}
        </button>
      </div>
      {unsupportedLanguage && <p className="text-[10px] text-amber-400">The local judge currently supports JavaScript and Python catalog code.</p>}
    </div>
  )
}
