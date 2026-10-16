import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  Briefcase,
  Sparkles,
  Info,
  X,
  AlertTriangle,
} from 'lucide-react';
import { ApplicantData, EducationItem, WorkExperienceItem } from '../../types/application';
import {
  standardizePhoneNumber,
  isValidPhoneNumber,
  isValidEmailAddress,
  isValidGraduationYear,
} from '../../utils/resumeParser';

interface Step2ReviewInfoProps {
  data: ApplicantData;
  onUpdateData: (updated: ApplicantData) => void;
  onNext: () => void;
  onBack: () => void;
}

// Generate array of graduation years from current year + 6 down to 1965
const CURRENT_YEAR = new Date().getFullYear();
const GRADUATION_YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR + 6 - 1965 + 1 }, (_, i) =>
  String(CURRENT_YEAR + 6 - i)
);

export const Step2ReviewInfo: React.FC<Step2ReviewInfoProps> = ({
  data,
  onUpdateData,
  onNext,
  onBack,
}) => {
  const [formData, setFormData] = useState<ApplicantData>({ ...data });

  useEffect(() => {
    setFormData({ ...data });
  }, [data]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [showAddEdu, setShowAddEdu] = useState(false);
  const [showAddWork, setShowAddWork] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // New Education Draft
  const [draftEdu, setDraftEdu] = useState<Partial<EducationItem>>({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    graduationYear: '',
    details: '',
  });
  const [draftEduError, setDraftEduError] = useState<string | null>(null);

  // New Work Experience Draft
  const [draftWork, setDraftWork] = useState<Partial<WorkExperienceItem>>({
    company: '',
    title: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
  });
  const [draftWorkError, setDraftWorkError] = useState<string | null>(null);

  // Validation evaluations
  const isNameValid = formData.fullName.trim().length >= 2;
  const isEmailValid = isValidEmailAddress(formData.email);
  const isPhoneValid = isValidPhoneNumber(formData.phone);
  const isLocationValid = formData.location.trim().length >= 2;
  
  const hasEducation = formData.education.length > 0;
  const areAllEduGradYearsValid =
    hasEducation &&
    formData.education.every(
      (e) => Boolean(e.graduationYear && isValidGraduationYear(e.graduationYear))
    );
  const areAllEduDegreesValid =
    hasEducation &&
    formData.education.every((e) => Boolean(e.degree.trim() && e.institution.trim()));

  const hasWorkExperience = formData.workExperience.length > 0;
  const areAllWorkItemsValid =
    !hasWorkExperience ||
    formData.workExperience.every((w) => Boolean(w.title.trim() && w.company.trim()));

  const hasSkills = formData.skills.length > 0;

  // Build explicit list of all correction requirements
  const validationErrors: string[] = [];
  if (!isNameValid) validationErrors.push('Full Legal Name is required (minimum 2 characters).');
  if (!formData.email.trim()) {
    validationErrors.push('Email Address is required.');
  } else if (!isEmailValid) {
    validationErrors.push('Email Address format is invalid (e.g. applicant@domain.com).');
  }
  if (!formData.phone.trim()) {
    validationErrors.push('Phone Number is required.');
  } else if (!isPhoneValid) {
    validationErrors.push('Phone Number must contain 10 digits (e.g. (206) 555-0184).');
  }
  if (!isLocationValid) validationErrors.push('Location (City, State / Region) is required.');
  if (!hasEducation) {
    validationErrors.push('At least one Education record is required.');
  } else {
    if (!areAllEduDegreesValid) {
      validationErrors.push('Each education record must have a Degree and Institution.');
    }
    if (!areAllEduGradYearsValid) {
      validationErrors.push('Each education record requires a valid 4-digit Graduation Year (e.g., 2022).');
    }
  }
  // Work experience is optional: missing work experience must not count as a validation error
  if (hasWorkExperience && !areAllWorkItemsValid) {
    validationErrors.push('Each added work experience record must have a Job Title and Company.');
  }

  const isFormValid = validationErrors.length === 0;

  const handleFieldChange = (field: keyof ApplicantData, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onUpdateData(updated);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const formatted = standardizePhoneNumber(rawVal);
    handleFieldChange('phone', formatted);
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkillInput.trim() && !formData.skills.includes(newSkillInput.trim())) {
      const updatedSkills = [...formData.skills, newSkillInput.trim()];
      handleFieldChange('skills', updatedSkills);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const updatedSkills = formData.skills.filter((s) => s !== skillToRemove);
    handleFieldChange('skills', updatedSkills);
  };

  const handleUpdateEducation = (id: string, field: keyof EducationItem, val: string) => {
    const updated = formData.education.map((item) =>
      item.id === id ? { ...item, [field]: val } : item
    );
    handleFieldChange('education', updated);
  };

  const handleRemoveEducation = (id: string) => {
    const updated = formData.education.filter((item) => item.id !== id);
    handleFieldChange('education', updated);
  };

  const handleSaveDraftEducation = () => {
    setDraftEduError(null);
    if (!draftEdu.degree?.trim() || !draftEdu.institution?.trim()) {
      setDraftEduError('Please enter both Degree and Institution.');
      return;
    }
    if (!draftEdu.graduationYear || !isValidGraduationYear(draftEdu.graduationYear)) {
      setDraftEduError('Please select or enter a valid 4-digit Graduation Year (between 1960 and 2035).');
      return;
    }

    const newItem: EducationItem = {
      id: `edu-manual-${Date.now()}`,
      institution: draftEdu.institution.trim(),
      degree: draftEdu.degree.trim(),
      fieldOfStudy: draftEdu.fieldOfStudy?.trim() || '',
      graduationYear: draftEdu.graduationYear.trim(),
      details: draftEdu.details?.trim() || '',
      isExtracted: false,
    };
    handleFieldChange('education', [...formData.education, newItem]);
    setDraftEdu({ institution: '', degree: '', fieldOfStudy: '', graduationYear: '', details: '' });
    setShowAddEdu(false);
  };

  const handleUpdateWork = (id: string, field: keyof WorkExperienceItem, val: any) => {
    const updated = formData.workExperience.map((item) =>
      item.id === id ? { ...item, [field]: val } : item
    );
    handleFieldChange('workExperience', updated);
  };

  const handleRemoveWork = (id: string) => {
    const updated = formData.workExperience.filter((item) => item.id !== id);
    handleFieldChange('workExperience', updated);
  };

  const handleSaveDraftWork = () => {
    setDraftWorkError(null);
    if (!draftWork.title?.trim() || !draftWork.company?.trim()) {
      setDraftWorkError('Please enter both Job Title and Company Name.');
      return;
    }

    const newItem: WorkExperienceItem = {
      id: `work-manual-${Date.now()}`,
      company: draftWork.company.trim(),
      title: draftWork.title.trim(),
      startDate: draftWork.startDate?.trim() || '',
      endDate: draftWork.endDate?.trim() || '',
      current: draftWork.current || false,
      description: draftWork.description?.trim() || '',
      isExtracted: false,
    };
    handleFieldChange('workExperience', [...formData.workExperience, newItem]);
    setDraftWork({ company: '', title: '', startDate: '', endDate: '', current: false, description: '' });
    setShowAddWork(false);
  };

  const handleProceed = () => {
    setAttemptedSubmit(true);
    if (!isFormValid) {
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-8">
      {/* Step Header */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 tracking-wide uppercase">
              <span>Step 2 of 5</span>
              <span aria-hidden="true">·</span>
              <span>Review & Validation</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mt-1 font-['Plus_Jakarta_Sans'] tracking-tight">
              Review Applicant Information
            </h2>
            <p className="text-stone-600 text-sm mt-1 max-w-2xl">
              Extracted fields from your CV are populated below. To support data quality and reduce incomplete applications, all required fields and formats must be validated before continuing.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-700 bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200 font-mono flex items-center gap-1.5">
              <span className="text-stone-400">Document:</span>
              <span className="font-semibold text-stone-800">{formData.fileName || 'Uploaded CV'}</span>
            </span>
          </div>
        </div>

        {/* Validation Summary Callout if missing fields or errors exist */}
        {!isFormValid || validationErrors.length > 0 ? (
          <div className="mt-6 p-5 bg-amber-50/90 border border-amber-300 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                    Required Information & Format Corrections ({validationErrors.length})
                  </h4>
                  <span className="text-[11px] text-amber-800 font-medium">
                    · Action required to proceed
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-1">
                  The following required items must be entered or corrected before proceeding:
                </p>
                <ul className="mt-2.5 space-y-1.5 text-xs text-amber-900">
                  {validationErrors.map((err, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-700 font-bold leading-none mt-1">·</span>
                      <span>{err}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <p className="text-xs font-medium text-emerald-900">
              All required fields, contact information, and education records are complete and properly formatted.
            </p>
          </div>
        )}
      </div>

      {/* SECTION 1: PERSONAL & CONTACT INFORMATION */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-6 sm:p-8">
        <h3 className="text-base font-bold text-stone-900 font-['Plus_Jakarta_Sans'] flex items-center gap-2">
          <span>Personal & Contact Information</span>
        </h3>
        <p className="text-xs text-stone-500 mt-1">
          Used to identify and contact you throughout the recruitment process.
        </p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Full Name */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="fullName" className="block text-xs font-semibold text-stone-800 mb-1">
                Full Legal Name <span className="text-rose-600">*</span>
              </label>
              {!isNameValid && (
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">
                  Required
                </span>
              )}
            </div>
            <input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => handleFieldChange('fullName', e.target.value)}
              placeholder="e.g. Jordan Vance"
              className={`w-full px-3.5 py-2.5 text-sm rounded-lg border transition-all ${
                !isNameValid && attemptedSubmit
                  ? 'border-rose-400 bg-rose-50/40 focus:ring-rose-500'
                  : !isNameValid
                  ? 'border-amber-400 bg-amber-50/30 focus:ring-amber-500'
                  : 'border-stone-300 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 bg-white'
              }`}
            />
            {!isNameValid && (
              <p className="text-[11px] text-amber-700 mt-1">Please enter your full legal name.</p>
            )}
          </div>

          {/* Email */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="email" className="block text-xs font-semibold text-stone-800 mb-1">
                Email Address <span className="text-rose-600">*</span>
              </label>
              {!isEmailValid && (
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">
                  {formData.email.trim() ? 'Invalid Format' : 'Required'}
                </span>
              )}
            </div>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              placeholder="e.g. applicant@domain.com"
              className={`w-full px-3.5 py-2.5 text-sm rounded-lg border transition-all ${
                !isEmailValid && attemptedSubmit
                  ? 'border-rose-400 bg-rose-50/40 focus:ring-rose-500'
                  : !isEmailValid
                  ? 'border-amber-400 bg-amber-50/30 focus:ring-amber-500'
                  : 'border-stone-300 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 bg-white'
              }`}
            />
            {!isEmailValid && (
              <p className="text-[11px] text-amber-700 mt-1">
                {formData.email.trim()
                  ? 'Please enter a valid email format (e.g., name@example.com).'
                  : 'Email address is required.'}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="phone" className="block text-xs font-semibold text-stone-800 mb-1">
                Phone Number <span className="text-rose-600">*</span>
              </label>
              {!isPhoneValid && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {formData.phone.trim() ? '10 Digits Required' : 'Missing from CV'}
                </span>
              )}
            </div>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder="(206) 555-0184"
              className={`w-full px-3.5 py-2.5 text-sm rounded-lg border transition-all font-mono ${
                !isPhoneValid && attemptedSubmit
                  ? 'border-rose-400 bg-rose-50/40 focus:ring-rose-500'
                  : !isPhoneValid
                  ? 'border-amber-400 bg-amber-50/30 focus:ring-amber-500'
                  : 'border-stone-300 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 bg-white'
              }`}
            />
            {!isPhoneValid && (
              <p className="text-[11px] text-amber-700 mt-1">
                Standardized 10-digit phone number is required (e.g. (206) 555-0184).
              </p>
            )}
          </div>

          {/* Location */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="location" className="block text-xs font-semibold text-stone-800 mb-1">
                Location (City, State / Region) <span className="text-rose-600">*</span>
              </label>
              {!isLocationValid && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Missing from CV
                </span>
              )}
            </div>
            <input
              id="location"
              type="text"
              value={formData.location}
              onChange={(e) => handleFieldChange('location', e.target.value)}
              placeholder="e.g. Seattle, WA or Portland, OR"
              className={`w-full px-3.5 py-2.5 text-sm rounded-lg border transition-all ${
                !isLocationValid && attemptedSubmit
                  ? 'border-rose-400 bg-rose-50/40 focus:ring-rose-500'
                  : !isLocationValid
                  ? 'border-amber-400 bg-amber-50/30 focus:ring-amber-500'
                  : 'border-stone-300 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 bg-white'
              }`}
            />
            {!isLocationValid && (
              <p className="text-[11px] text-amber-700 mt-1">
                Please enter your city and state or regional location.
              </p>
            )}
          </div>
        </div>

        {/* Professional Summary */}
        <div className="mt-5">
          <label htmlFor="summary" className="block text-xs font-semibold text-stone-800 mb-1">
            Professional Summary / Profile
          </label>
          <textarea
            id="summary"
            rows={3}
            value={formData.summary}
            onChange={(e) => handleFieldChange('summary', e.target.value)}
            placeholder="Brief overview of your experience, leadership background, or career goals..."
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-300 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 bg-white leading-relaxed"
          />
        </div>
      </div>

      {/* SECTION 2: EDUCATION WITH STANDARDIZED 4-DIGIT YEAR */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-stone-900 font-['Plus_Jakarta_Sans'] flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-800" />
              <span>Education History <span className="text-rose-600">*</span></span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Degrees and credentials. A standardized 4-digit graduation year is required for each entry.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddEdu(!showAddEdu)}
            className="px-3 py-1.5 text-xs font-medium text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-300 transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Education</span>
          </button>
        </div>

        {formData.education.length === 0 && !showAddEdu && (
          <div className="mt-5 p-4 border border-dashed border-amber-300 bg-amber-50/50 rounded-xl text-center">
            <p className="text-xs font-semibold text-amber-900">No education was detected on your CV</p>
            <p className="text-[11px] text-amber-700 mt-1">
              At least one education record is required. Click "Add Education" above.
            </p>
          </div>
        )}

        {/* Existing Education List */}
        <div className="mt-6 space-y-4">
          {formData.education.map((edu) => {
            const hasValidGradYear = edu.graduationYear && isValidGraduationYear(edu.graduationYear);
            return (
              <div
                key={edu.id}
                className={`p-5 rounded-xl border relative transition-all ${
                  !hasValidGradYear
                    ? 'border-amber-300 bg-amber-50/30'
                    : 'border-stone-200 bg-stone-50/40 hover:border-stone-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleRemoveEducation(edu.id)}
                  className="absolute top-4 right-4 text-stone-400 hover:text-rose-600 transition-colors p-1"
                  title="Remove education"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Degree / Credential <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => handleUpdateEducation(edu.id, 'degree', e.target.value)}
                      placeholder="e.g. Bachelor of Arts"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded border border-stone-300 focus:border-emerald-700 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Institution / University <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => handleUpdateEducation(edu.id, 'institution', e.target.value)}
                      placeholder="e.g. University of Washington"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded border border-stone-300 focus:border-emerald-700 bg-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Graduation Year (4 Digits) <span className="text-rose-600">*</span>
                      </label>
                      {!hasValidGradYear && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                          {edu.graduationYear ? 'Invalid Year' : 'Missing'}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <select
                        value={hasValidGradYear ? edu.graduationYear : ''}
                        onChange={(e) => handleUpdateEducation(edu.id, 'graduationYear', e.target.value)}
                        className={`w-full px-3 py-2 text-xs sm:text-sm rounded border font-mono ${
                          !hasValidGradYear
                            ? 'border-amber-400 bg-amber-50 focus:border-amber-600 focus:ring-1 focus:ring-amber-500 text-amber-950 font-bold'
                            : 'border-stone-300 focus:border-emerald-700 bg-white text-stone-800'
                        }`}
                      >
                        <option value="">-- Select Standard Year --</option>
                        {GRADUATION_YEAR_OPTIONS.map((yr) => (
                          <option key={yr} value={yr}>
                            {yr}
                          </option>
                        ))}
                      </select>
                    </div>
                    {!hasValidGradYear && (
                      <p className="text-[10px] text-amber-800 mt-1">
                        Please select a valid 4-digit graduation year.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Education Draft Card */}
        {showAddEdu && (
          <div className="mt-5 p-5 rounded-xl border border-emerald-300 bg-emerald-50/40">
            <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide mb-3">
              Add Education Record
            </h4>
            {draftEduError && (
              <div className="mb-3 p-2.5 bg-rose-100 border border-rose-300 text-rose-800 text-xs rounded">
                {draftEduError}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Degree (e.g. B.S. Business)"
                value={draftEdu.degree}
                onChange={(e) => setDraftEdu({ ...draftEdu, degree: e.target.value })}
                className="px-3 py-2 text-xs rounded border border-stone-300 bg-white"
              />
              <input
                type="text"
                placeholder="Institution (e.g. Oregon State University)"
                value={draftEdu.institution}
                onChange={(e) => setDraftEdu({ ...draftEdu, institution: e.target.value })}
                className="px-3 py-2 text-xs rounded border border-stone-300 bg-white"
              />
              <select
                value={draftEdu.graduationYear || ''}
                onChange={(e) => setDraftEdu({ ...draftEdu, graduationYear: e.target.value })}
                className="px-3 py-2 text-xs rounded border border-stone-300 bg-white font-mono"
              >
                <option value="">-- Select Year --</option>
                {GRADUATION_YEAR_OPTIONS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddEdu(false)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDraftEducation}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded"
              >
                Save Education
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: WORK EXPERIENCE */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-stone-900 font-['Plus_Jakarta_Sans'] flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-800" />
              <span>Work Experience</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Positions extracted from your CV. Optional section — add or edit employment records voluntarily.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddWork(!showAddWork)}
            className="px-3 py-1.5 text-xs font-medium text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-300 transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Position</span>
          </button>
        </div>

        {formData.workExperience.length === 0 && !showAddWork && (
          <div className="mt-5 p-4 border border-dashed border-stone-300 bg-stone-50 rounded-xl text-center">
            <p className="text-xs font-semibold text-stone-800">No work experience explicitly stated in CV.</p>
            <p className="text-[11px] text-stone-500 mt-1">
              Work experience is optional. You may click "Add Position" above to add employment records voluntarily.
            </p>
          </div>
        )}

        {/* Existing Work List */}
        <div className="mt-6 space-y-4">
          {formData.workExperience.map((work) => (
            <div
              key={work.id}
              className="p-5 rounded-xl border border-stone-200 bg-stone-50/40 relative group transition-all hover:border-stone-300"
            >
              <button
                type="button"
                onClick={() => handleRemoveWork(work.id)}
                className="absolute top-4 right-4 text-stone-400 hover:text-rose-600 transition-colors p-1"
                title="Remove experience"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Job Title <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={work.title}
                    onChange={(e) => handleUpdateWork(work.id, 'title', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded border border-stone-300 focus:border-emerald-700 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Company / Organization <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={work.company}
                    onChange={(e) => handleUpdateWork(work.id, 'company', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded border border-stone-300 focus:border-emerald-700 bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:col-span-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="text"
                      value={work.startDate || ''}
                      onChange={(e) => handleUpdateWork(work.id, 'startDate', e.target.value)}
                      placeholder="e.g. 2021 or Sep 2021"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded border border-stone-300 focus:border-emerald-700 bg-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-stone-700">
                        End Date
                      </label>
                      <label className="inline-flex items-center gap-1.5 text-[11px] text-stone-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(work.current || work.endDate?.toLowerCase() === 'present')}
                          onChange={(e) => {
                            const isCurrent = e.target.checked;
                            const updated = formData.workExperience.map((item) =>
                              item.id === work.id
                                ? { ...item, current: isCurrent, endDate: isCurrent ? 'Present' : '' }
                                : item
                            );
                            handleFieldChange('workExperience', updated);
                          }}
                          className="rounded border-stone-300 text-emerald-800 focus:ring-emerald-700"
                        />
                        <span>Current (Present)</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      value={work.current ? 'Present' : (work.endDate || '')}
                      disabled={Boolean(work.current)}
                      onChange={(e) => handleUpdateWork(work.id, 'endDate', e.target.value)}
                      placeholder="e.g. 2024 or Present"
                      className={`w-full px-3 py-2 text-xs sm:text-sm rounded border bg-white ${
                        work.current
                          ? 'border-emerald-300 bg-emerald-50/50 text-emerald-900 font-medium'
                          : 'border-stone-300 focus:border-emerald-700'
                      }`}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Key Responsibilities
                  </label>
                  <textarea
                    rows={3}
                    value={work.description}
                    onChange={(e) => handleUpdateWork(work.id, 'description', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded border border-stone-300 focus:border-emerald-700 bg-white leading-relaxed font-mono"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Work Draft Form */}
        {showAddWork && (
          <div className="mt-5 p-5 rounded-xl border border-emerald-300 bg-emerald-50/40">
            <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide mb-3">
              Add New Employment Position
            </h4>
            {draftWorkError && (
              <div className="mb-3 p-2.5 bg-rose-100 border border-rose-300 text-rose-800 text-xs rounded">
                {draftWorkError}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Job Title (e.g. Sales Associate)"
                value={draftWork.title}
                onChange={(e) => setDraftWork({ ...draftWork, title: e.target.value })}
                className="px-3 py-2 text-xs rounded border border-stone-300 bg-white"
              />
              <input
                type="text"
                placeholder="Company Name"
                value={draftWork.company}
                onChange={(e) => setDraftWork({ ...draftWork, company: e.target.value })}
                className="px-3 py-2 text-xs rounded border border-stone-300 bg-white"
              />
              <input
                type="text"
                placeholder="Start Date (e.g. 2021 or Sep 2021)"
                value={draftWork.startDate}
                onChange={(e) => setDraftWork({ ...draftWork, startDate: e.target.value })}
                className="px-3 py-2 text-xs rounded border border-stone-300 bg-white"
              />
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-stone-500">End Date</span>
                  <label className="inline-flex items-center gap-1.5 text-[11px] text-stone-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(draftWork.current)}
                      onChange={(e) => {
                        const isCurrent = e.target.checked;
                        setDraftWork({
                          ...draftWork,
                          current: isCurrent,
                          endDate: isCurrent ? 'Present' : '',
                        });
                      }}
                      className="rounded border-stone-300 text-emerald-800 focus:ring-emerald-700"
                    />
                    <span>Current (Present)</span>
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="End Date (e.g. 2024 or Present)"
                  value={draftWork.current ? 'Present' : draftWork.endDate}
                  disabled={Boolean(draftWork.current)}
                  onChange={(e) => setDraftWork({ ...draftWork, endDate: e.target.value })}
                  className={`px-3 py-2 text-xs rounded border bg-white ${
                    draftWork.current
                      ? 'border-emerald-300 bg-emerald-50/50 text-emerald-900 font-medium'
                      : 'border-stone-300'
                  }`}
                />
              </div>
              <textarea
                placeholder="Description of duties, customer consultations, team achievements..."
                value={draftWork.description}
                onChange={(e) => setDraftWork({ ...draftWork, description: e.target.value })}
                rows={2}
                className="sm:col-span-2 px-3 py-2 text-xs rounded border border-stone-300 bg-white"
              />
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddWork(false)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDraftWork}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded"
              >
                Save Position
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: SKILLS & COMPETENCIES (OPTIONAL) */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-stone-900 font-['Plus_Jakarta_Sans'] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-800" />
              <span>Skills & Competencies</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Extracted skills and qualifications. Add or edit skills if applicable.
            </p>
          </div>

          <form onSubmit={handleAddSkill} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add skill (e.g. Customer Service, SQL)"
              value={newSkillInput}
              onChange={(e) => setNewSkillInput(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-stone-300 focus:border-emerald-700 bg-white"
            />
            <button
              type="submit"
              disabled={!newSkillInput.trim()}
              className="px-3 py-1.5 text-xs font-medium text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>
        </div>

        {formData.skills.length === 0 ? (
          <div className="mt-5 p-4 border border-dashed border-stone-200 bg-stone-50/60 rounded-xl text-center">
            <p className="text-xs text-stone-600 font-medium">No skills explicitly stated in CV.</p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              You may optionally add skills or competencies above.
            </p>
          </div>
        ) : (
          <div className="mt-5 flex flex-wrap gap-2">
            {formData.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-100 text-stone-800 border border-stone-200/80 group hover:border-stone-400 transition-colors"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="text-stone-400 hover:text-rose-600 transition-colors ml-0.5"
                  title={`Remove ${skill}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-stone-200">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 rounded-lg shadow-xs transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Upload</span>
        </button>

        <div className="flex items-center gap-3">
          {!isFormValid && (
            <span className="text-xs text-amber-800 font-medium flex items-center gap-1 bg-amber-50 px-2.5 py-1.5 rounded border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>Please resolve highlighted required fields to continue ({validationErrors.length} remaining)</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleProceed}
            disabled={!isFormValid}
            className={`px-6 py-2.5 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 ${
              isFormValid
                ? 'bg-emerald-800 hover:bg-emerald-900 text-white cursor-pointer'
                : 'bg-stone-300 text-stone-500 cursor-not-allowed opacity-75'
            }`}
          >
            <span>Proceed to Position Selection</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
