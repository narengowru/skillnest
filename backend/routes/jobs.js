const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const auth = require('../middleware/auth');

// Public routes
router.get('/', jobController.getAllJobs);
router.get('/:id', jobController.getJobById);

// Protected routes
router.post('/', jobController.createJob);
router.put('/:id', jobController.updateJob);
router.delete('/:id', jobController.deleteJob);
router.post('/:id/apply', jobController.applyToJob);
router.put('/:jobId/applications/:applicationId', jobController.updateApplicationStatus);

module.exports = router;