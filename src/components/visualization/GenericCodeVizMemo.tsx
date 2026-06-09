/**
 * Generic Code Visualization (Memoized)
 * PHASE 2: Performance optimization with React.memo and useMemo
 */

import { useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExecutionStep, Variable } from '../../store/ideStore'

interface Props {
  steps: ExecutionStep[]
  currentIndex: number
}

function formatVal(val: unknown): { text: string; color: string } {
  if (val === null || val === undefined) return { text: 'null', color: '#6b7280' }
  if (typeof val === 'boolean') return { text: String(val), color: '#a78bfa' }
  if (typeof val === 'number') return { text: String(val), color: '#fbbf24' }
  if (typeof val === 'string') return { text: `"${val}"`, color: '#34d399' }
  if (Array.isArray(val)) {
    const s = `[${(val as unknown[])
      .slice(0, 6)
      .map(v => formatVal(v).text)
      .join(', ')}${val.length > 6 ? ', …' : ''}]`
    return { text: s, color: '#22d3ee' }
  }
  if (typeof val === 'object') {
    try {
      const s = JSON.stringify(val)
      return { text: s.length > 40 ? s.substring(0, 37) + '…' : s, color: '#f472b6' }
    } catch {
      return { text: '[Object]', color: '#f472b6' }
    }
  }
  return { text: String(val), color: '#e8eaf0' }
}

const TYPE_COLOR: Record<string, string> = {
  number: '#fbbf24',
  string: '#34d399',
  boolean: '#a78bfa',
  Array: '#22d3ee',
  object: '#f472b6',
  Map: '#fb923c',
  Set: '#a3e635',
  null: '#6b7280',
  undefined: '#6b7280',
}

/**
 * Variable Card Component (Memoized)
 * Only re-renders if the variable value actually changed
 */
const VariableCard = memo(
  ({ variable, index: _index }: { variable: Variable; index: number }) => {
    const { text, color } = formatVal(variable.value)
    const typeColor = TYPE_COLOR[variable.type] || '#6b7280'

    return (
      <motion.div
        key={variable.name}
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{
          opacity: 1,
          x: 0,
          backgroundColor: variable.changed ? 'rgba(0,212,255,0.04)' : 'transparent',
        }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="rounded-lg border px-3 py-2"
        style={{ borderColor: variable.changed ? 'rgba(0,212,255,0.25)' : '#1e2130' }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xs font-mono text-gray-400">{variable.name}</span>
            <span
              className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold text-white/80"
              style={{ backgroundColor: typeColor + '30' }}
            >
              {variable.type}
            </span>
          </div>
        </div>
        <div className="mt-1 text-xs font-mono" style={{ color }}>
          {text}
        </div>
      </motion.div>
    )
  },
  (prevProps, nextProps) => {
    // Only re-render if the value actually changed
    return JSON.stringify(prevProps.variable.value) === JSON.stringify(nextProps.variable.value)
  }
)

VariableCard.displayName = 'VariableCard'

/**
 * Timeline Component (Memoized)
 * Shows variable changes over execution steps
 */
const VariableTimeline = memo(({ steps, currentIndex: _currentIndex }: { steps: ExecutionStep[]; currentIndex: number }) => {
  const timelineData = useMemo(() => {
    const varChanges: Record<string, number[]> = {}

    steps.forEach((step) => {
      step.variables?.forEach(v => {
        if (!v.name.startsWith('__')) {
          if (!varChanges[v.name]) varChanges[v.name] = []
          varChanges[v.name].push(typeof v.value === 'number' ? v.value : 0)
        }
      })
    })

    return varChanges
  }, [steps])

  if (Object.keys(timelineData).length === 0) return null

  return (
    <div className="mt-4 pt-4 border-t border-gray-700">
      <div className="text-[10px] font-mono text-gray-600 uppercase tracking-wider mb-2">Variable Timeline</div>
      <div className="space-y-2">
        {Object.entries(timelineData).slice(0, 3).map(([name, values]) => (
          <div key={name} className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-500 w-20 truncate">{name}</span>
            <div className="flex-1 h-6 bg-gray-900 rounded flex gap-0.5">
              {values.slice(0, 20).map((val, idx) => (
                <div
                  key={idx}
                  className="flex-1 bg-cyan-500/30 rounded-sm"
                  style={{ opacity: 0.3 + (val / 100) * 0.7, height: '100%' }}
                  title={`Step ${idx}: ${val}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

VariableTimeline.displayName = 'VariableTimeline'

/**
 * Main Component (Memoized)
 */
export const GenericCodeViz = memo(
  ({ steps, currentIndex }: Props) => {
    const step = steps[currentIndex]

    if (!step) {
      return (
        <div className="flex items-center justify-center h-full text-gray-600 text-sm font-mono">
          Run your code to see the visualization
        </div>
      )
    }

    // Memoize filtered variables
    const visibleVariables = useMemo(
      () => step.variables.filter(v => !v.name.startsWith('__')),
      [step.variables]
    )

    // Memoize all variable names seen

    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Variable Cards */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="text-[10px] font-mono text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 inline-block" />
            Live Variables ({visibleVariables.length})
          </div>

          {visibleVariables.length === 0 ? (
            <div className="text-gray-700 text-xs font-mono text-center py-8">No variables in scope</div>
          ) : (
            <div className="grid grid-cols-1 gap-1.5">
              <AnimatePresence mode="popLayout">
                {visibleVariables.map((v, idx) => (
                  <VariableCard key={v.name} variable={v} index={idx} />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Timeline */}
          <VariableTimeline steps={steps} currentIndex={currentIndex} />

          {/* Step Info */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="text-[10px] font-mono text-gray-600 uppercase tracking-wider mb-2">Step Info</div>
            <div className="text-xs text-gray-300">
              <div>Line: {step.line}</div>
              <div className="mt-1 text-gray-500 italic">{step.description}</div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  (prevProps, nextProps) => {
    // Only re-render if currentIndex or steps changed significantly
    return (
      prevProps.currentIndex === nextProps.currentIndex &&
      prevProps.steps.length === nextProps.steps.length
    )
  }
)

GenericCodeViz.displayName = 'GenericCodeViz'
