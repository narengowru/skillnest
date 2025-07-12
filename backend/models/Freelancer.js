const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const achievementSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  icon: { type: String, default: '' },
  date: { type: String, default: '' }
}, { _id: false });

const educationSchema = new mongoose.Schema({
  university: { type: String, default: '' },
  degree: { type: String, default: '' },
  year: { type: String, default: '' },
  gpa: { type: String, default: '' },
  relevantCourses: { type: [String], default: [] }
}, { _id: false });

const previousWorkSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  client: { type: String, default: '' },
  feedback: { type: String, default: '' }
}, { _id: false });

const skillSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  level: { type: Number, default: 0 }
}, { _id: false });

const availabilitySchema = new mongoose.Schema({
  hoursPerWeek: { type: Number, default: 0 },
  schedule: { type: String, default: '' }
}, { _id: false });

const ratingsSchema = new mongoose.Schema({
  average: { type: Number, default: 0 },
  breakdown: {
    5: { type: Number, default: 0 },
    4: { type: Number, default: 0 },
    3: { type: Number, default: 0 },
    2: { type: Number, default: 0 },
    1: { type: Number, default: 0 }
  },
  total: { type: Number, default: 0 }
}, { _id: false });

const reviewSchema = new mongoose.Schema({
  clientName: { type: String, default: '' },
  clientAvatar: { type: String, default: '' },
  rating: { type: Number, default: 0 },
  date: { type: String, default: '' },
  comment: { type: String, default: '' }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  id: { type: String, default: '' },
  client: { type: String, default: '' },
  project: { type: String, default: '' },
  amount: { type: String, default: '' },
  status: { type: String, default: '' },
  date: { type: String, default: '' }
}, { _id: false });

const socialSchema = new mongoose.Schema({
  github: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  portfolio: { type: String, default: '' }
}, { _id: false });

const bankSchema = new mongoose.Schema({
  accountNumber: { type: String, default: '' },
  ifscCode: { type: String, default: '' },
  bankName: { type: String, default: '' },
  accountHolderName: { type: String, default: '' }
}, { _id: false });

const freelancerSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  tagline: { type: String, default: '' },
  profilePhoto: { type: String, default: '' },
  bio: { type: String, default: '' },
  email: { 
    type: String, 
    required: true,
    unique: true,
    trim: true
  },
  phone: { type: String, default: '' },
  password: { 
    type: String, 
    required: true 
  },
  isVerified: {
    type: Boolean,
    default: true
  },
  achievements: { type: [achievementSchema], default: [] },
  education: { type: educationSchema, default: () => ({}) },
  previousWork: { type: [previousWorkSchema], default: [] },
  skills: { type: [skillSchema], default: [] },
  hourlyRate: { type: String, default: '' },
  availability: { type: availabilitySchema, default: () => ({}) },
  jobsCompleted: {
    type: Number,
    default: 0
  },
  ratings: { type: ratingsSchema, default: () => ({}) },
  reviews: { type: [reviewSchema], default: [] },
  orders: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    }],
  location: { type: String, default: '' },
  joinedDate: {
    type: String,
    default: () => new Date().toISOString().split('T')[0]
  },
  languages: { type: [String], default: [] },
  socialProfiles: { type: socialSchema, default: () => ({}) },
  bank: { type: bankSchema, default: () => ({}) }
}, {
  timestamps: true
});

// Pre-save middleware to hash password
freelancerSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to compare passwords
freelancerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Freelancer = mongoose.model('Freelancer', freelancerSchema);
module.exports = Freelancer;