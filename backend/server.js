const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/freelancers', require('./routes/freelancers'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/clients', require('./routes/clients'));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Basic route
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the Freelancer Marketplace API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});