const mongoose = require('mongoose');
// FIXED: Changed from 'bcrypt' to 'bcryptjs' for better Windows compatibility
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  // Online Status Fields
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ==================== MIDDLEWARE ====================
// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // bcryptjs uses the exact same syntax as bcrypt
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update lastSeen when user goes offline
userSchema.pre('save', function(next) {
  if (this.isModified('isOnline') && !this.isOnline) {
    this.lastSeen = new Date();
  }
  next();
});

// ==================== METHODS ====================
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

userSchema.methods.setOnline = async function() {
  this.isOnline = true;
  this.lastSeen = new Date();
  return this.save();
};

userSchema.methods.setOffline = async function() {
  this.isOnline = false;
  this.lastSeen = new Date();
  return this.save();
};

// ==================== VIRTUALS ====================
userSchema.virtual('onlineStatus').get(function() {
  if (this.isOnline) return 'Online';
  
  const now = new Date();
  const lastSeen = new Date(this.lastSeen);
  const diffMs = now - lastSeen;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 5) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
});


userSchema.index({ isOnline: 1 });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);