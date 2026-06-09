import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, Layers, GitBranch, Layout, Terminal, Activity, Code } from 'lucide-react'
import { useIDEStore, VisualizationTab } from '../../store/ideStore'
import { DSAVisualizer } from '../dsa/DSAVisualizer'
import { VariablesPanel } from './VariablesPanel'
import { CallStackPanel } from './CallStackPanel'
import { GenericCodeViz } from './GenericCodeViz'

const TABS: { id: VisualizationTab; label: string; icon: React.ReactNode }[] = [
  { id: 'dsa',       label: 'Visualizer',  icon: <Activity size={11} /> },
  { id: 'variables', label: 'Variables',   icon: <Layout size={11} /> },
  { id: 'callstack', label: 'Call Stack',  icon: <Layers size={11} /> },
  { id: 'flow',      label: 'Steps',       icon: <GitBranch size={11} /> },
  { id: 'heap',      label: 'Console',     icon: <Terminal size={11} /> },
]

export const VisualizationPanel: React.FC = () => {
  const { activeVizTab, setActiveVizTab, executionSteps, currentStepIndex, consoleOutput } = useIDEStore()
  const currentStep = executionSteps[currentStepIndex]
  const hasDSA = !!currentStep?.dsaState
  const isGenericMode = executionSteps.length > 0 && !hasDSA

  return (
    <div className="panel h-full">
      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
            <BarChart3 size={10} style={{ color: '#a855f7' }} />
          </div>
          <span className="text-gray-500 text-xs font-medium flex-shrink-0">Execution Canvas</span>
          {currentStep && (
            <motion.span key={currentStep.description} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
              className="text-gray-700 text-xs font-mono truncate min-w-0">
              — {currentStep.description}
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isGenericMode && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
              <Code size={8} className="inline mr-1" />live trace
            </span>
          )}
          {executionSteps.length > 0 && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.2)' }}>
              {currentStepIndex + 1}/{executionSteps.length}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-[#1a1d2a] bg-[#0f1117] flex-shrink-0 px-2 gap-0">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveVizTab(tab.id)}
            className={`tab flex items-center gap-1.5 ${activeVizTab === tab.id ? 'tab-active' : ''}`}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden grid-bg relative" style={{ minHeight: 0 }}>
        <AnimatePresence mode="wait">
          <motion.div key={activeVizTab}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="h-full overflow-y-auto"
          >
            {activeVizTab === 'dsa' && (
              hasDSA
                ? <DSAVisualizer dsaState={currentStep?.dsaState} />
                : <GenericCodeViz steps={executionSteps} currentIndex={currentStepIndex} />
            )}
            {activeVizTab === 'variables' && <VariablesPanel variables={currentStep?.variables || []} />}
            {activeVizTab === 'callstack' && <CallStackPanel frames={currentStep?.callStack || []} />}
            {activeVizTab === 'flow'      && <StepsView steps={executionSteps} current={currentStepIndex} onJump={idx => useIDEStore.getState().setCurrentStepIndex(idx)} />}
            {activeVizTab === 'heap'      && <ConsoleView output={consoleOutput} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom status bar */}
      {currentStep && (
        <div className="flex-shrink-0 px-4 py-1.5 status-gradient">
          <motion.p key={currentStep.description} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }}
            className="text-[11px] text-gray-500 font-mono truncate">
            <span className="text-cyan-500/70 mr-1.5">▸</span>{currentStep.description}
          </motion.p>
        </div>
      )}
    </div>
  )
}

// ─── Steps Timeline ───────────────────────────────────────────────────────────
type ExecutionStep = ReturnType<typeof useIDEStore.getState>['executionSteps'][number]

const StepsView: React.FC<{ steps: ExecutionStep[]; current: number; onJump: (i: number) => void }> = ({ steps, current, onJump }) => {
  const containerRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const el = containerRef.current?.querySelector(`[data-step="${current}"]`) as HTMLElement
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [current])

  if (!steps.length) return (
    <div className="flex items-center justify-center h-full text-gray-600 text-sm font-mono">No steps yet</div>
  )

  return (
    <div ref={containerRef} className="p-3 flex flex-col gap-0.5">
      {steps.map((step, i) => (
        <button key={i} data-step={i} onClick={() => onJump(i)}
          className={`w-full text-left flex items-start gap-2 px-2 py-1.5 rounded-lg transition-all text-xs font-mono ${
            i === current ? 'bg-cyan-500/8 border border-cyan-500/20' :
            i < current  ? 'text-gray-600 hover:bg-white/3' :
                           'text-gray-700 hover:bg-white/3'
          }`}
        >
          <span className={`flex-shrink-0 w-5 h-5 rounded text-center leading-5 text-[10px] font-bold ${
            i === current ? 'bg-cyan-500 text-black' :
            i < current  ? 'bg-green-500/20 text-green-400' : 'bg-[#1e2130] text-gray-600'
          }`}>{i + 1}</span>
          <span className={`truncate flex-1 ${i === current ? 'text-cyan-300' : ''}`}>{step.description}</span>
          <span className="flex-shrink-0 text-[10px] text-gray-700 ml-auto">L{step.line}</span>
        </button>
      ))}
    </div>
  )
}

// ─── Console ─────────────────────────────────────────────────────────────────
const ConsoleView: React.FC<{ output: string[] }> = ({ output }) => {
  const endRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [output])

  return (
    <div className="h-full flex flex-col bg-[#090b0f]">
      <div className="px-3 py-1.5 border-b border-[#1a1d2a] flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">stdout</span>
      </div>
      <div className="flex-1 p-3 font-mono text-xs overflow-y-auto">
        {output.length === 0 ? (
          <p className="text-gray-700">$ <span className="animate-pulse">_</span></p>
        ) : (
          <>
            {output.map((line, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.015, 0.3) }}
                className={`py-0.5 leading-relaxed ${
                  line.startsWith('▶') || line.startsWith('▸') ? 'text-cyan-400' :
                  line.startsWith('✅') ? 'text-green-400' :
                  line.startsWith('❌') ? 'text-red-400' :
                  line.startsWith('📊') ? 'text-amber-400' :
                  line.startsWith('──') ? 'text-gray-700' :
                  line.startsWith('[ERROR]') || line.startsWith('[WARN]') ? 'text-red-400' :
                  'text-gray-300'
                }`}
              >
                {line.startsWith('$') ? <><span className="text-green-500">$</span>{line.slice(1)}</> : line}
              </motion.div>
            ))}
            <div ref={endRef} />
          </>
        )}
      </div>
    </div>
  )
}
