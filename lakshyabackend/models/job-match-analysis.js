const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const jobMatchAnalysisSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  matchScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  skillScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 1,
  },
  semanticScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 1,
  },
  skillScorePercent: {
    type: Number,
    default: 0,
  },
  semanticPercent: {
    type: Number,
    default: 0,
  },
  matchedSkills: {
    type: [String],
    default: [],
  },
  missingSkills: {
    type: [String],
    default: [],
  },
  suggestions: {
    type: [String],
    default: [],
  },
  summaryRewrite: {
    type: String,
    default: '',
  },
  suggestionSource: {
    type: String,
    enum: ['ollama', 'rule'],
    default: 'rule',
  },
  analyzedAt: {
    type: Date,
    default: Date.now,
  },
  version: {
    type: String,
    default: 'v1',
  },
  // Track profile version used for this analysis
  profileUpdatedAtUsed: {
    type: Date,
    default: null,
  },
  resumeParsedAtUsed: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Compound unique index: one analysis per user-job pair
jobMatchAnalysisSchema.index({ userId: 1, jobId: 1 }, { unique: true });

// Index for recruiter sorting by matchScore
jobMatchAnalysisSchema.index({ jobId: 1, matchScore: -1 });

const JobMatchAnalysis = mongoose.model('JobMatchAnalysis', jobMatchAnalysisSchema);
module.exports = JobMatchAnalysis;
