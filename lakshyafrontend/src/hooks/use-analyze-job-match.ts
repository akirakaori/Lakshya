import { useMutation, useQueryClient } from '@tanstack/react-query';
import { jobService } from '../services';
import { jobMatchKeys } from './use-job-match';
import { jobMatchScoresKeys } from './use-job-match-scores';

/**
 * Hook to trigger fresh match analysis computation (POST /analyze).
 * Called when user clicks "Analyze My Match" or "Analyze Again".
 */
export const useAnalyzeJobMatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => {
      console.log('🔬 useAnalyzeJobMatch: Starting analysis for jobId:', jobId);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated. Please wait...');
      }
      return jobService.analyzeJobMatch(jobId);
    },
    onSuccess: async (data, jobId) => {
      console.log('✅ Analysis success:', data);
      
      // Set the query data immediately for instant UI update
      if (data?.data) {
        queryClient.setQueryData(jobMatchKeys.detail(jobId), data);
      }
      
      // Force refetch to ensure cache is fresh
      await queryClient.refetchQueries({ 
        queryKey: jobMatchKeys.detail(jobId),
        type: 'active'
      });
      
      // Invalidate batch match scores queries
      queryClient.invalidateQueries({ queryKey: jobMatchScoresKeys.all });
    },
    onError: (error: any) => {
      console.error('❌ Analysis failed:', error);
      console.error('Error details:', {
        status: error?.response?.status,
        message: error?.response?.data?.message || error?.message,
        hasToken: !!localStorage.getItem('token')
      });
      // Error is handled in the component with toast
    },
  });
};
