import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobService } from '../services';
import type { JobFilters, CreateJobData } from '../services';

// Query keys
export const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (filters: JobFilters) => [...jobKeys.lists(), filters] as const,
  details: () => [...jobKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobKeys.details(), id] as const,
  myJobs: () => [...jobKeys.all, 'my-jobs'] as const,
};

// Get jobs with filters
export const useJobs = (filters: JobFilters = {}) => {
  return useQuery({
    queryKey: jobKeys.list(filters),
    queryFn: () => jobService.getJobs(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get single job by ID
export const useJob = (jobId: string) => {
  return useQuery({
    queryKey: jobKeys.detail(jobId),
    queryFn: () => jobService.getJobById(jobId),
    enabled: !!jobId,
  });
};

// Get recruiter's jobs
export const useMyJobs = () => {
  return useQuery({
    queryKey: jobKeys.myJobs(),
    queryFn: () => jobService.getMyJobs(),
  });
};

// Create job mutation
export const useCreateJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (jobData: CreateJobData) => jobService.createJob(jobData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
    },
  });
};

// Update job mutation
export const useUpdateJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: Partial<CreateJobData> }) =>
      jobService.updateJob(jobId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(variables.jobId) });
      queryClient.invalidateQueries({ queryKey: jobKeys.myJobs() });
    },
  });
};

// Delete job mutation
export const useDeleteJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (jobId: string) => jobService.deleteJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
    },
  });
};

// Soft delete job mutation (recruiter)
export const useSoftDeleteJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (jobId: string) => jobService.softDeleteJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
};

// Admin soft delete job mutation
export const useAdminSoftDeleteJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (jobId: string) => jobService.adminSoftDeleteJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['adminJobs'] });
    },
  });
};

// Admin edit job mutation
export const useAdminEditJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: Partial<CreateJobData> }) =>
      jobService.adminEditJob(jobId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(variables.jobId) });
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
      queryClient.invalidateQueries({ queryKey: ['adminJobs'] });
    },
  });
};

// Toggle job status mutation
export const useToggleJobStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (jobId: string) => jobService.toggleJobStatus(jobId),
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) });
      queryClient.invalidateQueries({ queryKey: jobKeys.myJobs() });
    },
  });
};
