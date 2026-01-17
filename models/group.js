const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    index: true 
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  avatar: {
    type: String,
    default: '/images/default-group-avatar.png'
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'member', 'moderator'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPrivate: {
    type: Boolean,
    default: false
  },
  isOfficial: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true }, // Allows memberCount to show up in JSON
  toObject: { virtuals: true }
});

// --- VIRTUALS ---
// Easily get the number of members without extra logic
groupSchema.virtual('memberCount').get(function() {
  return this.members ? this.members.length : 0;
});

// --- PERFORMANCE INDEXING ---
groupSchema.index({ "members.user": 1 });
groupSchema.index({ name: 1, isPrivate: 1 });

// --- THE CRASH FIX ---
// This checks if the model exists before compiling it sharp sharp!
module.exports = mongoose.models.Group || mongoose.model('Group', groupSchema);