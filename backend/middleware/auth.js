const jwt = require('jsonwebtoken');
const Freelancer = require('../models/Freelancer');

module.exports = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find freelancer
    const freelancer = await Freelancer.findById(decoded.id).select('-password');
    
    if (!freelancer) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Attach freelancer to request
    req.freelancer = freelancer;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};