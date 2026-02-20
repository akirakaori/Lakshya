import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../services';
import type { UpdateProfileData } from '../services';
import { useAuth } from '../context/auth-context';
import { jobMatchKeys } from './use-job-match';

// Query keys with userId and role for proper cache isolation
export const profileKeys = {
  all: ['profile'] as const,
  detail: (userId?: string, role?: string) => [...profileKeys.all, 'detail', userId, role] as const,
};

// Get user profile with proper cache keying
export const useProfile = () => {
  const { user } = useAuth();
  const userId = user?._id;
  const role = user?.role;
  
  return useQuery({
    queryKey: profileKeys.detail(userId, role),
    queryFn: async () => {
      const response = await profileService.getProfile();
      
      // Debug: Log what we received from API
      console.log('\n📥 ========================================');
      console.log('📥 PROFILE DATA RECEIVED FROM API');
      console.log('📥 ========================================');
      console.log('📥 Success:', response.success);
      console.log('📥 Skills count:', response.data?.jobSeeker?.skills?.length || 0);
      console.log('📥 Skills:', response.data?.jobSeeker?.skills || []);
      console.log('📥 Education:', response.data?.jobSeeker?.education ? 'YES' : 'NO');
      console.log('📥 Experience:', response.data?.jobSeeker?.experience ? 'YES' : 'NO');
      console.log('📥 Title:', response.data?.jobSeeker?.title || '(empty)');
      console.log('📥 Bio:', response.data?.jobSeeker?.bio ? 'YES' : 'NO');
      console.log('📥 Parse Status:', response.data?.jobSeeker?.resumeParseStatus);
      console.log('📥 Parse Summary:', response.data?.jobSeeker?.resumeParseResultSummary);
      console.log('========================================\n');
      
      return response;
    },
    enabled: !!userId, // Only fetch when user is authenticated
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: 'always',
  });
};

// Update profile mutation
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?._id;
  const role = user?.role;
  
  return useMutation({
    mutationFn: (data: UpdateProfileData) => {
      console.log('useUpdateProfile mutation - sending data:', data);
      return profileService.updateProfile(data);
    },
    onSuccess: (response) => {
      console.log('useUpdateProfile success - response:', response);
      
      // Update the cache immediately with the new data
      if (response?.data && userId && role) {
        queryClient.setQueryData(profileKeys.detail(userId, role), response);
      }
      
      // Invalidate profile cache to ensure fresh data on next fetch
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      
      // CRITICAL: Invalidate job match cache so Job Details shows outdated banner immediately
      console.log('🔄 Invalidating jobMatch cache after profile update');
      queryClient.invalidateQueries({ queryKey: jobMatchKeys.all });
    },
    onError: (error) => {
      console.error('useUpdateProfile error:', error);
    }
  });
};

// Upload resume mutation
export const useUploadResume = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?._id;
  const role = user?.role;
  
  return useMutation({
    mutationFn: (file: File) => {
      console.log('useUploadResume - uploading file:', file.name, file.size);
      return profileService.uploadResume(file);
    },
    onSuccess: (response) => {
      console.log('useUploadResume success - response:', response);
      
      // Update the cache immediately with the new data
      if (response?.data && userId && role) {
        queryClient.setQueryData(profileKeys.detail(userId, role), response);
      }
      
      // Invalidate profile cache to ensure fresh data
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      
      // CRITICAL: Invalidate job match cache (resume upload triggers resumeParsedAt update)
      console.log('🔄 Invalidating jobMatch cache after resume upload');
      queryClient.invalidateQueries({ queryKey: jobMatchKeys.all });
    },
    onError: (error) => {
      console.error('useUploadResume error:', error);
    }
  });
};

// Change password mutation
export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: { oldPassword: string; newPassword: string }) =>
      profileService.changePassword(data),
  });
};

// Upload profile image mutation
export const useUploadProfileImage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?._id;
  const role = user?.role;
  
  return useMutation({
    mutationFn: (file: File) => {
      console.log('useUploadProfileImage - uploading file:', file.name, file.size);
      return profileService.uploadProfileImage(file);
    },
    onSuccess: (response) => {
      console.log('useUploadProfileImage success - response:', response);
      
      // Update cache with new profile image URL
      if (response?.data?.profileImageUrl && userId && role) {
        const currentData = queryClient.getQueryData<{ success: boolean; data: any }>(profileKeys.detail(userId, role));
        if (currentData?.data) {
          queryClient.setQueryData(profileKeys.detail(userId, role), {
            ...currentData,
            data: {
              ...currentData.data,
              profileImageUrl: response.data.profileImageUrl
            }
          });
        }
      }
      
      // Also invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
    onError: (error) => {
      console.error('useUploadProfileImage error:', error);
    }
  });
};

// Smart Resume Autofill mutation
export const useAutofillProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?._id;
  const role = user?.role;
  
  return useMutation({
    mutationFn: (analysisData: {
      name?: string;
      email?: string;
      phone?: string;
      title?: string;
      summary?: string;
      skills?: string[];
      experience?: string;
      education?: string;
    }) => {
      console.log('useAutofillProfile - autofilling with analysis data:', analysisData);
      return profileService.autofillProfile(analysisData);
    },
    onSuccess: (response) => {
      console.log('useAutofillProfile success - response:', response);
      console.log('Fields updated:', response.data.fieldsUpdated);
      console.log('Changes:', response.data.changes);
      console.log('Summary:', response.data.summary);
      
      // Update the cache immediately with the new profile data
      if (response?.data?.profile && userId && role) {
        queryClient.setQueryData(profileKeys.detail(userId, role), {
          success: true,
          data: response.data.profile
        });
      }
      
      // Invalidate profile cache to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      
      // CRITICAL: Invalidate job match cache (autofill updates profile fields)
      console.log('🔄 Invalidating jobMatch cache after resume autofill');
      queryClient.invalidateQueries({ queryKey: jobMatchKeys.all });
    },
    onError: (error) => {
      console.error('useAutofillProfile error:', error);
    }
  });
};
