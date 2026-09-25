import React, { useState } from 'react';
import { 
  ArrowDownTrayIcon, 
  PrinterIcon, 
  ArrowUturnLeftIcon, 
  SparklesIcon, 
  UserGroupIcon,
  AcademicCapIcon,
  ChevronDownIcon,
  ArrowsRightLeftIcon,
  CheckBadgeIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';

const ResultsStudio = ({ 
  groups: initialGroups, 
  decisionSummary, 
  onRefineWithAI, 
  onOpenExport,
  onPrintRoster,
  onSaveToCloud,
  totalRows 
}) => {
  // Version history & local group state for instant manual adjustments (Points 10 & 12)
  const [history, setHistory] = useState([initialGroups]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [refinePrompt, setRefinePrompt] = useState("");
  const [refining, setRefining] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState(null);

  const currentGroups = history[historyIndex] || initialGroups;

  // Compute analytics dynamically so drag & drop / moves update instantaneously (Point 6 & 10)
  const getGroupAnalytics = (items = []) => {
    const count = items.length;
    if (count === 0) {
      return { count: 0, avgScore: null, minScore: null, maxScore: null, males: 0, females: 0, progs: {} };
    }

    let scoreSum = 0;
    let scoreCount = 0;
    let minScore = Infinity;
    let maxScore = -Infinity;
    let males = 0;
    let females = 0;
    const progs = {};

    items.forEach(it => {
      // Find score
      for (const [k, v] of Object.entries(it)) {
        const kl = k.toLowerCase();
        if (['score', 'mark', 'grade', 'total', 'average'].some(w => kl.includes(w))) {
          const num = parseFloat(String(v).replace(/[$,]/g, '').trim());
          if (!isNaN(num)) {
            scoreSum += num;
            scoreCount++;
            if (num < minScore) minScore = num;
            if (num > maxScore) maxScore = num;
          }
        }
        if (['gender', 'sex'].some(w => kl.includes(w))) {
          const s = String(v).trim().toLowerCase();
          if (['m', 'male', 'boy'].includes(s)) males++;
          else if (['f', 'female', 'girl'].includes(s)) females++;
        }
        if (['prog', 'programme', 'course', 'track', 'subject'].some(w => kl.includes(w))) {
          const p = String(v).trim();
          if (p && p !== 'null' && p !== 'undefined') {
            progs[p] = (progs[p] || 0) + 1;
          }
        }
      }
    });

    return {
      count,
      avgScore: scoreCount > 0 ? (scoreSum / scoreCount).toFixed(1) : null,
      minScore: scoreCount > 0 ? minScore : null,
      maxScore: scoreCount > 0 ? maxScore : null,
      males,
      females,
      progs
    };
  };

  // Move student between groups (Points 9 & 10)
  const handleMoveStudent = (student, fromGroupIdx, toGroupIdx) => {
    if (fromGroupIdx === toGroupIdx) return;

    const newGroups = currentGroups.map((g, idx) => {
      if (idx === fromGroupIdx) {
        return {
          ...g,
          items: g.items.filter(item => item !== student)
        };
      }
      if (idx === toGroupIdx) {
        return {
          ...g,
          items: [...(g.items || []), student]
        };
      }
      return g;
    });

    // Push new version to history
    const nextHistory = [...history.slice(0, historyIndex + 1), newGroups];
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);

    // Show temporary notice
    setFeedbackNotice(`Moved student to ${newGroups[toGroupIdx].name}. Group balance updated.`);
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  // Undo functionality (Point 12)
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setFeedbackNotice("Restored previous grouping version.");
      setTimeout(() => setFeedbackNotice(null), 3000);
    }
  };

  const handleRefineSubmit = async (e) => {
    e.preventDefault();
    if (!refinePrompt.trim()) return;
    setRefining(true);
    await onRefineWithAI(refinePrompt);
    setRefinePrompt("");
    setRefining(false);
  };

  const totalAssigned = currentGroups.reduce((acc, g) => acc + (g.items?.length || 0), 0);
  const avgGroupSize = currentGroups.length > 0 ? (totalAssigned / currentGroups.length).toFixed(1) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32 animate-fadeIn">
      {/* Top Banner & Action Controls (Point 5) */}
      <div className="p-6 rounded-3xl bg-brand-secondary/20 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-emerald-400" />
            <h2 className="text-2xl font-black text-white">Grouping Complete</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
              Version {historyIndex + 1}
            </span>
          </div>
          <p className="text-sm text-slate-300 mt-1">
            <strong>{totalAssigned} students</strong> allocated into <strong>{currentGroups.length} balanced groups</strong>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Undo Button (Point 12) */}
          <button
            onClick={handleUndo}
            disabled={historyIndex === 0}
            className="px-3.5 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo manual adjustments"
          >
            <ArrowUturnLeftIcon className="w-4 h-4" />
            <span>Undo</span>
          </button>

          {/* Printable Roster (Point 11) */}
          <button
            onClick={onPrintRoster}
            className="px-4 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <PrinterIcon className="w-4 h-4 text-cyan-300" />
            <span>Print Rosters</span>
          </button>

          {/* Save to Cloud Button */}
          {onSaveToCloud && (
            <button
              onClick={() => onSaveToCloud(currentGroups)}
              className="px-4 py-2 rounded-xl border border-brand-primary/30 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-brand-primary/10 hover:scale-[1.02]"
              title="Save project to your Neon PostgreSQL cloud"
            >
              <CloudArrowUpIcon className="w-4 h-4" />
              <span>Save to Cloud</span>
            </button>
          )}

          {/* Export Dropdown (Point 11) */}
          <button
            onClick={onOpenExport}
            className="px-5 py-2 bg-brand-primary text-brand-dark rounded-xl font-bold text-xs hover:bg-brand-accent transition-all flex items-center gap-1.5 shadow-lg shadow-brand-primary/20 hover:scale-105"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>Export ▼</span>
          </button>
        </div>
      </div>

      {/* Decision Summary Pill (Point 4) */}
      {decisionSummary && (
        <div className="px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <CheckBadgeIcon className="w-4 h-4 text-brand-primary" />
            <strong className="text-white uppercase tracking-wider">Grouping Criteria:</strong>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-slate-300">
            <span>Primary: <strong className="text-cyan-300">{decisionSummary.primary}</strong></span>
            <span className="text-slate-600">•</span>
            <span>Secondary: <strong className="text-cyan-300">{decisionSummary.secondary}</strong></span>
            <span className="text-slate-600">•</span>
            <span>Balance: <strong className="text-emerald-400">{decisionSummary.balance}</strong></span>
            <span className="text-slate-600">•</span>
            <span>Target Groups: <strong className="text-white">{currentGroups.length}</strong></span>
          </div>
        </div>
      )}

      {/* Metric Summary Cards (Point 5) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: totalAssigned, color: "text-white" },
          { label: "Groups Created", value: currentGroups.length, color: "text-cyan-300" },
          { label: "Average / Group", value: avgGroupSize, color: "text-emerald-400" },
          { label: "Unassigned Students", value: 0, color: "text-slate-400" }
        ].map((card, idx) => (
          <div key={idx} className="p-5 rounded-2xl bg-brand-secondary/15 border border-white/5 space-y-1">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">{card.label}</span>
            <p className={`text-2xl sm:text-3xl font-black ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Floating Notice when student moved */}
      {feedbackNotice && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <span>{feedbackNotice}</span>
          <button onClick={() => setFeedbackNotice(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Groups Display Grid with Group Analytics (Points 5, 6, 10) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <UserGroupIcon className="w-5 h-5 text-brand-primary" />
            <span>Group Rosters & Inline Analytics</span>
          </h3>
          <p className="text-xs text-slate-400">
            Use the "Move" menu on any student row to adjust groups manually.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {currentGroups.map((group, gIdx) => {
            const items = group.items || [];
            const analytics = getGroupAnalytics(items);
            const columns = items.length > 0 ? Object.keys(items[0]).slice(0, 5) : [];

            return (
              <div 
                key={gIdx} 
                className="rounded-3xl bg-brand-secondary/15 border border-white/10 overflow-hidden flex flex-col shadow-xl hover:border-brand-primary/30 transition-all"
              >
                {/* Group Card Header */}
                <div className="p-5 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-brand-primary/10 border border-brand-primary/20 text-brand-primary flex items-center justify-center font-bold text-sm">
                      {gIdx + 1}
                    </span>
                    <div>
                      <h4 className="text-base font-bold text-white">{group.name}</h4>
                      <p className="text-xs text-slate-400">{analytics.count} students</p>
                    </div>
                  </div>

                  {analytics.avgScore && (
                    <div className="text-right">
                      <span className="text-xs text-slate-400">Avg Score</span>
                      <p className="text-sm font-bold text-cyan-300">{analytics.avgScore}</p>
                    </div>
                  )}
                </div>

                {/* Inline Group Analytics Breakdown (Point 6) */}
                <div className="p-4 bg-brand-dark/40 border-b border-white/5 grid grid-cols-2 gap-3 text-xs">
                  {/* Gender Distribution */}
                  <div className="space-y-1">
                    <span className="text-slate-400 font-semibold">Gender Balance:</span>
                    <div className="flex items-center gap-2 text-slate-300 font-mono">
                      <span>♂ {analytics.males}</span>
                      <span className="text-slate-600">|</span>
                      <span>♀ {analytics.females}</span>
                    </div>
                  </div>

                  {/* Programme Distribution */}
                  <div className="space-y-1">
                    <span className="text-slate-400 font-semibold">Programmes:</span>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(analytics.progs).slice(0, 3).map(([prog, count]) => (
                        <span key={prog} className="px-1.5 py-0.5 rounded bg-white/5 text-[11px] text-slate-300">
                          {prog}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Student Table */}
                <div className="flex-1 overflow-x-auto max-h-72">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-brand-secondary/30 text-slate-400 sticky top-0 font-semibold">
                      <tr>
                        {columns.map((col, cIdx) => (
                          <th key={cIdx} className="px-3 py-2 whitespace-nowrap">{col}</th>
                        ))}
                        <th className="px-3 py-2 text-right">Move</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {items.map((student, sIdx) => (
                        <tr key={sIdx} className="hover:bg-white/[0.02]">
                          {columns.map((col, cIdx) => (
                            <td key={cIdx} className="px-3 py-2 whitespace-nowrap">
                              {student[col] !== undefined ? String(student[col]) : "—"}
                            </td>
                          ))}
                          <td className="px-3 py-2 text-right whitespace-nowrap">
                            <select
                              value={gIdx}
                              onChange={(e) => handleMoveStudent(student, gIdx, Number(e.target.value))}
                              className="bg-brand-dark/90 border border-white/15 text-slate-300 rounded px-2 py-0.5 text-[11px] focus:outline-none focus:border-brand-primary"
                            >
                              {currentGroups.map((tg, tIdx) => (
                                <option key={tIdx} value={tIdx}>
                                  {tg.name}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Always-Accessible Follow-Up AI Regroup Bar (Point 7) */}
      <div className="fixed bottom-6 left-0 right-0 z-40 px-4 pointer-events-none">
        <div className="max-w-3xl mx-auto rounded-3xl bg-brand-dark/95 border border-brand-primary/30 p-4 shadow-2xl backdrop-blur-2xl pointer-events-auto space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <SparklesIcon className="w-4 h-4 text-brand-primary animate-pulse" />
              <span>Want to adjust or regroup with AI?</span>
            </span>
            <span className="text-[11px] text-slate-400">Interactive Follow-Up Assistant</span>
          </div>

          <form onSubmit={handleRefineSubmit} className="flex gap-2">
            <input
              type="text"
              value={refinePrompt}
              onChange={(e) => setRefinePrompt(e.target.value)}
              placeholder="e.g. 'Make gender more balanced' or 'Move 5 Science students from Group 1 to Group 3'..."
              className="flex-1 rounded-xl bg-brand-secondary/40 border border-white/10 px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-primary"
            />
            <button
              type="submit"
              disabled={!refinePrompt.trim() || refining}
              className="px-5 py-2.5 bg-brand-primary text-brand-dark rounded-xl font-bold text-xs hover:bg-brand-accent transition-all shrink-0 disabled:opacity-50"
            >
              {refining ? "Adjusting..." : "Re-optimize Groups"}
            </button>
          </form>

          {/* Quick preset chips */}
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {[
              "Make groups more balanced by gender",
              "Group high performers together",
              "Equalize science student count per group"
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setRefinePrompt(preset)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
              >
                + {preset}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsStudio;
