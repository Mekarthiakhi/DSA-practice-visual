import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Code, BookOpen, ChevronRight, Play } from 'lucide-react';
import { useIDEStore } from '../../store/ideStore';
import { LEETCODE_PROBLEMS, LEETCODE_CATEGORIES, LeetCodeProblem, Difficulty } from '../../data/leetcodeProblems';

export const LeetCodePanel: React.FC = () => {
  const { 
    showLeetCodePanel, 
    setShowLeetCodePanel, 
    activeLeetCodeProblem,
    setActiveLeetCodeProblem,
    setCode,
    setLanguage,
    setFileName,
    setExecMode
  } = useIDEStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'All'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [view, setView] = useState<'list' | 'detail'>('list');

  // Navigate to problem detail
  const handleSelectProblem = (problem: LeetCodeProblem) => {
    setActiveLeetCodeProblem(problem);
    setView('detail');
  };

  const handleBackToList = () => {
    setView('list');
  };

  const handleLoadStarterCode = (problem: LeetCodeProblem, lang: 'javascript' | 'python') => {
    const code = problem.starterCode[lang];
    if (code) {
      setCode(code);
      setLanguage(lang);
      setFileName(problem.title.replace(/\s+/g, '-').toLowerCase());
      setExecMode('trace'); // Use trace by default for custom code
      setShowLeetCodePanel(false); // Close panel to show editor
    }
  };

  const handleLoadSolution = (problem: LeetCodeProblem, lang: 'javascript' | 'python') => {
    const code = problem.solution?.[lang];
    if (code) {
      setCode(code);
      setLanguage(lang);
      setFileName(problem.title.replace(/\s+/g, '-').toLowerCase());
      setExecMode('dsa'); // Use dsa to see the beautiful animations for solutions
      setShowLeetCodePanel(false); // Close panel to show editor
    } else {
      // If no optimal solution exists in the dataset, insert a placeholder
      setCode(`// Optimal Solution not available yet for ${problem.title}\n// Try writing your own and using '🪄 Auto' trace!`);
      setLanguage('javascript');
      setFileName(problem.title.replace(/\s+/g, '-').toLowerCase());
      setExecMode('trace');
      setShowLeetCodePanel(false);
    }
  };

  // Filter problems
  const filteredProblems = LEETCODE_PROBLEMS.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.includes(searchQuery);
    const matchesDiff = selectedDifficulty === 'All' || p.difficulty === selectedDifficulty;
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesDiff && matchesCat;
  });

  if (!showLeetCodePanel) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: -400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -400, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute top-12 left-0 bottom-0 w-[400px] bg-[#0c0e14] border-r border-[#1e2130] z-50 flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="h-12 border-b border-[#1e2130] flex items-center justify-between px-4 flex-shrink-0 bg-[#0f1117]">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-cyan-400" />
            <h2 className="text-white font-semibold text-sm">LeetCode Problems</h2>
          </div>
          <button 
            onClick={() => setShowLeetCodePanel(false)}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {view === 'list' ? (
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
                  className="w-full bg-[#13151f] border border-[#2a2d3e] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>
              
              <div className="flex gap-2">
                <select 
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value as any)}
                  className="bg-[#13151f] border border-[#2a2d3e] rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none flex-1"
                >
                  <option value="All">All Difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>

                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-[#13151f] border border-[#2a2d3e] rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none flex-1"
                >
                  <option value="All">All Categories</option>
                  {LEETCODE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Problem List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#2a2d3e transparent' }}>
              {filteredProblems.map(problem => (
                <button
                  key={problem.id}
                  onClick={() => handleSelectProblem(problem)}
                  className="w-full text-left p-3 rounded-lg hover:bg-[#13151f] border border-transparent hover:border-[#2a2d3e] transition-all group flex items-center justify-between"
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-mono text-[10px] w-6 text-right">#{problem.id}</span>
                      <span className="text-gray-200 text-sm font-medium group-hover:text-white transition-colors">{problem.title}</span>
                    </div>
                    <div className="flex gap-2 pl-8">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold ${
                        problem.difficulty === 'Easy' ? 'text-green-400 bg-green-400/10' :
                        problem.difficulty === 'Medium' ? 'text-amber-400 bg-amber-400/10' :
                        'text-red-400 bg-red-400/10'
                      }`}>
                        {problem.difficulty}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">{problem.category}</span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-gray-600 group-hover:text-cyan-400 transition-colors" />
                </button>
              ))}
              
              {filteredProblems.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No problems found matching your filters.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Detail View */
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="h-10 border-b border-[#1e2130] flex items-center px-2 flex-shrink-0">
              <button 
                onClick={handleBackToList}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors"
              >
                <ChevronRight size={14} className="rotate-180" /> Back to list
              </button>
            </div>

            {activeLeetCodeProblem && (
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
                </div>

                <div className="prose prose-invert prose-sm max-w-none mb-8">
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{activeLeetCodeProblem.description}</p>
                </div>

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
                      <Play size={14} fill="currentColor" /> Load Solution
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
