import React, { useState } from 'react';
import { 
  AdjustmentsHorizontalIcon, 
  MagnifyingGlassCircleIcon, 
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const GroupingPrompt = ({ 
  fileData, 
  onSubmitPrompt, 
  onCheckGroups, 
  loading 
}) => {
  const [mode, setMode] = useState('ai'); // 'ai' | 'constraints' | 'audit'
  const [promptText, setPromptText] = useState("");
  
  // Exact constraints state
  const [groupCount, setGroupCount] = useState(8);
  const [balanceGender, setBalanceGender] = useState(true);
  const [mixProgrammes, setMixProgrammes] = useState(true);
  const [balanceAcademic, setBalanceAcademic] = useState(true);
  const [togetherPair, setTogetherPair] = useState("");
  const [separatePair, setSeparatePair] = useState("");

  const suggestedPrompts = [
    "Create 10 groups with equal numbers of students.",
    "Group students with similar academic performance together.",
    "Create balanced groups based on gender and programme.",
    "Allocate 8 groups with balanced representation from each programme."
  ];

  const allocationTemplates = [
    {
      name: "Classroom Pods",
      category: "Academic",
      prompt: "Create 8 groups. Balance gender 50/50 and ensure each group has a mix of Science and Arts students."
    },
    {
      name: "Exam Hall Seating",
      category: "Exams",
      prompt: "Allocate students across 6 exam halls. Alternate programmes and maintain maximum 30 students per hall to prevent adjacent peers."
    },
    {
      name: "House Allocation",
      category: "Dormitories",
      prompt: "Allocate students into 4 sports houses with strictly equal gender numbers, balanced athletic scores, and mixed classes."
    },
    {
      name: "Team Formation",
      category: "Projects",
      prompt: "Create 12 balanced project teams of 5 students each. Ensure balanced academic scores and diverse skill tracks."
    },
    {
      name: "Staff Duty Rosters",
      category: "Administration",
      prompt: "Allocate staff across 5 shift duty teams with balanced senior and junior experience levels."
    }
  ];

  const handleSelectSuggested = (prompt) => {
    setPromptText(prompt);
  };

  const handleGenerateFromConstraints = () => {
    let generated = `Create ${groupCount} groups.`;
    if (balanceGender) generated += " Balance gender ratio evenly across all groups.";
    if (mixProgrammes) generated += " Ensure each group has students from different programmes.";
    if (balanceAcademic) generated += " Distribute academic scores so each group has balanced average performance.";
    if (togetherPair.trim()) generated += ` Keep these students together: ${togetherPair}.`;
    if (separatePair.trim()) generated += ` Keep these students in separate groups: ${separatePair}.`;
    onSubmitPrompt(generated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading) return;
    if (mode === 'ai') {
      if (!promptText.trim()) return;
      onSubmitPrompt(promptText);
    } else if (mode === 'constraints') {
      handleGenerateFromConstraints();
    } else if (mode === 'audit') {
      onCheckGroups();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Mode Selector Tabs */}
      <div className="flex justify-center">
        <div className="p-1 rounded bg-slate-900 border border-slate-800 inline-flex gap-1 text-xs font-medium">
          <button
            onClick={() => setMode('ai')}
            className={`px-3.5 py-1.5 rounded flex items-center gap-1.5 transition-standard ${
              mode === 'ai' 
                ? "bg-brand-primary text-slate-900 font-semibold" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
            <span>Natural Language</span>
          </button>

          <button
            onClick={() => setMode('constraints')}
            className={`px-3.5 py-1.5 rounded flex items-center gap-1.5 transition-standard ${
              mode === 'constraints' 
                ? "bg-brand-primary text-slate-900 font-semibold" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            <AdjustmentsHorizontalIcon className="w-4 h-4" />
            <span>Configured Constraints</span>
          </button>

          <button
            onClick={() => setMode('audit')}
            className={`px-3.5 py-1.5 rounded flex items-center gap-1.5 transition-standard ${
              mode === 'audit' 
                ? "bg-brand-primary text-slate-900 font-semibold" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            <MagnifyingGlassCircleIcon className="w-4 h-4" />
            <span>Group Balance Audit</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Natural Language */}
      {mode === 'ai' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-6 sm:p-8 rounded-md bg-slate-900 border border-slate-700 space-y-6">
            <div className="space-y-1">
              <label htmlFor="grouping-instruction" className="block text-xl font-semibold text-white">
                How should these students be grouped?
              </label>
              <p className="text-slate-400 text-xs">
                Specify your group targets, gender parity goals, and academic distribution rules.
              </p>
            </div>

            <div className="relative">
              <textarea
                id="grouping-instruction"
                rows={4}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="e.g. Create 8 balanced groups. Balance male and female count in each group, and distribute Science and Arts students evenly."
                className="w-full rounded bg-slate-950 border border-slate-700 px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-brand-primary resize-none transition-standard"
              />
            </div>

            {/* Allocation Templates */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-300">
                  Standard Templates
                </span>
                <span className="text-[11px] text-slate-500">Click to apply configuration</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {allocationTemplates.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggested(tmpl.prompt)}
                    className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 hover:border-slate-600 hover:bg-slate-700 text-xs text-slate-300 hover:text-white transition-standard flex items-center gap-1.5"
                  >
                    <span className="text-[10px] font-mono text-cyan-400">[{tmpl.category}]</span>
                    <span className="font-medium">{tmpl.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Suggested Prompts */}
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                Suggested Prompts
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestedPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggested(p)}
                    className="p-3 rounded bg-slate-800/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-left text-xs text-slate-300 hover:text-white transition-standard flex items-start gap-2"
                  >
                    <span className="text-brand-primary font-bold shrink-0">“</span>
                    <span>{p}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={!promptText.trim() || loading}
                className="px-6 py-2.5 bg-brand-primary hover:bg-brand-accent text-slate-900 font-semibold text-sm rounded transition-standard hover-subtle flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin text-slate-900" />
                    <span>Interpreting Instructions...</span>
                  </>
                ) : (
                  <>
                    <span>Interpret & Review Rules</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Mode 2: Configured Constraints */}
      {mode === 'constraints' && (
        <div className="p-6 sm:p-8 rounded-md bg-slate-900 border border-slate-700 space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-white">Configure Group Constraints</h3>
            <p className="text-slate-400 text-xs">
              Define numerical limits and participant pairing criteria.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Target Groups
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="2"
                  max="30"
                  value={groupCount}
                  onChange={(e) => setGroupCount(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
                <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-cyan-400 text-xs font-bold">
                  {groupCount}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                ~{fileData?.total_rows ? Math.round(fileData.total_rows / groupCount) : 50} students per group
              </p>
            </div>

            <div className="space-y-2.5">
              <label className="block text-xs font-semibold text-slate-300">
                Balancing Goals
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={balanceGender}
                  onChange={(e) => setBalanceGender(e.target.checked)}
                  className="rounded border-slate-700 text-brand-primary focus:ring-0"
                />
                <span>Equal Male / Female distribution</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mixProgrammes}
                  onChange={(e) => setMixProgrammes(e.target.checked)}
                  className="rounded border-slate-700 text-brand-primary focus:ring-0"
                />
                <span>Mix programmes across all groups</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={balanceAcademic}
                  onChange={(e) => setBalanceAcademic(e.target.checked)}
                  className="rounded border-slate-700 text-brand-primary focus:ring-0"
                />
                <span>Equalize average academic scores</span>
              </label>
            </div>
          </div>

          {/* Pairing constraints */}
          <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Must be together (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Ama Mensah, Kofi Owusu"
                value={togetherPair}
                onChange={(e) => setTogetherPair(e.target.value)}
                className="w-full rounded bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Must be separated (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Student C, Student D"
                value={separatePair}
                onChange={(e) => setSeparatePair(e.target.value)}
                className="w-full rounded bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleGenerateFromConstraints}
              disabled={loading}
              className="px-6 py-2.5 bg-brand-primary hover:bg-brand-accent text-slate-900 font-semibold text-sm rounded transition-standard hover-subtle flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 animate-spin text-slate-900" />
                  <span>Applying Constraints...</span>
                </>
              ) : (
                <>
                  <span>Apply Constraints & Interpret</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Mode 3: Group Balance Audit */}
      {mode === 'audit' && (
        <div className="p-6 sm:p-8 rounded-md bg-slate-900 border border-slate-700 space-y-5 text-center">
          <div className="w-10 h-10 rounded bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-brand-primary">
            <MagnifyingGlassCircleIcon className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-lg mx-auto">
            <h3 className="text-xl font-semibold text-white">Audit Existing Group Columns</h3>
            <p className="text-xs text-slate-400 leading-normal">
              If your uploaded spreadsheet already contains a "Group" or "House" column, SortifyAI audits them for gender disparity, group size equality, and academic balance.
            </p>
          </div>

          <button
            onClick={onCheckGroups}
            className="px-6 py-2.5 bg-brand-primary hover:bg-brand-accent text-slate-900 font-semibold text-sm rounded transition-standard hover-subtle inline-flex items-center gap-2"
          >
            <span>Run Group Balance Audit</span>
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default GroupingPrompt;
