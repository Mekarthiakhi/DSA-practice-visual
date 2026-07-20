import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DSAState, DSANode, DSAEdge } from '../../store/ideStore'

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

// ─── ARRAY / SORTING VIEW ────────────────────────────────────────────────────
const ArrayView: React.FC<{ nodes: DSANode[]; auxiliaryData?: Record<string, any>; comparisons?: number; swaps?: number; message?: string; pointer?: number; pointerName?: string; pointer2?: number; pointer2Name?: string; rangeStart?: number; rangeEnd?: number; pivotIndex?: number }> = ({
  nodes, auxiliaryData, comparisons, swaps, message, pointer, pointerName, pointer2, pointer2Name, rangeStart, rangeEnd, pivotIndex
}) => {
  if (!nodes.length) return <div className="flex items-center justify-center h-full text-gray-500 text-sm">No data</div>

  // Detect if array contains strings (non-numeric values)
  const isStringArray = nodes.some(n => isNaN(Number(n.value)) && typeof n.value === 'string')
  // Render as boxes if it's a string array, OR if it's explicitly generic, OR if sorting stats (swaps) aren't present
  const renderAsBoxes = isStringArray || !!auxiliaryData?.isGeneric || swaps === undefined
  const maxVal = renderAsBoxes ? 1 : Math.max(...nodes.map(n => Math.abs(Number(n.value)) || 0), 1)
  const sc = auxiliaryData?.stringCompare

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
        <div className="flex items-center gap-2 relative flex-wrap justify-center pt-2" style={{ minHeight: 60 }}>
          <AnimatePresence mode="popLayout">
            {nodes.map((node, idx) => {
              const c = HL[node.highlight || 'none']
              return (
                <motion.div key={node.id} layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1, boxShadow: c.glow || 'none' }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                  className="flex flex-col items-center gap-1 relative"
                >
                  <motion.div
                    className="px-3 py-2 rounded-lg border-2 relative overflow-hidden cursor-default"
                    animate={{ backgroundColor: c.bg, borderColor: c.border }}
                    transition={{ duration: 0.25 }}
                    initial={false}
                  >
                    <motion.span className="text-sm font-mono font-bold transition-colors duration-200"
                      animate={{ color: c.text }}>
                      {node.value}
                    </motion.span>
                    {(node.highlight === 'comparing' || node.highlight === 'active') && (
                      <motion.div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/8"
                        animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.7, repeat: Infinity }} />
                    )}
                  </motion.div>
                  <span className="text-[10px] text-gray-600 font-mono">[{idx}]</span>
                  {pointer === idx && (
                    <div className="absolute -bottom-7 flex flex-col items-center z-10">
                      <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[5px] border-l-transparent border-r-transparent border-b-cyan-400" />
                      <div className="px-1.5 py-0.5 bg-cyan-900/60 border border-cyan-500/50 rounded text-[9px] text-cyan-300 font-mono mt-0.5">{pointerName || 'i'}</div>
                    </div>
                  )}
                  {pointer2 === idx && (
                    <div className="absolute -bottom-7 flex flex-col items-center z-10">
                      <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[5px] border-l-transparent border-r-transparent border-b-purple-400" />
                      <div className="px-1.5 py-0.5 bg-purple-900/60 border border-purple-500/50 rounded text-[9px] text-purple-300 font-mono mt-0.5">{pointer2Name || 'j'}</div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex items-end gap-1.5 relative" style={{ minHeight: 200 }}>
          {rangeStart !== undefined && rangeEnd !== undefined && (
            <div className="absolute bottom-8 h-0.5 bg-cyan-500/30 rounded" style={{ left: rangeStart * 46, width: (rangeEnd - rangeStart + 1) * 46, bottom: -2 }} />
          )}
          <AnimatePresence mode="sync">
            {nodes.map((node, idx) => {
              const c = HL[node.highlight || 'none']
              const val = Math.max(Number(node.value) || 1, 1)
              const h = Math.max(24, (val / maxVal) * 180)
              const isPivot = pivotIndex === idx

              return (
                <motion.div key={node.id} layout
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1, boxShadow: c.glow || 'none' }}
                  exit={{ opacity: 0, scaleY: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="flex flex-col items-center gap-1 origin-bottom relative"
                >
                  <motion.span className="text-[11px] font-mono font-bold transition-colors duration-200"
                    animate={{ color: c.text }} style={{ minWidth: 24, textAlign: 'center' }}>
                    {node.value}
                  </motion.span>
                  <motion.div
                    className="w-9 rounded-t relative overflow-hidden cursor-default"
                    style={{ height: h }}
                    animate={{ backgroundColor: c.bg, borderColor: c.border }}
                    transition={{ duration: 0.2 }}
                    initial={false}
                  >
                    <div className="absolute inset-0 border rounded-t" style={{ borderColor: c.border }} />
                    {isPivot && <div className="absolute top-0 left-0 right-0 h-0.5 bg-orange-400" />}
                    {(node.highlight === 'comparing' || node.highlight === 'swapping' || node.highlight === 'active') && (
                      <motion.div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/8"
                        animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.7, repeat: Infinity }} />
                    )}
                  </motion.div>
                  {/* Index label */}
                  <span className="text-[10px] text-gray-600 font-mono">{idx}</span>
                  {/* i pointer */}
                  {pointer === idx && (
                    <div className="absolute -bottom-8 flex flex-col items-center z-10">
                      <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[5px] border-l-transparent border-r-transparent border-b-cyan-400" />
                      <div className="px-1.5 py-0.5 bg-cyan-900/60 border border-cyan-500/50 rounded text-[9px] text-cyan-300 font-mono mt-0.5">{pointerName || 'i'}</div>
                    </div>
                  )}
                  {/* j pointer */}
                  {pointer2 === idx && (
                    <div className="absolute -bottom-8 flex flex-col items-center z-10 ml-10">
                      <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[5px] border-l-transparent border-r-transparent border-b-purple-400" />
                      <div className="px-1.5 py-0.5 bg-purple-900/60 border border-purple-500/50 rounded text-[9px] text-purple-300 font-mono mt-0.5">{pointer2Name || 'j'}</div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

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
          { label: 'Read/Active', hl: 'active' },
          { label: 'Comparing', hl: 'comparing' },
          { label: 'Written', hl: 'swapping' },
          { label: 'Visited', hl: 'visited' },
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
          { label: 'Found', hl: 'found' },
        ]} />
      )}
    </div>
  )
}
// ─── STRING + STACK VIEW ─────────────────────────────────────────────────────
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
}> = ({ nodes, stackItems, message, pointer, pointerName, pointer2, pointer2Name, stringName, stackName }) => {
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
                <span className="text-cyan-500 font-semibold">left</span>
                <span className="text-gray-600">=</span>
                <motion.span key={`l-${pointer}`} initial={{ scale: 1.3, color: '#00d4ff' }} animate={{ scale: 1, color: '#e8eaf0' }} className="font-bold">{pointer}</motion.span>
              </div>
            )}
            {pointer2 !== undefined && (
              <div className="flex items-center gap-1 text-[11px] font-mono">
                <span className="text-purple-400 font-semibold">right</span>
                <span className="text-gray-600">=</span>
                <motion.span key={`r-${pointer2}`} initial={{ scale: 1.3, color: '#a855f7' }} animate={{ scale: 1, color: '#e8eaf0' }} className="font-bold">{pointer2}</motion.span>
              </div>
            )}
            {pointer !== undefined && pointer2 !== undefined && pointer2 >= 0 && (
              <div className="flex items-center gap-1 text-[11px] font-mono">
                <span className="text-emerald-400 font-semibold">window</span>
                <span className="text-gray-600">=</span>
                <span className="text-emerald-300 font-bold">"{nodes.slice(pointer, pointer2 + 1).map(n => n.value).join('')}"</span>
                <span className="text-gray-600">({Math.max(0, pointer2 - pointer + 1)})</span>
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
              {[...items].reverse().map((item, i) => {
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
}> = ({ nodes, hashTable, message, pointer, pointerName, pointer2, pointer2Name, stringName, hashTableName, hashTableLabel }) => {
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
                <span className="text-cyan-500 font-semibold">left</span>
                <span className="text-gray-600">=</span>
                <motion.span key={`l-${pointer}`} initial={{ scale: 1.3, color: '#00d4ff' }} animate={{ scale: 1, color: '#e8eaf0' }} className="font-bold">{pointer}</motion.span>
              </div>
            )}
            {pointer2 !== undefined && (
              <div className="flex items-center gap-1 text-[11px] font-mono">
                <span className="text-purple-400 font-semibold">right</span>
                <span className="text-gray-600">=</span>
                <motion.span key={`r-${pointer2}`} initial={{ scale: 1.3, color: '#a855f7' }} animate={{ scale: 1, color: '#e8eaf0' }} className="font-bold">{pointer2}</motion.span>
              </div>
            )}
            {pointer !== undefined && pointer2 !== undefined && pointer2 >= 0 && (
              <div className="flex items-center gap-1 text-[11px] font-mono">
                <span className="text-emerald-400 font-semibold">window</span>
                <span className="text-gray-600">=</span>
                <span className="text-emerald-300 font-bold">"{nodes.slice(pointer, pointer2 + 1).map(n => n.value).join('')}"</span>
                <span className="text-gray-600">({Math.max(0, pointer2 - pointer + 1)})</span>
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
    </div>
  )
}

// ─── STRING VIEW ─────────────────────────────────────────────────────────────
const StringView: React.FC<{ nodes: DSANode[]; message?: string; pointer?: number; pointerName?: string; pointer2?: number; pointer2Name?: string }> = ({ nodes, message, pointer, pointerName, pointer2, pointer2Name }) => (
  <div className="flex flex-col items-center justify-center h-full gap-8 p-6">
    {message && (
      <motion.div key={message} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="px-4 py-2 bg-[#13151f] border border-[#252836] rounded-lg text-sm text-gray-300 font-mono text-center">
        {message}
      </motion.div>
    )}
    <div className="flex items-center gap-1">
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
            {pointer === idx && (
              <div className="absolute -top-7 flex flex-col items-center z-10">
                <div className="px-1.5 py-0.5 bg-cyan-900/60 border border-cyan-500/50 rounded text-[9px] text-cyan-300 font-mono mb-0.5">{pointerName || 'ptr'}</div>
                <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-cyan-400" />
              </div>
            )}
            {pointer2 === idx && (
              <div className="absolute -top-7 flex flex-col items-center z-10 ml-12">
                <div className="px-1.5 py-0.5 bg-purple-900/60 border border-purple-500/50 rounded text-[9px] text-purple-300 font-mono mb-0.5">{pointer2Name || 'ptr2'}</div>
                <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-purple-400" />
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
    <div className="mt-4 text-sm text-gray-400 font-mono bg-[#13151f] px-4 py-2 rounded-lg border border-[#252836]">
      "{nodes.map(n => n.value).join('')}"
    </div>
    <Legend items={[{ label: 'Left ptr', hl: 'comparing' }, { label: 'Right ptr', hl: 'comparing' }, { label: 'Swapped', hl: 'found' }]} />
  </div>
)

// ─── LINKED LIST VIEW ────────────────────────────────────────────────────────
const LinkedListView: React.FC<{ nodes: DSANode[]; edges?: DSAEdge[]; message?: string }> = ({ nodes, message }) => {
  if (!nodes.length) return <div className="flex items-center justify-center h-full text-gray-500 text-sm">Empty list</div>

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 p-6">
      {message && (
        <motion.div key={message} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="px-4 py-2 bg-[#13151f] border border-[#252836] rounded-lg text-sm text-gray-300 font-mono">{message}</motion.div>
      )}
      <div className="flex items-center gap-0 overflow-x-auto max-w-full pb-4 pt-10">
        {nodes.map((node, idx) => {
          const c = HL[node.highlight || 'none']
          return (
            <React.Fragment key={node.id}>
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1, boxShadow: c.glow || 'none' }}
                transition={{ delay: idx * 0.08, type: 'spring', stiffness: 300 }}
                className="flex-shrink-0 relative"
              >
                {node.label && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
                    <div className="px-2 py-0.5 bg-gray-800 border border-gray-600 rounded text-[9px] text-gray-300 font-mono whitespace-nowrap">
                      {node.label}
                    </div>
                    <div className="w-px h-3 bg-gray-500" />
                    <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-gray-500" />
                  </div>
                )}
                <div className="border-2 rounded-xl overflow-hidden" style={{ borderColor: c.border }}>
                  <div className="flex">
                    {/* Value cell */}
                    <div className="w-14 h-14 flex flex-col items-center justify-center" style={{ backgroundColor: c.bg }}>
                      <span className="text-xs text-gray-500 font-mono">val</span>
                      <span className="text-base font-mono font-bold" style={{ color: c.text }}>{node.value}</span>
                    </div>
                    {/* Next pointer cell */}
                    <div className="w-8 h-14 flex items-center justify-center border-l" style={{ borderColor: c.border, backgroundColor: c.bg + '80' }}>
                      <span className="text-gray-500 text-xs rotate-90 font-mono">→</span>
                    </div>
                  </div>
                  <div className="text-center text-[10px] text-gray-600 font-mono py-0.5" style={{ backgroundColor: c.bg }}>
                    [{`0x${(0x1000 + idx * 16).toString(16).toUpperCase()}`}]
                  </div>
                </div>
              </motion.div>

              {/* Arrow */}
              {idx < nodes.length - 1 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.08 + 0.1 }}
                  className="flex items-center mx-0.5 flex-shrink-0">
                  <div className="w-6 h-0.5 bg-gray-600" />
                  <div className="w-0 h-0 border-l-[6px] border-t-[4px] border-b-[4px] border-l-gray-500 border-t-transparent border-b-transparent" />
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1 ml-2 flex-shrink-0">
                  <div className="w-4 h-0.5 bg-gray-600" />
                  <div className="px-2 py-0.5 border border-red-500/40 rounded text-[10px] text-red-400 font-mono">null</div>
                </motion.div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      <div className="text-xs text-gray-500 font-mono">{nodes.map(n => n.value).join(' → ')} → null</div>
      <Legend items={[{ label: 'Active', hl: 'active' }, { label: 'Visited', hl: 'visited' }, { label: 'Found', hl: 'found' }]} />
    </div>
  )
}

// ─── TREE VIEW (SVG) ─────────────────────────────────────────────────────────
const TreeView: React.FC<{ nodes: DSANode[]; edges?: DSAEdge[]; message?: string }> = ({ nodes, edges, message }) => {
  if (!nodes.length) return <div className="flex items-center justify-center h-full text-gray-500 text-sm">Empty tree</div>

  const W = 600, H = 400

  return (
    <div className="flex flex-col items-center h-full gap-3 p-4 overflow-hidden">
      {message && (
        <motion.div key={message} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="px-3 py-1.5 bg-[#13151f] border border-[#252836] rounded-lg text-xs text-gray-300 font-mono text-center flex-shrink-0">
          {message}
        </motion.div>
      )}
      <div className="flex-1 w-full overflow-auto">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 300 }}>
          {/* Edges */}
          {edges?.map(edge => {
            const from = nodes.find(n => n.id === edge.from)
            const to = nodes.find(n => n.id === edge.to)
            if (!from?.x || !from?.y || !to?.x || !to?.y) return null
            const tc = HL[to.highlight || 'none']
            return (
              <motion.line key={edge.id}
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{ opacity: 1, pathLength: 1 }}
                stroke={tc.border}
                strokeWidth="1.5"
                strokeOpacity="0.6"
                markerEnd="url(#arrowhead)"
              />
            )
          })}
          {/* Arrow marker */}
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#374151" />
            </marker>
          </defs>

          {/* Nodes */}
          {nodes.map((node) => {
            if (!node.x || !node.y) return null
            const c = HL[node.highlight || 'none']
            const r = 24
            return (
              <motion.g key={node.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <circle cx={node.x} cy={node.y} r={r + 4} fill={c.border + '18'} />
                <circle cx={node.x} cy={node.y} r={r} fill={c.bg} stroke={c.border} strokeWidth="2" />
                {c.glow && <circle cx={node.x} cy={node.y} r={r + 2} fill="none" stroke={c.border} strokeWidth="1" opacity="0.4" />}
                <text x={node.x} y={node.y} textAnchor="middle" dominantBaseline="central"
                  fill={c.text} fontSize="12" fontFamily="JetBrains Mono, monospace" fontWeight="bold">
                  {node.value}
                </text>
              </motion.g>
            )
          })}
        </svg>
      </div>
      <Legend items={[{ label: 'Active', hl: 'active' }, { label: 'Visited', hl: 'visited' }, { label: 'Found', hl: 'found' }]} />
    </div>
  )
}

// ─── GRAPH VIEW (SVG) ────────────────────────────────────────────────────────
const GraphView: React.FC<{ nodes: DSANode[]; edges?: DSAEdge[]; message?: string; queueItems?: (string | number)[] }> = ({ nodes, edges, message, queueItems }) => {
  if (!nodes.length) return <div className="flex items-center justify-center h-full text-gray-500 text-sm">Empty graph</div>

  const W = 500, H = 400

  return (
    <div className="flex flex-col h-full gap-3 p-4 overflow-hidden">
      {message && (
        <motion.div key={message} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="px-3 py-1.5 bg-[#13151f] border border-[#252836] rounded-lg text-xs text-gray-300 font-mono text-center flex-shrink-0">
          {message}
        </motion.div>
      )}

      <div className="flex gap-4 flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full">
            {/* Edges */}
            {edges?.map(edge => {
              const from = nodes.find(n => n.id === edge.from)
              const to = nodes.find(n => n.id === edge.to)
              if (!from?.x || !from?.y || !to?.x || !to?.y) return null
              const highlighted = from.highlight !== 'none' && from.highlight !== undefined && to.highlight !== 'none'
              return (
                <motion.line key={edge.id}
                  initial={{ opacity: 0, x1: from.x, y1: from.y, x2: to.x, y2: to.y }}
                  animate={{ x1: from.x, y1: from.y, x2: to.x, y2: to.y, opacity: 1, stroke: highlighted ? '#00d4ff' : '#374151', strokeWidth: highlighted ? 2 : 1.5 }}
                  transition={{ type: 'spring', stiffness: 250, damping: 25, opacity: { duration: 0.3 } }}
                />
              )
            })}

            {/* Nodes */}
            {nodes.map(node => {
              if (!node.x || !node.y) return null
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
          <div className="w-24 flex-shrink-0 flex flex-col gap-2">
            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider text-center">Queue</div>
            <AnimatePresence mode="popLayout">
              {queueItems.map((item, i) => (
                <motion.div key={`${item}-${i}`}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="px-2 py-1.5 bg-[#0d2233] border border-cyan-500/40 rounded text-center text-xs font-mono text-cyan-400">
                  {item}
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
              {[...items].reverse().map((item, i) => {
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
      <div className="grid grid-cols-2 gap-2 max-w-sm w-full">
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
          <div className="flex items-end gap-1.5 flex-wrap justify-center" style={{ minHeight: 120 }}>
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
                    {pointer === idx && (
                      <div className="absolute -bottom-8 flex flex-col items-center z-10">
                        <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[5px] border-l-transparent border-r-transparent border-b-cyan-400" />
                        <div className="px-1.5 py-0.5 bg-cyan-900/60 border border-cyan-500/50 rounded text-[9px] text-cyan-300 font-mono mt-0.5">{pointerName || 'ptr'}</div>
                      </div>
                    )}
                    {pointer2 === idx && (
                      <div className="absolute -bottom-8 flex flex-col items-center z-10 ml-8">
                        <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[5px] border-l-transparent border-r-transparent border-b-purple-400" />
                        <div className="px-1.5 py-0.5 bg-purple-900/60 border border-purple-500/50 rounded text-[9px] text-purple-300 font-mono mt-0.5">{pointer2Name || 'ptr2'}</div>
                      </div>
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
                  {val !== '✓' && <span className="text-gray-600 text-[10px] font-mono">→ idx</span>}
                  <span className="text-amber-400 text-xs font-mono font-bold">{String(val)}</span>
                </motion.div>
              ))}
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
          {['Bubble Sort','Binary Search','Linked List','BST','BFS/DFS','Two Sum','Stack/Queue','HashMap','Fibonacci'].map(alg => (
            <div key={alg} className="px-2 py-1 bg-[#13151f] border border-[#1e2130] rounded text-gray-600 text-center hover:text-gray-400 hover:border-[#252836] transition-colors">{alg}</div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      {dsaState.type === 'array' && dsaState.hashTable !== undefined
        ? <TwoSumView nodes={dsaState.nodes} hashTable={dsaState.hashTable} message={dsaState.message} comparisons={dsaState.comparisons} arrayName={dsaState.arrayName} hashTableName={dsaState.hashTableName} hashTableLabel={dsaState.hashTableLabel} />
        : dsaState.type === 'array' && <ArrayView nodes={dsaState.nodes} auxiliaryData={dsaState.auxiliaryData} comparisons={dsaState.comparisons} swaps={dsaState.swaps} message={dsaState.message} pointer={dsaState.pointer} pointerName={dsaState.pointerName} pointer2={dsaState.pointer2} pointer2Name={dsaState.pointer2Name} rangeStart={dsaState.rangeStart} rangeEnd={dsaState.rangeEnd} pivotIndex={dsaState.pivotIndex} />}
      {dsaState.type === 'string' && dsaState.hashTable !== undefined
        ? <StringHashMapView nodes={dsaState.nodes} hashTable={dsaState.hashTable} message={dsaState.message} pointer={dsaState.pointer} pointerName={dsaState.pointerName} pointer2={dsaState.pointer2} pointer2Name={dsaState.pointer2Name} stringName={dsaState.arrayName} hashTableName={dsaState.hashTableName} hashTableLabel={dsaState.hashTableLabel} />
        : dsaState.type === 'string' && dsaState.stackItems !== undefined
        ? <StringStackView nodes={dsaState.nodes} stackItems={dsaState.stackItems} message={dsaState.message} pointer={dsaState.pointer} pointerName={dsaState.pointerName} pointer2={dsaState.pointer2} pointer2Name={dsaState.pointer2Name} stringName={dsaState.arrayName} stackName={dsaState.stackName} />
        : dsaState.type === 'string' && <StringView nodes={dsaState.nodes} message={dsaState.message} pointer={dsaState.pointer} pointerName={dsaState.pointerName} pointer2={dsaState.pointer2} pointer2Name={dsaState.pointer2Name} />}
      {dsaState.type === 'linkedlist' && (
        new Set(dsaState.nodes.map(n => n.y || 0)).size > 1 || (dsaState.edges && dsaState.edges.some(e => e.from > e.to))
          ? <GraphView nodes={dsaState.nodes} edges={dsaState.edges} message={dsaState.message} />
          : <LinkedListView nodes={dsaState.nodes} edges={dsaState.edges} message={dsaState.message} />
      )}
      {dsaState.type === 'tree' && <TreeView nodes={dsaState.nodes} edges={dsaState.edges} message={dsaState.message} />}
      {dsaState.type === 'heap' && <ArrayView nodes={dsaState.nodes} comparisons={dsaState.comparisons} swaps={dsaState.swaps} message={dsaState.message ?? 'Min/Max Heap'} />}
      {dsaState.type === 'matrix' && <ArrayView nodes={dsaState.nodes} message={dsaState.message ?? 'Matrix'} />}
      {dsaState.type === 'graph' && <GraphView nodes={dsaState.nodes} edges={dsaState.edges} message={dsaState.message} queueItems={dsaState.queueItems} />}
      {dsaState.type === 'stack' && <StackView nodes={dsaState.nodes} stackItems={dsaState.stackItems} message={dsaState.message} />}
      {dsaState.type === 'queue' && <QueueView nodes={dsaState.nodes} queueItems={dsaState.queueItems} message={dsaState.message} />}
      {dsaState.type === 'hashmap' && <HashMapView nodes={dsaState.nodes} hashTable={dsaState.hashTable} message={dsaState.message} />}
    </div>
  )
}
