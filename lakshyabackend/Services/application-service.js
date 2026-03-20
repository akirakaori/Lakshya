const ApplicationModel = require('../models/application-model');
const JobModel = require('../models/job-model');
const UserModel = require('../models/user-model');
const JobMatchAnalysis = require('../models/job-match-analysis');
const notificationService = require('./notification-service');

const statusNotificationMap = {
  shortlisted: {
    type: 'shortlisted',
    title: 'You were shortlisted',
    messageBuilder: (jobTitle) => `You were shortlisted for ${jobTitle}`,
  },
  interview: {
    type: 'interview_scheduled',
    title: 'Interview Scheduled',
    messageBuilder: (jobTitle) => `Your interview has been scheduled for ${jobTitle}`,
  },
  rejected: {
    type: 'rejected',
    title: 'Application Update',
    messageBuilder: (jobTitle) => `Your application for ${jobTitle} was not selected`,
  },
};

const createApplicantStatusNotification = async (application, status) => {
  const config = statusNotificationMap[status];
  if (!config) {
    return;
  }

  try {
    const jobTitle = application.jobId?.title || 'this job';
    await notificationService.createNotification({
      recipientId: application.applicant,
      type: config.type,
      title: config.title,
      message: config.messageBuilder(jobTitle),
      relatedJobId: application.jobId?._id || application.jobId,
      relatedApplicationId: application._id,
    });
  } catch (notificationError) {
    console.warn('⚠ Failed to create applicant status notification:', notificationError.message);
  }
};

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

    // Determine whether a match analysis already exists for this user + job
    let hasMatchAnalysis = false;
    let analysisStatus = 'not_analyzed';
    try {
      const existingAnalysis = await JobMatchAnalysis.findOne({ userId: applicantId, jobId });
      hasMatchAnalysis = !!existingAnalysis;
      if (hasMatchAnalysis) {
        analysisStatus = 'analyzed';
      }
    } catch (analysisErr) {
      console.warn('⚠ Failed to check existing match analysis for application:', analysisErr.message);
    }

    // Create application without triggering any resume analysis
    const application = new ApplicationModel({
      jobId,
      applicant: applicantId,
      resume,
      coverLetter: applicationData.coverLetter || null,
      status: 'applied',
      hasMatchAnalysis,
      analysisStatus,
    });
    
    await application.save();

    try {
      const jobTitle = job.title || 'this job';

      await notificationService.createNotification({
        recipientId: applicantId,
        type: 'application_submitted',
        title: 'Application Submitted',
        message: `You successfully applied for ${jobTitle}`,
        relatedJobId: job._id,
        relatedApplicationId: application._id,
      });

      if (job.createdBy) {
        await notificationService.createNotification({
          recipientId: job.createdBy,
          type: 'new_applicant',
          title: 'New Applicant',
          message: `A new applicant applied for ${jobTitle}`,
          relatedJobId: job._id,
          relatedApplicationId: application._id,
        });
      }
    } catch (notificationError) {
      console.warn('⚠ Failed to create application notifications:', notificationError.message);
    }
    
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

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    const safePage = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;
    const safeLimit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.floor(parsedLimit) : 10;
    
    // Base filter - applications by this user
    const query = { applicant: applicantId };
    
    // Add status filter if provided
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const populateConfig = {
      path: 'jobId',
      select: 'title companyName location salary jobType status isActive isDeleted deletedAt deletedBy deletedByRole'
    };

    let filteredApplications = [];
    let total = 0;

    // If search query is present, filter first then paginate to keep totals/pages accurate.
    if (q && q.trim()) {
      const searchTerm = q.trim().toLowerCase();
      const allApplications = await ApplicationModel.find(query)
        .populate(populateConfig)
        .sort({ createdAt: -1 });

      const matchedApplications = allApplications.filter((app) => {
        if (!app.jobId) return false;
        const title = app.jobId.title?.toLowerCase() || '';
        const company = app.jobId.companyName?.toLowerCase() || '';
        return title.includes(searchTerm) || company.includes(searchTerm);
      });

      total = matchedApplications.length;
      const skip = (safePage - 1) * safeLimit;
      filteredApplications = matchedApplications.slice(skip, skip + safeLimit);
    } else {
      const skip = (safePage - 1) * safeLimit;
      filteredApplications = await ApplicationModel.find(query)
        .populate(populateConfig)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit);

      total = await ApplicationModel.countDocuments(query);
    }

    const totalPages = total === 0 ? 1 : Math.ceil(total / safeLimit);
    
    return {
      applications: filteredApplications,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages,
        pages: totalPages,
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

    await createApplicantStatusNotification(application, newStatus);
    
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

    const job = await JobModel.findById(application.jobId).select('title createdBy');
    
    await application.deleteOne();

    if (job?.createdBy) {
      try {
        await notificationService.createNotification({
          recipientId: job.createdBy,
          type: 'application_withdrawn',
          title: 'Application Withdrawn',
          message: `A candidate withdrew their application for ${job.title || 'this job'}`,
          relatedJobId: job._id,
          relatedApplicationId: application._id,
        });
      } catch (notificationError) {
        console.warn('⚠ Failed to create withdraw notification:', notificationError.message);
      }
    }
    
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

    await createApplicantStatusNotification(application, 'shortlisted');
    
    await application.populate('applicant', 'name fullName email number phone profileImageUrl jobSeeker');
    
    return application;
  } catch (error) {
    throw error;
  }
};

/**
 * Schedule interview (recruiter only) - LEGACY single interview
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

    await createApplicantStatusNotification(application, 'interview');
    
    await application.populate('applicant', 'name fullName email number phone profileImageUrl jobSeeker');
    
    return application;
  } catch (error) {
    throw error;
  }
};

/**
 * Schedule multi-round interview (recruiter only)
 */
const scheduleInterviewRound = async (applicationId, recruiterId, interviewData) => {
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
    
    // Initialize interviews array if it doesn't exist
    if (!application.interviews) {
      application.interviews = [];
    }
    
    // Auto-compute round number if not provided
    const roundNumber = interviewData.roundNumber || (application.interviews.length + 1);
    
    // Create new interview round
    const newInterview = {
      roundNumber,
      date: interviewData.date,
      time: interviewData.time,
      timezone: interviewData.timezone,
      mode: interviewData.mode,
      linkOrLocation: interviewData.linkOrLocation,
      messageToCandidate: interviewData.messageToCandidate,
      internalNotes: interviewData.internalNotes,
      outcome: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add to interviews array
    application.interviews.push(newInterview);
    
    // Update status to interview if not already
    if (application.status !== 'interview') {
      application.status = 'interview';
    }
    
    await application.save();

    await createApplicantStatusNotification(application, 'interview');
    
    // Populate before returning
    await application.populate('applicant', 'name fullName email number phone profileImageUrl jobSeeker');
    
    return application;
  } catch (error) {
    throw error;
  }
};

/**
 * Update interview feedback/outcome (recruiter only)
 */
const updateInterviewFeedback = async (applicationId, interviewId, recruiterId, feedbackData) => {
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
    
    // Find the interview by ID
    const interview = application.interviews.id(interviewId);
    if (!interview) {
      const error = new Error('Interview not found');
      error.statusCode = 404;
      throw error;
    }
    
    // Update feedback fields
    if (feedbackData.outcome) {
      interview.outcome = feedbackData.outcome;
    }
    if (feedbackData.feedback !== undefined) {
      interview.feedback = feedbackData.feedback;
    }
    interview.updatedAt = new Date();
    
    await application.save();
    
    await application.populate('applicant', 'name fullName email number phone profileImageUrl jobSeeker');
    
    return application;
  } catch (error) {
    throw error;
  }
};

/**
 * Update interview round details (reschedule)
 */
const updateInterviewRound = async (applicationId, interviewId, recruiterId, interviewData) => {
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
    
    // Find the interview by ID
    const interview = application.interviews.id(interviewId);
    
    if (!interview) {
      const error = new Error('Interview round not found');
      error.statusCode = 404;
      throw error;
    }
    
    // Only allow editing if outcome is pending (not completed)
    if (interview.outcome && interview.outcome !== 'pending') {
      const error = new Error('Cannot edit completed interview rounds');
      error.statusCode = 400;
      throw error;
    }
    
    // Update interview fields
    if (interviewData.date !== undefined) interview.date = interviewData.date;
    if (interviewData.time !== undefined) interview.time = interviewData.time;
    if (interviewData.timezone !== undefined) interview.timezone = interviewData.timezone;
    if (interviewData.mode !== undefined) interview.mode = interviewData.mode;
    if (interviewData.linkOrLocation !== undefined) interview.linkOrLocation = interviewData.linkOrLocation;
    if (interviewData.messageToCandidate !== undefined) interview.messageToCandidate = interviewData.messageToCandidate;
    if (interviewData.internalNotes !== undefined) interview.internalNotes = interviewData.internalNotes;
    interview.updatedAt = new Date();
    
    await application.save();
    
    // Populate applicant details
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
  scheduleInterviewRound,
  updateInterviewFeedback,
  updateInterviewRound,
  updateRecruiterNotes,
  getApplicationByJobAndCandidate
};
