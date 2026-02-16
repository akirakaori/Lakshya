const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const jobSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Job description is required']
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  salary: {
    min: {
      type: Number,
      min: [0, 'Minimum salary must be at least 0']
    },
    max: {
      type: Number,
      validate: {
        validator: function(value) {
          return !this.min || value >= this.min;
        },
        message: 'Maximum salary must be greater than or equal to minimum salary'
      }
    },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'NPR', 'GBP', 'INR','JPY', 'CNY', 'AUD', 'CAD'],
      default: 'USD'
    }
  },
  skillsRequired: {
    type: [String],
    default: []
  },
  requirements: {
    type: [String],
    default: []
  },
  benefits: {
    type: [String],
    default: []
  },
  experienceLevel: {
    type: String,
    trim: true
  },
  jobType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'],
    default: 'Full-time'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for isActive (computed from status)
jobSchema.virtual('isActive').get(function() {
  return this.status === 'open';
});

// Indexes for better query performance
jobSchema.index({ title: 'text', description: 'text' });
jobSchema.index({ location: 1 });
jobSchema.index({ skillsRequired: 1 });
jobSchema.index({ jobType: 1 });
jobSchema.index({ createdBy: 1 });
jobSchema.index({ status: 1 });

const JobModel = mongoose.model('Job', jobSchema);
module.exports = JobModel;
