import React from 'react'
import { AlertTriangle, CheckCircle2, Circle, Compass, Eye, ShieldCheck } from 'lucide-react'
import type { LeetCodeProblem } from '../../data/leetcodeProblems'
import { useIDEStore } from '../../store/ideStore'
import { useLearningStore } from '../../store/learningStore'
import {
  analyzeProblemDirection,
  getMilestoneEvidence,
  getProblemVisualizationProfile,
} from '../../utils/problemOverview'

export const ProblemOverviewPanel: React.FC<{ problem: LeetCodeProblem }> = ({ problem }) => {
  const { code, fileName, executionSteps, executionStatus } = useIDEStore()
  const progress = useLearningStore(state => state.progress[problem.id])
  const expectedFileName = problem.title.replace(/\s+/g, '-').toLowerCase()
  const isProblemLoaded = fileName === expectedFileName
  const profile = React.useMemo(() => getProblemVisualizationProfile(problem), [problem])
  const evidence = React.useMemo(() => getMilestoneEvidence(profile, isProblemLoaded ? code : ''), [profile, code, isProblemLoaded])
  const signals = React.useMemo(
    () => analyzeProblemDirection(profile, isProblemLoaded ? code : '', isProblemLoaded ? executionSteps : [], isProblemLoaded ? executionStatus : 'idle', progress?.lastScore),
    [profile, code, executionSteps, executionStatus, progress?.lastScore, isProblemLoaded],
  )

  return (
    <section data-testid="problem-overview" className="mb-8 overflow-hidden rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-purple-500/5">
      <div className="border-b border-white/5 px-3.5 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-white"><Compass size={14} className="text-cyan-400" /> Approach overview</h2>
            <p className="mt-1 text-[10px] leading-relaxed text-gray-400">{profile.summary}</p>
          </div>
          <span className="flex-shrink-0 rounded-md border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-[9px] font-semibold text-cyan-300">{profile.label}</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-gray-500"><Eye size={11} /> Canvas: {profile.canvas}</div>
        {!isProblemLoaded && <p className="mt-2 rounded-md border border-amber-500/15 bg-amber-500/5 px-2 py-1.5 text-[9px] text-amber-300/80">Load this problem's starter or solution to enable source-specific direction checks.</p>}
      </div>

      <div className="grid gap-3 p-3.5 xl:grid-cols-2">
        <div>
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">Suggested milestones</h3>
          <div className="space-y-1.5">
            {profile.milestones.map((item, index) => (
              <div key={item.label} className="flex items-start gap-2 rounded-md border border-white/5 bg-[#0c0e14]/70 p-2">
                {evidence[index]
                  ? <CheckCircle2 size={12} className="mt-0.5 flex-shrink-0 text-emerald-400" />
                  : <Circle size={12} className="mt-0.5 flex-shrink-0 text-gray-600" />}
                <div><div className="text-[10px] font-semibold text-gray-300">{item.label}</div><div className="mt-0.5 text-[9px] leading-relaxed text-gray-600">{item.purpose}</div></div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">Direction check</h3>
          <div className="space-y-1.5">
            {signals.map(signal => (
              <div key={signal.id} className={`rounded-md border px-2.5 py-2 ${signal.tone === 'positive' ? 'border-emerald-500/15 bg-emerald-500/5' : signal.tone === 'warning' ? 'border-amber-500/20 bg-amber-500/5' : 'border-white/5 bg-[#0c0e14]/70'}`}>
                <div className={`flex items-center gap-1.5 text-[10px] font-semibold ${signal.tone === 'positive' ? 'text-emerald-300' : signal.tone === 'warning' ? 'text-amber-300' : 'text-gray-400'}`}>
                  {signal.tone === 'positive' ? <CheckCircle2 size={11} /> : signal.tone === 'warning' ? <AlertTriangle size={11} /> : <Circle size={11} />}
                  {signal.label}
                </div>
                <div className="mt-0.5 text-[9px] leading-relaxed text-gray-600">{signal.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-2 border-t border-white/5 px-3.5 py-3 sm:grid-cols-2">
        <div><div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-gray-600">Watch while stepping</div><div className="text-[9px] leading-relaxed text-gray-400">{profile.watch.join(' · ')}</div></div>
        <div><div className="mb-1 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-gray-600"><ShieldCheck size={10} /> Invariants</div><div className="text-[9px] leading-relaxed text-gray-400">{profile.invariants.join(' · ')}</div></div>
      </div>
      <p className="border-t border-white/5 px-3.5 py-2 text-[9px] leading-relaxed text-gray-600">Milestone checks are heuristic guidance. Passing judge cases is the correctness evidence; highlighted patterns alone do not prove the algorithm.</p>
    </section>
  )
}
