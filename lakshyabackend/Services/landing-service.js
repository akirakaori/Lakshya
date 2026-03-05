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
    const [totalJobsCount, totalUsersCount, totalCompaniesArray, recentJobs] = await Promise.all([
      // Count all active jobs
      JobModel.countDocuments(activeJobFilter),
      
      // Count ALL users (not just job seekers)
      UserModel.countDocuments(),
      
      // Get distinct/unique company names from all jobs
      JobModel.distinct('companyName'),
      
      // Get recent active jobs
      JobModel.find(activeJobFilter)
        .select('title companyName location jobType createdAt status')
        .sort({ createdAt: -1 })
        .limit(8)
        .lean()
    ]);

    return {
      stats: {
        totalJobs: totalJobsCount,
        totalUsers: totalUsersCount,
        totalCompanies: totalCompaniesArray.length
      },
      jobs: recentJobs
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
      isDeleted: { $ne: true }
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
        .select('title companyName location jobType description skillsRequired createdAt status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      JobModel.countDocuments(searchFilter)
    ]);

    return {
      jobs,
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
