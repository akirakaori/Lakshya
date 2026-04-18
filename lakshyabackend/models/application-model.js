const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HH_MM_REGEX = /^([01]?\d|2[0-3]):([0-5]\d)$/;

const parseTimeToMinutes = (value) => {
  if (!value || typeof value !== 'string') return null;
  const match = value.match(HH_MM_REGEX);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return (hour * 60) + minute;
};

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
    enum: ['applied', 'shortlisted', 'interview', 'rejected', 'hired', 'withdrawn'],
    default: 'applied'
  },
  isWithdrawn: {
    type: Boolean,
    default: false,
  },
  withdrawnAt: {
    type: Date,
    default: null,
  },
  withdrawnBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
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
  // Normalized analysis status at apply time
  analysisStatus: {
    type: String,
    enum: ['analyzed', 'not_analyzed'],
    default: 'not_analyzed',
  },
  // Whether a match analysis existed at the time of apply
  hasMatchAnalysis: {
    type: Boolean,
    default: false,
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
    default: undefined,
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
      startTime: {
        type: String,
        validate: [
          {
            validator: function (value) {
              // Backward compatibility: allow legacy records that only have `time`.
              return !!value || !!this.time;
            },
            message: 'Interview startTime is required',
          },
          {
            validator: function (value) {
              if (!value) return true;
              return HH_MM_REGEX.test(value);
            },
            message: 'Interview startTime must be in HH:mm format',
          },
        ],
      },
      endTime: {
        type: String,
        validate: [
          {
            validator: function (value) {
              // Allow old records that have only legacy `time`; enforce endTime for new startTime-based slots.
              if (!!this.time && !this.startTime) return true;
              return !!value;
            },
            message: 'Interview endTime is required',
          },
          {
            validator: function (value) {
              if (!value) return true;
              return HH_MM_REGEX.test(value);
            },
            message: 'Interview endTime must be in HH:mm format',
          },
          {
            validator: function (value) {
              if (!value) return true;
              const startValue = this.startTime || this.time;
              const startMinutes = parseTimeToMinutes(startValue);
              const endMinutes = parseTimeToMinutes(value);

              if (startMinutes === null || endMinutes === null) return true;
              return endMinutes > startMinutes;
            },
            message: 'Interview endTime must be later than startTime',
          },
        ],
      },
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
        enum: ['pass', 'fail', 'pending'],
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

applicationSchema.pre('validate', function normalizeLegacyInterviewOutcomes() {
  if (Array.isArray(this.interviews)) {
    this.interviews.forEach((interview) => {
      if (!interview) return;

      if (interview.outcome === 'passed') {
        interview.outcome = 'pass';
      } else if (interview.outcome === 'failed' || interview.outcome === 'rejected') {
        interview.outcome = 'fail';
      } else if (interview.outcome === 'hold' || interview.outcome === 'shortlisted') {
        interview.outcome = 'pending';
      }

      if (interview.mode === 'virtual') {
        interview.mode = 'online';
      } else if (interview.mode === 'in-person' || interview.mode === 'in_person') {
        interview.mode = 'onsite';
      } else if (interview.mode === 'telephone') {
        interview.mode = 'phone';
      }
    });
  }
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
