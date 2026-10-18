import React from 'react';
import {
  CheckCircle2,
  Mountain,
  RotateCcw,
  Info,
} from 'lucide-react';
import { ApplicationSubmission } from '../../types/application';

interface Step5CompleteProps {
  submission: ApplicationSubmission;
  onReset: () => void;
}

export const Step5Complete: React.FC<Step5CompleteProps> = ({
  submission,
  onReset,
}) => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Confirmation Hero Card */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden text-center p-8 sm:p-12 relative">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center mb-5 ring-8 ring-emerald-50">
          <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
        </div>

        <span className="text-xs font-bold text-emerald-800 tracking-wider uppercase font-mono">
          Prototype Application Completed
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-900 mt-2 font-['Plus_Jakarta_Sans'] tracking-tight">
          Application Finalized, {submission.applicant.fullName.split(' ')[0]}!
        </h2>
        <p className="text-stone-600 text-sm sm:text-base mt-2 max-w-xl mx-auto leading-relaxed">
          Your application for Cascade Peak Outfitters has been validated and formatted.
        </p>

        {/* Prototype Architecture Banner */}
        <div className="mt-5 max-w-2xl mx-auto p-3.5 bg-stone-50 border border-stone-200 rounded-xl text-left text-xs text-stone-600 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-stone-900">Front-End Prototype Notice:</span> This application data has been standardized and structured in memory for testing. It is structured for future ATS/HRIS integration; permanent database storage, security rules, and production integrations would be implemented later by the IT team.
          </div>
        </div>

        {/* Reference & Metadata Bar */}
        <div className="mt-6 p-4 bg-stone-50/70 rounded-xl border border-stone-200/80 max-w-xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-4 text-left">
          <div>
            <span className="text-[10px] text-stone-400 font-medium uppercase tracking-wide block">
              Reference ID
            </span>
            <span className="text-xs sm:text-sm font-bold text-stone-900 font-mono mt-0.5 block">
              {submission.referenceId}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-stone-400 font-medium uppercase tracking-wide block">
              Completed Date
            </span>
            <span className="text-xs font-medium text-stone-900 font-mono mt-0.5 block">
              {new Date(submission.submittedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <span className="text-[10px] text-stone-400 font-medium uppercase tracking-wide block">
              Applicant Email
            </span>
            <span className="text-xs font-medium text-stone-900 truncate block mt-0.5" title={submission.applicant.email}>
              {submission.applicant.email}
            </span>
          </div>
        </div>

        {/* Selected Positions Badges */}
        <div className="mt-6 text-center">
          <span className="text-xs text-stone-500 font-medium block mb-2">
            Selected Roles ({submission.selectedPositions.length}):
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            {submission.selectedPositions.map((pos) => (
              <span
                key={pos.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-950 border border-emerald-300"
              >
                <Mountain className="w-3.5 h-3.5 text-emerald-800" />
                <span>{pos.title}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* WORKING ACTION BUTTON */}
      <div className="flex items-center justify-end pt-4 border-t border-stone-200">
        {/* WORKING START NEW APPLICATION BUTTON */}
        <button
          type="button"
          onClick={onReset}
          className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Start New Application</span>
        </button>
      </div>
    </div>
  );
};
