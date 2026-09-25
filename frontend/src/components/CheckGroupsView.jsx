import React from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  ScaleIcon, 
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const CheckGroupsView = ({ report, onReoptimize, onClose }) => {
  if (!report) return null;

  const { group_column, total_groups, total_students, report: rep } = report;

  const getBadge = (status) => {
    if (status === 'Good') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
          <CheckCircleIcon className="w-3.5 h-3.5" />
          <span>Balanced</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-1">
        <ExclamationTriangleIcon className="w-3.5 h-3.5" />
        <span>Needs Adjustment</span>
      </span>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      <div className="p-8 rounded-3xl bg-brand-secondary/20 border border-white/10 shadow-2xl backdrop-blur-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
              <ScaleIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Group Balance Audit Report</h3>
              <p className="text-xs text-slate-400">
                Audited <strong className="text-white">{total_students} students</strong> across <strong className="text-cyan-300">{total_groups} existing groups</strong> (Column: "{group_column}")
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Scorecard Table (Point 19) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
            <span className="text-xs text-slate-400 uppercase font-semibold">Group Size</span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">Equal Sizing</span>
              {getBadge(rep.group_size)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
            <span className="text-xs text-slate-400 uppercase font-semibold">Gender Ratio</span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">M/F Parity</span>
              {getBadge(rep.gender_balance)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
            <span className="text-xs text-slate-400 uppercase font-semibold">Academic Parity</span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">Score Spread</span>
              {getBadge(rep.academic_balance)}
            </div>
          </div>
        </div>

        {/* Detailed Insights */}
        <div className="space-y-2">
          <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Audit Findings</h4>
          <div className="space-y-2">
            {rep.insights?.map((insight, idx) => (
              <p key={idx} className="p-3 rounded-xl bg-brand-dark/50 border border-white/5 text-xs text-slate-300 flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span>{insight}</span>
              </p>
            ))}
          </div>
        </div>

        {/* Call to action */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/5"
          >
            Dismiss
          </button>
          <button
            onClick={onReoptimize}
            className="px-6 py-2.5 bg-brand-primary text-brand-dark rounded-xl text-xs font-bold hover:bg-brand-accent transition-all flex items-center gap-1.5 shadow-lg shadow-brand-primary/20"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span>Rebalance These Groups with SortifyAI</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckGroupsView;
