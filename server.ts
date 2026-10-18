import express from 'express';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import JSZip from 'jszip';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));

// Diagnostic API logger
app.use(['/api', '/backend'], (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const contentType = res.getHeader('content-type') || 'unknown';
    console.log(`[API Diagnostic] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${contentType}) [${duration}ms]`);
  });
  next();
});

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Helper to clean and decode Word XML tags into readable text
function extractTextFromWordXml(xmlStr: string): string {
  if (!xmlStr) return '';
  // Convert structural Word XML tags to text boundaries
  const text = xmlStr
    .replace(/<w:tab\s*\/?>/gi, '\t')
    .replace(/<w:br\s*\/?>/gi, '\n')
    .replace(/<w:cr\s*\/?>/gi, '\n')
    .replace(/<\/w:p>/gi, '\n')
    .replace(/<\/w:tr>/gi, '\n')
    .replace(/<\/w:tc>/gi, '\t')
    .replace(/<[^>]+>/g, '') // remove all XML tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

// Comprehensive DOCX extractor: parses headers, document body, tables, hyperlinks, and footers
async function extractDocxTextWithFullCoverage(buffer: Buffer): Promise<string> {
  const parts: string[] = [];

  // 1. First extract using mammoth raw text
  let mammothText = '';
  try {
    const result = await mammoth.extractRawText({ buffer });
    mammothText = (result?.value || '').trim();
  } catch (err) {
    console.warn('[DocxExtractor] Mammoth extractRawText warning:', err);
  }

  // 2. Unpack DOCX zip structure to inspect headers, relationships, and document XML directly
  try {
    const zip = await JSZip.loadAsync(buffer);
    const fileNames = Object.keys(zip.files);

    // Parse relationship maps (to discover mailto: and web hyperlinks)
    const hyperlinkMap: Record<string, string> = {};
    const relFiles = fileNames.filter((name) => /word\/_rels\/.*\.rels$/i.test(name));
    for (const relFile of relFiles) {
      try {
        const relXml = await zip.files[relFile].async('text');
        const relRegex = /<Relationship\s+([^>]+)\/?>/gi;
        let match;
        while ((match = relRegex.exec(relXml)) !== null) {
          const attrs = match[1];
          const idMatch = attrs.match(/Id=["']([^"']+)["']/i);
          const targetMatch = attrs.match(/Target=["']([^"']+)["']/i);
          if (idMatch && targetMatch) {
            hyperlinkMap[idMatch[1]] = targetMatch[1];
          }
        }
      } catch (e) {
        // ignore rel parsing error
      }
    }

    // Extract headers (e.g. word/header1.xml, word/header2.xml, word/header3.xml)
    // Resumes frequently position applicant name, email, and phone inside the document header
    const headerFiles = fileNames
      .filter((name) => /^word\/header\d*\.xml$/i.test(name))
      .sort();

    const headerTexts: string[] = [];
    for (const hFile of headerFiles) {
      try {
        const xml = await zip.files[hFile].async('text');
        const text = extractTextFromWordXml(xml);
        if (text) {
          headerTexts.push(text);
        }
      } catch (e) {
        // ignore
      }
    }

    // Extract main document XML directly (ensures centered headings, tabs, tables are retained)
    let directDocText = '';
    const mainDocFile = fileNames.find((name) => /^word\/document\.xml$/i.test(name));
    if (mainDocFile) {
      try {
        const docXml = await zip.files[mainDocFile].async('text');
        directDocText = extractTextFromWordXml(docXml);
      } catch (e) {
        // ignore
      }
    }

    // Extract footers if any
    const footerFiles = fileNames
      .filter((name) => /^word\/footer\d*\.xml$/i.test(name))
      .sort();
    const footerTexts: string[] = [];
    for (const fFile of footerFiles) {
      try {
        const xml = await zip.files[fFile].async('text');
        const text = extractTextFromWordXml(xml);
        if (text) {
          footerTexts.push(text);
        }
      } catch (e) {
        // ignore
      }
    }

    // If headers were found and are not already in mammothText, prepend them
    if (headerTexts.length > 0) {
      const combinedHeaders = headerTexts.join('\n');
      // If mammoth missed the header content (e.g., name/email was in header)
      if (!mammothText || !mammothText.includes(combinedHeaders.slice(0, 30))) {
        parts.push(combinedHeaders);
      }
    }

    // Include the main body: prefer the richer text between directDocText and mammothText
    if (directDocText && directDocText.length > mammothText.length) {
      parts.push(directDocText);
    } else if (mammothText) {
      parts.push(mammothText);
    } else if (directDocText) {
      parts.push(directDocText);
    }

    // Include footers if not present
    if (footerTexts.length > 0) {
      const combinedFooters = footerTexts.join('\n');
      if (!mammothText.includes(combinedFooters.slice(0, 30))) {
        parts.push(combinedFooters);
      }
    }

    // Check if there are mailto: hyperlinks in the document relationships that weren't captured in text
    const mailtoEmails = Object.values(hyperlinkMap)
      .filter((target) => target.toLowerCase().startsWith('mailto:'))
      .map((target) => target.replace(/^mailto:/i, '').split('?')[0].trim());

    if (mailtoEmails.length > 0) {
      const currentCombined = parts.join('\n');
      for (const email of mailtoEmails) {
        if (!currentCombined.toLowerCase().includes(email.toLowerCase())) {
          // Append explicit contact email discovered from hyperlink relationships
          parts.unshift(`Contact Email: ${email}`);
        }
      }
    }
  } catch (zipErr) {
    console.warn('[DocxExtractor] Zip extraction fallback error, using mammoth:', zipErr);
    if (mammothText) {
      parts.push(mammothText);
    }
  }

  const finalCombinedText = parts.join('\n\n').trim();
  return finalCombinedText || mammothText;
}

// Helper to extract text from buffer based on file type
async function extractTextFromBuffer(buffer: Buffer, mimeType: string, fileName: string): Promise<string> {
  const lowerName = fileName.toLowerCase();
  
  if (mimeType === 'application/pdf' || lowerName.endsWith('.pdf')) {
    let parser: any = null;
    try {
      parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      return result?.text || '';
    } catch (err) {
      console.warn('PDF text extraction failed, returning empty text:', err);
      return '';
    } finally {
      if (parser && typeof parser.destroy === 'function') {
        try {
          await parser.destroy();
        } catch {
          // ignore cleanup errors
        }
      }
    }
  }

  if (
    mimeType.includes('wordprocessingml') ||
    lowerName.endsWith('.docx')
  ) {
    try {
      return await extractDocxTextWithFullCoverage(buffer);
    } catch (err) {
      console.warn('DOCX extraction failed, returning empty text:', err);
      return '';
    }
  }

  // Default to utf-8 text
  return buffer.toString('utf-8');
}

// Extraction handler function used by both /api/extract-resume and /backend/extract-resume
async function handleExtractResume(req: express.Request, res: express.Response) {
  try {
    const { resumeText, fileBase64, mimeType, fileName, simulate503 } = req.body;

    if (simulate503 || req.query.simulate503 === 'true') {
      return res.status(200).json({
        success: false,
        temporaryUnavailable: true,
        originalStatus: 503,
        error: 'AI resume extraction is temporarily unavailable. Your document has not been processed yet.',
      });
    }

    let extractedPlainText = resumeText || '';
    let buffer: Buffer | null = null;
    const cleanFileName = fileName || 'uploaded_resume';
    const cleanMimeType = mimeType || 'text/plain';

    if (fileBase64) {
      buffer = Buffer.from(fileBase64, 'base64');
      if (!extractedPlainText) {
        extractedPlainText = await extractTextFromBuffer(buffer, cleanMimeType, cleanFileName);
      }
    }

    if (!extractedPlainText.trim() && (!buffer || cleanMimeType !== 'application/pdf')) {
      return res.status(200).json({
        success: false,
        unexpectedError: true,
        originalStatus: 400,
        error: 'Unable to extract text from the uploaded document. Please ensure it is a valid PDF, DOCX, or text file.',
        fallbackNeeded: false,
      });
    }

    if (!ai) {
      return res.status(200).json({
        success: false,
        temporaryUnavailable: true,
        originalStatus: 503,
        error: 'AI resume extraction is temporarily unavailable. Your document has not been processed yet.',
      });
    }

    const systemInstruction = `You are an applicant data extraction specialist for the Cascade Peak Outfitters recruitment portal prototype.
The company received approximately 4,800 applications last year and is testing this front-end prototype to standardize applicant intake.

CRITICAL DOCUMENT CLASSIFICATION & DATA QUALITY INSTRUCTIONS:
1. DOCUMENT CLASSIFICATION:
   - First, determine whether the document reasonably appears to be a resume or curriculum vitae (CV).
   - A resume/CV may contain combinations of:
     * contact information,
     * education,
     * work or volunteer experience,
     * skills,
     * qualifications,
     * professional summary,
     * employment history.
   - DO NOT reject legitimate resumes just because information is missing (e.g. candidate has no work experience yet, or is missing a phone number or graduation year). As long as it is an applicant's resume or CV, set isResumeOrCv to true.
   - If the document clearly appears to be something unrelated, such as an academic paper, research paper, essay, report, invoice, receipt, class assignment, homework, syllabus, or article:
     * Set isResumeOrCv to false.
     * Set documentType to the detected type (e.g., "academic_paper", "essay", "invoice", "report", "class_assignment", "other").
     * Do NOT create an applicant record from it.
     * Do NOT use a person's name found in the unrelated document (such as an author, professor, student, or client) as applicant data. Set fullName to "".
     * Set all other applicant fields to empty strings or empty arrays [].
2. APPLICANT NAME & EMAIL EXTRACTION (TOP OF DOCUMENT):
   - The applicant's full name is almost always the first prominent text at the top of the resume, header, or first line. Always extract it into "fullName" when present.
   - The applicant's email address is commonly placed directly underneath or near the candidate's name at the top of the resume. If an email address appears near the top (e.g., standard email text or within a mailto hyperlink), extract it into "email".
   - Hyperlinks, centered text, or header sections must NOT prevent extracting the visible name or email.
3. STRICT ACCURACY & NO INVENTION:
   - Extract only information actually present in the resume.
   - Do NOT invent, assume, extrapolate, or hallucinate missing information.
   - If a phone number, city/state location, or graduation year is not present in the document, leave it blank (empty string "") and flag it in "missingFields". Do NOT guess or invent phone numbers, addresses, or dates.
4. NO PLACEHOLDERS: Do NOT generate placeholder values such as "Organization / Company", "Higher Education Institution", "Degree Completed", section headings, partial summary sentences, or other inferred information as applicant records.
5. CLEAR RECORDS ONLY: Only create education or work-experience entries when the source document contains a clearly identified record. If none is clearly identifiable, return an empty array [].
6. WORK EXPERIENCE IS OPTIONAL: If work experience is found, extract and display it. If none is present, return an empty array []. Missing work experience must not count as an error and must NOT be added to missingFields.
7. UNCERTAIN FIELDS: If extraction succeeds but any field is uncertain or not explicitly stated, leave it blank (empty string "" or empty array []) or flag it in "missingFields" rather than guessing.
8. SKILLS ARE OPTIONAL: Extract only skills and competencies explicitly stated in the resume. If none are explicitly stated, return an empty array []. Skills are optional and must NOT be added to missingFields.
9. MISSING FIELDS: Identify missing standard required fields and list them explicitly in "missingFields" (e.g., "Full Name", "Email Address", "Phone Number", "Location", "Education History", "Graduation Year"). Do NOT flag Work Experience or Skills.
10. DATES: Normalize dates into standard readable formats. For education, graduationYear must be a 4-digit year (e.g. "2022") if explicitly stated; otherwise leave empty string "".
11. FACTUAL INTEGRITY: Do NOT include fictional company facts, salaries, or marketing claims.`;

    // Diagnostic logging for DOCX resumes in development (sanitized: no personal info logged)
    const isDocx = cleanMimeType.includes('wordprocessingml') || cleanFileName.toLowerCase().endsWith('.docx');
    if (isDocx) {
      const emailMatches = extractedPlainText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
      const first500 = extractedPlainText.slice(0, 500);
      const likelyNameInFirstLines = first500
        .split('\n')
        .slice(0, 3)
        .map((l: string) => l.trim())
        .find((l: string) => l.length >= 2 && l.length <= 40 && !l.includes('@') && !/http|resume|cv|curriculum|phone|email|contact/i.test(l));

      console.log(`[DocxDiagnostic] File: "${cleanFileName}" | Character count: ${extractedPlainText.length}`);
      console.log(`[DocxDiagnostic] Email detected: ${Boolean(emailMatches && emailMatches.length > 0)}`);
      console.log(`[DocxDiagnostic] Likely applicant name detected: ${Boolean(likelyNameInFirstLines)}`);
    }

    // Determine if extracted PDF text is usable (approx 200+ characters with normal letters/words)
    const isPdf = cleanMimeType === 'application/pdf' || cleanFileName.toLowerCase().endsWith('.pdf');
    const hasBase64 = Boolean(fileBase64 && fileBase64.length > 50);

    const isUsableExtractedText = (text: string): boolean => {
      if (!text || typeof text !== 'string') return false;
      const trimmed = text.trim();
      if (trimmed.length < 200) return false;
      // Count alphabetic characters and words
      const alphaMatches = trimmed.match(/[a-zA-Z]/g);
      const alphaCount = alphaMatches ? alphaMatches.length : 0;
      if (alphaCount < 120) return false;
      const words = trimmed.split(/\s+/).filter((w) => w.length > 1);
      return words.length >= 25;
    };

    const hasUsableText = isUsableExtractedText(extractedPlainText);

    if (isPdf && hasUsableText) {
      console.log(`[ResumeServer] PDF text extracted successfully (${extractedPlainText.trim().length} chars). Using extracted-text extraction mode.`);
    } else if (isPdf) {
      console.log(`[ResumeServer] PDF contains little or no extractable text. Using native-PDF extraction mode.`);
    } else {
      console.log(`[ResumeServer] Document text available (${extractedPlainText.trim().length} chars). Using extracted-text extraction mode.`);
    }

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        isResumeOrCv: {
          type: Type.BOOLEAN,
          description:
            'Whether the document reasonably appears to be a resume or CV (true) or an unrelated document like an essay, academic paper, invoice, report, or class assignment (false)',
        },
        documentType: {
          type: Type.STRING,
          description:
            'Classification: resume, cv, academic_paper, essay, report, invoice, class_assignment, other',
        },
        fullName: { type: Type.STRING, description: 'Full legal name, empty string if missing or not a resume' },
        email: { type: Type.STRING, description: 'Email address, empty string if missing or not a resume' },
        phone: { type: Type.STRING, description: 'Phone number, empty string if missing or not a resume' },
        location: { type: Type.STRING, description: 'City and State/Country, empty string if missing or not a resume' },
        summary: { type: Type.STRING, description: 'Professional summary, empty string if not found or not a resume' },
        skills: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Explicitly mentioned skills and competencies',
        },
        education: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              institution: { type: Type.STRING },
              degree: { type: Type.STRING },
              fieldOfStudy: { type: Type.STRING },
              graduationYear: { type: Type.STRING, description: '4-digit year, empty string if missing' },
              details: { type: Type.STRING },
            },
            required: ['institution', 'degree'],
          },
        },
        workExperience: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              company: { type: Type.STRING },
              title: { type: Type.STRING },
              startDate: { type: Type.STRING },
              endDate: { type: Type.STRING },
              current: { type: Type.BOOLEAN },
              description: { type: Type.STRING },
            },
            required: ['company', 'title'],
          },
        },
        missingFields: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Names of standard required fields missing from the resume',
        },
        extractionConfidenceNotes: {
          type: Type.STRING,
          description: 'Audit note summarizing extraction completeness and flagged missing items',
        },
      },
      required: ['isResumeOrCv', 'fullName', 'email', 'skills', 'education', 'workExperience', 'missingFields'],
    };

    // Helper to call Gemini with deterministic temperature 0
    const executeGeminiCall = async (contentsPayload: any) => {
      return await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contentsPayload,
        config: {
          systemInstruction,
          temperature: 0,
          responseMimeType: 'application/json',
          responseSchema,
        },
      });
    };

    const textPayload = `Applicant Resume Content (File: ${cleanFileName}):\n\n${extractedPlainText.slice(0, 20000)}`;
    const nativePdfPayload = {
      parts: [
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: fileBase64 || '',
          },
        },
        {
          text: `Extract the candidate's structured application details from this uploaded PDF resume (${cleanFileName}). Strictly do not invent missing details.`,
        },
      ],
    };

    let parsedJson: any = null;
    let usedNativePdf = false;

    // Strategy:
    // 1. If usable text exists (or document is not a PDF), try text-first extraction.
    // 2. If it's a PDF with little/no text, go straight to native PDF mode.
    // 3. If text-first extraction on a PDF produces an invalid or unparseable result, fall back once to native PDF.
    if (hasUsableText || !isPdf || !hasBase64) {
      try {
        const textResponse = await executeGeminiCall(textPayload);
        const textResult = JSON.parse(textResponse.text || '{}');
        if (textResult && typeof textResult === 'object' && typeof textResult.isResumeOrCv === 'boolean') {
          parsedJson = textResult;
        } else {
          throw new Error('Malformed JSON structure from text extraction');
        }
      } catch (textErr: any) {
        // If it's a temporary availability / quota error, don't fall back, rethrow for retry
        const errStatus = textErr?.status || textErr?.statusCode || textErr?.code;
        const errStr = `${errStatus} ${textErr?.message || ''}`.toLowerCase();
        if (errStatus === 503 || errStatus === 429 || /503|429|resource_exhausted|quota|rate[\s-]limit/i.test(errStr)) {
          throw textErr;
        }

        if (isPdf && hasBase64) {
          console.warn('[ResumeServer] Text-mode response invalid — attempting native-PDF fallback:', textErr?.message);
          console.log('[ResumeServer] Using native-PDF extraction mode.');
          const pdfResponse = await executeGeminiCall(nativePdfPayload);
          parsedJson = JSON.parse(pdfResponse.text || '{}');
          usedNativePdf = true;
        } else {
          throw textErr;
        }
      }
    } else {
      // PDF without usable text: use native PDF directly
      console.log('[ResumeServer] Using native-PDF extraction mode.');
      const pdfResponse = await executeGeminiCall(nativePdfPayload);
      parsedJson = JSON.parse(pdfResponse.text || '{}');
      usedNativePdf = true;
    }

    if (!parsedJson || typeof parsedJson !== 'object' || typeof parsedJson.isResumeOrCv !== 'boolean') {
      throw new Error('Received unparseable or empty response from extraction models');
    }

    if (parsedJson.isResumeOrCv === false) {
      console.log(`[ResumeServer] Document classified as non-resume (${parsedJson.documentType || 'unrelated'}).`);
      return res.status(200).json({
        success: false,
        isInvalidDocumentType: true,
        originalStatus: 422,
        documentType: parsedJson.documentType || 'unrelated_document',
        error:
          'This document does not appear to be a resume or CV. Please choose a different file or enter your information manually.',
      });
    }

    console.log(
      `[ResumeServer] Extraction completed successfully using ${usedNativePdf ? 'native-PDF' : 'extracted-text'} mode for "${parsedJson.fullName || cleanFileName}".`
    );

    return res.status(200).json({
      success: true,
      data: parsedJson,
      extractedText: extractedPlainText,
      source: 'gemini-3.8-flash',
      mode: usedNativePdf ? 'native-pdf' : 'extracted-text',
    });
  } catch (error: any) {
    const errStatus = error?.status || error?.statusCode || error?.code || error?.error?.code;
    const errMessage = error?.message || error?.error?.message || '';
    const errStatusText = error?.statusText || error?.error?.status || '';
    const errStr = `${errStatus} ${errMessage} ${errStatusText} ${JSON.stringify(error?.details || '')}`.toLowerCase();

    const isTemporaryUnavailable =
      errStatus === 503 ||
      errStatus === 429 ||
      errStatus === 'RESOURCE_EXHAUSTED' ||
      /503|429|resource_exhausted|resource exhausted|quota|rate[\s-]limit|too many requests|unavailable|high[\s-]demand|overloaded|temporarily unavailable/i.test(
        errStr
      );

    if (isTemporaryUnavailable) {
      // Treat expected temporary service outage or rate-limit as recoverable status without console.error
      const isRateLimit = errStatus === 429 || /429|resource_exhausted|rate[\s-]limit|too many requests/i.test(errStr);
      const originalStatus = isRateLimit ? 429 : 503;

      // Extract Retry-After if available in headers or details
      let retryAfter: number | null = null;
      const rawRetryAfter =
        error?.headers?.get?.('retry-after') ||
        error?.headers?.['retry-after'] ||
        error?.response?.headers?.get?.('retry-after') ||
        error?.details?.[0]?.metadata?.retry_delay;
      if (rawRetryAfter) {
        const parsed = parseInt(String(rawRetryAfter), 10);
        if (!isNaN(parsed) && parsed > 0 && parsed <= 300) {
          retryAfter = parsed;
        }
      }

      console.warn(`[ResumeServer] Service unavailable/rate-limited (status: ${originalStatus}, retryAfter: ${retryAfter || 'default'}).`);

      return res.status(200).json({
        success: false,
        temporaryUnavailable: true,
        isRateLimited: isRateLimit,
        retryAfter,
        originalStatus,
        error: isRateLimit
          ? 'AI extraction is temporarily rate-limited. Your document is still loaded. Please wait a little while and retry, or enter your information manually.'
          : 'AI resume extraction is temporarily unavailable. Your document has not been processed yet.',
      });
    }

    // Unexpected programming errors should still be logged normally
    console.error('Unexpected error in /api/extract-resume:', error);

    return res.status(200).json({
      success: false,
      unexpectedError: true,
      originalStatus: 500,
      error:
        "We couldn't process this document because of an unexpected extraction error. Your file is still loaded. Please retry or enter your information manually.",
      details: error.message || 'Internal server error',
    });
  }
}

// Bind both primary and preview fallback extraction routes to handleExtractResume
app.post('/api/extract-resume', handleExtractResume);
app.post('/backend/extract-resume', handleExtractResume);

// Health check handler returned for both /api/health and /backend/health
function handleHealthCheck(_req: express.Request, res: express.Response) {
  return res.status(200).json({
    status: 'ok',
    backend: true,
    brand: 'Cascade Peak Outfitters',
    hasGeminiKey: Boolean(apiKey),
  });
}

app.get('/api/health', handleHealthCheck);
app.get('/backend/health', handleHealthCheck);

// Catch-all for undefined /api/* and /backend/* routes so they never fall through to Vite/SPA index.html
app.all(['/api/*', '/backend/*'], (req, res) => {
  return res.status(404).json({
    error: `API route not found: ${req.method} ${req.path}`,
    unexpectedError: true,
  });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Cascade Peak Outfitters portal running on http://localhost:${port}`);
  });
}

startServer();
