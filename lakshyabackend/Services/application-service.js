const ApplicationModel = require('../models/application-model');
const JobModel = require('../models/job-model');
const UserModel = require('../models/user-model');

/**
 * Apply for a job
 */
const applyForJob = async (jobId, applicantId, applicationData) => {
  try {
    // Check if job exists and is open
    const job = await JobModel.findById(jobId);
    
    if (!job) {
      const error = new Error('Job not found');
      error.statusCode = 404;
      throw error;
    }
    
    // Check if job is deleted or inactive
    if (job.isDeleted || !job.isActive) {
      const error = new Error('This job is no longer available');
      error.statusCode = 400;
      throw error;
    }
    
    if (job.status !== 'open') {
      const error = new Error('This job is no longer accepting applications');
      error.statusCode = 400;
      throw error;
    }
    
    // Check if user has already applied
    const existingApplication = await ApplicationModel.findOne({
      jobId,
      applicant: applicantId
    });
    
    if (existingApplication) {
      const error = new Error('You have already applied for this job');
      error.statusCode = 400;
      throw error;
    }
    
    // Get user's default resume if not provided
    let resume = applicationData.resume;
    if (!resume) {
      const user = await UserModel.findById(applicantId);
      resume = user.resume;
    }
    
    // Create application
    const application = new ApplicationModel({
      jobId,
      applicant: applicantId,
      resume,
      coverLetter: applicationData.coverLetter || null,
      status: 'applied'
    });
    
    await application.save();
    
    return application;
  } catch (error) {
    throw error;
  }
};

/**
 * Get all applications by a job seeker with optional filters
 * @param {string} applicantId - The user's ID
 * @param {Object} filters - Optional filters
 * @param {string} filters.q - Search query for job title or company
 * @param {string} filters.status - Filter by application status
 * @param {number} filters.page - Page number (default: 1)
 * @param {number} filters.limit - Items per page (default: 10)
 */
const getMyApplications = async (applicantId, filters = {}) => {
  try {
    const { q, status, page = 1, limit = 10 } = filters;
    
    // Base filter - applications by this user
    const query = { applicant: applicantId };
    
    // Add status filter if provided
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Execute query with population
    let applicationsQuery = ApplicationModel.find(query)
      .populate('jobId', 'title companyName location salary jobType status isActive isDeleted deletedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const applications = await applicationsQuery;
    
    // If search query provided, filter populated results
    let filteredApplications = applications;
    if (q && q.trim()) {
      const searchTerm = q.toLowerCase();
      filteredApplications = applications.filter(app => {
        if (!app.jobId) return false;
        const title = app.jobId.title?.toLowerCase() || '';
        const company = app.jobId.companyName?.toLowerCase() || '';
        return title.includes(searchTerm) || company.includes(searchTerm);
      });
    }
    
    // Get total count for pagination (before filtering by search)
    const total = await ApplicationModel.countDocuments(query);
    
    return {
      applications: filteredApplications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get all applications for a specific job (recruiter only)
 */
const getJobApplications = async (jobId, recruiterId) => {
  try {
    // Verify the job belongs to the recruiter
    const job = await JobModel.findOne({ _id: jobId, createdBy: recruiterId });
    
    if (!job) {
      const error = new Error('Job not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }
    
    const applications = await ApplicationModel.find({ jobId })
      .populate('applicant', 'name fullName email number phone resume profileImageUrl jobSeeker')
      .sort({ createdAt: -1 });
    
    return applications;
  } catch (error) {
    throw error;
  }
};

/**
 * Update application status (recruiter only)
 */
const updateApplicationStatus = async (applicationId, recruiterId, newStatus) => {
  try {
    const application = await ApplicationModel.findById(applicationId)
      .populate('jobId');
    
    if (!application) {
      const error = new Error('Application not found');
      error.statusCode = 404;
      throw error;
    }
    
    // Verify the job belongs to the recruiter
    if (application.jobId.createdBy.toString() !== recruiterId.toString()) {
      const error = new Error('Unauthorized: You can only update applications for your jobs');
      error.statusCode = 403;
      throw error;
    }
    
    // Valid status values
    const validStatuses = ['applied', 'shortlisted', 'interview', 'rejected'];
    if (!validStatuses.includes(newStatus)) {
      const error = new Error('Invalid status value');
      error.statusCode = 400;
      throw error;
    }
    
    application.status = newStatus;
    await application.save();
    
    // Populate before returning
    await application.populate('applicant', 'name email number');
    
    return application;
  } catch (error) {
    throw error;
  }
};

/**
 * Get application by ID
 */
const getApplicationById = async (applicationId) => {
  try {
    const application = await ApplicationModel.findById(applicationId)
      .populate('jobId', 'title companyName location salary jobType isActive isDeleted deletedAt')
      .populate('applicant', 'name email number resume');
    
    if (!application) {
      const error = new Error('Application not found');
      error.statusCode = 404;
      throw error;
    }
    
    return application;
  } catch (error) {
    throw error;
  }
};

/**
 * Withdraw application (job seeker only)
 */
const withdrawApplication = async (applicationId, applicantId) => {
  try {
    const application = await ApplicationModel.findOne({
      _id: applicationId,
      applicant: applicantId
    });
    
    if (!application) {
      const error = new Error('Application not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }
    
    await application.deleteOne();
    
    return { message: 'Application withdrawn successfully' };
  } catch (error) {
    throw error;
  }
};

/**
 * Shortlist candidate (recruiter only)
 */
const shortlistCandidate = async (applicationId, recruiterId) => {
  try {
    const application = await ApplicationModel.findById(applicationId)
      .populate('jobId');
    
    if (!application) {
      const error = new Error('Application not found');
      error.statusCode = 404;
      throw error;
    }
    
    // Verify the job belongs to the recruiter
    if (application.jobId.createdBy.toString() !== recruiterId.toString()) {
      const error = new Error('Unauthorized');
      error.statusCode = 403;
      throw error;
    }
    
    application.status = 'shortlisted';
    await application.save();
    
    await application.populate('applicant', 'name fullName email number phone profileImageUrl jobSeeker');
    
    return application;
  } catch (error) {
    throw error;
  }
};

/**
 * Schedule interview (recruiter only)
 */
const scheduleInterview = async (applicationId, recruiterId, interviewData) => {
  try {
    const application = await ApplicationModel.findById(applicationId)
      .populate('jobId');
    
    if (!application) {
      const error = new Error('Application not found');
      error.statusCode = 404;
      throw error;
    }
    
    // Verify the job belongs to the recruiter
    if (application.jobId.createdBy.toString() !== recruiterId.toString()) {
      const error = new Error('Unauthorized');
      error.statusCode = 403;
      throw error;
    }
    
    application.status = 'interview';
    application.interview = {
      date: interviewData.date || new Date(),
      mode: interviewData.mode || 'virtual',
      link: interviewData.link || ''
    };
    await application.save();
    
    await application.populate('applicant', 'name fullName email number phone profileImageUrl jobSeeker');
    
    return application;
  } catch (error) {
    throw error;
  }
};

/**
 * Update recruiter notes (recruiter only)
 */
const updateRecruiterNotes = async (applicationId, recruiterId, notes) => {
  try {
    const application = await ApplicationModel.findById(applicationId)
      .populate('jobId');
    
    if (!application) {
      const error = new Error('Application not found');
      error.statusCode = 404;
      throw error;
    }
    
    // Verify the job belongs to the recruiter
    if (application.jobId.createdBy.toString() !== recruiterId.toString()) {
      const error = new Error('Unauthorized');
      error.statusCode = 403;
      throw error;
    }
    
    application.notes = notes;
    await application.save();
    
    await application.populate('applicant', 'name fullName email number phone profileImageUrl jobSeeker');
    
    return application;
  } catch (error) {
    throw error;
  }
};

/**
 * Get application by candidate and job (for recruiter viewing candidate profile)
 */
const getApplicationByJobAndCandidate = async (jobId, candidateId, recruiterId) => {
  try {
    // First verify the recruiter owns the job
    const job = await JobModel.findOne({ _id: jobId, createdBy: recruiterId });
    
    if (!job) {
      const error = new Error('Job not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }
    
    // Find the application
    const application = await ApplicationModel.findOne({
      jobId,
      applicant: candidateId
    }).populate('applicant', 'name fullName email number phone profileImageUrl jobSeeker');
    
    // Return null if not found (not an error - candidate may not have applied)
    return application;
  } catch (error) {
    throw error;
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
