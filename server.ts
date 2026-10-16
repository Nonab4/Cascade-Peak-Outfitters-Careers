import express from 'express';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));

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
    mimeType.includes('msword') ||
    lowerName.endsWith('.docx') ||
    lowerName.endsWith('.doc')
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    } catch (err) {
      console.warn('mammoth docx extraction failed:', err);
      return '';
    }
  }

  // Default to utf-8 text
  return buffer.toString('utf-8');
}

// POST /api/extract-resume
app.post('/api/extract-resume', async (req, res) => {
  try {
    const { resumeText, fileBase64, mimeType, fileName, simulate503 } = req.body;

    if (simulate503 || req.query.simulate503 === 'true') {
      return res.status(503).json({
        error: 'AI resume extraction is temporarily unavailable. Your document has not been processed yet.',
        temporaryUnavailable: true,
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
      return res.status(400).json({
        error: 'Unable to extract text from the uploaded document. Please ensure it is a valid PDF, DOCX, or text file.',
        fallbackNeeded: false,
      });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'AI resume extraction is temporarily unavailable. Your document has not been processed yet.',
        temporaryUnavailable: true,
      });
    }

    const systemInstruction = `You are an applicant data extraction specialist for the Cascade Peak Outfitters recruitment portal prototype.
The company receives about 4,800 applications per year and is testing this front-end prototype to standardize applicant intake.

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
2. STRICT ACCURACY: Do NOT invent, assume, extrapolate, or hallucinate missing information.
3. NO PLACEHOLDERS: Do NOT generate placeholder values such as "Organization / Company", "Higher Education Institution", "Degree Completed", section headings, partial summary sentences, or other inferred information as applicant records.
4. CLEAR RECORDS ONLY: Only create education or work-experience entries when the source document contains a clearly identified record. If none is clearly identifiable, return an empty array [].
5. WORK EXPERIENCE IS OPTIONAL: If work experience is found, extract and display it. If none is present, return an empty array []. Missing work experience must not count as an error and must NOT be added to missingFields.
6. UNCERTAIN FIELDS: If extraction succeeds but any field is uncertain or not explicitly stated, leave it blank (empty string "" or empty array []) or flag it in "missingFields" rather than guessing.
7. SKILLS ARE OPTIONAL: Extract only skills and competencies explicitly stated in the resume. If none are explicitly stated, return an empty array []. Skills are optional and must NOT be added to missingFields.
8. MISSING FIELDS: Identify missing standard required fields and list them explicitly in "missingFields" (e.g., "Full Name", "Email Address", "Phone Number", "Location", "Education History", "Graduation Year"). Do NOT flag Work Experience or Skills.
9. DATES: Normalize dates into standard readable formats. For education, graduationYear must be a 4-digit year (e.g. "2022") if explicitly stated; otherwise leave empty string "".
10. FACTUAL INTEGRITY: Do NOT include fictional company facts, salaries, or marketing claims.`;

    // Prepare contents: for PDF, we can pass native inlineData or the extracted text
    let contentsPayload: any;

    if (cleanMimeType === 'application/pdf' && fileBase64) {
      contentsPayload = {
        parts: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: fileBase64,
            },
          },
          {
            text: `Extract the candidate's structured application details from this uploaded PDF resume (${cleanFileName}). Strictly do not invent missing details.`,
          },
        ],
      };
    } else {
      contentsPayload = `Applicant Resume Content (File: ${cleanFileName}):\n\n${extractedPlainText.slice(0, 15000)}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contentsPayload,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isResumeOrCv: {
              type: Type.BOOLEAN,
              description: 'Whether the document reasonably appears to be a resume or CV (true) or an unrelated document like an essay, academic paper, invoice, report, or class assignment (false)',
            },
            documentType: {
              type: Type.STRING,
              description: 'Classification: resume, cv, academic_paper, essay, report, invoice, class_assignment, other',
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
        },
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');

    if (parsedJson.isResumeOrCv === false) {
      return res.status(422).json({
        success: false,
        isInvalidDocumentType: true,
        documentType: parsedJson.documentType || 'unrelated_document',
        error: 'This document does not appear to be a resume or CV. Please choose a different file or enter your information manually.',
      });
    }

    return res.json({
      success: true,
      data: parsedJson,
      extractedText: extractedPlainText,
      source: 'gemini-3.8-flash',
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
      return res.status(503).json({
        error: 'AI resume extraction is temporarily unavailable. Your document has not been processed yet.',
        temporaryUnavailable: true,
      });
    }

    // Unexpected programming errors should still be logged normally
    console.error('Unexpected error in /api/extract-resume:', error);

    return res.status(500).json({
      error:
        "We couldn't process this document because of an unexpected extraction error. Your file is still loaded. Please retry or enter your information manually.",
      unexpectedError: true,
      details: error.message || 'Internal server error',
    });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    brand: 'Cascade Peak Outfitters',
    hasGeminiKey: Boolean(apiKey),
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
