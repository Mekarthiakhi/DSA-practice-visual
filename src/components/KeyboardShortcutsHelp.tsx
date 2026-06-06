/**
 * Keyboard Shortcuts Help Modal
 * PHASE 3: Keyboard shortcuts help panel for better UX
 */

import React, { useState, useEffect } from 'react'
import { X, Keyboard } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Shortcut {
  key: string
  action: string
  description: string
}

const SHORTCUTS: Shortcut[] = [
  { key: 'Space', action: 'Play / Pause', description: 'Start or pause code execution' },
  { key: '→', action: 'Next Step', description: 'Move to the next execution step' },
  { key: '←', action: 'Previous Step', description: 'Move to the previous execution step' },
  { key: 'Ctrl + Enter', action: 'Run Code', description: 'Execute the current code' },
  { key: 'Ctrl + S', action: 'Save', description: 'Save code to local storage' },
  { key: '?', action: 'Show Help', description: 'Toggle this shortcuts panel' },
  { key: 'Escape', action: 'Close Modal', description: 'Close any open modal' },
]

interface Props {
  isOpen: boolean
  onClose: () => void
}

export const KeyboardShortcutsHelp: React.FC<Props> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        onClose()
      }
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyPress)
      return () => window.removeEventListener('keydown', handleKeyPress)
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700 sticky top-0 bg-gray-900">
              <div className="flex items-center gap-2">
                <Keyboard size={20} className="text-cyan-400" />
                <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-800 rounded transition-colors"
                aria-label="Close"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Shortcuts Grid */}
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SHORTCUTS.map((shortcut, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800/80 transition-colors"
                  >
                    {/* Key Badge */}
                    <div className="flex-shrink-0">
                      <kbd className="px-2.5 py-1.5 text-xs font-semibold text-gray-900 bg-gray-300 rounded">
                        {shortcut.key}
                      </kbd>
                    </div>

                    {/* Action & Description */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-cyan-300">{shortcut.action}</div>
                      <div className="text-xs text-gray-400 mt-1">{shortcut.description}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-xs text-gray-500">
                  💡 Tip: Press <kbd className="px-1.5 py-0.5 text-xs bg-gray-800 rounded">?</kbd> anytime to toggle
                  this help panel
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
