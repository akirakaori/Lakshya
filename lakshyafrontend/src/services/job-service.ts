import axiosInstance from './axios-instance';

export interface Job {
  _id: string;
  title: string;
  description: string;
  companyName: string;
  location: string;
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  skillsRequired?: string[];
  skills?: string[];
  requirements?: string[];
  benefits?: string[];
  type: string;
  jobType?: 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Freelance';
  remoteType?: 'Remote' | 'Onsite' | 'Hybrid';
  category?: string;
  companySize?: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+';
  salaryVisible?: boolean;
  experienceLevel?: string;
  status: 'open' | 'closed';
  isActive: boolean;
  isDeleted?: boolean;
  deletedAt?: string | null;
  deletedBy?: string | null;
  deletedByRole?: 'admin' | 'recruiter' | null;
  interviewRoundsRequired?: number; // Number of interview rounds required (1-4, default 2)
  createdBy: {
    _id: string;
    name: string;
    email: string;
    companyName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface JobFilters {
  keyword?: string;
  location?: string;
  category?: string;
  skill?: string;
  skills?: string[];
  jobType?: string;
  remoteType?: string;
  companySize?: string;
  salaryMin?: number;
  salaryMax?: number;
  experienceLevels?: string[];
  postedWithinDays?: number;
  aiMatchMin?: number;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface JobsResponse {
  success: boolean;
  message: string;
  data: Job[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CreateJobData {
  title: string;
  description: string;
  companyName: string;
  location: string;
  salary?: string | {
    min: number;
    max: number;
    currency: string;
  };
  salaryVisible?: boolean;
  skills?: string[];
  skillsRequired?: string[];
  requirements?: string[];
  benefits?: string[];
  type?: string;
  experienceLevel?: string;
  jobType?: string;
  remoteType?: 'Remote' | 'Onsite' | 'Hybrid';
  category?: string;
  companySize?: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+';
  interviewRoundsRequired?: number; // Number of interview rounds (1-4, default 2)
}

// Helper: Build query params from filters (removes empty/undefined values)
const buildQueryParams = (filters: JobFilters): URLSearchParams => {
  const params = new URLSearchParams();
  
  console.log('[buildQueryParams] Input filters:', JSON.stringify(filters, null, 2));
  
  // Helper to check if value is valid and not empty
  const isValidString = (val: any): val is string => {
    return typeof val === 'string' && val.trim().length > 0;
  };
  
  const isValidNumber = (val: any): val is number => {
    return typeof val === 'number' && !isNaN(val) && val >= 0;
  };
  
  // Search keyword
  if (isValidString(filters.keyword)) {
    params.append('keyword', filters.keyword.trim());
    console.log('[buildQueryParams] Added keyword:', filters.keyword);
  }
  
  // Category (supports flexible search across category/title/description)
  if (isValidString(filters.category)) {
    const trimmedCategory = filters.category.trim();
    params.append('category', trimmedCategory);
    console.log('[buildQueryParams] ✅ Category SEARCH filter added (flexible matching):');
    console.log('  - Original:', filters.category);
    console.log('  - Trimmed:', trimmedCategory);
    console.log('  - URL param:', params.get('category'));
    console.log('  - Backend will search in: category, title, description');
  } else {
    console.log('[buildQueryParams] ⚠️ Category filter NOT added (empty or invalid):', filters.category);
  }
  
  // Skills (single or array)
  if (isValidString(filters.skill)) {
    params.append('skill', filters.skill.trim());
    console.log('[buildQueryParams] Added skill:', filters.skill);
  }
  if (Array.isArray(filters.skills) && filters.skills.length > 0) {
    filters.skills.forEach(s => {
      if (isValidString(s)) {
        params.append('skill', s.trim());
      }
    });
    console.log('[buildQueryParams] Added skills array:', filters.skills);
  }
  
  // Job Type
  if (isValidString(filters.jobType)) {
    params.append('jobType', filters.jobType.trim());
    console.log('[buildQueryParams] Added jobType:', filters.jobType);
  }
  
  // Remote Type
  if (isValidString(filters.remoteType)) {
    params.append('remoteType', filters.remoteType.trim());
    console.log('[buildQueryParams] Added remoteType:', filters.remoteType);
  }
  
  // Company Size
  if (isValidString(filters.companySize)) {
    params.append('companySize', filters.companySize.trim());
    console.log('[buildQueryParams] Added companySize:', filters.companySize);
  }
  
  // Location
  if (isValidString(filters.location)) {
    params.append('location', filters.location.trim());
    console.log('[buildQueryParams] Added location:', filters.location);
  }
  
  // Salary Range (include 0 as valid)
  if (isValidNumber(filters.salaryMin) && filters.salaryMin > 0) {
    params.append('salaryMin', filters.salaryMin.toString());
    console.log('[buildQueryParams] Added salaryMin:', filters.salaryMin);
  }
  if (isValidNumber(filters.salaryMax) && filters.salaryMax > 0) {
    params.append('salaryMax', filters.salaryMax.toString());
    console.log('[buildQueryParams] Added salaryMax:', filters.salaryMax);
  }
  
  // Experience Levels (array - backend expects repeated 'experienceLevel' param)
  // DO NOT send empty arrays - backend sees undefined if no params sent
  if (Array.isArray(filters.experienceLevels) && filters.experienceLevels.length > 0) {
    console.log('[buildQueryParams] 🎯 Processing experience levels:', filters.experienceLevels);
    
    let added = 0;
    filters.experienceLevels.forEach((level, idx) => {
      if (isValidString(level)) {
        const trimmed = level.trim();
        params.append('experienceLevel', trimmed);  // Singular! Backend reads as array
        console.log(`  [${idx}] ✅ Added param: experienceLevel="${trimmed}"`);
        added++;
      } else {
        console.warn(`  [${idx}] ⚠️ Skipped invalid level:`, level);
      }
    });
    
    console.log('[buildQueryParams] ✅ Total experience levels added:', added);
    console.log('[buildQueryParams] 📤 Final params array:', params.getAll('experienceLevel'));
    console.log('[buildQueryParams] 📤 URL will be: ...&experienceLevel=' + params.getAll('experienceLevel').join('&experienceLevel='));
  } else if (filters.experienceLevels !== undefined) {
    console.log('[buildQueryParams] ⚠️ Experience levels is empty array or invalid:', filters.experienceLevels);
  }
  
  // Posted Within Days (0 = any time, don't send)
  if (isValidNumber(filters.postedWithinDays) && filters.postedWithinDays > 0) {
    params.append('postedWithinDays', filters.postedWithinDays.toString());
    console.log('[buildQueryParams] Added postedWithinDays:', filters.postedWithinDays);
  }
  
  // NOTE: aiMatchMin is NOT sent to backend - it's a frontend-only filter
  if (filters.aiMatchMin !== undefined && filters.aiMatchMin > 0) {
    console.log('[buildQueryParams] aiMatchMin is frontend-only, not sending to backend:', filters.aiMatchMin);
  }
  
  // Pagination
  if (filters.page !== undefined && filters.page > 0) {
    params.append('page', filters.page.toString());
    console.log('[buildQueryParams] Added page:', filters.page);
  }
  if (filters.limit !== undefined && filters.limit > 0) {
    params.append('limit', filters.limit.toString());
    console.log('[buildQueryParams] Added limit:', filters.limit);
  }
  
  // Sort
  if (isValidString(filters.sort)) {
    params.append('sort', filters.sort);
    console.log('[buildQueryParams] Added sort:', filters.sort);
  }
  
  const queryString = params.toString();
  console.log('[buildQueryParams] Final query string:', queryString);
  
  return params;
};

export interface JobMatchAnalysis {
  matchScore: number;
  skillScorePercent: number;
  semanticPercent: number;
  matchedSkills: string[];
  missingSkills: string[];
  suggestions: string[];
  summaryRewrite: string;
  suggestionSource: 'ollama' | 'rule';
  analyzedAt: string;
}

export interface JobMatchScore {
  matchScore: number | null;
  analyzedAt: string | null;
  source: 'cache' | 'missing';
}

export interface BatchMatchScoresResponse {
  [jobId: string]: JobMatchScore;
}

export interface RecommendedJob {
  _id: string;
  title: string;
  companyName: string;
  location: string;
  jobType?: string;
  remoteType?: string;
  experienceLevel?: string;
  category?: string;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  salaryVisible?: boolean;
  createdAt: string;
  recommendationScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  isLowConfidence: boolean;
}

export const jobService = {
  // Get all jobs with filters (public)
  getJobs: async (filters: JobFilters = {}): Promise<JobsResponse> => {
    console.log('═'.repeat(80));
    console.log('[JobService.getJobs] 🚀 Starting FLEXIBLE category search request');
    console.log('[JobService.getJobs] Input filters:', JSON.stringify(filters, null, 2));
    if (filters.category) {
      console.log('[JobService.getJobs] 🔍 Category search:', filters.category);
      console.log('[JobService.getJobs] 📌 Note: Category will match in category/title/description');
    }
    if (filters.experienceLevels && filters.experienceLevels.length > 0) {
      console.log('[JobService.getJobs] 🎯 Experience levels:', filters.experienceLevels);
    }
    console.log('[JobService.getJobs] Filter keys:', Object.keys(filters));
    console.log('═'.repeat(80));
    
    const params = buildQueryParams(filters);
    const queryString = params.toString();
    
    console.log('[JobService.getJobs] 📤 Final request details:');
    console.log('  - Query string:', queryString);
    console.log('  - Full URL:', `/jobs?${queryString}`);
    console.log('  - Category in URL:', params.get('category'));
    console.log('  - Keyword in URL:', params.get('keyword'));
    console.log('  - JobType in URL:', params.get('jobType'));
    console.log('  - 🎯 Experience levels in URL:', params.getAll('experienceLevel'));
    console.log('  - 🎯 Experience count:', params.getAll('experienceLevel').length);
    if (params.getAll('experienceLevel').length === 0 && filters.experienceLevels && filters.experienceLevels.length > 0) {
      console.error('  - ⚠️⚠️ WARNING: experienceLevels in filters but NOT in URL params! Check buildQueryParams logic.');
    }
    console.log('═'.repeat(80));
    
    const response = await axiosInstance.get(`/jobs?${queryString}`);
    
    console.log('[JobService.getJobs] 📥 Response received:');
    console.log('  - Jobs count:', response.data?.data?.length ?? 0);
    console.log('  - Total results:', response.data?.pagination?.total ?? 0);
    if (filters.category && response.data?.data?.length === 0) {
      console.warn('[JobService.getJobs] ⚠️ Category search returned 0 results. Check backend logs.');
    }
    console.log('═'.repeat(80));
    
    return response.data;
  },

  // Get all jobs (admin view - includes inactive/deleted)
  getAllJobsAdmin: async (): Promise<{ success: boolean; data: Job[] }> => {
    const response = await axiosInstance.get('/admin/jobs');
    return response.data;
  },

  // Get single job by ID (public)
  getJobById: async (jobId: string): Promise<{ success: boolean; data: Job }> => {
    const response = await axiosInstance.get(`/jobs/${jobId}`);
    return response.data;
  },

  // Get jobs posted by the recruiter (recruiter only)
  getMyJobs: async (): Promise<{ success: boolean; data: Job[] }> => {
    const response = await axiosInstance.get('/jobs/my-jobs');
    return response.data;
  },

  // Create a new job (recruiter only)
  createJob: async (jobData: CreateJobData): Promise<{ success: boolean; data: Job }> => {
    const response = await axiosInstance.post('/jobs', jobData);
    return response.data;
  },

  // Update a job (recruiter only)
  updateJob: async (jobId: string, jobData: Partial<CreateJobData>): Promise<{ success: boolean; data: Job }> => {
    const response = await axiosInstance.put(`/jobs/${jobId}`, jobData);
    return response.data;
  },

  // Delete a job (recruiter only) - DEPRECATED: Use soft delete
  deleteJob: async (jobId: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.delete(`/jobs/${jobId}`);
    return response.data;
  },

  // Soft delete a job (recruiter only)
  softDeleteJob: async (jobId: string): Promise<{ success: boolean; data: Job }> => {
    const response = await axiosInstance.patch(`/jobs/${jobId}/soft-delete`);
    return response.data;
  },

  // Admin soft delete a job (admin only)
  adminSoftDeleteJob: async (jobId: string): Promise<{ success: boolean; data: Job }> => {
    const response = await axiosInstance.patch(`/admin/jobs/${jobId}/soft-delete`);
    return response.data;
  },

  // Admin edit job (admin only)
  adminEditJob: async (jobId: string, jobData: Partial<CreateJobData>): Promise<{ success: boolean; data: Job }> => {
    const response = await axiosInstance.patch(`/admin/jobs/${jobId}`, jobData);
    return response.data;
  },

  // Toggle job status (recruiter only)
  toggleJobStatus: async (jobId: string): Promise<{ success: boolean; data: Job }> => {
    const response = await axiosInstance.patch(`/jobs/${jobId}/toggle-status`);
    return response.data;
  },

  // Get match analysis for a specific job (job seeker only)
  getJobMatch: async (jobId: string): Promise<{ success: boolean; data: JobMatchAnalysis | null; isOutdated: boolean }> => {
    const response = await axiosInstance.get(`/job-seeker/jobs/${jobId}/match`);
    return response.data;
  },

  // Compute fresh match analysis for a specific job (job seeker only)
  analyzeJobMatch: async (jobId: string): Promise<{ success: boolean; data: JobMatchAnalysis; isOutdated: boolean }> => {
    const response = await axiosInstance.post(`/job-seeker/jobs/${jobId}/analyze`);
    return response.data;
  },

  // Get cached match scores for multiple jobs (batch - job seeker only)
  getBatchMatchScores: async (jobIds: string[]): Promise<{ success: boolean; data: BatchMatchScoresResponse }> => {
    const response = await axiosInstance.post(`/job-seeker/jobs/match-scores`, { jobIds });
    return response.data;
  },

  // Get recommended jobs for the logged-in job seeker
  getRecommendations: async (): Promise<{ success: boolean; data: RecommendedJob[] }> => {
    const response = await axiosInstance.get('/job-seeker/recommendations');
    return response.data;
  },

  // ========================
  // Saved Jobs (Bookmarks)
  // ========================

  // Get all jobs saved by the logged-in job seeker
  getSavedJobs: async (): Promise<{ success: boolean; data: Job[] }> => {
    const response = await axiosInstance.get('/jobs/saved');
    return response.data;
  },

  // Save a job (bookmark) for the logged-in job seeker
  saveJob: async (jobId: string): Promise<{ success: boolean; data: string[] }> => {
    const response = await axiosInstance.post(`/jobs/${jobId}/save`);
    return response.data;
  },

  // Remove a job from saved list for the logged-in job seeker
  removeSavedJob: async (jobId: string): Promise<{ success: boolean; data: string[] }> => {
    const response = await axiosInstance.delete(`/jobs/${jobId}/save`);
    return response.data;
  },
};

export default jobService;
