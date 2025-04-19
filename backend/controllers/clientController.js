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
      .populate('orders')
      .populate('jobs'); // Added population of jobs
    
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
  const { email, password, companyName, location, contactInfo } = req.body;

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
      location,
      contactInfo
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
  try {
    let client = await Client.findById(req.params.id);
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Create an object with fields to update
    const clientFields = {};
    
    // Handle standard fields
    const { companyName, bio, location, contactInfo, verified, profilePicture, jobs } = req.body;
    
    if (companyName !== undefined) clientFields.companyName = companyName;
    if (bio !== undefined) clientFields.bio = bio;
    if (location !== undefined) clientFields.location = location;
    if (contactInfo !== undefined) clientFields.contactInfo = contactInfo;
    if (verified !== undefined) clientFields.verified = verified;
    if (profilePicture !== undefined) clientFields.profilePicture = profilePicture;
    
    // Handle jobs array - allow updating the entire array or pushing to it
    if (jobs !== undefined) {
      if (Array.isArray(jobs)) {
        // If jobs is provided as an array, replace the entire array
        clientFields.jobs = jobs;
      } else {
        // If jobs is a single ID, push it to the existing array
        client = await Client.findByIdAndUpdate(
          req.params.id,
          { $push: { jobs: jobs } },
          { new: true }
        ).select('-password');
        
        // Return early since we've already updated
        return res.json(client);
      }
    }

    // Update client with all fields at once
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
    const client = await Client.findById(req.params.id);
    
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
    
    const client = await Client.findById(req.params.id);
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

// Get client dashboard data (orders, reviews, jobs, etc.)
exports.getDashboard = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
      .select('-password')
      .populate('orders')
      .populate('jobs'); // Added population of jobs

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add a job to client
exports.addJob = async (req, res) => {
  try {
    const { jobId } = req.body;
    
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Check if job already exists in client's jobs array
    if (client.jobs.includes(jobId)) {
      return res.status(400).json({ message: 'Job already added to client' });
    }

    client.jobs.push(jobId);
    await client.save();

    res.json(client.jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove a job from client
exports.removeJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Check if job exists in client's jobs array
    const jobIndex = client.jobs.indexOf(jobId);
    if (jobIndex === -1) {
      return res.status(400).json({ message: 'Job not found in client' });
    }

    client.jobs.splice(jobIndex, 1);
    await client.save();

    res.json(client.jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};