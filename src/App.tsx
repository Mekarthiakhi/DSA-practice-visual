import { useRef } from 'react'
import { TopBar } from './components/layout/TopBar'
import { CodeEditor } from './components/editor/CodeEditor'
import { VisualizationPanel } from './components/visualization/VisualizationPanel'
import { AIPanel } from './components/ai-panel/AIPanel'
import { LeetCodePanel } from './components/leetcode/LeetCodePanel'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useIDEStore } from './store/ideStore'
import { usePanelResize } from './hooks/usePanelResize'

export default function App() {
  const { leftPanelWidth, rightPanelWidth, setLeftPanelWidth, setRightPanelWidth } = useIDEStore()
  const containerRef = useRef<HTMLDivElement>(null)

  // Use custom hook for panel resizing - handles cleanup automatically
  const { startDrag } = usePanelResize(
    containerRef,
    setLeftPanelWidth,
    setRightPanelWidth,
    {
      minLeftWidth: 20,
      maxLeftWidth: 55,
      minRightWidth: 18,
      maxRightWidth: 45,
    }
  )

  const centerWidth = Math.max(100 - leftPanelWidth - rightPanelWidth, 20)

  return (
    <div className="flex flex-col h-screen" style={{ background: '#09090e' }}>
      <TopBar />
      <LeetCodePanel />

      <div
        ref={containerRef}
        className="flex flex-1 overflow-hidden"
        style={{ minHeight: 0 }}
      >
        {/* Left: Code Editor */}
        <div style={{ width: `${leftPanelWidth}%`, minWidth: 0 }} className="flex-shrink-0 flex flex-col">
          <ErrorBoundary componentName="Code Editor">
            <CodeEditor />
          </ErrorBoundary>
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
          <ErrorBoundary componentName="Visualization Panel">
            <VisualizationPanel />
          </ErrorBoundary>
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
          <ErrorBoundary componentName="AI Panel">
            <AIPanel />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  )
}
