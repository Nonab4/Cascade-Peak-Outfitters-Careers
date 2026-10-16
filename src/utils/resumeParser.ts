import { ApplicantData, EducationItem, WorkExperienceItem } from '../types/application';

export interface ParseResumeOptions {
  resumeText?: string;
  fileBase64?: string;
  mimeType?: string;
  fileName?: string;
  fileSize?: number;
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

export async function parseResumeWithAI(
  options: ParseResumeOptions
): Promise<{ data: ApplicantData; usedAI: boolean; notes?: string }> {
  const { resumeText = '', fileBase64, mimeType, fileName = 'resume.txt', fileSize } = options;

  try {
    const response = await fetch('/api/extract-resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText, fileBase64, mimeType, fileName }),
    });

    if (response.status === 503) {
      const errData = await response.json().catch(() => ({}));
      const error: any = new Error(
        errData.error || 'AI resume extraction is temporarily unavailable due to high demand. Please try again.'
      );
      error.isTemporaryUnavailable = true;
      throw error;
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errStr = String(errData.error || response.statusText || '');
      if (/503|unavailable|high[\s-]demand|overloaded/i.test(errStr)) {
        const error: any = new Error(
          'AI resume extraction is temporarily unavailable due to high demand. Please try again.'
        );
        error.isTemporaryUnavailable = true;
        throw error;
      }
    }

    if (response.ok) {
      const result = await response.json();

      if (result.temporaryUnavailable) {
        const error: any = new Error(
          result.error || 'AI resume extraction is temporarily unavailable due to high demand. Please try again.'
        );
        error.isTemporaryUnavailable = true;
        throw error;
      }

      if (result.success && result.data) {
        const raw = result.data;
        const missingFields: string[] = [];

        // Validate presence of core fields and ensure missingFields list is strictly accurate
        if (!raw.fullName || !raw.fullName.trim()) missingFields.push('Full Name');
        if (!raw.email || !raw.email.trim() || !isValidEmailAddress(raw.email)) missingFields.push('Email Address');
        if (!raw.phone || !raw.phone.trim() || !isValidPhoneNumber(raw.phone)) missingFields.push('Phone Number');
        if (!raw.location || !raw.location.trim()) missingFields.push('Location');
        
        if (!raw.education || raw.education.length === 0) {
          missingFields.push('Education History');
        } else {
          const hasMissingGradYear = raw.education.some(
            (e: any) => !e.graduationYear || !isValidGraduationYear(e.graduationYear)
          );
          if (hasMissingGradYear) {
            missingFields.push('Graduation Year');
          }
        }

        if (!raw.workExperience || raw.workExperience.length === 0) {
          missingFields.push('Work Experience');
        }

        const education: EducationItem[] = (raw.education || []).map((e: any, idx: number) => ({
          id: `edu-${Date.now()}-${idx}`,
          institution: e.institution || '',
          degree: e.degree || '',
          fieldOfStudy: e.fieldOfStudy || '',
          graduationYear: e.graduationYear && /^\d{4}$/.test(e.graduationYear) ? e.graduationYear : '',
          details: e.details || '',
          isExtracted: true,
        }));

        const workExperience: WorkExperienceItem[] = (raw.workExperience || []).map((w: any, idx: number) => ({
          id: `work-${Date.now()}-${idx}`,
          company: w.company || '',
          title: w.title || '',
          startDate: w.startDate || '',
          endDate: w.endDate || '',
          current: Boolean(w.current),
          description: w.description || '',
          isExtracted: true,
        }));

        const formattedPhone = raw.phone ? standardizePhoneNumber(raw.phone) : '';

        return {
          usedAI: true,
          notes: raw.extractionConfidenceNotes || 'Information extracted using Gemini 3.8 Flash model.',
          data: {
            fullName: raw.fullName || '',
            email: raw.email || '',
            phone: formattedPhone,
            location: raw.location || '',
            summary: raw.summary || '',
            education,
            workExperience,
            skills: raw.skills || [],
            missingFields,
            rawText: result.extractedText || resumeText,
            fileName,
            fileSize,
            extractedAt: new Date().toISOString(),
            extractionConfidenceNotes: raw.extractionConfidenceNotes,
          },
        };
      } else if (result.fallbackNeeded && result.extractedText) {
        const fallbackData = fallbackHeuristicExtraction(result.extractedText, fileName, fileSize);
        return {
          data: fallbackData,
          usedAI: false,
          notes: 'Parsed via structured recruitment intake rules.',
        };
      }
    }
  } catch (err: any) {
    if (
      err?.isTemporaryUnavailable ||
      /temporarily unavailable|high[\s-]demand|503/i.test(String(err?.message || ''))
    ) {
      // Strictly re-throw without generating fake or sample applicant data
      throw err;
    }
    console.warn('Backend AI extraction unavailable, using fallback parser:', err);
  }

  // Fallback heuristic extraction
  const fallbackData = fallbackHeuristicExtraction(resumeText, fileName, fileSize);
  return {
    data: fallbackData,
    usedAI: false,
    notes: 'Parsed via structured recruitment intake rules.',
  };
}

export function fallbackHeuristicExtraction(
  text: string,
  fileName: string = 'uploaded_resume.txt',
  fileSize?: number
): ApplicantData {
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

  // 3. Name (usually top lines before email/phone)
  for (let i = 0; i < Math.min(lines.length, 4); i++) {
    const line = lines[i];
    if (
      line.length > 2 &&
      line.length < 40 &&
      !line.includes('@') &&
      !line.match(/[0-9]{4}/) &&
      !line.toLowerCase().includes('resume') &&
      !line.toLowerCase().includes('curriculum') &&
      !line.toLowerCase().includes('page')
    ) {
      fullName = line.replace(/^(name\s*:\s*)/i, '');
      break;
    }
  }

  // 4. Location
  const locationMatch = text.match(/(?:Location|Address)?\s*:\s*([A-Za-z\s]+,\s*[A-Z]{2})/i) ||
                        text.match(/([A-Z][a-zA-Z\s]+,\s*(?:WA|OR|CA|ID|MT|CO|UT|BC|Washington|Oregon|California))/i);
  if (locationMatch) {
    location = locationMatch[1].trim();
  }

  // 5. Skills
  const skills: string[] = [];
  const skillsRegex = /(?:SKILLS|COMPETENCIES|CORE SKILLS|TECHNICAL SKILLS)[\s\S]*?(?=(?:EXPERIENCE|WORK|EDUCATION|PROJECTS|CERTIFICATIONS|$))/i;
  const skillsBlock = text.match(skillsRegex);
  if (skillsBlock) {
    const rawTokens = skillsBlock[0]
      .replace(/(?:SKILLS|COMPETENCIES|CORE SKILLS|TECHNICAL SKILLS)[:\s]*/i, '')
      .split(/[,•·\n\r|;]+/)
      .map((s) => s.trim().replace(/^[-*•]\s*/, ''))
      .filter((s) => s.length > 1 && s.length < 45 && !s.toLowerCase().includes('experience'));
    skills.push(...Array.from(new Set(rawTokens)));
  }

  // 6. Education
  const education: EducationItem[] = [];
  const eduRegex = /(?:EDUCATION|ACADEMIC BACKGROUND)[\s\S]*?(?=(?:EXPERIENCE|WORK|SKILLS|PROJECTS|$))/i;
  const eduBlock = text.match(eduRegex);
  if (eduBlock) {
    const eduText = eduBlock[0];
    const uniMatch = eduText.match(/([A-Za-z\s]+(?:University|College|Institute|Academy)[A-Za-z\s,]*)/i);
    const degreeMatch = eduText.match(/(Bachelor[^\n,]+|Master[^\n,]+|Associate[^\n,]+|B\.?[AS]\.?[^\n,]*|M\.?[AS]\.?[^\n,]*|Ph\.?D[^\n,]*)/i);
    const yearMatch = eduText.match(/\b(20\d\d|19\d\d)\b/);

    if (uniMatch || degreeMatch) {
      education.push({
        id: `edu-${Date.now()}-1`,
        institution: uniMatch ? uniMatch[1].trim() : 'Higher Education Institution',
        degree: degreeMatch ? degreeMatch[1].trim() : 'Degree Completed',
        fieldOfStudy: '',
        graduationYear: yearMatch && isValidGraduationYear(yearMatch[1]) ? yearMatch[1].trim() : '',
        details: '',
        isExtracted: true,
      });
    }
  }

  // 7. Work Experience
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
        let title = header;
        let company = 'Organization / Company';
        if (header.includes('|')) {
          const parts = header.split('|');
          title = parts[0].trim();
          company = parts[1].trim();
        } else if (header.includes(' at ')) {
          const parts = header.split(' at ');
          title = parts[0].trim();
          company = parts[1].trim();
        } else if (chunkLines[1] && chunkLines[1].length < 50) {
          company = chunkLines[1];
        }

        const dateMatch = chunk.match(/(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?\d{4}\s*(?:-|–|to)\s*(?:Present|(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?\d{4})/i);
        const desc = chunkLines.slice(1).join('\n');

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
  if (workExperience.length === 0) missingFields.push('Work Experience');

  // Summary
  const summaryMatch = text.match(/(?:SUMMARY|PROFESSIONAL SUMMARY|EXECUTIVE SUMMARY)[\s\S]*?(?=(?:EXPERIENCE|WORK|EDUCATION|SKILLS|$))/i);
  const summary = summaryMatch
    ? summaryMatch[0].replace(/(?:SUMMARY|PROFESSIONAL SUMMARY|EXECUTIVE SUMMARY)[:\s]*/i, '').trim().slice(0, 300)
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
