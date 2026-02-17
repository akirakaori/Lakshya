import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationService } from '../services';
import type { ApplyJobData, ApplicationFilters, RecruiterApplicationFilters } from '../services';

// Query keys
export const applicationKeys = {
  all: ['applications'] as const,
  my: (filters?: ApplicationFilters) => [...applicationKeys.all, 'my', filters] as const,
  forJob: (jobId: string) => [...applicationKeys.all, 'job', jobId] as const,
  detail: (id: string) => [...applicationKeys.all, 'detail', id] as const,
};

// Get my applications (job seeker)
export const useMyApplications = (filters?: ApplicationFilters) => {
  return useQuery({
    queryKey: applicationKeys.my(filters),
    queryFn: () => applicationService.getMyApplications(filters),
  });
};

// Get applications for a job (recruiter)
export const useJobApplications = (jobId: string) => {
  return useQuery({
    queryKey: applicationKeys.forJob(jobId),
    queryFn: () => applicationService.getJobApplications(jobId),
    enabled: !!jobId,
  });
};

// Get application by ID
export const useApplication = (applicationId: string) => {
  return useQuery({
    queryKey: applicationKeys.detail(applicationId),
    queryFn: () => applicationService.getApplicationById(applicationId),
    enabled: !!applicationId,
  });
};

// Apply for job mutation
export const useApplyForJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data?: ApplyJobData }) =>
      applicationService.applyForJob(jobId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.my() });
    },
  });
};

// Update application status mutation (recruiter)
export const useUpdateApplicationStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ applicationId, status }: { applicationId: string; status: 'applied' | 'shortlisted' | 'interview' | 'rejected' }) =>
      applicationService.updateApplicationStatus(applicationId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    },
  });
};

// Withdraw application mutation
export const useWithdrawApplication = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (applicationId: string) => applicationService.withdrawApplication(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.my() });
    },
  });
};

// Check if already applied hook
export const useHasApplied = (jobId: string) => {
  const { data: applications } = useMyApplications();
  
  // Guard: no data or empty jobId
  if (!jobId || !applications?.data || !Array.isArray(applications.data)) {
    return false;
  }
  
  return applications.data.some((app) => {
    // Guard: skip invalid applications
    if (!app || !app.jobId) {
      return false;
    }
    
    // Handle string jobId
    if (typeof app.jobId === 'string') {
      return app.jobId === jobId;
    }
    
    // Handle populated jobId object with optional chaining
    if (typeof app.jobId === 'object' && app.jobId !== null) {
      return (app.jobId as any)?._id === jobId;
    }
    
    return false;
  });
};

// Get application by job and candidate (recruiter)
export const useApplicationByJobAndCandidate = (jobId: string, candidateId: string) => {
  return useQuery({
    queryKey: [...applicationKeys.all, 'job', jobId, 'candidate', candidateId],
    queryFn: () => applicationService.getApplicationByJobAndCandidate(jobId, candidateId),
    enabled: !!jobId && !!candidateId,
  });
};

// Shortlist candidate mutation (recruiter)
export const useShortlistCandidate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (applicationId: string) => applicationService.shortlistCandidate(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    },
  });
};

// Schedule interview mutation (recruiter)
export const useScheduleInterview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      applicationId, 
      interviewData 
    }: { 
      applicationId: string; 
      interviewData?: { date?: string; mode?: string; link?: string } 
    }) => applicationService.scheduleInterview(applicationId, interviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    },
  });
};

// Update notes mutation (recruiter)
export const useUpdateApplicationNotes = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ applicationId, notes }: { applicationId: string; notes: string }) =>
      applicationService.updateNotes(applicationId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    },
  });
};

// ===== NEW RECRUITER ATS HOOKS =====

// Get recruiter job applications with filtering and sorting
export const useRecruiterJobApplications = (
  jobId: string, 
  filters?: RecruiterApplicationFilters
) => {
  return useQuery({
    queryKey: ['recruiter-job-applications', jobId, filters?.status, filters?.sort, filters?.search],
    queryFn: () => applicationService.getRecruiterJobApplications(jobId, filters),
    enabled: !!jobId,
  });
};

// Update application status (recruiter - new endpoint)
export const useUpdateRecruiterApplicationStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      applicationId, 
      status 
    }: { 
      applicationId: string; 
      status: 'applied' | 'shortlisted' | 'interview' | 'rejected' 
    }) => applicationService.updateRecruiterApplicationStatus(applicationId, status),
    onSuccess: () => {
      // Invalidate all recruiter job applications queries
      queryClient.invalidateQueries({ queryKey: ['recruiter-job-applications'] });
    },
  });
};

// Bulk update application statuses (recruiter)
export const useBulkUpdateApplicationStatus = (jobId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      applicationIds, 
      status 
    }: { 
      applicationIds: string[]; 
      status: 'applied' | 'shortlisted' | 'interview' | 'rejected' 
    }) => applicationService.bulkUpdateApplicationStatus(jobId, applicationIds, status),
    onSuccess: () => {
      // Invalidate all recruiter job applications queries for this job
      queryClient.invalidateQueries({ queryKey: ['recruiter-job-applications', jobId] });
    },
  });
};


