import { useQuery } from '@tanstack/react-query';
import { jobService } from '../services';
import { useAuth } from '../context/auth-context';

export const recommendationKeys = {
  all: ['recommendations'] as const,
};

/**
 * Hook to fetch personalised job recommendations for the logged-in job seeker.
 * Waits for auth to be ready before firing to prevent 401 errors.
 * Cache is kept fresh for 5 minutes — recommendations don't change that quickly.
 */
export const useRecommendedJobs = () => {
  const { isReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: recommendationKeys.all,
    queryFn: () => jobService.getRecommendations(),
    enabled: isReady && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};
