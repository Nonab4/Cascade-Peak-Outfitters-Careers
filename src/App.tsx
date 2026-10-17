/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { StepProgressBar } from './components/StepProgressBar';
import { Step1UploadCV } from './components/steps/Step1UploadCV';
import { Step2ReviewInfo } from './components/steps/Step2ReviewInfo';
import { Step3SelectPositions } from './components/steps/Step3SelectPositions';
import { Step4FinalReview } from './components/steps/Step4FinalReview';
import { Step5Complete } from './components/steps/Step5Complete';
import { AvailableRolesModal } from './components/AvailableRolesModal';
import { PrototypeOverviewModal } from './components/PrototypeOverviewModal';
import {
  ApplicantData,
  JobPosition,
  ApplicationStep,
  ApplicationSubmission,
} from './types/application';
import { Mountain, Compass, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentStep, setCurrentStep] = useState<ApplicationStep>(1);
  const [maxUnlockedStep, setMaxUnlockedStep] = useState<ApplicationStep>(1);
  const [isOverviewModalOpen, setIsOverviewModalOpen] = useState(false);
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);

  // Applicant Data State
  const [applicantData, setApplicantData] = useState<ApplicantData | null>(null);

  // Selected Positions State
  const [selectedPositions, setSelectedPositions] = useState<JobPosition[]>([]);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submission, setSubmission] = useState<ApplicationSubmission | null>(null);

  // Handler for Step 1 -> Step 2
  const handleDataExtracted = (data: ApplicantData) => {
    setApplicantData(data);
    setCurrentStep(2);
    setMaxUnlockedStep((prev) => (prev < 2 ? 2 : prev));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler for updating applicant data in Step 2
  const handleUpdateApplicantData = (updated: ApplicantData) => {
    setApplicantData(updated);
  };

  // Handler for Step 2 -> Step 3
  const handleStep2Next = () => {
    setCurrentStep(3);
    setMaxUnlockedStep((prev) => (prev < 3 ? 3 : prev));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler for toggling selected position in Step 3
  const handleTogglePosition = (pos: JobPosition) => {
    setSelectedPositions((prev) => {
      const exists = prev.some((p) => p.id === pos.id);
      if (exists) {
        return prev.filter((p) => p.id !== pos.id);
      } else {
        return [...prev, pos];
      }
    });
  };

  // Handler for Step 3 -> Step 4
  const handleStep3Next = () => {
    if (selectedPositions.length === 0) return;
    setCurrentStep(4);
    setMaxUnlockedStep((prev) => (prev < 4 ? 4 : prev));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Quick edit navigation from Step 4
  const handleEditSection = (step: 2 | 3) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Finalize Application in Step 4 -> Step 5
  const handleFinalizeApplication = async () => {
    if (!applicantData) return;
    setIsSubmitting(true);

    // Format final standardized payload
    await new Promise((resolve) => setTimeout(resolve, 500));

    const finalSubmission: ApplicationSubmission = {
      referenceId: `CPO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      submittedAt: new Date().toISOString(),
      applicant: applicantData,
      selectedPositions,
      accuracyCertified: true,
      notes: 'Front-end prototype submission. Standardized record formatted for future ATS/database integration.',
    };

    setSubmission(finalSubmission);
    setIsSubmitting(false);
    setCurrentStep(5);
    setMaxUnlockedStep(5);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Working Reset: Start New Application
  const handleStartNewApplication = () => {
    setApplicantData(null);
    setSelectedPositions([]);
    setSubmission(null);
    setCurrentStep(1);
    setMaxUnlockedStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col font-['DM_Sans',sans-serif]">
      {/* Top Header */}
      <Header
        onOpenOverviewModal={() => setIsOverviewModalOpen(true)}
        onOpenRolesModal={() => setIsRolesModalOpen(true)}
      />

      {/* Prototype Overview Modal (Houses case background, current operational baselines, potential value, and developer data preview) */}
      <PrototypeOverviewModal
        isOpen={isOverviewModalOpen}
        onClose={() => setIsOverviewModalOpen(false)}
        currentSubmission={submission}
        applicantData={applicantData}
        selectedPositions={selectedPositions}
      />

      {/* Read-Only Available Roles Modal */}
      <AvailableRolesModal
        isOpen={isRolesModalOpen}
        onClose={() => setIsRolesModalOpen(false)}
      />

      {/* Step Progress Indicator Bar */}
      <StepProgressBar
        currentStep={currentStep}
        onNavigateStep={(step) => {
          setCurrentStep(step);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        maxUnlockedStep={maxUnlockedStep}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Step 1: Upload CV */}
        {currentStep === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8">
              <Step1UploadCV
                onDataExtracted={handleDataExtracted}
                existingData={applicantData}
                onClearExistingData={() => {
                  setApplicantData(null);
                  setSelectedPositions([]);
                  setSubmission(null);
                  setMaxUnlockedStep(1);
                }}
              />
            </div>

            {/* Side Branding & Intake Objectives Card */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                <div className="relative h-48 overflow-hidden bg-stone-900">
                  <img
                    src="/src/assets/images/hero_cascade_mountains_1792103902490.jpg"
                    alt="Cascade Mountains Pacific Northwest trail view"
                    className="w-full h-full object-cover opacity-90"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <span className="text-[10px] font-mono text-emerald-300 uppercase tracking-widest block">
                      Cascade Peak Outfitters
                    </span>
                    <span className="text-sm font-bold font-['Plus_Jakarta_Sans']">
                      Recruitment Process Modernization
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Cascade Peak Outfitters specializes in outdoor apparel and equipment. This front-end prototype explores automated data extraction to streamline hiring operations and improve candidate experience.
                  </p>

                  <div className="pt-3 border-t border-stone-100 space-y-2 text-xs text-stone-700">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-emerald-800 shrink-0" />
                      <span>~4,800 Applications Received Annually</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0" />
                      <span>No Hallucinated or Invented Information</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0" />
                      <span>Standardized Applicant Data Format</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prototype Objectives Card */}
              <div className="bg-stone-900 text-stone-200 rounded-2xl p-5 border border-stone-800">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Prototype Objectives
                </h4>
                <ul className="mt-3 space-y-2 text-xs text-stone-300">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">·</span>
                    <span>Reduce manual HR data entry</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">·</span>
                    <span>Reduce incomplete applications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">·</span>
                    <span>Shorten applicant completion times</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">·</span>
                    <span>Standardize data for future ATS readiness</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">·</span>
                    <span>Support lower overall operating costs</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Review Applicant Information */}
        {currentStep === 2 && applicantData && (
          <Step2ReviewInfo
            data={applicantData}
            onUpdateData={handleUpdateApplicantData}
            onNext={handleStep2Next}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {/* Step 3: Select Positions */}
        {currentStep === 3 && applicantData && (
          <Step3SelectPositions
            applicantData={applicantData}
            selectedPositions={selectedPositions}
            onTogglePosition={handleTogglePosition}
            onNext={handleStep3Next}
            onBack={() => setCurrentStep(2)}
          />
        )}

        {/* Step 4: Final Review */}
        {currentStep === 4 && applicantData && (
          <Step4FinalReview
            applicantData={applicantData}
            selectedPositions={selectedPositions}
            onEditSection={handleEditSection}
            onFinalize={handleFinalizeApplication}
            isSubmitting={isSubmitting}
            onBack={() => setCurrentStep(3)}
          />
        )}

        {/* Step 5: Confirmation / Complete */}
        {currentStep === 5 && submission && (
          <Step5Complete
            submission={submission}
            onReset={handleStartNewApplication}
          />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="mt-auto border-t border-stone-200 bg-white py-6 text-stone-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Mountain className="w-4 h-4 text-emerald-800" />
            <span className="font-semibold text-stone-800">Cascade Peak Outfitters</span>
            <span aria-hidden="true">·</span>
            <span>Front-End Recruitment Prototype</span>
          </div>

          <div className="flex items-center gap-6 text-[11px] text-stone-500">
            <span>Prepared for Future ATS Integration</span>
            <span className="font-mono">No Live Database Storage</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
