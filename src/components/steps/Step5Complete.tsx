import React, { useState } from 'react';
import {
  CheckCircle2,
  Mountain,
  RotateCcw,
  Printer,
  Copy,
  Check,
  Clock,
  Database,
  FileCheck,
  AlertCircle,
  TrendingDown,
  Mail,
  UserX,
  DollarSign,
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
  const [copiedJson, setCopiedJson] = useState(false);
  const [showDossierJson, setShowDossierJson] = useState(false);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(submission, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

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
            <span className="font-semibold text-stone-900">Front-End Prototype Notice:</span> This application data has been standardized and structured in memory. It is ready for future ATS and HRIS integration; no live external database records are created in this prototype.
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

      {/* CURRENT BASELINES & POTENTIAL BUSINESS VALUE */}
      <div className="bg-stone-900 text-stone-100 rounded-2xl p-6 sm:p-8 border border-stone-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 tracking-wide uppercase">
          <FileCheck className="w-4 h-4 text-emerald-400" />
          <span>Cascade Peak Outfitters Recruitment Case Analysis</span>
        </div>
        <h3 className="text-lg font-bold text-white mt-1 font-['Plus_Jakarta_Sans']">
          Current Operational Baselines & Potential Business Value
        </h3>
        <p className="text-xs text-stone-400 mt-1 max-w-3xl leading-relaxed">
          Cascade Peak Outfitters receives ~4,800 applications per year. This prototype directly targets the company’s current operational pain points:
        </p>

        {/* 6 Current Baseline Facts */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mt-5">
          <div className="bg-stone-800/80 rounded-xl p-3.5 border border-stone-700/60">
            <div className="flex items-center gap-1.5 text-stone-400 text-xs font-medium">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>HR Processing Time</span>
            </div>
            <p className="text-xl font-bold text-white font-mono mt-1">14 minutes</p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Current baseline per application spent on manual data entry and review.
            </p>
          </div>

          <div className="bg-stone-800/80 rounded-xl p-3.5 border border-stone-700/60">
            <div className="flex items-center gap-1.5 text-stone-400 text-xs font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Incomplete Applications</span>
            </div>
            <p className="text-xl font-bold text-white font-mono mt-1">28%</p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Current baseline rate of applications submitted with missing information.
            </p>
          </div>

          <div className="bg-stone-800/80 rounded-xl p-3.5 border border-stone-700/60">
            <div className="flex items-center gap-1.5 text-stone-400 text-xs font-medium">
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <span>Follow-up Emails</span>
            </div>
            <p className="text-xl font-bold text-white font-mono mt-1">1,100 / yr</p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Current annual emails sent by HR to chase missing applicant details.
            </p>
          </div>

          <div className="bg-stone-800/80 rounded-xl p-3.5 border border-stone-700/60">
            <div className="flex items-center gap-1.5 text-stone-400 text-xs font-medium">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Recruiter Labor Cost</span>
            </div>
            <p className="text-xl font-bold text-white font-mono mt-1">$82,000 / yr</p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Current annual baseline expenditure on manual recruiter intake labor.
            </p>
          </div>

          <div className="bg-stone-800/80 rounded-xl p-3.5 border border-stone-700/60">
            <div className="flex items-center gap-1.5 text-stone-400 text-xs font-medium">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Applicant Completion Time</span>
            </div>
            <p className="text-xl font-bold text-white font-mono mt-1">24 minutes</p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Current baseline duration required for an applicant to manually complete the form.
            </p>
          </div>

          <div className="bg-stone-800/80 rounded-xl p-3.5 border border-stone-700/60">
            <div className="flex items-center gap-1.5 text-stone-400 text-xs font-medium">
              <UserX className="w-3.5 h-3.5 text-amber-400" />
              <span>Applicant Drop-Off</span>
            </div>
            <p className="text-xl font-bold text-white font-mono mt-1">22%</p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Current baseline proportion of candidates who abandon the application before completion.
            </p>
          </div>
        </div>

        {/* Potential Business Value Explanation */}
        <div className="mt-5 p-4 rounded-xl bg-stone-800/50 border border-stone-700/60 text-xs text-stone-300 leading-relaxed">
          <span className="font-semibold text-emerald-400 block mb-1">Potential Business Value of the Redesigned Intake:</span>
          By extracting data directly from uploaded CVs and requiring complete contact and education fields upfront, this workflow is designed to reduce the 14-minute manual entry burden, lower the 28% incomplete application rate, eliminate the need for 1,100 follow-up emails, streamline the 24-minute application process to curb the 22% drop-off rate, and support lower recruiter labor costs.
        </div>

        {/* ATS Export Payload Preview */}
        <div className="mt-5 pt-4 border-t border-stone-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowDossierJson(!showDossierJson)}
            className="text-xs text-stone-300 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>{showDossierJson ? 'Hide Standardized Payload' : 'Inspect Standardized ATS Integration Payload'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyJson}
            className="px-3 py-1.5 text-xs text-stone-200 bg-stone-800 hover:bg-stone-700 rounded border border-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedJson ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Payload Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Standardized JSON</span>
              </>
            )}
          </button>
        </div>

        {showDossierJson && (
          <div className="mt-4 p-4 rounded-lg bg-stone-950 border border-stone-800 text-stone-300 font-mono text-[11px] overflow-x-auto max-h-64 leading-tight">
            <pre>{JSON.stringify(submission, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* WORKING ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-stone-200">
        <button
          type="button"
          onClick={handlePrint}
          className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
        >
          <Printer className="w-4 h-4 text-stone-500" />
          <span>Print Application Receipt</span>
        </button>

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
