import React, { useState } from 'react';
import { 
  ArrowDownTrayIcon, 
  PrinterIcon, 
  ArrowUturnLeftIcon, 
  UserGroupIcon,
  ChevronDownIcon,
  CheckBadgeIcon,
  CloudArrowUpIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon
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
  const [history, setHistory] = useState([initialGroups]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [refinePrompt, setRefinePrompt] = useState("");
  const [refining, setRefining] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState(null);

  const currentGroups = history[historyIndex] || initialGroups;

  // Compute analytics dynamically
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

  // Move student between groups
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

    const nextHistory = [...history.slice(0, historyIndex + 1), newGroups];
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);

    setFeedbackNotice(`Moved student to ${newGroups[toGroupIdx].name}. Group balance updated.`);
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  // Undo functionality
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setFeedbackNotice("Restored previous grouping version.");
      setTimeout(() => setFeedbackNotice(null), 3000);
    }
  };

  const handleRefineSubmit = async (e) => {
    e.preventDefault();
    if (!refinePrompt.trim() || refining) return;
    setRefining(true);
    await onRefineWithAI(refinePrompt);
    setRefinePrompt("");
    setRefining(false);
  };

  const totalAssigned = currentGroups.reduce((acc, g) => acc + (g.items?.length || 0), 0);
  const avgGroupSize = currentGroups.length > 0 ? (totalAssigned / currentGroups.length).toFixed(1) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-28 animate-fadeIn">
      {/* Top Banner & Action Controls */}
      <div className="p-5 rounded-md bg-slate-900 border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <h2 className="text-xl font-semibold text-white">Cohort Allocation Generated</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Version {historyIndex + 1}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            <strong>{totalAssigned} records</strong> allocated across <strong>{currentGroups.length} cohorts</strong>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleUndo}
            disabled={historyIndex === 0}
            className="px-3 py-1.5 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-standard disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo manual adjustments"
          >
            <ArrowUturnLeftIcon className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>

          <button
            onClick={onPrintRoster}
            className="px-3.5 py-1.5 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-standard hover-subtle"
          >
            <PrinterIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>Print Rosters</span>
          </button>

          {onSaveToCloud && (
            <button
              onClick={() => onSaveToCloud(currentGroups)}
              className="px-3.5 py-1.5 rounded border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-medium flex items-center gap-1.5 transition-standard hover-subtle"
              title="Save project to your Neon PostgreSQL cloud"
            >
              <CloudArrowUpIcon className="w-3.5 h-3.5" />
              <span>Save to Cloud</span>
            </button>
          )}

          <button
            onClick={onOpenExport}
            className="px-4 py-1.5 bg-brand-primary hover:bg-brand-accent text-slate-900 rounded font-semibold text-xs transition-standard hover-subtle flex items-center gap-1.5"
          >
            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
            <span>Export Roster</span>
          </button>
        </div>
      </div>

      {/* Decision Summary Pill */}
      {decisionSummary && (
        <div className="px-4 py-2.5 rounded-md bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <CheckBadgeIcon className="w-4 h-4 text-brand-primary" />
            <strong className="text-white uppercase tracking-wider text-[11px]">Applied Rules:</strong>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-slate-300">
            <span>Primary: <strong className="text-cyan-400">{decisionSummary.primary}</strong></span>
            <span className="text-slate-600">•</span>
            <span>Secondary: <strong className="text-cyan-400">{decisionSummary.secondary}</strong></span>
            <span className="text-slate-600">•</span>
            <span>Balance: <strong className="text-emerald-400">{decisionSummary.balance}</strong></span>
            <span className="text-slate-600">•</span>
            <span>Cohorts: <strong className="text-white">{currentGroups.length}</strong></span>
          </div>
        </div>
      )}

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Assigned", value: totalAssigned, color: "text-white" },
          { label: "Cohorts Created", value: currentGroups.length, color: "text-cyan-400" },
          { label: "Average / Cohort", value: avgGroupSize, color: "text-emerald-400" },
          { label: "Unassigned", value: 0, color: "text-slate-400" }
        ].map((card, idx) => (
          <div key={idx} className="p-4 rounded-md bg-slate-900 border border-slate-800 space-y-0.5">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">{card.label}</span>
            <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Feedback Notice */}
      {feedbackNotice && (
        <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center justify-between animate-fadeIn">
          <span>{feedbackNotice}</span>
          <button onClick={() => setFeedbackNotice(null)} className="text-emerald-400 hover:text-white" aria-label="Dismiss notice">✕</button>
        </div>
      )}

      {/* Groups Display Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <UserGroupIcon className="w-4 h-4 text-brand-primary" />
            <span>Cohort Rosters & Distribution Analytics</span>
          </h3>
          <p className="text-xs text-slate-400">
            Use the "Move" selector to adjust records manually.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {currentGroups.map((group, gIdx) => {
            const items = group.items || [];
            const analytics = getGroupAnalytics(items);
            const columns = items.length > 0 ? Object.keys(items[0]).slice(0, 5) : [];

            return (
              <div 
                key={gIdx} 
                className="rounded-md bg-slate-900 border border-slate-800 overflow-hidden flex flex-col hover:border-slate-700 transition-standard"
              >
                {/* Header */}
                <div className="p-4 border-b border-slate-800 bg-slate-800/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded bg-slate-800 border border-slate-700 text-cyan-400 flex items-center justify-center font-mono font-bold text-xs">
                      {gIdx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{group.name}</h4>
                      <p className="text-[11px] text-slate-400">{analytics.count} students</p>
                    </div>
                  </div>

                  {analytics.avgScore && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase">Avg Score</span>
                      <p className="text-xs font-semibold text-cyan-400">{analytics.avgScore}</p>
                    </div>
                  )}
                </div>

                {/* Inline Group Analytics Breakdown */}
                <div className="p-3 bg-slate-950 border-b border-slate-800 grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-slate-400 text-[11px] font-medium">Gender Balance:</span>
                    <div className="flex items-center gap-2 text-slate-300 font-mono text-[11px]">
                      <span>M: {analytics.males}</span>
                      <span className="text-slate-600">|</span>
                      <span>F: {analytics.females}</span>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-slate-400 text-[11px] font-medium">Programmes:</span>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(analytics.progs).slice(0, 3).map(([prog, count]) => (
                        <span key={prog} className="px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300 font-mono">
                          {prog}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Student Table */}
                <div className="flex-1 overflow-x-auto max-h-64">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/60 text-slate-400 sticky top-0 font-medium">
                      <tr>
                        {columns.map((col, cIdx) => (
                          <th key={cIdx} className="px-3 py-1.5 whitespace-nowrap">{col}</th>
                        ))}
                        <th className="px-3 py-1.5 text-right">Move</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {items.map((student, sIdx) => (
                        <tr key={sIdx} className="hover:bg-slate-850">
                          {columns.map((col, cIdx) => (
                            <td key={cIdx} className="px-3 py-1.5 whitespace-nowrap text-slate-200">
                              {student[col] !== undefined ? String(student[col]) : "-"}
                            </td>
                          ))}
                          <td className="px-3 py-1.5 text-right whitespace-nowrap">
                            <select
                              value={gIdx}
                              onChange={(e) => handleMoveStudent(student, gIdx, Number(e.target.value))}
                              aria-label={`Move student ${student.name || sIdx} to group`}
                              className="bg-slate-950 border border-slate-700 text-slate-300 rounded px-2 py-0.5 text-[11px] focus:outline-none focus:border-brand-primary"
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

      {/* Follow-Up Re-optimization Bar */}
      <div className="fixed bottom-4 left-0 right-0 z-40 px-4 pointer-events-none">
        <div className="max-w-3xl mx-auto rounded-md bg-slate-900/95 border border-slate-700 p-3.5 shadow-xl pointer-events-auto space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <AdjustmentsHorizontalIcon className="w-4 h-4 text-brand-primary" />
              <span>Refine or Re-optimize Group Distribution</span>
            </span>
            <span className="text-[11px] text-slate-400">Constraint Adjustment</span>
          </div>

          <form onSubmit={handleRefineSubmit} className="flex gap-2">
            <input
              type="text"
              value={refinePrompt}
              onChange={(e) => setRefinePrompt(e.target.value)}
              placeholder="e.g. 'Make gender more balanced' or 'Move 5 Science students from Group 1 to Group 3'..."
              className="flex-1 rounded bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-primary"
            />
            <button
              type="submit"
              disabled={!refinePrompt.trim() || refining}
              className="px-4 py-2 bg-brand-primary hover:bg-brand-accent text-slate-900 rounded font-semibold text-xs transition-standard hover-subtle shrink-0 disabled:opacity-50 flex items-center gap-1.5"
            >
              {refining ? (
                <>
                  <ArrowPathIcon className="w-3.5 h-3.5 animate-spin text-slate-900" />
                  <span>Re-optimizing...</span>
                </>
              ) : (
                <span>Re-optimize</span>
              )}
            </button>
          </form>

          {/* Quick preset chips */}
          <div className="flex flex-wrap gap-1 text-[11px]">
            {[
              "Balance gender ratio 50/50",
              "Equalize academic exam score averages",
              "Distribute science track students uniformly"
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setRefinePrompt(preset)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-standard"
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
