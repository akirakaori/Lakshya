const jobService = require('../Services/job-service');

/**
 * Create a new job (recruiter only)
 */
const createJob = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const jobData = req.body;
    
    const job = await jobService.createJob(jobData, recruiterId);
    
    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: job
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Update a job (recruiter only)
 */
const updateJob = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const jobId = req.params.id;
    const updateData = req.body;
    
    const job = await jobService.updateJob(jobId, recruiterId, updateData);
    
    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      data: job
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Delete a job (recruiter only) - DEPRECATED: Use soft delete instead
 */
const deleteJob = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const jobId = req.params.id;
    
    await jobService.deleteJob(jobId, recruiterId);
    
    res.status(200).json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Soft delete a job (recruiter only)
 * Recruiter can only delete their own jobs
 */
const softDeleteJob = async (req, res) => {
  try {
    const actorUser = req.user;
    const jobId = req.params.id;
    
    console.log('[Recruiter Delete Job] JobId:', jobId, 'Recruiter:', actorUser.email);
    
    const job = await jobService.softDeleteJob(jobId, actorUser);
    
    console.log('[Recruiter Delete Job] Success - Job deleted:', job._id);
    
    res.status(200).json({
      success: true,
      message: 'Job deleted successfully',
      data: job
    });
  } catch (error) {
    console.error('[Recruiter Delete Job] Error:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Get all jobs posted by the recruiter
 */
const getMyJobs = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const jobs = await jobService.getRecruiterJobs(recruiterId);
    
    res.status(200).json({
      success: true,
      message: 'Jobs retrieved successfully',
      data: jobs
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Get a single job by ID
 */
const getJobById = async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await jobService.getJobById(jobId);
    
    res.status(200).json({
      success: true,
      message: 'Job retrieved successfully',
      data: job
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Browse and search jobs with filters
 */
const searchJobs = async (req, res) => {
  try {
    const filters = {
      keyword: req.query.keyword,
      location: req.query.location,
      skills: req.query.skill || req.query.skills,
      jobType: req.query.jobType,
      page: req.query.page || 1,
      limit: req.query.limit || 10
    };
    
    const result = await jobService.searchJobs(filters);
    
    res.status(200).json({
      success: true,
      message: 'Jobs retrieved successfully',
      data: result.jobs,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Toggle job status (open/closed)
 */
const toggleJobStatus = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const jobId = req.params.id;
    
    const job = await jobService.toggleJobStatus(jobId, recruiterId);
    
    res.status(200).json({
      success: true,
      message: `Job status changed to ${job.status}`,
      data: job
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

module.exports = {
  createJob,
  updateJob,
  deleteJob,
  softDeleteJob,
  getMyJobs,
  getJobById,
  searchJobs,
  toggleJobStatus
};
