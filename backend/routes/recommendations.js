const express = require('express');
const router = express.Router();
const recommendationService = require('../services/recommendationService');
const UserInteraction = require('../models/UserInteraction');

/**
 * GET /api/recommendations/jobs/:freelancerId
 * Get personalized job recommendations for a freelancer
 */
router.get('/jobs/:freelancerId', async (req, res) => {
    try {
        const { freelancerId } = req.params;
        const {
            limit = 20,
            excludeApplied = true,
            minScore = 30
        } = req.query;

        const recommendations = await recommendationService.getJobRecommendations(
            freelancerId,
            {
                limit: parseInt(limit),
                excludeApplied: excludeApplied === 'true',
                minScore: parseInt(minScore)
            }
        );

        res.json({
            success: true,
            data: recommendations
        });
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recommendations',
            error: error.message
        });
    }
});

/**
 * POST /api/recommendations/interactions
 * Record user interaction (view, apply, favorite, etc.)
 */
router.post('/interactions', async (req, res) => {
    try {
        const {
            userId,
            userModel,
            itemId,
            itemModel,
            interactionType,
            metadata
        } = req.body;

        // Validate required fields
        if (!userId || !userModel || !itemId || !itemModel || !interactionType) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const interaction = await UserInteraction.recordInteraction({
            userId,
            userModel,
            itemId,
            itemModel,
            interactionType,
            metadata: metadata || {}
        });

        res.json({
            success: true,
            data: interaction
        });
    } catch (error) {
        console.error('Error recording interaction:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record interaction',
            error: error.message
        });
    }
});

/**
 * POST /api/recommendations/job-view
 * Record job view with automatic last active update
 */
router.post('/job-view', async (req, res) => {
    try {
        const { freelancerId, jobId, metadata } = req.body;

        if (!freelancerId || !jobId) {
            return res.status(400).json({
                success: false,
                message: 'freelancerId and jobId are required'
            });
        }

        await recommendationService.recordJobView(freelancerId, jobId, metadata);

        res.json({
            success: true,
            message: 'Job view recorded'
        });
    } catch (error) {
        console.error('Error recording job view:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record job view',
            error: error.message
        });
    }
});

/**
 * GET /api/recommendations/history/:userId
 * Get user's interaction history
 */
router.get('/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 100 } = req.query;

        const history = await UserInteraction.getUserHistory(userId, parseInt(limit));

        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error('Error fetching interaction history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch interaction history',
            error: error.message
        });
    }
});

/**
 * POST /api/recommendations/clear-cache
 * Clear recommendation cache (for testing/admin)
 */
router.post('/clear-cache', async (req, res) => {
    try {
        recommendationService.clearCache();

        res.json({
            success: true,
            message: 'Recommendation cache cleared'
        });
    } catch (error) {
        console.error('Error clearing cache:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear cache',
            error: error.message
        });
    }
});

/**
 * GET /api/recommendations/similar-users/:userId
 * Get similar users based on interaction patterns
 */
router.get('/similar-users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 10 } = req.query;

        const similarUsers = await UserInteraction.getSimilarUsers(userId, parseInt(limit));

        res.json({
            success: true,
            data: similarUsers
        });
    } catch (error) {
        console.error('Error fetching similar users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch similar users',
            error: error.message
        });
    }
});

/**
 * GET /api/recommendations/freelancers/:clientId
 * Get personalized freelancer recommendations for a client
 */
router.get('/freelancers/:clientId', async (req, res) => {
    try {
        const { clientId } = req.params;
        const {
            limit = 20,
            minScore = 30
        } = req.query;

        const recommendations = await recommendationService.getFreelancerRecommendations(
            clientId,
            {
                limit: parseInt(limit),
                minScore: parseInt(minScore)
            }
        );

        res.json({
            success: true,
            data: recommendations
        });
    } catch (error) {
        console.error('Error fetching freelancer recommendations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch freelancer recommendations',
            error: error.message
        });
    }
});

module.exports = router;
