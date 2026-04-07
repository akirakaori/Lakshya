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
  hired: {
    type: 'hired',
    title: 'Congratulations! You are hired',
    messageBuilder: (jobTitle) => `Congratulations! You have been selected for ${jobTitle}`,
  },
};

const RECRUITER_POPULATE_FIELDS = [
  'name',
  'profileImage',
  'profileImageUrl',
  'recruiter.position',
  'jobSeeker.title',
].join(' ');

const BACKEND_BASE_URL = (process.env.PUBLIC_BACKEND_URL || process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '');

const normalizeProfileImageUrl = (value) => {
  if (!value || typeof value !== 'string') return null;

  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  if (/^https?:\/\//i.test(trimmedValue) || trimmedValue.startsWith('data:')) {
    return trimmedValue;
  }

  const normalizedPath = trimmedValue.startsWith('/') ? trimmedValue : `/${trimmedValue}`;
  return `${BACKEND_BASE_URL}${normalizedPath}`;
};

const buildRecruiterPayload = (createdBy) => {
  if (!createdBy) return null;

  const profileImageUrl = normalizeProfileImageUrl(createdBy.profileImageUrl || createdBy.profileImage || null);

  return {
    _id: createdBy._id,
    name: createdBy.name || '',
    profileImage: profileImageUrl,
    profileImageUrl,
    title: createdBy.recruiter?.position || createdBy.jobSeeker?.title || '',
  };
};

const attachRecruiterToJob = (job) => {
  if (!job || typeof job !== 'object') return job;

  const jobObject = typeof job.toObject === 'function' ? job.toObject() : { ...job };
  jobObject.recruiter = buildRecruiterPayload(jobObject.createdBy);
  return jobObject;
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

const ensureApplicationIsActionable = (application) => {
  if (application.isWithdrawn || application.status === 'withdrawn') {
    const error = new Error('This application was withdrawn by the candidate and cannot be updated');
    error.statusCode = 400;
    throw error;
  }
};

const ATS_ALLOWED_TRANSITIONS = {
  applied: ['shortlisted', 'rejected'],
  shortlisted: ['interview', 'rejected'],
  interview: ['hired', 'rejected'],
  hired: [],
  rejected: [],
};

const normalizeAtsStatus = (status) => {
  if (!status || typeof status !== 'string') return status;
  return status.toLowerCase();
};

const getAllowedNextStatuses = (currentStatus) => {
  const normalizedCurrent = normalizeAtsStatus(currentStatus);
  return ATS_ALLOWED_TRANSITIONS[normalizedCurrent] || [];
};

const validateAtsStatusTransition = (currentStatus, nextStatus) => {
  const normalizedCurrent = normalizeAtsStatus(currentStatus);
  const normalizedNext = normalizeAtsStatus(nextStatus);

  if (normalizedCurrent === normalizedNext) {
    return;
  }

  const allowedNext = getAllowedNextStatuses(normalizedCurrent);
  if (allowedNext.includes(normalizedNext)) {
    return;
  }

  const error = new Error(
    allowedNext.length > 0
      ? `Invalid status transition from ${normalizedCurrent} to ${normalizedNext}. Allowed next statuses: ${allowedNext.join(', ')}`
      : `Invalid status transition from ${normalizedCurrent} to ${normalizedNext}. ${normalizedCurrent} is a final stage and cannot be changed`
  );
  error.statusCode = 400;
  throw error;
};

const parseTimeMinutes = (timeValue) => {
  if (!timeValue || typeof timeValue !== 'string') return null;
  const match = timeValue.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return hour * 60 + minute;
};

const minutesToTimeString = (minutes) => {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, minutes));
  const hour = Math.floor(clamped / 60);
  const minute = clamped % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const normalizeInterviewSlot = (payload = {}, existingInterview = null) => {
  const existingStart = existingInterview?.startTime || existingInterview?.time;
  const incomingStart = payload.startTime || payload.time;
  const startTime = incomingStart || existingStart;

  const existingEnd = existingInterview?.endTime;
  const incomingEnd = payload.endTime;
  let endTime = incomingEnd || existingEnd;

  if (!endTime && startTime) {
    const startMinutes = parseTimeMinutes(startTime);
    if (startMinutes !== null) {
      endTime = minutesToTimeString(startMinutes + 60);
    }
  }

  return { startTime, endTime };
};

const validateInterviewSlot = ({ startTime, endTime }) => {
  const startMinutes = parseTimeMinutes(startTime);
  const endMinutes = parseTimeMinutes(endTime);

  if (startMinutes === null) {
    const error = new Error('Interview startTime is required and must be in HH:mm format');
    error.statusCode = 400;
    throw error;
  }

  if (endMinutes === null) {
    const error = new Error('Interview endTime is required and must be in HH:mm format');
    error.statusCode = 400;
    throw error;
  }

  if (endMinutes <= startMinutes) {
    const error = new Error('Interview endTime must be later than startTime');
    error.statusCode = 400;
    throw error;
  }
};

const resolveInterviewOutcome = (value) => {
  if (value === 'pass' || value === 'passed') return 'pass';
  if (value === 'fail' || value === 'failed' || value === 'rejected') return 'fail';
  if (value === 'pending' || value === 'hold' || value === 'shortlisted') return 'pending';
  return 'pending';
};

const normalizeInterviewMode = (mode) => {
  if (mode === 'online' || mode === 'virtual') return 'online';
  if (mode === 'onsite' || mode === 'in-person' || mode === 'in_person') return 'onsite';
  if (mode === 'phone' || mode === 'telephone') return 'phone';
  return mode;
};

const getInterviewSessionEndDate = (interview) => {
  if (!interview?.date) return null;

  const interviewDate = new Date(interview.date);
  if (Number.isNaN(interviewDate.getTime())) return null;

  const timeValue = interview.endTime || interview.startTime || interview.time;
  const minutes = parseTimeMinutes(timeValue);

  if (minutes === null) {
    return new Date(interviewDate.getFullYear(), interviewDate.getMonth(), interviewDate.getDate(), 23, 59, 59, 999);
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return new Date(
    interviewDate.getFullYear(),
    interviewDate.getMonth(),
    interviewDate.getDate(),
    hours,
    mins,
    59,
    999
  );
};

const sanitizeCandidateInterview = (interview) => ({
  _id: interview._id,
  roundNumber: interview.roundNumber,
  date: interview.date,
  startTime: interview.startTime || interview.time,
  endTime: interview.endTime,
  time: interview.startTime || interview.time,
  timezone: interview.timezone,
  mode: normalizeInterviewMode(interview.mode),
  linkOrLocation: interview.linkOrLocation,
  messageToCandidate: interview.messageToCandidate,
  outcome: resolveInterviewOutcome(interview.outcome),
  createdAt: interview.createdAt,
  updatedAt: interview.updatedAt,
});

const sanitizeApplicationForCandidate = (applicationDoc) => {
  const applicationObject = typeof applicationDoc.toObject === 'function'
    ? applicationDoc.toObject()
    : { ...applicationDoc };

  if (applicationObject.jobId && typeof applicationObject.jobId === 'object') {
    applicationObject.jobId = attachRecruiterToJob(applicationObject.jobId);
  }

  if (Array.isArray(applicationObject.interviews)) {
    applicationObject.interviews = applicationObject.interviews.map(sanitizeCandidateInterview);
  }

  return applicationObject;
};

const buildMongooseValidationError = (error, fallbackMessage = 'Validation failed') => {
  if (!error || error.name !== 'ValidationError' || !error.errors) {
    return null;
  }

  const details = Object.values(error.errors)
    .map((issue) => issue?.message)
    .filter(Boolean);

  const message = details.length > 0
    ? `${fallbackMessage}: ${details.join('; ')}`
    : fallbackMessage;

  const validationError = new Error(message);
  validationError.statusCode = 400;
  return validationError;
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
    
    // Get user's default resume if not provided
    let resume = applicationData.resume;
    if (!resume) {
      const user = await UserModel.findById(applicantId);
      resume = user.resume;
    }

    // Determine whether a match analysis already exists for this user + job
    let hasMatchAnalysis = false;
    let analysisStatus = 'not_analyzed';
    let analysisSnapshot = null;
    try {
      const existingAnalysis = await JobMatchAnalysis.findOne({ userId: applicantId, jobId }).lean();
      hasMatchAnalysis = !!existingAnalysis;
      if (hasMatchAnalysis) {
        analysisStatus = 'analyzed';
        analysisSnapshot = existingAnalysis;
      }
    } catch (analysisErr) {
      console.warn('⚠ Failed to check existing match analysis for application:', analysisErr.message);
    }

    const applyAnalysisSnapshot = (target) => {
      if (!target) return;

      if (analysisSnapshot) {
        target.matchScore = typeof analysisSnapshot.matchScore === 'number' ? analysisSnapshot.matchScore : 0;
        target.matchedSkills = Array.isArray(analysisSnapshot.matchedSkills) ? analysisSnapshot.matchedSkills : [];
        target.missingSkills = Array.isArray(analysisSnapshot.missingSkills) ? analysisSnapshot.missingSkills : [];
        target.matchAnalyzedAt = analysisSnapshot.analyzedAt || null;
        target.suggestionSource = analysisSnapshot.suggestionSource || null;
        target.profileUpdatedAtUsed = analysisSnapshot.profileUpdatedAtUsed || null;
        target.resumeParsedAtUsed = analysisSnapshot.resumeParsedAtUsed || null;
      } else {
        target.matchScore = 0;
        target.matchedSkills = [];
        target.missingSkills = [];
        target.matchAnalyzedAt = null;
        target.suggestionSource = null;
        target.profileUpdatedAtUsed = null;
        target.resumeParsedAtUsed = null;
      }
    };

    let application;

    if (existingApplication) {
      if (!(existingApplication.isWithdrawn || existingApplication.status === 'withdrawn')) {
        const error = new Error('You have already applied for this job');
        error.statusCode = 400;
        throw error;
      }

      existingApplication.resume = resume;
      existingApplication.coverLetter = applicationData.coverLetter || null;
      existingApplication.status = 'applied';
      existingApplication.isWithdrawn = false;
      existingApplication.withdrawnAt = null;
      existingApplication.withdrawnBy = null;
      existingApplication.hasMatchAnalysis = hasMatchAnalysis;
      existingApplication.analysisStatus = analysisStatus;
      applyAnalysisSnapshot(existingApplication);
      application = existingApplication;
    } else {
      // Create application without triggering any resume analysis
      application = new ApplicationModel({
        jobId,
        applicant: applicantId,
        resume,
        coverLetter: applicationData.coverLetter || null,
        status: 'applied',
        hasMatchAnalysis,
        analysisStatus,
      });
      applyAnalysisSnapshot(application);
    }

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
      select: 'title companyName location salary jobType status isActive isDeleted deletedAt deletedBy deletedByRole createdBy',
      populate: {
        path: 'createdBy',
        select: RECRUITER_POPULATE_FIELDS,
      },
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

    const sanitizedApplications = filteredApplications.map(sanitizeApplicationForCandidate);
    
    return {
      applications: sanitizedApplications,
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
    let application = await ApplicationModel.findById(applicationId)
      .populate('jobId');

    if (!application) {
      const error = new Error('Application not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify the job belongs to the recruiter
    if (!application.jobId || !application.jobId.createdBy || application.jobId.createdBy.toString() !== recruiterId.toString()) {
      const error = new Error('Unauthorized: You can only update applications for your jobs');
      error.statusCode = 403;
      throw error;
    }

    // Valid status values
    const validStatuses = ['applied', 'shortlisted', 'interview', 'rejected', 'hired'];
    if (!validStatuses.includes(newStatus)) {
      const error = new Error('Invalid status value');
      error.statusCode = 400;
      throw error;
    }

    ensureApplicationIsActionable(application);
    validateAtsStatusTransition(application.status, newStatus);

    application.status = newStatus;
    await application.save();

    // Ensure job title is available for notification
    let jobTitle = application.jobId?.title;
    let jobId = application.jobId?._id || application.jobId;
    if (!jobTitle || !jobId) {
      // Fallback: fetch job if not populated
      const jobDoc = await JobModel.findById(application.jobId);
      if (jobDoc) {
        jobTitle = jobDoc.title;
        jobId = jobDoc._id;
      }
    }

    // Debug log for notification creation
    if (newStatus === 'hired') {
      console.log('[NOTIFICATION] Creating hired notification for applicant:', application.applicant, 'job:', jobTitle);
    }

    await createApplicantStatusNotification({
      ...application.toObject(),
      jobId: { _id: jobId, title: jobTitle },
    }, newStatus);

    // Populate before returning
    await application.populate('applicant', 'name email number');

    return application;
  } catch (error) {
    throw error;
  }
}

/**
 * Get application by ID
 */
const getApplicationById = async (applicationId, requester = null) => {
  try {
    const application = await ApplicationModel.findById(applicationId)
      .populate({
        path: 'jobId',
        select: 'title companyName location salary jobType isActive isDeleted deletedAt createdBy',
        populate: {
          path: 'createdBy',
          select: RECRUITER_POPULATE_FIELDS,
        },
      })
      .populate('applicant', 'name email number resume');
    
    if (!application) {
      const error = new Error('Application not found');
      error.statusCode = 404;
      throw error;
    }
    
    const isRequesterJobSeeker = requester?.role === 'job_seeker';
    const requesterId = requester?.id ? requester.id.toString() : null;
    const isOwner = requesterId && application.applicant?._id?.toString() === requesterId;

    if (isRequesterJobSeeker && isOwner) {
      return sanitizeApplicationForCandidate(application);
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

    if (application.isWithdrawn || application.status === 'withdrawn') {
      const error = new Error('Application is already withdrawn');
      error.statusCode = 400;
      throw error;
    }

    const allowedStatuses = ['applied', 'shortlisted'];
    if (!allowedStatuses.includes(application.status)) {
      const error = new Error('You can only withdraw applications in applied or shortlisted status');
      error.statusCode = 400;
      throw error;
    }

    const job = await JobModel.findById(application.jobId).select('title createdBy');

    application.isWithdrawn = true;
    application.withdrawnAt = new Date();
    application.withdrawnBy = applicantId;
    application.status = 'withdrawn';
    await application.save();

    
    if (job?.createdBy) {
      try {
        await notificationService.createNotification({
              recipientId: applicantId,
              type: 'application_withdrawn',
              title: 'Application Withdrawn',
              message: `You withdrew your application for ${job.title || 'this job'}`,
              relatedJobId: job._id,
              relatedApplicationId: application._id,
            });
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

    ensureApplicationIsActionable(application);
    validateAtsStatusTransition(application.status, 'shortlisted');
    
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

    ensureApplicationIsActionable(application);
    validateAtsStatusTransition(application.status, 'interview');
    
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

    ensureApplicationIsActionable(application);
    if (application.status !== 'interview') {
      validateAtsStatusTransition(application.status, 'interview');
    }
    
    
    // Auto-compute round number if not provided
    const roundNumber = interviewData.roundNumber || (application.interviews.length + 1);
    const { startTime, endTime } = normalizeInterviewSlot(interviewData);
    validateInterviewSlot({ startTime, endTime });
    
    // Create new interview round
    const newInterview = {
      roundNumber,
      date: interviewData.date,
      startTime,
      endTime,
      time: startTime,
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

    // Reload application to ensure all interview subdocuments have _id
    const reloaded = await ApplicationModel.findById(application._id)
      .populate('jobId')
      .populate('applicant', 'name fullName email number phone profileImageUrl jobSeeker');

    return reloaded;
  } catch (error) {
    throw error;
  }
};

/**
 * Update interview feedback/outcome (recruiter only)
 */
const updateInterviewFeedback = async (applicationId, interviewId, recruiterId, feedbackData) => {
  try {
    console.log('[INTERVIEW OUTCOME] Incoming request:', {
      applicationId,
      interviewId,
      recruiterId,
      payload: feedbackData,
    });

    const application = await ApplicationModel.findById(applicationId)
      .populate('jobId');
    
    if (!application) {
      const error = new Error('Application not found');
      error.statusCode = 404;
      throw error;
    }
    
    // Verify the job belongs to the recruiter
    if (!application.jobId || !application.jobId.createdBy) {
      const error = new Error('Associated job not found for this application');
      error.statusCode = 404;
      throw error;
    }

    if (application.jobId.createdBy.toString() !== recruiterId.toString()) {
      const error = new Error('Unauthorized');
      error.statusCode = 403;
      throw error;
    }

    ensureApplicationIsActionable(application);
    
    // Find the interview by ID
    if (!Array.isArray(application.interviews) || application.interviews.length === 0) {
      const error = new Error('No interview rounds found for this application');
      error.statusCode = 400;
      throw error;
    }

    const interview = application.interviews.id(interviewId);
    if (!interview) {
      const error = new Error('Interview not found');
      error.statusCode = 404;
      throw error;
    }
    
    // Update feedback fields
    if (feedbackData.outcome !== undefined) {
      const validRequestOutcomes = ['pass', 'fail', 'pending', 'passed', 'failed', 'hold', 'shortlisted', 'rejected'];
      if (!validRequestOutcomes.includes(feedbackData.outcome)) {
        const error = new Error('Invalid interview outcome value. Allowed values: pass, fail, pending');
        error.statusCode = 400;
        throw error;
      }

      const normalizedOutcome = resolveInterviewOutcome(feedbackData.outcome);
      const interviewEndAt = getInterviewSessionEndDate(interview);

      if ((normalizedOutcome === 'pass' || normalizedOutcome === 'fail') && interviewEndAt && interviewEndAt > new Date()) {
        const error = new Error('Interview result can only be marked after the session is completed');
        error.statusCode = 400;
        throw error;
      }

      interview.outcome = normalizedOutcome;
    }
    if (feedbackData.feedback !== undefined) {
      interview.feedback = feedbackData.feedback;
    }
    interview.updatedAt = new Date();

    // Normalize legacy values in all rounds before save so stale data cannot trigger validation 500s.
    application.interviews.forEach((round) => {
      round.outcome = resolveInterviewOutcome(round.outcome);
      round.mode = normalizeInterviewMode(round.mode);
    });
    
    await application.save().catch((saveError) => {
      const validationError = buildMongooseValidationError(saveError, 'Interview update rejected');
      if (validationError) {
        throw validationError;
      }

      throw saveError;
    });
    
    // Reload application to ensure all interview subdocuments have _id
    const reloaded = await ApplicationModel.findById(application._id)
      .populate('jobId')
      .populate('applicant', 'name fullName email number phone profileImageUrl jobSeeker');

    return reloaded;
  } catch (error) {
    console.error('[INTERVIEW OUTCOME] Failed to update:', {
      applicationId,
      interviewId,
      recruiterId,
      payload: feedbackData,
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack,
    });
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

    ensureApplicationIsActionable(application);
    
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
    const { startTime, endTime } = normalizeInterviewSlot(interviewData, interview);
    validateInterviewSlot({ startTime, endTime });
    interview.startTime = startTime;
    interview.endTime = endTime;
    interview.time = startTime;
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
