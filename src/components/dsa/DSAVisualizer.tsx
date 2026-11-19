import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DSAState, DSANode, DSAEdge } from '../../store/ideStore'
import { computeTreeLayout, computeHeapLayout } from '../../utils/treeLayout'

interface DSAVisualizerProps {
  dsaState: DSAState | null | undefined
}

// ─── Color Palette ───────────────────────────────────────────────────────────
export const HL: Record<string, { bg: string, border: string, text: string, glow?: string, shadow?: string }> = {
  active:     { bg: '#083344', border: '#06b6d4', text: '#22d3ee', glow: '0 0 20px rgba(6,182,212,0.6)' },
  comparing:  { bg: '#3b2210', border: '#f59e0b', text: '#fbbf24', glow: '0 0 16px rgba(245,158,11,0.5)' },
  swapping:   { bg: '#3b1016', border: '#ef4444', text: '#f87171', glow: '0 0 16px rgba(239,68,68,0.5)' },
  visited:    { bg: '#162b25', border: '#10b981', text: '#34d399', glow: '0 0 12px rgba(16,185,129,0.2)' },
  found:      { bg: '#0d2a18', border: '#10b981', text: '#10b981', glow: '0 0 20px rgba(16,185,129,0.7)', shadow: '#10b981' },
  current:    { bg: '#1a1040', border: '#a855f7', text: '#a855f7', glow: '0 0 16px rgba(168,85,247,0.6)' },
  pivot:      { bg: '#2a1a00', border: '#f97316', text: '#f97316', glow: '0 0 16px rgba(249,115,22,0.7)' },
  sorted:     { bg: '#0a1a12', border: '#34d399', text: '#34d399' },
  processing: { bg: '#1a1640', border: '#818cf8', text: '#818cf8', glow: '0 0 12px rgba(129,140,248,0.5)' },
  heapifying: { bg: '#101e40', border: '#6366f1', text: '#6366f1', glow: '0 0 12px rgba(99,102,241,0.5)' },
  skipped:    { bg: '#1c1917', border: '#57534e', text: '#a8a29e' },
  none:       { bg: '#13151f', border: '#252836', text: '#6b7280' },
}

const Legend = ({ items }: { items: Array<{ label: string; hl: DSANode['highlight'] }> }) => (
  <div className="flex items-center gap-3 flex-wrap justify-center">
    {items.map(({ label, hl }) => {
      const c = HL[hl!]
      return (
        <div key={label} className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: c.bg, border: `1.5px solid ${c.border}` }} />
          <span className="text-xs" style={{ color: c.text }}>{label}</span>
        </div>
      )
    })}
  </div>
)

// ─── TRACKING VARIABLES BAR ────────────────────────────────────────────────
export const TrackingVarsBar: React.FC<{ trackingVars?: Record<string, unknown> }> = ({ trackingVars }) => {
  if (!trackingVars || Object.keys(trackingVars).length === 0) return null

  const formatVal = (val: unknown, key: string): string => {
    if (val === Infinity || val === Number.POSITIVE_INFINITY) return '∞'
    if (val === -Infinity || val === Number.NEGATIVE_INFINITY) return '-∞'
    if (val === null || val === undefined) {
      if (key.toLowerCase().includes('min')) return '∞'
      if (key.toLowerCase().includes('max')) return '-∞'
      return 'None'
    }
    if (typeof val === 'boolean') return val ? 'true' : 'false'
    return String(val)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap justify-center mt-3 pt-2 border-t border-[#1e2130]/60 max-w-xl">
      {Object.entries(trackingVars).map(([varName, val]) => (
        <div key={varName} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#131522] border border-[#25283d] text-[11px] font-mono shadow-sm">
          <span className="text-cyan-400 font-semibold">{varName}</span>
          <span className="text-gray-600">:</span>
          <span className="text-gray-200 font-bold">{formatVal(val, varName)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── ARRAY / SORTING VIEW ────────────────────────────────────────────────────
const ArrayView: React.FC<{ nodes: DSANode[]; auxiliaryData?: Record<string, any>; comparisons?: number; swaps?: number; message?: string; pointer?: number; pointerName?: string; pointer2?: number; pointer2Name?: string; pointer3?: number; pointer3Name?: string; rangeStart?: number; rangeEnd?: number; pivotIndex?: number }> = ({
  nodes, auxiliaryData, comparisons, swaps, message, pointer, pointerName, pointer2, pointer2Name, pointer3, pointer3Name, rangeStart, rangeEnd, pivotIndex
}) => {
  if (!nodes.length) return <div className="flex items-center justify-center h-full text-gray-500 text-sm">No data</div>

  // Detect if array contains strings (non-numeric values)
  const isStringArray = nodes.some(n => isNaN(Number(n.value)) && typeof n.value === 'string')

  // Explicit override via auxiliaryData
  const explicitRender = auxiliaryData?.renderAs as 'boxes' | 'bars' | undefined

  // Determine whether this is a sorting visualization:
  // - Explicitly marked isSorting in auxiliaryData
  // - Or has pivotIndex (quick sort)
  // - Or has heapSize (heap sort)
  // - Or has sorting statistics (swaps is a defined number >= 0) AND is not explicitly a search problem
  const isExplicitSearch = auxiliaryData?.isSearch === true ||
    pointerName === 'mid' || pointer2Name === 'L' || pointer3Name === 'R' ||
    (rangeStart !== undefined && rangeEnd !== undefined && swaps === undefined)

  const isSorting = !isStringArray && !isExplicitSearch && (
    auxiliaryData?.isSorting === true ||
    pivotIndex !== undefined ||
    auxiliaryData?.heapSize !== undefined ||
    (swaps !== undefined && !auxiliaryData?.isGeneric)
  )

  const renderAsBoxes = explicitRender === 'boxes'
    ? true
    : explicitRender === 'bars'
      ? false
      : isStringArray || !isSorting
  const maxVal = renderAsBoxes ? 1 : Math.max(...nodes.map(n => Math.abs(Number(n.value)) || 0), 1)
  const sc = auxiliaryData?.stringCompare
  const outerLoopPointer = auxiliaryData?.outerLoopPointer as { index: number; name: string } | undefined

  // Helper to gather all non-overlapping pointers for an element index
  const getPointersForIdx = (idx: number): Array<{ name: string; color: string }> => {
    const list: Array<{ name: string; color: string }> = []
    const seen = new Set<string>()

    const add = (name: string | undefined, color: string) => {
      if (name && !seen.has(name)) {
        seen.add(name)
        list.push({ name, color })
      }
    }

    if (pointer === idx) {
      const name = pointerName || 'i'
      const color = name === 'mid' ? 'amber' : 'cyan'
      add(name, color)
    }

    if (pointer2 === idx) {
      const name = pointer2Name || 'j'
      const color = name === 'L' || name === 'left' ? 'cyan' : 'purple'
      add(name, color)
    }

    if (pointer3 === idx) {
      const name = pointer3Name || 'k'
      const color = name === 'R' || name === 'right' ? 'purple' : 'emerald'
      add(name, color)
    }

    if (Array.isArray(auxiliaryData?.pointers)) {
      for (const p of auxiliaryData.pointers) {
        if (p && p.index === idx && p.name) {
          add(p.name, p.color || 'cyan')
        }
      }
    }

    return list
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-4 select-none overflow-auto">
      {message && (
        <motion.div key={message} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="px-4 py-2 bg-[#13151f] border border-[#252836] rounded-lg text-sm text-center max-w-lg text-gray-300 font-mono">
          {message}
        </motion.div>
      )}

      {/* String Comparison Panel (word vs target character comparison) */}
      {sc && (
        <div className="flex flex-col items-center gap-3 w-full">
          <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">{sc.str1Name} vs {sc.str2Name} — character comparison</div>
          <div className="flex flex-col gap-2">
            {[{ name: sc.str1Name, val: sc.str1Val }, { name: sc.str2Name, val: sc.str2Val }].map((s, sIdx) => (
              <div key={sIdx} className="flex items-center gap-1">
                <span className="text-[10px] text-gray-500 font-mono w-14 text-right mr-2 flex-shrink-0">{s.name}</span>
                {s.val.split('').map((char: string, i: number) => {
                  const isComparing = sc.idx === i
                  const char1 = sc.str1Val[i]
                  const char2 = sc.str2Val[i]
                  const isMatch = isComparing && char1 === char2
                  const isMismatch = isComparing && char1 !== char2
                  const hlKey = isMatch ? 'found' : isMismatch ? 'swapping' : isComparing ? 'comparing' : 'none'
                  const c = HL[hlKey]
                  return (
                    <motion.div key={i} layout
                      animate={{
                        backgroundColor: c.bg,
                        borderColor: c.border,
                        boxShadow: c.glow || 'none'
                      }}
                      transition={{ duration: 0.25 }}
                      className="w-7 h-9 flex items-center justify-center rounded-md border-2 relative"
                    >
                      <span className="text-sm font-mono font-bold" style={{ color: c.text }}>{char}</span>
                      {isComparing && sIdx === 1 && (
                        <div className="absolute -bottom-5 flex flex-col items-center z-10">
                          <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[5px] border-l-transparent border-r-transparent border-b-amber-400" />
                          <span className="text-[8px] text-amber-400 font-mono">j={i}</span>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            ))}
          </div>
          {sc.idx !== undefined && sc.str1Val[sc.idx] !== undefined && sc.str2Val[sc.idx] !== undefined && (
            <div className="text-[11px] font-mono mt-1">
              <span className="text-gray-500">{sc.str1Name}[{sc.idx}]=</span>
              <span className={sc.str1Val[sc.idx] === sc.str2Val[sc.idx] ? 'text-emerald-400' : 'text-red-400'}>&#39;{sc.str1Val[sc.idx]}&#39;</span>
              <span className="text-gray-600 mx-1">{sc.str1Val[sc.idx] === sc.str2Val[sc.idx] ? '===' : '!=='}</span>
              <span className={sc.str1Val[sc.idx] === sc.str2Val[sc.idx] ? 'text-emerald-400' : 'text-red-400'}>&#39;{sc.str2Val[sc.idx]}&#39;</span>
              <span className="text-gray-500">={sc.str2Name}[{sc.idx}]</span>
              {sc.str1Val[sc.idx] === sc.str2Val[sc.idx] && <span className="text-emerald-400 ml-2">✓ match</span>}
              {sc.str1Val[sc.idx] !== sc.str2Val[sc.idx] && <span className="text-red-400 ml-2">✗ mismatch</span>}
            </div>
          )}
        </div>
      )}

      {/* Array items - render as word boxes for strings or generic code, bars for sorting algorithms */}
      {renderAsBoxes ? (
        <div
          className={`flex items-center gap-2 relative flex-wrap justify-center ${outerLoopPointer ? 'pt-9' : 'pt-2'}`}
          style={{ minHeight: outerLoopPointer ? 88 : 60 }}
        >
          <AnimatePresence mode="popLayout">
            {nodes.map((node, idx) => {
              const c = HL[node.highlight || 'none']
              const ptrs = getPointersForIdx(idx)
              const isEliminated = (
                (rangeStart !== undefined && idx < rangeStart) ||
                (rangeEnd !== undefined && idx > rangeEnd) ||
                node.highlight === 'skipped'
              ) && node.highlight !== 'found'

              return (
                <motion.div key={node.id} layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: isEliminated ? 0.28 : 1,
                    scale: isEliminated ? 0.94 : 1,
                    filter: isEliminated ? 'grayscale(75%) brightness(0.75)' : 'none',
                    boxShadow: isEliminated ? 'none' : (c.glow || 'none')
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                  className="flex flex-col items-center gap-1 relative"
                >
                  {outerLoopPointer?.index === idx && (
                    <div className="absolute -top-8 flex flex-col items-center z-10">
                      <div className="px-2 py-0.5 bg-slate-900/90 border border-dashed border-slate-500 rounded text-[9px] text-slate-300 font-mono whitespace-nowrap">
                        {outerLoopPointer.name}={outerLoopPointer.index} · outer fixed
                      </div>
                      <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-slate-400" />
                    </div>
                  )}
                  <motion.div
                    className="px-3 py-2 rounded-lg border-2 relative overflow-hidden cursor-default"
                    animate={{
                      backgroundColor: isEliminated ? '#0e1017' : c.bg,
                      borderColor: isEliminated ? '#1f2230' : c.border
                    }}
                    transition={{ duration: 0.25 }}
                    initial={false}
                  >
                    <motion.span className="text-sm font-mono font-bold transition-colors duration-200"
                      animate={{ color: isEliminated ? '#4b5563' : c.text }}>
                      {node.value}
                    </motion.span>
                    {(node.highlight === 'comparing' || node.highlight === 'swapping' || node.highlight === 'active') && !isEliminated && (
                      <motion.div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/10"
                        animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.7, repeat: Infinity }} />
                    )}
                  </motion.div>
                  <span className="text-[10px] text-gray-600 font-mono">[{idx}]</span>

                  {/* Range boundary indicators for Binary Search and Sliding Window */}
                  {rangeStart !== undefined && rangeEnd !== undefined && rangeStart <= rangeEnd && (
                    <>
                      {idx === rangeStart && (
                        <div className="absolute -top-5 left-0 text-[10px] text-cyan-400 font-mono font-bold whitespace-nowrap z-10">
                          [ {rangeStart === rangeEnd ? 'L=R ]' : 'L'}
                        </div>
                      )}
                      {idx === rangeEnd && idx !== rangeStart && (
                        <div className="absolute -top-5 right-0 text-[10px] text-purple-400 font-mono font-bold whitespace-nowrap z-10">
                          R ]
                        </div>
                      )}
                    </>
                  )}

                  {/* Pointers with collision-free unified rendering */}
                  {ptrs.length > 0 && (
                    <div className="absolute -bottom-7 flex flex-col items-center z-20 pointer-events-none">
                      <div className={`w-0 h-0 border-l-[4px] border-r-[4px] border-b-[5px] border-l-transparent border-r-transparent ${
                        ptrs.some(p => p.color === 'amber') ? 'border-b-amber-400' :
                        ptrs.some(p => p.color === 'purple') ? 'border-b-purple-400' :
                        ptrs.some(p => p.color === 'emerald') ? 'border-b-emerald-400' :
                        'border-b-cyan-400'
                      }`} />
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono mt-0.5 whitespace-nowrap shadow-md bg-[#131626]/95 border border-slate-700/80">
                        {ptrs.map((p, pIdx) => {
                          const textColor =
                            p.color === 'amber' ? 'text-amber-300 font-bold' :
                            p.color === 'purple' ? 'text-purple-300 font-bold' :
                            p.color === 'emerald' ? 'text-emerald-300 font-bold' :
                            'text-cyan-300 font-bold'
                          return (
                            <React.Fragment key={p.name}>
                              {pIdx > 0 && <span className="text-gray-500 text-[8px] font-bold">·</span>}
                              <span className={textColor}>{p.name}</span>
                            </React.Fragment>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className={`flex items-end gap-1.5 relative ${outerLoopPointer ? 'pt-9' : 'pt-2'} pb-8`} style={{ minHeight: outerLoopPointer ? 220 : 190 }}>
          {rangeStart !== undefined && rangeEnd !== undefined && rangeStart <= rangeEnd && (
            <div className="absolute bottom-8 h-0.5 bg-cyan-500/30 rounded" style={{ left: rangeStart * 46, width: (rangeEnd - rangeStart + 1) * 46, bottom: -2 }} />
          )}
          <AnimatePresence mode="sync">
            {nodes.map((node, idx) => {
              const c = HL[node.highlight || 'none']
              const val = Math.max(Number(node.value) || 1, 1)
              const h = Math.max(24, (val / maxVal) * 180)
              const isPivot = pivotIndex === idx
              const ptrs = getPointersForIdx(idx)
              const isEliminated = (
                (rangeStart !== undefined && idx < rangeStart) ||
                (rangeEnd !== undefined && idx > rangeEnd) ||
                node.highlight === 'skipped'
              ) && node.highlight !== 'found'

              return (
                <motion.div key={node.id} layout
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{
                    opacity: isEliminated ? 0.28 : 1,
                    scaleY: 1,
                    filter: isEliminated ? 'grayscale(75%) brightness(0.75)' : 'none',
                    boxShadow: isEliminated ? 'none' : (c.glow || 'none')
                  }}
                  exit={{ opacity: 0, scaleY: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="flex flex-col items-center gap-1 origin-bottom relative"
                >
                  {outerLoopPointer?.index === idx && (
                    <div className="absolute -top-8 flex flex-col items-center z-10">
                      <div className="px-2 py-0.5 bg-slate-900/90 border border-dashed border-slate-500 rounded text-[9px] text-slate-300 font-mono whitespace-nowrap">
                        {outerLoopPointer.name}={outerLoopPointer.index} · outer fixed
                      </div>
                      <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-slate-400" />
                    </div>
                  )}
                  <motion.span className="text-[11px] font-mono font-bold transition-colors duration-200"
                    animate={{ color: isEliminated ? '#4b5563' : c.text }} style={{ minWidth: 24, textAlign: 'center' }}>
                    {node.value}
                  </motion.span>
                  {/* Range boundary indicators for Binary Search and Sliding Window in bar mode */}
                  {rangeStart !== undefined && rangeEnd !== undefined && rangeStart <= rangeEnd && (
                    <>
                      {idx === rangeStart && (
                        <div className="absolute -top-5 left-0 text-[10px] text-cyan-400 font-mono font-bold whitespace-nowrap z-20">
                          [ {rangeStart === rangeEnd ? 'L=R ]' : 'L'}
                        </div>
                      )}
                      {idx === rangeEnd && idx !== rangeStart && (
                        <div className="absolute -top-5 right-0 text-[10px] text-purple-400 font-mono font-bold whitespace-nowrap z-20">
                          R ]
                        </div>
                      )}
                    </>
                  )}
                  <motion.div
                    className="w-9 rounded-t relative overflow-hidden cursor-default"
                    style={{ height: h }}
                    animate={{
                      backgroundColor: isEliminated ? '#0e1017' : c.bg,
                      borderColor: isEliminated ? '#1f2230' : c.border
                    }}
                    transition={{ duration: 0.2 }}
                    initial={false}
                  >
                    <div className="absolute inset-0 border rounded-t" style={{ borderColor: isEliminated ? '#1f2230' : c.border }} />
                    {isPivot && <div className="absolute top-0 left-0 right-0 h-0.5 bg-orange-400" />}
                    {(node.highlight === 'comparing' || node.highlight === 'swapping' || node.highlight === 'active') && !isEliminated && (
                      <motion.div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/10"
                        animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.7, repeat: Infinity }} />
                    )}
                  </motion.div>
                  {/* Index label */}
                  <span className="text-[10px] text-gray-600 font-mono">{idx}</span>
                  {/* Pointers with collision-free unified rendering */}
                  {ptrs.length > 0 && (
                    <div className="absolute -bottom-8 flex flex-col items-center z-20 pointer-events-none">
                      <div className={`w-0 h-0 border-l-[4px] border-r-[4px] border-b-[5px] border-l-transparent border-r-transparent ${
                        ptrs.some(p => p.color === 'amber') ? 'border-b-amber-400' :
                        ptrs.some(p => p.color === 'purple') ? 'border-b-purple-400' :
                        ptrs.some(p => p.color === 'emerald') ? 'border-b-emerald-400' :
                        'border-b-cyan-400'
                      }`} />
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono mt-0.5 whitespace-nowrap shadow-md bg-[#131626]/95 border border-slate-700/80">
                        {ptrs.map((p, pIdx) => {
                          const textColor =
                            p.color === 'amber' ? 'text-amber-300 font-bold' :
                            p.color === 'purple' ? 'text-purple-300 font-bold' :
                            p.color === 'emerald' ? 'text-emerald-300 font-bold' :
                            'text-cyan-300 font-bold'
                          return (
                            <React.Fragment key={p.name}>
                              {pIdx > 0 && <span className="text-gray-500 text-[8px] font-bold">·</span>}
                              <span className={textColor}>{p.name}</span>
                            </React.Fragment>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Tracking variables row for Greedy, Sliding Window, and Binary Search */}
      <TrackingVarsBar trackingVars={auxiliaryData?.trackingVars} />

      {/* Stats - only for numeric sorting algorithms */}
      {!renderAsBoxes && (
        <div className="flex gap-6 text-xs font-mono mt-8">
          {comparisons !== undefined && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              <span className="text-gray-500">Comparisons:</span>
              <motion.span key={comparisons} initial={{ scale: 1.4, color: '#f59e0b' }} animate={{ scale: 1, color: '#e8eaf0' }} className="font-bold">{comparisons}</motion.span>
            </div>
          )}
          {swaps !== undefined && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
              <span className="text-gray-500">Swaps:</span>
              <motion.span key={swaps} initial={{ scale: 1.4, color: '#ef4444' }} animate={{ scale: 1, color: '#e8eaf0' }} className="font-bold">{swaps}</motion.span>
            </div>
          )}
        </div>
      )}

      {renderAsBoxes && !isStringArray ? (
        <Legend items={[
          { label: 'Active', hl: 'active' },
          { label: 'Comparing', hl: 'comparing' },
          { label: 'Swapping', hl: 'swapping' },
          { label: 'Eliminated', hl: 'skipped' },
          { label: 'Found', hl: 'found' },
        ]} />
      ) : isStringArray ? (
        <Legend items={[
          { label: 'Current', hl: 'active' },
          { label: 'Checking', hl: 'comparing' },
          { label: 'Match', hl: 'found' },
          { label: 'Skipped', hl: 'skipped' },
        ]} />
      ) : (
        <Legend items={[
          { label: 'Comparing', hl: 'comparing' },
          { label: 'Swapping', hl: 'swapping' },
          { label: 'Active', hl: 'active' },
          { label: 'Sorted', hl: 'sorted' },
          { label: 'Pivot', hl: 'pivot' },
        ]} />
      )}
    </div>
  )
}
// ─── MATRIX / 2D GRID VIEW ──────────────────────────────────────────────────
const MatrixView: React.FC<{
  nodes: DSANode[]
  auxiliaryData?: Record<string, any>
  message?: string
  queueItems?: (string | number)[]
}> = ({ nodes, auxiliaryData, message, queueItems }) => {
  const metadata = auxiliaryData?.matrix as {
    name?: string
    rows?: number
    columns?: number
    rowPointer?: number
    rowPointerName?: string
    columnPointer?: number
    columnPointerName?: string
  } | undefined
  const rows = metadata?.rows ?? Math.max(0, ...nodes.map(node => Number(node.y) + 1))
  const columns = metadata?.columns ?? Math.max(0, ...nodes.map(node => Number(node.x) + 1))
  const cells = new Map(nodes.map(node => [`${node.y ?? 0}:${node.x ?? 0}`, node]))

  if (!rows || !columns) {
    return <div className="flex items-center justify-center h-full text-gray-500 text-sm">No matrix data</div>
  }

  const hasPointer = metadata?.rowPointer !== undefined && metadata?.columnPointer !== undefined

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 p-4 select-none overflow-auto">
      {message && (
        <motion.div
          key={message}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-1.5 bg-[#13151f] border border-[#252836] rounded-lg text-sm text-center text-gray-300 font-mono"
        >
          {message}
        </motion.div>
      )}

      {hasPointer && (
        <div className="flex items-center gap-2 px-3 py-1 bg-[#0d2233] border border-cyan-500/30 rounded-full text-xs font-mono text-cyan-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Current: [{metadata?.rowPointerName || 'row'} = {metadata?.rowPointer}, {metadata?.columnPointerName || 'col'} = {metadata?.columnPointer}]</span>
        </div>
      )}

      <div className="flex items-start justify-center gap-6 w-full max-w-full overflow-auto py-2">
        {/* 2D Grid Table */}
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `28px repeat(${columns}, minmax(44px, 1fr))` }}>
          <span />
          {Array.from({ length: columns }, (_, columnIndex) => {
            const isColActive = metadata?.columnPointer === columnIndex
            return (
              <span
                key={`column-${columnIndex}`}
                className={`text-center text-[11px] font-mono transition-colors ${
                  isColActive ? 'text-cyan-300 font-bold' : 'text-gray-500'
                }`}
              >
                {isColActive && metadata?.columnPointerName
                  ? `${metadata.columnPointerName}=`
                  : ''}{columnIndex}{isColActive ? '↓' : ''}
              </span>
            )
          })}

          {Array.from({ length: rows }, (_, rowIndex) => {
            const isRowActive = metadata?.rowPointer === rowIndex
            return (
              <React.Fragment key={`row-${rowIndex}`}>
                <span
                  className={`flex items-center justify-end pr-1 text-[11px] font-mono transition-colors ${
                    isRowActive ? 'text-cyan-300 font-bold' : 'text-gray-500'
                  }`}
                >
                  {isRowActive && metadata?.rowPointerName
                    ? `${metadata.rowPointerName}=`
                    : ''}{rowIndex}{isRowActive ? '→' : ''}
                </span>
                {Array.from({ length: columns }, (_, columnIndex) => {
                  const node = cells.get(`${rowIndex}:${columnIndex}`)
                  const isCurrentCell = metadata?.rowPointer === rowIndex && metadata?.columnPointer === columnIndex
                  const hl = isCurrentCell && (!node?.highlight || node.highlight === 'none')
                    ? 'active'
                    : (node?.highlight || 'none')
                  const color = HL[hl]
                  const rawVal = node?.value
                  const displayVal = typeof rawVal === 'boolean'
                    ? (rawVal ? 'T' : 'F')
                    : (rawVal ?? '')

                  return (
                    <motion.div
                      key={`${rowIndex}:${columnIndex}`}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: isCurrentCell ? 1.05 : 1 }}
                      className={`min-w-11 h-11 px-2 rounded-md border-2 flex items-center justify-center font-mono text-sm relative transition-shadow ${
                        isCurrentCell ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#0f1117] z-10' : ''
                      }`}
                      style={{
                        backgroundColor: color.bg,
                        borderColor: isCurrentCell ? '#06b6d4' : color.border,
                        color: isCurrentCell ? '#22d3ee' : color.text,
                        boxShadow: isCurrentCell ? '0 0 16px rgba(6,182,212,0.6)' : color.glow,
                      }}
                      title={`[${rowIndex}][${columnIndex}] = ${displayVal}`}
                    >
                      {displayVal}
                    </motion.div>
                  )
                })}
              </React.Fragment>
            )
          })}
        </div>

        {/* Queue Items Bar for BFS on Matrix */}
        {queueItems && queueItems.length > 0 && (
          <div className="w-28 flex-shrink-0 flex flex-col gap-2 max-h-[380px] overflow-y-auto bg-[#0b0e17] p-2 rounded-lg border border-[#1f2438]">
            <div className="text-[10px] text-gray-400 font-mono uppercase tracking-wider text-center font-semibold border-b border-[#1f2438] pb-1">
              Queue ({queueItems.length})
            </div>
            <AnimatePresence mode="popLayout">
              {queueItems.map((item, i) => (
                <motion.div
                  key={`${JSON.stringify(item)}-${i}`}
                  layout
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  className="relative px-2 py-1.5 bg-[#0d2233] border border-cyan-500/40 rounded text-center text-xs font-mono text-cyan-300"
                >
                  {i === 0 && (
                    <span className="absolute -top-1.5 -left-1 text-[8px] bg-cyan-600 text-white px-1 rounded font-bold uppercase">
                      Front
                    </span>
                  )}
                  {typeof item === 'object' && item !== null
                    ? `[${Array.isArray(item) ? (item as unknown[]).join(',') : JSON.stringify(item)}]`
                    : String(item)}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Legend items={[
        { label: 'Current cell', hl: 'active' },
        { label: 'Visited', hl: 'visited' },
        { label: 'Read', hl: 'comparing' },
        { label: 'Written', hl: 'swapping' },
      ]} />
    </div>
  )
}

const StringStackView: React.FC<{
  nodes: DSANode[]
  stackItems?: (string | number)[]
  message?: string
  pointer?: number
  pointerName?: string
  pointer2?: number
  pointer2Name?: string
  stringName?: string
  stackName?: string
  rangeStart?: number
  rangeEnd?: number
  auxiliaryData?: Record<string, any>
}> = ({ nodes, stackItems, message, pointer, pointerName, pointer2, pointer2Name, stringName, stackName, rangeStart, rangeEnd, auxiliaryData }) => {
  const items = stackItems || []

  return (
    <div className="flex flex-col h-full gap-3 p-4 select-none overflow-auto">
      {message && (
        <motion.div key={message} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="px-4 py-2 bg-[#13151f] border border-[#252836] rounded-lg text-sm text-center text-gray-300 font-mono flex-shrink-0">
          {message}
        </motion.div>
      )}

      <div className="flex flex-wrap gap-4 flex-1 min-h-0 overflow-auto">
        {/* String visualization */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 min-w-[200px] min-h-0">
          <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider self-start">{stringName || 'string'}</div>
          <div className="flex items-center justify-center gap-1.5 flex-wrap pt-6">
            {nodes.map((node, idx) => {
              const c = HL[node.highlight || 'none']
              const isLeftPtr = pointer === idx
              const isRightPtr = pointer2 === idx
              const isBothPtrs = isLeftPtr && isRightPtr
              return (
                <motion.div key={node.id} layout
                  animate={{ backgroundColor: c.bg, borderColor: c.border, boxShadow: c.glow || 'none' }}
                  transition={{ duration: 0.3 }}
                  className="w-10 h-12 flex flex-col items-center justify-center rounded-lg border-2 relative"
                  style={{ borderColor: c.border, backgroundColor: c.bg }}
                >
                  <span className="text-lg font-mono font-bold" style={{ color: c.text }}>{node.value}</span>
                  <span className="absolute -bottom-4 text-[9px] text-gray-600 font-mono">{idx}</span>
                  {/* Range boundary indicators for Sliding Window */}
                  {rangeStart !== undefined && rangeEnd !== undefined && rangeStart <= rangeEnd && (
                    <>
                      {idx === rangeStart && (
                        <div className="absolute -top-11 left-0 text-[10px] text-cyan-400 font-mono font-bold whitespace-nowrap z-20">
                          [ {rangeStart === rangeEnd ? 'L=R ]' : 'L'}
                        </div>
                      )}
                      {idx === rangeEnd && idx !== rangeStart && (
                        <div className="absolute -top-11 right-0 text-[10px] text-purple-400 font-mono font-bold whitespace-nowrap z-20">
                          R ]
                        </div>
                      )}
                    </>
                  )}
                  {isLeftPtr && (
                    <div className={`absolute -top-6 flex flex-col items-center z-10 ${isBothPtrs ? '-ml-5' : ''}`}>
                      <div className="px-1.5 py-0.5 bg-cyan-900/60 border border-cyan-500/50 rounded text-[9px] text-cyan-300 font-mono mb-0.5">{pointerName || 'L'}</div>
                      <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-cyan-400" />
                    </div>
                  )}
                  {isRightPtr && (
                    <div className={`absolute -top-6 flex flex-col items-center z-10 ${isBothPtrs ? 'ml-5' : ''}`}>
                      <div className="px-1.5 py-0.5 bg-purple-900/60 border border-purple-500/50 rounded text-[9px] text-purple-300 font-mono mb-0.5">{pointer2Name || 'R'}</div>
                      <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-purple-400" />
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Dynamic variable info */}
          <div className="flex items-center gap-3 flex-wrap justify-center mt-1">
            {pointer !== undefined && (
              <div className="flex items-center gap-1 text-[11px] font-mono">
                <span className="text-cyan-500 font-semibold">{pointerName || 'left'}</span>
                <span className="text-gray-600">=</span>
                <motion.span key={`l-${pointer}`} initial={{ scale: 1.3, color: '#00d4ff' }} animate={{ scale: 1, color: '#e8eaf0' }} className="font-bold">{pointer}</motion.span>
              </div>
            )}
            {pointer2 !== undefined && (
              <div className="flex items-center gap-1 text-[11px] font-mono">
                <span className="text-purple-400 font-semibold">{pointer2Name || 'right'}</span>
                <span className="text-gray-600">=</span>
                <motion.span key={`r-${pointer2}`} initial={{ scale: 1.3, color: '#a855f7' }} animate={{ scale: 1, color: '#e8eaf0' }} className="font-bold">{pointer2}</motion.span>
              </div>
            )}
            {pointer !== undefined && pointer2 !== undefined && (
              <div className="flex items-center gap-1 text-[11px] font-mono">
                <span className="text-emerald-400 font-semibold">window</span>
                <span className="text-gray-600">=</span>
                <span className="text-emerald-300 font-bold">"{nodes.slice(Math.min(pointer, pointer2), Math.max(pointer, pointer2) + 1).map(n => n.value).join('')}"</span>
                <span className="text-gray-600">({Math.abs(pointer2 - pointer) + 1})</span>
              </div>
            )}
          </div>

          <Legend items={[
            { label: 'Window', hl: 'active' },
            { label: 'Duplicate', hl: 'swapping' },
            { label: 'Shrinking', hl: 'comparing' },
            { label: 'Valid', hl: 'found' },
            { label: 'Visited', hl: 'visited' },
          ]} />
        </div>

        {/* Set / Stack panel */}
        <div className="w-full sm:w-32 flex-shrink-0 flex flex-col items-center gap-2 min-w-[120px]">
          <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">{stackName || 'Set'}</div>
          <div className="text-[10px] text-cyan-400/60 font-mono mb-1 tracking-wider">
            {items.length > 0 ? `${items.length} item${items.length > 1 ? 's' : ''}` : ''}
          </div>
          <div className="w-24 border-l-2 border-r-2 border-b-2 border-gray-600 rounded-b-lg min-h-12 flex flex-col-reverse overflow-hidden">
            <AnimatePresence mode="popLayout">
              {items.map((item, i) => {
                const isTop = i === items.length - 1
                const c = isTop ? HL.active : HL.visited
                return (
                  <motion.div key={`${item}-${i}`}
                    layout
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0, backgroundColor: c.bg, borderColor: c.border, boxShadow: isTop ? c.glow : 'none' }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="border-t-2 py-1.5 text-center font-mono font-bold text-sm"
                    style={{ borderColor: c.border, color: c.text }}
                  >
                    {item}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
          {items.length === 0 && <div className="w-24 h-12 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center text-gray-600 text-xs font-mono">empty</div>}
        </div>
      </div>
      <TrackingVarsBar trackingVars={auxiliaryData?.trackingVars} />
    </div>
  )
}


// ─── STRING + HASHMAP VIEW ────────────────────────────────────────────────
const StringHashMapView: React.FC<{
  nodes: DSANode[]
  hashTable?: Record<string, unknown>
  message?: string
  pointer?: number
  pointerName?: string
  pointer2?: number
  pointer2Name?: string
  stringName?: string
  hashTableName?: string
  hashTableLabel?: string
  rangeStart?: number
  rangeEnd?: number
  auxiliaryData?: Record<string, any>
}> = ({ nodes, hashTable, message, pointer, pointerName, pointer2, pointer2Name, stringName, hashTableName, hashTableLabel, rangeStart, rangeEnd, auxiliaryData }) => {
  const entries = hashTable ? Object.entries(hashTable) : []

  return (
    <div className="flex flex-col h-full gap-3 p-4 select-none overflow-auto">
      {message && (
        <motion.div key={message} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="px-4 py-2 bg-[#13151f] border border-[#252836] rounded-lg text-sm text-center text-gray-300 font-mono flex-shrink-0">
          {message}
        </motion.div>
      )}

      <div className="flex flex-wrap gap-4 flex-1 min-h-0 overflow-auto">
        {/* String visualization */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 min-w-[200px] min-h-0">
          <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider self-start">{stringName || 'string'}</div>
          <div className="flex items-center justify-center gap-1.5 flex-wrap pt-6">
            {nodes.map((node, idx) => {
              const c = HL[node.highlight || 'none']
              const isLeftPtr = pointer === idx
              const isRightPtr = pointer2 === idx
              const isBothPtrs = isLeftPtr && isRightPtr
              return (
                <motion.div key={node.id} layout
                  animate={{ backgroundColor: c.bg, borderColor: c.border, boxShadow: c.glow || 'none' }}
                  transition={{ duration: 0.3 }}
                  className="w-12 h-14 flex flex-col items-center justify-center rounded-lg border-2 relative"
                  style={{ borderColor: c.border, backgroundColor: c.bg }}
                >
                  <span className="text-xl font-mono font-bold" style={{ color: c.text }}>{node.value}</span>
                  <span className="absolute -bottom-5 text-[10px] text-gray-600 font-mono">{idx}</span>
                  {/* Range boundary indicators for Sliding Window */}
                  {rangeStart !== undefined && rangeEnd !== undefined && rangeStart <= rangeEnd && (
                    <>
                      {idx === rangeStart && (
                        <div className="absolute -top-12 left-0 text-[10px] text-cyan-400 font-mono font-bold whitespace-nowrap z-20">
                          [ {rangeStart === rangeEnd ? 'L=R ]' : 'L'}
                        </div>
                      )}
                      {idx === rangeEnd && idx !== rangeStart && (
                        <div className="absolute -top-12 right-0 text-[10px] text-purple-400 font-mono font-bold whitespace-nowrap z-20">
                          R ]
                        </div>
                      )}
                    </>
                  )}
                  {isLeftPtr && (
                    <div className={`absolute -top-7 flex flex-col items-center z-10 ${isBothPtrs ? '-ml-6' : ''}`}>
                      <div className="px-1.5 py-0.5 bg-cyan-900/60 border border-cyan-500/50 rounded text-[9px] text-cyan-300 font-mono mb-0.5">{pointerName || 'L'}</div>
                      <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-cyan-400" />
                    </div>
                  )}
                  {isRightPtr && (
                    <div className={`absolute -top-7 flex flex-col items-center z-10 ${isBothPtrs ? 'ml-6' : ''}`}>
                      <div className="px-1.5 py-0.5 bg-purple-900/60 border border-purple-500/50 rounded text-[9px] text-purple-300 font-mono mb-0.5">{pointer2Name || 'R'}</div>
                      <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-purple-400" />
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Dynamic variable info */}
          <div className="flex items-center gap-3 flex-wrap justify-center mt-3">
            {pointer !== undefined && (
              <div className="flex items-center gap-1 text-[11px] font-mono">
                <span className="text-cyan-500 font-semibold">{pointerName || 'left'}</span>
                <span className="text-gray-600">=</span>
                <motion.span key={`l-${pointer}`} initial={{ scale: 1.3, color: '#00d4ff' }} animate={{ scale: 1, color: '#e8eaf0' }} className="font-bold">{pointer}</motion.span>
              </div>
            )}
            {pointer2 !== undefined && (
              <div className="flex items-center gap-1 text-[11px] font-mono">
                <span className="text-purple-400 font-semibold">{pointer2Name || 'right'}</span>
                <span className="text-gray-600">=</span>
                <motion.span key={`r-${pointer2}`} initial={{ scale: 1.3, color: '#a855f7' }} animate={{ scale: 1, color: '#e8eaf0' }} className="font-bold">{pointer2}</motion.span>
              </div>
            )}
            {pointer !== undefined && pointer2 !== undefined && (
              <div className="flex items-center gap-1 text-[11px] font-mono">
                <span className="text-emerald-400 font-semibold">window</span>
                <span className="text-gray-600">=</span>
                <span className="text-emerald-300 font-bold">"{nodes.slice(Math.min(pointer, pointer2), Math.max(pointer, pointer2) + 1).map(n => n.value).join('')}"</span>
                <span className="text-gray-600">({Math.abs(pointer2 - pointer) + 1})</span>
              </div>
            )}
          </div>

          <Legend items={[
            { label: 'Window', hl: 'active' },
            { label: 'Match', hl: 'found' },
            { label: 'Checking', hl: 'comparing' },
            { label: 'Visited', hl: 'visited' },
          ]} />
        </div>

        {/* HashMap panel */}
        <div className="w-full sm:w-44 flex-shrink-0 flex flex-col gap-2 min-w-[150px]">
          <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">{hashTableName || 'hash map'}</div>
          <div className="text-[9px] text-gray-700 font-mono">{hashTableLabel || 'key → value'}</div>
          <div className="flex flex-col gap-1.5 overflow-auto" style={{ maxHeight: 220 }}>
            <AnimatePresence mode="popLayout">
              {entries.length === 0 ? (
                <div className="text-gray-700 text-xs font-mono px-2 py-3 text-center border border-dashed border-gray-700 rounded-lg">
                  empty
                </div>
              ) : entries.map(([key, val]) => (
                <motion.div key={key}
                  layout
                  initial={{ opacity: 0, x: 20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -10, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  className="flex items-center justify-between gap-2 bg-[#0d1b2a] border border-cyan-500/30 rounded-lg px-3 py-2"
                  style={{ boxShadow: '0 0 8px rgba(0,212,255,0.08)' }}
                >
                  <span className="text-cyan-400 text-xs font-mono font-bold">{key}</span>
                  {val !== '✓' && <span className="text-gray-600 text-[10px] font-mono">→</span>}
                  <span className="text-amber-400 text-xs font-mono font-bold">{String(val)}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <TrackingVarsBar trackingVars={auxiliaryData?.trackingVars} />
    </div>
  )
}

// ─── STRING VIEW ─────────────────────────────────────────────────────────────
const StringView: React.FC<{
  nodes: DSANode[]
  message?: string
  pointer?: number
  pointerName?: string
  pointer2?: number
  pointer2Name?: string
  rangeStart?: number
  rangeEnd?: number
  auxiliaryData?: Record<string, any>
}> = ({ nodes, message, pointer, pointerName, pointer2, pointer2Name, rangeStart, rangeEnd, auxiliaryData }) => (
  <div className="flex flex-col items-center justify-center h-full gap-8 p-6 select-none overflow-auto">
    {message && (
      <motion.div key={message} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="px-4 py-2 bg-[#13151f] border border-[#252836] rounded-lg text-sm text-gray-300 font-mono text-center">
        {message}
      </motion.div>
    )}
    <div className="flex items-center gap-1 pt-6">
      {nodes.map((node, idx) => {
        const c = HL[node.highlight || 'none']
        return (
          <motion.div key={node.id} layout
            animate={{ backgroundColor: c.bg, borderColor: c.border, boxShadow: c.glow || 'none' }}
            transition={{ duration: 0.3 }}
            className="w-12 h-14 flex items-center justify-center rounded-lg border-2 relative"
            style={{ borderColor: c.border, backgroundColor: c.bg }}
          >
            <span className="text-xl font-mono font-bold" style={{ color: c.text }}>{node.value}</span>
            <span className="absolute -bottom-5 text-[10px] text-gray-600 font-mono">{idx}</span>
            {/* Range boundary indicators for Sliding Window */}
            {rangeStart !== undefined && rangeEnd !== undefined && rangeStart <= rangeEnd && (
              <>
                {idx === rangeStart && (
                  <div className="absolute -top-12 left-0 text-[10px] text-cyan-400 font-mono font-bold whitespace-nowrap z-20">
                    [ {rangeStart === rangeEnd ? 'L=R ]' : 'L'}
                  </div>
                )}
                {idx === rangeEnd && idx !== rangeStart && (
                  <div className="absolute -top-12 right-0 text-[10px] text-purple-400 font-mono font-bold whitespace-nowrap z-20">
                    R ]
                  </div>
                )}
              </>
            )}
            {pointer === idx && pointer2 === idx ? (
              <div className="absolute -top-7 flex flex-col items-center z-20">
                <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-[#1a1829] border border-amber-500/60 rounded text-[9px] font-mono mb-0.5 shadow-lg">
                  <span className="text-cyan-300">{pointerName || 'L'}</span>
                  <span className="text-gray-500">:</span>
                  <span className="text-purple-300">{pointer2Name || 'R'}</span>
                </div>
                <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-amber-400" />
              </div>
            ) : (
              <>
                {pointer === idx && (
                  <div className="absolute -top-7 flex flex-col items-center z-10">
                    <div className="px-1.5 py-0.5 bg-cyan-900/60 border border-cyan-500/50 rounded text-[9px] text-cyan-300 font-mono mb-0.5">{pointerName || 'ptr'}</div>
                    <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-cyan-400" />
                  </div>
                )}
                {pointer2 === idx && (
                  <div className="absolute -top-7 flex flex-col items-center z-10">
                    <div className="px-1.5 py-0.5 bg-purple-900/60 border border-purple-500/50 rounded text-[9px] text-purple-300 font-mono mb-0.5">{pointer2Name || 'ptr2'}</div>
                    <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-purple-400" />
                  </div>
                )}
              </>
            )}
          </motion.div>
        )
      })}
    </div>
    <div className="mt-4 text-sm text-gray-400 font-mono bg-[#13151f] px-4 py-2 rounded-lg border border-[#252836]">
      "{nodes.map(n => n.value).join('')}"
    </div>
    <TrackingVarsBar trackingVars={auxiliaryData?.trackingVars} />
    <Legend items={[{ label: 'Left ptr', hl: 'comparing' }, { label: 'Right ptr', hl: 'comparing' }, { label: 'Swapped', hl: 'found' }]} />
  </div>
)

// ─── LINKED LIST VIEW ────────────────────────────────────────────────────────
interface LinkedListViewProps {
  nodes: DSANode[]
  edges?: DSAEdge[]
  message?: string
  auxiliaryData?: Record<string, unknown>
}

const BADGE_PALETTE: Record<string, { bg: string; border: string; text: string }> = {
  prev:      { bg: '#3b0764', border: '#a855f7', text: '#d8b4fe' },
  p:         { bg: '#3b0764', border: '#a855f7', text: '#d8b4fe' },
  curr:      { bg: '#083344', border: '#06b6d4', text: '#67e8f9' },
  current:   { bg: '#083344', border: '#06b6d4', text: '#67e8f9' },
  next:      { bg: '#172554', border: '#3b82f6', text: '#93c5fd' },
  nextnode:  { bg: '#172554', border: '#3b82f6', text: '#93c5fd' },
  nexttemp:  { bg: '#172554', border: '#3b82f6', text: '#93c5fd' },
  temp:      { bg: '#172554', border: '#3b82f6', text: '#93c5fd' },
  tmp1:      { bg: '#172554', border: '#3b82f6', text: '#93c5fd' },
  tmp2:      { bg: '#431407', border: '#f97316', text: '#fdba74' },
  slow:      { bg: '#064e3b', border: '#10b981', text: '#6ee7b7' },
  fast:      { bg: '#881337', border: '#f43f5e', text: '#fda4af' },
  dummy:     { bg: '#1e293b', border: '#64748b', text: '#cbd5e1' },
  head:      { bg: '#312e81', border: '#6366f1', text: '#c7d2fe' },
  list1:     { bg: '#134e4a', border: '#14b8a6', text: '#5eead4' },
  l1:        { bg: '#134e4a', border: '#14b8a6', text: '#5eead4' },
  list2:     { bg: '#2e1065', border: '#8b5cf6', text: '#c4b5fd' },
  l2:        { bg: '#2e1065', border: '#8b5cf6', text: '#c4b5fd' },
  merged:    { bg: '#064e3b', border: '#10b981', text: '#86efac' },
  first:     { bg: '#134e4a', border: '#14b8a6', text: '#5eead4' },
  second:    { bg: '#4c0519', border: '#ec4899', text: '#fbcfe8' },
  removed:   { bg: '#450a0a', border: '#ef4444', text: '#fca5a5' },
}

const getBadgeStyle = (label: string) => {
  const key = label.toLowerCase().replace(/[^a-z0-9]/g, '')
  return BADGE_PALETTE[key] || { bg: '#1f2937', border: '#4b5563', text: '#d1d5db' }
}

const LinkedListView: React.FC<LinkedListViewProps> = ({ nodes, edges, message, auxiliaryData: _auxiliaryData }) => {
  if (!nodes || nodes.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500 text-sm font-mono">Empty linked list</div>
  }

  // 1. Compute node coordinates (use provided x/y or auto-layout in rows)
  const layoutNodes = nodes.map((n, idx) => {
    let x = n.x
    let y = n.y
    if (x === undefined || y === undefined) {
      x = 80 + idx * 135
      y = 140
    }
    return { ...n, x, y }
  })

  // 2. Synthesize edges if none provided for linear chain
  let effectiveEdges = edges ? [...edges] : []
  if (effectiveEdges.length === 0 && layoutNodes.length > 1) {
    const rows = new Map<number, typeof layoutNodes>()
    layoutNodes.forEach(n => {
      const r = rows.get(n.y) || []
      r.push(n)
      rows.set(n.y, r)
    })
    rows.forEach(rowNodes => {
      const sorted = [...rowNodes].sort((a, b) => a.x - b.x)
      for (let i = 0; i < sorted.length - 1; i++) {
        effectiveEdges.push({
          id: `auto-${sorted[i].id}-${sorted[i+1].id}`,
          from: sorted[i].id,
          to: sorted[i+1].id,
          directed: true
        })
      }
    })
  }

  // 3. Detect cycle indicators
  const cycleEdge = effectiveEdges.find(e => 
    e.highlight || 
    e.label?.toLowerCase().includes('cycle') || 
    (() => {
      const fromN = layoutNodes.find(n => n.id === e.from)
      const toN = layoutNodes.find(n => n.id === e.to)
      return !!(fromN && toN && fromN.x > toN.x && Math.abs(fromN.y - toN.y) < 30 && fromN.x - toN.x > 180)
    })()
  )

  const slowFastMeetingNode = layoutNodes.find(n => {
    const l = (n.label || '').toLowerCase()
    return l.includes('slow') && l.includes('fast')
  })

  // 4. Compute viewBox bounds with comfortable padding for badges and cycle arch
  const allX = layoutNodes.map(n => n.x)
  const allY = layoutNodes.map(n => n.y)
  const minX = Math.min(...allX) - 80
  const maxX = Math.max(...allX) + 160
  const minY = Math.min(...allY) - 100
  const maxY = Math.max(...allY) + 90
  const W = Math.max(720, maxX - minX)
  const H = Math.max(340, maxY - minY)
  const viewBox = `${minX} ${minY} ${W} ${H}`

  // Nodes with no outgoing edges (terminal nodes pointing to null)
  const outgoingFrom = new Set(effectiveEdges.map(e => e.from))
  const terminalNodes = layoutNodes.filter(n => {
    const isRemoved = n.highlight === 'skipped' || (n.label || '').toLowerCase().includes('removed')
    return !isRemoved && !outgoingFrom.has(n.id)
  })

  return (
    <div className="flex flex-col h-full w-full select-none overflow-hidden bg-[#0a0c14]">
      {/* Top message and alert banners */}
      <div className="flex flex-col items-center gap-2 p-3 flex-shrink-0 z-10 border-b border-[#1b1f2e]">
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-1.5 bg-[#121524] border border-[#252b42] rounded-lg text-xs text-gray-200 font-mono text-center shadow-lg"
          >
            {message}
          </motion.div>
        )}

        {(cycleEdge || slowFastMeetingNode) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3 py-1 bg-rose-950/60 border border-rose-500/60 rounded-full text-xs font-mono text-rose-300 shadow-md shadow-rose-900/20"
          >
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            <span className="font-semibold">
              {slowFastMeetingNode
                ? `⚡ Collision Point: slow & fast meet at node (${slowFastMeetingNode.value}) — Cycle Confirmed!`
                : `🔄 Cycle Detected: tail node loops back to node (${layoutNodes.find(n => n.id === cycleEdge?.to)?.value ?? 'loop'})`}
            </span>
          </motion.div>
        )}
      </div>

      {/* SVG Canvas with auto-scroll */}
      <div className="flex-1 w-full overflow-auto relative p-4 flex items-center justify-center">
        <svg
          width={W}
          height={H}
          viewBox={viewBox}
          className="max-w-none transition-all duration-300 ease-out"
          style={{ minWidth: 600, minHeight: 280 }}
        >
          <defs>
            {/* Arrowhead Markers */}
            <marker id="ll-marker-default" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#4b5563" />
            </marker>
            <marker id="ll-marker-active" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#06b6d4" />
            </marker>
            <marker id="ll-marker-visited" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#10b981" />
            </marker>
            <marker id="ll-marker-reversed" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#a855f7" />
            </marker>
            <marker id="ll-marker-cycle" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
              <polygon points="0 0, 9 3.5, 0 7" fill="#f43f5e" />
            </marker>
            <marker id="ll-marker-skip" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" />
            </marker>

            {/* Glow Filter for Cycle / Active */}
            <filter id="ll-glow-cycle" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ─── EDGES ──────────────────────────────────────────────────────── */}
          {effectiveEdges.map((edge) => {
            const from = layoutNodes.find(n => n.id === edge.from)
            const to = layoutNodes.find(n => n.id === edge.to)
            if (!from || !to) return null

            const isCycle = 
              edge.highlight || 
              edge.label?.toLowerCase().includes('cycle') || 
              (from.x > to.x && Math.abs(from.y - to.y) < 30 && from.x - to.x > 180)
            
            const isReversedAdjacent = 
              !isCycle && from.x > to.x && Math.abs(from.y - to.y) < 30 && from.x - to.x <= 180

            const isSkip = 
              !isCycle && from.x < to.x && Math.abs(from.y - to.y) < 30 && to.x - from.x > 180

            const isCrossRow = 
              Math.abs(from.y - to.y) >= 30

            // 1. CYCLE LOOP ARROW (Arching over the top)
            if (isCycle) {
              const archHeight = Math.min(85, 45 + Math.abs(from.x - to.x) * 0.12)
              const topY = Math.min(from.y, to.y) - 24 - archHeight
              const pathD = `M ${from.x} ${from.y - 24} C ${from.x} ${topY}, ${to.x} ${topY}, ${to.x} ${to.y - 24}`
              const midX = (from.x + to.x) / 2
              const midY = topY

              return (
                <g key={edge.id} className="cursor-pointer">
                  <motion.path
                    d={pathD}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="2.5"
                    strokeDasharray="6 3"
                    markerEnd="url(#ll-marker-cycle)"
                    filter="url(#ll-glow-cycle)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                  {/* Cycle Badge on Apex */}
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect x="-42" y="-11" width="84" height="22" rx="11" fill="#4c0519" stroke="#f43f5e" strokeWidth="1.5" />
                    <text textAnchor="middle" dominantBaseline="central" fill="#fda4af" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
                      ↺ Cycle Loop
                    </text>
                  </g>
                </g>
              )
            }

            // 2. SKIP ARROW (Curves over an unlinked/removed node)
            if (isSkip) {
              const startX = from.x + 25
              const startY = from.y - 20
              const endX = to.x - 25
              const endY = to.y - 20
              const archY = from.y - 55
              const pathD = `M ${startX} ${startY} C ${startX + 30} ${archY}, ${endX - 30} ${archY}, ${endX} ${endY}`

              return (
                <motion.path
                  key={edge.id}
                  d={pathD}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeDasharray="5 3"
                  markerEnd="url(#ll-marker-skip)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                />
              )
            }

            // 3. REVERSED ADJACENT ARROW (Points left from curr to prev)
            if (isReversedAdjacent) {
              const startX = from.x - 38
              const startY = from.y
              const endX = to.x + 38
              const endY = to.y
              const pathD = `M ${startX} ${startY} L ${endX} ${endY}`

              return (
                <motion.path
                  key={edge.id}
                  d={pathD}
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="2"
                  markerEnd="url(#ll-marker-reversed)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )
            }

            // 4. CROSS-ROW S-CURVE (e.g. Merge Two Lists dummy -> list1/list2)
            if (isCrossRow) {
              const startX = from.x + 38
              const startY = from.y
              const endX = to.x - 38
              const endY = to.y
              const midX = (startX + endX) / 2
              const pathD = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`

              return (
                <motion.path
                  key={edge.id}
                  d={pathD}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  markerEnd="url(#ll-marker-active)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                />
              )
            }

            // 5. STANDARD FORWARD ADJACENT ARROW
            const startX = from.x + 25
            const startY = from.y
            const endX = to.x - 38
            const endY = to.y
            const isEdgeActive = from.highlight === 'active' || to.highlight === 'active'
            const strokeColor = isEdgeActive ? '#06b6d4' : '#4b5563'
            const marker = isEdgeActive ? 'url(#ll-marker-active)' : 'url(#ll-marker-default)'

            return (
              <motion.line
                key={edge.id}
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke={strokeColor}
                strokeWidth={isEdgeActive ? 2 : 1.5}
                markerEnd={marker}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
              />
            )
          })}

          {/* ─── TERMINAL NULL POINTERS ────────────────────────────────────── */}
          {terminalNodes.map(node => (
            <g key={`null-${node.id}`} className="transition-opacity duration-300">
              <line
                x1={node.x + 25}
                y1={node.y}
                x2={node.x + 55}
                y2={node.y}
                stroke="#6b7280"
                strokeWidth="1.5"
                markerEnd="url(#ll-marker-default)"
              />
              <rect
                x={node.x + 58}
                y={node.y - 11}
                width="36"
                height="22"
                rx="5"
                fill="#161217"
                stroke="#ef444455"
                strokeWidth="1"
              />
              <text
                x={node.x + 76}
                y={node.y}
                fill="#f87171"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="central"
              >
                null
              </text>
            </g>
          ))}

          {/* ─── NODES ──────────────────────────────────────────────────────── */}
          {layoutNodes.map((node, idx) => {
            const isRemoved = node.highlight === 'skipped' || (node.label || '').toLowerCase().includes('removed')
            const c = HL[node.highlight || 'none']
            const W_CARD = 76
            const H_CARD = 48
            const x0 = node.x - W_CARD / 2
            const y0 = node.y - H_CARD / 2

            // Parse pointer labels (e.g. "slow, fast", "curr", "prev")
            const labels = (node.label || '')
              .split(',')
              .map(s => s.trim())
              .filter(Boolean)

            const hexAddr = `0x${(0x1000 + idx * 16).toString(16).toUpperCase()}`

            return (
              <motion.g
                key={node.id}
                layout
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ 
                  opacity: isRemoved ? 0.35 : 1, 
                  scale: isRemoved ? 0.9 : 1,
                  filter: c.glow ? `drop-shadow(${c.glow.replace(/.*?rgba/, 'rgba')})` : 'none'
                }}
                transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              >
                {/* 1. Pointer Badges above Node */}
                {labels.length > 0 && (
                  <g transform={`translate(${node.x}, ${y0 - 8})`}>
                    {/* Connecting stem line down to node card */}
                    <line x1={0} y1={-2} x2={0} y2={8} stroke="#4b5563" strokeWidth="1.5" />
                    <polygon points="-3,5 3,5 0,8" fill="#9ca3af" />

                    {/* Badges container */}
                    <g transform={`translate(${-(labels.length * 44) / 2}, -22)`}>
                      {labels.map((lbl, lIdx) => {
                        const bStyle = getBadgeStyle(lbl)
                        const bx = lIdx * 46
                        return (
                          <g key={`${node.id}-badge-${lbl}-${lIdx}`} transform={`translate(${bx}, 0)`}>
                            <rect
                              x={0}
                              y={0}
                              width={42}
                              height={18}
                              rx={4}
                              fill={bStyle.bg}
                              stroke={bStyle.border}
                              strokeWidth={1.5}
                            />
                            <text
                              x={21}
                              y={9}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill={bStyle.text}
                              fontSize="9"
                              fontFamily="JetBrains Mono, monospace"
                              fontWeight="bold"
                            >
                              {lbl}
                            </text>
                          </g>
                        )
                      })}
                    </g>
                  </g>
                )}

                {/* 2. Main Node Card Container */}
                <rect
                  x={x0}
                  y={y0}
                  width={W_CARD}
                  height={H_CARD}
                  rx={8}
                  fill={c.bg}
                  stroke={c.border}
                  strokeWidth={c.glow ? 2.5 : 1.5}
                  strokeDasharray={isRemoved ? '4 2' : undefined}
                />

                {/* Divider between val and next pointer */}
                <line
                  x1={x0 + 50}
                  y1={y0}
                  x2={x0 + 50}
                  y2={y0 + H_CARD}
                  stroke={c.border}
                  strokeWidth={1}
                  strokeOpacity={0.6}
                />

                {/* 'val' caption */}
                <text
                  x={x0 + 25}
                  y={y0 + 13}
                  textAnchor="middle"
                  fill="#6b7280"
                  fontSize="8"
                  fontFamily="JetBrains Mono, monospace"
                >
                  val
                </text>

                {/* Value text */}
                <text
                  x={x0 + 25}
                  y={y0 + 32}
                  textAnchor="middle"
                  fill={c.text}
                  fontSize="14"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="bold"
                  className={isRemoved ? 'line-through' : undefined}
                >
                  {node.value}
                </text>

                {/* Red strike-through line if node is removed */}
                {isRemoved && (
                  <line
                    x1={x0 + 8}
                    y1={y0 + 30}
                    x2={x0 + 42}
                    y2={y0 + 30}
                    stroke="#ef4444"
                    strokeWidth="2"
                  />
                )}

                {/* Next port dot / symbol */}
                <text
                  x={x0 + 63}
                  y={y0 + 24}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#9ca3af"
                  fontSize="12"
                  fontFamily="JetBrains Mono, monospace"
                >
                  •
                </text>

                {/* Memory address header / label below card */}
                <text
                  x={node.x}
                  y={y0 + H_CARD + 14}
                  textAnchor="middle"
                  fill="#4b5563"
                  fontSize="9"
                  fontFamily="JetBrains Mono, monospace"
                >
                  [{hexAddr}]
                </text>
              </motion.g>
            )
          })}
        </svg>
      </div>

      {/* Bottom Summary & Legend */}
      <div className="flex flex-col items-center gap-2 p-2.5 bg-[#0e111b] border-t border-[#1b1f2e] text-xs font-mono">
        <div className="text-gray-400">
          List: {layoutNodes.filter(n => n.highlight !== 'skipped').map(n => n.value).join(' → ')} → null
        </div>
        <Legend items={[
          { label: 'Active / Curr', hl: 'active' },
          { label: 'Visited / Prev', hl: 'visited' },
          { label: 'Comparing', hl: 'comparing' },
          { label: 'Found / Target', hl: 'found' },
          { label: 'Removed / Skip', hl: 'skipped' },
        ]} />
      </div>
    </div>
  )
}

// ─── TREE VIEW (SVG) ─────────────────────────────────────────────────────────
const TreeView: React.FC<{ nodes: DSANode[]; edges?: DSAEdge[]; message?: string }> = ({ nodes, edges, message }) => {
  if (!nodes.length) return <div className="flex items-center justify-center h-full text-gray-500 text-sm">Empty tree</div>

  // If any node lacks coordinates, automatically compute dynamic non-overlapping tree layout
  const needsLayout = nodes.some(n => typeof n.x !== 'number' || typeof n.y !== 'number')
  const { nodes: layoutNodes, edges: layoutEdges } = React.useMemo(() => {
    if (needsLayout) {
      return computeTreeLayout(nodes, edges, { width: 650, height: 400 })
    }
    return { nodes, edges: edges || [] }
  }, [nodes, edges, needsLayout])

  const xs = layoutNodes.map(n => (typeof n.x === 'number' ? n.x : 325))
  const ys = layoutNodes.map(n => (typeof n.y === 'number' ? n.y : 60))
  const minX = Math.min(...xs, 40)
  const maxX = Math.max(...xs, 600)
  const minY = Math.min(...ys, 30)
  const maxY = Math.max(...ys, 350)
  const pad = 45
  const vbX = minX - pad
  const vbY = Math.max(0, minY - pad)
  const vbW = Math.max(500, (maxX - minX) + pad * 2)
  const vbH = Math.max(340, (maxY - minY) + pad * 2)

  return (
    <div className="flex flex-col items-center h-full gap-3 p-4 overflow-hidden select-none">
      {message && (
        <motion.div key={message} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="px-3 py-1.5 bg-[#13151f] border border-[#252836] rounded-lg text-xs text-gray-300 font-mono text-center flex-shrink-0 max-w-xl">
          {message}
        </motion.div>
      )}
      <div className="flex-1 w-full overflow-auto flex items-center justify-center">
        <svg viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`} className="w-full h-full max-h-[480px]" style={{ minWidth: 300 }}>
          <defs>
            <marker id="tree-arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="#4b5563" />
            </marker>
            <marker id="tree-arrowhead-active" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="#06b6d4" />
            </marker>
            <marker id="tree-arrowhead-comparing" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="#f59e0b" />
            </marker>
            <marker id="tree-arrowhead-swapping" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="#ef4444" />
            </marker>
            <marker id="tree-arrowhead-found" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="#10b981" />
            </marker>
          </defs>

          {/* Edges with perimeter endpoints and traversal highlights */}
          {layoutEdges?.map(edge => {
            const from = layoutNodes.find(n => n.id === edge.from)
            const to = layoutNodes.find(n => n.id === edge.to)
            if (typeof from?.x !== 'number' || typeof from?.y !== 'number' ||
                typeof to?.x !== 'number' || typeof to?.y !== 'number') return null

            const r = 22
            const dx = to.x - from.x
            const dy = to.y - from.y
            const dist = Math.hypot(dx, dy) || 1
            const startX = from.x + (dx / dist) * (r + 2)
            const startY = from.y + (dy / dist) * (r + 2)
            const endX = to.x - (dx / dist) * (r + (edge.directed ? 6 : 2))
            const endY = to.y - (dy / dist) * (r + (edge.directed ? 6 : 2))

            const isHighlighted = to.highlight === 'active' || to.highlight === 'comparing' ||
                                  to.highlight === 'swapping' || to.highlight === 'found' || from.highlight === 'active'
            const strokeColor = isHighlighted ? HL[to.highlight || 'active'].border : '#374151'
            const strokeWidth = isHighlighted ? 2.5 : 1.5

            let markerId = 'tree-arrowhead'
            if (to.highlight === 'active') markerId = 'tree-arrowhead-active'
            else if (to.highlight === 'comparing') markerId = 'tree-arrowhead-comparing'
            else if (to.highlight === 'swapping') markerId = 'tree-arrowhead-swapping'
            else if (to.highlight === 'found') markerId = 'tree-arrowhead-found'

            return (
              <g key={edge.id}>
                <motion.line
                  x1={startX} y1={startY} x2={endX} y2={endY}
                  initial={{ opacity: 0, pathLength: 0 }}
                  animate={{ opacity: isHighlighted ? 0.95 : 0.6, pathLength: 1 }}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  markerEnd={edge.directed ? `url(#${markerId})` : undefined}
                />
                {edge.label && (
                  <text
                    x={(startX + endX) / 2 + (dx > 0 ? 8 : -8)}
                    y={(startY + endY) / 2}
                    fill="#6b7280"
                    fontSize="10"
                    fontFamily="JetBrains Mono, monospace"
                    textAnchor="middle"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            )
          })}

          {/* Nodes */}
          {layoutNodes.map((node) => {
            if (typeof node.x !== 'number' || typeof node.y !== 'number') return null
            const c = HL[node.highlight || 'none']
            const r = 22
            const isActive = node.highlight === 'active' || node.highlight === 'comparing' || node.highlight === 'swapping'

            return (
              <motion.g key={node.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {/* Active glow pulse ring */}
                {isActive && (
                  <motion.circle
                    cx={node.x} cy={node.y} r={r + 8}
                    fill="none" stroke={c.border} strokeWidth="1.5"
                    animate={{ opacity: [0.2, 0.7, 0.2], scale: [0.95, 1.1, 0.95] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                  />
                )}
                <circle cx={node.x} cy={node.y} r={r + 4} fill={c.border + '18'} />
                <circle cx={node.x} cy={node.y} r={r} fill={c.bg} stroke={c.border} strokeWidth={isActive ? '2.5' : '2'} />
                {c.glow && <circle cx={node.x} cy={node.y} r={r + 2} fill="none" stroke={c.border} strokeWidth="1" opacity="0.4" />}
                <text x={node.x} y={node.y} textAnchor="middle" dominantBaseline="central"
                  fill={c.text} fontSize="12" fontFamily="JetBrains Mono, monospace" fontWeight="bold">
                  {node.value}
                </text>
                {/* Label badge */}
                {node.label && (
                  <text x={node.x} y={node.y - r - 5} textAnchor="middle"
                    fill="#94a3b8" fontSize="10" fontFamily="JetBrains Mono, monospace" fontWeight="500">
                    {node.label}
                  </text>
                )}
              </motion.g>
            )
          })}
        </svg>
      </div>
      <Legend items={[
        { label: 'Active', hl: 'active' },
        { label: 'Comparing', hl: 'comparing' },
        { label: 'Swapping', hl: 'swapping' },
        { label: 'Visited', hl: 'visited' },
        { label: 'Found', hl: 'found' }
      ]} />
    </div>
  )
}

// ─── HEAP VIEW (SYNCHRONIZED ARRAY + TREE) ───────────────────────────────────
const HeapView: React.FC<{
  nodes: DSANode[]
  edges?: DSAEdge[]
  comparisons?: number
  swaps?: number
  message?: string
  auxiliaryData?: Record<string, any>
}> = ({ nodes, edges, comparisons, swaps, message, auxiliaryData }) => {
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null)

  if (!nodes.length) {
    return <div className="flex items-center justify-center h-full text-gray-500 text-sm">Empty heap</div>
  }

  // Derive complete heap layout for the tree
  const heapLayout = React.useMemo(() => computeHeapLayout(nodes, { width: 620, height: 320 }), [nodes])
  const treeNodes = heapLayout.nodes
  const treeEdges = edges && edges.length > 0 ? edges : heapLayout.edges

  const heapSize = typeof auxiliaryData?.heapSize === 'number' ? auxiliaryData.heapSize : nodes.length
  const heapType = auxiliaryData?.heapType || (auxiliaryData?.isMaxHeap ? 'Max-Heap' : 'Min/Max Heap')

  // Bounding box for the tree SVG
  const xs = treeNodes.map(n => (typeof n.x === 'number' ? n.x : 300))
  const ys = treeNodes.map(n => (typeof n.y === 'number' ? n.y : 50))
  const minX = Math.min(...xs, 20)
  const maxX = Math.max(...xs, 600)
  const minY = Math.min(...ys, 20)
  const maxY = Math.max(...ys, 260)
  const pad = 35
  const vbX = minX - pad
  const vbY = Math.max(0, minY - pad)
  const vbW = (maxX - minX) + pad * 2
  const vbH = (maxY - minY) + pad * 2

  return (
    <div className="flex flex-col h-full gap-3 p-4 overflow-hidden select-none">
      {/* Header with message and badges */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {message ? (
          <motion.div key={message} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="px-3 py-1 bg-[#13151f] border border-[#252836] rounded-lg text-xs text-gray-300 font-mono flex-1 min-w-[200px]">
            {message}
          </motion.div>
        ) : <div />}
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-700/50 text-indigo-300 font-bold">
            {heapType}
          </span>
          <span className="px-2 py-0.5 rounded bg-[#13151f] border border-[#252836] text-gray-400">
            size: <strong className="text-gray-200">{heapSize}</strong>
          </span>
          {comparisons !== undefined && (
            <span className="px-2 py-0.5 rounded bg-[#13151f] border border-[#252836] text-amber-400/90">
              comps: <strong>{comparisons}</strong>
            </span>
          )}
          {swaps !== undefined && (
            <span className="px-2 py-0.5 rounded bg-[#13151f] border border-[#252836] text-rose-400/90">
              swaps: <strong>{swaps}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Top Section: Array Representation */}
      <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#0d0f18] border border-[#1e2130]">
        <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 uppercase tracking-wider">
          <span>Array Representation [i]</span>
          <span className="text-gray-600">Parent = ⌊(i-1)/2⌋ | Left = 2i+1 | Right = 2i+2</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 justify-center">
          {nodes.map((node, i) => {
            const isHovered = hoveredIdx === i
            const isInHeap = i < heapSize
            const c = HL[node.highlight || (isInHeap ? 'none' : 'sorted')]
            const isRoot = i === 0

            return (
              <motion.div
                key={node.id}
                layout
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="flex flex-col items-center gap-1 cursor-pointer transition-transform hover:scale-105"
              >
                <span className="text-[10px] font-mono text-gray-500">[{i}]</span>
                <motion.div
                  animate={{
                    backgroundColor: isHovered ? '#1e2540' : c.bg,
                    borderColor: isHovered ? '#818cf8' : c.border,
                    boxShadow: c.glow || (isHovered ? '0 0 12px rgba(129,140,248,0.5)' : 'none')
                  }}
                  className={`w-11 h-11 flex flex-col items-center justify-center rounded-lg border-2 relative ${!isInHeap ? 'opacity-60' : ''}`}
                >
                  <span className="text-xs font-mono font-bold" style={{ color: c.text }}>
                    {node.value}
                  </span>
                  {isRoot && (
                    <span className="absolute -bottom-2 px-1 rounded text-[8px] font-mono bg-cyan-950 border border-cyan-700/60 text-cyan-300">
                      root
                    </span>
                  )}
                </motion.div>
                {node.label && node.label !== `[${i}]` && (
                  <span className="text-[9px] font-mono text-amber-400">{node.label}</span>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Bottom Section: Complete Binary Tree SVG Representation */}
      <div className="flex-1 w-full overflow-auto flex flex-col items-center justify-center rounded-xl bg-[#0b0d14] border border-[#1a1c29] p-2 relative">
        <div className="absolute top-2 left-3 text-[10px] font-mono text-gray-500 uppercase tracking-wider">
          Complete Binary Tree Representation
        </div>
        <svg viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`} className="w-full h-full max-h-[340px]" style={{ minWidth: 280 }}>
          <defs>
            <marker id="heap-arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="#4b5563" />
            </marker>
            <marker id="heap-arrowhead-active" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="#06b6d4" />
            </marker>
            <marker id="heap-arrowhead-comparing" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="#f59e0b" />
            </marker>
            <marker id="heap-arrowhead-swapping" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="#ef4444" />
            </marker>
          </defs>

          {/* Tree Edges */}
          {treeEdges.map(edge => {
            const from = treeNodes.find(n => n.id === edge.from)
            const to = treeNodes.find(n => n.id === edge.to)
            if (!from || typeof from.x !== 'number' || typeof from.y !== 'number' ||
                !to || typeof to.x !== 'number' || typeof to.y !== 'number') return null

            const r = 20
            const dx = to.x - from.x
            const dy = to.y - from.y
            const dist = Math.hypot(dx, dy) || 1
            const startX = from.x + (dx / dist) * (r + 2)
            const startY = from.y + (dy / dist) * (r + 2)
            const endX = to.x - (dx / dist) * (r + 6)
            const endY = to.y - (dy / dist) * (r + 6)

            const isEdgeHighlighted = to.highlight === 'active' || to.highlight === 'comparing' ||
                                     to.highlight === 'swapping' || to.highlight === 'heapifying'
            const strokeColor = isEdgeHighlighted ? HL[to.highlight || 'active'].border : '#374151'
            const strokeWidth = isEdgeHighlighted ? 2.5 : 1.5

            let markerId = 'heap-arrowhead'
            if (to.highlight === 'active') markerId = 'heap-arrowhead-active'
            else if (to.highlight === 'comparing' || to.highlight === 'heapifying') markerId = 'heap-arrowhead-comparing'
            else if (to.highlight === 'swapping') markerId = 'heap-arrowhead-swapping'

            return (
              <g key={edge.id}>
                <motion.line
                  x1={startX} y1={startY} x2={endX} y2={endY}
                  initial={{ opacity: 0, pathLength: 0 }}
                  animate={{ opacity: isEdgeHighlighted ? 0.95 : 0.6, pathLength: 1 }}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  markerEnd={`url(#${markerId})`}
                />
                {edge.label && (
                  <text
                    x={(startX + endX) / 2 + (dx > 0 ? 7 : -7)}
                    y={(startY + endY) / 2}
                    fill="#6b7280"
                    fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                    textAnchor="middle"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            )
          })}

          {/* Tree Nodes */}
          {treeNodes.map((node, i) => {
            if (typeof node.x !== 'number' || typeof node.y !== 'number') return null
            const isHovered = hoveredIdx === i
            const isInHeap = i < heapSize
            const c = HL[node.highlight || (isInHeap ? 'none' : 'sorted')]
            const r = 20
            const isActive = node.highlight === 'active' || node.highlight === 'comparing' ||
                             node.highlight === 'swapping' || node.highlight === 'heapifying' || isHovered

            return (
              <motion.g
                key={node.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: isInHeap ? 1 : 0.5, scale: isHovered ? 1.15 : 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                {/* Active glow pulse */}
                {isActive && (
                  <motion.circle
                    cx={node.x} cy={node.y} r={r + 8}
                    fill="none" stroke={c.border} strokeWidth="1.5"
                    animate={{ opacity: [0.2, 0.7, 0.2], scale: [0.95, 1.1, 0.95] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                  />
                )}
                <circle cx={node.x} cy={node.y} r={r + 3} fill={c.border + '18'} />
                <circle cx={node.x} cy={node.y} r={r} fill={c.bg} stroke={c.border} strokeWidth={isActive ? '2.5' : '2'} />
                {c.glow && <circle cx={node.x} cy={node.y} r={r + 2} fill="none" stroke={c.border} strokeWidth="1" opacity="0.4" />}
                <text x={node.x} y={node.y} textAnchor="middle" dominantBaseline="central"
                  fill={c.text} fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="bold">
                  {node.value}
                </text>
                {/* Index badge */}
                <text x={node.x} y={node.y - r - 5} textAnchor="middle"
                  fill="#64748b" fontSize="9" fontFamily="JetBrains Mono, monospace">
                  #{i}
                </text>
              </motion.g>
            )
          })}
        </svg>
      </div>

      <Legend items={[
        { label: 'Active', hl: 'active' },
        { label: 'Comparing', hl: 'comparing' },
        { label: 'Swapping', hl: 'swapping' },
        { label: 'Heapifying', hl: 'heapifying' },
        { label: 'Sorted', hl: 'sorted' }
      ]} />
    </div>
  )
}

// ─── GRAPH VIEW (SVG) ────────────────────────────────────────────────────────
const GraphView: React.FC<{ nodes: DSANode[]; edges?: DSAEdge[]; message?: string; queueItems?: (string | number)[] }> = ({ nodes, edges, message, queueItems }) => {
  if (!nodes.length) return <div className="flex items-center justify-center h-full text-gray-500 text-sm">Empty graph</div>

  const xs = nodes.map(n => (typeof n.x === 'number' ? n.x : 250))
  const ys = nodes.map(n => (typeof n.y === 'number' ? n.y : 200))
  const minX = Math.min(...xs, 0)
  const maxX = Math.max(...xs, 500)
  const minY = Math.min(...ys, 0)
  const maxY = Math.max(...ys, 400)
  const pad = 50
  const vbX = minX - pad
  const vbY = minY - pad
  const vbW = (maxX - minX) + pad * 2
  const vbH = (maxY - minY) + pad * 2

  return (
    <div className="flex flex-col h-full gap-3 p-4 overflow-hidden">
      {message && (
        <motion.div key={message} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="px-3 py-1.5 bg-[#13151f] border border-[#252836] rounded-lg text-xs text-gray-300 font-mono text-center flex-shrink-0">
          {message}
        </motion.div>
      )}

      <div className="flex gap-4 flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto flex items-center justify-center">
          <svg viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`} className="w-full h-full max-h-[480px]">
            <defs>
              <marker id="graphArrowhead" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#4b5563" />
              </marker>
              <marker id="graphArrowheadActive" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#00d4ff" />
              </marker>
            </defs>
            {/* Edges */}
            {edges?.map(edge => {
              const from = nodes.find(n => String(n.id) === String(edge.from))
              const to = nodes.find(n => String(n.id) === String(edge.to))
              if (typeof from?.x !== 'number' || typeof from?.y !== 'number' || typeof to?.x !== 'number' || typeof to?.y !== 'number') return null
              const highlighted = (from.highlight !== 'none' && from.highlight !== undefined && to.highlight !== 'none') ||
                !!edge.highlight

              const dx = to.x - from.x
              const dy = to.y - from.y
              const dist = Math.hypot(dx, dy) || 1
              const r = 26
              const isDirected = edge.directed !== false

              // Stop at node circle boundaries
              const startX = from.x + (dx / dist) * r
              const startY = from.y + (dy / dist) * r
              const endX = isDirected ? to.x - (dx / dist) * (r + 4) : to.x - (dx / dist) * r
              const endY = isDirected ? to.y - (dy / dist) * (r + 4) : to.y - (dy / dist) * r

              return (
                <motion.line key={edge.id || `${edge.from}-${edge.to}`}
                  initial={{ opacity: 0, x1: startX, y1: startY, x2: endX, y2: endY }}
                  animate={{
                    x1: startX,
                    y1: startY,
                    x2: endX,
                    y2: endY,
                    opacity: 1,
                    stroke: highlighted ? '#00d4ff' : '#4b5563',
                    strokeWidth: highlighted ? 2.5 : 1.5
                  }}
                  transition={{ type: 'spring', stiffness: 250, damping: 25, opacity: { duration: 0.3 } }}
                  markerEnd={isDirected ? (highlighted ? 'url(#graphArrowheadActive)' : 'url(#graphArrowhead)') : undefined}
                />
              )
            })}

            {/* Nodes */}
            {nodes.map(node => {
              if (typeof node.x !== 'number' || typeof node.y !== 'number') return null
              const c = HL[node.highlight || 'none']
              const r = 26
              return (
                <motion.g key={node.id}
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                >
                  {c.glow && <motion.circle animate={{ cx: node.x, cy: node.y }} transition={{ type: 'spring', stiffness: 250, damping: 25 }} r={r + 6} fill={c.border + '15'} />}
                  <motion.circle animate={{ cx: node.x, cy: node.y }} transition={{ type: 'spring', stiffness: 250, damping: 25 }} r={r} fill={c.bg} stroke={c.border} strokeWidth="2.5" />
                  <motion.text animate={{ x: node.x, y: node.y }} transition={{ type: 'spring', stiffness: 250, damping: 25 }} textAnchor="middle" dominantBaseline="central"
                    fill={c.text} fontSize="14" fontFamily="JetBrains Mono, monospace" fontWeight="bold">
                    {node.value}
                  </motion.text>
                  {node.label && (
                    <motion.text animate={{ x: node.x, y: node.y - r - 8 }} transition={{ type: 'spring', stiffness: 250, damping: 25 }} textAnchor="middle" fill="#9ca3af" fontSize="10" fontFamily="JetBrains Mono, monospace">
                      {node.label}
                    </motion.text>
                  )}
                </motion.g>
              )
            })}
          </svg>
        </div>

        {/* Queue/Stack sidebar */}
        {queueItems && queueItems.length > 0 && (
          <div className="w-28 flex-shrink-0 flex flex-col gap-2 max-h-[380px] overflow-y-auto bg-[#0b0e17] p-2 rounded-lg border border-[#1f2438]">
            <div className="text-[10px] text-gray-400 font-mono uppercase tracking-wider text-center font-semibold border-b border-[#1f2438] pb-1">
              Queue ({queueItems.length})
            </div>
            <AnimatePresence mode="popLayout">
              {queueItems.map((item, i) => (
                <motion.div key={`${JSON.stringify(item)}-${i}`}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="relative px-2 py-1.5 bg-[#0d2233] border border-cyan-500/40 rounded text-center text-xs font-mono text-cyan-300">
                  {i === 0 && (
                    <span className="absolute -top-1.5 -left-1 text-[8px] bg-cyan-600 text-white px-1 rounded font-bold uppercase">
                      Front
                    </span>
                  )}
                  {typeof item === 'object' && item !== null
                    ? `[${Array.isArray(item) ? (item as unknown[]).join(',') : JSON.stringify(item)}]`
                    : String(item)}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Legend items={[{ label: 'Current', hl: 'active' }, { label: 'Visited', hl: 'found' }, { label: 'In Queue', hl: 'comparing' }]} />
    </div>
  )
}

// ─── STACK VIEW ──────────────────────────────────────────────────────────────
const StackView: React.FC<{ nodes: DSANode[]; stackItems?: (string | number)[]; message?: string }> = ({ nodes, stackItems, message }) => {
  const items = stackItems || nodes.map(n => n.value)
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
      {message && (
        <motion.div key={message} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="px-3 py-1.5 bg-[#13151f] border border-[#252836] rounded-lg text-xs text-gray-300 font-mono">{message}</motion.div>
      )}

      <div className="flex gap-8 items-end">
        {/* Stack visual */}
        <div className="flex flex-col items-center">
          <div className="text-[10px] text-cyan-400/60 font-mono mb-1 tracking-wider">TOP ▼</div>
          <div className="w-32 border-l-2 border-r-2 border-b-2 border-gray-600 rounded-b-lg min-h-12 flex flex-col-reverse overflow-hidden">
            <AnimatePresence mode="popLayout">
              {items.map((item, i) => {
                const isTop = i === items.length - 1
                const c = isTop ? HL.active : HL.visited
                return (
                  <motion.div key={`${item}-${i}`}
                    layout
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0, backgroundColor: c.bg, borderColor: c.border, boxShadow: isTop ? c.glow : 'none' }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="border-t-2 py-2 text-center font-mono font-bold text-sm"
                    style={{ borderColor: c.border, color: c.text }}
                  >
                    {item}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
          {items.length === 0 && <div className="w-32 h-12 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center text-gray-600 text-xs font-mono">empty</div>}
        </div>

        {/* Info panel */}
        <div className="flex flex-col gap-2 text-xs font-mono">
          <div className="flex gap-2">
            <span className="text-gray-500">size:</span>
            <motion.span key={items.length} initial={{ scale: 1.4, color: '#00d4ff' }} animate={{ scale: 1, color: '#e8eaf0' }} className="text-white font-bold">{items.length}</motion.span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500">top:</span>
            <span className="text-cyan-400">{items[items.length - 1] ?? 'null'}</span>
          </div>
          <div className="mt-2 text-gray-600">LIFO: last in, first out</div>
        </div>
      </div>
    </div>
  )
}

// ─── QUEUE VIEW ──────────────────────────────────────────────────────────────
const QueueView: React.FC<{ nodes: DSANode[]; queueItems?: (string | number)[]; message?: string }> = ({ nodes, queueItems, message }) => {
  const items = queueItems || nodes.map(n => n.value)
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-6">
      {message && (
        <motion.div key={message} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="px-3 py-1.5 bg-[#13151f] border border-[#252836] rounded-lg text-xs text-gray-300 font-mono">{message}</motion.div>
      )}
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-12 text-[10px] font-mono text-gray-500">
          <span className="text-red-400/70">← DEQUEUE (front)</span>
          <span className="text-green-400/70">ENQUEUE (rear) →</span>
        </div>

        <div className="flex items-stretch border-2 border-gray-600 rounded-xl overflow-hidden min-w-64 min-h-14">
          <AnimatePresence mode="popLayout">
            {items.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-600 text-xs font-mono">empty queue</div>
            ) : items.map((item, i) => {
              const isFront = i === 0, isRear = i === items.length - 1
              const c = isFront ? HL.swapping : isRear ? HL.active : HL.visited
              return (
                <motion.div key={`${item}-${i}`}
                  layout
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1, backgroundColor: c.bg }}
                  exit={{ opacity: 0, scaleX: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="flex flex-col items-center justify-center px-4 py-2 border-r last:border-r-0 min-w-14 font-mono"
                  style={{ borderColor: c.border, borderWidth: isFront || isRear ? '0 1px' : undefined }}
                >
                  <span className="font-bold text-sm" style={{ color: c.text }}>{item}</span>
                  {isFront && <span className="text-[9px] text-red-400 mt-0.5">front</span>}
                  {isRear && !isFront && <span className="text-[9px] text-green-400 mt-0.5">rear</span>}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        <div className="flex gap-6 text-xs font-mono text-gray-500">
          <span>size: <span className="text-white">{items.length}</span></span>
          <span>FIFO: first in, first out</span>
        </div>
      </div>
    </div>
  )
}

// ─── HASH MAP VIEW ────────────────────────────────────────────────────────────
const HashMapView: React.FC<{ nodes: DSANode[]; hashTable?: Record<string, unknown>; message?: string }> = ({ nodes: _nodes, hashTable, message }) => {
  const entries = hashTable ? Object.entries(hashTable) : []
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
      {message && (
        <motion.div key={message} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="px-3 py-1.5 bg-[#13151f] border border-[#252836] rounded-lg text-xs text-gray-300 font-mono">{message}</motion.div>
      )}
      <div className="grid grid-cols-2 gap-2 max-w-sm w-full overflow-y-auto max-h-[340px] p-2">
        <AnimatePresence mode="popLayout">
          {entries.map(([key, val]) => {
            return (
              <motion.div key={key}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 bg-[#13151f] border border-[#252836] rounded-lg px-3 py-2"
              >
                <span className="text-cyan-400 text-xs font-mono font-bold truncate">{key}</span>
                <span className="text-gray-600 text-xs font-mono">→</span>
                <span className="text-amber-400 text-xs font-mono font-bold">{String(val)}</span>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
      {entries.length === 0 && <div className="text-gray-600 text-sm font-mono">empty map</div>}
      <div className="text-xs text-gray-600 font-mono mt-2">O(1) average lookup</div>
    </div>
  )
}

// ─── TWO SUM VIEW ──────────────────────────────────────────────────
const TwoSumView: React.FC<{
  nodes: DSANode[]
  hashTable?: Record<string, unknown>
  message?: string
  comparisons?: number
  arrayName?: string
  hashTableName?: string
  hashTableLabel?: string
  pointer?: number
  pointerName?: string
  pointer2?: number
  pointer2Name?: string
}> = ({
  nodes, hashTable, message, comparisons, arrayName, hashTableName, hashTableLabel, pointer, pointerName, pointer2, pointer2Name
}) => {
  const entries = hashTable ? Object.entries(hashTable) : []
  const maxVal = Math.max(...nodes.map(n => Math.abs(Number(n.value) || 0)), 1)

  return (
    <div className="flex flex-col h-full gap-3 p-4 select-none overflow-auto">
      {/* Message banner */}
      {message && (
        <motion.div key={message} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="px-4 py-2 bg-[#13151f] border border-[#252836] rounded-lg text-sm text-center text-gray-300 font-mono flex-shrink-0">
          {message}
        </motion.div>
      )}

      <div className="flex flex-wrap gap-4 flex-1 min-h-0 overflow-auto">
        {/* Array visualization */}
        <div className="flex-1 flex flex-col items-center justify-end gap-2 min-w-[200px] min-h-0">
          <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider self-start">{arrayName || 'nums array'}</div>
          <div className="flex items-end gap-1.5 flex-wrap justify-center pb-9" style={{ minHeight: 120 }}>
            <AnimatePresence mode="popLayout">
              {nodes.map((node, idx) => {
                const c = HL[node.highlight || 'none']
                const val = Math.max(Math.abs(Number(node.value) || 1), 1)
                const h = Math.max(20, (val / maxVal) * 120)
                return (
                  <motion.div key={node.id} layout
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1, boxShadow: c.glow || 'none' }}
                    exit={{ opacity: 0, scaleY: 0 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                    className="flex flex-col items-center gap-1 origin-bottom"
                  >
                    <motion.span className="text-[11px] font-mono font-bold transition-colors duration-200"
                      animate={{ color: c.text }} style={{ minWidth: 28, textAlign: 'center' }}>
                      {node.value}
                    </motion.span>
                    <motion.div
                      className="w-10 rounded-t relative overflow-hidden"
                      style={{ height: h }}
                      animate={{ backgroundColor: c.bg, borderColor: c.border }}
                      transition={{ duration: 0.25 }}
                      initial={false}
                    >
                      <div className="absolute inset-0 border rounded-t" style={{ borderColor: c.border }} />
                      {(node.highlight === 'comparing' || node.highlight === 'active' || node.highlight === 'found') && (
                        <motion.div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10"
                          animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.8, repeat: Infinity }} />
                      )}
                    </motion.div>
                    <span className="text-[10px] text-gray-600 font-mono">[{idx}]</span>
                    {pointer === idx && pointer2 === idx ? (
                      <div className="absolute -bottom-8 flex flex-col items-center z-20">
                        <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[5px] border-l-transparent border-r-transparent border-b-amber-400" />
                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-[#1a1829] border border-amber-500/60 rounded text-[9px] font-mono mt-0.5 shadow-lg">
                          <span className="text-cyan-300">{pointerName || 'ptr'}</span>
                          <span className="text-gray-500">:</span>
                          <span className="text-purple-300">{pointer2Name || 'ptr2'}</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        {pointer === idx && (
                          <div className="absolute -bottom-8 flex flex-col items-center z-10">
                            <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[5px] border-l-transparent border-r-transparent border-b-cyan-400" />
                            <div className="px-1.5 py-0.5 bg-cyan-900/60 border border-cyan-500/50 rounded text-[9px] text-cyan-300 font-mono mt-0.5">{pointerName || 'ptr'}</div>
                          </div>
                        )}
                        {pointer2 === idx && (
                          <div className="absolute -bottom-8 flex flex-col items-center z-10">
                            <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[5px] border-l-transparent border-r-transparent border-b-purple-400" />
                            <div className="px-1.5 py-0.5 bg-purple-900/60 border border-purple-500/50 rounded text-[9px] text-purple-300 font-mono mt-0.5">{pointer2Name || 'ptr2'}</div>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
          <Legend items={[
            { label: 'Current', hl: 'active' },
            { label: 'Checking', hl: 'comparing' },
            { label: 'Found!', hl: 'found' },
            { label: 'Scanned', hl: 'visited' },
          ]} />
        </div>

        {/* HashMap panel */}
        <div className="w-full sm:w-44 flex-shrink-0 flex flex-col gap-2 min-w-[150px]">
          <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">{hashTableName || 'hash map'}</div>
          <div className="text-[9px] text-gray-700 font-mono">{hashTableLabel || 'value → index'}</div>
          <div className="flex flex-col gap-1.5 overflow-auto" style={{ maxHeight: 220 }}>
            <AnimatePresence mode="popLayout">
              {entries.length === 0 ? (
                <div className="text-gray-700 text-xs font-mono px-2 py-3 text-center border border-dashed border-gray-700 rounded-lg">
                  empty
                </div>
              ) : entries.map(([key, val]) => {
                const isMatchPointer2 = pointer2 !== undefined && Number(val) === pointer2
                const isCurrentPointer = pointer !== undefined && Number(val) === pointer
                return (
                  <motion.div key={key}
                    layout
                    initial={{ opacity: 0, x: 20, scale: 0.9 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      scale: 1,
                      borderColor: isMatchPointer2 ? '#10b981' : isCurrentPointer ? '#06b6d4' : 'rgba(6,182,212,0.3)',
                      backgroundColor: isMatchPointer2 ? 'rgba(16,185,129,0.18)' : '#0d1b2a',
                    }}
                    exit={{ opacity: 0, x: -10, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    className="flex items-center justify-between gap-2 border rounded-lg px-3 py-2 transition-colors"
                    style={{
                      boxShadow: isMatchPointer2 ? '0 0 12px rgba(16,185,129,0.4)' : '0 0 8px rgba(0,212,255,0.08)'
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-mono font-bold ${isMatchPointer2 ? 'text-emerald-300' : 'text-cyan-400'}`}>{key}</span>
                      {isMatchPointer2 && <span className="text-[9px] px-1 bg-emerald-500/20 text-emerald-300 rounded font-mono font-normal">match</span>}
                    </div>
                    {val !== '✓' && <span className="text-gray-600 text-[10px] font-mono">→ idx</span>}
                    <span className={`text-xs font-mono font-bold ${isMatchPointer2 ? 'text-emerald-300' : 'text-amber-400'}`}>{String(val)}</span>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
          {comparisons !== undefined && (
            <div className="text-[10px] font-mono text-gray-600 mt-auto">
              steps: <span className="text-amber-400">{comparisons}</span>
            </div>
          )}
          <div className="text-[9px] text-gray-700 font-mono">O(1) lookup</div>
        </div>
      </div>
    </div>
  )
}

// ─── CONSOLE PATTERN VIEW ───────────────────────────────────────────────────
// Shows accumulated console.log outputs as a stacked monospace pattern.
// Used for pattern-printing code (pyramids, triangles, diamonds, etc.)
const ConsolePatternView: React.FC<{ outputLines?: string[]; message?: string }> = ({ outputLines = [], message }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-6">
      {message && (
        <motion.div key={message} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="px-4 py-2 bg-[#13151f] border border-[#252836] rounded-lg text-sm text-gray-300 font-mono text-center">
          {message}
        </motion.div>
      )}

      {/* Pattern display area */}
      <div className="relative w-full max-w-lg">
        {/* Terminal-like header */}
        <div className="flex items-center gap-2 px-4 py-2 bg-[#0a0c14] border border-[#1e2130] rounded-t-xl border-b-0">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="text-[10px] font-mono text-gray-600 uppercase tracking-wider ml-2">console output</span>
          <span className="text-[10px] font-mono text-cyan-400/50 ml-auto">{outputLines.length} row{outputLines.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Pattern body */}
        <div className="bg-[#0d0f18] border border-[#1e2130] rounded-b-xl px-5 py-4 min-h-[120px] max-h-[360px] overflow-y-auto"
          style={{ boxShadow: '0 0 30px rgba(0,212,255,0.04), inset 0 0 40px rgba(0,0,0,0.3)' }}>
          {outputLines.length === 0 ? (
            <div className="flex items-center justify-center h-20 text-gray-700 text-sm font-mono">
              <span className="animate-pulse">waiting for output...</span>
            </div>
          ) : (
            <div className="flex flex-col">
              <AnimatePresence mode="popLayout">
                {outputLines.map((line, i) => {
                  const isLatest = i === outputLines.length - 1
                  return (
                    <motion.div
                      key={`line-${i}`}
                      layout
                      initial={{ opacity: 0, x: -12, scaleY: 0.8 }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        scaleY: 1,
                        color: isLatest ? '#22d3ee' : '#9ca3af',
                        textShadow: isLatest ? '0 0 8px rgba(34,211,238,0.4)' : 'none',
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 28,
                        delay: 0,
                      }}
                      className="font-mono text-sm leading-relaxed whitespace-pre"
                      style={{ fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace" }}
                    >
                      {line || ' '}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Progress indicator */}
      {outputLines.length > 0 && (
        <div className="flex items-center gap-3 text-xs font-mono text-gray-600">
          <span>Row <span className="text-cyan-400 font-bold">{outputLines.length}</span></span>
          <div className="w-px h-3 bg-gray-700" />
          <span className="text-[10px] text-gray-700">Pattern builds as you step through →</span>
        </div>
      )}

      <Legend items={[
        { label: 'Current row', hl: 'active' },
        { label: 'Previous rows', hl: 'none' },
      ]} />
    </div>
  )
}

// ─── BACKSPACE COMPARE VIEW ──────────────────────────────────────────────────
const BackspaceCompareView: React.FC<{
  auxiliaryData: Record<string, any>;
  message?: string;
}> = ({ auxiliaryData, message }) => {
  const { s, t, i, j, skipS = 0, skipT = 0 } = auxiliaryData || {};
  const safeS = typeof s === 'string' ? s : '';
  const safeT = typeof t === 'string' ? t : '';

  const renderString = (strName: string, strVal: string, ptr: number | undefined, skip: number, ptrName: string) => {
    const chars = strVal.split('');
    return (
      <div className="flex flex-col gap-2 w-full max-w-3xl">
        <div className="flex items-center justify-between px-2">
          <div className="text-sm font-mono text-gray-400">
            String <span className="text-cyan-400 font-bold">{strName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-mono">skip:</span>
            <div className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${skip > 0 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-[#1a1d2a] text-gray-500'}`}>
              {skip}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 overflow-x-auto pb-6 px-2 min-h-[90px]">
          {chars.map((char: string, idx: number) => {
            const isBackspace = char === '#';
            const isPointer = idx === ptr;
            
            // Determine highlight state
            let hlState: keyof typeof HL = 'none';
            if (isPointer) {
              if (isBackspace) hlState = 'swapping'; // Highlight # in red when pointer is on it
              else if (skip > 0) hlState = 'comparing'; // Highlight char being skipped in orange
              else hlState = 'active'; // Normal char being evaluated
            } else if (ptr !== undefined && idx > ptr) {
              // Characters to the right of pointer (already processed)
              hlState = 'skipped';
            }
            
            const c = HL[hlState] || HL['none'];
            
            return (
              <motion.div key={`${strName}-${idx}`} layout
                animate={{ 
                  backgroundColor: c.bg, 
                  borderColor: c.border, 
                  boxShadow: c.glow || 'none',
                  opacity: (ptr !== undefined && idx > ptr) ? 0.3 : 1
                }}
                transition={{ duration: 0.3 }}
                className="w-10 h-12 flex flex-shrink-0 items-center justify-center rounded-md border-2 relative"
                style={{ borderColor: c.border, backgroundColor: c.bg }}
              >
                <span className="text-lg font-mono font-bold" style={{ color: c.text }}>{char}</span>
                <span className="absolute -bottom-4 text-[9px] text-gray-600 font-mono">{idx}</span>
                
                {isPointer && (
                  <div className="absolute -top-7 flex flex-col items-center z-10">
                    <div className="px-1.5 py-0.5 bg-cyan-900/60 border border-cyan-500/50 rounded text-[9px] text-cyan-300 font-mono mb-0.5">
                      {ptrName}
                    </div>
                    <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-cyan-400" />
                  </div>
                )}
                
                {/* Visual indicator for backspace */}
                {isBackspace && (
                  <div className="absolute -bottom-1 -right-1 text-[8px]">
                    🔙
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-4">
      {message && (
        <motion.div key={message} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="px-4 py-2 bg-[#13151f] border border-[#252836] rounded-lg text-sm text-gray-300 font-mono text-center mb-2">
          {message}
        </motion.div>
      )}
      
      {/* Container for the two strings */}
      <div className="flex flex-col gap-8 w-full items-center bg-[#0d0f16] p-6 rounded-xl border border-[#1e2130]">
        {renderString('s', safeS, i, skipS, 'i')}
        
        {/* Divider */}
        <div className="w-full h-px bg-[#1e2130] my-2 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0d0f16] px-2 text-xs text-gray-600 font-mono">
            vs
          </div>
        </div>
        
        {renderString('t', safeT, j, skipT, 'j')}
      </div>
      
      <Legend items={[
        { label: 'Active Pointer', hl: 'active' },
        { label: 'Found Backspace', hl: 'swapping' },
        { label: 'Skipping Char', hl: 'comparing' },
        { label: 'Processed', hl: 'skipped' }
      ]} />
    </div>
  );
};

// ─── VISUALIZER ERROR BOUNDARY ────────────────────────────────────────────────
class VisualizerErrorBoundary extends React.Component<
  { children: React.ReactNode; fallbackState?: DSAState | null },
  { hasError: boolean; error?: Error }
> {
  override state = { hasError: false, error: undefined as Error | undefined }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Visualizer rendering error:', error, errorInfo)
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center font-mono">
          <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded text-xs">
            Visualizer Notice
          </div>
          <p className="text-sm text-gray-300">Could not render graphic for this step.</p>
          <p className="text-xs text-gray-500">{this.state.error?.message}</p>
          {this.props.fallbackState?.message && (
            <p className="text-xs text-cyan-400 mt-2">{this.props.fallbackState.message}</p>
          )}
        </div>
      )
    }
    return this.props.children
  }
}

// ─── MAIN DISPATCHER ─────────────────────────────────────────────────────────
export const DSAVisualizer: React.FC<DSAVisualizerProps> = ({ dsaState }) => {
  if (!dsaState) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5 text-center p-8">
        <motion.div
          animate={{ y: [0, -8, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="w-20 h-20 rounded-2xl bg-[#13151f] border border-[#252836] flex items-center justify-center"
          style={{ boxShadow: '0 0 30px rgba(0,212,255,0.05)' }}
        >
          <span className="text-4xl">⚡</span>
        </motion.div>
        <div>
          <p className="text-gray-300 text-base font-display font-semibold">Ready to Visualize</p>
          <p className="text-gray-600 text-sm mt-1.5 font-mono">Click ▶ Visualize to animate your algorithm</p>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2 text-[10px] font-mono">
          {['Bubble Sort','Binary Search','BST','Min/Max Heap','Linked List','Two Sum','Stack/Queue','HashMap','BFS/DFS'].map(alg => (
            <div key={alg} className="px-2 py-1 bg-[#13151f] border border-[#1e2130] rounded text-gray-600 text-center hover:text-gray-400 hover:border-[#252836] transition-colors">{alg}</div>
          ))}
        </div>
      </div>
    )
  }

  const isMatched =
    !!dsaState.auxiliaryData?.isBackspaceCompare ||
    (dsaState.type === 'array' && dsaState.hashTable !== undefined) ||
    dsaState.type === 'array' ||
    dsaState.type === 'string' ||
    dsaState.type === 'linkedlist' ||
    dsaState.type === 'tree' ||
    dsaState.type === 'heap' ||
    dsaState.type === 'matrix' ||
    dsaState.type === 'graph' ||
    dsaState.type === 'stack' ||
    dsaState.type === 'queue' ||
    dsaState.type === 'hashmap' ||
    dsaState.type === 'console_pattern'

  return (
    <VisualizerErrorBoundary fallbackState={dsaState}>
      <div className="h-full w-full">
        {dsaState.auxiliaryData?.isBackspaceCompare
          ? <BackspaceCompareView auxiliaryData={dsaState.auxiliaryData} message={dsaState.message} />
          : dsaState.type === 'array' && dsaState.hashTable !== undefined
          ? <TwoSumView nodes={dsaState.nodes} hashTable={dsaState.hashTable} message={dsaState.message} comparisons={dsaState.comparisons} arrayName={dsaState.arrayName} hashTableName={dsaState.hashTableName} hashTableLabel={dsaState.hashTableLabel} pointer={dsaState.pointer} pointerName={dsaState.pointerName} pointer2={dsaState.pointer2} pointer2Name={dsaState.pointer2Name} />
          : dsaState.type === 'array' && (dsaState.auxiliaryData?.heapSize !== undefined
            ? <HeapView nodes={dsaState.nodes} edges={dsaState.edges} comparisons={dsaState.comparisons} swaps={dsaState.swaps} message={dsaState.message} auxiliaryData={dsaState.auxiliaryData} />
            : <ArrayView nodes={dsaState.nodes} auxiliaryData={dsaState.auxiliaryData} comparisons={dsaState.comparisons} swaps={dsaState.swaps} message={dsaState.message} pointer={dsaState.pointer} pointerName={dsaState.pointerName} pointer2={dsaState.pointer2} pointer2Name={dsaState.pointer2Name} pointer3={dsaState.pointer3} pointer3Name={dsaState.pointer3Name} rangeStart={dsaState.rangeStart} rangeEnd={dsaState.rangeEnd} pivotIndex={dsaState.pivotIndex} />)}
        {dsaState.type === 'string' && dsaState.hashTable !== undefined
          ? <StringHashMapView nodes={dsaState.nodes} hashTable={dsaState.hashTable} message={dsaState.message} pointer={dsaState.pointer} pointerName={dsaState.pointerName} pointer2={dsaState.pointer2} pointer2Name={dsaState.pointer2Name} stringName={dsaState.arrayName} hashTableName={dsaState.hashTableName} hashTableLabel={dsaState.hashTableLabel} rangeStart={dsaState.rangeStart} rangeEnd={dsaState.rangeEnd} auxiliaryData={dsaState.auxiliaryData} />
          : dsaState.type === 'string' && dsaState.stackItems !== undefined
          ? <StringStackView nodes={dsaState.nodes} stackItems={dsaState.stackItems} message={dsaState.message} pointer={dsaState.pointer} pointerName={dsaState.pointerName} pointer2={dsaState.pointer2} pointer2Name={dsaState.pointer2Name} stringName={dsaState.arrayName} stackName={dsaState.stackName} rangeStart={dsaState.rangeStart} rangeEnd={dsaState.rangeEnd} auxiliaryData={dsaState.auxiliaryData} />
          : dsaState.type === 'string' && !dsaState.auxiliaryData?.isBackspaceCompare && <StringView nodes={dsaState.nodes} message={dsaState.message} pointer={dsaState.pointer} pointerName={dsaState.pointerName} pointer2={dsaState.pointer2} pointer2Name={dsaState.pointer2Name} rangeStart={dsaState.rangeStart} rangeEnd={dsaState.rangeEnd} auxiliaryData={dsaState.auxiliaryData} />}
        {dsaState.type === 'linkedlist' && (
          <LinkedListView nodes={dsaState.nodes} edges={dsaState.edges} message={dsaState.message} auxiliaryData={dsaState.auxiliaryData} />
        )}
        {dsaState.type === 'tree' && <TreeView nodes={dsaState.nodes} edges={dsaState.edges} message={dsaState.message} />}
        {dsaState.type === 'heap' && <HeapView nodes={dsaState.nodes} edges={dsaState.edges} comparisons={dsaState.comparisons} swaps={dsaState.swaps} message={dsaState.message ?? 'Min/Max Heap'} auxiliaryData={dsaState.auxiliaryData} />}
        {dsaState.type === 'matrix' && <MatrixView nodes={dsaState.nodes} auxiliaryData={dsaState.auxiliaryData} message={dsaState.message ?? 'Matrix'} queueItems={dsaState.queueItems} />}
        {dsaState.type === 'graph' && <GraphView nodes={dsaState.nodes} edges={dsaState.edges} message={dsaState.message} queueItems={dsaState.queueItems} />}
        {dsaState.type === 'stack' && <StackView nodes={dsaState.nodes} stackItems={dsaState.stackItems} message={dsaState.message} />}
        {dsaState.type === 'queue' && <QueueView nodes={dsaState.nodes} queueItems={dsaState.queueItems} message={dsaState.message} />}
        {dsaState.type === 'hashmap' && <HashMapView nodes={dsaState.nodes} hashTable={dsaState.hashTable} message={dsaState.message} />}
        {dsaState.type === 'console_pattern' && <ConsolePatternView outputLines={dsaState.outputLines} message={dsaState.message} />}
        {!isMatched && (
          dsaState.nodes && dsaState.nodes.length > 0
            ? <ArrayView nodes={dsaState.nodes} message={dsaState.message} />
            : (
              <div className="flex flex-col items-center justify-center h-full gap-2 p-6 text-center font-mono">
                <p className="text-sm text-gray-400">{dsaState.message || 'Execution Step'}</p>
              </div>
            )
        )}
      </div>
    </VisualizerErrorBoundary>
  )
}
