import React, { useState } from 'react';
import {
  CheckCircle2,
  Mountain,
  RotateCcw,
  Printer,
  Copy,
  Check,
  Calendar,
  Mail,
  Clock,
  ArrowRight,
  TrendingDown,
  Database,
  FileCheck,
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
          Application Successfully Received
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-900 mt-2 font-['Plus_Jakarta_Sans'] tracking-tight">
          Welcome to the Trail, {submission.applicant.fullName.split(' ')[0]}!
        </h2>
        <p className="text-stone-600 text-sm sm:text-base mt-2 max-w-xl mx-auto leading-relaxed">
          Your application for Cascade Peak Outfitters has been validated and routed directly to our recruitment operations team.
        </p>

        {/* Reference & Metadata Bar */}
        <div className="mt-8 p-4 bg-stone-50 rounded-xl border border-stone-200/80 max-w-xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-4 text-left">
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
              Submitted At
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
              Candidate Email
            </span>
            <span className="text-xs font-medium text-stone-900 truncate block mt-0.5" title={submission.applicant.email}>
              {submission.applicant.email}
            </span>
          </div>
        </div>

        {/* Selected Positions Badges */}
        <div className="mt-6 text-center">
          <span className="text-xs text-stone-500 font-medium block mb-2">
            Applied Roles ({submission.selectedPositions.length}):
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

      {/* RECRUITMENT OPERATIONS VALUE & IMPACT BOX */}
      <div className="bg-stone-900 text-stone-100 rounded-2xl p-6 sm:p-8 border border-stone-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 tracking-wide uppercase">
          <FileCheck className="w-4 h-4 text-emerald-400" />
          <span>Cascade Peak Outfitters HR Efficiency Impact</span>
        </div>
        <h3 className="text-lg font-bold text-white mt-1 font-['Plus_Jakarta_Sans']">
          How this automated intake achieved our business goals:
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
          <div className="bg-stone-800/80 rounded-xl p-4 border border-stone-700/60">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <TrendingDown className="w-4 h-4" />
              <span>Manual Entry Saved</span>
            </div>
            <p className="text-xl font-extrabold text-white font-mono mt-1">
              ~22 Minutes
            </p>
            <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
              HR previously re-typed every resume field manually. Now automatically parsed into standard fields.
            </p>
          </div>

          <div className="bg-stone-800/80 rounded-xl p-4 border border-stone-700/60">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Data Completeness</span>
            </div>
            <p className="text-xl font-extrabold text-white font-mono mt-1">
              100% Validated
            </p>
            <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
              Zero missing critical contact or qualification fields. Eliminated back-and-forth email chasing.
            </p>
          </div>

          <div className="bg-stone-800/80 rounded-xl p-4 border border-stone-700/60">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <Database className="w-4 h-4" />
              <span>ATS Readiness</span>
            </div>
            <p className="text-xl font-extrabold text-white font-mono mt-1">
              Instant Routing
            </p>
            <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
              Dossier is formatted in standardized structured JSON ready for instant HR ATS database ingestion.
            </p>
          </div>
        </div>

        {/* ATS Export Payload Preview */}
        <div className="mt-5 pt-4 border-t border-stone-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowDossierJson(!showDossierJson)}
            className="text-xs text-stone-300 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>{showDossierJson ? 'Hide Standardized ATS JSON' : 'Inspect Standardized ATS JSON Payload'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyJson}
            className="px-3 py-1.5 text-xs text-stone-200 bg-stone-800 hover:bg-stone-700 rounded border border-stone-700 flex items-center gap-1.5 transition-colors"
          >
            {copiedJson ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Payload Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy ATS Data</span>
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

      {/* NEXT STEPS TIMELINE */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 sm:p-8">
        <h3 className="text-base font-bold text-stone-900 font-['Plus_Jakarta_Sans']">
          What Happens Next?
        </h3>
        <p className="text-xs text-stone-500 mt-0.5">
          Here is our expedited candidate review schedule:
        </p>

        <div className="mt-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold text-xs">
              1
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-stone-900">
                Automated HR Ingestion & Verification
              </h4>
              <p className="text-xs text-stone-600 mt-0.5">
                Your profile has been validated and dispatched to hiring managers for {submission.selectedPositions.map((p) => p.title).join(', ')}.
              </p>
              <span className="text-[11px] text-stone-400 font-mono mt-1 block">Completed · 0 min delay</span>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center shrink-0 font-bold text-xs">
              2
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-stone-900">
                Department Hiring Manager Review
              </h4>
              <p className="text-xs text-stone-600 mt-0.5">
                Our department leads in Seattle, Portland, and regional retail outposts assess role alignment and team fit.
              </p>
              <span className="text-[11px] text-stone-400 font-mono mt-1 block">Expected within 48 business hours</span>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center shrink-0 font-bold text-xs">
              3
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-stone-900">
                Outfitter Conversation & Gear Fit
              </h4>
              <p className="text-xs text-stone-600 mt-0.5">
                Qualified candidates receive an email invitation to schedule a 30-minute virtual or in-person outfitter interview.
              </p>
              <span className="text-[11px] text-stone-400 font-mono mt-1 block">Next step</span>
            </div>
          </div>
        </div>
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
