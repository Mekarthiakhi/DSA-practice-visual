import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward, Eye, RotateCcw, ChevronDown, Zap, Key, BookOpen } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useIDEStore, Language } from '../../store/ideStore'
import { runMultiLang, SupportedLang } from '../../utils/multiLangEngine'
import { cancelJavaScriptExecution, runJavaScriptInWorker } from '../../utils/javascriptWorkerClient'
import { SAMPLE_CODES } from '../../utils/executionEngine'
import { GENERAL_SAMPLES, ALL_CATEGORIES } from '../../utils/universalEngine'
import { MULTI_LANG_SAMPLES, MULTI_LANG_CATEGORIES } from '../../utils/multiLangSamples'
import { captureTelemetry } from '../../utils/telemetry'

// ─── All samples merged ───────────────────────────────────────────────────────
const JS_SAMPLES = { ...SAMPLE_CODES, ...GENERAL_SAMPLES }
const ALL_SAMPLES_MERGED = { ...JS_SAMPLES, ...MULTI_LANG_SAMPLES }
const ALL_CATS = [
  ...ALL_CATEGORIES,
  ...MULTI_LANG_CATEGORIES.filter(c => !ALL_CATEGORIES.includes(c)),
]

// ─── Language config ──────────────────────────────────────────────────────────
const LANGS: { value: Language; label: string; color: string; monacoId: string; canBrowser: boolean }[] = [
  { value: 'javascript', label: 'JavaScript', color: '#f7df1e', monacoId: 'javascript', canBrowser: true  },
  { value: 'typescript', label: 'TypeScript', color: '#3178c6', monacoId: 'typescript', canBrowser: true  },
  { value: 'python',     label: 'Python',     color: '#3776ab', monacoId: 'python',     canBrowser: true  },
  { value: 'java',       label: 'Java',       color: '#ed8b00', monacoId: 'java',       canBrowser: false },
  { value: 'cpp',        label: 'C++',        color: '#00599c', monacoId: 'cpp',        canBrowser: false },
  { value: 'c',          label: 'C',          color: '#a8b9cc', monacoId: 'c',          canBrowser: false },
  { value: 'csharp',     label: 'C#',         color: '#9b4f96', monacoId: 'csharp',     canBrowser: false },
  { value: 'go',         label: 'Go',         color: '#00add8', monacoId: 'go',         canBrowser: false },
  { value: 'rust',       label: 'Rust',       color: '#dea584', monacoId: 'rust',       canBrowser: false },
]

export const TopBar: React.FC = () => {
  const {
    language, setLanguage, code, setCode, setFileName,
    executionStatus, setExecutionStatus,
    executionSteps, setExecutionSteps,
    currentStepIndex, nextStep, prevStep, resetExecution,
    setCurrentStepIndex,
    playbackSpeed, setPlaybackSpeed,
    clearOutput, addOutput,
    aiApiKey,
    showLeetCodePanel, setShowLeetCodePanel,
    execMode, setExecMode,
    setDetectedAlgorithm,
  } = useIDEStore()

  const [showLangPicker, setShowLangPicker]     = useState(false)
  const [showExamples, setShowExamples]          = useState(false)
  const [activeCat, setActiveCat]               = useState('Sorting')
  const [isPlaying, setIsPlaying]               = useState(false)
  const [isRunning, setIsRunning]               = useState(false)
  const playRef = useRef<ReturnType<typeof setTimeout>|null>(null)
  const runRequestRef = useRef(0)

  useEffect(() => {
    const close = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (!t.closest('[data-dropdown]')) {
        setShowLangPicker(false)
        setShowExamples(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const stopPlay = () => {
    if (playRef.current !== null) {
      clearTimeout(playRef.current)
      playRef.current = null
    }
    setIsPlaying(false)
  }

  const handleVisualize = async (isLiveUpdate = false) => {
    const requestId = ++runRequestRef.current
    stopPlay()
    clearOutput()
    setIsRunning(true)
    setExecutionStatus('running')
    addOutput(isLiveUpdate ? 'Updating live execution...' : 'Starting visualization...')

    const currentLang = language as SupportedLang
    const isDirectJavaScript = currentLang === 'javascript'

    try {
      if (isDirectJavaScript) {
        const result = await runJavaScriptInWorker(
          code,
          execMode === 'trace' ? 'interpreter' : execMode === 'dsa' ? 'dsa' : 'auto',
        )
        if (requestId !== runRequestRef.current) return
        setExecutionSteps(result.steps)
        const diagnosticStep = result.steps.findIndex(step => !!step.diagnostic)
        setCurrentStepIndex(diagnosticStep >= 0 ? diagnosticStep : 0)
        setExecutionStatus(result.error ? 'error' : 'paused')
        if (result.algo) setDetectedAlgorithm(result.algo)
        addOutput(`📊 Mode: ${result.mode === 'dsa' ? 'DSA Visualizer' : 'Live Tracer'}${result.algo ? ` (${result.algo})` : ''}`)
        addOutput(`📋 ${result.steps.length} steps`)
        addOutput('──────────────────────────')
        result.output.forEach(l => addOutput(l))
        if (result.error) {
          addOutput(`❌ ${result.error}`)
          captureTelemetry('runtime_error', { language: currentLang, errorType: 'JavaScriptExecutionError' })
        }
      } else {
        // Use local WASM/transpilation or the configured isolated runtime service.
        const result = await runMultiLang(code, currentLang, aiApiKey || undefined)
        if (requestId !== runRequestRef.current) return
        setExecutionSteps(result.steps)
        const diagnosticStep = result.steps.findIndex(step => !!step.diagnostic)
        setCurrentStepIndex(diagnosticStep >= 0 ? diagnosticStep : 0)
        setExecutionStatus(result.error ? 'error' : 'paused')

        const modeLabel = result.mode === 'dsa' ? 'DSA Visualizer'
          : result.mode === 'runtime-api' ? 'Dynamic Runtime Service'
          : result.mode === 'browser' && currentLang === 'python' ? 'Python WASM Tracer'
          : result.mode === 'browser' ? 'Local Runtime Tracer'
          : 'AI-Simulated Trace'
        addOutput(`📊 Mode: ${modeLabel} | Language: ${currentLang.toUpperCase()}`)
        addOutput(`📋 ${result.steps.length} execution steps`)
        addOutput('──────────────────────────')
        result.output.forEach(l => addOutput(l))
        if (result.error) {
          addOutput(`❌ ${result.error}`)
          captureTelemetry('runtime_error', { language: currentLang, errorType: 'ExecutionError' })
        }
      }
    } catch (err) {
      if (requestId !== runRequestRef.current) return
      const msg = err instanceof Error ? err.message : String(err)
      addOutput(`❌ Error: ${msg}`)
      setExecutionStatus('error')
      captureTelemetry(msg.toLowerCase().includes('timed out') ? 'worker_timeout' : 'runtime_error', {
        language: currentLang,
        errorType: err instanceof Error ? err.name : 'UnknownError',
      })
    } finally {
      if (requestId === runRequestRef.current) setIsRunning(false)
    }
  }

  // Re-run JavaScript after the learner pauses typing. Editing clears the old
  // trace immediately, so the canvas never presents stale execution state.
  useEffect(() => {
    stopPlay()
    runRequestRef.current += 1
    cancelJavaScriptExecution()
    setIsRunning(false)
    if (!['javascript', 'typescript', 'python'].includes(language) || !code.trim()) return

    const timer = setTimeout(() => {
      void handleVisualize(true)
    }, 700)

    return () => clearTimeout(timer)
    // Zustand actions are stable; source controls are the only rerun triggers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, language, execMode])

  useEffect(() => () => cancelJavaScriptExecution(), [])

  const handlePlayPause = () => {
    if (isPlaying) {
      stopPlay(); setExecutionStatus('paused')
      return
    }

    setIsPlaying(true); setExecutionStatus('running')

    const tick = () => {
      // Always read fresh state — avoids stale closure captures
      const store = useIDEStore.getState()
      const idx = store.currentStepIndex
      const totalSteps = store.executionSteps.length

      if (idx >= totalSteps - 1) {
        // Clear ref BEFORE calling stopPlay so we don't double-clear
        playRef.current = null
        setIsPlaying(false)
        setExecutionStatus('completed')
        store.addOutput('✅ Playback complete!')
        return
      }

      store.setCurrentStepIndex(idx + 1)
      // Re-read speed each tick so speed changes take immediate effect
      const delay = Math.round(1200 / useIDEStore.getState().playbackSpeed)
      playRef.current = setTimeout(tick, delay)
    }

    const initialDelay = Math.round(1200 / useIDEStore.getState().playbackSpeed)
    playRef.current = setTimeout(tick, initialDelay)
  }

  const handleReset = () => { stopPlay(); resetExecution() }

  const progress = executionSteps.length > 0
    ? (currentStepIndex / Math.max(executionSteps.length - 1, 1)) * 100 : 0

  const curLang = LANGS.find(l => l.value === language) || LANGS[0]
  const samplesForCat = Object.entries(ALL_SAMPLES_MERGED).filter(([, s]) => s.category === activeCat)
  const hasExecutionService = !!(globalThis as typeof globalThis & { __ALGOVISION_EXECUTION_API_URL__?: string })
    .__ALGOVISION_EXECUTION_API_URL__
  const nonBrowser = !curLang.canBrowser && !hasExecutionService

  return (
    <header className="h-12 bg-bg-secondary border-b border-border-subtle flex items-center gap-2 px-3 flex-shrink-0 relative z-[100] select-none">

      {/* Logo */}
      <div className="flex items-center gap-2 mr-1 flex-shrink-0">
        <div className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,rgba(0,180,216,.2),rgba(168,85,247,.2))', border: '1px solid rgba(0,180,216,.4)' }}>
          <Eye size={12} className="text-cyan-400" />
        </div>
        <span className="font-bold text-white text-sm tracking-tight hidden sm:block">AlgoVision</span>
      </div>

      <div className="w-px h-5 bg-bg-hover flex-shrink-0" />

      {/* Language Picker */}
      <div className="relative flex-shrink-0" data-dropdown>
        <button
          onClick={() => { setShowLangPicker(!showLangPicker); setShowExamples(false) }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-bg-tertiary border border-border-subtle hover:border-border-bright transition-all text-xs font-mono text-gray-400 hover:text-white"
        >
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: curLang.color }} />
          <span>{curLang.label}</span>
          <ChevronDown size={9} />
        </button>

        <AnimatePresence>
          {showLangPicker && (
            <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ duration: 0.12 }}
              className="absolute top-full left-0 mt-1 bg-bg-panel border border-border-subtle rounded-xl shadow-2xl z-[9999] p-1.5 min-w-[200px]">
              <div className="text-[9px] font-mono text-gray-600 uppercase tracking-wider px-2 py-1 mb-0.5">Select Language</div>
              {LANGS.map(lang => (
                <button key={lang.value}
                  onClick={() => { setLanguage(lang.value); setShowLangPicker(false) }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors ${language === lang.value ? 'bg-white/8 text-white' : 'text-gray-500 hover:text-gray-200 hover:bg-white/4'}`}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: lang.color }} />
                  <span className="flex-1 text-left">{lang.label}</span>
                  {lang.canBrowser
                    ? <span className="text-[9px] text-green-500/60 font-mono">local runtime</span>
                    : <span className="text-[9px] text-amber-500/60 font-mono">runtime service</span>
                  }
                </button>
              ))}
              <div className="mt-1 pt-1 border-t border-border-subtle px-2 py-1">
                <p className="text-[9px] text-gray-700 font-mono leading-relaxed">
                  🟢 local = real browser/WASM execution<br/>
                  🟡 service = runtime API or AI simulation
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* LeetCode Picker */}
      <div className="flex-shrink-0">
        <button
          onClick={() => { setShowLeetCodePanel(!showLeetCodePanel); setShowExamples(false); setShowLangPicker(false); }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all text-xs ${showLeetCodePanel ? 'bg-bg-hover border-cyan-500/50 text-white' : 'bg-bg-tertiary border-border-subtle hover:border-border-bright text-gray-400 hover:text-white'}`}
        >
          <BookOpen size={11} className={showLeetCodePanel ? 'text-cyan-400' : ''} />
          <span>LeetCode</span>
        </button>
      </div>

      {/* Examples Picker */}
      <div className="relative flex-shrink-0" data-dropdown>
        <button
          onClick={() => { setShowExamples(!showExamples); setShowLangPicker(false) }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-bg-tertiary border border-border-subtle hover:border-border-bright transition-all text-xs text-gray-400 hover:text-white"
        >
          <Zap size={11} />
          <span>Examples</span>
          <ChevronDown size={9} />
        </button>

        <AnimatePresence>
          {showExamples && (
            <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ duration: 0.12 }}
              className="absolute top-full left-0 mt-1 bg-bg-panel border border-border-subtle rounded-xl shadow-2xl z-[9999] w-[440px] overflow-hidden">

              {/* Category tabs — scrollable */}
              <div className="flex border-b border-border-subtle overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {ALL_CATS.map(cat => (
                  <button key={cat} onClick={() => setActiveCat(cat)}
                    className={`px-2.5 py-2 text-[10px] font-mono whitespace-nowrap transition-colors flex-shrink-0 ${
                      activeCat === cat ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5' : 'text-gray-600 hover:text-gray-400'
                    }`}>{cat}</button>
                ))}
              </div>

              {/* Samples grid */}
              <div className="p-2 grid grid-cols-2 gap-1 max-h-60 overflow-y-auto">
                {samplesForCat.length === 0 ? (
                  <p className="col-span-2 text-center text-gray-700 text-xs py-6 font-mono">No examples in this category</p>
                ) : samplesForCat.map(([key, sample]) => {
                  const lang = LANGS.find(l => l.value === sample.language)
                  return (
                    <button key={key}
                      onClick={() => {
                        setCode(sample.code)
                        setLanguage(sample.language as Language)
                        setFileName(key)
                        setExecMode('dsa')
                        setShowExamples(false)
                        handleReset()
                      }}
                      className="text-left px-3 py-2 rounded-lg hover:bg-bg-tertiary border border-transparent hover:border-border-DEFAULT transition-all group"
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: lang?.color || '#6b7280' }} />
                        <span className="text-gray-300 text-xs font-medium group-hover:text-white transition-colors">{sample.label}</span>
                      </div>
                      {'description' in sample && (
                        <p className="text-[10px] text-gray-600 truncate group-hover:text-gray-500">{(sample as {description?: string}).description}</p>
                      )}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Execution mode toggle */}
      <div className="flex items-center bg-bg-tertiary border border-border-subtle rounded-lg overflow-hidden flex-shrink-0">
        {(['auto', 'dsa', 'trace'] as const).map(m => (
          <button key={m} onClick={() => setExecMode(m)}
            className={`px-2 py-1.5 text-[10px] font-mono transition-all border-r border-border-subtle last:border-0 ${
              execMode === m ? 'bg-cyan-500/15 text-cyan-400' : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            {m === 'auto' ? '⚡ Auto' : m === 'dsa' ? '🔢 DSA' : '🔍 Trace'}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-bg-hover flex-shrink-0" />

      {/* Non-browser language notice */}
      {nonBrowser && !aiApiKey && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/8 border border-amber-500/20 flex-shrink-0">
          <Key size={9} className="text-amber-400" />
          <span className="text-[10px] font-mono text-amber-400">Runtime service or AI key needed for {curLang.label}</span>
        </div>
      )}

      {/* ▶ Visualize */}
      <button data-testid="visualize-button" onClick={() => void handleVisualize()} disabled={isRunning}
        className="flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: isRunning ? '#1e2130' : 'linear-gradient(135deg,#00b4d8,#0077b6)', color: isRunning ? '#6b7280' : 'white', boxShadow: isRunning ? 'none' : '0 0 14px rgba(0,180,216,.3)' }}
      >
        {isRunning
          ? <><span className="animate-spin">⟳</span> Running…</>
          : <><Play size={11} fill="white" /> Visualize</>
        }
      </button>

      {/* Playback controls */}
      {executionSteps.length > 0 && (
        <>
          <div className="w-px h-5 bg-bg-hover flex-shrink-0" />
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button onClick={() => setCurrentStepIndex(0)}           className="p-1.5 rounded text-gray-600 hover:text-gray-300 hover:bg-white/4 transition-all" title="First"><SkipBack size={11} /></button>
            <button onClick={prevStep}                                className="p-1.5 rounded text-gray-600 hover:text-gray-300 hover:bg-white/4 transition-all" title="Prev"><SkipBack size={11} /></button>
            <button onClick={handlePlayPause}
              className={`p-1.5 rounded transition-all ${isPlaying ? 'bg-amber-500/15 text-amber-400' : 'bg-green-500/15 text-green-400'}`}>
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            </button>
            <button onClick={nextStep}                                className="p-1.5 rounded text-gray-600 hover:text-gray-300 hover:bg-white/4 transition-all" title="Next"><SkipForward size={11} /></button>
            <button onClick={() => setCurrentStepIndex(executionSteps.length - 1)} className="p-1.5 rounded text-gray-600 hover:text-gray-300 hover:bg-white/4 transition-all" title="Last"><SkipForward size={11} /></button>
            <button onClick={handleReset}                            className="p-1.5 rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Reset"><RotateCcw size={11} /></button>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-16 h-1.5 bg-bg-hover rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg,#00b4d8,#a855f7)' }}
                animate={{ width: `${progress}%` }} transition={{ duration: 0.15 }} />
            </div>
            <span className="text-[10px] font-mono text-gray-600 tabular-nums">
              {currentStepIndex + 1}<span className="text-gray-700">/{executionSteps.length}</span>
            </span>
          </div>

          {/* Speed */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <span className="text-[9px] text-gray-700 font-mono mr-1">speed:</span>
            {([0.25, 0.5, 1, 2] as const).map(s => (
              <button key={s} onClick={() => setPlaybackSpeed(s)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all ${playbackSpeed === s ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-600 hover:text-gray-400'}`}>
                {s === 0.25 ? '¼×' : s === 0.5 ? '½×' : s === 1 ? '1×' : '2×'}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Right: status pill */}
      <div className="ml-auto flex-shrink-0">
        <StatusPill status={executionStatus} lang={curLang.label} />
      </div>
    </header>
  )
}

const StatusPill: React.FC<{ status: string; lang: string }> = ({ status, lang: _lang }) => {
  const cfg: Record<string, { color: string; label: string; pulse: boolean }> = {
    idle:      { color: '#4b5563', label: 'Idle',     pulse: false },
    running:   { color: '#10b981', label: 'Running',  pulse: true  },
    paused:    { color: '#f59e0b', label: 'Paused',   pulse: false },
    completed: { color: '#00d4ff', label: 'Done',     pulse: false },
    error:     { color: '#ef4444', label: 'Error',    pulse: false },
  }
  const c = cfg[status] || cfg.idle
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-bg-tertiary border border-border-subtle text-[10px] font-mono" style={{ color: c.color }}>
      <div className={`w-1.5 h-1.5 rounded-full ${c.pulse ? 'animate-pulse' : ''}`} style={{ background: c.color }} />
      {c.label}
    </div>
  )
}
