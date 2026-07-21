import React from 'react'
import { Braces, Wand2 } from 'lucide-react'
import { useIDEStore } from '../../store/ideStore'
import {
  createStructuredFixtureHarness,
  LeetCodeHarnessLanguage,
  stripGeneratedHarness,
  StructuredFixtureKind,
} from '../../utils/leetcodeHarness'

const EXAMPLES: Record<StructuredFixtureKind, string> = {
  graph: '{\n  "adjList": [[2, 4], [1, 3], [2, 4], [1, 3]]\n}',
  'random-list': '{\n  "nodes": [[7, null], [13, 0], [11, 4], [10, 2], [1, 0]]\n}',
  operations: '{\n  "operations": ["MinStack", "push", "push", "getMin"],\n  "arguments": [[], [-2], [0], []]\n}',
  trie: '{\n  "operations": ["Trie", "insert", "search", "startsWith"],\n  "arguments": [[], ["apple"], ["apple"], ["app"]]\n}',
}

export const FixtureEditor: React.FC = () => {
  const { code, language, setCode } = useIDEStore()
  const [kind, setKind] = React.useState<StructuredFixtureKind>('graph')
  const [fixture, setFixture] = React.useState(EXAMPLES.graph)
  const [message, setMessage] = React.useState('')

  const changeKind = (next: StructuredFixtureKind) => {
    setKind(next)
    setFixture(EXAMPLES[next])
    setMessage('')
  }

  const applyFixture = () => {
    if (language !== 'javascript' && language !== 'python') {
      setMessage('Structured fixtures currently support JavaScript and Python editor code.')
      return
    }
    const lang = language as LeetCodeHarnessLanguage
    const source = stripGeneratedHarness(code, lang)
    const result = createStructuredFixtureHarness(source, lang, kind, fixture)
    setMessage(result.added ? 'Structured fixture added to the editor.' : result.message || 'Fixture could not be generated.')
    if (result.added) setCode(result.code)
  }

  return (
    <details className="rounded-lg border border-[#2a2d3e] bg-[#10121a]">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-300">
        <Braces size={13} className="text-purple-400" /> Custom structure fixture
      </summary>
      <div className="space-y-2 border-t border-[#242735] p-3">
        <select
          aria-label="Fixture type"
          value={kind}
          onChange={event => changeKind(event.target.value as StructuredFixtureKind)}
          className="w-full rounded-md border border-[#2a2d3e] bg-[#13151f] px-2 py-1.5 text-xs text-gray-300 focus:border-purple-500/50 focus:outline-none"
        >
          <option value="graph">Graph adjacency list</option>
          <option value="random-list">Random-pointer list</option>
          <option value="operations">Design operation sequence</option>
          <option value="trie">Trie operation sequence</option>
        </select>
        <textarea
          aria-label="Structured fixture JSON"
          value={fixture}
          onChange={event => { setFixture(event.target.value); setMessage('') }}
          rows={6}
          className="w-full resize-y rounded-md border border-[#2a2d3e] bg-[#0c0e14] px-2.5 py-2 font-mono text-[10px] text-gray-300 focus:border-purple-500/50 focus:outline-none"
        />
        <button
          onClick={applyFixture}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-purple-500/30 bg-purple-500/10 py-2 text-xs font-medium text-purple-300 hover:bg-purple-500/15"
        >
          <Wand2 size={12} /> Apply fixture
        </button>
        {message && <p role="status" className="text-[10px] leading-relaxed text-gray-400">{message}</p>}
      </div>
    </details>
  )
}
