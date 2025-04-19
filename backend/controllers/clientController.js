const Client = require('../models/Client');
const jwt = require('jsonwebtoken');

// Get all clients
exports.getAllClients = async (req, res) => {
  try {
    const clients = await Client.find().select('-password');
    res.json(clients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single client by ID
exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
      .select('-password')
      .populate('orders');
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    res.json(client);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Register new client
exports.registerClient = async (req, res) => {
  const { email, password, companyName, location } = req.body;

  try {
    // Check if client already exists
    let client = await Client.findOne({ email });
    if (client) {
      return res.status(400).json({ message: 'Client already exists' });
    }

    // Create new client
    client = new Client({
      email,
      password,
      companyName,
      location
    });

    await client.save();

    // Generate JWT token
    const payload = {
      client: {
        id: client.id,
        type: 'client'
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login client
exports.loginClient = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if client exists
    const client = await Client.findOne({ email });
    if (!client) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await client.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const payload = {
      client: {
        id: client.id,
        type: 'client'
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update client profile
exports.updateClient = async (req, res) => {
  const { companyName, bio, location, contactInfo } = req.body;
  const clientFields = {};
  
  if (companyName) clientFields.companyName = companyName;
  if (bio) clientFields.bio = bio;
  if (location) clientFields.location = location;
  if (contactInfo) clientFields.contactInfo = contactInfo;

  try {
    let client = await Client.findById(req.params.id);
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Ensure client can only update their own profile
    if (client._id.toString() !== req.client.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    client = await Client.findByIdAndUpdate(
      req.params.id,
      { $set: clientFields },
      { new: true }
    ).select('-password');

    res.json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete client
exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Ensure client can only delete their own account
    if (client._id.toString() !== req.client.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Client.findByIdAndRemove(req.params.id);
    res.json({ message: 'Client removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Upload profile picture
exports.uploadProfilePicture = async (req, res) => {
  try {
    const client = await Client.findById(req.client.id);
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // In a real application, you would handle file upload
    // and update the profilePicture field with the file path
    if (req.file) {
      client.profilePicture = req.file.path;
      await client.save();
    } else {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    res.json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add a review for a freelancer
exports.addReview = async (req, res) => {
  try {
    const { freelancerId, rating, comment } = req.body;
    
    const client = await Client.findById(req.client.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const newReview = {
      freelancerId,
      rating,
      comment
    };

    client.reviews.push(newReview);
    await client.save();

    res.json(client.reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get client dashboard data (orders, reviews, etc.)
exports.getDashboard = async (req, res) => {
  try {
    const client = await Client.findById(req.client.id)
      .select('-password')
      .populate('orders');

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};