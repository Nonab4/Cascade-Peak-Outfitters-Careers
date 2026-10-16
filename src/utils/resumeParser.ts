import { ApplicantData, EducationItem, WorkExperienceItem } from '../types/application';

export interface ParseResumeOptions {
  resumeText?: string;
  fileBase64?: string;
  mimeType?: string;
  fileName?: string;
  fileSize?: number;
  onStatusUpdate?: (status: string) => void;
}

// Standardization & validation helpers
export function standardizePhoneNumber(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return input;
}

export function isValidPhoneNumber(input: string): boolean {
  const digits = input.replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
}

export function isValidEmailAddress(input: string): boolean {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(input.trim());
}

export function isValidGraduationYear(year: string): boolean {
  const y = parseInt(year.trim(), 10);
  return !isNaN(y) && /^\d{4}$/.test(year.trim()) && y >= 1960 && y <= 2035;
}

export function isLikelyUnrelatedDocument(text: string): boolean {
  if (!text || text.trim().length < 50) return false;

  // Academic paper / essay / report signals
  const hasAcademicSignals =
    /\b(abstract|methodology|literature review|references|bibliography|doi:|works cited|peer reviewed|in conclusion|submitted to the faculty of|course syllabus|research questions?)\b/i.test(
      text
    );

  // Invoice / receipt / billing signals
  const hasInvoiceSignals =
    /\b(invoice\s*#|bill\s*to:|remit\s*payment|total\s*due:|unit\s*price|subtotal\s*[$€£]|net\s*30\s*days|payment\s*terms|invoice date)\b/i.test(
      text
    );

  // Class assignment / homework signals
  const hasAssignmentSignals =
    /\b(assignment\s*#|homework\s*#|essay\s*prompt|grading\s*rubric|course\s*syllabus|problem\s*set)\b/i.test(
      text
    );

  // Resume / CV content signals:
  // (contact information, education, work or volunteer experience, skills, qualifications, professional summary, employment history)
  const hasResumeSignals =
    /\b(work experience|employment history|professional experience|career history|education|bachelor|master|degree|skills|curriculum vitae|resume|certifications|responsibilities|job title|volunteer experience)\b/i.test(
      text
    );

  if ((hasAcademicSignals || hasInvoiceSignals || hasAssignmentSignals) && !hasResumeSignals) {
    return true;
  }

  return false;
}

export type ParseResumeResult =
  | { success: true; data: ApplicantData; usedAI: boolean; notes?: string }
  | { success: false; temporaryUnavailable: true; message: string; isInvalidDocumentType?: false; unexpectedError?: false }
  | { success: false; isInvalidDocumentType: true; message: string; temporaryUnavailable?: false; unexpectedError?: false }
  | { success: false; unexpectedError: true; message: string; temporaryUnavailable: false; isInvalidDocumentType?: false };

export async function parseResumeWithAI(
  options: ParseResumeOptions
): Promise<ParseResumeResult> {
  const { resumeText = '', fileBase64, mimeType, fileName = 'resume.txt', fileSize, onStatusUpdate } = options;

  if (resumeText && isLikelyUnrelatedDocument(resumeText)) {
    return {
      success: false,
      isInvalidDocumentType: true,
      message:
        'This document does not appear to be a resume or CV. Please choose a different file or enter your information manually.',
    };
  }

  // Automatic retry schedule for temporary availability errors (429 / 503)
  // Attempt 1: normal request
  // Retry 1: after ~2s
  // Retry 2: after ~5s
  // Retry 3: after ~10s
  const RETRY_DELAYS = [2000, 5000, 10000];
  const maxAttempts = 1 + RETRY_DELAYS.length; // 4 total attempts

  let response: Response | null = null;
  let lastTemporaryError: string = '';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const isRetry = attempt > 1;
    if (isRetry) {
      console.log(`[ResumeParser] Starting automatic retry ${attempt - 1} of ${RETRY_DELAYS.length} for ${fileName}...`);
      onStatusUpdate?.('AI extraction is temporarily busy. Retrying automatically…');
    }

    try {
      response = await fetch('/api/extract-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, fileBase64, mimeType, fileName }),
      });
    } catch (_netErr: any) {
      // Network failure treated as temporary availability issue
      console.warn(`[ResumeParser] Network request failed on attempt ${attempt}:`, _netErr);
      lastTemporaryError = 'AI resume extraction is temporarily unavailable. Your document has not been processed yet.';
      if (attempt < maxAttempts) {
        const delay = RETRY_DELAYS[attempt - 1];
        onStatusUpdate?.('AI extraction is temporarily busy. Retrying automatically…');
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      return {
        success: false,
        temporaryUnavailable: true,
        message: lastTemporaryError,
      };
    }

    // 422: Invalid document type - never retry
    if (response.status === 422) {
      console.log(`[ResumeParser] Document identified as non-resume (422). Halting retries.`);
      const errData = await response.json().catch(() => ({}));
      return {
        success: false,
        isInvalidDocumentType: true,
        message:
          errData.error ||
          'This document does not appear to be a resume or CV. Please choose a different file or enter your information manually.',
      };
    }

    // 503 or 429: Temporary availability / rate-limit error - eligible for automatic retry
    if (response.status === 503 || response.status === 429) {
      const errData = await response.json().catch(() => ({}));
      if (errData.isInvalidDocumentType) {
        return {
          success: false,
          isInvalidDocumentType: true,
          message:
            errData.error ||
            'This document does not appear to be a resume or CV. Please choose a different file or enter your information manually.',
        };
      }

      lastTemporaryError =
        errData.error ||
        'AI resume extraction is temporarily unavailable. Your document has not been processed yet.';

      console.warn(
        `[ResumeParser] Temporary availability status (${response.status}) on attempt ${attempt}/${maxAttempts}.`
      );

      if (attempt < maxAttempts) {
        const delay = RETRY_DELAYS[attempt - 1];
        console.log(`[ResumeParser] Waiting ${delay / 1000}s before retry ${attempt}...`);
        onStatusUpdate?.('AI extraction is temporarily busy. Retrying automatically…');
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      console.log(`[ResumeParser] All automatic retries exhausted for temporary outage.`);
      return {
        success: false,
        temporaryUnavailable: true,
        message: lastTemporaryError,
      };
    }

    // Other non-ok responses
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errStr = String(errData.error || errData.message || '');

      if (errData.isInvalidDocumentType) {
        return {
          success: false,
          isInvalidDocumentType: true,
          message:
            errData.error ||
            'This document does not appear to be a resume or CV. Please choose a different file or enter your information manually.',
        };
      }

      const isTemporary =
        errData.temporaryUnavailable ||
        /503|429|unavailable|high[\s-]demand|overloaded|resource exhausted|rate limit|quota|temporarily unavailable/i.test(errStr);

      if (isTemporary) {
        lastTemporaryError =
          errData.error ||
          'AI resume extraction is temporarily unavailable. Your document has not been processed yet.';

        console.warn(`[ResumeParser] Temporary error signal in response payload on attempt ${attempt}/${maxAttempts}.`);

        if (attempt < maxAttempts) {
          const delay = RETRY_DELAYS[attempt - 1];
          onStatusUpdate?.('AI extraction is temporarily busy. Retrying automatically…');
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        return {
          success: false,
          temporaryUnavailable: true,
          message: lastTemporaryError,
        };
      }

      // Unexpected server/extraction error (500, etc.) - do not retry indefinitely
      console.error(`[ResumeParser] Unexpected error status ${response.status} on attempt ${attempt}. Halting retries.`);
      return {
        success: false,
        unexpectedError: true,
        temporaryUnavailable: false,
        message:
          errData.error ||
          "We couldn't process this document because of an unexpected extraction error. Your file is still loaded. Please retry or enter your information manually.",
      };
    }

    // Response is OK (200) - process extracted data
    console.log(`[ResumeParser] Extraction request succeeded on attempt ${attempt} (${isRetry ? `retry ${attempt - 1}` : 'initial attempt'}).`);
    break;
  }

  if (!response || !response.ok) {
    return {
      success: false,
      temporaryUnavailable: true,
      message: lastTemporaryError || 'AI resume extraction is temporarily unavailable. Your document has not been processed yet.',
    };
  }

  const result = await response.json().catch(() => ({}));

  if (result.isInvalidDocumentType) {
    return {
      success: false,
      isInvalidDocumentType: true,
      message:
        result.error ||
        'This document does not appear to be a resume or CV. Please choose a different file or enter your information manually.',
    };
  }

  if (result.temporaryUnavailable || !result.success || !result.data) {
    return {
      success: false,
      temporaryUnavailable: true,
      message:
        result.error ||
        'AI resume extraction is temporarily unavailable. Your document has not been processed yet.',
    };
  }

  const raw = result.data;
  const missingFields: string[] = [];

  // Check required personal fields
  if (!raw.fullName || !raw.fullName.trim() || /organization|company|resume|curriculum/i.test(raw.fullName)) {
    raw.fullName = '';
    missingFields.push('Full Name');
  }
  if (!raw.email || !raw.email.trim() || !isValidEmailAddress(raw.email)) {
    raw.email = '';
    missingFields.push('Email Address');
  }
  if (!raw.phone || !raw.phone.trim() || !isValidPhoneNumber(raw.phone)) {
    raw.phone = '';
    missingFields.push('Phone Number');
  }
  if (!raw.location || !raw.location.trim()) {
    raw.location = '';
    missingFields.push('Location');
  }

  // Filter out any placeholder records or section headings from education
  const rawEducation = Array.isArray(raw.education) ? raw.education : [];
  const cleanEducation: EducationItem[] = rawEducation
    .filter((e: any) => {
      if (!e) return false;
      const inst = String(e.institution || '').trim();
      const deg = String(e.degree || '').trim();
      if (!inst && !deg) return false;
      // Reject placeholders
      if (/higher education|institution placeholder|university \/ college|unknown/i.test(inst)) return false;
      if (/degree completed|degree placeholder|unknown/i.test(deg)) return false;
      if (/^(education|academic background|experience|work|skills)$/i.test(inst)) return false;
      if (/^(education|academic background|experience|work|skills)$/i.test(deg)) return false;
      return true;
    })
    .map((e: any, idx: number) => {
      const gradYear =
        e.graduationYear && /^\d{4}$/.test(String(e.graduationYear).trim())
          ? String(e.graduationYear).trim()
          : '';
      return {
        id: `edu-${Date.now()}-${idx}`,
        institution: String(e.institution || '').trim(),
        degree: String(e.degree || '').trim(),
        fieldOfStudy: String(e.fieldOfStudy || '').trim(),
        graduationYear: gradYear,
        details: String(e.details || '').trim(),
        isExtracted: true,
      };
    });

  if (cleanEducation.length === 0) {
    missingFields.push('Education History');
  } else {
    const hasMissingGradYear = cleanEducation.some(
      (e) => !e.graduationYear || !isValidGraduationYear(e.graduationYear)
    );
    if (hasMissingGradYear) {
      missingFields.push('Graduation Year');
    }
  }

  // Filter out any placeholder records or section headings from work experience
  const rawWork = Array.isArray(raw.workExperience) ? raw.workExperience : [];
  const cleanWorkExperience: WorkExperienceItem[] = rawWork
    .filter((w: any) => {
      if (!w) return false;
      const comp = String(w.company || '').trim();
      const ttl = String(w.title || '').trim();
      if (!comp && !ttl) return false;
      // Reject placeholders
      if (/organization\s*\/\s*company|company placeholder|unknown organization|n\/a/i.test(comp)) return false;
      if (/job title placeholder|section heading|unknown title/i.test(ttl)) return false;
      if (/^(work experience|experience|employment history|education|skills|summary|projects|volunteer)$/i.test(ttl)) return false;
      if (/^(work experience|experience|employment history|education|skills|summary|projects|volunteer)$/i.test(comp)) return false;
      // Reject sentences masquerading as job titles
      if (ttl.length > 80 || ttl.split(' ').length > 12) return false;
      return true;
    })
    .map((w: any, idx: number) => ({
      id: `work-${Date.now()}-${idx}`,
      company: String(w.company || '').trim(),
      title: String(w.title || '').trim(),
      startDate: String(w.startDate || '').trim(),
      endDate: String(w.endDate || '').trim(),
      current: Boolean(w.current),
      description: String(w.description || '').trim(),
      isExtracted: true,
    }));

  // Note: Work Experience is optional. Missing work experience is NOT added to missingFields.

  // Skills: Filter out non-skills, keep optional (do NOT add to missingFields)
  const rawSkills = Array.isArray(raw.skills) ? raw.skills : [];
  const cleanSkills = rawSkills
    .map((s: any) => String(s || '').trim())
    .filter((s: string) => s.length > 1 && s.length < 50 && !/^(skills|competencies|experience|summary|none)$/i.test(s));

  const formattedPhone = raw.phone ? standardizePhoneNumber(raw.phone) : '';

  return {
    success: true,
    usedAI: true,
    notes: raw.extractionConfidenceNotes || 'Information extracted using Gemini 3.8 Flash model.',
    data: {
      fullName: raw.fullName || '',
      email: raw.email || '',
      phone: formattedPhone,
      location: raw.location || '',
      summary: raw.summary || '',
      education: cleanEducation,
      workExperience: cleanWorkExperience,
      skills: Array.from(new Set(cleanSkills)),
      missingFields,
      rawText: result.extractedText || resumeText,
      fileName,
      fileSize,
      extractedAt: new Date().toISOString(),
      extractionConfidenceNotes: raw.extractionConfidenceNotes,
    },
  };
}

export function fallbackHeuristicExtraction(
  text: string,
  fileName: string = 'uploaded_resume.txt',
  fileSize?: number
): ApplicantData {
  if (isLikelyUnrelatedDocument(text)) {
    const error: any = new Error(
      'This document does not appear to be a resume or CV. Please choose a different file or enter your information manually.'
    );
    error.isInvalidDocumentType = true;
    throw error;
  }

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  let fullName = '';
  let email = '';
  let phone = '';
  let location = '';

  // 1. Detect Email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    email = emailMatch[0];
  }

  // 2. Detect Phone
  const phoneMatch = text.match(/(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/);
  if (phoneMatch) {
    phone = standardizePhoneNumber(phoneMatch[0]);
  }

  // 3. Name (only top lines before email/phone)
  for (let i = 0; i < Math.min(lines.length, 4); i++) {
    const line = lines[i];
    if (
      line.length > 2 &&
      line.length < 35 &&
      !line.includes('@') &&
      !line.match(/[0-9]{4}/) &&
      !/^(resume|curriculum|vitae|page|contact|email|phone)/i.test(line)
    ) {
      fullName = line.replace(/^(name\s*:\s*)/i, '').trim();
      break;
    }
  }

  // 4. Location
  const locationMatch =
    text.match(/(?:Location|Address)?\s*:\s*([A-Za-z\s]+,\s*[A-Z]{2})/i) ||
    text.match(/([A-Z][a-zA-Z\s]+,\s*(?:WA|OR|CA|ID|MT|CO|UT|BC|Washington|Oregon|California))/i);
  if (locationMatch) {
    location = locationMatch[1].trim();
  }

  // 5. Skills (optional)
  const skills: string[] = [];
  const skillsRegex =
    /(?:SKILLS|COMPETENCIES|CORE SKILLS|TECHNICAL SKILLS)[\s\S]*?(?=(?:EXPERIENCE|WORK|EDUCATION|PROJECTS|CERTIFICATIONS|$))/i;
  const skillsBlock = text.match(skillsRegex);
  if (skillsBlock) {
    const rawTokens = skillsBlock[0]
      .replace(/(?:SKILLS|COMPETENCIES|CORE SKILLS|TECHNICAL SKILLS)[:\s]*/i, '')
      .split(/[,•·\n\r|;]+/)
      .map((s) => s.trim().replace(/^[-*•]\s*/, ''))
      .filter((s) => s.length > 1 && s.length < 45 && !/^(experience|education|work|skills)$/i.test(s));
    skills.push(...Array.from(new Set(rawTokens)));
  }

  // 6. Education - ONLY genuine identified records, NO placeholders
  const education: EducationItem[] = [];
  const eduRegex = /(?:EDUCATION|ACADEMIC BACKGROUND)[\s\S]*?(?=(?:EXPERIENCE|WORK|SKILLS|PROJECTS|$))/i;
  const eduBlock = text.match(eduRegex);
  if (eduBlock) {
    const eduText = eduBlock[0];
    const uniMatch = eduText.match(/([A-Za-z\s]+(?:University|College|Institute|Academy)[A-Za-z\s,]*)/i);
    const degreeMatch = eduText.match(
      /(Bachelor[^\n,]+|Master[^\n,]+|Associate[^\n,]+|B\.?[AS]\.?[^\n,]*|M\.?[AS]\.?[^\n,]*|Ph\.?D[^\n,]*)/i
    );
    const yearMatch = eduText.match(/\b(20\d\d|19\d\d)\b/);

    // Only create an entry if an institution OR degree was genuinely identified (no "Higher Education Institution")
    if (uniMatch || degreeMatch) {
      education.push({
        id: `edu-${Date.now()}-1`,
        institution: uniMatch ? uniMatch[1].trim() : '',
        degree: degreeMatch ? degreeMatch[1].trim() : '',
        fieldOfStudy: '',
        graduationYear: yearMatch && isValidGraduationYear(yearMatch[1]) ? yearMatch[1].trim() : '',
        details: '',
        isExtracted: true,
      });
    }
  }

  // 7. Work Experience - ONLY genuine identified records, NO placeholders
  const workExperience: WorkExperienceItem[] = [];
  const expRegex = /(?:EXPERIENCE|WORK EXPERIENCE|EMPLOYMENT HISTORY)[\s\S]*?(?=(?:EDUCATION|SKILLS|CERTIFICATIONS|$))/i;
  const expBlock = text.match(expRegex);
  if (expBlock) {
    const expText = expBlock[0].replace(/(?:EXPERIENCE|WORK EXPERIENCE|EMPLOYMENT HISTORY)[\r\n]*/i, '');
    const jobChunks = expText.split(/\n\s*\n/);
    jobChunks.forEach((chunk, idx) => {
      if (chunk.trim().length > 25 && idx < 3) {
        const chunkLines = chunk.split('\n').map((c) => c.trim()).filter(Boolean);
        const header = chunkLines[0] || '';
        
        // Skip if header is a section title or summary sentence
        if (/^(EXPERIENCE|WORK|SKILLS|EDUCATION|SUMMARY|PROJECTS|CERTIFICATIONS|REFERENCES|VOLUNTEER)/i.test(header)) {
          return;
        }

        let title = '';
        let company = '';
        if (header.includes('|')) {
          const parts = header.split('|');
          title = parts[0].trim();
          company = parts[1].trim();
        } else if (header.includes(' at ')) {
          const parts = header.split(' at ');
          title = parts[0].trim();
          company = parts[1].trim();
        } else if (chunkLines[1] && chunkLines[1].length < 45 && !/^(Seattle|Portland|Remote|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})/i.test(chunkLines[1])) {
          title = header;
          company = chunkLines[1];
        }

        // Clean out any placeholder strings
        if (/organization|company placeholder/i.test(company)) {
          company = '';
        }

        // Only create record if title or company is genuinely identified
        if (title.trim() && !/summary|objective|curriculum|resume|page/i.test(title)) {
          const dateMatch = chunk.match(
            /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?\d{4}\s*(?:-|–|to)\s*(?:Present|(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?\d{4})/i
          );
          const desc = chunkLines.slice(1).filter((l) => l !== company).join('\n');

          workExperience.push({
            id: `work-${Date.now()}-${idx}`,
            company: company.replace(/^[-\s|]+/, ''),
            title: title.replace(/^[-\s|]+/, ''),
            startDate: dateMatch ? dateMatch[0].split(/-|–|to/)[0].trim() : '',
            endDate: dateMatch ? dateMatch[0].split(/-|–|to/)[1]?.trim() || '' : '',
            current: dateMatch ? /present/i.test(dateMatch[0]) : false,
            description: desc,
            isExtracted: true,
          });
        }
      }
    });
  }

  // 8. Missing Fields Check - STRICT: Flag anything not explicitly provided or invalid
  const missingFields: string[] = [];
  if (!fullName) missingFields.push('Full Name');
  if (!email || !isValidEmailAddress(email)) missingFields.push('Email Address');
  if (!phone || !isValidPhoneNumber(phone)) missingFields.push('Phone Number');
  if (!location) missingFields.push('Location');
  if (education.length === 0) {
    missingFields.push('Education History');
  } else if (!education[0].graduationYear || !isValidGraduationYear(education[0].graduationYear)) {
    missingFields.push('Graduation Year');
  }
  // Note: Work Experience is optional; missing work experience is not added to missingFields.

  // Summary
  const summaryMatch = text.match(
    /(?:SUMMARY|PROFESSIONAL SUMMARY|EXECUTIVE SUMMARY)[\s\S]*?(?=(?:EXPERIENCE|WORK|EDUCATION|SKILLS|$))/i
  );
  const summary = summaryMatch
    ? summaryMatch[0]
        .replace(/(?:SUMMARY|PROFESSIONAL SUMMARY|EXECUTIVE SUMMARY)[:\s]*/i, '')
        .trim()
        .slice(0, 300)
    : '';

  return {
    fullName,
    email,
    phone,
    location,
    summary,
    education,
    workExperience,
    skills,
    missingFields,
    rawText: text,
    fileName,
    fileSize,
    extractedAt: new Date().toISOString(),
    extractionConfidenceNotes: 'Extracted directly from resume text. Missing information was not invented.',
  };
}
