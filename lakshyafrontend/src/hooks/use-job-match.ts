import { useQuery } from '@tanstack/react-query';
import { jobService } from '../services';

export const jobMatchKeys = {
  all: ['jobMatch'] as const,
  detail: (jobId: string) => [...jobMatchKeys.all, jobId] as const,
};

/**
 * Hook to fetch job match analysis for the authenticated job seeker.
 * Only enabled when a valid jobId is provided.
 */
export const useJobMatch = (jobId: string | undefined) => {
  return useQuery({
    queryKey: jobMatchKeys.detail(jobId || ''),
    queryFn: () => jobService.getJobMatch(jobId!),
    enabled: !!jobId,
    staleTime: 5 * 60 * 1000, // 5 minutes — server caches for 7 days anyway
    retry: 1,
  });
};
