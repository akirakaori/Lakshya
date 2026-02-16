const JobModel = require('../models/job-model');
const mongoose = require('mongoose');

/**
 * Create a new job posting (recruiter only)
 */
const createJob = async (jobData, recruiterId) => {
  try {
    const job = new JobModel({
      ...jobData,
      createdBy: recruiterId
    });
    
    await job.save();
    return job;
  } catch (error) {
    throw error;
  }
};

/**
 * Update a job posting
 */
const updateJob = async (jobId, recruiterId, updateData) => {
  try {
    // Don't allow changing the creator
    delete updateData.createdBy;
    
    const job = await JobModel.findOneAndUpdate(
      { _id: jobId, createdBy: recruiterId },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!job) {
      const error = new Error('Job not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }
    
    return job;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a job posting (DEPRECATED - use softDeleteJob instead)
 */
const deleteJob = async (jobId, recruiterId) => {
  try {
    const job = await JobModel.findOneAndDelete({
      _id: jobId,
      createdBy: recruiterId
    });
    
    if (!job) {
      const error = new Error('Job not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }
    
    return job;
  } catch (error) {
    throw error;
  }
};

/**
 * Soft delete a job posting (recruiter)
 * Recruiter can only delete their own jobs
 */
const softDeleteJob = async (jobId, actorUser) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      const error = new Error('Invalid job ID format');
      error.statusCode = 400;
      throw error;
    }

    // Find job by ID AND ownership (recruiter can only delete their own jobs)
    const job = await JobModel.findOne({
      _id: jobId,
      createdBy: actorUser.id
    });
    
    if (!job) {
      const error = new Error('Job not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }

    if (job.isDeleted) {
      const error = new Error('Job is already deleted');
      error.statusCode = 400;
      throw error;
    }
    
    // Soft delete: set flags but keep the document
    job.isActive = false;
    job.isDeleted = true;
    job.deletedAt = new Date();
    job.deletedBy = actorUser.id;
    job.deletedByRole = 'recruiter';
    
    await job.save();
    
    console.log('[Service] Recruiter soft deleted job:', job._id, 'by', actorUser.email);
    
    return job;
  } catch (error) {
    throw error;
  }
};

/**
 * Soft delete a job posting (admin)
 * Admin can delete any job regardless of ownership
 */
const adminSoftDeleteJob = async (jobId, actorUser) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      const error = new Error('Invalid job ID format');
      error.statusCode = 400;
      throw error;
    }

    // Find job by ID only (no ownership check for admin)
    const job = await JobModel.findById(jobId);
    
    if (!job) {
      const error = new Error('Job not found');
      error.statusCode = 404;
      throw error;
    }

    if (job.isDeleted) {
      const error = new Error('Job is already deleted');
      error.statusCode = 400;
      throw error;
    }
    
    // Soft delete: set flags but keep the document
    job.isActive = false;
    job.isDeleted = true;
    job.deletedAt = new Date();
    job.deletedBy = actorUser.id;
    job.deletedByRole = 'admin';
    
    await job.save();
    
    console.log('[Service] Admin soft deleted job:', job._id, 'by', actorUser.email);
    
    return job;
  } catch (error) {
    throw error;
  }
};

/**
 * Admin edit job
 * Admin can edit any job regardless of ownership
 */
const adminEditJob = async (jobId, updateData) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      const error = new Error('Invalid job ID format');
      error.statusCode = 400;
      throw error;
    }

    // Don't allow changing creator or soft delete fields via this route
    delete updateData.createdBy;
    delete updateData.isDeleted;
    delete updateData.deletedAt;
    delete updateData.deletedBy;
    delete updateData.deletedByRole;
    
    const job = await JobModel.findByIdAndUpdate(
      jobId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!job) {
      const error = new Error('Job not found');
      error.statusCode = 404;
      throw error;
    }
    
    return job;
  } catch (error) {
    throw error;
  }
};

/**
 * Get all jobs posted by a recruiter
 * @param {string} recruiterId - The recruiter's user ID
 * @param {object} options - Query options
 * @param {boolean} options.includeInactive - Whether to include inactive/deleted jobs
 */
const getRecruiterJobs = async (recruiterId, options = {}) => {
  try {
    const { includeInactive = true } = options;
    
    const query = { createdBy: recruiterId };
    
    // By default, show all jobs (active and inactive) for recruiter to manage
    // If includeInactive is false, only show active jobs
    if (!includeInactive) {
      query.isActive = true;
      query.isDeleted = false;
    }
    
    const jobs = await JobModel.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email companyName');
    
    return jobs;
  } catch (error) {
    throw error;
  }
};

/**
 * Get a single job by ID
 */
const getJobById = async (jobId) => {
  try {
    const job = await JobModel.findById(jobId)
      .populate('createdBy', 'name email companyName location');
    
    if (!job) {
      const error = new Error('Job not found');
      error.statusCode = 404;
      throw error;
    }
    
    return job;
  } catch (error) {
    throw error;
  }
};

/**
 * Browse and search jobs with filters
 */
const searchJobs = async (filters) => {
  try {
    const { keyword, location, skills, jobType, page = 1, limit = 10 } = filters;
    
    // Only show active, non-deleted jobs to job seekers
    const query = { 
      status: 'open',
      isActive: true,
      isDeleted: false
    };
    
    // Keyword search (title and description)
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }
    
    // Location filter
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    // Skills filter (match any skill in the array)
    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      query.skillsRequired = { $in: skillsArray };
    }
    
    // Job type filter
    if (jobType) {
      query.jobType = jobType;
    }
    
    const skip = (page - 1) * limit;
    
    const jobs = await JobModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name companyName');
    
    const total = await JobModel.countDocuments(query);
    
    return {
      jobs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Toggle job status (open/closed)
 */
const toggleJobStatus = async (jobId, recruiterId) => {
  try {
    const job = await JobModel.findOne({ _id: jobId, createdBy: recruiterId });
    
    if (!job) {
      const error = new Error('Job not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }
    
    job.status = job.status === 'open' ? 'closed' : 'open';
    await job.save();
    
    return job;
  } catch (error) {
    throw error;
  }
};

/**
 * Get all jobs for admin (includes inactive and deleted)
 */
const getAllJobsForAdmin = async () => {
  try {
    const jobs = await JobModel.find({})
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email companyName role');
    
    return jobs;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createJob,
  updateJob,
  deleteJob,
  softDeleteJob,
  adminSoftDeleteJob,
  adminEditJob,
  getRecruiterJobs,
  getJobById,
  searchJobs,
  toggleJobStatus,
  getAllJobsForAdmin
};
