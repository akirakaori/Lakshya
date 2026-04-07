import axiosInstance from './axios-instance';

// Types for Landing Page API
export interface LandingStats {
  totalJobs: number;
  totalUsers: number;
  totalCompanies: number;
}

export interface LandingJob {
  _id: string;
  title: string;
  companyName: string;
  location: string;
  jobType: 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Freelance';
  createdAt: string;
  status: 'open' | 'closed';
  createdBy?: {
    _id?: string;
    name?: string;
    profileImage?: string | null;
    profileImageUrl?: string | null;
    recruiter?: {
      position?: string;
    };
    jobSeeker?: {
      title?: string;
    };
  };
  recruiter?: {
    _id?: string;
    name?: string;
    profileImage?: string | null;
    profileImageUrl?: string | null;
    title?: string | null;
  } | null;
}

export interface LandingData {
  stats: LandingStats;
  jobs: LandingJob[];
}

export interface LandingResponse {
  success: boolean;
  data: LandingData;
}

export interface SearchJobsParams {
  keyword?: string;
  page?: number;
  limit?: number;
}

export interface SearchPagination {
  currentPage: number;
  totalPages: number;
  totalJobs: number;
  hasMore: boolean;
}

export interface SearchJobsData {
  jobs: LandingJob[];
  pagination: SearchPagination;
}

export interface SearchJobsResponse {
  success: boolean;
  data: SearchJobsData;
}

/**
 * Fetch landing page data (public endpoint - no auth required)
 */
export const getLandingData = async (): Promise<LandingResponse> => {
  const response = await axiosInstance.get<LandingResponse>('/public/landing');
  return response.data;
};

/**
 * Search jobs (public endpoint - no auth required)
 */
export const searchPublicJobs = async (params: SearchJobsParams = {}): Promise<SearchJobsResponse> => {
  const { keyword = '', page = 1, limit = 8 } = params;
  const response = await axiosInstance.get<SearchJobsResponse>('/public/jobs', {
    params: { keyword, page, limit }
  });
  return response.data;
};
