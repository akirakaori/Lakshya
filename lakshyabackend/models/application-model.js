const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const applicationSchema = new Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job ID is required']
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Applicant ID is required']
  },
  resume: {
    type: String,
    default: null
  },
  coverLetter: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['applied', 'shortlisted', 'interview', 'rejected', 'hired'],
    default: 'applied'
  },
  notes: {
    type: String,
    default: ''
  },
  matchScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  matchedSkills: {
    type: [String],
    default: [],
  },
  missingSkills: {
    type: [String],
    default: [],
  },
  matchAnalyzedAt: {
    type: Date,
    default: null,
  },
  // Snapshot of profile version at apply time
  profileUpdatedAtUsed: {
    type: Date,
    default: null,
  },
  resumeParsedAtUsed: {
    type: Date,
    default: null,
  },
  suggestionSource: {
    type: String,
    enum: ['ollama', 'rule'],
    default: null,
  },
  experienceYears: {
    type: Number,
    default: 0,
    min: 0
  },
  interview: {
    date: { type: Date },
    mode: { type: String }, // 'virtual', 'in-person', 'phone'
    link: { type: String }
  },
  // Multi-round interviews array
  interviews: [
    {
      roundNumber: { type: Number, required: true },
      date: { type: Date, required: true },
      time: { type: String },
      timezone: { type: String },
      mode: { 
        type: String, 
        enum: ['online', 'onsite', 'phone'],
        required: true 
      },
      linkOrLocation: { type: String },
      messageToCandidate: { type: String }, // Visible to candidate
      internalNotes: { type: String }, // Recruiter-only
      outcome: { 
        type: String, 
        enum: ['pass', 'fail', 'hold', 'pending'],
        default: 'pending'
      },
      feedback: { type: String }, // Recruiter feedback
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }
  ]
}, { 
  timestamps: true 
});

// Compound index to prevent duplicate applications
applicationSchema.index({ jobId: 1, applicant: 1 }, { unique: true });

// Indexes for queries
applicationSchema.index({ applicant: 1 });
applicationSchema.index({ jobId: 1 });
applicationSchema.index({ status: 1 });

// Indexes for recruiter filtering and sorting
applicationSchema.index({ jobId: 1, matchScore: -1 });
applicationSchema.index({ jobId: 1, experienceYears: -1 });
applicationSchema.index({ jobId: 1, createdAt: -1 });
applicationSchema.index({ jobId: 1, matchedSkills: 1 });
applicationSchema.index({ jobId: 1, missingSkills: 1 });

const ApplicationModel = mongoose.model('Application', applicationSchema);
module.exports = ApplicationModel;
