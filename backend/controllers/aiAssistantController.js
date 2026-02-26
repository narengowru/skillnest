// controllers/aiAssistantController.js
//
// Hybrid AI Assistant — three-mode architecture:
//   1. FAQ / Platform questions  → Knowledge file routing (existing system, preserved)
//   2. Data questions            → Tool calling → safe internal API queries
//   3. Personalised suggestions  → Recommendation engine tool
//
// Security contract:
//   • AI never touches MongoDB directly
//   • AI never calls admin or auth routes
//   • All tool execution is validated + sanitised before the DB/service call
//   • Only whitelisted query params are forwarded

'use strict';

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Freelancer = require('../models/Freelancer');
const recommendationService = require('../services/recommendationService');

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const KNOWLEDGE_DIR = path.join(__dirname, '..', 'ai', 'ai-knowledge');

// ─────────────────────────────────────────────────────────────────────────────
// Knowledge file loader  (unchanged from original)
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Keyword routing  (unchanged from original)
// ─────────────────────────────────────────────────────────────────────────────
const ROUTING_RULES = [
    { keywords: ['withdraw', 'withdrawal', 'bank', 'transfer', 'payout', 'cashout', 'cash out'], files: ['payments/withdrawal', 'payments/commission'] },
    { keywords: ['escrow', 'payment hold', 'payment release', 'money held', 'payment safe', 'payment secure', 'payment system'], files: ['payments/escrow'] },
    { keywords: ['commission', 'fee', 'cut', 'percentage', 'platform charge', '10%'], files: ['payments/commission'] },
    { keywords: ['dispute', 'complaint', 'issue', 'problem with client', 'problem with freelancer', 'bad work', 'not happy', 'unsatisfied'], files: ['disputes/dispute_process', 'disputes/refund_rules'] },
    { keywords: ['refund', 'money back', 'return payment', 'get money back'], files: ['disputes/refund_rules', 'disputes/dispute_process'] },
    { keywords: ['verify', 'verification', 'student id', 'verified', 'id card', 'document', 'college id'], files: ['platform/verification'] },
    { keywords: ['edit profile', 'update profile', 'change profile', 'profile editing', 'how to edit', 'save profile'], files: ['platform/profile_editing'] },
    { keywords: ['not getting', 'no projects', 'not selected', 'improve profile', 'tips', 'advice', 'suggestions', 'how to get more'], files: ['platform/not_getting_projects', 'platform/profile_editing'] },
    { keywords: ['limit', 'capacity', 'max projects', 'maximum', 'how many projects', 'active projects'], files: ['platform/capacity_limiter'] },
    { keywords: ['rating', 'stars', 'score', 'rated', 'review score', 'reputation'], files: ['ranking/rating_formula'] },
    { keywords: ['match', 'recommend', 'how are freelancers', 'algorithm', 'ranking', 'recommendation'], files: ['ranking/matching_logic', 'ranking/rating_formula'] },
    { keywords: ['how does it work', 'workflow', 'process', 'steps', 'how to post', 'how to apply', 'bid', 'bidding', 'proposal'], files: ['platform/workflow', 'platform/roles'] },
    { keywords: ['what is skillnest', 'about skillnest', 'overview', 'platform', 'who is it for', 'purpose'], files: ['platform/overview', 'platform/roles'] },
    { keywords: ['role', 'client', 'freelancer', 'student', 'admin', 'who can'], files: ['platform/roles', 'platform/overview'] },
    { keywords: ['contact', 'support', 'customer care', 'help desk', 'reach out', 'email support', 'phone support', 'whatsapp', 'customer service', 'get help', 'talk to someone', 'speak to', 'human support', 'live support'], files: ['platform/customer_care'] },
];
const DEFAULT_FILES = ['platform/overview', 'platform/workflow', 'platform/roles', 'platform/customer_care'];

const getRelevantKnowledge = (message) => {
    const lower = message.toLowerCase();
    const matchedFiles = new Set();
    for (const rule of ROUTING_RULES) {
        if (rule.keywords.some(kw => lower.includes(kw))) rule.files.forEach(f => matchedFiles.add(f));
    }
    const filesToUse = matchedFiles.size > 0 ? [...matchedFiles] : DEFAULT_FILES;
    const context = filesToUse
        .filter(key => knowledgeFiles[key])
        .map(key => `[${key.toUpperCase()}]\n${knowledgeFiles[key]}`)
        .join('\n\n---\n\n');
    return { context, filesUsed: filesToUse };
};

// ─────────────────────────────────────────────────────────────────────────────
// Tool definitions  (Groq / OpenAI function-calling schema)
// ─────────────────────────────────────────────────────────────────────────────
const TOOL_DEFINITIONS = [
    {
        type: 'function',
        function: {
            name: 'search_freelancers',
            description: 'Search for freelancers on SkillNest by skill, price range, or minimum rating. Use when the user asks to find, browse, or filter freelancers.',
            parameters: {
                type: 'object',
                properties: {
                    skill: {
                        type: 'string',
                        description: 'Skill or technology to search for, e.g. "React", "Python", "Graphic Design".'
                    },
                    minPrice: {
                        type: 'number',
                        description: 'Minimum hourly rate or project price in USD.'
                    },
                    maxPrice: {
                        type: 'number',
                        description: 'Maximum hourly rate or project price in USD.'
                    },
                    minRating: {
                        type: 'number',
                        description: 'Minimum average rating (0–5).'
                    },
                    limit: {
                        type: 'integer',
                        description: 'Maximum number of results to return (1–10, default 5).'
                    }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_freelancer_recommendations',
            description: 'Get personalised freelancer recommendations for a specific client using the SkillNest recommendation engine.',
            parameters: {
                type: 'object',
                properties: {
                    clientId: {
                        type: 'string',
                        description: 'The MongoDB ObjectId of the client requesting recommendations.'
                    },
                    limit: {
                        type: 'integer',
                        description: 'Number of recommendations to return (1–10, default 5).'
                    },
                    minScore: {
                        type: 'number',
                        description: 'Minimum recommendation score threshold (0–1).'
                    }
                },
                required: ['clientId']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_job_recommendations',
            description: 'Get personalised job recommendations for a specific freelancer using the SkillNest recommendation engine.',
            parameters: {
                type: 'object',
                properties: {
                    freelancerId: {
                        type: 'string',
                        description: 'The MongoDB ObjectId of the freelancer requesting job recommendations.'
                    },
                    limit: {
                        type: 'integer',
                        description: 'Number of recommendations to return (1–10, default 5).'
                    },
                    minScore: {
                        type: 'number',
                        description: 'Minimum recommendation score threshold (0–1).'
                    },
                    excludeApplied: {
                        type: 'boolean',
                        description: 'Whether to exclude jobs the freelancer has already applied to.'
                    }
                },
                required: ['freelancerId']
            }
        }
    }
];

// ─────────────────────────────────────────────────────────────────────────────
// Input sanitisation & validation helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Validates that a string looks like a MongoDB ObjectId (24 hex chars). */
const isValidObjectId = (id) => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id);

/** Clamps a number between min and max, returns undefined if not a number. */
const clampNumber = (val, min, max) => {
    const n = Number(val);
    if (isNaN(n)) return undefined;
    return Math.min(Math.max(n, min), max);
};

/** Strips any characters that aren't alphanumeric, spaces, hyphens, or dots from skill strings. */
const sanitiseSkillString = (s) =>
    typeof s === 'string' ? s.replace(/[^a-zA-Z0-9 .+#\-]/g, '').trim().slice(0, 60) : undefined;

// ─────────────────────────────────────────────────────────────────────────────
// Secure tool executor
//   Calls the recommendation service and DB models DIRECTLY — no HTTP round-trip.
//   This works in every environment without any localhost assumption.
// ─────────────────────────────────────────────────────────────────────────────
const executeToolCall = async (toolName, rawArgs) => {
    switch (toolName) {

        // ── search_freelancers: query MongoDB directly ────────────────────────
        case 'search_freelancers': {
            const skill = sanitiseSkillString(rawArgs.skill);
            const minRating = clampNumber(rawArgs.minRating, 0, 5);
            const limit = clampNumber(rawArgs.limit, 1, 10) || 5;

            // Build Mongoose query
            const query = {};
            if (skill) {
                // Match skill name case-insensitively
                query['skills.name'] = { $regex: skill, $options: 'i' };
            }
            if (minRating != null) {
                query['ratings.average'] = { $gte: minRating };
            }

            console.log(`[AI Tool] search_freelancers query:`, JSON.stringify(query));

            const docs = await Freelancer
                .find(query)
                .select('name username skills ratings hourlyRate minPrice maxPrice bio isVerified')
                .limit(limit)
                .lean();

            const freelancers = docs.map(f => ({
                id: f._id,
                name: f.name || f.username,
                skills: Array.isArray(f.skills) ? f.skills.slice(0, 6).map(s => s.name || s) : [],
                rating: f.ratings?.average ?? f.rating,
                minPrice: f.minPrice ?? f.hourlyRate,
                maxPrice: f.maxPrice,
                bio: typeof f.bio === 'string' ? f.bio.slice(0, 120) : undefined,
                verified: f.isVerified ?? f.verified
            }));

            return { freelancers, total: freelancers.length };
        }

        // ── get_freelancer_recommendations: use recommendation service ────────
        case 'get_freelancer_recommendations': {
            const { clientId, limit: rawLimit, minScore } = rawArgs;

            console.log(`[AI Tool] get_freelancer_recommendations args:`, rawArgs);

            if (!clientId) return { error: 'clientId is missing.' };
            if (!isValidObjectId(clientId)) return { error: `Invalid clientId: "${clientId}".` };

            const limit = clampNumber(rawLimit, 1, 10) || 5;
            const opts = { limit, minScore: minScore != null ? clampNumber(minScore, 0, 100) : 30 };

            const result = await recommendationService.getFreelancerRecommendations(clientId, opts);
            const recommendations = (result.recommendations || []).slice(0, limit).map(r => ({
                freelancer: {
                    id: r.freelancer?._id,
                    name: r.freelancer?.name,
                    skills: Array.isArray(r.freelancer?.skills)
                        ? r.freelancer.skills.slice(0, 6).map(s => s.name || s)
                        : [],
                    rating: r.freelancer?.ratings?.average,
                    verified: r.freelancer?.isVerified,
                    matchReasons: r.matchReasons
                },
                score: r.matchScore
            }));

            return { recommendations, total: recommendations.length };
        }

        // ── get_job_recommendations: use recommendation service ───────────────
        case 'get_job_recommendations': {
            const { freelancerId, limit: rawLimit, minScore, excludeApplied } = rawArgs;

            console.log(`[AI Tool] get_job_recommendations args:`, rawArgs);

            if (!freelancerId) return { error: 'freelancerId is missing.' };
            if (!isValidObjectId(freelancerId)) return { error: `Invalid freelancerId: "${freelancerId}".` };

            const limit = clampNumber(rawLimit, 1, 10) || 5;
            const opts = {
                limit,
                minScore: minScore != null ? clampNumber(minScore, 0, 100) : 10,
                excludeApplied: excludeApplied != null ? Boolean(excludeApplied) : false
            };

            const result = await recommendationService.getJobRecommendations(freelancerId, opts);
            const recommendations = (result.recommendations || []).slice(0, limit).map(r => ({
                job: {
                    id: r.job?._id,
                    title: r.job?.title,
                    link: r.job?._id ? `/details/${r.job._id}` : undefined,
                    description: typeof r.job?.description === 'string'
                        ? r.job.description.slice(0, 150) : undefined,
                    budget: r.job?.budget,
                    skills: Array.isArray(r.job?.skills) ? r.job.skills.slice(0, 6) : [],
                    matchReasons: r.matchReasons
                },
                score: r.matchScore
            }));

            return { recommendations, total: recommendations.length };
        }

        default:
            return { error: `Unknown tool: ${toolName}` };
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Intent classifier
//   Determines whether the message needs tool calling, knowledge lookup, or both.
//   This keeps a single LLM call cheap for simple FAQ questions.
// ─────────────────────────────────────────────────────────────────────────────
const DATA_KEYWORDS = [
    // Freelancer search
    'find freelancer', 'search freelancer', 'show me freelancer', 'list freelancer',
    'recommend freelancer', 'suggest freelancer', 'who can do', 'find someone',
    'best freelancer', 'top freelancer', 'available freelancer',
    // Job recommendations
    'recommend job', 'suggest job', 'find job', 'show job', 'matching job',
    'show me', 'best job', 'jobs for me', 'job for me',
    'based on my skill', 'based on my skills', 'for my skill',
    'suggest me job', 'suggest me jobs', 'suggest jobs',
    'my profile', 'suitable job', 'relevant job', 'good fit',
    // Price / search
    'budget', 'hourly rate', 'cheap freelancer', 'affordable',
    // Generic recommendation phrases
    'recommend', 'suggestions for me', 'freelancer for me', 'freelancer for my',
];

const needsToolCall = (message) => {
    const lower = message.toLowerCase();
    return DATA_KEYWORDS.some(kw => lower.includes(kw));
};

// ─────────────────────────────────────────────────────────────────────────────
// Context injector
//   Builds a context block appended to the user message so the AI knows
//   who is logged in — without the AI needing to ask.
// ─────────────────────────────────────────────────────────────────────────────
const buildUserContext = ({ userId, userType }) => {
    if (!userId) return '';
    // Normalise userType to lowercase for consistent comparison
    const role = (userType || '').toLowerCase().trim();
    const lines = [
        `[CONTEXT] The currently logged-in user has ID: ${userId}`,
        `Their role on the platform is: ${role}`
    ];
    if (role === 'freelancer') {
        lines.push(
            'This user is a FREELANCER looking for jobs.',
            'Call get_job_recommendations with freelancerId set to: ' + userId,
            'Do NOT ask the user for their ID — use it directly from this context.'
        );
    } else if (role === 'client') {
        lines.push(
            'This user is a CLIENT looking for freelancers.',
            'Call get_freelancer_recommendations with clientId set to: ' + userId,
            'Do NOT ask the user for their ID — use it directly from this context.'
        );
    } else {
        lines.push(
            'When calling get_job_recommendations, use this ID as freelancerId.',
            'When calling get_freelancer_recommendations, use this ID as clientId.',
            'Do NOT ask the user for their ID — you already have it.'
        );
    }
    return '\n\n' + lines.join('\n');
};

// ─────────────────────────────────────────────────────────────────────────────
// System prompts
// ─────────────────────────────────────────────────────────────────────────────
const BASE_SYSTEM_PROMPT = `You are SkillNest AI, a friendly assistant for the SkillNest freelancing platform — a student-focused marketplace connecting student freelancers with clients.

You will be given relevant platform knowledge below. Use ONLY that knowledge to answer FAQ questions. Keep responses concise (2–5 sentences), friendly, and accurate.

IMPORTANT: If the answer is not in the provided knowledge, or if you are unable to help, ALWAYS direct the user to SkillNest Customer Care:
- 📧 Email: admin@skillnest.com
- 📞 Phone / WhatsApp: +91 98765 43210
- 🕐 Available: 24/7, including weekends and holidays

Do NOT make up policies or features.`;

const TOOL_SYSTEM_PROMPT = `You are SkillNest AI, a friendly assistant for the SkillNest freelancing platform.

You have access to live tools to search freelancers and fetch recommendations.

IMPORTANT RULES:
1. When the message contains a [CONTEXT] block with a user ID, you MUST use that ID directly in tool calls. Never ask the user for their ID.
2. If the user is a Freelancer asking for jobs → call get_job_recommendations with their ID as freelancerId.
3. If the user is a Client asking for freelancers → call get_freelancer_recommendations with their ID as clientId.
4. Always call the tool first — do not respond without calling it when a recommendation is requested.
5. Present results in a clean, numbered list. For each job include: title, budget, skills, match reasons.
6. IMPORTANT: If a job has a "link" field, always append it as a markdown link like this: [View Job](link_value) — this lets the user navigate directly to the job.
7. If a tool returns an error, or if you are unable to answer or assist with something, ALWAYS direct the user to SkillNest Customer Care:
   - 📧 Email: admin@skillnest.com
   - 📞 Phone / WhatsApp: +91 98765 43210
   - 🕐 Available: 24/7, including weekends and holidays
   Do NOT invent data.`;

// ─────────────────────────────────────────────────────────────────────────────
// Groq API helper
// ─────────────────────────────────────────────────────────────────────────────
const callGroq = async (messages, tools = null) => {
    const body = {
        model: 'llama-3.3-70b-versatile',
        messages,
        max_tokens: 600,
        temperature: 0.7
    };
    if (tools) {
        body.tools = tools;
        body.tool_choice = 'auto';
    }

    const response = await axios.post(GROQ_API_URL, body, {
        headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        timeout: 30000
    });

    return response.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// Main chat handler
// ─────────────────────────────────────────────────────────────────────────────
exports.chat = async (req, res) => {
    try {
        const { message, conversationHistory = [], userId, userType } = req.body;

        if (!message?.trim()) {
            return res.status(400).json({ success: false, message: 'Message is required.' });
        }
        if (!GROQ_API_KEY) {
            return res.status(500).json({ success: false, message: 'AI service not configured.' });
        }

        const trimmedMessage = message.trim();

        // ── Path A: Tool calling (data / search / recommendations) ─────────────
        if (needsToolCall(trimmedMessage)) {
            return await handleToolPath(req, res, {
                message: trimmedMessage,
                conversationHistory,
                userId,
                userType
            });
        }

        // ── Path B: Knowledge routing (FAQ) ────────────────────────────────────
        return await handleKnowledgePath(req, res, {
            message: trimmedMessage,
            conversationHistory
        });

    } catch (error) {
        console.error('[AI] Unhandled error:', error?.response?.data || error.message);
        return handleGroqError(res, error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Path A — Tool calling
// ─────────────────────────────────────────────────────────────────────────────
async function handleToolPath(req, res, { message, conversationHistory, userId, userType }) {
    // Append logged-in user context so the AI can call recommendation tools
    // without asking the user for their ID.
    const userContext = buildUserContext({ userId, userType });
    const enrichedMessage = message + userContext;

    const messages = [
        { role: 'system', content: TOOL_SYSTEM_PROMPT },
        ...conversationHistory.slice(-8),
        { role: 'user', content: enrichedMessage }
    ];

    // Round 1: let the model decide which tool to call (if any)
    const round1 = await callGroq(messages, TOOL_DEFINITIONS);
    const choice = round1.choices?.[0];

    if (!choice) throw new Error('No response from AI service.');

    // If the model chose a tool call, execute it and send results back
    if (choice.finish_reason === 'tool_calls' && choice.message?.tool_calls?.length) {
        const toolCallResults = [];

        for (const toolCall of choice.message.tool_calls) {
            // Use `let` so the role-swap safety nets below can reassign if needed
            let toolName = toolCall.function?.name;
            let rawArgs;

            try {
                rawArgs = JSON.parse(toolCall.function?.arguments || '{}');
            } catch {
                rawArgs = {};
            }
            // userId is available from handleToolPath's closure

            console.log(`[AI Tool] Executing: ${toolName}`, JSON.stringify(rawArgs, null, 2));

            // Safety net: if the AI forgot to inject the userId from context, do it server-side
            const normRole = (userType || '').toLowerCase().trim();
            if (toolName === 'get_job_recommendations' && !rawArgs.freelancerId && userId) {
                console.warn(`[AI Tool] AI omitted freelancerId — auto-injecting userId: ${userId}`);
                rawArgs = { ...rawArgs, freelancerId: String(userId) };
            }
            if (toolName === 'get_freelancer_recommendations' && !rawArgs.clientId && userId) {
                console.warn(`[AI Tool] AI omitted clientId — auto-injecting userId: ${userId}`);
                rawArgs = { ...rawArgs, clientId: String(userId) };
            }
            // Role-based safety net: if wrong tool called for the role, swap automatically
            if (normRole === 'freelancer' && toolName === 'get_freelancer_recommendations' && !rawArgs.freelancerId && userId) {
                console.warn(`[AI Tool] Role mismatch: freelancer called get_freelancer_recommendations. Switching to get_job_recommendations.`);
                toolName = 'get_job_recommendations';
                rawArgs = { ...rawArgs, freelancerId: String(userId) };
            }
            if (normRole === 'client' && toolName === 'get_job_recommendations' && !rawArgs.clientId && userId) {
                console.warn(`[AI Tool] Role mismatch: client called get_job_recommendations. Switching to get_freelancer_recommendations.`);
                toolName = 'get_freelancer_recommendations';
                rawArgs = { ...rawArgs, clientId: String(userId) };
            }

            let result;
            try {
                result = await executeToolCall(toolName, rawArgs);
            } catch (execError) {
                const detail = execError.response?.data || execError.message;
                const status = execError.response?.status;
                console.error(`[AI Tool] Error executing ${toolName} (HTTP ${status}):`, detail);
                result = {
                    error: 'Tool execution failed.',
                    detail: process.env.NODE_ENV === 'development' ? String(detail) : undefined,
                    status
                };
            }

            console.log(`[AI Tool] Result for ${toolName}:`, JSON.stringify(result, null, 2));
            toolCallResults.push({
                toolCallId: toolCall.id,
                toolName,
                result
            });
        }

        // Round 2: send tool results back to the model for natural language formatting
        console.log(`[AI Tool] Sending ${toolCallResults.length} tool result(s) back to model for formatting`);
        const round2Messages = [
            ...messages,
            choice.message, // assistant's tool-call message
            ...toolCallResults.map(r => ({
                role: 'tool',
                tool_call_id: r.toolCallId,
                name: r.toolName,
                content: JSON.stringify(r.result)
            }))
        ];

        const round2 = await callGroq(round2Messages); // no tools on round 2 — just format
        const aiReply = round2.choices?.[0]?.message?.content;

        if (!aiReply) throw new Error('No response from AI service on second pass.');

        return res.status(200).json({
            success: true,
            message: 'AI response generated successfully.',
            data: {
                reply: aiReply,
                mode: 'tool_call',
                toolsUsed: toolCallResults.map(r => r.toolName),
                model: round2.model,
                usage: round2.usage
            }
        });
    }

    // Model responded directly (no tool needed despite path detection)
    const aiReply = choice.message?.content;
    if (!aiReply) throw new Error('No response from AI service.');

    return res.status(200).json({
        success: true,
        message: 'AI response generated successfully.',
        data: { reply: aiReply, mode: 'tool_direct', model: round1.model, usage: round1.usage }
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Path B — Knowledge routing (FAQ, unchanged logic)
// ─────────────────────────────────────────────────────────────────────────────
async function handleKnowledgePath(req, res, { message, conversationHistory }) {
    const { context, filesUsed } = getRelevantKnowledge(message);
    console.log(`[AI Knowledge] Routing to: ${filesUsed.join(', ')}`);

    const systemPrompt = `${BASE_SYSTEM_PROMPT}\n\n===== RELEVANT KNOWLEDGE =====\n\n${context}\n\n===== END =====`;

    const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-10),
        { role: 'user', content: message }
    ];

    const response = await callGroq(messages); // no tools for FAQ
    const aiReply = response.choices?.[0]?.message?.content;

    if (!aiReply) throw new Error('No response from AI service.');

    return res.status(200).json({
        success: true,
        message: 'AI response generated successfully.',
        data: {
            reply: aiReply,
            mode: 'knowledge',
            filesUsed,
            model: response.model,
            usage: response.usage
        }
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Groq error handler
// ─────────────────────────────────────────────────────────────────────────────
function handleGroqError(res, error) {
    if (error.response?.status === 401) {
        return res.status(500).json({ success: false, message: 'AI service authentication failed.' });
    }
    if (error.response?.status === 429) {
        return res.status(429).json({ success: false, message: 'Rate limit reached. Please try again in a moment.' });
    }
    return res.status(500).json({
        success: false,
        message: 'Failed to get AI response. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Suggested questions  (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
exports.getSuggestions = async (req, res) => {
    const { userType } = req.query;

    const clientSuggestions = [
        'How do I post a job on SkillNest?',
        'Find me freelancers who know React under $30/hr.',
        'How does the escrow payment system work?',
        'What happens if I\'m not satisfied with the work?',
        'Show me top-rated freelancers for graphic design.'
    ];

    const freelancerSuggestions = [
        'How do I apply for projects on SkillNest?',
        'Show me recommended jobs for my profile.',
        'How does the commission and payment withdrawal work?',
        'What is the project capacity limit per month?',
        'How do I get my student account verified?'
    ];

    const normType = (userType || '').toLowerCase().trim();
    res.status(200).json({
        success: true,
        data: { suggestions: normType === 'freelancer' ? freelancerSuggestions : clientSuggestions }
    });
};