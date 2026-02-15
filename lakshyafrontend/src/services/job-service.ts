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
  skill?: string;
  skills?: string[];
  jobType?: string;
  page?: number;
  limit?: number;
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

export const jobService = {
  // Get all jobs with filters (public)
  getJobs: async (filters: JobFilters = {}): Promise<JobsResponse> => {
    const params = new URLSearchParams();
    
    if (filters.keyword) params.append('keyword', filters.keyword);
    if (filters.location) params.append('location', filters.location);
    if (filters.skill) params.append('skill', filters.skill);
    if (filters.skills?.length) {
      filters.skills.forEach(s => params.append('skill', s));
    }
    if (filters.jobType) params.append('jobType', filters.jobType);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

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
