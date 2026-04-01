import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationService } from '../services';
import type { ApplyJobData, ApplicationFilters, RecruiterApplicationFilters, ScheduleInterviewData } from '../services';
import { useAuth } from '../context/auth-context';

// Query keys
export const applicationKeys = {
  all: ['applications'] as const,
  my: (filters?: ApplicationFilters) => [...applicationKeys.all, 'my', filters] as const,
  forJob: (jobId: string) => [...applicationKeys.all, 'job', jobId] as const,
  detail: (id: string) => [...applicationKeys.all, 'detail', id] as const,
  recruiterRecentActivity: (limit: number, page: number) => [...applicationKeys.all, 'recruiter-recent-activity', limit, page] as const,
};

// Get my applications (job seeker)
export const useMyApplications = (
  filters?: ApplicationFilters,
  options?: { enabled?: boolean }
) => {
  const { isAuthenticated, isReady } = useAuth();
  
  return useQuery({
    queryKey: applicationKeys.my(filters),
    queryFn: () => applicationService.getMyApplications(filters),
    enabled: isReady && isAuthenticated && (options?.enabled ?? true),
  });
};

// Get applications for a job (recruiter - paginated)
export const useRecruiterJobApplications = (jobId: string, filters: RecruiterApplicationFilters = {}) => {
  return useQuery({
    queryKey: [...applicationKeys.forJob(jobId), filters],
    queryFn: () => applicationService.getRecruiterJobApplications(jobId, filters),
    enabled: !!jobId,
  });
};

// Get recruiter recent activity feed (dashboard)
export const useRecruiterRecentActivity = (limit = 10, page = 1) => {
  return useQuery({
    queryKey: applicationKeys.recruiterRecentActivity(limit, page),
    queryFn: () => applicationService.getRecruiterRecentActivity(limit, page),
  });
};

// Get applications for a job (recruiter - legacy)
export const useJobApplications = (jobId: string) => {
  return useQuery({
    queryKey: applicationKeys.forJob(jobId),
    queryFn: () => applicationService.getJobApplicationsLegacy(jobId),
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
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
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
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
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

    if (app.status === 'withdrawn' || app.isWithdrawn) {
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
    onMutate: async (applicationId) => {
      console.log('🔄 [OPTIMISTIC] Shortlisting immediately');
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['recruiterApplication', applicationId] });
      await queryClient.cancelQueries({ queryKey: ['recruiter-job-applications'] });
      
      // Snapshot previous values
      const previousDetail = queryClient.getQueryData(['recruiterApplication', applicationId]);
      const previousLists = queryClient.getQueriesData({ queryKey: ['recruiter-job-applications'] });
      
      // Extract jobId
      let jobId: string | null = null;
      if (previousDetail && typeof previousDetail === 'object') {
        const detail = previousDetail as any;
        const app = detail?.data?.application;
        if (app?.jobId) {
          jobId = typeof app.jobId === 'string' ? app.jobId : app.jobId._id;
        }
      }
      
      // Optimistically update detail cache
      queryClient.setQueryData(['recruiterApplication', applicationId], (old: any) => {
        if (!old?.data?.application) return old;
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
      
      // Optimistically update ALL list cache variants for this jobId
      if (jobId) {
        queryClient.setQueriesData(
          { queryKey: ['recruiter-job-applications', jobId] },
          (old: any) => {
            if (!old?.data?.applications) return old;
            return {
              ...old,
              data: {
                ...old.data,
                applications: old.data.applications.map((app: any) =>
                  app._id === applicationId ? { ...app, status: 'shortlisted' } : app
                )
              }
            };
          }
        );
      }
      
      return { previousDetail, previousLists, jobId };
    },
    onSuccess: (_response, applicationId, context) => {
      console.log('✅ [SHORTLIST] Success');
      
      // Invalidate to sync counts and server state
      queryClient.invalidateQueries({ 
        queryKey: ['recruiterApplication', applicationId],
        exact: true 
      });
      
      if (context?.jobId) {
        queryClient.invalidateQueries({ 
          queryKey: ['recruiter-job-applications', context.jobId]
        });
      } else {
        queryClient.invalidateQueries({ 
          queryKey: ['recruiter-job-applications']
        });
      }
      
      // Invalidate job seeker applications
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    },
    onError: (error, applicationId, context) => {
      console.error('❌ [SHORTLIST] Failed - rolling back:', error);
      
      // Rollback
      if (context?.previousDetail) {
        queryClient.setQueryData(['recruiterApplication', applicationId], context.previousDetail);
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
  });
};

// Schedule interview mutation (recruiter) - LEGACY
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
    onMutate: async (variables) => {
      const { applicationId, interviewData } = variables;
      console.log('🔄 [OPTIMISTIC] Scheduling interview immediately');
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['recruiterApplication', applicationId] });
      await queryClient.cancelQueries({ queryKey: ['recruiter-job-applications'] });
      
      // Snapshot previous values
      const previousDetail = queryClient.getQueryData(['recruiterApplication', applicationId]);
      const previousLists = queryClient.getQueriesData({ queryKey: ['recruiter-job-applications'] });
      
      // Extract jobId
      let jobId: string | null = null;
      if (previousDetail && typeof previousDetail === 'object') {
        const detail = previousDetail as any;
        const app = detail?.data?.application;
        if (app?.jobId) {
          jobId = typeof app.jobId === 'string' ? app.jobId : app.jobId._id;
        }
      }
      
      // Optimistically update detail cache
      queryClient.setQueryData(['recruiterApplication', applicationId], (old: any) => {
        if (!old?.data?.application) return old;
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
      
      // Optimistically update list caches
      if (jobId) {
        queryClient.setQueriesData(
          { queryKey: ['recruiter-job-applications', jobId] },
          (old: any) => {
            if (!old?.data?.applications) return old;
            return {
              ...old,
              data: {
                ...old.data,
                applications: old.data.applications.map((app: any) =>
                  app._id === applicationId ? { ...app, status: 'interview', interview: interviewData || app.interview } : app
                )
              }
            };
          }
        );
      }
      
      return { previousDetail, previousLists, jobId };
    },
    onSuccess: (_response, variables, context) => {
      const { applicationId } = variables;
      console.log('✅ [INTERVIEW] Success');
      
      // Invalidate to sync counts and server state
      queryClient.invalidateQueries({ 
        queryKey: ['recruiterApplication', applicationId],
        exact: true 
      });
      
      if (context?.jobId) {
        queryClient.invalidateQueries({ 
          queryKey: ['recruiter-job-applications', context.jobId]
        });
      } else {
        queryClient.invalidateQueries({ 
          queryKey: ['recruiter-job-applications']
        });
      }
      
      // Invalidate job seeker applications
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    },
    onError: (error, variables, context) => {
      console.error('❌ [INTERVIEW] Failed - rolling back:', error);
      
      // Rollback
      if (context?.previousDetail) {
        queryClient.setQueryData(['recruiterApplication', variables.applicationId], context.previousDetail);
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
  });
};

// Schedule multi-round interview mutation (recruiter - NEW)
export const useScheduleInterviewRound = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      applicationId, 
      interviewData 
    }: { 
      applicationId: string; 
      interviewData: ScheduleInterviewData 
    }) => {
      console.log('🗓️ [SCHEDULE ROUND] Scheduling interview round for:', applicationId);
      return applicationService.scheduleInterviewRound(applicationId, interviewData);
    },
    onMutate: async (variables) => {
      const { applicationId, interviewData } = variables;
      console.log('🔄 [OPTIMISTIC] Adding interview round immediately');
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['recruiterApplication', applicationId] });
      await queryClient.cancelQueries({ queryKey: ['recruiter-job-applications'] });
      await queryClient.cancelQueries({ queryKey: ['applications', 'my'] });
      
      // Snapshot previous values
      const previousDetail = queryClient.getQueryData(['recruiterApplication', applicationId]);
      const previousLists = queryClient.getQueriesData({ queryKey: ['recruiter-job-applications'] });
      const previousJobSeekerLists = queryClient.getQueriesData({ queryKey: ['applications', 'my'] });
      
      // Extract jobId
      let jobId: string | null = null;
      if (previousDetail && typeof previousDetail === 'object') {
        const detail = previousDetail as any;
        const app = detail?.data?.application;
        if (app?.jobId) {
          jobId = typeof app.jobId === 'string' ? app.jobId : app.jobId._id;
        }
      }
      
      // Optimistically update detail cache
      queryClient.setQueryData(['recruiterApplication', applicationId], (old: any) => {
        if (!old?.data?.application) return old;
        const existingInterviews = old.data.application.interviews || [];
        return {
          ...old,
          data: {
            ...old.data,
            application: {
              ...old.data.application,
              status: 'interview',
              interviews: [
                ...existingInterviews,
                {
                  ...interviewData,
                  roundNumber: interviewData.roundNumber || (existingInterviews.length + 1),
                  outcome: 'pending'
                }
              ]
            }
          }
        };
      });
      
      // Optimistically update recruiter list caches
      if (jobId) {
        queryClient.setQueriesData(
          { queryKey: ['recruiter-job-applications', jobId] },
          (old: any) => {
            if (!old?.data?.applications) return old;
            return {
              ...old,
              data: {
                ...old.data,
                applications: old.data.applications.map((app: any) =>
                  app._id === applicationId ? { ...app, status: 'interview' } : app
                )
              }
            };
          }
        );
      }
      
      // Optimistically update job seeker list caches (for interview visibility)
      queryClient.setQueriesData(
        { queryKey: ['applications', 'my'] },
        (old: any) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((app: any) => {
              if (app._id === applicationId) {
                const existingInterviews = app.interviews || [];
                return {
                  ...app,
                  status: 'interview',
                  interviews: [
                    ...existingInterviews,
                    {
                      ...interviewData,
                      roundNumber: interviewData.roundNumber || (existingInterviews.length + 1),
                      outcome: 'pending'
                    }
                  ]
                };
              }
              return app;
            })
          };
        }
      );
      
      return { previousDetail, previousLists, previousJobSeekerLists, jobId };
    },
    onSuccess: (response, variables, context) => {
      const { applicationId } = variables;
      console.log('✅ [SCHEDULE ROUND] Success - interview round added');
      console.log('✅ [SCHEDULE ROUND] Server response:', response?.data);
      
      // Update detail cache with server response
      if (response?.data) {
        queryClient.setQueryData(['recruiterApplication', applicationId], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            data: {
              ...old.data,
              application: response.data // Replace with fresh server data including interviews
            }
          };
        });
      }
      
      // Invalidate all related queries
      queryClient.invalidateQueries({ 
        queryKey: ['recruiterApplication', applicationId],
        exact: true 
      });
      
      if (context?.jobId) {
        queryClient.invalidateQueries({ 
          queryKey: ['recruiter-job-applications', context.jobId]
        });
      } else {
        queryClient.invalidateQueries({ 
          queryKey: ['recruiter-job-applications']
        });
      }
      
      // Invalidate job seeker applications (so they see interview schedule)
      queryClient.invalidateQueries({ queryKey: ['applications', 'my'] });
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    },
    onError: (error, variables, context) => {
      console.error('❌ [SCHEDULE ROUND] Failed - rolling back:', error);
      
      // Rollback all optimistic updates
      if (context?.previousDetail) {
        queryClient.setQueryData(['recruiterApplication', variables.applicationId], context.previousDetail);
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousJobSeekerLists) {
        context.previousJobSeekerLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
  });
};

// Update interview round (reschedule/edit) (recruiter - NEW)
export const useUpdateInterviewRound = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      applicationId, 
      interviewId,
      interviewData 
    }: { 
      applicationId: string;
      interviewId: string;
      interviewData: ScheduleInterviewData 
    }) => {
      console.log('📝 [UPDATE INTERVIEW] Updating interview:', interviewId);
      return applicationService.updateInterviewRound(applicationId, interviewId, interviewData);
    },
    onMutate: async (variables) => {
      const { applicationId, interviewId, interviewData } = variables;
      console.log('🔄 [OPTIMISTIC] Updating interview immediately');
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['recruiterApplication', applicationId] });
      await queryClient.cancelQueries({ queryKey: ['recruiter-job-applications'] });
      await queryClient.cancelQueries({ queryKey: ['applications', 'my'] });
      
      // Snapshot previous values
      const previousDetail = queryClient.getQueryData(['recruiterApplication', applicationId]);
      const previousLists = queryClient.getQueriesData({ queryKey: ['recruiter-job-applications'] });
      const previousJobSeekerLists = queryClient.getQueriesData({ queryKey: ['applications', 'my'] });
      
      // Extract jobId
      let jobId: string | null = null;
      if (previousDetail && typeof previousDetail === 'object') {
        const detail = previousDetail as any;
        const app = detail?.data?.application;
        if (app?.jobId) {
          jobId = typeof app.jobId === 'string' ? app.jobId : app.jobId._id;
        }
      }
      
      // Optimistically update detail cache
      queryClient.setQueryData(['recruiterApplication', applicationId], (old: any) => {
        if (!old?.data?.application?.interviews) return old;
        return {
          ...old,
          data: {
            ...old.data,
            application: {
              ...old.data.application,
              interviews: old.data.application.interviews.map((interview: any) =>
                interview._id === interviewId
                  ? { ...interview, ...interviewData }
                  : interview
              )
            }
          }
        };
      });
      
      // Optimistically update job seeker list caches
      queryClient.setQueriesData(
        { queryKey: ['applications', 'my'] },
        (old: any) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((app: any) => {
              if (app._id === applicationId && app.interviews) {
                return {
                  ...app,
                  interviews: app.interviews.map((interview: any) =>
                    interview._id === interviewId
                      ? { ...interview, ...interviewData }
                      : interview
                  )
                };
              }
              return app;
            })
          };
        }
      );
      
      return { previousDetail, previousLists, previousJobSeekerLists, jobId };
    },
    onSuccess: (response, variables, context) => {
      const { applicationId } = variables;
      console.log('✅ [UPDATE INTERVIEW] Success - interview updated');
      
      // Update detail cache with server response
      if (response?.data) {
        queryClient.setQueryData(['recruiterApplication', applicationId], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            data: {
              ...old.data,
              application: response.data
            }
          };
        });
      }
      
      // Invalidate all related queries
      queryClient.invalidateQueries({ 
        queryKey: ['recruiterApplication', applicationId],
        exact: true 
      });
      
      if (context?.jobId) {
        queryClient.invalidateQueries({ 
          queryKey: ['recruiter-job-applications', context.jobId]
        });
      } else {
        queryClient.invalidateQueries({ 
          queryKey: ['recruiter-job-applications']
        });
      }
      
      // Invalidate job seeker applications
      queryClient.invalidateQueries({ queryKey: ['applications', 'my'] });
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    },
    onError: (error, variables, context) => {
      console.error('❌ [UPDATE INTERVIEW] Failed - rolling back:', error);
      
      // Rollback all optimistic updates
      if (context?.previousDetail) {
        queryClient.setQueryData(['recruiterApplication', variables.applicationId], context.previousDetail);
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousJobSeekerLists) {
        context.previousJobSeekerLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
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
    onMutate: async (variables) => {
      const { applicationId, notes } = variables;
      console.log('🔄 [OPTIMISTIC] Updating notes immediately');
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['recruiterApplication', applicationId] });
      await queryClient.cancelQueries({ queryKey: ['recruiter-job-applications'] });
      
      // Snapshot previous values for rollback
      const previousDetail = queryClient.getQueryData(['recruiterApplication', applicationId]);
      const previousLists = queryClient.getQueriesData({ queryKey: ['recruiter-job-applications'] });
      
      // Extract jobId from cached detail
      let jobId: string | null = null;
      if (previousDetail && typeof previousDetail === 'object') {
        const detail = previousDetail as any;
        const app = detail?.data?.application;
        if (app?.jobId) {
          jobId = typeof app.jobId === 'string' ? app.jobId : app.jobId._id;
        }
      }
      
      // Optimistically update the detail cache
      queryClient.setQueryData(['recruiterApplication', applicationId], (old: any) => {
        if (!old?.data?.application) return old;
        return {
          ...old,
          data: {
            ...old.data,
            application: {
              ...old.data.application,
              notes: notes
            }
          }
        };
      });
      
      // Optimistically update ALL list cache variants for this jobId
      if (jobId) {
        queryClient.setQueriesData(
          { queryKey: ['recruiter-job-applications', jobId] },
          (old: any) => {
            if (!old?.data?.applications) return old;
            return {
              ...old,
              data: {
                ...old.data,
                applications: old.data.applications.map((app: any) =>
                  app._id === applicationId ? { ...app, notes } : app
                )
              }
            };
          }
        );
      }
      
      console.log('✨ [OPTIMISTIC] Notes updated in all caches immediately');
      return { previousDetail, previousLists, jobId };
    },
    onSuccess: (_response, variables, context) => {
      const { applicationId } = variables;
      console.log('✅ [NOTES UPDATE] Server confirmed');
      
      // Invalidate to sync with server
      queryClient.invalidateQueries({ 
        queryKey: ['recruiterApplication', applicationId],
        exact: true 
      });
      
      // Invalidate only the specific job's application lists (not all jobs)
      if (context?.jobId) {
        queryClient.invalidateQueries({ 
          queryKey: ['recruiter-job-applications', context.jobId]
        });
      } else {
        // Fallback: invalidate all if jobId not found
        queryClient.invalidateQueries({ 
          queryKey: ['recruiter-job-applications']
        });
      }
      
      console.log('✨ [NOTES UPDATE] Complete - drawer/table will show updated notes');
    },
    onError: (error, _variables, context) => {
      console.error('❌ [NOTES UPDATE] Failed - rolling back:', error);
      
      // Rollback optimistic updates
      if (context?.previousDetail) {
        queryClient.setQueryData(
          ['recruiterApplication', _variables.applicationId],
          context.previousDetail
        );
      }
      
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
  });
};

// Update application status mutation (recruiter - new version)
export const useUpdateRecruiterApplicationStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ applicationId, status }: { applicationId: string; status: 'applied' | 'shortlisted' | 'interview' | 'rejected' | 'offer' | 'hired' }) =>
      applicationService.updateRecruiterApplicationStatus(applicationId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
      queryClient.invalidateQueries({ queryKey: ['recruiter-job-applications'] });
    },
  });
};

// Bulk update application status mutation (recruiter)
export const useBulkUpdateApplicationStatus = (jobId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ applicationIds, status }: { applicationIds: string[]; status: 'applied' | 'shortlisted' | 'interview' | 'rejected' | 'offer' | 'hired' }) =>
      applicationService.bulkUpdateApplicationStatus(jobId, applicationIds, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...applicationKeys.forJob(jobId)] });
    },
  });
};

// Update interview outcome (recruiter)
export const useUpdateInterviewOutcome = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({
      applicationId,
      interviewId,
      feedback
    }: {
      applicationId: string;
      interviewId: string;
      feedback: { outcome?: 'pass' | 'fail' | 'pending'; feedback?: string };
    }) => applicationService.updateInterviewFeedback(applicationId, interviewId, feedback),
    onSuccess: (_response, variables, _context) => {
      const { applicationId } = variables;
      console.log('✅ [INTERVIEW OUTCOME] Success');
      
      // Invalidate specific application detail
      queryClient.invalidateQueries({ 
        queryKey: ['recruiterApplication', applicationId],
        exact: true 
      });
      
      // Invalidate lists
      queryClient.invalidateQueries({ 
        queryKey: ['recruiter-job-applications']
      });
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    },
  });
};
