import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, BarChart2, GitBranch, Zap, Bug, Key, Loader, RefreshCw, CheckCircle, AlertCircle, Code2 } from 'lucide-react'
import { useIDEStore, AITab } from '../../store/ideStore'
import { explainCode, analyzeComplexity, generateFlowchart, suggestOptimizations, chatWithAI } from '../../utils/aiService'

// ─── Language display config ──────────────────────────────────────────────────
const LANG_INFO: Record<string, { label: string; color: string; canBrowser: boolean }> = {
  javascript: { label: 'JavaScript', color: '#f7df1e', canBrowser: true  },
  typescript: { label: 'TypeScript', color: '#3178c6', canBrowser: true  },
  python:     { label: 'Python',     color: '#3776ab', canBrowser: false },
  java:       { label: 'Java',       color: '#ed8b00', canBrowser: false },
  cpp:        { label: 'C++',        color: '#00599c', canBrowser: false },
  c:          { label: 'C',          color: '#a8b9cc', canBrowser: false },
  csharp:     { label: 'C#',         color: '#9b4f96', canBrowser: false },
  go:         { label: 'Go',         color: '#00add8', canBrowser: false },
  rust:       { label: 'Rust',       color: '#dea584', canBrowser: false },
}

const TABS: { id: AITab; label: string; icon: React.ReactNode }[] = [
  { id: 'explain',    label: 'Explain',    icon: <Bot size={10} /> },
  { id: 'complexity', label: 'Complexity', icon: <BarChart2 size={10} /> },
  { id: 'flowchart',  label: 'Flowchart',  icon: <GitBranch size={10} /> },
  { id: 'optimize',   label: 'Optimize',   icon: <Zap size={10} /> },
]

// ─── Markdown renderer ────────────────────────────────────────────────────────
const MarkdownText: React.FC<{ content: string }> = ({ content }) => {
  const html = content
    .replace(/```(\w+)?\n?([\s\S]*?)```/g,
      '<pre class="bg-[#0a0c14] border border-[#1e2130] rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono text-cyan-300 leading-relaxed"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g,
      '<code class="bg-[#13151f] px-1 py-0.5 rounded text-cyan-400 text-xs font-mono">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-gray-200 font-semibold">$1</strong>')
    .replace(/^### (.+)$/gm, '<h3 class="text-gray-200 font-semibold text-xs mt-3 mb-1.5">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 class="text-gray-100 font-bold text-sm mt-3 mb-1.5">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 class="text-white font-bold text-sm mt-3 mb-2">$1</h1>')
    .replace(/^[-*] (.+)$/gm, '<li class="ml-3 text-gray-400 text-xs mb-0.5 flex gap-1.5"><span class="text-cyan-600 flex-shrink-0">•</span><span>$1</span></li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-3 text-gray-400 text-xs mb-0.5">$1. $2</li>')
    .replace(/\n\n/g, '<div class="my-1.5"></div>')
    .replace(/\n/g, '<br/>')
  return <div className="text-gray-400 text-xs leading-relaxed space-y-0.5" dangerouslySetInnerHTML={{ __html: html }} />
}

// ─── API Key Setup Panel ──────────────────────────────────────────────────────
const ApiKeySetup: React.FC<{ onSave: (key: string) => void }> = ({ onSave }) => {
  const [val, setVal] = useState('')
  return (
    <div className="p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2 p-3 bg-amber-500/8 border border-amber-500/20 rounded-xl">
        <Key size={14} className="text-amber-400 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-amber-300">API Key Required</p>
          <p className="text-[10px] text-amber-600 mt-0.5">Needed for non-JS language tracing & AI analysis</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <input
          value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && val.startsWith('sk-ant') && onSave(val)}
          type="password" placeholder="sk-ant-api03-..."
          className="w-full bg-[#0a0c14] border border-[#1e2130] focus:border-cyan-500/50 rounded-lg px-3 py-2 text-xs font-mono text-gray-300 placeholder-gray-700 outline-none transition-colors"
        />
        <button onClick={() => val.startsWith('sk-') && onSave(val)}
          disabled={!val.startsWith('sk-')}
          className="py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: val.startsWith('sk-') ? 'linear-gradient(135deg,#00b4d8,#0077b6)' : '#1e2130', color: val.startsWith('sk-') ? 'white' : '#4b5563' }}>
          Save API Key
        </button>
      </div>
      <p className="text-[10px] text-gray-700 leading-relaxed">
        Key is stored in memory only (not persisted).<br/>
        Get yours at <span className="text-cyan-700">console.anthropic.com</span>
      </p>
    </div>
  )
}

// ─── Main AIPanel ─────────────────────────────────────────────────────────────
export const AIPanel: React.FC = () => {
  const {
    activeAITab, setActiveAITab,
    code, language, currentLine,
    aiMessages, addAIMessage, clearAIMessages,
    aiApiKey, setAiApiKey,
  } = useIDEStore()

  const [chatInput, setChatInput]   = useState('')
  const [isLoading, setIsLoading]   = useState(false)
  const [result, setResult]         = useState<string|null>(null)
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [apiKeyInput, setApiKeyInput]   = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [aiMessages, result])

  const langInfo = LANG_INFO[language] || LANG_INFO.javascript
  const hasKey = !!aiApiKey

  const runAnalysis = async (type: AITab) => {
    if (isLoading) return
    setIsLoading(true); setResult(null)
    try {
      let res = ''
      switch (type) {
        case 'explain':    res = await explainCode(code, currentLine > 0 ? currentLine : undefined, aiApiKey || undefined); break
        case 'complexity': res = await analyzeComplexity(code, aiApiKey || undefined); break
        case 'flowchart':  res = await generateFlowchart(code, aiApiKey || undefined); break
        case 'optimize':   res = await suggestOptimizations(code, aiApiKey || undefined); break
      }
      setResult(res)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setResult(`⚠️ ${msg}`)
    } finally { setIsLoading(false) }
  }

  const handleChat = async () => {
    if (!chatInput.trim() || isLoading) return
    const userMsg = chatInput.trim(); setChatInput('')
    const userM = { id: Date.now().toString(), role: 'user' as const, content: userMsg, timestamp: Date.now() }
    addAIMessage(userM)
    const loadM = { id: (Date.now()+1).toString(), role: 'assistant' as const, content: '', timestamp: Date.now(), isLoading: true }
    addAIMessage(loadM); setIsLoading(true)
    try {
      const history = [...aiMessages, userM].map(m => ({ role: m.role, content: m.content }))
      const response = await chatWithAI(history, code, aiApiKey || undefined)
      const store = useIDEStore.getState()
      const msgs = store.aiMessages.filter(m => m.id !== loadM.id)
      store.clearAIMessages(); msgs.forEach(m => store.addAIMessage(m))
      store.addAIMessage({ id: loadM.id, role: 'assistant', content: response, timestamp: Date.now() })
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'AI unavailable — check API key.'
      const store = useIDEStore.getState()
      const msgs = store.aiMessages.filter(m => m.id !== loadM.id)
      store.clearAIMessages(); msgs.forEach(m => store.addAIMessage(m))
      store.addAIMessage({ id: loadM.id, role: 'assistant', content: `⚠️ ${errMsg}`, timestamp: Date.now() })
    } finally { setIsLoading(false) }
  }

  return (
    <div className="panel h-full flex flex-col" style={{ background: '#0c0e14' }}>

      {/* Header */}
      <div className="panel-header flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'rgba(168,85,247,.15)', border: '1px solid rgba(168,85,247,.3)' }}>
            <Bot size={11} className="text-purple-400" />
          </div>
          <span className="text-gray-500 text-xs font-medium">AI Assistant</span>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: 'rgba(168,85,247,.08)', border: '1px solid rgba(168,85,247,.2)', color: '#a855f7' }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: langInfo.color }} />
            {langInfo.label}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {hasKey
            ? <div title="API key active" className="p-1.5"><CheckCircle size={12} className="text-green-500" /></div>
            : <button onClick={() => setShowKeyInput(!showKeyInput)} className="icon-btn" title="Set API key"><Key size={12} /></button>
          }
          {hasKey && <button onClick={() => { setAiApiKey(''); }} className="icon-btn" title="Clear API key"><AlertCircle size={12} /></button>}
          <button onClick={clearAIMessages} className="icon-btn" title="Clear chat"><RefreshCw size={11} /></button>
        </div>
      </div>

      {/* API key banner if no key + non-browser lang */}
      <AnimatePresence>
        {!hasKey && !langInfo.canBrowser && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden flex-shrink-0">
            <div className="mx-3 mt-2 p-2.5 bg-amber-500/8 border border-amber-500/20 rounded-xl flex items-start gap-2">
              <Key size={12} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-amber-300 font-semibold">{langInfo.label} needs an API key</p>
                <p className="text-[10px] text-amber-700 mt-0.5">Without it, you'll see a static trace. Click 🔑 to add your key for live AI simulation.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline API key input */}
      <AnimatePresence>
        {showKeyInput && !hasKey && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden flex-shrink-0">
            <div className="px-3 pt-2 pb-1 flex gap-2">
              <input value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && apiKeyInput.startsWith('sk-') && (setAiApiKey(apiKeyInput), setShowKeyInput(false))}
                type="password" placeholder="sk-ant-api03-..."
                className="flex-1 bg-[#0a0c14] border border-[#1e2130] focus:border-purple-500/50 rounded-lg px-2 py-1.5 text-xs font-mono text-gray-300 placeholder-gray-700 outline-none" />
              <button onClick={() => { setAiApiKey(apiKeyInput); setShowKeyInput(false) }}
                disabled={!apiKeyInput.startsWith('sk-')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 transition-all"
                style={{ background: 'rgba(168,85,247,.2)', color: '#a855f7', border: '1px solid rgba(168,85,247,.3)' }}>
                Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analysis tabs */}
      <div className="flex items-center border-b border-[#1a1d2a] bg-[#0f1117] flex-shrink-0 px-2">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => { setActiveAITab(tab.id); setResult(null) }}
            className={`tab flex items-center gap-1.5 ${activeAITab === tab.id ? 'tab-active' : ''}`}>
            {tab.icon}{tab.label}
          </button>
        ))}
        <button onClick={() => { setActiveAITab('optimize'); setResult(null); runAnalysis('optimize') }}
          className="tab flex items-center gap-1.5 ml-auto text-red-500/60 hover:text-red-400">
          <Bug size={10} />Debug
        </button>
      </div>

      {/* Analyze button */}
      <div className="px-3 py-2 border-b border-[#1a1d2a] flex-shrink-0">
        <button onClick={() => runAnalysis(activeAITab)} disabled={isLoading}
          className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110'}`}
          style={{ background: isLoading ? '#13151f' : 'rgba(168,85,247,.12)', color: isLoading ? '#6b7280' : '#a855f7', border: '1px solid rgba(168,85,247,.25)' }}
        >
          {isLoading ? <><Loader size={11} className="animate-spin" />Analyzing…</> : <><Zap size={11} />
            {activeAITab === 'explain' ? `Explain ${langInfo.label} Code` :
             activeAITab === 'complexity' ? 'Analyze Complexity' :
             activeAITab === 'flowchart' ? 'Generate Flowchart' : 'Optimize Code'}</>}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="m-3 p-3 bg-[#0f1117] border border-[#1e2130] rounded-xl">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#1e2130]">
                <Bot size={11} className="text-purple-400" />
                <span className="text-purple-400 text-xs font-semibold">AI Analysis</span>
                <span className="ml-auto text-[10px] font-mono" style={{ color: langInfo.color }}>{langInfo.label}</span>
              </div>
              <MarkdownText content={result} />
            </motion.div>
          )}
        </AnimatePresence>

        {aiMessages.length > 0 && (
          <div className="flex flex-col gap-2 p-3">
            {aiMessages.map(msg => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-xl px-3 py-2 text-xs ${
                  msg.role === 'user'
                    ? 'bg-cyan-500/8 border border-cyan-500/15 text-gray-300'
                    : 'bg-[#0f1117] border border-[#1e2130]'
                }`}>
                  {msg.isLoading
                    ? <div className="flex items-center gap-2 py-0.5"><Loader size={10} className="animate-spin text-purple-400" /><span className="text-gray-600">Thinking…</span></div>
                    : <MarkdownText content={msg.content} />}
                </div>
              </motion.div>
            ))}
            <div ref={endRef} />
          </div>
        )}

        {!result && aiMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 gap-3 text-center px-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(168,85,247,.1)', border: '1px solid rgba(168,85,247,.2)' }}>
              <Code2 size={18} className="text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-medium">Ask anything about this code</p>
              <p className="text-gray-700 text-xs mt-1 font-mono">{langInfo.label} • {hasKey ? 'AI active' : 'No API key'}</p>
            </div>
            <div className="flex flex-col gap-1.5 w-full mt-1">
              {[
                `Explain this ${langInfo.label} code`,
                'What is the time complexity?',
                'How can I optimize this?',
                `Convert to Python` ,
              ].map(q => (
                <button key={q} onClick={() => setChatInput(q)}
                  className="text-left px-3 py-2 bg-[#0f1117] border border-[#1e2130] rounded-lg text-gray-600 text-xs hover:text-gray-400 hover:border-[#252836] transition-all font-mono">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chat input */}
      <div className="flex-shrink-0 p-3 border-t border-[#1a1d2a]">
        <div className="flex gap-2">
          <input value={chatInput} onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleChat()}
            placeholder={`Ask about ${langInfo.label} code…`} disabled={isLoading}
            className="flex-1 bg-[#0f1117] border border-[#1e2130] focus:border-purple-500/40 rounded-lg px-3 py-2 text-xs text-gray-400 placeholder-gray-700 outline-none transition-colors" />
          <button onClick={handleChat} disabled={!chatInput.trim() || isLoading}
            className={`p-2 rounded-lg transition-all ${chatInput.trim() && !isLoading ? 'text-purple-400 hover:bg-purple-500/15' : 'text-gray-700 cursor-not-allowed'}`}
            style={{ border: '1px solid rgba(168,85,247,.2)' }}>
            <Send size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
