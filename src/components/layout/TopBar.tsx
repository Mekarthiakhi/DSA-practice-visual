import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward, Eye, RotateCcw, ChevronDown, Zap, Key, BookOpen } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useIDEStore, Language } from '../../store/ideStore'
import { runCode } from '../../utils/universalEngine'
import { runMultiLang, SupportedLang } from '../../utils/multiLangEngine'
import { SAMPLE_CODES } from '../../utils/executionEngine'
import { GENERAL_SAMPLES, ALL_CATEGORIES } from '../../utils/universalEngine'
import { MULTI_LANG_SAMPLES, MULTI_LANG_CATEGORIES } from '../../utils/multiLangSamples'

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
  { value: 'python',     label: 'Python',     color: '#3776ab', monacoId: 'python',     canBrowser: false },
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
  } = useIDEStore()

  const [showLangPicker, setShowLangPicker]     = useState(false)
  const [showExamples, setShowExamples]          = useState(false)
  const [activeCat, setActiveCat]               = useState('Sorting')
  const [isPlaying, setIsPlaying]               = useState(false)
  const [isRunning, setIsRunning]               = useState(false)
  const playRef = useRef<ReturnType<typeof setInterval>|null>(null)

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
    if (playRef.current) { clearTimeout(playRef.current as unknown as ReturnType<typeof setTimeout>); playRef.current = null }
    setIsPlaying(false)
  }

  const handleVisualize = async () => {
    stopPlay()
    clearOutput()
    setIsRunning(true)
    addOutput('▶  Starting visualization…')

    const currentLang = language as SupportedLang
    const isBrowser = ['javascript', 'typescript'].includes(currentLang)

    try {
      if (isBrowser) {
        // Use existing browser engine for JS/TS
        const result = runCode(code, execMode === 'trace' ? 'interpreter' : execMode === 'dsa' ? 'dsa' : 'auto')
        setExecutionSteps(result.steps)
        setCurrentStepIndex(0)
        setExecutionStatus(result.error ? 'error' : 'paused')
        addOutput(`📊 Mode: ${result.mode === 'dsa' ? 'DSA Visualizer' : 'Live Tracer'}${result.algo ? ` (${result.algo})` : ''}`)
        addOutput(`📋 ${result.steps.length} steps`)
        addOutput('──────────────────────────')
        result.output.forEach(l => addOutput(l))
        if (result.error) addOutput(`❌ ${result.error}`)
      } else {
        // Use multi-lang engine (AI simulation) for Python, Java, C, C++, etc.
        const result = await runMultiLang(code, currentLang, aiApiKey || undefined)
        setExecutionSteps(result.steps)
        setCurrentStepIndex(0)
        setExecutionStatus(result.error ? 'error' : 'paused')

        const modeLabel = result.mode === 'dsa' ? 'DSA Visualizer'
          : result.mode === 'browser' ? 'Browser Tracer'
          : 'AI-Simulated Trace'
        addOutput(`📊 Mode: ${modeLabel} | Language: ${currentLang.toUpperCase()}`)
        addOutput(`📋 ${result.steps.length} execution steps`)
        addOutput('──────────────────────────')
        result.output.forEach(l => addOutput(l))
        if (result.error) addOutput(`❌ ${result.error}`)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      addOutput(`❌ Error: ${msg}`)
      setExecutionStatus('error')
    } finally {
      setIsRunning(false)
    }
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      stopPlay(); setExecutionStatus('paused')
    } else {
      setIsPlaying(true); setExecutionStatus('running')

      const tick = () => {
        const store = useIDEStore.getState()
        const { currentStepIndex: idx, executionSteps: steps } = store
        if (idx >= steps.length - 1) {
          stopPlay(); setExecutionStatus('completed')
          store.addOutput('✅ Playback complete!')
        } else {
          store.setCurrentStepIndex(idx + 1)
          // Re-schedule with possibly updated speed
          const delay = Math.round(1200 / useIDEStore.getState().playbackSpeed)
          playRef.current = setTimeout(tick, delay) as unknown as ReturnType<typeof setInterval>
        }
      }

      const initialDelay = Math.round(1200 / useIDEStore.getState().playbackSpeed)
      playRef.current = setTimeout(tick, initialDelay) as unknown as ReturnType<typeof setInterval>
    }
  }

  const handleReset = () => { stopPlay(); resetExecution() }

  const progress = executionSteps.length > 0
    ? (currentStepIndex / Math.max(executionSteps.length - 1, 1)) * 100 : 0

  const curLang = LANGS.find(l => l.value === language) || LANGS[0]
  const samplesForCat = Object.entries(ALL_SAMPLES_MERGED).filter(([, s]) => s.category === activeCat)
  const nonBrowser = !curLang.canBrowser

  return (
    <header className="h-12 bg-[#0c0e14] border-b border-[#1e2130] flex items-center gap-2 px-3 flex-shrink-0 relative z-[100] select-none">

      {/* Logo */}
      <div className="flex items-center gap-2 mr-1 flex-shrink-0">
        <div className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,rgba(0,180,216,.2),rgba(168,85,247,.2))', border: '1px solid rgba(0,180,216,.4)' }}>
          <Eye size={12} className="text-cyan-400" />
        </div>
        <span className="font-bold text-white text-sm tracking-tight hidden sm:block">AlgoVision</span>
      </div>

      <div className="w-px h-5 bg-[#1e2130] flex-shrink-0" />

      {/* Language Picker */}
      <div className="relative flex-shrink-0" data-dropdown>
        <button
          onClick={() => { setShowLangPicker(!showLangPicker); setShowExamples(false) }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#13151f] border border-[#1e2130] hover:border-[#2a2d3e] transition-all text-xs font-mono text-gray-400 hover:text-white"
        >
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: curLang.color }} />
          <span>{curLang.label}</span>
          <ChevronDown size={9} />
        </button>

        <AnimatePresence>
          {showLangPicker && (
            <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ duration: 0.12 }}
              className="absolute top-full left-0 mt-1 bg-[#0f1117] border border-[#1e2130] rounded-xl shadow-2xl z-[9999] p-1.5 min-w-[200px]">
              <div className="text-[9px] font-mono text-gray-600 uppercase tracking-wider px-2 py-1 mb-0.5">Select Language</div>
              {LANGS.map(lang => (
                <button key={lang.value}
                  onClick={() => { setLanguage(lang.value); setShowLangPicker(false) }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors ${language === lang.value ? 'bg-white/8 text-white' : 'text-gray-500 hover:text-gray-200 hover:bg-white/4'}`}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: lang.color }} />
                  <span className="flex-1 text-left">{lang.label}</span>
                  {lang.canBrowser
                    ? <span className="text-[9px] text-green-500/60 font-mono">browser</span>
                    : <span className="text-[9px] text-amber-500/60 font-mono">AI sim</span>
                  }
                </button>
              ))}
              <div className="mt-1 pt-1 border-t border-[#1e2130] px-2 py-1">
                <p className="text-[9px] text-gray-700 font-mono leading-relaxed">
                  🟢 browser = runs instantly<br/>
                  🟡 AI sim = uses Anthropic API
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
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all text-xs ${showLeetCodePanel ? 'bg-[#1e2130] border-cyan-500/50 text-white' : 'bg-[#13151f] border-[#1e2130] hover:border-[#2a2d3e] text-gray-400 hover:text-white'}`}
        >
          <BookOpen size={11} className={showLeetCodePanel ? 'text-cyan-400' : ''} />
          <span>LeetCode</span>
        </button>
      </div>

      {/* Examples Picker */}
      <div className="relative flex-shrink-0" data-dropdown>
        <button
          onClick={() => { setShowExamples(!showExamples); setShowLangPicker(false) }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#13151f] border border-[#1e2130] hover:border-[#2a2d3e] transition-all text-xs text-gray-400 hover:text-white"
        >
          <Zap size={11} />
          <span>Examples</span>
          <ChevronDown size={9} />
        </button>

        <AnimatePresence>
          {showExamples && (
            <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ duration: 0.12 }}
              className="absolute top-full left-0 mt-1 bg-[#0f1117] border border-[#1e2130] rounded-xl shadow-2xl z-[9999] w-[440px] overflow-hidden">

              {/* Category tabs — scrollable */}
              <div className="flex border-b border-[#1e2130] overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
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
                      className="text-left px-3 py-2 rounded-lg hover:bg-[#13151f] border border-transparent hover:border-[#252836] transition-all group"
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
      <div className="flex items-center bg-[#13151f] border border-[#1e2130] rounded-lg overflow-hidden flex-shrink-0">
        {(['auto', 'dsa', 'trace'] as const).map(m => (
          <button key={m} onClick={() => setExecMode(m)}
            className={`px-2 py-1.5 text-[10px] font-mono transition-all border-r border-[#1e2130] last:border-0 ${
              execMode === m ? 'bg-cyan-500/15 text-cyan-400' : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            {m === 'auto' ? '⚡ Auto' : m === 'dsa' ? '🔢 DSA' : '🔍 Trace'}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-[#1e2130] flex-shrink-0" />

      {/* Non-browser language notice */}
      {nonBrowser && !aiApiKey && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/8 border border-amber-500/20 flex-shrink-0">
          <Key size={9} className="text-amber-400" />
          <span className="text-[10px] font-mono text-amber-400">API key needed for {curLang.label}</span>
        </div>
      )}

      {/* ▶ Visualize */}
      <button onClick={handleVisualize} disabled={isRunning}
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
          <div className="w-px h-5 bg-[#1e2130] flex-shrink-0" />
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
            <div className="w-16 h-1.5 bg-[#1e2130] rounded-full overflow-hidden">
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
            {[0.5, 1, 2, 4].map(s => (
              <button key={s} onClick={() => setPlaybackSpeed(s)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all ${playbackSpeed === s ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-600 hover:text-gray-400'}`}>
                {s}×
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
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#13151f] border border-[#1e2130] text-[10px] font-mono" style={{ color: c.color }}>
      <div className={`w-1.5 h-1.5 rounded-full ${c.pulse ? 'animate-pulse' : ''}`} style={{ background: c.color }} />
      {c.label}
    </div>
  )
}
