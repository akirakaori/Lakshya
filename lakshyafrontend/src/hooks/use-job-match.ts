import { useQuery } from '@tanstack/react-query';
import { jobService } from '../services';
import { useAuth } from '../context/auth-context';

export const jobMatchKeys = {
  all: ['jobMatch'] as const,
  detail: (jobId: string) => [...jobMatchKeys.all, jobId] as const,
};

/**
 * Hook to fetch job match analysis for the authenticated job seeker.
 * Waits for auth to be ready before firing to prevent 401 errors.
 */
export const useJobMatch = (jobId: string | undefined) => {
  const { isReady, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: jobMatchKeys.detail(jobId || ''),
    queryFn: () => {
      console.log('🔍 useJobMatch: Fetching match for jobId:', jobId);
      return jobService.getJobMatch(jobId!);
    },
    enabled: !!jobId && isReady && isAuthenticated,
    staleTime: 0, // Always consider data stale so invalidation causes immediate refetch
    retry: (failureCount, error: any) => {
      // Retry once on 401/403 (token timing issue) or network errors
      if (failureCount >= 1) return false;
      const status = error?.response?.status;
      const shouldRetry = status === 401 || status === 403 || !status;
      console.log(`🔄 useJobMatch retry decision: failureCount=${failureCount}, status=${status}, shouldRetry=${shouldRetry}`);
      return shouldRetry;
    },
    retryDelay: 600,
  });
};
