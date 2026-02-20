import { useQuery } from '@tanstack/react-query';
import { jobService } from '../services';

export const jobMatchScoresKeys = {
  all: ['jobMatchScores'] as const,
  list: (jobIds: string[]) => [...jobMatchScoresKeys.all, jobIds.sort().join(',')] as const,
};

/**
 * Hook to fetch cached match scores for multiple jobs (batch).
 * Only enabled when jobIds array is provided and not empty.
 * Uses sorted jobIds for stable cache key.
 */
export const useJobMatchScores = (jobIds: string[] | undefined) => {
  const sortedJobIds = jobIds ? [...jobIds].sort() : [];
  
  return useQuery({
    queryKey: jobMatchScoresKeys.list(sortedJobIds),
    queryFn: () => jobService.getBatchMatchScores(sortedJobIds),
    enabled: !!jobIds && jobIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};
