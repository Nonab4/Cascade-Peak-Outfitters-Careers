import React from 'react';
import { Check, UploadCloud, UserCheck, Briefcase, FileCheck2, Award } from 'lucide-react';
import { ApplicationStep } from '../types/application';

interface StepProgressBarProps {
  currentStep: ApplicationStep;
  onNavigateStep: (step: ApplicationStep) => void;
  maxUnlockedStep: ApplicationStep;
}

interface StepMeta {
  step: ApplicationStep;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: StepMeta[] = [
  { step: 1, label: 'Upload CV', shortLabel: 'Upload', icon: UploadCloud },
  { step: 2, label: 'Review Information', shortLabel: 'Review Info', icon: UserCheck },
  { step: 3, label: 'Select Positions', shortLabel: 'Positions', icon: Briefcase },
  { step: 4, label: 'Final Review', shortLabel: 'Review', icon: FileCheck2 },
  { step: 5, label: 'Complete', shortLabel: 'Complete', icon: Award },
];

export const StepProgressBar: React.FC<StepProgressBarProps> = ({
  currentStep,
  onNavigateStep,
  maxUnlockedStep,
}) => {
  return (
    <div className="w-full bg-white border-b border-stone-200/80 shadow-xs py-4 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-between relative">
            {/* Connecting baseline line */}
            <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-0.5 bg-stone-200 -z-0" />

            {STEPS.map((stepMeta) => {
              const isCurrent = currentStep === stepMeta.step;
              const isCompleted = currentStep > stepMeta.step;
              const isClickable = stepMeta.step <= maxUnlockedStep && stepMeta.step !== 5;
              const Icon = stepMeta.icon;

              return (
                <li key={stepMeta.step} className="relative z-10 flex flex-col items-center">
                  <button
                    type="button"
                    disabled={!isClickable}
                    onClick={() => isClickable && onNavigateStep(stepMeta.step)}
                    className={`group flex items-center justify-center transition-all ${
                      !isClickable ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                        isCompleted
                          ? 'bg-emerald-800 border-emerald-800 text-white shadow-xs'
                          : isCurrent
                          ? 'bg-emerald-50 border-emerald-800 text-emerald-900 ring-4 ring-emerald-100 shadow-sm'
                          : 'bg-white border-stone-300 text-stone-400 group-hover:border-stone-400'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5 text-white stroke-[2.5]" />
                      ) : (
                        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isCurrent ? 'text-emerald-900' : 'text-stone-400'}`} />
                      )}
                    </div>
                  </button>

                  <div className="mt-2 text-center">
                    <span
                      className={`block text-[11px] sm:text-xs font-semibold whitespace-nowrap tracking-tight transition-colors ${
                        isCurrent
                          ? 'text-emerald-900 font-bold'
                          : isCompleted
                          ? 'text-stone-800'
                          : 'text-stone-400'
                      }`}
                    >
                      <span className="hidden sm:inline">{stepMeta.label}</span>
                      <span className="sm:hidden">{stepMeta.shortLabel}</span>
                    </span>
                    <span className="block text-[10px] text-stone-400 font-mono sm:hidden">
                      {stepMeta.step}/5
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </div>
  );
};
