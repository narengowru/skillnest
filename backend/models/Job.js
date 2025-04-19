const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  name: String,
  avatar: String,
  rating: Number,
  totalReviews: Number,
  memberSince: String,
  location: String,
  verificationBadge: Boolean
}, { _id: false });

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: [
      "Writing & Translation",
      "Programming & Development",
      "Administrative & Secretarial",
      "Design & Art",
      "Business & Finance",
      "Sales & Marketing",
      "Others"
    ],
    required: true
  },
  imageUrl: String,
  datePosted: {
    type: Date,
    default: Date.now
  },
  budget: String,
  description: {
    type: String,
    required: true
  },
  skills: [String],
  client: clientSchema,
  projectDuration: String,
  experienceLevel: String,
  status: {
    type: String,
    enum: ['open', 'in-progress', 'completed'],
    default: 'open'
  },
  applications: [{
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Freelancer'
    },
    coverLetter: String,
    proposedRate: String,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;