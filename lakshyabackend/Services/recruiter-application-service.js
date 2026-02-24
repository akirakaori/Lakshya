const ApplicationModel = require('../models/application-model');
const JobModel = require('../models/job-model');
const UserModel = require('../models/user-model');

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
    missing = '' 
  } = filters;

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

  // Update status
  application.status = newStatus;
  await application.save();

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

  // Bulk update
  const result = await ApplicationModel.updateMany(
    {
      _id: { $in: applicationIds },
      jobId: jobId
    },
    {
      $set: { status: newStatus }
    }
  );

  return {
    modifiedCount: result.modifiedCount,
    status: newStatus
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
