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
  getProfile: async (): Promise<{ success: boolean; data: UserProfile }> => {
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
  uploadResume: async (file: File): Promise<{ success: boolean; data: UserProfile }> => {
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
};

export default profileService;
