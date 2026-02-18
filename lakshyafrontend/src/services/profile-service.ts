import axiosInstance from './axios-instance';

export interface JobSeekerProfile {
  title?: string;
  bio?: string;
  skills?: string[];
  experience?: string;
  education?: string;
  preferredLocation?: string;
  expectedSalary?: string;
  resumeUrl?: string;
  resumePublicId?: string;
  resumeFormat?: string;
  resumeParseStatus?: 'idle' | 'queued' | 'processing' | 'done' | 'failed';
  resumeParseRunId?: string | null;
  resumeParseError?: string | null;
  resumeParsedAt?: string | null;
  lastAutofillAt?: string | null;
  resumeParseResultSummary?: {
    skillsAdded: number;
    educationFilled: boolean;
    experienceFilled: boolean;
    bioFilled: boolean;
    titleFilled: boolean;
  } | null;
}

export interface RecruiterProfile {
  companyName?: string;
  companyWebsite?: string;
  companyDescription?: string;
  position?: string;
  department?: string;
}

export interface UserProfile {
  _id: string;
  fullName: string;
  name?: string;
  email: string;
  phone?: string;
  number?: string;
  role: 'job_seeker' | 'recruiter' | 'admin';
  companyName?: string;
  location?: string;
  resume?: string;
  profileImageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  jobSeeker?: JobSeekerProfile;
  recruiter?: RecruiterProfile;
}

export interface UpdateProfileData {
  fullName?: string;
  name?: string;
  phone?: string;
  number?: string;
  companyName?: string;
  location?: string;
  jobSeeker?: JobSeekerProfile;
  recruiter?: RecruiterProfile;
}

export const profileService = {
  // Get user profile
  getProfile: async (): Promise<{ success: boolean; data: UserProfile; signedResumeUrl?: string }> => {
    const response = await axiosInstance.get('/profile');
    return response.data;
  },

  // Update profile
  updateProfile: async (data: UpdateProfileData): Promise<{ success: boolean; data: UserProfile }> => {
    console.log('Profile Service - Updating profile with data:', data);
    const response = await axiosInstance.put('/profile', data);
    console.log('Profile Service - Update response:', response.data);
    return response.data;
  },

  // Upload resume
  uploadResume: async (file: File): Promise<{ success: boolean; data: UserProfile; signedResumeUrl?: string }> => {
    console.log('Profile Service - Uploading resume:', file.name, 'size:', file.size, 'type:', file.type);
    const formData = new FormData();
    formData.append('resume', file);
    console.log('FormData created, entries:', Array.from(formData.entries()));
    
    const response = await axiosInstance.post('/profile/upload-resume', formData);
    console.log('Profile Service - Resume upload response:', response.data);
    return response.data;
  },

  // Change password
  changePassword: async (data: { currentPassword?: string; oldPassword?: string; newPassword: string }): Promise<{ success: boolean; message: string }> => {
    const payload = {
      oldPassword: data.currentPassword || data.oldPassword,
      newPassword: data.newPassword,
    };
    const response = await axiosInstance.post('/profile/change-password', payload);
    return response.data;
  },

  // Upload profile image/avatar
  uploadProfileImage: async (file: File): Promise<{ success: boolean; message: string; data: { profileImageUrl: string } }> => {
    console.log('Profile Service - Uploading profile image:', file.name, 'size:', file.size, 'type:', file.type);
    const formData = new FormData();
    formData.append('avatar', file);
    console.log('FormData created for avatar, entries:', Array.from(formData.entries()));
    
    const response = await axiosInstance.post('/profile/avatar', formData);
    console.log('Profile Service - Profile image upload response:', response.data);
    return response.data;
  },

  // Smart Resume Autofill - Merge resume analysis with profile (only fills empty fields)
  autofillProfile: async (analysisData: {
    name?: string;
    email?: string;
    phone?: string;
    title?: string;
    summary?: string;
    skills?: string[];
    experience?: string;
    education?: string;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      profile: UserProfile;
      changes: Array<{
        field: string;
        action: 'filled' | 'skipped' | 'appended';
        value?: any;
        reason: string;
      }>;
      fieldsUpdated: number;
      summary: {
        totalChanges: number;
        filled: number;
        appended: number;
        skipped: number;
      };
    };
  }> => {
    console.log('Profile Service - Autofilling profile with analysis data:', analysisData);
    const response = await axiosInstance.post('/profile/autofill', { analysisData });
    console.log('Profile Service - Autofill response:', response.data);
    return response.data;
  },
};

export default profileService;
