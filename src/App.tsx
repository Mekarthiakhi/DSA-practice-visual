import React, { useCallback, useRef } from 'react'
import { TopBar } from './components/layout/TopBar'
import { CodeEditor } from './components/editor/CodeEditor'
import { VisualizationPanel } from './components/visualization/VisualizationPanel'
import { AIPanel } from './components/ai-panel/AIPanel'
import { useIDEStore } from './store/ideStore'

// Expose the store globally so aiService can read the API key without circular deps
;(window as typeof window & { __ideStore__: typeof useIDEStore })['__ideStore__'] = useIDEStore

export default function App() {
  const { leftPanelWidth, rightPanelWidth, setLeftPanelWidth, setRightPanelWidth } = useIDEStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const isDraggingLeft = useRef(false)
  const isDraggingRight = useRef(false)

  // Use stable refs so document event listeners always get the latest version
  const moveHandlerRef = useRef<(e: MouseEvent) => void>()
  const upHandlerRef = useRef<(e: MouseEvent) => void>()

  const cleanup = useCallback(() => {
    isDraggingLeft.current = false
    isDraggingRight.current = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    if (moveHandlerRef.current) document.removeEventListener('mousemove', moveHandlerRef.current)
    if (upHandlerRef.current)   document.removeEventListener('mouseup',   upHandlerRef.current)
  }, [])

  const startDrag = (isLeft: boolean) => (e: React.MouseEvent) => {
    e.preventDefault()
    if (isLeft) isDraggingLeft.current = true
    else        isDraggingRight.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const moveHandler = (me: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = me.clientX - rect.left
      const total = rect.width
      if (isDraggingLeft.current) {
        setLeftPanelWidth(Math.min(Math.max((x / total) * 100, 20), 55))
      }
      if (isDraggingRight.current) {
        setRightPanelWidth(Math.min(Math.max(((total - x) / total) * 100, 18), 45))
      }
    }

    const upHandler = () => cleanup()

    moveHandlerRef.current = moveHandler
    upHandlerRef.current   = upHandler
    document.addEventListener('mousemove', moveHandler)
    document.addEventListener('mouseup',   upHandler, { once: true })
  }

  const centerWidth = Math.max(100 - leftPanelWidth - rightPanelWidth, 20)

  return (
    <div className="flex flex-col h-screen" style={{ background: '#09090e' }}>
      <TopBar />

      <div
        ref={containerRef}
        className="flex flex-1 overflow-hidden"
        style={{ minHeight: 0 }}
      >
        {/* Left: Code Editor */}
        <div style={{ width: `${leftPanelWidth}%`, minWidth: 0 }} className="flex-shrink-0 flex flex-col">
          <CodeEditor />
        </div>

        {/* Left resizer */}
        <div
          className="flex-shrink-0 flex items-center justify-center cursor-col-resize group relative"
          style={{ width: 5, background: '#0c0e14', borderLeft: '1px solid #1a1d2a', borderRight: '1px solid #1a1d2a' }}
          onMouseDown={startDrag(true)}
        >
          <div className="absolute inset-y-0 left-0 right-0 group-hover:bg-cyan-500/10 transition-colors" />
          <div className="w-0.5 h-12 rounded-full bg-[#252836] group-hover:bg-cyan-500/50 transition-colors" />
        </div>

        {/* Center: Visualization */}
        <div style={{ width: `${centerWidth}%`, minWidth: 0 }} className="flex-shrink-0 flex flex-col">
          <VisualizationPanel />
        </div>

        {/* Right resizer */}
        <div
          className="flex-shrink-0 flex items-center justify-center cursor-col-resize group relative"
          style={{ width: 5, background: '#0c0e14', borderLeft: '1px solid #1a1d2a', borderRight: '1px solid #1a1d2a' }}
          onMouseDown={startDrag(false)}
        >
          <div className="absolute inset-y-0 left-0 right-0 group-hover:bg-purple-500/10 transition-colors" />
          <div className="w-0.5 h-12 rounded-full bg-[#252836] group-hover:bg-purple-500/50 transition-colors" />
        </div>

        {/* Right: AI Panel */}
        <div style={{ width: `${rightPanelWidth}%`, minWidth: 0 }} className="flex-shrink-0 flex flex-col">
          <AIPanel />
        </div>
      </div>
    </div>
  )
}
