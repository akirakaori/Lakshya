const applicationService = require('../Services/application-service');

/**
 * Apply for a job (job_seeker only)
 */
const applyForJob = async (req, res) => {
  try {
    const applicantId = req.user.id;
    const jobId = req.params.jobId;
    const applicationData = req.body;
    
    const application = await applicationService.applyForJob(jobId, applicantId, applicationData);
    
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Get all applications by the logged-in job seeker
 */
const getMyApplications = async (req, res) => {
  try {
    const applicantId = req.user.id;
    const { q, status, page, limit } = req.query;
    
    const result = await applicationService.getMyApplications(applicantId, {
      q,
      status,
      page,
      limit
    });
    
    res.status(200).json({
      success: true,
      message: 'Applications retrieved successfully',
      data: result.applications,
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
 * Get all applications for a specific job (recruiter only)
 */
const getJobApplications = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const jobId = req.params.jobId;
    
    const applications = await applicationService.getJobApplications(jobId, recruiterId);
    
    res.status(200).json({
      success: true,
      message: 'Applications retrieved successfully',
      data: applications
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Update application status (recruiter only)
 */
const updateApplicationStatus = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const applicationId = req.params.id;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    const application = await applicationService.updateApplicationStatus(applicationId, recruiterId, status);
    
    res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      data: application
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Get application by ID
 */
const getApplicationById = async (req, res) => {
  try {
    const applicationId = req.params.id;
    const application = await applicationService.getApplicationById(applicationId);
    
    res.status(200).json({
      success: true,
      message: 'Application retrieved successfully',
      data: application
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Withdraw application (job_seeker only)
 */
const withdrawApplication = async (req, res) => {
  try {
    const applicantId = req.user.id;
    const applicationId = req.params.id;
    
    const result = await applicationService.withdrawApplication(applicationId, applicantId);
    
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Shortlist candidate (recruiter only)
 */
const shortlistCandidate = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const applicationId = req.params.id;
    
    const application = await applicationService.shortlistCandidate(applicationId, recruiterId);
    
    res.status(200).json({
      success: true,
      message: 'Candidate shortlisted successfully',
      data: application
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Schedule interview (recruiter only)
 */
const scheduleInterview = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const applicationId = req.params.id;
    const interviewData = req.body;
    
    const application = await applicationService.scheduleInterview(applicationId, recruiterId, interviewData);
    
    res.status(200).json({
      success: true,
      message: 'Interview scheduled successfully',
      data: application
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Update recruiter notes (recruiter only)
 */
const updateRecruiterNotes = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const applicationId = req.params.id;
    const { notes } = req.body;
    
    const application = await applicationService.updateRecruiterNotes(applicationId, recruiterId, notes);
    
    res.status(200).json({
      success: true,
      message: 'Notes updated successfully',
      data: application
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Get application by job and candidate (recruiter only)
 */
const getApplicationByJobAndCandidate = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const { jobId, candidateId } = req.params;
    
    const application = await applicationService.getApplicationByJobAndCandidate(jobId, candidateId, recruiterId);
    
    res.status(200).json({
      success: true,
      message: application ? 'Application found' : 'No application found',
      data: application
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

module.exports = {
  applyForJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  getApplicationById,
  withdrawApplication,
  shortlistCandidate,
  scheduleInterview,
  updateRecruiterNotes,
  getApplicationByJobAndCandidate
};
