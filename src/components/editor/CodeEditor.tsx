import React, { useRef } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'
import { Code2, Copy, Download } from 'lucide-react'
import { useIDEStore } from '../../store/ideStore'

const LANGUAGE_MAP: Record<string, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  csharp: 'csharp',
  go: 'go',
  rust: 'rust',
}

export const CodeEditor: React.FC = () => {
  const { code, setCode, language, currentLine, executionSteps, currentStepIndex, fileName } = useIDEStore()
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null)
  const decorationsRef = useRef<string[]>([])

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    editor.onDidChangeCursorPosition((e) => {
      useIDEStore.getState().setCurrentLine(e.position.lineNumber)
    })

    editor.onDidChangeCursorSelection((e) => {
      const selection = editor.getModel()?.getValueInRange(e.selection) || ''
      useIDEStore.getState().setSelectedText(selection)
    })
  }

  // Highlight current execution line
  React.useEffect(() => {
    if (!editorRef.current) return
    const monaco = monacoRef.current || (window as typeof window & { monaco?: typeof import('monaco-editor') }).monaco
    if (!monaco) return

    const step = executionSteps[currentStepIndex]
    if (!step) {
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, [])
      return
    }

    decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, [
      {
        range: new monaco.Range(step.line, 1, step.line, 1),
        options: {
          isWholeLine: true,
          className: 'execution-line-highlight',
          glyphMarginClassName: 'execution-glyph',
          linesDecorationsClassName: 'execution-line-decoration',
          overviewRuler: {
            color: '#00d4ff',
            position: monaco.editor.OverviewRulerLane.Left
          }
        }
      }
    ])

    editorRef.current.revealLineInCenterIfOutsideViewport(step.line, 1)
  }, [currentStepIndex, executionSteps])

  const handleCopy = () => navigator.clipboard?.writeText(code)

  const handleDownload = () => {
    const ext = language === 'python' ? 'py' : language === 'java' ? 'java' : language === 'cpp' ? 'cpp' : 'js'
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileName}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="panel h-full" style={{ minHeight: 0 }}>
      {/* Panel Header */}
      <div className="panel-header flex-shrink-0">
        <div className="flex items-center gap-2">
          <Code2 size={14} className="text-accent-cyan" />
          <span className="text-text-secondary text-xs font-mono font-medium">{fileName}.{language === 'python' ? 'py' : language === 'java' ? 'java' : language === 'cpp' ? 'cpp' : 'js'}</span>
          {currentLine > 0 && (
            <span className="badge bg-bg-tertiary text-text-muted">
              Ln {currentLine}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleCopy} className="icon-btn" title="Copy code">
            <Copy size={13} />
          </button>
          <button onClick={handleDownload} className="icon-btn" title="Download">
            <Download size={13} />
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        <style>{`
          .execution-line-highlight {
            background: rgba(0, 212, 255, 0.08) !important;
            border-left: 2px solid #00d4ff !important;
          }
          .execution-glyph::before {
            content: '▶';
            color: #00d4ff;
            font-size: 10px;
          }
        `}</style>
        <Editor
          height="100%"
          language={LANGUAGE_MAP[language]}
          value={code}
          onChange={(val) => setCode(val || '')}
          onMount={handleMount}
          theme="vs-dark"
          options={{
            fontSize: 13,
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontLigatures: true,
            lineHeight: 1.7,
            minimap: { enabled: false },
            scrollbar: { verticalScrollbarSize: 4, horizontalScrollbarSize: 4 },
            padding: { top: 16, bottom: 16 },
            glyphMargin: true,
            lineNumbers: 'on',
            renderLineHighlight: 'none',
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            bracketPairColorization: { enabled: true },
            guides: { bracketPairs: true },
            suggest: { showKeywords: true },
            quickSuggestions: true,
          }}
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-bg-secondary border-t border-border-subtle flex-shrink-0">
        <div className="flex items-center gap-3 text-xs text-text-muted font-mono">
          <span>{code.split('\n').length} lines</span>
          <span>UTF-8</span>
          <span>LF</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted font-mono">
          <span className="text-accent-cyan/60 font-display">{language.toUpperCase()}</span>
        </div>
      </div>
    </div>
  )
}
