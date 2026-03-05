const JobModel = require('../models/job-model');
const UserModel = require('../models/user-model');
const { ROLES } = require('../Library/roles');

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
      isDeleted: { $ne: true }
    };

    // Parallel execution of all queries for better performance
    const [activeJobsCount, verifiedStudentsCount, topCompaniesArray, recentJobs] = await Promise.all([
      // Count active jobs
      JobModel.countDocuments(activeJobFilter),
      
      // Count verified students (job seekers)
      UserModel.countDocuments({
        role: ROLES.JOB_SEEKER,
        isActive: true
      }),
      
      // Get distinct company names from active jobs
      JobModel.distinct('companyName', activeJobFilter),
      
      // Get recent active jobs
      JobModel.find(activeJobFilter)
        .select('title companyName location jobType createdAt status')
        .sort({ createdAt: -1 })
        .limit(8)
        .lean()
    ]);

    return {
      stats: {
        activeJobs: activeJobsCount,
        verifiedStudents: verifiedStudentsCount,
        topCompanies: topCompaniesArray.length
      },
      jobs: recentJobs
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getLandingData
};
