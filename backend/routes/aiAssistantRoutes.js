// routes/aiAssistantRoutes.js
const express = require('express');
const router = express.Router();
const aiAssistantController = require('../controllers/aiAssistantController');

// POST /api/ai-assistant/chat - Send a message to the AI assistant
router.post('/chat', aiAssistantController.chat);

// GET /api/ai-assistant/suggestions - Get suggested questions
router.get('/suggestions', aiAssistantController.getSuggestions);

module.exports = router;