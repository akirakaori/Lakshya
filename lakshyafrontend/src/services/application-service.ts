import axiosInstance from './axios-instance';
import type { Job } from './job-service';

// Interview type for multi-round scheduling
export interface Interview {
  _id?: string;
  roundNumber: number;
  date: string;
  startTime?: string;
  endTime?: string;
  time?: string;
  timezone?: string;
  mode: 'online' | 'onsite' | 'phone';
  linkOrLocation?: string;
  messageToCandidate?: string; // Visible to candidate
  internalNotes?: string; // Recruiter-only
  outcome?: 'pass' | 'fail' | 'pending';
  feedback?: string; // Recruiter feedback after interview
  createdAt?: string;
  updatedAt?: string;
}

export interface Application {
  _id: string;
  jobId: Job | string | null;
  applicant: {
    _id: string;
    name: string;
    fullName?: string;
    email: string;
    number: string;
    phone?: string;
    resume?: string;
    profileImageUrl?: string;
    jobSeeker?: {
      title?: string;
      skills?: string[];
      resumeUrl?: string;
      bio?: string;
      experience?: string;
      education?: string;
      preferredLocation?: string;
      expectedSalary?: string;
    };
  } | string;
  resume?: string;
  coverLetter?: string;
  status: 'applied' | 'shortlisted' | 'interview' | 'rejected' | 'offer' | 'hired' | 'withdrawn';
  isWithdrawn?: boolean;
  withdrawnAt?: string | null;
  notes?: string;
  // Legacy single interview field (deprecated - use interviews array)
  interview?: {
    date?: string;
    mode?: string;
    link?: string;
  };
  // Multi-round interviews
  interviews?: Interview[];
  createdAt: string;
  updatedAt: string;
}

export interface ApplyJobData {
  coverLetter?: string;
  resume?: string;
  suggestionSource?: 'ollama' | 'rule';
}

export interface ApplicationFilters {
  q?: string;
  status?: 'all' | 'applied' | 'shortlisted' | 'interview' | 'rejected' | 'offer' | 'hired' | 'withdrawn';
  page?: number;
  limit?: number;
}

export interface RecruiterApplicationFilters {
  status?: 'all' | 'applied' | 'shortlisted' | 'interview' | 'rejected' | 'offer' | 'hired' | 'withdrawn';
  sort?: 'newest' | 'match' | 'experience';
  search?: string;
  minScore?: number;
  mustHave?: string;
  missing?: string;
  analysisStatus?: 'all' | 'analyzed' | 'not_analyzed';
  page?: number;
  limit?: number;
}

export interface ScheduleInterviewData {
  roundNumber?: number; // Auto-computed if not provided
  date: string;
  startTime?: string;
  endTime?: string;
  time?: string;
  timezone?: string;
  mode: 'online' | 'onsite' | 'phone';
  linkOrLocation?: string;
  messageToCandidate?: string;
  internalNotes?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface RecruiterApplicationsResponse {
  success: boolean;
  data: {
    job: {
      _id: string;
      title: string;
      companyName: string;
    };
    counts: {
      applied: number;
      shortlisted: number;
      interview: number;
      rejected: number;
      withdrawn: number;
      total: number;
    };
    applications: RecruiterApplication[];
  };
  pagination: PaginationMeta;
}

export type RecruiterRecentActivityType =
  | 'application_received'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'rejected'
  | 'hired'
  | 'job_created'
  | 'job_updated'
  | 'job_deactivated';

export interface RecruiterRecentActivityItem {
  id: string;
  type: RecruiterRecentActivityType;
  title: string;
  description: string;
  createdAt: string;
  relatedJobId?: string;
  relatedApplicationId?: string;
}

export interface RecruiterRecentActivityResponse {
  success: boolean;
  data: RecruiterRecentActivityItem[];
  pagination: PaginationMeta;
}

export interface RecruiterApplication extends Application {
  matchScore?: number;
  matchedSkills?: string[];
  missingSkills?: string[];
  matchAnalyzedAt?: string;
  experienceYears?: number;
  hasMatchAnalysis?: boolean;
  analysisStatus?: 'analyzed' | 'not_analyzed';
}

export interface ApplicationsResponse {
  success: boolean;
  data: Application[];
  pagination: PaginationMeta;
}

export const applicationService = {
  // Apply for a job (job seeker only)
  applyForJob: async (jobId: string, data: ApplyJobData = {}): Promise<{ success: boolean; data: Application }> => {
    const sanitizedData: Partial<ApplyJobData> = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== null && value !== undefined)
    );

    if (
      'suggestionSource' in sanitizedData &&
      sanitizedData.suggestionSource !== 'ollama' &&
      sanitizedData.suggestionSource !== 'rule'
    ) {
      delete sanitizedData.suggestionSource;
    }

    const response = await axiosInstance.post(`/applications/${jobId}`, sanitizedData);
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

  // Get applications for a specific job (recruiter only) - LEGACY simple fetch
  getJobApplicationsLegacy: async (jobId: string): Promise<{ success: boolean; data: Application[] }> => {
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
    status: 'applied' | 'shortlisted' | 'interview' | 'rejected'
  ): Promise<{ success: boolean; data: Application }> => {
    const response = await axiosInstance.patch(`/applications/${applicationId}/status`, { status });
    return response.data;
  },

  // Withdraw application (job seeker only)
  withdrawApplication: async (applicationId: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.delete(`/applications/${applicationId}/withdraw`);
    return response.data;
  },

  // Check if already applied to a job
  hasApplied: async (jobId: string): Promise<boolean> => {
    try {
      const response = await applicationService.getMyApplications();
      return response.data.some((app) => {
        // Guard: skip invalid applications
        if (!app || !app.jobId) {
          return false;
        }

        if (app.status === 'withdrawn' || app.isWithdrawn) {
          return false;
        }
        
        // Handle string jobId
        if (typeof app.jobId === 'string') {
          return app.jobId === jobId;
        }
        
        // Handle populated jobId object
        if (typeof app.jobId === 'object' && app.jobId !== null) {
          const populatedJob = app.jobId as Job;
          return populatedJob._id === jobId;
        }
        
        return false;
      });
    } catch {
      return false;
    }
  },

  // Shortlist candidate (recruiter only)
  shortlistCandidate: async (applicationId: string): Promise<{ success: boolean; data: Application }> => {
    const response = await axiosInstance.patch(`/applications/${applicationId}/shortlist`);
    return response.data;
  },

  // Schedule interview (recruiter only - legacy single interview)
  scheduleInterview: async (
    applicationId: string,
    interviewData?: { date?: string; mode?: string; link?: string }
  ): Promise<{ success: boolean; data: Application }> => {
    const response = await axiosInstance.patch(`/applications/${applicationId}/interview`, interviewData || {});
    return response.data;
  },

  // Schedule multi-round interview (recruiter only)
  scheduleInterviewRound: async (
    applicationId: string,
    interviewData: ScheduleInterviewData
  ): Promise<{ success: boolean; data: Application }> => {
    const response = await axiosInstance.post(`/applications/${applicationId}/interviews`, interviewData);
    return response.data;
  },

  // Update interview feedback/outcome (recruiter only)
  updateInterviewFeedback: async (
    applicationId: string,
    interviewId: string,
    feedback: { outcome?: 'pass' | 'fail' | 'pending'; feedback?: string }
  ): Promise<{ success: boolean; data: Application }> => {
    if (!applicationId || !interviewId) {
      throw new Error('Missing applicationId or interviewId while updating interview outcome');
    }

    console.log('🧪 [INTERVIEW OUTCOME][Request]', {
      endpoint: `/applications/${applicationId}/interviews/${interviewId}/feedback`,
      applicationId,
      interviewId,
      payload: feedback,
    });

    const response = await axiosInstance.patch(
      `/applications/${applicationId}/interviews/${interviewId}/feedback`,
      feedback
    );

    console.log('✅ [INTERVIEW OUTCOME][Response]', {
      applicationId,
      interviewId,
      outcome: response?.data?.data?.interviews?.find?.((item: Interview) => item?._id === interviewId)?.outcome,
    });

    return response.data;
  },

  // Update interview round (reschedule/edit) (recruiter only)
  updateInterviewRound: async (
    applicationId: string,
    interviewId: string,
    interviewData: ScheduleInterviewData
  ): Promise<{ success: boolean; data: Application }> => {
    const response = await axiosInstance.patch(
      `/applications/${applicationId}/interviews/${interviewId}`,
      interviewData
    );
    return response.data;
  },

  // Update recruiter notes (recruiter only)
  updateNotes: async (applicationId: string, notes: string): Promise<{ success: boolean; data: Application }> => {
    const response = await axiosInstance.patch(`/applications/${applicationId}/notes`, { notes });
    return response.data;
  },

  // Get application by job and candidate (recruiter only)
  getApplicationByJobAndCandidate: async (
    jobId: string,
    candidateId: string
  ): Promise<{ success: boolean; data: Application | null }> => {
    const response = await axiosInstance.get(`/applications/job/${jobId}/candidate/${candidateId}`);
    return response.data;
  },

  // ===== NEW RECRUITER ATS ENDPOINTS =====

  // Get applications for a job with filtering and sorting (recruiter only)
  getRecruiterJobApplications: async (
    jobId: string,
    filters?: RecruiterApplicationFilters
  ): Promise<RecruiterApplicationsResponse> => {
    const params = new URLSearchParams();
    
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.sort) params.append('sort', filters.sort);
    if (filters?.search && filters.search.trim()) params.append('search', filters.search.trim());
    if (filters?.minScore !== undefined && filters.minScore > 0) params.append('minScore', filters.minScore.toString());
    if (filters?.mustHave && filters.mustHave.trim()) params.append('mustHave', filters.mustHave.trim());
    if (filters?.missing && filters.missing.trim()) params.append('missing', filters.missing.trim());
    if (filters?.analysisStatus && filters.analysisStatus !== 'all') params.append('analysisStatus', filters.analysisStatus);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const queryString = params.toString();
    const url = queryString 
      ? `/recruiter/jobs/${jobId}/applications?${queryString}` 
      : `/recruiter/jobs/${jobId}/applications`;

    console.log('[RecruiterJobApplications][Service] Request URL and filters:', {
      url,
      filters,
      queryString,
    });
    
    const response = await axiosInstance.get(url);
    return response.data;
  },

  // Get recruiter recent activity (recruiter dashboard)
  getRecruiterRecentActivity: async (limit = 10, page = 1): Promise<RecruiterRecentActivityResponse> => {
    const response = await axiosInstance.get(`/recruiter/dashboard/recent-activity?limit=${limit}&page=${page}`);
    return response.data;
  },

  // Update application status (recruiter - new endpoint)
  updateRecruiterApplicationStatus: async (
    applicationId: string,
    status: 'applied' | 'shortlisted' | 'interview' | 'rejected' | 'offer' | 'hired'
  ): Promise<{ success: boolean; data: RecruiterApplication }> => {
    console.log('[RECRUITER STATUS][API] Sending status update request:', {
      applicationId,
      status,
      payload: { status },
      endpoint: `/recruiter/applications/${applicationId}/status`,
    });
    const response = await axiosInstance.patch(`/recruiter/applications/${applicationId}/status`, { status });
    console.log('[RECRUITER STATUS][API] Status update response:', {
      applicationId,
      requestedStatus: status,
      responseStatus: response?.status,
      responseData: response?.data,
    });
    return response.data;
  },

  // Bulk update application statuses (recruiter only)
  bulkUpdateApplicationStatus: async (
    jobId: string,
    applicationIds: string[],
    status: 'applied' | 'shortlisted' | 'interview' | 'rejected' | 'offer' | 'hired'
  ): Promise<{ success: boolean; data: { modifiedCount: number; status: string } }> => {
    const response = await axiosInstance.patch(`/recruiter/jobs/${jobId}/applications/bulk-status`, {
      applicationIds,
      status
    });
    return response.data;
  },

};

export default applicationService;
