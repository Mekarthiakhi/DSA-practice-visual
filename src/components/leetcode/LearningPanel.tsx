import React from 'react'
import { Bookmark, CalendarClock, Save, Upload } from 'lucide-react'
import type { LeetCodeProblem } from '../../data/leetcodeProblems'
import { useIDEStore } from '../../store/ideStore'
import { dueReviewCount, solutionKey, useLearningStore } from '../../store/learningStore'
import { stripGeneratedHarness } from '../../utils/leetcodeHarness'

export const LearningPanel: React.FC<{ problem: LeetCodeProblem }> = ({ problem }) => {
  const { code, language, setCode } = useIDEStore()
  const {
    bookmarks, notes, solutions, progress, telemetryConsent,
    toggleBookmark, setNote, saveSolution, setTelemetryConsent,
  } = useLearningStore()
  const bookmarked = bookmarks.includes(problem.id)
  const saved = solutions[solutionKey(problem.id, language)]
  const currentProgress = progress[problem.id]
  const reviewCount = dueReviewCount(progress)

  const save = () => {
    const source = language === 'javascript' || language === 'python'
      ? stripGeneratedHarness(code, language)
      : code
    saveSolution(problem.id, language, source)
  }

  return (
    <div className="space-y-3 border-t border-[#1e2130] pt-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">Learning progress</h3>
        <span className="flex items-center gap-1 text-[10px] text-gray-500"><CalendarClock size={11} /> {reviewCount} reviews due</span>
      </div>
      {currentProgress && (
        <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
          <div className="rounded-md bg-[#13151f] p-2"><div className="text-gray-500">Attempts</div><div className="font-mono text-white">{currentProgress.attempts}</div></div>
          <div className="rounded-md bg-[#13151f] p-2"><div className="text-gray-500">Last score</div><div className="font-mono text-white">{Math.round(currentProgress.lastScore * 100)}%</div></div>
          <div className="rounded-md bg-[#13151f] p-2"><div className="text-gray-500">Review</div><div className="font-mono text-white">{currentProgress.reviewIntervalDays}d</div></div>
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={() => toggleBookmark(problem.id)} className={`flex items-center gap-1 rounded-md border px-2.5 py-2 text-[10px] ${bookmarked ? 'border-amber-500/40 bg-amber-500/10 text-amber-300' : 'border-[#2a2d3e] text-gray-400'}`}>
          <Bookmark size={11} fill={bookmarked ? 'currentColor' : 'none'} /> {bookmarked ? 'Bookmarked' : 'Bookmark'}
        </button>
        <button onClick={save} className="flex items-center gap-1 rounded-md border border-[#2a2d3e] px-2.5 py-2 text-[10px] text-gray-400 hover:text-white"><Save size={11} /> Save code</button>
        <button disabled={!saved} onClick={() => saved && setCode(saved.code)} className="flex items-center gap-1 rounded-md border border-[#2a2d3e] px-2.5 py-2 text-[10px] text-gray-400 hover:text-white disabled:opacity-30"><Upload size={11} /> Restore</button>
      </div>
      <textarea value={notes[problem.id] || ''} onChange={event => setNote(problem.id, event.target.value)} rows={3} placeholder="Your notes, mistakes, and pattern to remember…" className="w-full resize-y rounded-md border border-[#2a2d3e] bg-[#13151f] px-2.5 py-2 text-xs text-gray-300 focus:border-cyan-500/40 focus:outline-none" />
      <label className="flex cursor-pointer items-start gap-2 text-[10px] leading-relaxed text-gray-500">
        <input type="checkbox" checked={telemetryConsent} onChange={event => setTelemetryConsent(event.target.checked)} className="mt-0.5" />
        Share anonymous runtime reliability metrics. Source code, inputs, outputs, account data, and notes are never sent.
      </label>
    </div>
  )
}
