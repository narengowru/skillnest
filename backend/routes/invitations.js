const express = require('express');
const router = express.Router();
const invitationController = require('../controllers/invitationController');

// ── Specific named routes (must come before /:id) ─────────────────────────────

// Get all invitations sent by a client  →  GET /api/invitations/client/:clientId
// Optional query: ?status=pending|accepted|declined|expired
router.get('/client/:clientId', invitationController.getInvitationsByClient);

// Get all invitations received by a freelancer  →  GET /api/invitations/freelancer/:freelancerId
// Optional query: ?status=pending|accepted|declined|expired
router.get('/freelancer/:freelancerId', invitationController.getInvitationsByFreelancer);

// ── Generic /:id routes ───────────────────────────────────────────────────────

// Send a new invitation  →  POST /api/invitations
router.post('/', invitationController.sendInvitation);

// Get a single invitation  →  GET /api/invitations/:id
router.get('/:id', invitationController.getInvitationById);

// Accept / decline / expire  →  PUT /api/invitations/:id/status
// Body: { status: 'accepted' | 'declined' | 'expired' }
router.put('/:id/status', invitationController.updateInvitationStatus);

// Withdraw a pending invitation  →  DELETE /api/invitations/:id
router.delete('/:id', invitationController.deleteInvitation);

module.exports = router;
