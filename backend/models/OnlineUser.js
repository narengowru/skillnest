const mongoose = require('mongoose');

const onlineUserSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userType'
  },
  userType: {
    type: String,
    required: true,
    enum: ['Client', 'Freelancer']
  },
  socketId: {
    type: String,
    required: true,
    unique: true
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  isOnline: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Auto-expire documents after 1 hour of inactivity
onlineUserSchema.index({ lastSeen: 1 }, { expireAfterSeconds: 3600 });
onlineUserSchema.index({ userId: 1, userType: 1 });

module.exports = mongoose.model('OnlineUser', onlineUserSchema);