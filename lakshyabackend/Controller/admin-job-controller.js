const jobService = require('../Services/job-service');
const mongoose = require('mongoose');

/**
 * Admin soft delete a job
 */
const adminSoftDeleteJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const adminUser = req.user;

    // Log for debugging
    console.log('[Admin Delete Job] JobId:', jobId, 'Admin:', adminUser.email, 'Role:', adminUser.role);

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }

    const job = await jobService.adminSoftDeleteJob(jobId, adminUser);

    console.log('[Admin Delete Job] Success - Job deleted:', job._id);

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully',
      data: job
    });
  } catch (error) {
    console.error('[Admin Delete Job] Error:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Admin edit a job
 */
const adminEditJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const updateData = req.body;
    const adminUser = req.user;

    console.log('[Admin Edit Job] JobId:', jobId, 'Admin:', adminUser.email);

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }

    const job = await jobService.adminEditJob(jobId, updateData);

    console.log('[Admin Edit Job] Success - Job updated:', job._id);

    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      data: job
    });
  } catch (error) {
    console.error('[Admin Edit Job] Error:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Get all jobs (admin view - includes inactive/deleted)
 */
const getAllJobs = async (req, res) => {
  try {
    const jobs = await jobService.getAllJobsForAdmin();

    res.status(200).json({
      success: true,
      message: 'Jobs retrieved successfully',
      data: jobs
    });
  } catch (error) {
    console.error('[Admin Get All Jobs] Error:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

module.exports = {
  adminSoftDeleteJob,
  adminEditJob,
  getAllJobs
};
