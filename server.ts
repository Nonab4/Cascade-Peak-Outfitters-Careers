import express from 'express';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import mammoth from 'mammoth';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

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
    try {
      const pdfData = await pdfParse(buffer);
      return pdfData.text || '';
    } catch (err) {
      console.warn('pdfParse failed, returning empty text:', err);
      return '';
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
        error: 'AI resume extraction is temporarily unavailable due to high demand. Please try again.',
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
        fallbackNeeded: true,
      });
    }

    if (!ai) {
      return res.status(200).json({
        success: false,
        fallbackNeeded: true,
        extractedText: extractedPlainText,
        message: 'GEMINI_API_KEY not configured on server. Switching to local structured intake parser.',
      });
    }

    const systemInstruction = `You are an applicant data extraction specialist for the Cascade Peak Outfitters recruitment portal prototype.
The company receives about 4,800 applications per year and is testing this front-end prototype to standardize applicant intake.

CRITICAL INSTRUCTIONS:
1. STRICT ACCURACY: Do NOT invent, assume, extrapolate, or hallucinate missing information.
2. If any field (full name, email, phone number, location, education graduation year, skills) is not explicitly stated in the resume, leave it as an empty string ("") or empty array ([]).
3. Identify all missing required fields and list them explicitly in "missingFields" (e.g., "Full Name", "Email Address", "Phone Number", "Location", "Education", "Graduation Year", "Work Experience").
4. Normalize dates into readable standard formats (e.g. "Jun 2021 - Present" or "2019 - 2023").
5. Do NOT include fictional company facts, salaries, or marketing claims.`;

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
            fullName: { type: Type.STRING, description: 'Full legal name, empty string if missing' },
            email: { type: Type.STRING, description: 'Email address, empty string if missing' },
            phone: { type: Type.STRING, description: 'Phone number, empty string if missing' },
            location: { type: Type.STRING, description: 'City and State/Country, empty string if missing' },
            summary: { type: Type.STRING, description: 'Professional summary, empty string if not found' },
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
              description: 'Names of standard fields missing from the resume',
            },
            extractionConfidenceNotes: {
              type: Type.STRING,
              description: 'Audit note summarizing extraction completeness and flagged missing items',
            },
          },
          required: ['fullName', 'email', 'skills', 'education', 'workExperience', 'missingFields'],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');
    return res.json({
      success: true,
      data: parsedJson,
      extractedText: extractedPlainText,
      source: 'gemini-3.8-flash',
    });
  } catch (error: any) {
    console.error('Error in /api/extract-resume:', error);

    const errStr = String(error?.message || error?.statusText || '');
    const isTemporaryUnavailable =
      error?.status === 503 ||
      error?.statusCode === 503 ||
      error?.code === 503 ||
      /503|unavailable|high[\s-]demand|overloaded|resource exhausted|rate limit|temporarily unavailable/i.test(errStr);

    if (isTemporaryUnavailable) {
      return res.status(503).json({
        error: 'AI resume extraction is temporarily unavailable due to high demand. Please try again.',
        temporaryUnavailable: true,
      });
    }

    return res.status(500).json({
      error: error.message || 'Failed to extract resume with AI.',
      fallbackNeeded: true,
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
