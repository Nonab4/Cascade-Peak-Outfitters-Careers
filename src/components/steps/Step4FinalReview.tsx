import React, { useState } from 'react';
import {
  Edit3,
  AlertCircle,
  Briefcase,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  Send,
  Loader2,
  Building,
  MapPin,
  Clock,
  Info,
} from 'lucide-react';
import { ApplicantData, JobPosition } from '../../types/application';

interface Step4FinalReviewProps {
  applicantData: ApplicantData;
  selectedPositions: JobPosition[];
  onEditSection: (step: 2 | 3) => void;
  onFinalize: () => void;
  isSubmitting: boolean;
  onBack: () => void;
}

export const Step4FinalReview: React.FC<Step4FinalReviewProps> = ({
  applicantData,
  selectedPositions,
  onEditSection,
  onFinalize,
  isSubmitting,
  onBack,
}) => {
  const [certified, setCertified] = useState(false);
  const [showCertError, setShowCertError] = useState(false);

  const handleSubmit = () => {
    if (!certified) {
      setShowCertError(true);
      return;
    }
    setShowCertError(false);
    onFinalize();
  };

  return (
    <div className="space-y-8">
      {/* Step Header */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-6 sm:p-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 tracking-wide uppercase">
            <span>Step 4 of 5</span>
            <span aria-hidden="true">·</span>
            <span>Pre-Submission Review</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mt-1 font-['Plus_Jakarta_Sans'] tracking-tight">
            Final Application Review
          </h2>
          <p className="text-stone-600 text-sm mt-1 max-w-3xl leading-relaxed">
            Please carefully review all extracted applicant information and selected positions below. You can make corrections to any section before certifying and finalizing your prototype submission.
          </p>

          <div className="mt-4 p-3 bg-stone-100 rounded-lg text-xs text-stone-600 flex items-start gap-2">
            <Info className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
            <span>
              <strong>Front-End Prototype Notice:</strong> Submitting will format your validated dossier so it is structured and ready for future database or ATS integration. No live database transmission occurs.
            </span>
          </div>
        </div>
      </div>

      {/* DOSSIER SECTION 1: APPLIED POSITIONS */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-emerald-800" />
            <h3 className="text-sm font-bold text-stone-900 font-['Plus_Jakarta_Sans']">
              Target Positions ({selectedPositions.length})
            </h3>
          </div>

          <button
            type="button"
            onClick={() => onEditSection(3)}
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Modify Roles</span>
          </button>
        </div>

        <div className="p-6 divide-y divide-stone-100">
          {selectedPositions.map((pos) => (
            <div key={pos.id} className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-stone-900">{pos.title}</h4>
                  <span className="text-[10px] font-mono text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                    {pos.workType}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">{pos.department}</p>
                <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-1">
                  <MapPin className="w-3 h-3 text-stone-400" />
                  <span>{pos.location}</span>
                </div>
              </div>

              <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 self-start sm:self-center">
                Ready for ATS Formatting
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* DOSSIER SECTION 2: CANDIDATE CONTACT & PROFILE */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-800" />
            <h3 className="text-sm font-bold text-stone-900 font-['Plus_Jakarta_Sans']">
              Applicant Details
            </h3>
          </div>

          <button
            type="button"
            onClick={() => onEditSection(2)}
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Information</span>
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide block">
              Full Legal Name
            </span>
            <span className="text-sm font-bold text-stone-900 block mt-0.5">
              {applicantData.fullName}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide block">
              Email Address
            </span>
            <span className="text-sm font-medium text-stone-900 block mt-0.5">
              {applicantData.email}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide block">
              Phone Number
            </span>
            <span className="text-sm font-medium text-stone-900 block mt-0.5 font-mono">
              {applicantData.phone}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide block">
              Location
            </span>
            <span className="text-sm font-medium text-stone-900 block mt-0.5">
              {applicantData.location}
            </span>
          </div>

          {applicantData.summary && (
            <div className="md:col-span-2 pt-3 border-t border-stone-100">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide block">
                Professional Profile
              </span>
              <p className="text-xs text-stone-700 mt-1 leading-relaxed">
                {applicantData.summary}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* DOSSIER SECTION 3: WORK HISTORY */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-800" />
            <h3 className="text-sm font-bold text-stone-900 font-['Plus_Jakarta_Sans']">
              Work History ({applicantData.workExperience.length})
            </h3>
          </div>

          <button
            type="button"
            onClick={() => onEditSection(2)}
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit History</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {applicantData.workExperience.length === 0 ? (
            <p className="text-xs text-stone-500 italic">No work experience explicitly stated in CV.</p>
          ) : (
            applicantData.workExperience.map((work) => (
              <div key={work.id} className="pb-4 last:pb-0 border-b last:border-0 border-stone-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <h4 className="text-sm font-bold text-stone-900">{work.title}</h4>
                  <span className="text-xs font-mono text-stone-500">
                    {work.startDate} {work.startDate && (work.endDate || 'Present') ? '—' : ''} {work.endDate || (work.current ? 'Present' : '')}
                  </span>
                </div>
                <p className="text-xs font-medium text-emerald-800">{work.company}</p>
                {work.description && (
                  <p className="text-xs text-stone-600 mt-1.5 whitespace-pre-line leading-relaxed">
                    {work.description}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* DOSSIER SECTION 4: EDUCATION & SKILLS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Education */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-800" />
              <h3 className="text-sm font-bold text-stone-900 font-['Plus_Jakarta_Sans']">
                Education ({applicantData.education.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onEditSection(2)}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>

          <div className="p-6 space-y-3">
            {applicantData.education.map((edu) => (
              <div key={edu.id}>
                <h4 className="text-xs sm:text-sm font-bold text-stone-900">{edu.degree}</h4>
                <p className="text-xs text-stone-600">{edu.institution}</p>
                <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                  Graduation Year: {edu.graduationYear}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-800" />
              <h3 className="text-sm font-bold text-stone-900 font-['Plus_Jakarta_Sans']">
                Skills & Competencies ({applicantData.skills.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onEditSection(2)}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>

          <div className="p-6">
            {applicantData.skills.length === 0 ? (
              <p className="text-xs text-stone-500 italic">No skills explicitly stated (optional).</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {applicantData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 text-xs rounded bg-stone-100 text-stone-800 border border-stone-200/70"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONFIRMATION / CERTIFICATION REQUIREMENT */}
      <div className={`p-6 rounded-xl border transition-all ${
        showCertError ? 'bg-rose-50 border-rose-300' : 'bg-emerald-50/50 border-emerald-300'
      }`}>
        <div className="flex items-start gap-3">
          <input
            id="certification-checkbox"
            type="checkbox"
            checked={certified}
            onChange={(e) => {
              setCertified(e.target.checked);
              if (e.target.checked) setShowCertError(false);
            }}
            className="w-5 h-5 rounded text-emerald-800 focus:ring-emerald-700 mt-0.5 cursor-pointer"
          />
          <div className="flex-1">
            <label
              htmlFor="certification-checkbox"
              className="text-xs sm:text-sm font-semibold text-stone-900 cursor-pointer select-none leading-relaxed"
            >
              I certify and confirm that the extracted and reviewed information in this application is accurate, complete, and truthful to the best of my knowledge.
            </label>
            <p className="text-[11px] text-stone-500 mt-1">
              Confirmation is required to finalize the application.
            </p>

            {showCertError && (
              <p className="text-xs font-bold text-rose-700 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Confirmation is required before submitting your application.</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation & Submit CTA */}
      <div className="flex items-center justify-between pt-4 border-t border-stone-200">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="px-4 py-2.5 text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 rounded-lg shadow-xs transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Roles</span>
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-8 py-3 text-sm font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Validating Dossier Format...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Finalize Application</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
