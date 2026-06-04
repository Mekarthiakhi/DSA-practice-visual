import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StackFrame } from '../../store/ideStore'

interface CallStackPanelProps {
  frames: StackFrame[]
}

export const CallStackPanel: React.FC<CallStackPanelProps> = ({ frames }) => {
  if (!frames.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
        <span className="text-2xl">📚</span>
        <p className="text-text-muted text-xs">Call stack is empty</p>
      </div>
    )
  }

  return (
    <div className="p-3 flex flex-col gap-2">
      {/* Stack indicator */}
      <div className="flex items-center gap-2 mb-1">
        <div className="flex-1 h-px bg-border" />
        <span className="text-text-muted text-[10px] font-mono uppercase tracking-wider">TOP OF STACK</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <AnimatePresence mode="popLayout">
        {[...frames].reverse().map((frame, index) => (
          <motion.div
            key={frame.id}
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
            className={`rounded-lg border overflow-hidden ${
              frame.isActive
                ? 'border-accent-cyan/30 bg-accent-cyan/5'
                : 'border-border bg-bg-tertiary/50'
            }`}
          >
            {/* Frame header */}
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2">
                {frame.isActive && (
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-accent-cyan"
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
                <span className={`text-xs font-mono font-semibold ${
                  frame.isActive ? 'text-accent-cyan' : 'text-text-secondary'
                }`}>
                  {frame.name}()
                </span>
                {frame.isActive && (
                  <span className="badge bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 text-[10px]">
                    active
                  </span>
                )}
              </div>
              <span className="text-text-muted text-[10px] font-mono">
                ln {frame.line}
              </span>
            </div>

            {/* Frame variables */}
            {frame.variables.length > 0 && (
              <div className="px-3 pb-2 flex flex-col gap-1">
                {frame.variables.slice(0, 4).map(v => (
                  <div key={v.name} className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-text-muted">{v.name}</span>
                    <span className="text-text-secondary">{JSON.stringify(v.value)?.substring(0, 20)}</span>
                  </div>
                ))}
                {frame.variables.length > 4 && (
                  <span className="text-text-muted text-[10px]">+{frame.variables.length - 4} more...</span>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="flex items-center gap-2 mt-1">
        <div className="flex-1 h-px bg-border" />
        <span className="text-text-muted text-[10px] font-mono uppercase tracking-wider">BOTTOM</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="mt-2 text-center">
        <span className="text-text-muted text-[11px] font-mono">
          Depth: {frames.length} frame{frames.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
