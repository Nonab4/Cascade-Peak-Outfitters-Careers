import React, { useEffect, useState } from 'react';
import {
  X,
  FileCheck,
  Clock,
  AlertCircle,
  Mail,
  DollarSign,
  UserX,
  TrendingDown,
  Info,
  ArrowRight,
  Database,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ApplicationSubmission, ApplicantData, JobPosition } from '../types/application';

interface PrototypeOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubmission?: ApplicationSubmission | null;
  applicantData?: ApplicantData | null;
  selectedPositions?: JobPosition[];
}

export const PrototypeOverviewModal: React.FC<PrototypeOverviewModalProps> = ({
  isOpen,
  onClose,
  currentSubmission,
  applicantData,
  selectedPositions,
}) => {
  const [showDataStructure, setShowDataStructure] = useState(true);
  const [copiedJson, setCopiedJson] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const previewPayload = currentSubmission || {
    referenceId: 'CPO-DEV-PREVIEW-2026',
    submittedAt: new Date().toISOString(),
    status: 'READY_FOR_ATS_INTEGRATION',
    applicant: applicantData || {
      fullName: 'Jordan Vance',
      email: 'jordan.vance@example.com',
      phone: '(206) 555-0192',
      location: 'Seattle, WA',
      summary: 'Experienced retail analytics professional passionate about outdoor lifestyle goods.',
      skills: ['Inventory Analysis', 'SQL', 'Tableau', 'Retail ERP', 'Supply Forecasting'],
      education: [
        {
          id: 'edu-preview-1',
          institution: 'University of Washington',
          degree: 'Bachelor of Science',
          fieldOfStudy: 'Business Administration (Analytics)',
          graduationYear: '2021',
          isExtracted: true,
        },
      ],
      workExperience: [
        {
          id: 'work-preview-1',
          company: 'Northwest Outfitters Co.',
          title: 'Associate Business Analyst',
          startDate: '2021',
          endDate: 'Present',
          current: true,
          description: 'Analyzed SKU velocity and automated regional weekly reporting.',
          isExtracted: true,
        },
      ],
      missingFields: [],
      fileName: 'jordan_vance_cv.pdf',
    },
    selectedPositions:
      selectedPositions && selectedPositions.length > 0
        ? selectedPositions
        : [
            {
              id: 'business-analyst',
              title: 'Business Analyst',
              department: 'Corporate Strategy & Retail Analytics',
              location: 'Seattle, WA / Bend, OR',
              workType: 'Full-Time · Hybrid',
            },
          ],
    metadata: {
      intakeEngine: 'Cascade Peak Automated CV Parser (Gemini 3.8 Flash)',
      validationStatus: 'COMPLIANT_FOR_ATS_IMPORT',
      storageNotice: 'In-memory front-end prototype. Prepared for future ATS/database integration.',
    },
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(previewPayload, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="overview-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-stone-200 flex items-start justify-between bg-stone-50/70">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 tracking-wide uppercase">
              <FileCheck className="w-4 h-4" />
              <span>Cascade Peak Outfitters Recruitment Case</span>
            </div>
            <h2
              id="overview-modal-title"
              className="text-xl sm:text-2xl font-bold text-stone-900 mt-0.5 font-['Plus_Jakarta_Sans'] tracking-tight"
            >
              Prototype Overview & Business Context
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Operational challenges, baseline facts, and potential value of the intake prototype.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Executive Summary of the Business Problem */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/80 text-xs text-stone-700 leading-relaxed">
            <span className="font-bold text-stone-900 block mb-1">Business Problem Summary:</span>
            Cascade Peak Outfitters receives about <strong>4,800 applications per year</strong> and currently faces significant operational bottlenecks: manual data entry, incomplete applications, long processing times, and high applicant drop-off. This prototype was built to demonstrate how automated CV extraction, real-time validation, and multi-position selection can reduce HR labor, improve data quality, and accelerate applicant intake.
          </div>

          {/* Current Operational Baselines */}
          <div>
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-3">
              Current Operational Baselines (Case Facts)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200">
                <div className="flex items-center gap-1.5 text-stone-500 text-xs font-medium">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>HR Processing Time</span>
                </div>
                <p className="text-lg font-bold text-stone-900 font-mono mt-1">14 minutes</p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Manual data entry and review time per application.
                </p>
              </div>

              <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200">
                <div className="flex items-center gap-1.5 text-stone-500 text-xs font-medium">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                  <span>Incomplete Applications</span>
                </div>
                <p className="text-lg font-bold text-stone-900 font-mono mt-1">28%</p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Proportion of submitted applications with missing details.
                </p>
              </div>

              <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200">
                <div className="flex items-center gap-1.5 text-stone-500 text-xs font-medium">
                  <Mail className="w-3.5 h-3.5 text-amber-700" />
                  <span>Follow-up Emails</span>
                </div>
                <p className="text-lg font-bold text-stone-900 font-mono mt-1">1,100 / yr</p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Clarification emails sent annually to chase missing data.
                </p>
              </div>

              <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200">
                <div className="flex items-center gap-1.5 text-stone-500 text-xs font-medium">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Recruiter Labor Cost</span>
                </div>
                <p className="text-lg font-bold text-stone-900 font-mono mt-1">$82,000 / yr</p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Annual expenditure on manual recruiter intake labor.
                </p>
              </div>

              <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200">
                <div className="flex items-center gap-1.5 text-stone-500 text-xs font-medium">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Applicant Completion</span>
                </div>
                <p className="text-lg font-bold text-stone-900 font-mono mt-1">24 minutes</p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Duration for an applicant to manually complete the old form.
                </p>
              </div>

              <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200">
                <div className="flex items-center gap-1.5 text-stone-500 text-xs font-medium">
                  <UserX className="w-3.5 h-3.5 text-amber-700" />
                  <span>Applicant Drop-Off</span>
                </div>
                <p className="text-lg font-bold text-stone-900 font-mono mt-1">22%</p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Candidates who abandon the application before completion.
                </p>
              </div>
            </div>
          </div>

          {/* Potential Business Value */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 leading-relaxed">
            <div className="flex items-center gap-2 font-bold mb-1 text-emerald-900">
              <TrendingDown className="w-4 h-4 text-emerald-700" />
              <span>Potential Business Value of the Redesigned Intake</span>
            </div>
            <p>
              By extracting applicant information directly from uploaded CVs and enforcing required contact and education fields upfront, this workflow targets:
            </p>
            <ul className="mt-2 space-y-1 pl-4 list-disc text-emerald-900">
              <li>Reducing the <strong>14-minute</strong> manual HR data entry burden per application.</li>
              <li>Eliminating incomplete applications that drive <strong>1,100</strong> follow-up emails annually.</li>
              <li>Shortening the <strong>24-minute</strong> application time to address the <strong>22%</strong> drop-off rate.</li>
              <li>Standardizing applicant data to support lower overall recruiter operating costs (currently <strong>$82,000/year</strong>).</li>
            </ul>
          </div>

          {/* Developer Preview: Standardized Data Structure */}
          <div className="border border-stone-200 rounded-xl overflow-hidden bg-stone-900 text-stone-100">
            <div className="p-4 flex items-center justify-between bg-stone-950/80 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-stone-200 tracking-wide uppercase">
                  Developer Preview: Standardized Data Structure
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="px-2.5 py-1 text-[11px] font-medium text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 rounded border border-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedJson ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Standardized JSON</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowDataStructure(!showDataStructure)}
                  className="p-1 text-stone-400 hover:text-white transition-colors cursor-pointer"
                  aria-label={showDataStructure ? 'Collapse data structure' : 'Expand data structure'}
                >
                  {showDataStructure ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="p-4 text-xs text-stone-400 leading-relaxed border-b border-stone-800/60 bg-stone-900">
              This section displays the structured JSON data format as a development and testing example for future ATS and database integration without impacting the applicant workflow.
            </div>

            {showDataStructure && (
              <div className="p-4 bg-stone-950 font-mono text-[11px] text-emerald-300/90 overflow-x-auto max-h-72 leading-relaxed">
                <pre>{JSON.stringify(previewPayload, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* Front-End Prototype Scope Reminder */}
          <div className="p-3.5 bg-stone-100 rounded-xl text-xs text-stone-600 flex items-start gap-2">
            <Info className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-stone-800">Front-End Prototype Scope:</span> This tool demonstrates client-side data collection, validation, and standardized formatting ready for future ATS and HRIS integration. No permanent records or live databases are connected in this prototype.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <span className="text-xs text-stone-500 hidden sm:inline">
            Press <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-stone-300 rounded shadow-2xs">ESC</kbd> or click Close to return.
          </span>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ml-auto"
          >
            <span>Return to Application</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
