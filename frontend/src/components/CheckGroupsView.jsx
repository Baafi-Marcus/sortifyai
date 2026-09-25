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
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
          <CheckCircleIcon className="w-3 h-3" />
          <span>Balanced</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-1">
        <ExclamationTriangleIcon className="w-3 h-3" />
        <span>Imbalanced</span>
      </span>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fadeIn">
      <div className="p-6 sm:p-8 rounded-md bg-slate-900 border border-slate-700 space-y-5">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-primary">
              <ScaleIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Group Balance Audit</h3>
              <p className="text-xs text-slate-400">
                Analyzed <strong className="text-white">{total_students} records</strong> across <strong className="text-cyan-400">{total_groups} cohorts</strong> (Column: "{group_column}")
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Close group audit view"
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-standard"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Scorecard Table */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded bg-slate-800/40 border border-slate-800 space-y-1.5">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Cohort Sizes</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Headcount Parity</span>
              {getBadge(rep.group_size)}
            </div>
          </div>

          <div className="p-3.5 rounded bg-slate-800/40 border border-slate-800 space-y-1.5">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Gender Ratio</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">M/F Parity</span>
              {getBadge(rep.gender_balance)}
            </div>
          </div>

          <div className="p-3.5 rounded bg-slate-800/40 border border-slate-800 space-y-1.5">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Academic Spread</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Score Parity</span>
              {getBadge(rep.academic_balance)}
            </div>
          </div>
        </div>

        {/* Detailed Insights */}
        <div className="space-y-2">
          <h4 className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Audit Findings</h4>
          <div className="space-y-1.5">
            {rep.insights?.map((insight, idx) => (
              <p key={idx} className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span>{insight}</span>
              </p>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-standard"
          >
            Dismiss
          </button>
          <button
            onClick={onReoptimize}
            className="px-4 py-2 bg-brand-primary hover:bg-brand-accent text-slate-900 rounded text-xs font-semibold transition-standard hover-subtle flex items-center gap-1.5"
          >
            <ArrowPathIcon className="w-3.5 h-3.5" />
            <span>Rebalance Cohorts with Engine</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckGroupsView;
