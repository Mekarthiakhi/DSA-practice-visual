import React, { useState } from 'react';
import { X, Search, ChevronRight, Bookmark, CircleCheck } from 'lucide-react';
import { useIDEStore } from '../../store/ideStore';
import { LEETCODE_PROBLEMS, LEETCODE_CATEGORIES, LeetCodeProblem, Difficulty } from '../../data/leetcodeProblems';
import { createLeetCodeHarness } from '../../utils/leetcodeHarness';
import { useLearningStore } from '../../store/learningStore';

function hasAutomaticInput(problem: LeetCodeProblem): boolean {
  const javascript = problem.starterCode.javascript;
  if (javascript && createLeetCodeHarness(problem, javascript, 'javascript').added) return true;
  const python = problem.starterCode.python;
  return !!python && createLeetCodeHarness(problem, python, 'python').added;
}

export const LeetCodePanel: React.FC = () => {
  const { 
    showLeetCodePanel, 
    setShowLeetCodePanel, 
    setActiveLeetCodeProblem
  } = useIDEStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'All'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const bookmarks = useLearningStore(state => state.bookmarks);
  const progress = useLearningStore(state => state.progress);

  // Navigate to problem detail
  const handleSelectProblem = (problem: LeetCodeProblem) => {
    setActiveLeetCodeProblem(problem);
  };



  // Filter problems
  const filteredProblems = LEETCODE_PROBLEMS.filter(p => {
    const query = searchQuery.trim().toLowerCase();
    const searchable = `${p.id} ${p.title} ${p.category} ${p.difficulty} ${p.description}`.toLowerCase();
    const matchesSearch = !query || searchable.includes(query);
    const matchesDiff = selectedDifficulty === 'All' || p.difficulty === selectedDifficulty;
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesDiff && matchesCat;
  });

  if (!showLeetCodePanel) return null;

  return (
    <div className="flex-1 flex flex-col bg-[#0c0e14] border-l border-[#1e2130] h-full overflow-hidden">
      {/* Header */}
      <div className="h-12 border-b border-[#1e2130] flex items-center justify-between px-4 flex-shrink-0 bg-[#0f1117]">
        <div className="flex items-center gap-2">
          <h2 className="text-white font-semibold text-sm">LeetCode Problems</h2>
          <span className="text-[10px] font-mono text-gray-500">{LEETCODE_PROBLEMS.length} catalogued</span>
        </div>
          <button 
            onClick={() => setShowLeetCodePanel(false)}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-[#1e2130] space-y-3 flex-shrink-0 bg-[#0f1117]/50">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search problems..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#13151f] border border-[#2a2d3e] focus:border-cyan-500/50 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
              />
            </div>
            
            <div className="flex gap-2">
              <select 
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value as Difficulty | 'All')}
                className="flex-1 bg-[#13151f] border border-[#2a2d3e] focus:border-cyan-500/50 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none transition-colors"
              >
                <option value="All">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 bg-[#13151f] border border-[#2a2d3e] focus:border-cyan-500/50 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none transition-colors"
              >
                <option value="All">All Categories</option>
                {LEETCODE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Problem List */}
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#2a2d3e transparent' }}>
            {filteredProblems.map((problem) => {
              const autoInput = hasAutomaticInput(problem);
              return <button
                key={problem.id}
                onClick={() => handleSelectProblem(problem)}
                className="w-full text-left p-4 border-b border-[#1e2130] hover:bg-[#13151f] transition-colors group flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-semibold text-gray-200 group-hover:text-white mb-1 transition-colors">
                    <span className="inline-flex items-center gap-1.5">
                      {problem.id}. {problem.title}
                      {bookmarks.includes(problem.id) && <Bookmark size={11} className="text-amber-400" fill="currentColor" />}
                      {progress[problem.id]?.lastScore === 1 && <CircleCheck size={11} className="text-emerald-400" />}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold ${
                      problem.difficulty === 'Easy' ? 'text-green-400 bg-green-400/10' :
                      problem.difficulty === 'Medium' ? 'text-amber-400 bg-amber-400/10' :
                      'text-red-400 bg-red-400/10'
                    }`}>
                      {problem.difficulty}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">{problem.category}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                      autoInput
                        ? 'text-cyan-400 bg-cyan-400/10'
                        : 'text-gray-500 bg-white/5'
                    }`}>
                      {autoInput ? 'Auto input' : 'Needs fixture'}
                    </span>
                  </div>
                </div>
                <ChevronRight size={14} className="text-gray-600 group-hover:text-cyan-400 transition-colors" />
              </button>
            })}
            
            {filteredProblems.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                No problems found matching your filters.
              </div>
            )}
          </div>
        </div>
    </div>
  );
};
