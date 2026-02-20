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
    onSuccess: (response) => {
      console.log('✅ Apply success - Application created:', response.data._id);
      
      // CRITICAL FIX: Invalidate ALL "my applications" queries (not just one with specific filters)
      // Using prefix match to catch all variations: ['applications', 'my', ...any filters]
      console.log('🔄 Invalidating all myApplications queries...');
      queryClient.invalidateQueries({ queryKey: ['applications', 'my'] });
      
      // Also invalidate the general applications cache
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
      
      // Refetch active queries immediately for instant UI update
      queryClient.refetchQueries({ 
        queryKey: ['applications', 'my'], 
        type: 'active' 
      });
      
      console.log('✅ Cache invalidated - My Applications will show new application');
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
      console.log('✅ Application withdrawn');
      
      // CRITICAL FIX: Invalidate ALL "my applications" queries
      console.log('🔄 Invalidating all myApplications queries...');
      queryClient.invalidateQueries({ queryKey: ['applications', 'my'] });
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
      
      // Refetch active queries immediately
      queryClient.refetchQueries({ 
        queryKey: ['applications', 'my'], 
        type: 'active' 
      });
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
    mutationFn: (applicationId: string) => {
      console.log('📋 [SHORTLIST] Shortlisting application:', applicationId);
      return applicationService.shortlistCandidate(applicationId);
    },
    onSuccess: (response, applicationId) => {
      console.log('✅ [SHORTLIST] Success:', response.data);
      
      // Update cache optimistically for the specific application detail view
      queryClient.setQueryData(['recruiterApplication', applicationId], (old: any) => {
        if (!old || !old.data || !old.data.application) return old;
        return {
          ...old,
          data: {
            ...old.data,
            application: {
              ...old.data.application,
              status: 'shortlisted'
            }
          }
        };
      });
      
      // Invalidate and refetch the specific recruiter application query
      queryClient.invalidateQueries({ 
        queryKey: ['recruiterApplication', applicationId],
        exact: true 
      });
      queryClient.refetchQueries({ 
        queryKey: ['recruiterApplication', applicationId],
        exact: true,
        type: 'active'
      });
      
      // Invalidate recruiter job applications list (Manage Job Post table) - ALL filters/tabs
      queryClient.invalidateQueries({ 
        queryKey: ['recruiter-job-applications']
      });
      
      // Force immediate refetch of active recruiter job applications queries
      queryClient.refetchQueries({ 
        queryKey: ['recruiter-job-applications'],
        type: 'active'
      });
      
      // Invalidate job seeker applications
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
      
      console.log('✨ [SHORTLIST] All queries invalidated and refetched - table will update instantly');
    },
    onError: (error) => {
      console.error('❌ [SHORTLIST] Failed:', error);
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
    }) => {
      console.log('🗓️ [INTERVIEW] Scheduling interview for application:', applicationId);
      return applicationService.scheduleInterview(applicationId, interviewData);
    },
    onSuccess: (response, variables) => {
      const { applicationId, interviewData } = variables;
      console.log('✅ [INTERVIEW] Success:', response.data);
      
      // Update cache optimistically for the specific application detail view
      queryClient.setQueryData(['recruiterApplication', applicationId], (old: any) => {
        if (!old || !old.data || !old.data.application) return old;
        return {
          ...old,
          data: {
            ...old.data,
            application: {
              ...old.data.application,
              status: 'interview',
              interview: interviewData || old.data.application.interview
            }
          }
        };
      });
      
      // Invalidate and refetch the specific recruiter application query
      queryClient.invalidateQueries({ 
        queryKey: ['recruiterApplication', applicationId],
        exact: true 
      });
      queryClient.refetchQueries({ 
        queryKey: ['recruiterApplication', applicationId],
        exact: true,
        type: 'active'
      });
      
      // Invalidate recruiter job applications list (Manage Job Post table) - ALL filters/tabs
      queryClient.invalidateQueries({ 
        queryKey: ['recruiter-job-applications']
      });
      
      // Force immediate refetch of active recruiter job applications queries
      queryClient.refetchQueries({ 
        queryKey: ['recruiter-job-applications'],
        type: 'active'
      });
      
      // Invalidate job seeker applications
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
      
      console.log('✨ [INTERVIEW] All queries invalidated and refetched - table will update instantly');
    },
    onError: (error) => {
      console.error('❌ [INTERVIEW] Failed:', error);
    },
  });
};

// Update notes mutation (recruiter)
export const useUpdateApplicationNotes = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ applicationId, notes }: { applicationId: string; notes: string }) => {
      console.log('💾 [MUTATION] Saving notes for application:', applicationId, 'length:', notes.length);
      return applicationService.updateNotes(applicationId, notes);
    },
    onSuccess: (response, variables) => {
      const { applicationId, notes } = variables;
      console.log('✅ [MUTATION] Notes saved successfully. Server returned:', response.data);
      
      // Update cache with new notes IMMEDIATELY
      const updated = queryClient.setQueryData(['recruiterApplication', applicationId], (old: any) => {
        console.log('📦 [CACHE] Old cache data:', old);
        if (!old || !old.data || !old.data.application) {
          console.warn('⚠️ [CACHE] Invalid cache structure, skipping optimistic update');
          return old;
        }
        
        const newData = {
          ...old,
          data: {
            ...old.data,
            application: {
              ...old.data.application,
              notes: notes
            }
          }
        };
        console.log('📦 [CACHE] Updated cache data:', newData);
        return newData;
      });
      
      if (!updated) {
        console.warn('⚠️ [CACHE] setQueryData returned null/undefined - cache update may have failed');
      }
      
      // Force invalidate and refetch to ensure consistency
      console.log('🔄 [REFETCH] Invalidating and refetching application query...');
      queryClient.invalidateQueries({ 
        queryKey: ['recruiterApplication', applicationId],
        exact: true 
      });
      
      // Force refetch immediately
      queryClient.refetchQueries({ 
        queryKey: ['recruiterApplication', applicationId],
        exact: true,
        type: 'active'
      });
      
      // Invalidate application lists (job seeker)
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
      
      // Invalidate recruiter job applications list (so table/drawer updates)
      queryClient.invalidateQueries({ 
        queryKey: ['recruiter-job-applications'],
        refetchType: 'active'
      });
      
      console.log('✨ [MUTATION] Notes update complete - invalidated all related queries');
    },
    onError: (error) => {
      console.error('❌ [MUTATION] Failed to save notes:', error);
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
    queryKey: [
      'recruiter-job-applications', 
      jobId, 
      filters?.status, 
      filters?.sort, 
      filters?.search,
      filters?.minScore,
      filters?.mustHave,
      filters?.missing
    ],
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
    onSuccess: (_response, variables) => {
      const { applicationId, status } = variables;
      console.log('✅ [STATUS UPDATE] Changed to:', status);
      
      // Update cache optimistically for the specific application detail view
      queryClient.setQueryData(['recruiterApplication', applicationId], (old: any) => {
        if (!old || !old.data || !old.data.application) return old;
        return {
          ...old,
          data: {
            ...old.data,
            application: {
              ...old.data.application,
              status: status
            }
          }
        };
      });
      
      // Invalidate and refetch the specific recruiter application query
      queryClient.invalidateQueries({ 
        queryKey: ['recruiterApplication', applicationId],
        exact: true 
      });
      
      // Invalidate all recruiter job applications queries (table)
      queryClient.invalidateQueries({ queryKey: ['recruiter-job-applications'] });
      
      // Force immediate refetch
      queryClient.refetchQueries({ 
        queryKey: ['recruiter-job-applications'],
        type: 'active'
      });
      
      console.log('✨ [STATUS UPDATE] Table will update instantly');
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


