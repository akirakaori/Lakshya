const mongoose = require('mongoose');
const { ROLES } = require('../Library/roles');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    select: false
  },
  number: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true
  },
  role: {
    type: String,
    enum: Object.values(ROLES),
    required: [true, 'Role is required']
  },
  companyName: {
    type: String,
    required: function () {
      return this.role === ROLES.RECRUITER;
    }
  },
  location: {
    type: String,
    required: function () {
      return this.role === ROLES.RECRUITER;
    }
  },
  resume: {
    type: String,
    default: null
  },
  profileImageUrl: {
    type: String,
    default: null
  },
  jobSeeker: {
    title: { type: String, default: '' },
    bio: { type: String, default: '' },
    skills: [{ type: String }],
    experience: { type: String, default: '' },
    education: { type: String, default: '' },
    preferredLocation: { type: String, default: '' },
    expectedSalary: { type: String, default: '' },
    resumeUrl: { type: String, default: null },
    resumePublicId: { type: String, default: null },
    resumeFormat: { type: String, default: null }
  },
  recruiter: {
    companyDescription: { type: String, default: '' },
    position: { type: String, default: '' },
    department: { type: String, default: '' },
    companyWebsite: { type: String, default: '' }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  resetOTP: {
    type: String,
    select: false
  },
  resetOTPExpiry: {
    type: Date,
    select: false
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true, versionKey: false },
  toObject: { virtuals: true, versionKey: false }
});

// Virtual for fullName (maps to name for compatibility)
userSchema.virtual('fullName').get(function() {
  return this.name;
}).set(function(value) {
  this.name = value;
});

// Virtual for phone (maps to number for compatibility)
userSchema.virtual('phone').get(function() {
  return this.number;
}).set(function(value) {
  this.number = value;
});

// Index for faster queries (email already has index from unique: true)
userSchema.index({ role: 1 });

const UserModel = mongoose.model('User', userSchema);
module.exports = UserModel;
