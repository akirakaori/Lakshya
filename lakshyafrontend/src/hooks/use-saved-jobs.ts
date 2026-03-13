import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobService } from '../services';
import { useAuth } from '../context/auth-context';
import type { Job } from '../services';

// Query keys for saved jobs
export const savedJobKeys = {
  all: ['saved-jobs'] as const,
};

// Get all saved jobs for the logged-in job seeker
export const useSavedJobs = () => {
  const { isAuthenticated, isReady, user } = useAuth();

  return useQuery({
    queryKey: savedJobKeys.all,
    queryFn: () => jobService.getSavedJobs(),
    enabled: isReady && isAuthenticated && user?.role === 'job_seeker',
    staleTime: 5 * 60 * 1000,
  });
};

// Save job mutation
export const useSaveJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => jobService.saveJob(jobId),
    onSuccess: () => {
      // Refresh saved jobs list
      queryClient.invalidateQueries({ queryKey: savedJobKeys.all });
    },
  });
};

// Remove saved job mutation
export const useRemoveSavedJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => jobService.removeSavedJob(jobId),
    onSuccess: () => {
      // Refresh saved jobs list
      queryClient.invalidateQueries({ queryKey: savedJobKeys.all });
    },
  });
};

// Convenience hook to check if a given job is saved
export const useIsJobSaved = (jobId: string | undefined) => {
  const { data } = useSavedJobs();
  if (!jobId || !data?.data) return false;
  return data.data.some((job: Job) => job._id === jobId);
};
