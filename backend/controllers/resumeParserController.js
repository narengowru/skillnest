// backend/controllers/resumeParserController.js
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const Freelancer = require('../models/Freelancer');

// ─────────────────────────────────────────────
// HELPER: Check if extracted text is readable
// ─────────────────────────────────────────────
function isReadableText(text) {
    if (!text || text.trim().length < 50) return false;
    const words = text.match(/[a-zA-Z]{3,}/g) || [];
    const totalTokens = text.split(/\s+/).length;
    const readableRatio = words.length / totalTokens;
    return readableRatio > 0.3; // At least 30% should be real English words
}

// ─────────────────────────────────────────────
// METHOD 1: pdf-parse (fix: handle default export)
// ─────────────────────────────────────────────
async function extractWithPdfParse(buffer) {
    try {
        const pdfParseModule = require('pdf-parse');
        // Fix: pdf-parse sometimes exports as .default
        const pdfParse = pdfParseModule.default || pdfParseModule;
        const data = await pdfParse(buffer);
        if (data.text && isReadableText(data.text)) {
            console.log('[Method 1] pdf-parse succeeded, length:', data.text.length);
            return data.text;
        }
        console.log('[Method 1] pdf-parse extracted text but it was not readable');
    } catch (e) {
        console.log('[Method 1] pdf-parse failed:', e.message);
    }
    return null;
}

// ─────────────────────────────────────────────
// METHOD 2: pdfjs-dist
// ─────────────────────────────────────────────
async function extractWithPdfJs(buffer) {
    try {
        // Try multiple import paths for pdfjs-dist
        let pdfjsLib;
        const importPaths = [
            'pdfjs-dist/legacy/build/pdf.js',
            'pdfjs-dist/build/pdf.js',
            'pdfjs-dist',
        ];
        for (const path of importPaths) {
            try {
                pdfjsLib = require(path);
                if (pdfjsLib) break;
            } catch (_) { }
        }
        if (!pdfjsLib) throw new Error('pdfjs-dist not found');

        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
        const pdf = await loadingTask.promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }
        if (isReadableText(fullText)) {
            console.log('[Method 2] pdfjs-dist succeeded, length:', fullText.length);
            return fullText;
        }
        console.log('[Method 2] pdfjs-dist extracted text but it was not readable');
    } catch (e) {
        console.log('[Method 2] pdfjs-dist failed:', e.message);
    }
    return null;
}

// ─────────────────────────────────────────────
// METHOD 3: pdf2json
// ─────────────────────────────────────────────
async function extractWithPdf2Json(buffer) {
    return new Promise((resolve) => {
        try {
            const PDFParser = require('pdf2json');
            const pdfParser = new PDFParser(null, 1); // 1 = raw text mode

            pdfParser.on('pdfParser_dataReady', (pdfData) => {
                try {
                    const text = pdfData.Pages
                        .map(page =>
                            page.Texts
                                .map(t => decodeURIComponent(t.R.map(r => r.T).join('')))
                                .join(' ')
                        )
                        .join('\n');

                    if (isReadableText(text)) {
                        console.log('[Method 3] pdf2json succeeded, length:', text.length);
                        resolve(text);
                    } else {
                        console.log('[Method 3] pdf2json extracted text but it was not readable');
                        resolve(null);
                    }
                } catch (e) {
                    console.log('[Method 3] pdf2json parse error:', e.message);
                    resolve(null);
                }
            });

            pdfParser.on('pdfParser_dataError', (err) => {
                console.log('[Method 3] pdf2json failed:', err.parserError || err);
                resolve(null);
            });

            pdfParser.parseBuffer(buffer);
        } catch (e) {
            console.log('[Method 3] pdf2json not available:', e.message);
            resolve(null);
        }
    });
}

// ─────────────────────────────────────────────
// METHOD 4: Groq Vision API (for scanned PDFs)
// ─────────────────────────────────────────────
async function extractWithGroqVision(buffer) {
    try {
        console.log('[Method 4] Trying Groq Vision API for scanned PDF...');
        const base64 = buffer.toString('base64');

        const completion = await groq.chat.completions.create({
            model: 'meta-llama/llama-4-scout-17b-16e-instruct', // vision-capable model on Groq
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:application/pdf;base64,${base64}`,
                            },
                        },
                        {
                            type: 'text',
                            text: 'This is a resume PDF. Extract ALL the text content from it exactly as it appears. Include name, contact info, education, work experience, skills, achievements, and any other sections. Return only the raw extracted text, nothing else.',
                        },
                    ],
                },
            ],
            max_tokens: 3000,
            temperature: 0,
        });

        const text = completion.choices[0]?.message?.content || '';
        if (isReadableText(text)) {
            console.log('[Method 4] Groq Vision succeeded, length:', text.length);
            return text;
        }
        console.log('[Method 4] Groq Vision returned unreadable text');
    } catch (e) {
        console.log('[Method 4] Groq Vision failed:', e.message);
    }
    return null;
}

// ─────────────────────────────────────────────
// MAIN: Try all extraction methods in order
// ─────────────────────────────────────────────
async function extractTextFromPDF(buffer) {
    // Try each method in order, stop at first success
    const methods = [
        extractWithPdfParse,
        extractWithPdfJs,
        extractWithPdf2Json,
        extractWithGroqVision,
    ];

    for (const method of methods) {
        const text = await method(buffer);
        if (text && isReadableText(text)) {
            return text;
        }
    }

    return null;
}

// ─────────────────────────────────────────────
// MAIN CONTROLLER
// ─────────────────────────────────────────────
exports.parseResume = async (req, res) => {
    try {
        // ── Validate request ──────────────────────────────
        if (!req.file) {
            return res.status(400).json({ message: 'No resume file uploaded.' });
        }

        const freelancerId = req.body.freelancerId;
        if (!freelancerId) {
            return res.status(400).json({ message: 'Freelancer ID is required.' });
        }

        const freelancer = await Freelancer.findById(freelancerId);
        if (!freelancer) {
            return res.status(404).json({ message: 'Freelancer not found.' });
        }

        // ── Extract text from PDF ─────────────────────────
        const buffer = Buffer.from(req.file.buffer);
        console.log('Starting PDF extraction, buffer size:', buffer.length);

        const extractedText = await extractTextFromPDF(buffer);

        if (!extractedText || !isReadableText(extractedText)) {
            return res.status(422).json({
                message:
                    'Could not extract readable text from this PDF. Please ensure it is a text-based PDF (not a low-quality scanned image) or try a different file.',
            });
        }

        // ── Prepare text for Groq ─────────────────────────
        const trimmedText = extractedText.slice(0, 6000);
        console.log('Sending to Groq, text length:', trimmedText.length);
        console.log('Text preview:', trimmedText.slice(0, 300));

        // ── Call Groq ─────────────────────────────────────
        const prompt = `You are a professional resume parser. Extract structured profile information from the resume text below.

Return ONLY a valid JSON object with NO extra text, explanation, or markdown. Follow this exact schema:

{
  "bio": "A professional 2-3 sentence summary about the person",
  "skills": [{ "name": "Skill Name", "level": 75 }],
  "education": {
    "university": "",
    "degree": "",
    "year": "",
    "gpa": "",
    "relevantCourses": []
  },
  "achievements": [{ "title": "", "icon": "🏆", "date": "" }],
  "location": "",
  "languages": []
}

Rules:
- skill level: beginner=30, familiar=45, intermediate=60, proficient=75, advanced=85, expert=95
- Max 10 skills, max 5 achievements
- Icons: 🏆 🚀 🥇 🎯 ⭐ 🔥 📜 💡
- Empty string "" for missing fields, [] for missing arrays
- Return ONLY the JSON object, no markdown, no backticks

Resume Text:
${trimmedText}`;

        let parsed;
        try {
            const completion = await groq.chat.completions.create({
                model: 'llama-3.1-8b-instant',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1,
                max_tokens: 1500,
            });

            const rawResponse = completion.choices[0].message.content.trim();
            console.log('Groq raw response preview:', rawResponse.slice(0, 300));

            // Strip any accidental markdown code fences
            const cleaned = rawResponse
                .replace(/^```json\s*/i, '')
                .replace(/^```\s*/i, '')
                .replace(/```\s*$/i, '')
                .trim();

            parsed = JSON.parse(cleaned);
            console.log('Groq parsed data:', JSON.stringify(parsed, null, 2));
        } catch (aiErr) {
            console.error('Groq error:', aiErr.message);
            return res.status(500).json({ message: 'AI parsing failed: ' + aiErr.message });
        }

        // ── Sanitize parsed data ──────────────────────────
        const sanitized = {
            bio: typeof parsed.bio === 'string' ? parsed.bio.slice(0, 1000) : '',
            skills: Array.isArray(parsed.skills)
                ? parsed.skills
                    .filter(s => s && s.name)
                    .map(s => ({
                        name: String(s.name).slice(0, 50),
                        level: Math.min(100, Math.max(1, Number(s.level) || 60)),
                    }))
                    .slice(0, 10)
                : [],
            education: {
                university: parsed.education?.university?.slice(0, 200) || '',
                degree: parsed.education?.degree?.slice(0, 200) || '',
                year: parsed.education?.year?.slice(0, 10) || '',
                gpa: parsed.education?.gpa?.slice(0, 10) || '',
                relevantCourses: Array.isArray(parsed.education?.relevantCourses)
                    ? parsed.education.relevantCourses
                        .map(c => String(c).slice(0, 100))
                        .slice(0, 10)
                    : [],
            },
            achievements: Array.isArray(parsed.achievements)
                ? parsed.achievements
                    .filter(a => a && a.title)
                    .map(a => ({
                        title: String(a.title).slice(0, 200),
                        icon: String(a.icon || '🏆'),
                        date: String(a.date || '').slice(0, 50),
                    }))
                    .slice(0, 5)
                : [],
            location: typeof parsed.location === 'string' ? parsed.location.slice(0, 100) : '',
            languages: Array.isArray(parsed.languages)
                ? parsed.languages.map(l => String(l).slice(0, 50)).slice(0, 10)
                : [],
        };

        // ── Save to DB ────────────────────────────────────
        const updateFields = {};
        if (sanitized.bio) updateFields.bio = sanitized.bio;
        if (sanitized.skills.length > 0) updateFields.skills = sanitized.skills;
        if (sanitized.location) updateFields.location = sanitized.location;
        if (sanitized.languages.length > 0) updateFields.languages = sanitized.languages;
        if (sanitized.achievements.length > 0) updateFields.achievements = sanitized.achievements;
        if (sanitized.education.university || sanitized.education.degree) {
            updateFields.education = sanitized.education;
        }

        if (Object.keys(updateFields).length > 0) {
            // FIX: Only call findByIdAndUpdate ONCE (original code called it twice)
            await Freelancer.findByIdAndUpdate(freelancerId, updateFields);
            console.log('Saved fields to DB:', Object.keys(updateFields));
        } else {
            console.log('Nothing to save — Groq returned empty data');
        }

        return res.status(200).json({
            message: 'Resume parsed successfully',
            parsed: sanitized,
            savedFields: Object.keys(updateFields),
        });

    } catch (err) {
        console.error('parseResume error:', err);
        return res.status(500).json({ message: 'Server error during resume parsing.' });
    }
};