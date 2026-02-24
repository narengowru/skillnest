// backend/routes/freelancers.js
const express = require('express');
const router = express.Router();
const freelancerController = require('../controllers/freelancerController');
const resumeParserController = require('../controllers/resumeParserController');
const auth = require('../middleware/auth');
const upload = require('../middleware/resumeUpload');

// Public routes
router.post('/register', freelancerController.registerFreelancer);
router.post('/login', freelancerController.loginFreelancer);
router.get('/', freelancerController.getAllFreelancers);
router.get('/:id', freelancerController.getFreelancerById);

router.post('/parse-resume', upload.single('resume'), resumeParserController.parseResume);


// Protected routes
router.put('/:id', auth, freelancerController.updateFreelancer);
router.delete('/:id', auth, freelancerController.deleteFreelancer);
router.post('/:id/reviews', freelancerController.addReview);

// AI Resume Parsing route (protected)
router.post(
    '/parse-resume',
    auth,
    upload.single('resume'),
    resumeParserController.parseResume
);

module.exports = router;