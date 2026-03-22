const ApplicationModel = require('../models/application-model');
const JobModel = require('../models/job-model');
const UserModel = require('../models/user-model');
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
    title: 'Congratulations!',
    messageBuilder: (jobTitle) => `You have been hired for ${jobTitle}`,
  },
  offer: {
    type: 'hired',
    title: 'Congratulations!',
    messageBuilder: (jobTitle) => `You have been hired for ${jobTitle}`,
  },
};

const notifyApplicantOnStatusUpdate = async ({ application, status, jobTitle }) => {
  const config = statusNotificationMap[status];
  console.log('[RECRUITER STATUS][NOTIFY] Notification lookup:', {
    applicationId: application?._id?.toString?.() || application?._id,
    applicantId: application?.applicant?._id?.toString?.() || application?.applicant,
    incomingStatus: status,
    resolvedNotificationType: config?.type || null,
    jobTitle: jobTitle || null,
  });
  if (!config || !application?.applicant) {
    console.log('[RECRUITER STATUS][NOTIFY] Skipping notification creation', {
      hasConfig: !!config,
      hasApplicant: !!application?.applicant,
    });
    return;
  }

  try {
    const notificationPayload = {
      recipientId: application.applicant,
      type: config.type,
      title: config.title,
      message: config.messageBuilder(jobTitle || 'this job'),
      relatedJobId: application.jobId?._id || application.jobId,
      relatedApplicationId: application._id,
    };
    console.log('[RECRUITER STATUS][NOTIFY] Creating notification with payload:', notificationPayload);
    const notificationResult = await notificationService.createNotification(notificationPayload);
    console.log('[RECRUITER STATUS][NOTIFY] Notification creation result:', {
      success: notificationResult?.success,
      notificationId: notificationResult?.data?._id,
      type: notificationResult?.data?.type,
      recipientId: notificationResult?.data?.recipientId,
    });
  } catch (notificationError) {
    console.warn('⚠ Failed to create recruiter status notification:', notificationError.message);
  }
};

const ensureApplicationIsActionable = (application) => {
  if (application.isWithdrawn || application.status === 'withdrawn') {
    throw { statusCode: 400, message: 'This application was withdrawn by the candidate and cannot be updated' };
  }
};

/**
 * Normalize skill for matching (lowercase, trim)
 */
const normalizeSkill = (skill) => {
  return skill.toLowerCase().trim();
};

/**
 * Get all applications for a specific job with filtering and sorting
 */
const getJobApplications = async (jobId, recruiterId, filters = {}) => {
  const { 
    status = 'all', 
    sort = 'newest', 
    search = '', 
    minScore = 0, 
    mustHave = '', 
    missing = '',
    analysisStatus = 'all',
  } = filters;

  console.log('📥 [RecruiterApplications] Incoming filters:', {
    status,
    sort,
    search,
    minScore,
    mustHave,
    missing,
    analysisStatus,
  });

  // Validate job exists and recruiter owns it
  const job = await JobModel.findById(jobId);
  if (!job) {
    throw { statusCode: 404, message: 'Job not found' };
  }
  if (job.createdBy.toString() !== recruiterId.toString()) {
    throw { statusCode: 403, message: 'You are not authorized to view applications for this job' };
  }

  // Build query filter
  const query = { jobId };
  
  // Status filter
  if (status !== 'all') {
    query.status = status;
  }

  // Minimum match score filter
  if (minScore > 0) {
    query.matchScore = { $gte: parseInt(minScore) };
  }
  
  // Must-have skill filter (candidate must have this skill)
  if (mustHave && mustHave.trim()) {
    const normalizedSkill = normalizeSkill(mustHave.trim());
    query.matchedSkills = { $in: [new RegExp(`^${normalizedSkill}$`, 'i')] };
  }
  
  // Missing skill filter (candidate is missing this skill)
  if (missing && missing.trim()) {
    const normalizedSkill = normalizeSkill(missing.trim());
    query.missingSkills = { $in: [new RegExp(`^${normalizedSkill}$`, 'i')] };
  }

  // Build sort criteria
  let sortCriteria = {};
  switch (sort) {
    case 'match':
      sortCriteria = { matchScore: -1, createdAt: -1 };
      break;
    case 'experience':
      sortCriteria = { experienceYears: -1, createdAt: -1 };
      break;
    case 'newest':
    default:
      sortCriteria = { createdAt: -1 };
      break;
  }

  // Fetch applications with applicant details
  let applications = await ApplicationModel.find(query)
    .populate({
      path: 'applicant',
      select: 'fullName name email profileImageUrl jobSeeker.skills jobSeeker.title jobSeeker.resumeUrl'
    })
    .sort(sortCriteria)
    .lean();

  // Apply search filter on populated data (post-query filtering for name/email)
  if (search && search.trim()) {
    const searchLower = search.toLowerCase().trim();
    applications = applications.filter(app => {
      if (!app.applicant) return false;
      const name = (app.applicant.fullName || app.applicant.name || '').toLowerCase();
      const email = (app.applicant.email || '').toLowerCase();
      return name.includes(searchLower) || email.includes(searchLower);
    });
  }

  // Normalize analysis status for each application (handles legacy records)
  applications = applications.map((app) => {
    let normalizedStatus = app.analysisStatus;

    if (normalizedStatus !== 'analyzed' && normalizedStatus !== 'not_analyzed') {
      const hasAnyAnalysisSnapshot =
        app.hasMatchAnalysis === true ||
        (typeof app.matchScore === 'number' && app.matchScore > 0) ||
        (Array.isArray(app.matchedSkills) && app.matchedSkills.length > 0) ||
        !!app.matchAnalyzedAt;

      normalizedStatus = hasAnyAnalysisSnapshot ? 'analyzed' : 'not_analyzed';
    }

    return {
      ...app,
      analysisStatus: normalizedStatus,
    };
  });

  // Apply analysis status filter after normalization
  if (analysisStatus === 'analyzed') {
    applications = applications.filter((app) => app.analysisStatus === 'analyzed');
  } else if (analysisStatus === 'not_analyzed') {
    applications = applications.filter((app) => app.analysisStatus === 'not_analyzed');
  }

  // Debug logging for analysis-related fields per application
  applications.forEach((app) => {
    console.log('📄 [RecruiterApplications] Application analysis snapshot:', {
      _id: app._id,
      analysisStatus: app.analysisStatus,
      matchScore: app.matchScore,
      matchedSkillsLength: Array.isArray(app.matchedSkills) ? app.matchedSkills.length : 0,
      matchAnalyzedAt: app.matchAnalyzedAt,
    });
  });

  // Calculate counts per status
  const counts = await ApplicationModel.aggregate([
    { $match: { jobId: job._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const countMap = {
    applied: 0,
    shortlisted: 0,
    interview: 0,
    rejected: 0,
    hired: 0,
    offer: 0,
    withdrawn: 0,
    total: 0
  };

  counts.forEach(({ _id, count }) => {
    countMap[_id] = count;
    countMap.total += count;
  });

  return {
    job: {
      _id: job._id,
      title: job.title,
      companyName: job.companyName
    },
    counts: countMap,
    applications
  };
};

/**
 * Update application status (single)
 */
const updateApplicationStatus = async (applicationId, recruiterId, newStatus) => {
  const normalizedStatus = newStatus === 'offer' ? 'hired' : newStatus;
  console.log('[RECRUITER STATUS][SERVICE] Incoming status update request:', {
    applicationId,
    recruiterId,
    incomingStatus: newStatus,
    normalizedStatus,
  });
  // Validate status
  const validStatuses = ['applied', 'shortlisted', 'interview', 'rejected', 'hired', 'offer'];
  if (!validStatuses.includes(newStatus)) {
    throw { statusCode: 400, message: 'Invalid status value' };
  }

  // Find application and populate job to check ownership
  const application = await ApplicationModel.findById(applicationId).populate('jobId');
  if (!application) {
    throw { statusCode: 404, message: 'Application not found' };
  }

  // Verify recruiter owns the job
  if (application.jobId.createdBy.toString() !== recruiterId.toString()) {
    throw { statusCode: 403, message: 'You are not authorized to update this application' };
  }

  ensureApplicationIsActionable(application);
  const oldStatus = application.status;

  // Update status
  application.status = normalizedStatus;
  await application.save();
  console.log('[RECRUITER STATUS][SERVICE] Application status saved:', {
    applicationId,
    recruiterId,
    oldStatus,
    newStatus: application.status,
    notificationAttempted: !!statusNotificationMap[normalizedStatus],
  });

  await notifyApplicantOnStatusUpdate({
    application,
    status: normalizedStatus,
    jobTitle: application.jobId?.title,
  });

  // Return updated application with applicant details
  const updatedApplication = await ApplicationModel.findById(applicationId)
    .populate({
      path: 'applicant',
      select: 'fullName name email profileImageUrl jobSeeker.skills jobSeeker.title jobSeeker.resumeUrl'
    })
    .lean();

  return updatedApplication;
};

/**
 * Bulk update application statuses
 */
const bulkUpdateApplicationStatus = async (jobId, recruiterId, applicationIds, newStatus) => {
  const normalizedStatus = newStatus === 'offer' ? 'hired' : newStatus;
  console.log('[RECRUITER STATUS][SERVICE][BULK] Incoming bulk status update request:', {
    jobId,
    recruiterId,
    applicationIds,
    incomingStatus: newStatus,
    normalizedStatus,
  });
  // Validate status
  const validStatuses = ['applied', 'shortlisted', 'interview', 'rejected', 'hired', 'offer'];
  if (!validStatuses.includes(newStatus)) {
    throw { statusCode: 400, message: 'Invalid status value' };
  }

  // Validate job exists and recruiter owns it
  const job = await JobModel.findById(jobId);
  if (!job) {
    throw { statusCode: 404, message: 'Job not found' };
  }
  if (job.createdBy.toString() !== recruiterId.toString()) {
    throw { statusCode: 403, message: 'You are not authorized to update applications for this job' };
  }

  const applicationsToNotify = await ApplicationModel.find(
    {
      _id: { $in: applicationIds },
      jobId: jobId,
    },
    '_id applicant jobId status isWithdrawn'
  ).lean();

  const withdrawnApplications = applicationsToNotify.filter(
    (application) => application.isWithdrawn || application.status === 'withdrawn'
  );

  if (withdrawnApplications.length > 0) {
    throw {
      statusCode: 400,
      message: 'One or more selected applications were withdrawn and cannot be updated',
    };
  }

  // Bulk update
  const result = await ApplicationModel.updateMany(
    {
      _id: { $in: applicationIds },
      jobId: jobId
    },
    {
      $set: { status: normalizedStatus }
    }
  );

  console.log('[RECRUITER STATUS][SERVICE][BULK] Bulk status update saved:', {
    jobId,
    recruiterId,
    modifiedCount: result.modifiedCount,
    newStatus: normalizedStatus,
    notificationAttempted: !!statusNotificationMap[normalizedStatus],
  });

  if (statusNotificationMap[normalizedStatus]) {
    await Promise.allSettled(
      applicationsToNotify.map((application) =>
        notifyApplicantOnStatusUpdate({
          application,
          status: normalizedStatus,
          jobTitle: job.title,
        })
      )
    );
  }

  return {
    modifiedCount: result.modifiedCount,
    status: normalizedStatus
  };
};

/**
 * Get single application details with candidate profile and match snapshot
 * Used by recruiter to view applicant profile with frozen match data from apply time
 */
const getApplicationDetails = async (applicationId, recruiterId) => {
  // Find application and populate job and applicant
  const application = await ApplicationModel.findById(applicationId)
    .populate('jobId')
    .populate({
      path: 'applicant',
      select: 'fullName name email phone profileImageUrl jobSeeker createdAt'
    })
    .lean();

  if (!application) {
    throw { statusCode: 404, message: 'Application not found' };
  }

  // Verify recruiter owns the job
  if (application.jobId.createdBy.toString() !== recruiterId.toString()) {
    throw { statusCode: 403, message: 'You are not authorized to view this application' };
  }

  console.log(`📋 Recruiter viewing application: applicationId=${applicationId}, matchScore=${application.matchScore}, matchedSkills=${application.matchedSkills?.length || 0}`);

  return {
    application: {
      _id: application._id,
      status: application.status,
      notes: application.notes,
      coverLetter: application.coverLetter,
      createdAt: application.createdAt,
      withdrawnAt: application.withdrawnAt,
      isWithdrawn: application.isWithdrawn,
      // Match snapshot (frozen at apply time)
      matchScore: application.matchScore || 0,
      matchedSkills: application.matchedSkills || [],
      missingSkills: application.missingSkills || [],
      matchAnalyzedAt: application.matchAnalyzedAt,
      experienceYears: application.experienceYears || 0,
      // Interview data (both legacy and new multi-round)
      interview: application.interview,
      interviews: application.interviews || [], // Multi-round interviews array
      jobId: {
        _id: application.jobId._id,
        title: application.jobId.title,
        interviewRoundsRequired: application.jobId.interviewRoundsRequired || 2
      } // Include jobId with interview rounds info
    },
    candidate: application.applicant,
    job: {
      _id: application.jobId._id,
      title: application.jobId.title,
      companyName: application.jobId.companyName
    }
  };
};

module.exports = {
  getJobApplications,
  updateApplicationStatus,
  bulkUpdateApplicationStatus,
  getApplicationDetails
};
