import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Variable } from '../../store/ideStore'

interface VariablesPanelProps {
  variables: Variable[]
}

function formatValue(val: unknown): { display: string; color: string } {
  if (val === null) return { display: 'null', color: '#8b92a8' }
  if (val === undefined) return { display: 'undefined', color: '#8b92a8' }
  if (typeof val === 'boolean') return { display: String(val), color: '#a855f7' }
  if (typeof val === 'number') return { display: String(val), color: '#f59e0b' }
  if (typeof val === 'string') return { display: `"${val}"`, color: '#10b981' }
  if (Array.isArray(val)) {
    if (val.length <= 8) return { display: `[${val.join(', ')}]`, color: '#00d4ff' }
    return { display: `[${val.slice(0, 6).join(', ')}, ... +${val.length - 6}]`, color: '#00d4ff' }
  }
  if (typeof val === 'object') return { display: JSON.stringify(val).substring(0, 40), color: '#ec4899' }
  return { display: String(val), color: '#e8eaf0' }
}

const TYPE_BADGE_COLORS: Record<string, string> = {
  number: 'bg-accent-orange/10 text-accent-orange border-accent-orange/20',
  string: 'bg-accent-green/10 text-accent-green border-accent-green/20',
  boolean: 'bg-accent-purple/10 text-accent-purple border-accent-purple/20',
  Array: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20',
  object: 'bg-accent-pink/10 text-accent-pink border-accent-pink/20',
  undefined: 'bg-bg-tertiary text-text-muted border-border',
  unknown: 'bg-bg-tertiary text-text-muted border-border',
}

export const VariablesPanel: React.FC<VariablesPanelProps> = ({ variables }) => {
  if (!variables.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
        <span className="text-2xl">📦</span>
        <p className="text-text-muted text-xs">No variables in scope yet</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1 p-3">
      <AnimatePresence mode="popLayout">
        {variables.map((variable) => {
          const { display, color } = formatValue(variable.value)
          const badgeClass = TYPE_BADGE_COLORS[variable.type] || TYPE_BADGE_COLORS.unknown

          return (
            <motion.div
              key={`${variable.scope}-${variable.name}`}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{
                opacity: 1,
                x: 0,
                backgroundColor: variable.changed ? 'rgba(0, 212, 255, 0.05)' : 'transparent'
              }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="rounded-lg border overflow-hidden"
              style={{
                borderColor: variable.changed ? 'rgba(0, 212, 255, 0.3)' : '#1e2130'
              }}
            >
              <div className="flex items-start gap-2 px-3 py-2">
                {variable.changed && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-1.5 h-1.5 rounded-full bg-accent-cyan mt-1.5 flex-shrink-0"
                  />
                )}
                {!variable.changed && <div className="w-1.5 flex-shrink-0" />}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-text-primary text-xs font-mono font-semibold truncate">
                      {variable.name}
                    </span>
                    <span className={`badge border text-[10px] px-1.5 py-0.5 ${badgeClass}`}>
                      {variable.type}
                    </span>
                    {variable.scope !== 'global' && (
                      <span className="text-text-muted text-[10px] font-mono">{variable.scope}</span>
                    )}
                  </div>
                  <div
                    className="text-xs font-mono truncate"
                    style={{ color }}
                    title={display}
                  >
                    {display}
                  </div>
                </div>
              </div>

              {/* Array mini-visualization */}
              {Array.isArray(variable.value) && variable.value.length > 0 && variable.value.length <= 12 && (
                <div className="px-3 pb-2 flex items-center gap-1">
                  {(variable.value as unknown[]).map((v, i) => (
                    <div
                      key={i}
                      className="flex-1 h-5 bg-bg-tertiary border border-border rounded text-center text-[10px] font-mono text-text-secondary flex items-center justify-center"
                      style={{ maxWidth: 32 }}
                    >
                      {String(v).substring(0, 3)}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
