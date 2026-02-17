/**
 * Resume Parse Status Polling Hook
 * 
 * Polls the backend for resume parsing status after upload.
 * Automatically stops when status is 'done' or 'failed'.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import axiosInstance from '../services/axios-instance';
import { profileKeys } from './use-profile';

export interface ResumeParseStatus {
  status: 'idle' | 'queued' | 'processing' | 'done' | 'failed';
  error: string | null;
  parsedAt: string | null;
  resumeParseRunId: string | null;
  summary: {
    skillsAdded: number;
    educationFilled: boolean;
    experienceFilled: boolean;
    bioFilled: boolean;
    titleFilled: boolean;
  } | null;
}

export interface ResumeParseStatusResponse {
  success: boolean;
  parseStatus: ResumeParseStatus;
  profile: {
    title: string;
    bio: string;
    skills: string[];
    experience: string;
    education: string;
  };
}

/**
 * Fetch resume parse status from backend
 */
const fetchResumeParseStatus = async (): Promise<ResumeParseStatusResponse> => {
  const response = await axiosInstance.get<ResumeParseStatusResponse>(
    '/profile/resume-parse-status'
  );
  return response.data;
};

/**
 * Hook to poll resume parse status
 * 
 * @param options - { enabled: boolean, onSuccess: callback, onError: callback }
 * @returns Query result with parse status
 */
export const useResumeParseStatus = (options: {
  enabled?: boolean;
  onSuccess?: (data: ResumeParseStatusResponse) => void;
  onError?: (error: Error) => void;
} = {}) => {
  const queryClient = useQueryClient();
  const previousStatus = useRef<string>('idle');

  const query = useQuery<ResumeParseStatusResponse>({
    queryKey: ['resumeParseStatus'],
    queryFn: fetchResumeParseStatus,
    enabled: options.enabled ?? false,
    refetchInterval: (query) => {
      // Stop polling if status is done or failed
      const data = query.state.data;
      if (!data) return false;
      
      const status = data.parseStatus?.status;
      if (status === 'done' || status === 'failed') {
        return false; // Stop polling
      }
      
      // Continue polling every 2 seconds while queued or processing
      return 2000;
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    retry: false
  });

  // Handle status changes
  useEffect(() => {
    if (!query.data) return;

    const currentStatus = query.data.parseStatus.status;

    // Status changed
    if (currentStatus !== previousStatus.current) {
      console.log(`Resume parse status changed: ${previousStatus.current} → ${currentStatus}`);

      // Parsing completed successfully
      if (currentStatus === 'done') {
        // Invalidate AND refetch profile queries to refresh UI with new data
        console.log('Parse complete - invalidating and refetching profile cache');
        queryClient.invalidateQueries({ queryKey: profileKeys.all });
        queryClient.refetchQueries({ queryKey: profileKeys.all });
        
        if (options.onSuccess) {
          options.onSuccess(query.data);
        }
      }

      // Parsing failed
      if (currentStatus === 'failed' && options.onError) {
        const error = new Error(query.data.parseStatus.error || 'Parsing failed');
        options.onError(error);
      }

      previousStatus.current = currentStatus;
    }
  }, [query.data, queryClient, options]);

  return {
    ...query,
    parseStatus: query.data?.parseStatus,
    profile: query.data?.profile,
    isPolling: query.isRefetching,
    isParsing: query.data?.parseStatus.status === 'queued' || 
               query.data?.parseStatus.status === 'processing'
  };
};

/**
 * Hook to start polling after resume upload
 * 
 * Automatically starts polling and stops when done/failed
 */
export const useResumeParsePolling = (callbacks?: {
  onParseComplete?: (summary: ResumeParseStatus['summary']) => void;
  onParseError?: (error: string) => void;
}) => {
  const queryClient = useQueryClient();

  const TOAST_RUNID_KEY = 'resumeParseToastRunId';

  const startPolling = () => {
    // Enable the query by invalidating with a specific state
    queryClient.invalidateQueries({ queryKey: ['resumeParseStatus'] });
  };

  const stopPolling = () => {
    queryClient.cancelQueries({ queryKey: ['resumeParseStatus'] });
  };

  const polling = useResumeParseStatus({
    enabled: true, // Always enabled when this hook is mounted
    onSuccess: (data: ResumeParseStatusResponse) => {
      if (data.parseStatus.status === 'done' && callbacks?.onParseComplete) {
        // Only show toast if this is a NEW parse completion
        const currentRunId = data.parseStatus.resumeParseRunId;
        const lastToastedRunId = sessionStorage.getItem(TOAST_RUNID_KEY);
        
        console.log('Parse complete - currentRunId:', currentRunId, 'lastToasted:', lastToastedRunId);
        
        if (currentRunId && currentRunId !== lastToastedRunId) {
          console.log('Showing toast for NEW parse completion');
          callbacks.onParseComplete(data.parseStatus.summary);
          sessionStorage.setItem(TOAST_RUNID_KEY, currentRunId);
        } else if (currentRunId === lastToastedRunId) {
          console.log('Skipping toast - already shown for this runId');
        }
      }
    },
    onError: (error: Error) => {
      if (callbacks?.onParseError) {
        callbacks.onParseError(error.message);
      }
    }
  });

  return {
    ...polling,
    startPolling,
    stopPolling
  };
};
