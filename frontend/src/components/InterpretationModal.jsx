import React from 'react';
import { 
  CheckCircleIcon, 
  PencilSquareIcon, 
  ArrowRightIcon, 
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const InterpretationModal = ({ 
  isOpen, 
  interpretation, 
  onConfirm, 
  onModify, 
  onClose,
  loading 
}) => {
  if (!isOpen || !interpretation) return null;

  const { interpreted_as = [], criteria = {} } = interpretation;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-md bg-slate-900 border border-slate-700 p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-primary">
              <AdjustmentsHorizontalIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Rule Interpretation Review</h3>
              <p className="text-xs text-slate-400">Review parsed criteria before generating cohorts</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close interpretation dialog"
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-standard"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Interpretation Checklist */}
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
            Parsed Grouping Rules:
          </p>
          <div className="space-y-2 p-3.5 rounded bg-slate-950 border border-slate-800">
            {interpreted_as.map((point, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Grouping Decision Criteria */}
        <div className="p-4 rounded bg-slate-800/40 border border-slate-800 space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Configuration Matrix
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400">Primary Rule:</span>
              <p className="font-semibold text-white">{criteria.primary || "Balanced Headcount"}</p>
            </div>
            <div>
              <span className="text-slate-400">Secondary Diversity:</span>
              <p className="font-semibold text-white">{criteria.secondary || "Programme Mix"}</p>
            </div>
            <div>
              <span className="text-slate-400">Balance Metric:</span>
              <p className="font-semibold text-white">{criteria.balance || "Gender Ratio"}</p>
            </div>
            <div>
              <span className="text-slate-400">Target Cohorts:</span>
              <p className="font-bold text-cyan-400">{criteria.group_count || 10} Groups</p>
            </div>
          </div>
        </div>

        {/* Confirmation Question & Actions */}
        <div className="space-y-3 pt-2">
          <p className="text-center text-xs font-medium text-slate-300">
            Confirm configuration to proceed with allocation
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <button
              onClick={onModify}
              disabled={loading}
              className="w-full sm:w-1/2 px-4 py-2.5 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-standard"
            >
              <PencilSquareIcon className="w-4 h-4" />
              <span>Modify Request</span>
            </button>

            <button
              onClick={onConfirm}
              disabled={loading}
              className="w-full sm:w-1/2 px-4 py-2.5 rounded bg-brand-primary hover:bg-brand-accent text-slate-900 font-semibold text-xs transition-standard hover-subtle flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 animate-spin text-slate-900" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Generate Groups</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterpretationModal;
