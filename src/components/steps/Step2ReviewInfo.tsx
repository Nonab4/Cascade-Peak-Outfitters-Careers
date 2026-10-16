import React, { useState } from 'react';
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
} from 'lucide-react';
import { ApplicantData, EducationItem, WorkExperienceItem } from '../../types/application';

interface Step2ReviewInfoProps {
  data: ApplicantData;
  onUpdateData: (updated: ApplicantData) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step2ReviewInfo: React.FC<Step2ReviewInfoProps> = ({
  data,
  onUpdateData,
  onNext,
  onBack,
}) => {
  const [formData, setFormData] = useState<ApplicantData>({ ...data });
  const [newSkillInput, setNewSkillInput] = useState('');
  const [showAddEdu, setShowAddEdu] = useState(false);
  const [showAddWork, setShowAddWork] = useState(false);

  // New Education Draft
  const [draftEdu, setDraftEdu] = useState<Partial<EducationItem>>({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    graduationYear: '',
    details: '',
  });

  // New Work Experience Draft
  const [draftWork, setDraftWork] = useState<Partial<WorkExperienceItem>>({
    company: '',
    title: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
  });

  // Real-time calculation of missing fields
  const missingFieldsList: string[] = [];
  if (!formData.fullName.trim()) missingFieldsList.push('Full Name');
  if (!formData.email.trim()) missingFieldsList.push('Email Address');
  if (!formData.phone.trim()) missingFieldsList.push('Phone Number');
  if (!formData.location.trim()) missingFieldsList.push('Location / City');
  if (formData.education.length === 0) {
    missingFieldsList.push('Education History');
  } else if (formData.education.some((e) => !e.graduationYear?.trim())) {
    missingFieldsList.push('Education Graduation Year');
  }
  if (formData.workExperience.length === 0) missingFieldsList.push('Work Experience');
  if (formData.skills.length === 0) missingFieldsList.push('Skills');

  const handleFieldChange = (field: keyof ApplicantData, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onUpdateData(updated);
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
    if (!draftEdu.institution?.trim() || !draftEdu.degree?.trim()) return;
    const newItem: EducationItem = {
      id: `edu-manual-${Date.now()}`,
      institution: draftEdu.institution.trim(),
      degree: draftEdu.degree.trim(),
      fieldOfStudy: draftEdu.fieldOfStudy?.trim() || '',
      graduationYear: draftEdu.graduationYear?.trim() || '',
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
    if (!draftWork.company?.trim() || !draftWork.title?.trim()) return;
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

  const canProceed = formData.fullName.trim().length > 0 && formData.email.trim().length > 0;

  return (
    <div className="space-y-8">
      {/* Step Header */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 tracking-wide uppercase">
              <span>Step 2 of 5</span>
              <span aria-hidden="true">·</span>
              <span>Candidate Verification</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mt-1 font-['Plus_Jakarta_Sans'] tracking-tight">
              Review Applicant Information
            </h2>
            <p className="text-stone-600 text-sm mt-1 max-w-2xl">
              We parsed the extracted fields from your CV. Please verify their accuracy and fill in any flagged missing details.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-mono">
              Source: {formData.fileName || 'Uploaded CV'}
            </span>
          </div>
        </div>

        {/* Flagged Missing Information Alert Banner */}
        {missingFieldsList.length > 0 ? (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-300 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                    Missing Information Flagged ({missingFieldsList.length})
                  </h4>
                  <span className="text-[11px] text-amber-800 font-medium">
                    · Not found in uploaded CV
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  To ensure complete HR processing and eliminate manual recruiter follow-up, please fill in the following highlighted fields:
                </p>
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {missingFieldsList.map((field) => (
                    <span
                      key={field}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs"
                    >
                      <AlertCircle className="w-3 h-3 text-amber-700" />
                      <span>{field}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <p className="text-xs font-medium text-emerald-900">
              All essential candidate contact, background, and skill details are present and verified.
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
          Used by hiring managers and store operations for recruitment correspondence.
        </p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Full Name */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="fullName" className="block text-xs font-semibold text-stone-800 mb-1">
                Full Legal Name <span className="text-rose-600">*</span>
              </label>
              {!formData.fullName.trim() && (
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
                !formData.fullName.trim()
                  ? 'border-amber-400 bg-amber-50/40 focus:ring-amber-500'
                  : 'border-stone-300 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 bg-white'
              }`}
            />
          </div>

          {/* Email */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="email" className="block text-xs font-semibold text-stone-800 mb-1">
                Email Address <span className="text-rose-600">*</span>
              </label>
              {!formData.email.trim() && (
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">
                  Required
                </span>
              )}
            </div>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              placeholder="e.g. jordan.vance@example.com"
              className={`w-full px-3.5 py-2.5 text-sm rounded-lg border transition-all ${
                !formData.email.trim()
                  ? 'border-amber-400 bg-amber-50/40 focus:ring-amber-500'
                  : 'border-stone-300 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 bg-white'
              }`}
            />
          </div>

          {/* Phone */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="phone" className="block text-xs font-semibold text-stone-800 mb-1">
                Phone Number
              </label>
              {!formData.phone.trim() && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Missing from CV
                </span>
              )}
            </div>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleFieldChange('phone', e.target.value)}
              placeholder="e.g. (206) 555-0184"
              className={`w-full px-3.5 py-2.5 text-sm rounded-lg border transition-all ${
                !formData.phone.trim()
                  ? 'border-amber-400 bg-amber-50/30 focus:border-amber-600 focus:ring-1 focus:ring-amber-500'
                  : 'border-stone-300 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 bg-white'
              }`}
            />
            {!formData.phone.trim() && (
              <p className="text-[11px] text-amber-700 mt-1">
                Please enter a phone number so our hiring team can reach you.
              </p>
            )}
          </div>

          {/* Location */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="location" className="block text-xs font-semibold text-stone-800 mb-1">
                Location (City, State / Region)
              </label>
              {!formData.location.trim() && (
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
              placeholder="e.g. Seattle, WA or Bend, OR"
              className={`w-full px-3.5 py-2.5 text-sm rounded-lg border transition-all ${
                !formData.location.trim()
                  ? 'border-amber-400 bg-amber-50/30 focus:border-amber-600 focus:ring-1 focus:ring-amber-500'
                  : 'border-stone-300 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 bg-white'
              }`}
            />
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
            placeholder="Brief overview of your outdoor equipment experience, leadership background, or career goals..."
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-300 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 bg-white leading-relaxed"
          />
        </div>
      </div>

      {/* SECTION 2: WORK EXPERIENCE */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-stone-900 font-['Plus_Jakarta_Sans'] flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-800" />
              <span>Work Experience</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Positions extracted from your CV. Edit details or add additional roles.
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
          <div className="mt-5 p-4 border border-dashed border-amber-300 bg-amber-50/50 rounded-xl text-center">
            <p className="text-xs font-semibold text-amber-900">No work experience was detected on your CV</p>
            <p className="text-[11px] text-amber-700 mt-1">
              Click "Add Position" above to add your employment or guide experience.
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
                    Job Title
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
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    value={work.company}
                    onChange={(e) => handleUpdateWork(work.id, 'company', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded border border-stone-300 focus:border-emerald-700 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Dates / Duration
                  </label>
                  <input
                    type="text"
                    value={work.startDate ? `${work.startDate} - ${work.endDate || 'Present'}` : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleUpdateWork(work.id, 'startDate', val);
                    }}
                    placeholder="e.g. Sep 2022 - Present"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded border border-stone-300 focus:border-emerald-700 bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Key Achievements & Responsibilities
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

        {/* Add Work Form Modal/Card */}
        {showAddWork && (
          <div className="mt-5 p-5 rounded-xl border border-emerald-300 bg-emerald-50/40">
            <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide mb-3">
              Add New Employment Experience
            </h4>
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
                placeholder="Company Name (e.g. Cascade Gear)"
                value={draftWork.company}
                onChange={(e) => setDraftWork({ ...draftWork, company: e.target.value })}
                className="px-3 py-2 text-xs rounded border border-stone-300 bg-white"
              />
              <input
                type="text"
                placeholder="Start Date (e.g. 2021)"
                value={draftWork.startDate}
                onChange={(e) => setDraftWork({ ...draftWork, startDate: e.target.value })}
                className="px-3 py-2 text-xs rounded border border-stone-300 bg-white"
              />
              <input
                type="text"
                placeholder="End Date (e.g. Present)"
                value={draftWork.endDate}
                onChange={(e) => setDraftWork({ ...draftWork, endDate: e.target.value })}
                className="px-3 py-2 text-xs rounded border border-stone-300 bg-white"
              />
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
                Save Experience
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: EDUCATION */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-stone-900 font-['Plus_Jakarta_Sans'] flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-800" />
              <span>Education</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Degrees, certificates, or university credentials.
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

        {/* Existing Education List */}
        <div className="mt-6 space-y-4">
          {formData.education.map((edu) => {
            const isGradYearMissing = !edu.graduationYear?.trim();
            return (
              <div
                key={edu.id}
                className={`p-5 rounded-xl border relative transition-all ${
                  isGradYearMissing
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
                      Degree / Credential
                    </label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => handleUpdateEducation(edu.id, 'degree', e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded border border-stone-300 focus:border-emerald-700 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Institution / University
                    </label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => handleUpdateEducation(edu.id, 'institution', e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded border border-stone-300 focus:border-emerald-700 bg-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Graduation Year
                      </label>
                      {isGradYearMissing && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                          Missing in CV
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. 2022"
                      value={edu.graduationYear || ''}
                      onChange={(e) => handleUpdateEducation(edu.id, 'graduationYear', e.target.value)}
                      className={`w-full px-3 py-2 text-xs sm:text-sm rounded border font-mono ${
                        isGradYearMissing
                          ? 'border-amber-400 bg-amber-50 focus:border-amber-600 focus:ring-1 focus:ring-amber-500'
                          : 'border-stone-300 focus:border-emerald-700 bg-white'
                      }`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Education Draft */}
        {showAddEdu && (
          <div className="mt-5 p-5 rounded-xl border border-emerald-300 bg-emerald-50/40">
            <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide mb-3">
              Add Education Credential
            </h4>
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
                placeholder="Institution (e.g. Oregon State)"
                value={draftEdu.institution}
                onChange={(e) => setDraftEdu({ ...draftEdu, institution: e.target.value })}
                className="px-3 py-2 text-xs rounded border border-stone-300 bg-white"
              />
              <input
                type="text"
                placeholder="Graduation Year (e.g. 2023)"
                value={draftEdu.graduationYear}
                onChange={(e) => setDraftEdu({ ...draftEdu, graduationYear: e.target.value })}
                className="px-3 py-2 text-xs rounded border border-stone-300 bg-white font-mono"
              />
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

      {/* SECTION 4: SKILLS & CERTIFICATIONS */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-stone-900 font-['Plus_Jakarta_Sans'] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-800" />
              <span>Extracted Skills & Competencies</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              These skills will be matched against position requirements in Step 3.
            </p>
          </div>

          <form onSubmit={handleAddSkill} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add skill (e.g. SQL, POS)"
              value={newSkillInput}
              onChange={(e) => setNewSkillInput(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-stone-300 focus:border-emerald-700 bg-white"
            />
            <button
              type="submit"
              disabled={!newSkillInput.trim()}
              className="px-3 py-1.5 text-xs font-medium text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>
        </div>

        {formData.skills.length === 0 ? (
          <div className="mt-5 p-4 border border-dashed border-amber-300 bg-amber-50/50 rounded-xl text-center">
            <p className="text-xs font-semibold text-amber-900">No skills explicitly stated in CV</p>
            <p className="text-[11px] text-amber-700 mt-1">
              Add relevant skills like Customer Service, POS, SQL, or Logistics above.
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

      {/* Navigation Buttons */}
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
          {!canProceed && (
            <span className="text-xs text-rose-600 font-medium flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              <span>Name and email are required</span>
            </span>
          )}

          <button
            type="button"
            onClick={onNext}
            disabled={!canProceed}
            className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Proceed to Position Selection</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
