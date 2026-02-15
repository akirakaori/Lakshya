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
  experienceLevel?: string;
  status: 'open' | 'closed';
  isActive: boolean;
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
  salaryMin?: number;
  salaryMax?: number;
  experienceLevels?: string[];
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
  skills?: string[];
  skillsRequired?: string[];
  requirements?: string[];
  benefits?: string[];
  type?: string;
  experienceLevel?: string;
  jobType?: string;
}

// Helper: Build query params from filters (removes empty/undefined values)
const buildQueryParams = (filters: JobFilters): URLSearchParams => {
  const params = new URLSearchParams();
  
  // Search keyword
  if (filters.keyword?.trim()) params.append('keyword', filters.keyword.trim());
  
  // Category/Skill
  if (filters.category?.trim()) params.append('category', filters.category.trim());
  if (filters.skill?.trim()) params.append('skill', filters.skill.trim());
  if (filters.skills?.length) {
    filters.skills.forEach(s => params.append('skill', s));
  }
  
  // Job Type
  if (filters.jobType?.trim()) params.append('jobType', filters.jobType.trim());
  
  // Salary Range
  if (filters.salaryMin !== undefined && filters.salaryMin > 0) {
    params.append('salaryMin', filters.salaryMin.toString());
  }
  if (filters.salaryMax !== undefined && filters.salaryMax > 0) {
    params.append('salaryMax', filters.salaryMax.toString());
  }
  
  // Location
  if (filters.location?.trim()) params.append('location', filters.location.trim());
  
  // Experience Levels (array)
  if (filters.experienceLevels?.length) {
    filters.experienceLevels.forEach(level => params.append('experienceLevel', level));
  }
  
  // AI Match Score
  if (filters.aiMatchMin !== undefined && filters.aiMatchMin > 0) {
    params.append('aiMatchMin', filters.aiMatchMin.toString());
  }
  
  // Pagination
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  
  // Sort
  if (filters.sort) params.append('sort', filters.sort);
  
  return params;
};

export const jobService = {
  // Get all jobs with filters (public)
  getJobs: async (filters: JobFilters = {}): Promise<JobsResponse> => {
    const params = buildQueryParams(filters);
    const response = await axiosInstance.get(`/jobs?${params.toString()}`);
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

  // Delete a job (recruiter only)
  deleteJob: async (jobId: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.delete(`/jobs/${jobId}`);
    return response.data;
  },

  // Toggle job status (recruiter only)
  toggleJobStatus: async (jobId: string): Promise<{ success: boolean; data: Job }> => {
    const response = await axiosInstance.patch(`/jobs/${jobId}/toggle-status`);
    return response.data;
  },
};

export default jobService;
