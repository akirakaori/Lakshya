const JobModel = require('../models/job-model');
const UserModel = require('../models/user-model');
const { ROLES } = require('../Library/roles');

const INTERNAL_TEST_JOB_EXCLUSION = {
  isTestData: { $ne: true },
  $nor: [
    {
      title: /^Withdraw Flow QA$/i,
      companyName: /^TestCo$/i,
      description: /withdraw lifecycle/i,
    },
  ],
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
  if (!job) return job;

  const jobObject = typeof job.toObject === 'function' ? job.toObject() : { ...job };
  jobObject.recruiter = buildRecruiterPayload(jobObject.createdBy);
  return jobObject;
};

const attachRecruiterToJobs = (jobs = []) => jobs.map(attachRecruiterToJob);

/**
 * Get landing page data (stats + recent jobs)
 * Public endpoint - no authentication required
 */
const getLandingData = async () => {
  try {
    // Filter for active/open jobs
    const activeJobFilter = {
      status: 'open',
      isActive: true,
      isDeleted: { $ne: true },
      ...INTERNAL_TEST_JOB_EXCLUSION,
    };

    // Parallel execution of all queries for better performance
    const [totalJobsCount, totalUsersCount, totalCompaniesArray, recentJobs] = await Promise.all([
      // Count all active jobs
      JobModel.countDocuments(activeJobFilter),
      
      // Count ALL users (not just job seekers)
      UserModel.countDocuments(),
      
      // Get distinct/unique company names from all jobs
      JobModel.distinct('companyName'),
      
      // Get recent active jobs
      JobModel.find(activeJobFilter)
        .select('title companyName location jobType createdAt status createdBy')
        .populate('createdBy', RECRUITER_POPULATE_FIELDS)
        .sort({ createdAt: -1 })
        .limit(8)
    ]);

    return {
      stats: {
        totalJobs: totalJobsCount,
        totalUsers: totalUsersCount,
        totalCompanies: totalCompaniesArray.length
      },
      jobs: attachRecruiterToJobs(recentJobs)
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Search jobs (public endpoint)
 * Searches across: title, companyName, location, description, skillsRequired
 */
const searchPublicJobs = async (keyword = '', page = 1, limit = 8) => {
  try {
    const skip = (page - 1) * limit;
    
    // Base filter for active jobs
    const baseFilter = {
      status: 'open',
      isActive: true,
      isDeleted: { $ne: true },
      ...INTERNAL_TEST_JOB_EXCLUSION,
    };

    // If keyword is provided, add search conditions
    let searchFilter = { ...baseFilter };
    if (keyword && keyword.trim()) {
      const searchRegex = new RegExp(keyword.trim(), 'i');
      searchFilter.$or = [
        { title: searchRegex },
        { companyName: searchRegex },
        { location: searchRegex },
        { description: searchRegex },
        { skillsRequired: { $elemMatch: { $regex: searchRegex } } }
      ];
    }

    // Execute queries in parallel
    const [jobs, totalCount] = await Promise.all([
      JobModel.find(searchFilter)
        .select('title companyName location jobType description skillsRequired createdAt status createdBy')
        .populate('createdBy', RECRUITER_POPULATE_FIELDS)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      JobModel.countDocuments(searchFilter)
    ]);

    return {
      jobs: attachRecruiterToJobs(jobs),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalJobs: totalCount,
        hasMore: skip + jobs.length < totalCount
      }
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getLandingData,
  searchPublicJobs
};
