const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const auth = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/profile-pictures/' });

// @route   GET api/clients
// @desc    Get all clients
// @access  Public
router.get('/', clientController.getAllClients);

// @route   GET api/clients/:id
// @desc    Get client by ID
// @access  Public
router.get('/:id', clientController.getClientById);

// @route   POST api/clients/register
// @desc    Register a client
// @access  Public
router.post('/register', clientController.registerClient);

// @route   POST api/clients/login
// @desc    Authenticate client & get token
// @access  Public
router.post('/login', clientController.loginClient);

// @route   GET api/clients/dashboard
// @desc    Get client dashboard data
// @access  Private
router.get('/dashboard', clientController.getDashboard);

// @route   PUT api/clients/:id
// @desc    Update client profile
// @access  Private
router.put('/:id', clientController.updateClient);

// @route   DELETE api/clients/:id
// @desc    Delete client
// @access  Private
router.delete('/:id', clientController.deleteClient);

// @route   POST api/clients/upload-profile-picture
// @desc    Upload profile picture
// @access  Private
router.post(
  '/upload-profile-picture',
  upload.single('profilePicture'),
  clientController.uploadProfilePicture
);

// @route   POST api/clients/review
// @desc    Add a review for a freelancer
// @access  Private
router.post('/review', clientController.addReview);

module.exports = router;