const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const socketIo = require('socket.io');
const http = require('http');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());
// Create HTTP server
const server = http.createServer(app);
app.use(express.urlencoded({ extended: true }));
// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: [
      'https://skillnest-orpin.vercel.app',
      'http://localhost:3000',
      // Add other domains as needed
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
const allowedOrigins = [
  'https://skillnest-orpin.vercel.app',
  'http://localhost:3000',  // For local development
  // Add other domains as needed
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
console.log("mongodb uri",process.env.PORT);
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Attach chatHandlers to each new connection
io.on('connection', socket => require('./socket/chatHandlers')(io, socket));

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/freelancers', require('./routes/freelancers'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/chat', require('./routes/chatRoutes')); // Fixed route path
app.use('/api/razorpay', require('./routes/razorpayRoutes'));
// Note: chatHandlers should be imported and used with Socket.IO, not as middleware

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

// Use server.listen instead of app.listen to support Socket.IO
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});