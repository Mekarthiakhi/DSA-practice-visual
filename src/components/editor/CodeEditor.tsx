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

    // Fix: Monaco's native-edit-context element takes up 96px in production,
    // pushing all code lines down. Force-hide it and recalculate layout.
    const domNode = editor.getDomNode()
    if (domNode) {
      const nativeEditCtx = domNode.querySelector('.native-edit-context') as HTMLElement
      if (nativeEditCtx) {
        nativeEditCtx.style.display = 'none'
        nativeEditCtx.style.height = '0px'
        nativeEditCtx.style.width = '0px'
        nativeEditCtx.style.overflow = 'hidden'
      }
      // Also hide any textarea that might expand
      const textarea = domNode.querySelector('textarea.inputarea') as HTMLElement
      if (textarea) {
        textarea.style.height = '1px'
        textarea.style.width = '1px'
        textarea.style.overflow = 'hidden'
      }
    }
    // Force Monaco to recalculate layout after hiding elements
    setTimeout(() => editor.layout(), 50)
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

    const model = editorRef.current.getModel()
    const line = Math.max(1, Math.min(step.line, model?.getLineCount() || 1))
    const isError = step.diagnostic?.severity === 'error'
    const isWarning = step.diagnostic?.severity === 'warning'

    decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, [
      {
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          className: isError ? 'execution-error-line-highlight' : isWarning ? 'execution-warning-line-highlight' : 'execution-line-highlight',
          glyphMarginClassName: isError ? 'execution-error-glyph' : isWarning ? 'execution-warning-glyph' : 'execution-glyph',
          linesDecorationsClassName: isError ? 'execution-error-line-decoration' : isWarning ? 'execution-warning-line-decoration' : 'execution-line-decoration',
          overviewRuler: {
            color: isError ? '#ef4444' : isWarning ? '#f59e0b' : '#00d4ff',
            position: monaco.editor.OverviewRulerLane.Left
          }
        }
      }
    ])

    editorRef.current.revealLineInCenterIfOutsideViewport(line, 1)
  }, [currentStepIndex, executionSteps])

  React.useEffect(() => {
    const editor = editorRef.current
    const monaco = monacoRef.current
    const model = editor?.getModel()
    if (!editor || !monaco || !model) return

    const maxLine = model.getLineCount()
    const markers = executionSteps
      .filter(step => !!step.diagnostic)
      .map(step => {
        const diagnostic = step.diagnostic!
        const line = Math.max(1, Math.min(diagnostic.line, maxLine))
        const column = Math.max(1, Math.min(diagnostic.column || 1, model.getLineMaxColumn(line)))
        return {
          startLineNumber: line,
          startColumn: column,
          endLineNumber: line,
          endColumn: model.getLineMaxColumn(line),
          message: `${diagnostic.type}: ${diagnostic.message}`,
          severity: diagnostic.severity === 'error'
            ? monaco.MarkerSeverity.Error
            : monaco.MarkerSeverity.Warning,
          source: 'AlgoVision execution',
        }
      })

    monaco.editor.setModelMarkers(model, 'algovision-execution', markers)
    return () => monaco.editor.setModelMarkers(model, 'algovision-execution', [])
  }, [executionSteps])

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
    <div className="panel h-full" data-testid="code-editor-panel" style={{ minHeight: 0 }}>
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
          /* Force-hide Monaco's internal input elements that can expand in
             production environments and cause a visible blank box at the top.
             Covers both the legacy textarea (.inputarea) and the newer
             Edit Context API div (.native-edit-context). */
          .monaco-editor .native-edit-context,
          .monaco-editor .inputarea {
            width: 1px !important;
            height: 1px !important;
            overflow: hidden !important;
            opacity: 0 !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            display: none !important;
          }
          .execution-line-highlight {
            background: rgba(0, 212, 255, 0.08) !important;
            border-left: 2px solid #00d4ff !important;
          }
          .execution-glyph::before {
            content: '▶';
            color: #00d4ff;
            font-size: 10px;
          }
          .execution-error-line-highlight {
            background: rgba(239, 68, 68, 0.12) !important;
            border-left: 2px solid #ef4444 !important;
          }
          .execution-error-glyph::before {
            content: '!';
            color: #ef4444;
            font-size: 12px;
            font-weight: 800;
          }
          .execution-warning-line-highlight {
            background: rgba(245, 158, 11, 0.10) !important;
            border-left: 2px solid #f59e0b !important;
          }
          .execution-warning-glyph::before {
            content: '?';
            color: #f59e0b;
            font-size: 12px;
            font-weight: 800;
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
            // Monaco's automatic screen-reader mode expands its internal input
            // textarea. The IDE supplies its own execution/navigation UI, so keep
            // that implementation detail hidden instead of exposing a white box.
            accessibilitySupport: 'off',
            // Disable the Edit Context API that creates a native-edit-context
            // element causing 96px of blank space at the top in production.
            ...({ experimentalEditContextEnabled: false } as Record<string, unknown>),
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
