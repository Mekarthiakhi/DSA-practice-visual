import React from 'react';
import { X, Code, Play } from 'lucide-react';
import { useIDEStore } from '../../store/ideStore';
import { LeetCodeProblem } from '../../data/leetcodeProblems';
import { createLeetCodeHarness, LeetCodeHarnessLanguage } from '../../utils/leetcodeHarness';
import { FixtureEditor } from './FixtureEditor';
import { JudgePanel } from './JudgePanel';
import { LearningPanel } from './LearningPanel';
import { ProblemOverviewPanel } from './ProblemOverviewPanel';

export const LeetCodeDetailPanel: React.FC = () => {
  const { 
    activeLeetCodeProblem,
    setActiveLeetCodeProblem,
    setCode,
    setLanguage,
    setFileName,
    setExecMode
  } = useIDEStore();

  const [visualizationInput, setVisualizationInput] = React.useState('');
  const [loadMessage, setLoadMessage] = React.useState('');

  React.useEffect(() => {
    setVisualizationInput(activeLeetCodeProblem?.examples[0]?.input || '');
    setLoadMessage('');
  }, [activeLeetCodeProblem]);

  if (!activeLeetCodeProblem) return null;
  const hasBundledSolution = !!(activeLeetCodeProblem.solution?.javascript || activeLeetCodeProblem.solution?.python);

  const handleClose = () => {
    setActiveLeetCodeProblem(undefined);
    useIDEStore.getState().setShowLeetCodePanel(false);
  };

  const handleBackToList = () => {
    setActiveLeetCodeProblem(undefined);
  };

  const loadIntoEditor = (problem: LeetCodeProblem, source: string, lang: LeetCodeHarnessLanguage) => {
    const harness = createLeetCodeHarness(problem, source, lang, visualizationInput);
    setCode(harness.code);
    setLanguage(lang);
    setFileName(problem.title.replace(/\s+/g, '-').toLowerCase());
    setExecMode('auto');
    setLoadMessage(harness.added
      ? `Runnable ${lang === 'javascript' ? 'JavaScript' : 'Python'} input added.`
      : harness.message || 'Add a test call before visualizing.');
  };

  const handleLoadStarterCode = (problem: LeetCodeProblem, lang: LeetCodeHarnessLanguage) => {
    const source = problem.starterCode[lang];
    if (source) loadIntoEditor(problem, source, lang);
  };

  const handleLoadSolution = (problem: LeetCodeProblem, lang: LeetCodeHarnessLanguage) => {
    const solution = problem.solution?.[lang];
    if (solution) {
      const alreadyRunnable = lang === 'javascript'
        ? /console\.log\s*\(/.test(solution)
        : /print\s*\(/.test(solution);
      if (alreadyRunnable) {
        setCode(solution);
        setLanguage(lang);
        setFileName(problem.title.replace(/\s+/g, '-').toLowerCase());
        setExecMode('auto');
        setLoadMessage('Runnable solution loaded.');
      } else {
        loadIntoEditor(problem, solution, lang);
      }
    } else {
      handleLoadStarterCode(problem, lang);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0c0e14] border-l border-[#1e2130] overflow-hidden h-full">
      <div className="h-12 border-b border-[#1e2130] flex items-center justify-between px-4 flex-shrink-0 bg-[#0f1117]">
        <div className="flex items-center gap-2">
          <button 
            onClick={handleBackToList}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <span className="text-[10px]">◀</span> Back
          </button>
          <div className="w-px h-4 bg-[#1e2130] mx-1" />
          <h2 className="text-white font-semibold text-sm">Problem Details</h2>
        </div>
        <button 
          onClick={handleClose}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
          title="Close problem & return to AI Assistant"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5" style={{ scrollbarWidth: 'thin', scrollbarColor: '#2a2d3e transparent' }}>
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-xl font-bold text-white">{activeLeetCodeProblem.id}. {activeLeetCodeProblem.title}</h1>
        </div>

        <div className="flex gap-2 mb-6">
          <span className={`text-[10px] px-2 py-1 rounded-md uppercase tracking-wider font-bold ${
            activeLeetCodeProblem.difficulty === 'Easy' ? 'text-green-400 bg-green-400/10 border border-green-400/20' :
            activeLeetCodeProblem.difficulty === 'Medium' ? 'text-amber-400 bg-amber-400/10 border border-amber-400/20' :
            'text-red-400 bg-red-400/10 border border-red-400/20'
          }`}>
            {activeLeetCodeProblem.difficulty}
          </span>
          <span className="text-[11px] px-2 py-1 rounded-md bg-[#13151f] border border-[#2a2d3e] text-gray-300">
            {activeLeetCodeProblem.category}
          </span>
          <span className={`text-[10px] px-2 py-1 rounded-md border ${hasBundledSolution ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/25 bg-amber-500/10 text-amber-300'}`}>
            {hasBundledSolution ? 'Reference solution included' : 'Practice starter · solution not bundled'}
          </span>
        </div>

        <div className="prose prose-invert prose-sm max-w-none mb-8">
          <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{activeLeetCodeProblem.description}</p>
        </div>

        <ProblemOverviewPanel problem={activeLeetCodeProblem} />

        <div className="space-y-4 mb-8">
          {activeLeetCodeProblem.examples.map((ex, i) => (
            <div key={i} className="bg-[#13151f] border border-[#1e2130] rounded-lg p-3">
              <div className="text-xs font-bold text-gray-400 mb-2">Example {i + 1}:</div>
              <div className="font-mono text-xs text-gray-300 mb-1"><span className="text-gray-500">Input:</span> {ex.input}</div>
              <div className="font-mono text-xs text-gray-300"><span className="text-gray-500">Output:</span> {ex.output}</div>
              {ex.explanation && (
                <div className="text-xs text-gray-400 mt-2 border-t border-[#1e2130] pt-2">
                  <span className="text-gray-500">Explanation:</span> {ex.explanation}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mb-8">
          <div className="text-xs font-bold text-gray-400 mb-2">Constraints:</div>
          <ul className="list-disc pl-5 space-y-1">
            {activeLeetCodeProblem.constraints.map((c, i) => (
              <li key={i} className="text-xs text-gray-300 font-mono bg-[#13151f] px-2 py-0.5 rounded inline-block mb-1">{c}</li>
            ))}
          </ul>
        </div>

        {/* Runnable visualization input */}
        <div className="space-y-2 pt-4 border-t border-[#1e2130]">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="leetcode-visualization-input" className="text-sm font-semibold text-white">
              Visualization input
            </label>
            <span className="text-[10px] text-gray-500">Use parameter assignments</span>
          </div>
          <textarea
            id="leetcode-visualization-input"
            value={visualizationInput}
            onChange={(event) => { setVisualizationInput(event.target.value); setLoadMessage(''); }}
            rows={3}
            placeholder={'Example: nums = [2,7,11,15], target = 9'}
            className="w-full resize-y rounded-lg border border-[#2a2d3e] bg-[#13151f] px-3 py-2 font-mono text-xs text-gray-200 placeholder-gray-600 focus:border-cyan-500/50 focus:outline-none"
          />
          <p className="text-[10px] leading-relaxed text-gray-500">
            Arrays, strings, numbers, linked lists, and standard binary-tree arrays get an automatic test harness. Use Structured fixtures below for graphs, random pointers, operation sequences, and tries.
          </p>
          <FixtureEditor />
          {loadMessage && (
            <p role="status" className="rounded-md border border-cyan-500/20 bg-cyan-500/5 px-2.5 py-1.5 text-[10px] text-cyan-300">
              {loadMessage}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4 border-t border-[#1e2130]">
          <h3 className="text-sm font-semibold text-white">JavaScript</h3>
          <div className="flex gap-2">
            <button 
              onClick={() => handleLoadStarterCode(activeLeetCodeProblem, 'javascript')}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#13151f] border border-[#2a2d3e] hover:bg-[#1e2130] hover:border-cyan-500/30 text-gray-300 text-xs font-medium transition-all"
            >
              <Code size={14} /> Starter Code
            </button>
            <button 
              onClick={() => handleLoadSolution(activeLeetCodeProblem, 'javascript')}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-medium shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Play size={14} fill="currentColor" /> {activeLeetCodeProblem.solution?.javascript ? 'Load Solution' : 'Start Practice'}
            </button>
          </div>

          {activeLeetCodeProblem.starterCode.python && (
            <>
              <h3 className="pt-2 text-sm font-semibold text-white">Python</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleLoadStarterCode(activeLeetCodeProblem, 'python')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#13151f] border border-[#2a2d3e] hover:bg-[#1e2130] hover:border-blue-500/30 text-gray-300 text-xs font-medium transition-all"
                >
                  <Code size={14} /> Starter Code
                </button>
                <button
                  onClick={() => handleLoadSolution(activeLeetCodeProblem, 'python')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white text-xs font-medium shadow-lg shadow-blue-500/10 transition-all"
                >
                  <Play size={14} fill="currentColor" /> {activeLeetCodeProblem.solution?.python ? 'Load Solution' : 'Start Practice'}
                </button>
              </div>
            </>
          )}
        </div>

        <JudgePanel problem={activeLeetCodeProblem} />
        <LearningPanel problem={activeLeetCodeProblem} />
      </div>
    </div>
  );
};
