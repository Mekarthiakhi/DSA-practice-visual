/**
 * Generic Code Visualization
 * Shows variable timeline, value changes, and console output
 * for arbitrary code that isn't a known DSA pattern.
 */
import React from 'react'
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
    const s = `[${(val as unknown[]).slice(0, 6).map(v => formatVal(v).text).join(', ')}${val.length > 6 ? ', …' : ''}]`
    return { text: s, color: '#22d3ee' }
  }
  if (typeof val === 'object') {
    try {
      const s = JSON.stringify(val)
      return { text: s.length > 40 ? s.substring(0, 37) + '…' : s, color: '#f472b6' }
    } catch { return { text: '[Object]', color: '#f472b6' } }
  }
  return { text: String(val), color: '#e8eaf0' }
}

const TYPE_COLOR: Record<string, string> = {
  number: '#fbbf24', string: '#34d399', boolean: '#a78bfa',
  Array: '#22d3ee', object: '#f472b6', Map: '#fb923c', Set: '#a3e635',
  null: '#6b7280', undefined: '#6b7280',
}

export const GenericCodeViz: React.FC<Props> = ({ steps, currentIndex }) => {
  const step = steps[currentIndex]
  if (!step) return (
    <div className="flex items-center justify-center h-full text-gray-600 text-sm font-mono">
      Run your code to see the visualization
    </div>
  )

  const vars = step.variables.filter(v => !v.name.startsWith('__'))

  // Collect all variable names seen across all steps up to current
  const allVarNames = new Set<string>()
  for (let i = 0; i <= currentIndex; i++) {
    steps[i]?.variables?.forEach(v => { if (!v.name.startsWith('__')) allVarNames.add(v.name) })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Variable Cards */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="text-[10px] font-mono text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 inline-block" />
          Live Variables
        </div>

        {vars.length === 0 ? (
          <div className="text-gray-700 text-xs font-mono text-center py-8">No variables in scope</div>
        ) : (
          <div className="grid grid-cols-1 gap-1.5">
            <AnimatePresence mode="popLayout">
              {vars.map(v => {
                const { text, color } = formatVal(v.value)
                const typeColor = TYPE_COLOR[v.type] || '#6b7280'
                return (
                  <motion.div key={v.name}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0, backgroundColor: v.changed ? 'rgba(0,212,255,0.04)' : 'transparent' }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="rounded-lg border px-3 py-2"
                    style={{ borderColor: v.changed ? 'rgba(0,212,255,0.25)' : '#1e2130' }}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      {v.changed && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#00d4ff' }} />
                      )}
                      <span className="font-mono font-bold text-xs text-gray-200">{v.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ color: typeColor, background: typeColor + '15', border: `1px solid ${typeColor}25` }}>
                        {v.type}
                      </span>
                      <span className="text-[10px] text-gray-600 font-mono ml-auto">{v.scope}</span>
                    </div>
                    <div className="font-mono text-xs truncate" style={{ color }}>
                      {text}
                    </div>

                    {/* Array mini-bar if small numeric array */}
                    {Array.isArray(v.value) && (v.value as unknown[]).length > 0 && (v.value as unknown[]).length <= 16 &&
                      typeof (v.value as unknown[])[0] === 'number' && (
                      <div className="flex items-end gap-0.5 mt-2 h-8">
                        {(v.value as number[]).map((num, i) => {
                          const maxV = Math.max(...(v.value as number[]).map(Math.abs), 1)
                          const h = Math.max(2, (Math.abs(num) / maxV) * 28)
                          return (
                            <motion.div key={i}
                              animate={{ height: h }}
                              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                              className="flex-1 rounded-t-sm"
                              style={{ height: h, background: num < 0 ? '#ef4444' : '#00d4ff', opacity: 0.7, minWidth: 3, maxWidth: 20 }}
                            />
                          )
                        })}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Variable History Chart */}
        {vars.length > 0 && (
          <div className="mt-4">
            <div className="text-[10px] font-mono text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />
              Value Timeline
            </div>
            <VariableTimeline steps={steps} currentIndex={currentIndex} varNames={[...allVarNames].slice(0, 5)} />
          </div>
        )}
      </div>

      {/* Step description bar */}
      <div className="flex-shrink-0 status-gradient px-4 py-1.5">
        <motion.p key={step.description} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-[11px] text-gray-500 font-mono truncate">
          <span className="text-cyan-500/60 mr-1">▸</span>{step.description}
        </motion.p>
      </div>
    </div>
  )
}

// ─── Variable Timeline ────────────────────────────────────────────────────────
const VariableTimeline: React.FC<{ steps: ExecutionStep[]; currentIndex: number; varNames: string[] }> = ({ steps, currentIndex, varNames }) => {
  const W = 400
  const ROW_H = 28
  const H = varNames.length * ROW_H + 20

  return (
    <div className="overflow-x-auto rounded-lg border border-[#1e2130] bg-[#0a0c12]">
      <svg width={W} height={H} className="font-mono" style={{ minWidth: 300 }}>
        {varNames.map((name, ri) => {
          const y = ri * ROW_H + 14

          // Collect value changes for this variable
          const changes: Array<{ stepIdx: number; value: unknown }> = []
          for (let i = 0; i < steps.length; i++) {
            const v = steps[i].variables?.find(v2 => v2.name === name)
            if (v && (changes.length === 0 || JSON.stringify(v.value) !== JSON.stringify(changes[changes.length - 1].value))) {
              changes.push({ stepIdx: i, value: v.value })
            }
          }

          const totalSteps = Math.max(steps.length - 1, 1)
          return (
            <g key={name}>
              {/* Label */}
              <text x={4} y={y + 4} fontSize={9} fill="#6b7280" fontFamily="JetBrains Mono,monospace">{name}</text>

              {/* Change dots */}
              {changes.map((ch, ci) => {
                const x = 60 + (ch.stepIdx / totalSteps) * (W - 80)
                const isCurrent = ci === changes.findIndex(c => c.stepIdx > currentIndex) - 1 ||
                  (ci === changes.length - 1 && ch.stepIdx <= currentIndex)
                const { text } = formatVal(ch.value)
                const { color } = formatVal(ch.value)
                return (
                  <g key={ci}>
                    <circle cx={x} cy={y} r={isCurrent ? 5 : 3}
                      fill={isCurrent ? color : '#252836'}
                      stroke={color} strokeWidth={isCurrent ? 1.5 : 1}
                      opacity={ch.stepIdx <= currentIndex ? 1 : 0.25}
                    />
                    {isCurrent && (
                      <text x={x} y={y - 8} fontSize={8} fill={color} textAnchor="middle" fontFamily="JetBrains Mono,monospace">
                        {text.substring(0, 12)}
                      </text>
                    )}
                  </g>
                )
              })}

              {/* Timeline line */}
              <line x1={60} y1={y} x2={W - 20} y2={y} stroke="#1e2130" strokeWidth={1} />

              {/* Progress indicator */}
              <line x1={60} y1={y} x2={60 + (currentIndex / totalSteps) * (W - 80)} y2={y}
                stroke="#22d3ee" strokeWidth={1} opacity={0.4} />
            </g>
          )
        })}
      </svg>
    </div>
  )
}
