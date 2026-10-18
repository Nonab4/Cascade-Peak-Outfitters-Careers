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
  Edit3,
} from 'lucide-react';
import { ApplicantData } from '../../types/application';
import { SAMPLE_RESUMES, SampleResume } from '../../data/sampleResumes';
import { parseResumeWithAI, resolveExtractionEndpoint } from '../../utils/resumeParser';

interface Step1UploadCVProps {
  onDataExtracted: (data: ApplicantData) => void;
  existingData: ApplicantData | null;
  onClearExistingData?: () => void;
}

export const Step1UploadCV: React.FC<Step1UploadCVProps> = ({
  onDataExtracted,
  existingData,
  onClearExistingData,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'samples'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState(existingData?.rawText || '');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState<string>('');
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [isInvalidDoc, setIsInvalidDoc] = useState(false);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [isStaleFile, setIsStaleFile] = useState(false);
  const [isRoutingError, setIsRoutingError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const extractionInProgressRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cachedFilePayloadRef = useRef<{
    fileName: string;
    fileSize: number;
    mimeType: string;
    base64Data: string;
    plainText: string;
  } | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isExtracting) return;
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
    if (isExtracting) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isExtracting) return;
    if (e.target.files && e.target.files[0]) {
      handleSelectedFile(e.target.files[0]);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const result = reader.result as string;
            // strip data:*/*;base64, prefix
            const base64 = result.includes(',') ? result.split(',')[1] : result;
            resolve(base64);
          } catch (err: any) {
            console.error('[Step1UploadCV] Error processing FileReader buffer:', err);
            reject(new Error('The selected file could not be read by the browser. Please choose the file again.'));
          }
        };
        reader.onerror = () => {
          const detailedError = reader.error?.message || 'FileReader read error';
          console.warn('[Step1UploadCV] Browser file read failed:', detailedError);
          reject(new Error('The selected file could not be read by the browser. Please choose the file again.'));
        };
        reader.onabort = () => {
          console.warn('[Step1UploadCV] Browser file read was aborted');
          reject(new Error('The selected file read was aborted. Please choose the file again.'));
        };
        reader.readAsDataURL(file);
      } catch (syncErr: any) {
        console.warn('[Step1UploadCV] Exception starting FileReader:', syncErr?.message || syncErr);
        reject(new Error('The selected file could not be read by the browser. Please choose the file again.'));
      }
    });
  };

  const handleChooseDifferentFile = () => {
    cachedFilePayloadRef.current = null;
    setIsStaleFile(false);
    setUploadedFile(null);
    setRawText('');
    setSelectedSampleId(null);
    setExtractionError(null);
    setIsInvalidDoc(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleEnterManually = () => {
    const fallbackFileName =
      uploadedFile?.name ||
      (activeTab === 'paste'
        ? 'pasted_resume.txt'
        : selectedSampleId
        ? `${selectedSampleId}_resume.txt`
        : 'Uploaded Document');

    const blankData: ApplicantData = {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      summary: '',
      education: [],
      workExperience: [],
      skills: [],
      missingFields: [
        'Full Name',
        'Email Address',
        'Phone Number',
        'Location',
        'Education History',
      ],
      rawText: rawText || '',
      fileName: fallbackFileName,
      fileSize: uploadedFile?.size,
      extractedAt: new Date().toISOString(),
      extractionConfidenceNotes: 'Manual applicant entry. Fill in required fields to proceed.',
    };
    onDataExtracted(blankData);
  };

  const handleRetryExtraction = async () => {
    if (isExtracting) return;

    // If previous attempt failed with a routing error, verify that backend is healthy before retrying
    if (isRoutingError) {
      setExtractionProgress('Verifying backend connectivity…');
      setIsExtracting(true);
      const healthyEndpoint = await resolveExtractionEndpoint();
      setIsExtracting(false);
      setExtractionProgress('');
      if (!healthyEndpoint) {
        setExtractionError('The application backend is temporarily unavailable in the preview environment. Please refresh the preview and try again.');
        return;
      }
      setIsRoutingError(false);
      setExtractionError(null);
    }

    if (uploadedFile) {
      handleSelectedFile(uploadedFile, true);
    } else if (activeTab === 'paste' && rawText.trim()) {
      handlePasteExtract();
    } else if (selectedSampleId) {
      const sample = SAMPLE_RESUMES.find((s) => s.id === selectedSampleId);
      if (sample) handleSampleSelect(sample);
    }
  };

  const handleSelectedFile = async (file: File, isRetry: boolean = false) => {
    if (extractionInProgressRef.current) {
      console.warn('[Step1UploadCV] Extraction already in flight, ignoring duplicate request.');
      return;
    }

    // Cancel any prior in-flight request if user replaces document
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    extractionInProgressRef.current = true;

    // 1. Clear previous applicant state ONLY when replacing with a genuinely new document
    if (!isRetry) {
      onClearExistingData?.();
      setSelectedSampleId(null);
      // Clear cache if this is a newly selected file (different name or size)
      if (
        cachedFilePayloadRef.current &&
        (cachedFilePayloadRef.current.fileName !== file.name ||
          cachedFilePayloadRef.current.fileSize !== file.size)
      ) {
        cachedFilePayloadRef.current = null;
      }
    }

    setUploadedFile(file);
    setExtractionError(null);
    setIsInvalidDoc(false);
    setIsStaleFile(false);

    // 2. Validate file type: Only PDF, DOCX, and TXT are supported (no legacy .doc)
    const lowerName = file.name.toLowerCase();
    const isSupportedType =
      file.type === 'application/pdf' ||
      lowerName.endsWith('.pdf') ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      lowerName.endsWith('.docx') ||
      file.type === 'text/plain' ||
      lowerName.endsWith('.txt');

    if (!isSupportedType) {
      extractionInProgressRef.current = false;
      setIsExtracting(false);
      setIsInvalidDoc(false);
      setIsStaleFile(false);
      setExtractionError('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
      return;
    }

    // 3. Enforce 15 MB upload limit before starting extraction
    const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
    if (file.size > MAX_FILE_SIZE_BYTES) {
      extractionInProgressRef.current = false;
      setIsExtracting(false);
      setIsInvalidDoc(false);
      setIsStaleFile(false);
      setExtractionError('This file is larger than the 15 MB upload limit. Please choose a smaller file.');
      return;
    }

    setIsExtracting(true);

    try {
      let base64Data = '';
      let plainText = '';
      const mimeType = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');

      // Check if we have an in-memory cached payload for this exact file (useful on retry)
      if (
        cachedFilePayloadRef.current &&
        cachedFilePayloadRef.current.fileName === file.name &&
        cachedFilePayloadRef.current.fileSize === file.size
      ) {
        console.log(`[Step1UploadCV] Using cached file payload for retry (${file.name}, ${file.size} bytes).`);
        base64Data = cachedFilePayloadRef.current.base64Data;
        plainText = cachedFilePayloadRef.current.plainText;
        if (plainText) {
          setRawText(plainText);
        }
      } else {
        // Read the file for the first time
        console.log(`[Step1UploadCV] File read started for "${file.name}" (${file.size} bytes)...`);
        setExtractionProgress('Reading document buffer...');

        try {
          base64Data = await readFileAsBase64(file);
          if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
            plainText = await file.text();
            setRawText(plainText);
          }
        } catch (readErr: any) {
          console.warn('[Step1UploadCV] Browser file read failed:', readErr?.message || readErr);
          cachedFilePayloadRef.current = null;
          setIsStaleFile(true);
          setIsInvalidDoc(false);
          setExtractionError('The browser can no longer access this uploaded file. Please choose the file again to continue.');
          return;
        }

        // Cache the successfully read payload in memory
        cachedFilePayloadRef.current = {
          fileName: file.name,
          fileSize: file.size,
          mimeType,
          base64Data,
          plainText,
        };
        console.log(`[Step1UploadCV] File read completed and payload cached (${file.name}).`);
      }

      console.log(`[Step1UploadCV] Sending extraction request to /api/extract-resume...`);
      setExtractionProgress('Extracting candidate details with AI...');
      const result = await parseResumeWithAI({
        fileBase64: base64Data,
        mimeType,
        fileName: file.name,
        fileSize: file.size,
        resumeText: plainText,
        onStatusUpdate: (msg) => setExtractionProgress(msg),
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        return;
      }

      if (!result.success) {
        if (result.isRoutingFailure) {
          setIsRoutingError(true);
          setIsInvalidDoc(false);
          setIsStaleFile(false);
          setExtractionError(result.message);
        } else if (result.isInvalidDocumentType) {
          setIsInvalidDoc(true);
          setIsStaleFile(false);
          setIsRoutingError(false);
          setExtractionError(result.message);
        } else {
          // Recoverable temporary outage: keep uploaded file and cached payload loaded, do not throw
          setIsInvalidDoc(false);
          setIsStaleFile(false);
          setIsRoutingError(false);
          setExtractionError(result.message);
        }
        return;
      }

      setExtractionProgress('Validating fields and flagging missing data...');
      await new Promise((r) => setTimeout(r, 350));

      if (!controller.signal.aborted) {
        onDataExtracted(result.data);
      }
    } catch (err: any) {
      if (controller.signal.aborted) {
        return;
      }
      // Unexpected programming errors should still be logged normally for development troubleshooting
      console.error('Unexpected error during file extraction:', err);
      setIsInvalidDoc(false);
      setIsStaleFile(false);
      setExtractionError(
        "We couldn't process this document because of an unexpected extraction error. Your file is still loaded. Please retry or enter your information manually."
      );
    } finally {
      extractionInProgressRef.current = false;
      setIsExtracting(false);
      setExtractionProgress('');
    }
  };

  const handleSampleSelect = async (sample: SampleResume) => {
    if (isExtracting) return;
    onClearExistingData?.();
    setSelectedSampleId(sample.id);
    setRawText(sample.rawText);
    const fileName = `${sample.applicantName.toLowerCase().replace(/\s+/g, '_')}_cv.txt`;
    setUploadedFile(
      new File([sample.rawText], fileName, {
        type: 'text/plain',
      })
    );

    setIsExtracting(true);
    setExtractionError(null);
    setExtractionProgress('Loading sample candidate record...');

    try {
      // Load sample directly from known structured data without calling Gemini extraction endpoint
      await new Promise((r) => setTimeout(r, 200));
      const sampleData: ApplicantData = {
        ...sample.structuredData,
        rawText: sample.rawText,
        fileName,
        extractedAt: new Date().toISOString(),
      };
      onDataExtracted(sampleData);
    } catch (err: any) {
      console.error('Sample loading error:', err);
    } finally {
      setIsExtracting(false);
      setExtractionProgress('');
    }
  };

  const handlePasteExtract = async () => {
    if (extractionInProgressRef.current) return;
    if (!rawText.trim()) {
      setExtractionError('Please paste resume text before extracting.');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    extractionInProgressRef.current = true;

    onClearExistingData?.();
    setIsExtracting(true);
    setExtractionError(null);
    setIsInvalidDoc(false);
    setExtractionProgress('Extracting candidate details with AI...');

    try {
      const result = await parseResumeWithAI({
        resumeText: rawText,
        fileName: 'pasted_resume.txt',
        fileSize: rawText.length,
        onStatusUpdate: (msg) => setExtractionProgress(msg),
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        return;
      }

      if (!result.success) {
        if (result.isRoutingFailure) {
          setIsRoutingError(true);
          setIsInvalidDoc(false);
          setExtractionError(result.message);
        } else if (result.isInvalidDocumentType) {
          setIsInvalidDoc(true);
          setIsRoutingError(false);
          setExtractionError(result.message);
        } else {
          // Recoverable temporary outage: do not throw or log console.error
          setIsInvalidDoc(false);
          setIsRoutingError(false);
          setExtractionError(result.message);
        }
        return;
      }

      if (!controller.signal.aborted) {
        onDataExtracted(result.data);
      }
    } catch (err: any) {
      if (controller.signal.aborted) {
        return;
      }
      // Unexpected programming errors should still be logged normally for development troubleshooting
      console.error('Unexpected error during paste extraction:', err);
      setIsInvalidDoc(false);
      setExtractionError(
        "We couldn't process this document because of an unexpected extraction error. Your file is still loaded. Please retry or enter your information manually."
      );
    } finally {
      extractionInProgressRef.current = false;
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
            <span>Intake Prototype</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mt-1 font-['Plus_Jakarta_Sans'] tracking-tight">
            Upload Your Resume or CV
          </h2>
          <p className="text-stone-600 text-sm sm:text-base mt-2 leading-relaxed">
            Cascade Peak Outfitters received approximately 4,800 applications last year. This prototype is designed to reduce manual data entry and applicant drop-off by automatically extracting your contact information, work history, education, and skills.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-stone-500 pt-3 border-t border-stone-100">
            <div className="flex items-center gap-1.5 text-stone-700">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Missing information is left blank for applicant review</span>
            </div>
            <div className="flex items-center gap-1.5 text-stone-700">
              <Zap className="w-4 h-4 text-emerald-700" />
              <span>Native PDF and Word (DOCX) reading</span>
            </div>
            <div className="flex items-center gap-1.5 text-stone-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>AI-extracted details are reviewed and corrected by applicant</span>
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
              <span>Upload Document (PDF / DOCX)</span>
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
              <span>Sample Resumes (Quick Test)</span>
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
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
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
                Accepts real PDF documents, DOCX Word files, and plain text (up to 15MB)
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

                {!extractionError && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectedFile(uploadedFile);
                    }}
                    disabled={isExtracting}
                    className="px-3 py-1.5 text-xs font-medium text-emerald-900 bg-emerald-200/80 hover:bg-emerald-300 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isExtracting ? 'animate-spin' : ''}`} />
                    <span>Retry AI Extraction</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SAMPLE RESUMES */}
        {activeTab === 'samples' && (
          <div className="mt-6 space-y-4">
            <div className="p-3 bg-stone-100/80 rounded-lg text-xs text-stone-700">
              Select one of these realistic resumes to immediately test the recruitment intake workflow using prepared structured sample data without relying on live AI extraction.
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
                      <span>Load Sample</span>
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
                Paste resume text below:
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
                onClick={handlePasteExtract}
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
                {extractionProgress || 'Extracting applicant information with AI...'}
              </p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Parsing structured fields without inventing missing details.
              </p>
            </div>
          </div>
        )}

        {/* Extraction error banner */}
        {extractionError && (
          <div className="mt-6 p-5 bg-amber-50 border border-amber-300 rounded-xl space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                  Extraction Notice
                </p>
                <p className="text-xs text-amber-900 mt-1 font-medium leading-relaxed">
                  {extractionError}
                </p>
                {uploadedFile && (
                  <p className="text-[11px] text-amber-800 mt-1">
                    {isInvalidDoc
                      ? <>Uploaded file: <span className="font-semibold">{uploadedFile.name}</span></>
                      : <>Your uploaded document (<span className="font-semibold">{uploadedFile.name}</span>) remains loaded and has not been cleared.</>}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-amber-200/80">
              {isInvalidDoc || isStaleFile ? (
                <>
                  <button
                    type="button"
                    onClick={handleChooseDifferentFile}
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{isStaleFile ? 'Choose File Again' : 'Choose Different File'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleEnterManually}
                    className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-stone-600" />
                    <span>Enter Information Manually</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleRetryExtraction}
                    disabled={isExtracting}
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isExtracting ? 'animate-spin' : ''}`} />
                    <span>Retry AI Extraction</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleEnterManually}
                    className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-stone-600" />
                    <span>Enter Information Manually</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Alternative direct manual entry link - hidden when Extraction Notice is active */}
        {!extractionError && (
          <div className="mt-8 pt-4 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-500">
            <span>Prefer to fill out your application by hand?</span>
            <button
              type="button"
              onClick={handleEnterManually}
              className="text-emerald-800 hover:text-emerald-950 font-semibold underline underline-offset-2 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Enter Information Manually</span>
            </button>
          </div>
        )}
      </div>

      {/* Currently loaded data banner if applicant already parsed */}
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
