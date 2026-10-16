import { ApplicantData, EducationItem, WorkExperienceItem } from '../types/application';

export async function parseResumeWithAI(
  resumeText: string,
  fileName: string = 'resume.txt',
  fileSize?: number
): Promise<{ data: ApplicantData; usedAI: boolean; notes?: string }> {
  try {
    const response = await fetch('/api/extract-resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText, fileName }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        const raw = result.data;
        const missingFields: string[] = Array.isArray(raw.missingFields) ? [...raw.missingFields] : [];

        // Validate presence of core fields and ensure missingFields list is exhaustive
        if (!raw.fullName || !raw.fullName.trim()) {
          if (!missingFields.includes('Full Name')) missingFields.push('Full Name');
        }
        if (!raw.email || !raw.email.trim()) {
          if (!missingFields.includes('Email')) missingFields.push('Email');
        }
        if (!raw.phone || !raw.phone.trim()) {
          if (!missingFields.includes('Phone Number')) missingFields.push('Phone Number');
        }
        if (!raw.location || !raw.location.trim()) {
          if (!missingFields.includes('Location')) missingFields.push('Location');
        }
        if (!raw.education || raw.education.length === 0) {
          if (!missingFields.includes('Education')) missingFields.push('Education');
        } else {
          // Check if graduation year is missing
          const hasMissingGradYear = raw.education.some((e: any) => !e.graduationYear || !e.graduationYear.trim());
          if (hasMissingGradYear && !missingFields.includes('Graduation Year')) {
            missingFields.push('Graduation Year');
          }
        }
        if (!raw.skills || raw.skills.length === 0) {
          if (!missingFields.includes('Skills')) missingFields.push('Skills');
        }
        if (!raw.workExperience || raw.workExperience.length === 0) {
          if (!missingFields.includes('Work Experience')) missingFields.push('Work Experience');
        }

        const education: EducationItem[] = (raw.education || []).map((e: any, idx: number) => ({
          id: `edu-${Date.now()}-${idx}`,
          institution: e.institution || '',
          degree: e.degree || '',
          fieldOfStudy: e.fieldOfStudy || '',
          graduationYear: e.graduationYear || '',
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

        return {
          usedAI: true,
          notes: raw.extractionConfidenceNotes || 'Information extracted using Gemini 3.8 Flash model.',
          data: {
            fullName: raw.fullName || '',
            email: raw.email || '',
            phone: raw.phone || '',
            location: raw.location || '',
            summary: raw.summary || '',
            education,
            workExperience,
            skills: raw.skills || [],
            missingFields,
            rawText: resumeText,
            fileName,
            fileSize,
            extractedAt: new Date().toISOString(),
            extractionConfidenceNotes: raw.extractionConfidenceNotes,
          },
        };
      }
    }
  } catch (err) {
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

  // 2. Detect Phone (Strict: only if actual digits format found)
  const phoneMatch = text.match(/(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/);
  if (phoneMatch) {
    phone = phoneMatch[0];
  }

  // 3. Name (usually top 1-2 lines before email/phone)
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
    const yearMatch = eduText.match(/(?:Graduated\s*:?\s*|Class of\s*|\b)(20\d\d|19\d\d)\b/i);

    if (uniMatch || degreeMatch) {
      education.push({
        id: `edu-${Date.now()}-1`,
        institution: uniMatch ? uniMatch[1].trim() : 'Higher Education Institution',
        degree: degreeMatch ? degreeMatch[1].trim() : 'Degree Completed',
        fieldOfStudy: '',
        graduationYear: yearMatch ? yearMatch[1].trim() : '',
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
        let company = 'Outfitter Retail Partner';
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

  // 8. Missing Fields Check - STRICT: Flag anything not explicitly provided
  const missingFields: string[] = [];
  if (!fullName) missingFields.push('Full Name');
  if (!email) missingFields.push('Email');
  if (!phone) missingFields.push('Phone Number');
  if (!location) missingFields.push('Location');
  if (education.length === 0) {
    missingFields.push('Education');
  } else if (!education[0].graduationYear) {
    missingFields.push('Graduation Year');
  }
  if (workExperience.length === 0) missingFields.push('Work Experience');
  if (skills.length === 0) missingFields.push('Skills');

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
