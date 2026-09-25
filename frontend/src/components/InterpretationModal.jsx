import React from 'react';
import { 
  SparklesIcon, 
  CheckCircleIcon, 
  PencilSquareIcon, 
  ArrowRightIcon, 
  XMarkIcon 
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-3xl bg-brand-dark border border-white/15 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
              <SparklesIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AI Request Interpretation</h3>
              <p className="text-xs text-slate-400">Verifying criteria before generating student groups</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Interpretation Checklist (Point 3) */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-cyan-300">
            I understood your request as:
          </p>
          <div className="space-y-2.5 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
            {interpreted_as.map((point, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-sm text-slate-200">
                <CheckCircleIcon className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Grouping Decision Criteria (Point 4) */}
        <div className="p-4 rounded-2xl bg-brand-secondary/20 border border-white/10 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Grouping Decision Summary
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
              <span className="text-slate-400">Target Groups:</span>
              <p className="font-bold text-brand-primary">{criteria.group_count || 10} Groups</p>
            </div>
          </div>
        </div>

        {/* Confirmation Question & Actions */}
        <div className="space-y-4 pt-2">
          <p className="text-center text-sm font-medium text-slate-300">
            Does this look right?
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={onModify}
              disabled={loading}
              className="w-full sm:w-1/2 px-4 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <PencilSquareIcon className="w-4 h-4" />
              <span>Modify Request</span>
            </button>

            <button
              onClick={onConfirm}
              disabled={loading}
              className="w-full sm:w-1/2 px-5 py-3 rounded-xl bg-brand-primary text-brand-dark font-bold text-sm hover:bg-brand-accent transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/25 hover:scale-[1.02]"
            >
              <SparklesIcon className="w-4 h-4" />
              <span>Generate Groups</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterpretationModal;
