const JobModel = require('../models/job-model');
const mongoose = require('mongoose');

const PUBLIC_JOB_FILTER = {
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

  return trimmedValue;
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
 * Create a new job posting (recruiter only)
 */
const createJob = async (jobData, recruiterId) => {
  try {
    const job = new JobModel({
      ...jobData,
      createdBy: recruiterId
    });
    
    await job.save();
    return job;
  } catch (error) {
    throw error;
  }
};

/**
 * Update a job posting
 */
const updateJob = async (jobId, recruiterId, updateData) => {
  try {
    // Don't allow changing the creator
    delete updateData.createdBy;
    
    const job = await JobModel.findOneAndUpdate(
      { _id: jobId, createdBy: recruiterId },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!job) {
      const error = new Error('Job not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }
    
    return job;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a job posting (DEPRECATED - use softDeleteJob instead)
 */
const deleteJob = async (jobId, recruiterId) => {
  try {
    const job = await JobModel.findOneAndDelete({
      _id: jobId,
      createdBy: recruiterId
    });
    
    if (!job) {
      const error = new Error('Job not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }
    
    return job;
  } catch (error) {
    throw error;
  }
};

/**
 * Soft delete a job posting (recruiter)
 * Recruiter can only delete their own jobs
 */
const softDeleteJob = async (jobId, actorUser) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      const error = new Error('Invalid job ID format');
      error.statusCode = 400;
      throw error;
    }

    // Find job by ID AND ownership (recruiter can only delete their own jobs)
    const job = await JobModel.findOne({
      _id: jobId,
      createdBy: actorUser.id
    });
    
    if (!job) {
      const error = new Error('Job not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }

    if (job.isDeleted) {
      const error = new Error('Job is already deleted');
      error.statusCode = 400;
      throw error;
    }
    
    // Soft delete: set flags but keep the document
    job.isActive = false;
    job.isDeleted = true;
    job.deletedAt = new Date();
    job.deletedBy = actorUser.id;
    job.deletedByRole = 'recruiter';
    
    await job.save();
    
    console.log('[Service] Recruiter soft deleted job:', job._id, 'by', actorUser.email);
    
    return job;
  } catch (error) {
    throw error;
  }
};

/**
 * Soft delete a job posting (admin)
 * Admin can delete any job regardless of ownership
 */
const adminSoftDeleteJob = async (jobId, actorUser) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      const error = new Error('Invalid job ID format');
      error.statusCode = 400;
      throw error;
    }

    // Find job by ID only (no ownership check for admin)
    const job = await JobModel.findById(jobId);
    
    if (!job) {
      const error = new Error('Job not found');
      error.statusCode = 404;
      throw error;
    }

    if (job.isDeleted) {
      const error = new Error('Job is already deleted');
      error.statusCode = 400;
      throw error;
    }
    
    // Soft delete: set flags but keep the document
    job.isActive = false;
    job.isDeleted = true;
    job.deletedAt = new Date();
    job.deletedBy = actorUser.id;
    job.deletedByRole = 'admin';
    
    await job.save();
    
    console.log('[Service] Admin soft deleted job:', job._id, 'by', actorUser.email);
    
    return job;
  } catch (error) {
    throw error;
  }
};

/**
 * Admin edit job
 * Admin can edit any job regardless of ownership
 */
const adminEditJob = async (jobId, updateData) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      const error = new Error('Invalid job ID format');
      error.statusCode = 400;
      throw error;
    }

    // Don't allow changing creator or soft delete fields via this route
    delete updateData.createdBy;
    delete updateData.isDeleted;
    delete updateData.deletedAt;
    delete updateData.deletedBy;
    delete updateData.deletedByRole;
    
    const job = await JobModel.findByIdAndUpdate(
      jobId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!job) {
      const error = new Error('Job not found');
      error.statusCode = 404;
      throw error;
    }
    
    return job;
  } catch (error) {
    throw error;
  }
};

/**
 * Get all jobs posted by a recruiter (paginated)
 * @param {string} recruiterId - The recruiter's user ID
 * @param {object} options - Query options
 * @param {boolean} options.includeInactive - Whether to include inactive/deleted jobs
 * @param {number} options.page - Page number (default 1)
 * @param {number} options.limit - Items per page (default 10)
 * @param {string} options.search - Search term for title/companyName
 */
const getRecruiterJobs = async (recruiterId, options = {}) => {
  try {
    const { includeInactive = true, search } = options;
    const rawPage = parseInt(options.page, 10);
    const rawLimit = parseInt(options.limit, 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 10;
    
    const query = { createdBy: recruiterId };
    
    // By default, show all jobs (active and inactive) for recruiter to manage
    // If includeInactive is false, only show active jobs
    if (!includeInactive) {
      query.isActive = true;
      query.isDeleted = false;
    }

    // Search filter
    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { companyName: { $regex: search.trim(), $options: 'i' } },
        { location: { $regex: search.trim(), $options: 'i' } },
      ];
    }
    
    const total = await JobModel.countDocuments(query);
    const pages = total === 0 ? 1 : Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const jobs = await JobModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', RECRUITER_POPULATE_FIELDS);
    
    return {
      jobs: attachRecruiterToJobs(jobs),
      pagination: { total, page, limit, pages }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get a single job by ID
 */
const getJobById = async (jobId) => {
  try {
    const job = await JobModel.findOne({ _id: jobId, ...PUBLIC_JOB_FILTER })
      .populate('createdBy', RECRUITER_POPULATE_FIELDS);
    
    if (!job) {
      const error = new Error('Job not found');
      error.statusCode = 404;
      throw error;
    }
    
    return attachRecruiterToJob(job);
  } catch (error) {
    throw error;
  }
};

/**
 * Escape special regex characters for safe RegExp construction
 */
const escapeRegExp = (str) => {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Browse and search jobs with filters
 */
const searchJobs = async (filters) => {
  try {
    const { 
      keyword, 
      location, 
      category,
      skills, 
      jobType, 
      remoteType,
      companySize,
      salaryMin,
      salaryMax,
      experienceLevels,
      postedWithinDays,
      page = 1, 
      limit = 10 
    } = filters;
    
    // DEBUG: Log received filters
    console.log('='.repeat(60));
    console.log('[searchJobs] Received filters:', JSON.stringify(filters, null, 2));
    console.log('[searchJobs] Category received:', category);
    console.log('[searchJobs] Category type:', typeof category);
    console.log('[searchJobs] Category trimmed:', category ? String(category).trim() : 'N/A');
    console.log('='.repeat(60));
    
    // Only show active, non-deleted jobs to job seekers
    const query = { 
      status: 'open',
      isActive: true,
      isDeleted: false,
      ...PUBLIC_JOB_FILTER,
    };
    
    // Keyword search across multiple fields: title, description, skillsRequired, companyName, location
    if (keyword) {
      const keywordRegex = { $regex: keyword, $options: 'i' };
      query.$or = [
        { title: keywordRegex },
        { description: keywordRegex },
        { companyName: keywordRegex },
        { location: keywordRegex },
        { skillsRequired: { $elemMatch: { $regex: keyword, $options: 'i' } } }
      ];
      console.log('[searchJobs] Keyword filter applied across title, description, companyName, location, skillsRequired:', keyword);
    }
    
    // Category filter - FLEXIBLE SEARCH across category, title, description
    // Allows user-selected category to match relevant jobs even if category differs slightly
    // Example: "Tutor" search can match jobs with "Teacher" in category/title/description
    if (category) {
      const normalizedCategory = String(category).trim();
      
      if (normalizedCategory) {
        // Escape special regex characters for safe regex construction
        const escapedCategory = escapeRegExp(normalizedCategory);
        const categoryRegex = { $regex: escapedCategory, $options: 'i' };
        
        console.log('[searchJobs] 🔍 Category FLEXIBLE filter applied:');
        console.log('  - Original:', category);
        console.log('  - Normalized:', normalizedCategory);
        console.log('  - Escaped:', escapedCategory);
        console.log('  - Regex (no anchors for partial match):', escapedCategory);
        
        // Create $or condition for category search across multiple fields
        const categoryCondition = {
          $or: [
            { category: categoryRegex },
            { title: categoryRegex },
            { description: categoryRegex }
          ]
        };
        
        // Merge with existing $or (keyword) using $and
        if (query.$or) {
          console.log('[searchJobs] 🔀 Merging category $or with existing keyword $or using $and');
          // Move existing $or into $and, then add category $or
          query.$and = query.$and || [];
          query.$and.push({ $or: query.$or });
          query.$and.push(categoryCondition);
          delete query.$or;
        } else {
          console.log('[searchJobs] 🔀 No existing $or, adding category $or directly');
          query.$or = categoryCondition.$or;
        }
        
        console.log('[searchJobs] Category search will match in: category, title, description');
      } else {
        console.log('[searchJobs] Category filter skipped (empty after trim)');
      }
    } else {
      console.log('[searchJobs] No category filter (undefined/null)');
    }
    
    // Location filter
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    // Skills filter (match any skill in the array)
    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      query.skillsRequired = { $in: skillsArray };
    }
    
    // Job type filter
    if (jobType) {
      query.jobType = jobType;
    }
    
    // Remote type filter
    if (remoteType) {
      query.remoteType = remoteType;
    }
    
    // Company size filter
    if (companySize) {
      query.companySize = companySize;
    }
    
    // Salary OVERLAP filter logic
    // ONLY apply salary filter if user actually specified salaryMin or salaryMax (and > 0)
    // User wants jobs where: job.salary.min <= filterMax AND job.salary.max >= filterMin
    const hasSalaryFilter = (salaryMin !== undefined && salaryMin > 0) || (salaryMax !== undefined && salaryMax > 0);
    
    if (hasSalaryFilter) {
      const salaryConditions = [];
      
      if (salaryMin !== undefined && salaryMin > 0) {
        // Job's max salary should be >= user's minimum requirement
        salaryConditions.push({ 'salary.max': { $gte: salaryMin } });
        console.log('[searchJobs] Applying salary min filter:', salaryMin);
      }
      
      if (salaryMax !== undefined && salaryMax > 0) {
        // Job's min salary should be <= user's maximum budget
        salaryConditions.push({ 'salary.min': { $lte: salaryMax } });
        console.log('[searchJobs] Applying salary max filter:', salaryMax);
      }
      
      if (salaryConditions.length > 0) {
        query.$and = query.$and || [];
        query.$and.push(...salaryConditions);
      }
    } else {
      console.log('[searchJobs] No salary filter applied (salaryMin/Max not provided or = 0)');
    }
    
    // Experience level filter (array - match any)
    // Frontend now sends database values: 'entry', 'mid', 'senior', 'lead', 'executive'
    // Use simple $in query with case-insensitive match for safety
    if (experienceLevels && experienceLevels.length > 0) {
      console.log('[searchJobs] 🎯 Experience level filter:');
      console.log('  - Raw input:', experienceLevels);
      console.log('  - Type:', typeof experienceLevels, 'IsArray:', Array.isArray(experienceLevels));
      console.log('  - Count:', experienceLevels.length);
      
      // Filter out empty values and create case-insensitive regex for each
      // This handles minor case variations ('Mid' vs 'mid')
      const validLevels = experienceLevels
        .filter(level => level && String(level).trim())
        .map(level => {
          const trimmed = String(level).trim();
          return new RegExp(`^${escapeRegExp(trimmed)}$`, 'i');
        });
      
      if (validLevels.length > 0) {
        query.experienceLevel = { $in: validLevels };
        console.log('  - ✅ MongoDB filter applied with', validLevels.length, 'levels');
        console.log('  - Expected DB values:', experienceLevels.map(l => `"${l}"`).join(', '));
        console.log('  - Query:', JSON.stringify(query.experienceLevel, null, 2));
      } else {
        console.log('  - ⚠️ All levels empty after filtering, skipping');
      }
    } else {
      console.log('[searchJobs] No experience level filter (empty or undefined)');
    }
    
    // Posted within days filter
    if (postedWithinDays && postedWithinDays > 0) {
      const daysAgo = new Date(Date.now() - postedWithinDays * 24 * 60 * 60 * 1000);
      query.createdAt = { $gte: daysAgo };
    }
    
    console.log('[searchJobs] 📋 Final MongoDB query:', JSON.stringify(query, null, 2));
    console.log('[searchJobs] Query structure breakdown:');
    console.log('  - Base: status=open, isActive=true, isDeleted=false');
    console.log('  - Has $or:', !!query.$or, query.$or ? `(${query.$or.length} conditions)` : '');
    console.log('  - Has $and:', !!query.$and, query.$and ? `(${query.$and.length} conditions)` : '');
    console.log('  - Category direct field:', query.category ? 'YES' : 'NO');
    console.log('  - jobType:', query.jobType || 'N/A');
    console.log('  - remoteType:', query.remoteType || 'N/A');
    console.log('  - companySize:', query.companySize || 'N/A');
    console.log('  - All filter keys:', Object.keys(query).join(', '));
    console.log('='.repeat(60));
    
    const skip = (page - 1) * limit;
    
    const jobs = await JobModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', RECRUITER_POPULATE_FIELDS);
    
    const total = await JobModel.countDocuments(query);
    
    console.log('[searchJobs] Found', total, 'jobs');
    
    return {
      jobs: attachRecruiterToJobs(jobs),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Toggle job status (open/closed)
 */
const toggleJobStatus = async (jobId, recruiterId) => {
  try {
    const job = await JobModel.findOne({ _id: jobId, createdBy: recruiterId });
    
    if (!job) {
      const error = new Error('Job not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }
    
    // Keep both fields in sync so frontend state always reflects latest toggle.
    const nextIsActive = !job.isActive;
    job.isActive = nextIsActive;
    job.status = nextIsActive ? 'open' : 'closed';
    await job.save();
    
    return job;
  } catch (error) {
    throw error;
  }
};

/**
 * Get all jobs for admin (includes inactive and deleted)
 */
const getAllJobsForAdmin = async () => {
  try {
    const jobs = await JobModel.find({})
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email companyName role');
    
    return jobs;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createJob,
  updateJob,
  deleteJob,
  softDeleteJob,
  adminSoftDeleteJob,
  adminEditJob,
  getRecruiterJobs,
  getJobById,
  searchJobs,
  toggleJobStatus,
  getAllJobsForAdmin
};
