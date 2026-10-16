import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  FileCode,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { ApplicantData } from '../../types/application';
import { SAMPLE_RESUMES, SampleResume } from '../../data/sampleResumes';
import { parseResumeWithAI } from '../../utils/resumeParser';

interface Step1UploadCVProps {
  onDataExtracted: (data: ApplicantData) => void;
  existingData: ApplicantData | null;
}

export const Step1UploadCV: React.FC<Step1UploadCVProps> = ({
  onDataExtracted,
  existingData,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'samples'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState(existingData?.rawText || '');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState<string>('');
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleSelectedFile(e.target.files[0]);
    }
  };

  const handleSelectedFile = async (file: File) => {
    setUploadedFile(file);
    setExtractionError(null);

    // Read file contents
    try {
      let textContent = '';
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        textContent = await file.text();
      } else {
        // For PDF/DOCX or binary, read text if plain, or extract basic textual representation
        textContent = await readFileAsTextFallback(file);
      }

      setRawText(textContent);
      await runExtraction(textContent, file.name, file.size);
    } catch (err: any) {
      console.error('File read error:', err);
      setExtractionError('Could not read the uploaded document. Please upload a .txt, .pdf, or paste text.');
    }
  };

  const readFileAsTextFallback = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          // Clean out binary control characters if any
          const sanitized = result.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
          resolve(sanitized.slice(0, 12000));
        } else {
          resolve(`Resume content from ${file.name}`);
        }
      };
      reader.onerror = () => resolve(`Resume content from ${file.name}`);
      reader.readAsText(file);
    });
  };

  const handleSampleSelect = async (sample: SampleResume) => {
    setSelectedSampleId(sample.id);
    setRawText(sample.rawText);
    setUploadedFile(new File([sample.rawText], `${sample.applicantName.toLowerCase().replace(/\s+/g, '_')}_cv.txt`, { type: 'text/plain' }));
    await runExtraction(sample.rawText, `${sample.applicantName}_resume.txt`, sample.rawText.length);
  };

  const runExtraction = async (textToExtract: string, fileName: string, fileSize?: number) => {
    if (!textToExtract.trim()) {
      setExtractionError('Please provide resume text or upload a document.');
      return;
    }

    setIsExtracting(true);
    setExtractionError(null);
    setExtractionProgress('Reading document structure...');

    try {
      setExtractionProgress('Extracting candidate details with AI...');
      const result = await parseResumeWithAI(textToExtract, fileName, fileSize);

      setExtractionProgress('Validating fields and flagging missing data...');
      await new Promise((r) => setTimeout(r, 450));

      onDataExtracted(result.data);
    } catch (err: any) {
      console.error('Extraction failed:', err);
      setExtractionError('Extraction encountered an error. Please try again.');
    } finally {
      setIsExtracting(false);
      setExtractionProgress('');
    }
  };

  return (
    <div className="space-y-8">
      {/* Introduction Card */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-6 sm:p-8">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 tracking-wide uppercase">
            <span>Step 1 of 5</span>
            <span aria-hidden="true">·</span>
            <span>Automated Intake</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mt-1 font-['Plus_Jakarta_Sans'] tracking-tight">
            Upload Your Resume or CV
          </h2>
          <p className="text-stone-600 text-sm sm:text-base mt-2 leading-relaxed">
            Cascade Peak Outfitters uses intelligent resume parsing to save you time. Our system extracts your contact information, work history, education, and skills into your application dossier.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-stone-500 pt-3 border-t border-stone-100">
            <div className="flex items-center gap-1.5 text-stone-700">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Strict Data Integrity: No invented information</span>
            </div>
            <div className="flex items-center gap-1.5 text-stone-700">
              <Zap className="w-4 h-4 text-emerald-700" />
              <span>Instant extraction in &lt; 2 seconds</span>
            </div>
            <div className="flex items-center gap-1.5 text-stone-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Editable in Step 2</span>
            </div>
          </div>
        </div>

        {/* Method Switcher Tabs */}
        <div className="mt-8 border-b border-stone-200">
          <div className="flex items-center gap-2 -mb-px">
            <button
              onClick={() => setActiveTab('upload')}
              className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'upload'
                  ? 'border-emerald-800 text-emerald-900 font-semibold'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
            <button
              onClick={() => setActiveTab('samples')}
              className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'samples'
                  ? 'border-emerald-800 text-emerald-900 font-semibold'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Try Sample CVs (1-Click Test)</span>
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'paste'
                  ? 'border-emerald-800 text-emerald-900 font-semibold'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Paste Resume Text</span>
            </button>
          </div>
        </div>

        {/* TAB 1: FILE UPLOAD */}
        {activeTab === 'upload' && (
          <div className="mt-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.doc,text/plain"
              className="hidden"
              onChange={handleFileInputChange}
            />

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
                dragActive
                  ? 'border-emerald-700 bg-emerald-50/70 scale-[0.99]'
                  : 'border-stone-300 hover:border-emerald-700 hover:bg-stone-50/70 bg-stone-50/30'
              }`}
            >
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center mb-4">
                <UploadCloud className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold text-stone-900">
                Drag and drop your CV or resume here
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                Supports PDF, DOCX, and TXT files (up to 10MB)
              </p>
              <div className="mt-5">
                <button
                  type="button"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors"
                >
                  Browse Files
                </button>
              </div>
            </div>

            {uploadedFile && (
              <div className="mt-4 p-4 bg-emerald-50/80 border border-emerald-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded text-emerald-800">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-900">{uploadedFile.name}</p>
                    <p className="text-[11px] text-stone-500 font-mono">
                      {(uploadedFile.size / 1024).toFixed(1)} KB · Document Loaded
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    runExtraction(rawText, uploadedFile.name, uploadedFile.size);
                  }}
                  disabled={isExtracting}
                  className="px-3 py-1.5 text-xs font-medium text-emerald-900 bg-emerald-200/80 hover:bg-emerald-300 rounded flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isExtracting ? 'animate-spin' : ''}`} />
                  <span>Re-extract</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SAMPLE RESUMES */}
        {activeTab === 'samples' && (
          <div className="mt-6 space-y-4">
            <div className="p-3 bg-stone-100/80 rounded-lg text-xs text-stone-700">
              Select one of these realistic resumes to immediately test the recruitment parser without having to locate a file on your device.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SAMPLE_RESUMES.map((sample) => {
                const isSelected = selectedSampleId === sample.id;
                return (
                  <div
                    key={sample.id}
                    onClick={() => handleSampleSelect(sample)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-800 bg-emerald-50/60 ring-2 ring-emerald-700/30 shadow-xs'
                        : 'border-stone-200 bg-white hover:border-emerald-600 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center font-bold text-xs text-stone-700">
                        {sample.applicantName.split(' ').map((n) => n[0]).join('')}
                      </div>
                      {sample.hasMissingInfo && (
                        <span className="text-[10px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Missing Info Test
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-stone-900 mt-2">
                      {sample.applicantName}
                    </h4>
                    <p className="text-xs text-emerald-800 font-medium">
                      {sample.targetRolePreview}
                    </p>
                    <p className="text-[11px] text-stone-500 mt-1 leading-snug">
                      {sample.tagline}
                    </p>

                    {sample.hasMissingInfo && (
                      <p className="text-[10px] text-amber-700 mt-2 bg-amber-50/80 p-1.5 rounded border border-amber-200/60 leading-tight">
                        {sample.missingNote}
                      </p>
                    )}

                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-emerald-800">
                      <span>Click to Parse</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: PASTE TEXT */}
        {activeTab === 'paste' && (
          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="resume-textarea" className="block text-xs font-semibold text-stone-700 mb-1">
                Paste your resume text below:
              </label>
              <textarea
                id="resume-textarea"
                rows={10}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste full resume text here (Name, email, phone, work history, education, skills)..."
                className="w-full text-xs sm:text-sm font-mono p-3.5 rounded-lg border border-stone-300 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 bg-stone-50"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => runExtraction(rawText, 'pasted_resume.txt', rawText.length)}
                disabled={!rawText.trim() || isExtracting}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>Extract Information</span>
              </button>
            </div>
          </div>
        )}

        {/* Extraction status spinner overlay */}
        {isExtracting && (
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-4 animate-pulse">
            <RefreshCw className="w-5 h-5 text-emerald-800 animate-spin" />
            <div className="flex-1">
              <p className="text-xs font-bold text-emerald-900">
                {extractionProgress || 'Extracting applicant information with Gemini AI...'}
              </p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Parsing structured fields without inventing missing details.
              </p>
            </div>
          </div>
        )}

        {/* Extraction error banner */}
        {extractionError && (
          <div className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-rose-900">Extraction Notice</p>
              <p className="text-xs text-rose-700 mt-0.5">{extractionError}</p>
            </div>
          </div>
        )}
      </div>

      {/* If data has already been parsed and user navigates back to Step 1 */}
      {existingData && existingData.fullName && (
        <div className="bg-stone-50 rounded-xl border border-stone-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-xs text-stone-500 font-medium">Currently Loaded Applicant</p>
              <p className="text-sm font-bold text-stone-900">
                {existingData.fullName} · {existingData.email || 'No email provided'}
              </p>
              <p className="text-[11px] text-stone-500">
                {existingData.skills.length} skills · {existingData.workExperience.length} positions · {existingData.education.length} education
              </p>
            </div>
          </div>

          <button
            onClick={() => onDataExtracted(existingData)}
            className="px-4 py-2 text-xs font-semibold text-emerald-900 bg-white border border-emerald-700/40 hover:bg-emerald-50 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Continue to Review</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
