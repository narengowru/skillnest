const express = require('express');
const router = express.Router();
const proposalController = require('../controllers/proposalController');

// ── Specific named routes MUST come before /:id ───────────────────────────────

// Get all proposals for a specific job (client viewing applicants)
router.get('/job/:jobId', proposalController.getProposalsByJob);

// Get all proposals submitted by a freelancer
router.get('/freelancer/:freelancerId', proposalController.getProposalsByFreelancer);

// Get all proposals received by a client
router.get('/client/:clientId', proposalController.getProposalsByClient);

// ── Generic /:id routes ───────────────────────────────────────────────────────

// Submit a new proposal
router.post('/', proposalController.createProposal);

// Get a single proposal by ID
router.get('/:id', proposalController.getProposalById);

// Update proposal status (accept / reject / withdraw)
router.put('/:id/status', proposalController.updateProposalStatus);

// Delete / withdraw a proposal
router.delete('/:id', proposalController.deleteProposal);

module.exports = router;
