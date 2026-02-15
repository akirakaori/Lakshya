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
    enum: ['applied', 'shortlisted', 'rejected'],
    default: 'applied'
  }
}, { 
  timestamps: true 
});

// Compound index to prevent duplicate applications
applicationSchema.index({ jobId: 1, applicant: 1 }, { unique: true });

// Indexes for queries
applicationSchema.index({ applicant: 1 });
applicationSchema.index({ jobId: 1 });
applicationSchema.index({ status: 1 });

const ApplicationModel = mongoose.model('Application', applicationSchema);
module.exports = ApplicationModel;
