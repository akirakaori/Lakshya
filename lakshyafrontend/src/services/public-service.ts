import axiosInstance from './axios-instance';

// Types for Landing Page API
export interface LandingStats {
  activeJobs: number;
  verifiedStudents: number;
  topCompanies: number;
}

export interface LandingJob {
  _id: string;
  title: string;
  companyName: string;
  location: string;
  jobType: 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Freelance';
  createdAt: string;
  status: 'open' | 'closed';
}

export interface LandingData {
  stats: LandingStats;
  jobs: LandingJob[];
}

export interface LandingResponse {
  success: boolean;
  data: LandingData;
}

/**
 * Fetch landing page data (public endpoint - no auth required)
 */
export const getLandingData = async (): Promise<LandingResponse> => {
  const response = await axiosInstance.get<LandingResponse>('/public/landing');
  return response.data;
};
