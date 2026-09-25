import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const steps = [
  "Analyzing student roster schema and record counts",
  "Validating column headers and score data types",
  "Applying configured capacity constraints and group targets",
  "Balancing gender parity and programme distribution",
  "Calculating cohort variance and compiling analytics"
];

const ProcessingState = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          return prev;
        }
      });
    }, 1100);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="max-w-xl mx-auto py-12 px-4 animate-fadeIn">
      <div className="p-6 sm:p-8 rounded-md bg-slate-900 border border-slate-700 text-center space-y-6">
        <div className="w-12 h-12 mx-auto rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-primary">
          <ArrowPathIcon className="w-6 h-6 animate-spin text-brand-primary" />
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-semibold text-white">Synthesizing Balanced Cohorts</h3>
          <p className="text-xs text-slate-400">
            Applying distribution algorithms across student records
          </p>
        </div>

        {/* Step-by-Step Progress List */}
        <div className="space-y-2.5 text-left max-w-md mx-auto">
          {steps.map((step, idx) => {
            const isDone = idx < currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div 
                key={idx} 
                className={`flex items-center gap-3 p-3 rounded border transition-standard ${
                  isDone 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : isCurrent
                    ? "bg-slate-800 border-cyan-500/40 text-white font-medium"
                    : "bg-slate-900 border-slate-800 text-slate-500"
                }`}
              >
                {isDone ? (
                  <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : isCurrent ? (
                  <ArrowPathIcon className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                )}
                <span className="text-xs">{step}</span>
              </div>
            );
          })}
        </div>

        <div className="pt-2 text-center">
          <span className="text-xs font-mono text-slate-400">
            Stage {currentStep + 1} of {steps.length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProcessingState;
