const express = require('express');
const router = express.Router();
const freelancerController = require('../controllers/freelancerController');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', freelancerController.registerFreelancer);
router.post('/login', freelancerController.loginFreelancer);
router.get('/', freelancerController.getAllFreelancers);
router.get('/:id', freelancerController.getFreelancerById);

// Protected routes
router.put('/:id', auth, freelancerController.updateFreelancer);
router.delete('/:id', auth, freelancerController.deleteFreelancer);
router.post('/:id/reviews', auth, freelancerController.addReview);

module.exports = router;