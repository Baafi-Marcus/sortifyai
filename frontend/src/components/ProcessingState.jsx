import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';

const steps = [
  "Analyzing student spreadsheet & record counts...",
  "Understanding columns, headers & score scales...",
  "Applying grouping criteria and capacity limits...",
  "Balancing gender ratios and programme distribution...",
  "Optimizing cohort allocations & preparing group analytics..."
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
    }, 1200);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="max-w-xl mx-auto py-16 px-4 animate-fadeIn">
      <div className="p-8 rounded-3xl bg-brand-secondary/20 border border-white/10 shadow-2xl backdrop-blur-xl text-center space-y-8">
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-2xl bg-brand-primary/20 animate-ping opacity-75" />
          <div className="relative w-20 h-20 rounded-2xl bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center text-brand-primary">
            <SparklesIcon className="w-10 h-10 animate-spin text-brand-primary" style={{ animationDuration: '4s' }} />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white">Synthesizing Balanced Groups</h3>
          <p className="text-sm text-slate-400">
            SortifyAI is running allocation algorithms across your student cohort.
          </p>
        </div>

        {/* Step-by-Step Progress List (Point 14) */}
        <div className="space-y-3 text-left max-w-md mx-auto">
          {steps.map((step, idx) => {
            const isDone = idx < currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div 
                key={idx} 
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  isDone 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                    : isCurrent
                    ? "bg-brand-primary/10 border-brand-primary/30 text-white font-semibold"
                    : "bg-white/[0.01] border-white/5 text-slate-500"
                }`}
              >
                {isDone ? (
                  <CheckCircleIcon className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : isCurrent ? (
                  <span className="relative flex h-3 w-3 shrink-0 mx-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-primary"></span>
                  </span>
                ) : (
                  <div className="w-3 h-3 rounded-full border border-slate-600 shrink-0 mx-1" />
                )}
                <span className="text-xs sm:text-sm">{step}</span>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-slate-500 italic">
          Almost there. Calculating variance and equal distributions...
        </p>
      </div>
    </div>
  );
};

export default ProcessingState;
