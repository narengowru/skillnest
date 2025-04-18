const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const auth = require('../middleware/auth');

// Public routes
router.get('/', jobController.getAllJobs);
router.get('/:id', jobController.getJobById);

// Protected routes
router.post('/', auth, jobController.createJob);
router.put('/:id', auth, jobController.updateJob);
router.delete('/:id', auth, jobController.deleteJob);
router.post('/:id/apply', auth, jobController.applyToJob);
router.put('/:jobId/applications/:applicationId', auth, jobController.updateApplicationStatus);

module.exports = router;