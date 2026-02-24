// controllers/aiAssistantController.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const KNOWLEDGE_DIR = path.join(__dirname, '..', 'ai', 'ai-knowledge');

// ─── Load all knowledge files into memory at startup ─────────────────────────
const knowledgeFiles = {};

const loadAllFiles = () => {
    const categories = ['platform', 'payments', 'disputes', 'ranking'];
    for (const category of categories) {
        const dir = path.join(KNOWLEDGE_DIR, category);
        if (!fs.existsSync(dir)) continue;
        for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.txt'))) {
            const key = `${category}/${file.replace('.txt', '')}`;
            knowledgeFiles[key] = fs.readFileSync(path.join(dir, file), 'utf-8').trim();
        }
    }
};

loadAllFiles();

// ─── Keyword routing map ──────────────────────────────────────────────────────
// Each entry: [keywords[], files[]]
const ROUTING_RULES = [
    {
        keywords: ['withdraw', 'withdrawal', 'bank', 'transfer', 'payout', 'cashout', 'cash out'],
        files: ['payments/withdrawal', 'payments/commission']
    },
    {
        keywords: ['escrow', 'payment hold', 'payment release', 'money held', 'payment safe', 'payment secure', 'payment system'],
        files: ['payments/escrow']
    },
    {
        keywords: ['commission', 'fee', 'cut', 'percentage', 'platform charge', '10%'],
        files: ['payments/commission']
    },
    {
        keywords: ['dispute', 'complaint', 'issue', 'problem with client', 'problem with freelancer', 'bad work', 'not happy', 'unsatisfied'],
        files: ['disputes/dispute_process', 'disputes/refund_rules']
    },
    {
        keywords: ['refund', 'money back', 'return payment', 'get money back'],
        files: ['disputes/refund_rules', 'disputes/dispute_process']
    },
    {
        keywords: ['verify', 'verification', 'student id', 'verified', 'id card', 'document', 'college id'],
        files: ['platform/verification']
    },
    {
        keywords: ['edit profile', 'update profile', 'change profile', 'profile editing', 'how to edit', 'save profile'],
        files: ['platform/profile_editing']
    },
    {
        keywords: ['not getting', 'no projects', 'not selected', 'improve profile', 'tips', 'advice', 'suggestions', 'how to get more'],
        files: ['platform/not_getting_projects', 'platform/profile_editing']
    },
    {
        keywords: ['limit', 'capacity', 'max projects', 'maximum', 'how many projects', 'active projects'],
        files: ['platform/capacity_limiter']
    },
    {
        keywords: ['rating', 'stars', 'score', 'rated', 'review score', 'reputation'],
        files: ['ranking/rating_formula']
    },
    {
        keywords: ['match', 'recommend', 'how are freelancers', 'algorithm', 'ranking', 'recommendation'],
        files: ['ranking/matching_logic', 'ranking/rating_formula']
    },
    {
        keywords: ['how does it work', 'workflow', 'process', 'steps', 'how to post', 'how to apply', 'bid', 'bidding', 'proposal'],
        files: ['platform/workflow', 'platform/roles']
    },
    {
        keywords: ['what is skillnest', 'about skillnest', 'overview', 'platform', 'who is it for', 'purpose'],
        files: ['platform/overview', 'platform/roles']
    },
    {
        keywords: ['role', 'client', 'freelancer', 'student', 'admin', 'who can'],
        files: ['platform/roles', 'platform/overview']
    },
];

// Default fallback files when no keyword matches
const DEFAULT_FILES = ['platform/overview', 'platform/workflow', 'platform/roles'];

// ─── Pick relevant knowledge for a given message ─────────────────────────────
const getRelevantKnowledge = (message) => {
    const lower = message.toLowerCase();
    const matchedFiles = new Set();

    for (const rule of ROUTING_RULES) {
        if (rule.keywords.some(kw => lower.includes(kw))) {
            rule.files.forEach(f => matchedFiles.add(f));
        }
    }

    // Fall back to default if nothing matched
    const filesToUse = matchedFiles.size > 0 ? [...matchedFiles] : DEFAULT_FILES;

    // Build context string from matched files
    const context = filesToUse
        .filter(key => knowledgeFiles[key])
        .map(key => `[${key.toUpperCase()}]\n${knowledgeFiles[key]}`)
        .join('\n\n---\n\n');

    return { context, filesUsed: filesToUse };
};

// ─── Base system prompt (no knowledge injected here — added per-request) ──────
const BASE_SYSTEM_PROMPT = `You are SkillNest AI, a friendly assistant for the SkillNest freelancing platform — a student-focused marketplace connecting student freelancers with clients.

You will be given relevant platform knowledge below. Use ONLY that knowledge to answer. Keep responses concise (2-5 sentences), friendly, and accurate.

If the answer is not in the provided knowledge, say you are not sure and suggest contacting support. Do NOT make up policies or features.`;

// ─── Chat handler ─────────────────────────────────────────────────────────────
exports.chat = async (req, res) => {
    try {
        const { message, conversationHistory = [] } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        if (!GROQ_API_KEY) {
            return res.status(500).json({ success: false, message: 'AI service not configured.' });
        }

        // Route the message to relevant knowledge file(s)
        const { context, filesUsed } = getRelevantKnowledge(message.trim());
        console.log(`[AI] Routing to: ${filesUsed.join(', ')}`);

        // Build dynamic system prompt with only the relevant knowledge
        const systemPrompt = `${BASE_SYSTEM_PROMPT}\n\n===== RELEVANT KNOWLEDGE =====\n\n${context}\n\n===== END =====`;

        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory.slice(-10),
            { role: 'user', content: message.trim() }
        ];

        const response = await axios.post(
            GROQ_API_URL,
            { model: 'llama-3.3-70b-versatile', messages, max_tokens: 500, temperature: 0.7 },
            {
                headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
                timeout: 30000
            }
        );

        const aiReply = response.data.choices?.[0]?.message?.content;
        if (!aiReply) throw new Error('No response from AI service');

        res.status(200).json({
            success: true,
            message: 'AI response generated successfully',
            data: { reply: aiReply, model: response.data.model, usage: response.data.usage }
        });

    } catch (error) {
        console.error('Error in AI assistant:', error?.response?.data || error.message);

        if (error.response?.status === 401) {
            return res.status(500).json({ success: false, message: 'AI service authentication failed.' });
        }
        if (error.response?.status === 429) {
            return res.status(429).json({ success: false, message: 'Rate limit reached. Try again in a moment.' });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to get AI response. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ─── Suggested questions based on user type ───────────────────────────────────
exports.getSuggestions = async (req, res) => {
    const { userType } = req.query;

    const clientSuggestions = [
        "How do I post a job on SkillNest?",
        "How can I find the right freelancer for my project?",
        "How does the escrow payment system work?",
        "What happens if I'm not satisfied with the work?",
        "How do I leave a review for a freelancer?"
    ];

    const freelancerSuggestions = [
        "How do I apply for projects on SkillNest?",
        "How can I improve my profile to get more projects?",
        "How does the commission and payment withdrawal work?",
        "What is the project capacity limit per month?",
        "How do I get my student account verified?"
    ];

    res.status(200).json({
        success: true,
        data: { suggestions: userType === 'Freelancer' ? freelancerSuggestions : clientSuggestions }
    });
};