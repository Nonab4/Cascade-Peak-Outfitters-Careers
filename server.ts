import express from 'express';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '20mb' }));

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

// POST /api/extract-resume
app.post('/api/extract-resume', async (req, res) => {
  try {
    const { resumeText, fileName } = req.body;

    if (!resumeText || typeof resumeText !== 'string' || !resumeText.trim()) {
      return res.status(400).json({
        error: 'Resume text is required for AI extraction.',
      });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY not configured on server.',
        fallbackNeeded: true,
      });
    }

    const systemInstruction = `You are a senior recruitment operations and data extraction specialist at Cascade Peak Outfitters, a premier Pacific Northwest outdoor apparel and equipment brand.
Cascade Peak Outfitters receives ~4,800 applications per year and is standardizing its applicant intake to eliminate manual HR data entry.
Your task is to extract structured applicant details from the uploaded resume text.

CRITICAL INSTRUCTIONS:
1. STRICT HONESTY: Do NOT invent, assume, extrapolate, or hallucinate missing information.
2. If any field (e.g. phone number, degree, graduation year, location, company name, skills) is not explicitly present in the resume text, leave it as an empty string ("") or empty array ([]).
3. Identify all critical missing fields and list them explicitly in "missingFields" (e.g., "phone", "location", "skills", "education", "experience") so the candidate can be alerted to review and supply them.
4. Normalize dates into readable formats (e.g. "Jun 2021 - Present" or "2019 - 2023").
5. Extract a concise 2-sentence executive summary based ONLY on stated facts.`;

    const prompt = `Applicant Resume Content (File: ${fileName || 'uploaded_resume.txt'}):\n\n${resumeText.slice(0, 15000)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullName: { type: Type.STRING, description: 'Full legal or preferred name, empty if missing' },
            email: { type: Type.STRING, description: 'Email address, empty if missing' },
            phone: { type: Type.STRING, description: 'Phone number, empty if missing' },
            location: { type: Type.STRING, description: 'City and State/Country, empty if missing' },
            summary: { type: Type.STRING, description: 'Brief professional summary, empty if not found' },
            skills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Explicitly mentioned skills and certifications',
            },
            education: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  institution: { type: Type.STRING },
                  degree: { type: Type.STRING },
                  fieldOfStudy: { type: Type.STRING },
                  graduationYear: { type: Type.STRING },
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
              description: 'Names of standard fields that are missing in the resume (e.g. phone, location, education, skills, experience)',
            },
            extractionConfidenceNotes: {
              type: Type.STRING,
              description: 'Brief audit note summarizing extraction completeness and what was flagged as missing',
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
      source: 'gemini-3.8-flash',
    });
  } catch (error: any) {
    console.error('Error in /api/extract-resume:', error);
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
