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
    jobSeeker?: {
      lastAutofillAt?: string | null;
      resumeParsedAt?: string | null;
    };
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
 * Uses lastAutofillAt timestamp to detect new parse+autofill completions
 */
export const useResumeParsePolling = (callbacks?: {
  onParseComplete?: (summary: ResumeParseStatus['summary']) => void;
  onParseError?: (error: string) => void;
}) => {
  const queryClient = useQueryClient();

  // Track last seen autofill timestamp to prevent duplicate toasts
  const lastSeenAutofillRef = useRef<string | null>(null);
  
  // Track if we've initialized the reference with current profile state
  const isInitializedRef = useRef(false);

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
      const lastAutofillAt = data.profile?.jobSeeker?.lastAutofillAt;
      
      // Initialize the reference on first load to prevent showing toast for old data
      if (!isInitializedRef.current && lastAutofillAt) {
        console.log('🔧 Initializing lastSeenAutofillRef with current timestamp:', lastAutofillAt);
        lastSeenAutofillRef.current = lastAutofillAt;
        isInitializedRef.current = true;
        return; // Don't trigger callback on initialization
      }
      
      if (data.parseStatus.status === 'done') {
        console.log('📊 Parse done - lastAutofillAt:', lastAutofillAt, 'lastSeen:', lastSeenAutofillRef.current);
        
        // Only trigger callback if this is a NEW autofill (timestamp changed)
        if (lastAutofillAt && lastAutofillAt !== lastSeenAutofillRef.current) {
          console.log('✅ NEW autofill detected - triggering callback');
          
          if (callbacks?.onParseComplete) {
            callbacks.onParseComplete(data.parseStatus.summary);
          }
          
          // Update last seen timestamp
          lastSeenAutofillRef.current = lastAutofillAt;
          
          // Invalidate profile query to fetch updated data
          queryClient.invalidateQueries({ queryKey: ['profile'] });
        } else if (lastAutofillAt === lastSeenAutofillRef.current) {
          console.log('⏭️  Skipping - already handled this autofill');
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
