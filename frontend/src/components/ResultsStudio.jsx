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
  reportTitle,
  groups: initialGroups, 
  decisionSummary, 
  onRefineWithAI, 
  onOpenExport,
  onPrintRoster,
  onSaveToCloud,
  onAutoSave,
  totalRows 
}) => {
  const [history, setHistory] = useState([initialGroups]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [refinePrompt, setRefinePrompt] = useState("");
  const [refining, setRefining] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState(null);

  const currentGroups = history[historyIndex] || initialGroups;

  // Helper to format values for display (e.g. truncate long floats)
  const formatCellValue = (val) => {
    if (val === undefined || val === null || val === "") return "-";
    if (typeof val === 'number') {
      return Number.isInteger(val) ? val : parseFloat(val.toFixed(2));
    }
    if (typeof val === 'string' && !isNaN(val) && val.includes('.')) {
      const parts = val.split('.');
      if (parts[1] && parts[1].length > 2) {
        return parseFloat(val).toFixed(2);
      }
    }
    return String(val);
  };

  // Compute analytics dynamically based on actual data
  const getGroupAnalytics = (items = []) => {
    const count = items.length;
    if (count === 0) {
      return { count: 0, avgScore: null, minScore: null, maxScore: null, dynamicCategories: [] };
    }

    let scoreSum = 0;
    let scoreCount = 0;
    let minScore = Infinity;
    let maxScore = -Infinity;

    // Track distributions for all non-numeric/non-ID columns
    const distributions = {};

    items.forEach(it => {
      for (const [k, v] of Object.entries(it)) {
        if (v === null || v === undefined || String(v).trim() === '') continue;
        
        const kl = k.toLowerCase();
        
        // Check for scores
        if (['score', 'mark', 'grade', 'total', 'average'].some(w => kl.includes(w))) {
          const num = parseFloat(String(v).replace(/[$,%]/g, '').trim());
          if (!isNaN(num)) {
            scoreSum += num;
            scoreCount++;
            if (num < minScore) minScore = num;
            if (num > maxScore) maxScore = num;
          }
        } else {
          // Categorical tracking (ignore ID, name, email columns)
          if (!['id', 'name', 'email', 'phone', 'contact'].some(w => kl.includes(w))) {
            const valStr = String(v).trim();
            if (!distributions[k]) distributions[k] = {};
            distributions[k][valStr] = (distributions[k][valStr] || 0) + 1;
          }
        }
      }
    });

    // Filter to top categorical columns that have between 2 and 8 unique values
    const dynamicCategories = [];
    for (const [colName, counts] of Object.entries(distributions)) {
      const numKeys = Object.keys(counts).length;
      if (numKeys >= 2 && numKeys <= 8) {
        // Only keep top 4 values for display
        const topValues = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([val, cnt]) => ({ val, cnt }));
        dynamicCategories.push({ name: colName, values: topValues });
      }
    }
    
    // Sort so we get consistent categories
    dynamicCategories.sort((a, b) => a.name.localeCompare(b.name));

    return {
      count,
      avgScore: scoreCount > 0 ? (scoreSum / scoreCount).toFixed(1) : null,
      minScore: scoreCount > 0 ? minScore : null,
      maxScore: scoreCount > 0 ? maxScore : null,
      dynamicCategories: dynamicCategories.slice(0, 2) // Max 2 for UI
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
    
    if (onAutoSave) onAutoSave(newGroups);

    setFeedbackNotice(`Moved student to ${newGroups[toGroupIdx].name}. Group balance updated.`);
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  // Undo functionality
  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      setHistoryIndex(nextIdx);
      if (onAutoSave) onAutoSave(history[nextIdx]);
      
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
    <div className="max-w-7xl mx-auto space-y-6 pb-48 animate-fadeIn">
      {/* Top Banner & Action Controls */}
      <div className="relative overflow-hidden p-6 rounded-xl bg-slate-900/50 backdrop-blur-md border border-slate-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
                {reportTitle || "Cohort Allocation Workspace"}
            </h2>
            <span className="text-xs font-semibold tracking-wide px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 ml-2">
              v{historyIndex + 1}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-2 flex items-center gap-2 font-medium">
            <span className="text-slate-300">{totalAssigned} records</span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span className="text-slate-300">{currentGroups.length} cohorts</span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span className="text-slate-300">~{avgGroupSize} / cohort</span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="relative z-10 flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleUndo}
            disabled={historyIndex === 0}
            className="px-4 py-2 rounded-lg border border-slate-700/50 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-sm font-medium flex items-center gap-2 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
            title="Undo manual adjustments"
          >
            <ArrowUturnLeftIcon className="w-4 h-4" />
            <span>Undo</span>
          </button>

          <button
            onClick={onPrintRoster}
            className="px-4 py-2 rounded-lg border border-slate-700/50 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-sm font-medium flex items-center gap-2 transition-all duration-200 hover:shadow-[0_0_12px_rgba(34,211,238,0.2)]"
          >
            <PrinterIcon className="w-4 h-4 text-cyan-400" />
            <span>Print Rosters</span>
          </button>

          {onSaveToCloud && (
            <button
              onClick={() => onSaveToCloud(currentGroups)}
              className="px-4 py-2 rounded-lg border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 hover:from-cyan-500/20 hover:to-indigo-500/20 text-cyan-300 hover:text-cyan-200 text-sm font-semibold flex items-center gap-2 transition-all duration-300 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]"
              title="Save project to your Neon PostgreSQL cloud"
            >
              <CloudArrowUpIcon className="w-4 h-4" />
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
        <div className="relative overflow-hidden p-4 rounded-xl bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 flex flex-wrap items-center justify-between gap-4 text-sm shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent pointer-events-none" />
          <div className="flex items-center gap-2 text-slate-400 relative z-10">
            <CheckBadgeIcon className="w-5 h-5 text-cyan-400" />
            <strong className="text-white uppercase tracking-wider text-xs">Applied Rules:</strong>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-slate-300 relative z-10">
            <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1 rounded-md border border-slate-700/50">Primary: <strong className="text-cyan-400 font-semibold">{decisionSummary.primary}</strong></span>
            <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1 rounded-md border border-slate-700/50">Secondary: <strong className="text-indigo-400 font-semibold">{decisionSummary.secondary}</strong></span>
            <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1 rounded-md border border-slate-700/50">Balance: <strong className="text-emerald-400 font-semibold">{decisionSummary.balance}</strong></span>
            <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1 rounded-md border border-slate-700/50">Cohorts: <strong className="text-white font-semibold">{currentGroups.length}</strong></span>
          </div>
        </div>
      )}

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Assigned", value: totalAssigned, color: "text-white", glow: "from-white/10 to-transparent" },
          { label: "Cohorts Created", value: currentGroups.length, color: "text-cyan-400", glow: "from-cyan-500/10 to-transparent" },
          { label: "Average / Cohort", value: avgGroupSize, color: "text-emerald-400", glow: "from-emerald-500/10 to-transparent" },
          { label: "Unassigned", value: 0, color: "text-slate-400", glow: "from-slate-500/10 to-transparent" }
        ].map((card, idx) => (
          <div key={idx} className="relative overflow-hidden p-5 rounded-xl bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 space-y-1 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg group">
            <div className={`absolute top-0 left-0 right-0 h-full bg-gradient-to-b ${card.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold relative z-10">{card.label}</span>
            <p className={`text-2xl font-bold ${card.color} relative z-10`}>{card.value}</p>
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
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-700/50">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <UserGroupIcon className="w-5 h-5 text-cyan-400" />
            <span className="tracking-wide">Cohort Rosters & Analytics</span>
          </h3>
          <p className="text-xs font-medium text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
            Use the "Move" selector to adjust records manually.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {currentGroups.map((group, gIdx) => {
            const items = group.items || [];
            const analytics = getGroupAnalytics(items);
            const columns = items.length > 0 ? Object.keys(items[0]).slice(0, 5) : [];

            return (
              <div 
                key={gIdx} 
                className="relative flex flex-col rounded-xl bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl hover:border-slate-600 group"
              >
                {/* Header */}
                <div className="p-5 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/80 to-slate-900/40 flex items-center justify-between relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="flex items-center gap-4 relative z-10">
                    <span className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-mono font-bold text-sm shadow-sm">
                      {gIdx + 1}
                    </span>
                    <div>
                      <h4 className="text-base font-bold text-white tracking-wide">{group.name}</h4>
                      <p className="text-xs font-medium text-slate-400 mt-0.5">{analytics.count} assigned students</p>
                    </div>
                  </div>

                  {analytics.avgScore && (
                    <div className="text-right relative z-10 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-0.5">Avg Score</span>
                      <p className="text-sm font-bold text-emerald-400">{analytics.avgScore}</p>
                    </div>
                  )}
                </div>

                {/* Inline Group Analytics Breakdown */}
                {analytics.dynamicCategories && analytics.dynamicCategories.length > 0 && (
                  <div className="p-3 bg-slate-950/50 border-b border-slate-700/50 flex flex-wrap gap-x-6 gap-y-3 text-xs">
                    {analytics.dynamicCategories.map((cat, idx) => (
                      <div key={idx} className="space-y-1">
                        <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">{cat.name}:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {cat.values.map((v, vIdx) => (
                            <span key={vIdx} className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/50 text-[10px] text-slate-300 font-medium shadow-sm">
                              {v.val}: <strong className="text-cyan-400 ml-0.5">{v.cnt}</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

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
                              {formatCellValue(student[col])}
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
      <div className="fixed bottom-6 left-0 right-0 z-40 px-4 pointer-events-none">
        <div className="max-w-4xl mx-auto rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] pointer-events-auto space-y-3 relative overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute top-0 left-1/2 w-64 h-32 bg-cyan-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          
          <div className="flex items-center justify-between relative z-10">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <AdjustmentsHorizontalIcon className="w-5 h-5 text-cyan-400" />
              <span>Refine or Re-optimize Group Distribution</span>
            </span>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700/50">Constraint Adjustment</span>
          </div>

          <form onSubmit={handleRefineSubmit} className="flex gap-3 relative z-10">
            <input
              type="text"
              value={refinePrompt}
              onChange={(e) => setRefinePrompt(e.target.value)}
              placeholder="e.g. 'Make gender more balanced' or 'Move 5 Science students from Group 1 to Group 3'..."
              className="flex-1 rounded-xl bg-slate-950/80 border border-slate-700/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={!refinePrompt.trim() || refining}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 rounded-xl font-bold text-sm transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
            >
              {refining ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 animate-spin text-slate-900" />
                  <span>Optimizing...</span>
                </>
              ) : (
                <span>Re-optimize</span>
              )}
            </button>
          </form>

          {/* Quick preset chips */}
          <div className="flex flex-wrap gap-2 text-[11px] relative z-10 pt-1">
            {[
              "Balance gender ratio 50/50",
              "Equalize academic exam score averages",
              "Distribute science track students uniformly"
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setRefinePrompt(preset)}
                className="px-3 py-1 rounded-full bg-slate-800/60 hover:bg-slate-700 border border-slate-700/50 text-slate-300 hover:text-white hover:border-cyan-500/30 transition-all duration-200"
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
