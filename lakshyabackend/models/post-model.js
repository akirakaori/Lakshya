const mongoose = require('mongoose');
const schema = mongoose.Schema;

const postSchema = new schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  salary: {
    type: String,
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
  createdByName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'deleted'],
    default: 'active'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  editedByAdmin: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const PostModel = mongoose.model('Post', postSchema);
module.exports = PostModel;
