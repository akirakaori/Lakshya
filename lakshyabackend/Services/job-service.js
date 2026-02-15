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
 * Delete a job posting
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
 * Get all jobs posted by a recruiter
 */
const getRecruiterJobs = async (recruiterId) => {
  try {
    const jobs = await JobModel.find({ createdBy: recruiterId })
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
    
    const query = { status: 'open' };
    
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

module.exports = {
  createJob,
  updateJob,
  deleteJob,
  getRecruiterJobs,
  getJobById,
  searchJobs,
  toggleJobStatus
};
