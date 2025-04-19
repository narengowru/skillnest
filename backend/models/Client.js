const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const reviewSchema = new mongoose.Schema({
  freelancerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Freelancer',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const clientSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  reviews: [reviewSchema],
  memberSince: {
    type: Date,
    default: Date.now
  },
  location: {
    country: {
      type: String,
      required: true
    },
    city: {
      type: String
    }
  },
  verified: {
    type: Boolean,
    default: false
  },
  profilePicture: {
    type: String,
    default: 'default-profile.jpg'
  },
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  bio: {
    type: String,
    default: ''
  },
  contactInfo: {
    phone: String,
    website: String,
    socialMedia: {
      linkedin: String,
      twitter: String
    }
  },
  paymentMethods: [{
    type: {
      type: String,
      enum: ['credit_card', 'paypal', 'bank_transfer']
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    last4Digits: String, // For security, only store last 4 digits
    expiryDate: String
  }]
}, { timestamps: true });

// Virtual for average rating calculation
clientSchema.virtual('avgRating').get(function() {
  if (this.reviews.length === 0) return 0;
  
  const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  return (totalRating / this.reviews.length).toFixed(1);
});

// Middleware to hash password before saving
clientSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
clientSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;