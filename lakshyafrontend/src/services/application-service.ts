import axiosInstance from './axios-instance';
import type { Job } from './job-service';

export interface Application {
  _id: string;
  jobId: Job | string;
  applicant: {
    _id: string;
    name: string;
    email: string;
    number: string;
    resume?: string;
  } | string;
  resume?: string;
  coverLetter?: string;
  status: 'applied' | 'shortlisted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface ApplyJobData {
  coverLetter?: string;
  resume?: string;
}

export interface ApplicationFilters {
  q?: string;
  status?: 'all' | 'applied' | 'shortlisted' | 'rejected';
  page?: number;
  limit?: number;
}

export interface ApplicationsResponse {
  success: boolean;
  data: Application[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const applicationService = {
  // Apply for a job (job seeker only)
  applyForJob: async (jobId: string, data: ApplyJobData = {}): Promise<{ success: boolean; data: Application }> => {
    const response = await axiosInstance.post(`/applications/${jobId}`, data);
    return response.data;
  },

  // Get my applications (job seeker only)
  getMyApplications: async (filters?: ApplicationFilters): Promise<ApplicationsResponse> => {
    const params = new URLSearchParams();
    
    if (filters?.q) params.append('q', filters.q);
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const queryString = params.toString();
    const url = queryString ? `/applications/my?${queryString}` : '/applications/my';
    
    const response = await axiosInstance.get(url);
    return response.data;
  },

  // Get applications for a specific job (recruiter only)
  getJobApplications: async (jobId: string): Promise<{ success: boolean; data: Application[] }> => {
    const response = await axiosInstance.get(`/applications/job/${jobId}`);
    return response.data;
  },

  // Get application by ID
  getApplicationById: async (applicationId: string): Promise<{ success: boolean; data: Application }> => {
    const response = await axiosInstance.get(`/applications/${applicationId}`);
    return response.data;
  },

  // Update application status (recruiter only)
  updateApplicationStatus: async (
    applicationId: string, 
    status: 'applied' | 'shortlisted' | 'rejected'
  ): Promise<{ success: boolean; data: Application }> => {
    const response = await axiosInstance.patch(`/applications/${applicationId}/status`, { status });
    return response.data;
  },

  // Withdraw application (job seeker only)
  withdrawApplication: async (applicationId: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.delete(`/applications/${applicationId}`);
    return response.data;
  },

  // Check if already applied to a job
  hasApplied: async (jobId: string): Promise<boolean> => {
    try {
      const response = await applicationService.getMyApplications();
      return response.data.some((app) => {
        const appJobId = typeof app.jobId === 'string' ? app.jobId : app.jobId._id;
        return appJobId === jobId;
      });
    } catch {
      return false;
    }
  },
};

export default applicationService;
