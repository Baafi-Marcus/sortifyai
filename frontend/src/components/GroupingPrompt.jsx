import React, { useState } from 'react';
import { 
  SparklesIcon, 
  AdjustmentsHorizontalIcon, 
  MagnifyingGlassCircleIcon, 
  ArrowRightIcon,
  CheckCircleIcon
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
    "Create 10 groups with approximately equal numbers of students.",
    "Put students with similar academic performance together.",
    "Create balanced groups based on gender and programme.",
    "I need 8 groups. Each group should have students from different programmes."
  ];

  const allocationTemplates = [
    {
      name: "Classroom Pods",
      icon: "🎓",
      prompt: "Create 8 groups. Balance gender 50/50 and ensure each group has a mix of Science and Arts students."
    },
    {
      name: "Exam Hall Seating",
      icon: "🪑",
      prompt: "Allocate students across 6 exam halls. Alternate programmes and maintain maximum 30 students per hall to prevent adjacent peers."
    },
    {
      name: "House / Hostel Allocation",
      icon: "🏠",
      prompt: "Allocate students into 4 sports houses with strictly equal gender numbers, balanced athletic scores, and mixed classes."
    },
    {
      name: "Team & Hackathon Formation",
      icon: "👥",
      prompt: "Create 12 balanced project teams of 5 students each. Ensure balanced academic scores and diverse skill tracks."
    },
    {
      name: "Staff Duty Rosters",
      icon: "💼",
      prompt: "Allocate staff across 5 shift duty teams with balanced senior/junior experience levels."
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
      {/* Mode Selector Tabs (Point 9) */}
      <div className="flex justify-center">
        <div className="p-1 rounded-xl bg-brand-secondary/20 border border-white/10 inline-flex gap-1 text-sm font-medium">
          <button
            onClick={() => setMode('ai')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              mode === 'ai' 
                ? "bg-brand-primary text-brand-dark font-bold shadow-md" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            <SparklesIcon className="w-4 h-4" />
            <span>AI Assisted</span>
          </button>

          <button
            onClick={() => setMode('constraints')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              mode === 'constraints' 
                ? "bg-brand-primary text-brand-dark font-bold shadow-md" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            <AdjustmentsHorizontalIcon className="w-4 h-4" />
            <span>Exact Constraints</span>
          </button>

          <button
            onClick={() => setMode('audit')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              mode === 'audit' 
                ? "bg-brand-primary text-brand-dark font-bold shadow-md" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            <MagnifyingGlassCircleIcon className="w-4 h-4" />
            <span>Check My Groups</span>
          </button>
        </div>
      </div>

      {/* Mode 1: AI Assisted (Point 3) */}
      {mode === 'ai' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-8 rounded-3xl bg-brand-secondary/20 border border-white/10 space-y-6 shadow-2xl backdrop-blur-xl">
            <div className="space-y-1">
              <label htmlFor="grouping-instruction" className="block text-2xl sm:text-3xl font-bold text-white">
                How should I group these students?
              </label>
              <p className="text-slate-400 text-sm">
                Describe in your own words what you need. SortifyAI interprets your goals and creates the rules.
              </p>
            </div>

            <div className="relative">
              <textarea
                id="grouping-instruction"
                rows={4}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="e.g. Create 8 balanced groups. Balance male and female count in each group, and distribute Science and Arts students evenly."
                className="w-full rounded-2xl bg-brand-dark/70 border border-white/15 px-5 py-4 text-white text-base placeholder-slate-500 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 resize-none transition-all"
              />
            </div>

            {/* Point 20: Allocation Use Case Templates */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-bold text-brand-primary">
                  Allocation Templates (Point 20)
                </span>
                <span className="text-[11px] text-slate-500">Click to apply domain recipe</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {allocationTemplates.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggested(tmpl.prompt)}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-brand-primary/50 hover:bg-brand-primary/10 text-xs text-slate-200 transition-all flex items-center gap-1.5"
                  >
                    <span>{tmpl.icon}</span>
                    <span className="font-medium">{tmpl.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Suggested Prompts (Point 3) */}
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider font-bold text-slate-400">
                Suggested Prompts
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestedPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggested(p)}
                    className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-brand-primary/40 hover:bg-white/[0.06] text-left text-xs text-slate-300 hover:text-white transition-all flex items-start gap-2"
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
                className="px-8 py-4 bg-brand-primary text-brand-dark font-bold text-base rounded-xl hover:bg-brand-accent transition-all flex items-center gap-2 shadow-xl shadow-brand-primary/25 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
              >
                <span>Interpret & Review Rules</span>
                <ArrowRightIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Mode 2: Exact Constraints (Point 8, 9) */}
      {mode === 'constraints' && (
        <div className="p-8 rounded-3xl bg-brand-secondary/20 border border-white/10 space-y-6 shadow-2xl backdrop-blur-xl">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-white">Configure Exact Group Constraints</h3>
            <p className="text-slate-400 text-sm">
              Fine-tune exact numerical requirements and pairing rules.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Total Target Groups
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
                <span className="px-3 py-1 rounded bg-white/10 font-bold text-cyan-300 text-sm">
                  {groupCount}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                ~{fileData?.total_rows ? Math.round(fileData.total_rows / groupCount) : 50} students per group
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-300">
                Balancing Goals
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={balanceGender}
                  onChange={(e) => setBalanceGender(e.target.checked)}
                  className="rounded border-white/20 text-brand-primary focus:ring-0"
                />
                <span>Equal Male / Female distribution</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mixProgrammes}
                  onChange={(e) => setMixProgrammes(e.target.checked)}
                  className="rounded border-white/20 text-brand-primary focus:ring-0"
                />
                <span>Mix programmes across all groups</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={balanceAcademic}
                  onChange={(e) => setBalanceAcademic(e.target.checked)}
                  className="rounded border-white/20 text-brand-primary focus:ring-0"
                />
                <span>Equalize average academic scores</span>
              </label>
            </div>
          </div>

          {/* Pairing constraints (Point 8) */}
          <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Must be together (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Ama Mensah, Kofi Owusu"
                value={togetherPair}
                onChange={(e) => setTogetherPair(e.target.value)}
                className="w-full rounded-xl bg-brand-dark/70 border border-white/10 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Must be separated (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Student C, Student D"
                value={separatePair}
                onChange={(e) => setSeparatePair(e.target.value)}
                className="w-full rounded-xl bg-brand-dark/70 border border-white/10 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleGenerateFromConstraints}
              disabled={loading}
              className="px-8 py-4 bg-brand-primary text-brand-dark font-bold text-base rounded-xl hover:bg-brand-accent transition-all flex items-center gap-2 shadow-xl shadow-brand-primary/25 hover:scale-105"
            >
              <span>Apply Constraints & Interpret</span>
              <ArrowRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Mode 3: Check My Groups (Point 19) */}
      {mode === 'audit' && (
        <div className="p-8 rounded-3xl bg-brand-secondary/20 border border-white/10 space-y-6 shadow-2xl backdrop-blur-xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto text-brand-primary">
            <MagnifyingGlassCircleIcon className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <h3 className="text-2xl font-bold text-white">Check My Existing Groups</h3>
            <p className="text-sm text-slate-400">
              Does your uploaded spreadsheet already contain a "Group" or "House" column? SortifyAI will audit them for gender disparity, group size equality, and academic balance.
            </p>
          </div>

          <button
            onClick={onCheckGroups}
            className="px-8 py-4 bg-brand-primary text-brand-dark font-bold text-base rounded-xl hover:bg-brand-accent transition-all inline-flex items-center gap-2 shadow-xl shadow-brand-primary/25"
          >
            <span>Run Group Balance Audit</span>
            <ArrowRightIcon className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default GroupingPrompt;
