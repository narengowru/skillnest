const Freelancer = require('../models/Freelancer');
const jwt = require('jsonwebtoken');

// Get all freelancers
exports.getAllFreelancers = async (req, res) => {
  try {
    const freelancers = await Freelancer.find().select('-password');
    res.status(200).json(freelancers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a specific freelancer
exports.getFreelancerById = async (req, res) => {
  try {
    const freelancer = await Freelancer.findById(req.params.id).select('-password')
    .populate('orders')
    if (!freelancer) {
      return res.status(404).json({ message: 'Freelancer not found' });
    }
    res.status(200).json(freelancer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new freelancer (Register)
exports.registerFreelancer = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if freelancer already exists
    const existingFreelancer = await Freelancer.findOne({ email });
    if (existingFreelancer) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    const freelancer = new Freelancer(req.body);
    await freelancer.save();
    
    // Create token
    const token = jwt.sign(
      { id: freelancer._id }, 
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.status(201).json({
      message: 'Freelancer registered successfully',
      token,
      freelancer: {
        id: freelancer._id,
        name: freelancer.name,
        email: freelancer.email
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Login freelancer
exports.loginFreelancer = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find freelancer by email
    const freelancer = await Freelancer.findOne({ email });
    if (!freelancer) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Verify password
    const isMatch = await freelancer.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Create token
    const token = jwt.sign(
      { id: freelancer._id }, 
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.status(200).json({
      message: 'Login successful',
      token,
      freelancer: {
        id: freelancer._id,
        name: freelancer.name,
        email: freelancer.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update freelancer profile
exports.updateFreelancer = async (req, res) => {
  try {
    // Don't allow password update through this route
    if (req.body.password) {
      delete req.body.password;
    }
    
    const updatedFreelancer = await Freelancer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedFreelancer) {
      return res.status(404).json({ message: 'Freelancer not found' });
    }
    
    res.status(200).json(updatedFreelancer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete freelancer
exports.deleteFreelancer = async (req, res) => {
  try {
    const freelancer = await Freelancer.findByIdAndDelete(req.params.id);
    
    if (!freelancer) {
      return res.status(404).json({ message: 'Freelancer not found' });
    }
    
    res.status(200).json({ message: 'Freelancer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a review to a freelancer
exports.addReview = async (req, res) => {
  try {
    const freelancer = await Freelancer.findById(req.params.id);
    
    if (!freelancer) {
      return res.status(404).json({ message: 'Freelancer not found' });
    }
    
    const { clientName, clientAvatar, rating, comment } = req.body;
    
    const newReview = {
      clientName,
      clientAvatar,
      rating,
      date: new Date().toISOString().split('T')[0],
      comment
    };
    
    freelancer.reviews.push(newReview);
    
    // Update ratings
    const totalRatings = freelancer.reviews.length;
    const ratingSum = freelancer.reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = parseFloat((ratingSum / totalRatings).toFixed(1));
    
    // Update ratings breakdown
    const breakdown = {
      5: 0, 4: 0, 3: 0, 2: 0, 1: 0
    };
    
    freelancer.reviews.forEach(review => {
      breakdown[review.rating]++;
    });
    
    freelancer.ratings = {
      average: averageRating,
      breakdown,
      total: totalRatings
    };
    
    await freelancer.save();
    
    res.status(201).json(freelancer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};