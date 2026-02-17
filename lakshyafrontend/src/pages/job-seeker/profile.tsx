import React, { useState, useRef } from 'react';
import { DashboardLayout, LoadingSpinner } from '../../components';
import { 
  useProfile, 
  useUpdateProfile, 
  useUploadResume, 
  useChangePassword, 
  useUploadProfileImage, 
  useEditMode,
  useResumeParsePolling
} from '../../hooks';
import { useAuth } from '../../context/auth-context';
import { toast } from 'react-toastify';
import { getFileUrl, getInitials } from '../../utils';

const Profile: React.FC = () => {
  const { updateUser } = useAuth();
  const { data: profileData, isLoading } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const uploadResumeMutation = useUploadResume();
  const changePasswordMutation = useChangePassword();
  const uploadProfileImageMutation = useUploadProfileImage();
  
  const { isEditing, enterEditMode, exitEditMode, guardAction } = useEditMode();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Resume parsing status polling
  const { parseStatus, startPolling } = useResumeParsePolling({
    onParseComplete: (summary) => {
      console.log('Resume parsing completed:', summary);
      toast.success('Resume parsed! Profile updated automatically.', {
        autoClose: 5000
      });
    },
    onParseError: (error) => {
      console.error('Resume parsing failed:', error);
      toast.error(`Resume parsing failed: ${error}`, {
        autoClose: 5000
      });
    }
  });

  const profile = profileData?.data;

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    jobSeeker: {
      title: '',
      bio: '',
      skills: [] as string[],
      experience: '',
      education: '',
      preferredLocation: '',
      expectedSalary: '',
    },
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [newSkill, setNewSkill] = useState('');

  // Track if form has been initialized to prevent race conditions
  const [formInitialized, setFormInitialized] = React.useState(false);
  
  // Track if user has modified form data (dirty flag)
  const [isDirty, setIsDirty] = React.useState(false);

  // Initialize form data when profile loads (only once or after successful save)
  // IMPORTANT: Depends on profileData?.data to update when cache refreshes
  React.useEffect(() => {
    const latestProfile = profileData?.data;
    
    if (!latestProfile) return;

    const mapProfileToForm = () => ({
      fullName: latestProfile.fullName || latestProfile.name || '',
      phone: latestProfile.phone || latestProfile.number || '',
      jobSeeker: {
        title: latestProfile.jobSeeker?.title || '',
        bio: latestProfile.jobSeeker?.bio || '',
        skills: latestProfile.jobSeeker?.skills || [],
        experience: latestProfile.jobSeeker?.experience || '',
        education: latestProfile.jobSeeker?.education || '',
        preferredLocation: latestProfile.jobSeeker?.preferredLocation || '',
        expectedSalary: latestProfile.jobSeeker?.expectedSalary || '',
      },
    });

    console.log('🔄 formData sync check:');
    console.log('  isEditing:', isEditing, '| isDirty:', isDirty, '| formInitialized:', formInitialized);
    console.log('  Server skills:', latestProfile.jobSeeker?.skills?.length || 0);
    console.log('  Current formData skills:', formData.jobSeeker.skills.length);

    setFormData(prev => {
      // NOT in edit mode -> always replace with latest server data
      if (!isEditing) {
        console.log('  ✅ Not editing - syncing from server');
        if (!formInitialized) setFormInitialized(true);
        return mapProfileToForm();
      }

      // In edit mode BUT user hasn't modified anything -> safe to replace
      if (!isDirty) {
        console.log('  ✅ Editing but not dirty - syncing from server');
        return mapProfileToForm();
      }

      // Edge case: formData is completely empty (shouldn't happen but be safe)
      const isFormEmpty = !prev.fullName && !prev.phone && 
                          prev.jobSeeker.skills.length === 0 &&
                          !prev.jobSeeker.title && !prev.jobSeeker.bio &&
                          !prev.jobSeeker.experience && !prev.jobSeeker.education;
      
      if (isFormEmpty) {
        console.log('  ⚠️  FormData is empty - forcing sync from server');
        return mapProfileToForm();
      }

      // In edit mode AND user has modified -> merge only EMPTY fields (preserve user edits)
      console.log('  ⚠️  Editing and dirty - merging only missing fields');
      const merged = {
        fullName: prev.fullName || latestProfile.fullName || latestProfile.name || '',
        phone: prev.phone || latestProfile.phone || latestProfile.number || '',
        jobSeeker: {
          title: prev.jobSeeker.title || latestProfile.jobSeeker?.title || '',
          bio: prev.jobSeeker.bio || latestProfile.jobSeeker?.bio || '',
          skills: prev.jobSeeker.skills.length > 0 
            ? prev.jobSeeker.skills 
            : (latestProfile.jobSeeker?.skills || []),
          experience: prev.jobSeeker.experience || latestProfile.jobSeeker?.experience || '',
          education: prev.jobSeeker.education || latestProfile.jobSeeker?.education || '',
          preferredLocation: prev.jobSeeker.preferredLocation || latestProfile.jobSeeker?.preferredLocation || '',
          expectedSalary: prev.jobSeeker.expectedSalary || latestProfile.jobSeeker?.expectedSalary || '',
        },
      };
      console.log('  Merged skills count:', merged.jobSeeker.skills.length);
      return merged;
    });

    if (!formInitialized) {
      setFormInitialized(true);
    }
  }, [profileData?.data, isEditing, isDirty]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setIsDirty(true); // Mark form as dirty when user makes changes
    
    if (name.startsWith('jobSeeker.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        jobSeeker: {
          ...prev.jobSeeker,
          [field]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.jobSeeker.skills.includes(newSkill.trim())) {
      setIsDirty(true); // Mark form as dirty when adding skills
      setFormData(prev => ({
        ...prev,
        jobSeeker: {
          ...prev.jobSeeker,
          skills: [...prev.jobSeeker.skills, newSkill.trim()],
        },
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setIsDirty(true); // Mark form as dirty when removing skills
    setFormData(prev => ({
      ...prev,
      jobSeeker: {
        ...prev.jobSeeker,
        skills: prev.jobSeeker.skills.filter(skill => skill !== skillToRemove),
      },
    }));
  };

  // Custom handler for entering edit mode
  const handleEnterEditMode = () => {
    console.log('✏️ Entering edit mode - syncing with latest profile data');
    
    // Reset dirty flag
    setIsDirty(false);
    
    // Sync formData with latest profile data
    if (profile) {
      setFormData({
        fullName: profile.fullName || profile.name || '',
        phone: profile.phone || profile.number || '',
        jobSeeker: {
          title: profile.jobSeeker?.title || '',
          bio: profile.jobSeeker?.bio || '',
          skills: profile.jobSeeker?.skills || [],
          experience: profile.jobSeeker?.experience || '',
          education: profile.jobSeeker?.education || '',
          preferredLocation: profile.jobSeeker?.preferredLocation || '',
          expectedSalary: profile.jobSeeker?.expectedSalary || '',
        },
      });
      console.log('  Synced skills count:', profile.jobSeeker?.skills?.length || 0);
    }
    
    // Enter edit mode
    enterEditMode();
  };

  // Custom handler for canceling edit mode
  const handleCancelEdit = () => {
    console.log('❌ Canceling edit - resetting to server data');
    
    // Reset dirty flag
    setIsDirty(false);
    
    // Revert formData to latest profile data
    if (profile) {
      setFormData({
        fullName: profile.fullName || profile.name || '',
        phone: profile.phone || profile.number || '',
        jobSeeker: {
          title: profile.jobSeeker?.title || '',
          bio: profile.jobSeeker?.bio || '',
          skills: profile.jobSeeker?.skills || [],
          experience: profile.jobSeeker?.experience || '',
          education: profile.jobSeeker?.education || '',
          preferredLocation: profile.jobSeeker?.preferredLocation || '',
          expectedSalary: profile.jobSeeker?.expectedSalary || '',
        },
      });
    }
    
    // Exit edit mode
    exitEditMode();
  };

  const handleSave = async () => {
    if (!guardAction('save')) return;
    
    try {
      console.log('Saving profile with data:', formData);
      const response = await updateProfileMutation.mutateAsync(formData);
      console.log('Profile update response:', response);
      
      // Update auth context with new name
      updateUser({
        name: formData.fullName,
        fullName: formData.fullName,
      });
      
      toast.success('Profile updated successfully!');
      
      // Reset dirty flag after successful save
      setIsDirty(false);
      
      // Exit edit mode - form will NOT reset because formInitialized is true
      exitEditMode();
      
      // Force re-initialize form with updated data after cache updates
      setTimeout(() => {
        setFormInitialized(false);
      }, 100);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update profile';
      toast.error(errorMessage);
      console.error('Profile update error:', err);
      console.error('Error response:', err.response?.data);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!guardAction('upload resume')) {
      if (e.target) e.target.value = '';
      return;
    }
    
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      try {
        console.log('Uploading resume:', file.name, file.size);
        const response = await uploadResumeMutation.mutateAsync(file);
        console.log('Resume upload response:', response);
        
        // Show success message
        toast.success('Resume uploaded! Parsing in progress...', {
          autoClose: 3000
        });
        
        // Start polling for parse status
        console.log('Starting resume parse polling...');
        startPolling();
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to upload resume';
        toast.error(errorMessage);
        console.error('Resume upload error:', err);
        console.error('Error response:', err.response?.data);
      }
      
      // Reset file input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handlePasswordChange = async () => {
    if (!guardAction('change password')) return;
    
    if (!passwordData.currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    try {
      await changePasswordMutation.mutateAsync({
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!guardAction('upload avatar')) {
      if (e.target) e.target.value = '';
      return;
    }
    
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Please upload a JPG or PNG image');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    // Show preview
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    try {
      console.log('Uploading avatar:', file.name, file.size);
      const response = await uploadProfileImageMutation.mutateAsync(file);
      console.log('Avatar upload response:', response);
      
      toast.success('Profile photo updated successfully!');
      
      // Update auth context with new avatar URL
      if (response?.data?.profileImageUrl) {
        updateUser({ profileImageUrl: response.data.profileImageUrl });
      }
      
      // Clean up preview after short delay to show success
      setTimeout(() => {
        URL.revokeObjectURL(previewUrl);
        setAvatarPreview(null);
      }, 500);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to upload profile photo';
      toast.error(errorMessage);
      console.error('Avatar upload error:', err);
      console.error('Error response:', err.response?.data);
      
      // Clean up preview immediately on error
      URL.revokeObjectURL(previewUrl);
      setAvatarPreview(null);
    }
    
    // Reset file input to allow re-uploading the same file
    if (e.target) {
      e.target.value = '';
    }
  };

  // Cleanup avatar preview on unmount
  React.useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  // Handle modal body overflow
  React.useEffect(() => {
    if (showPasswordModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showPasswordModal]);

  if (isLoading) {
    return (
      <DashboardLayout variant="job-seeker" title="Profile">
        <LoadingSpinner text="Loading your profile..." />
      </DashboardLayout>
    );
  }

  // Debug: Compare server data vs form state
  console.log('📊 Profile Render Debug:');
  console.log('  Server profile skills:', profile?.jobSeeker?.skills?.length || 0);
  console.log('  FormData skills:', formData.jobSeeker.skills.length);
  console.log('  IsEditing:', isEditing);
  console.log('  IsDirty:', isDirty);
  console.log('  Parse status:', parseStatus?.status);
  console.log('  Skills to display:', isEditing ? formData.jobSeeker.skills : (profile?.jobSeeker?.skills || []));

  return (
    <DashboardLayout variant="job-seeker" title="Profile">
      <div className="max-w-4xl mx-auto w-full px-4 pb-10">
        {/* Read-only mode banner */}
        {!isEditing && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-800">
              <span className="font-medium">Read-only mode.</span> Click "Edit Profile" to make changes.
            </p>
          </div>
        )}
        {/* Profile Header */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6 w-full">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-32"></div>
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12 w-full min-w-0">
              {/* Avatar with upload */}
              <div className="relative">
                <input
                  type="file"
                  ref={avatarInputRef}
                  accept="image/png,image/jpeg"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <div className="w-24 h-24 bg-white rounded-full border-4 border-white shadow-lg overflow-hidden">
                  {avatarPreview || profile?.profileImageUrl ? (
                    <img
                      src={avatarPreview || getFileUrl(profile?.profileImageUrl) || undefined}
                      alt={profile?.fullName || 'Profile'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-100">
                      <span className="text-3xl font-bold text-indigo-600">
                        {getInitials(profile?.fullName || profile?.name)}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (!isEditing) {
                      toast.info('Please click "Edit Profile" to upload photo');
                      return;
                    }
                    avatarInputRef.current?.click();
                  }}
                  disabled={uploadProfileImageMutation.isPending || !isEditing}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={isEditing ? "Upload photo" : "Enable edit mode to upload photo"}
                >
                  {uploadProfileImageMutation.isPending ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 truncate">{profile?.fullName || profile?.name || 'User'}</h1>
                <p className="text-gray-600 truncate">{formData.jobSeeker.title || 'Job Seeker'}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={updateProfileMutation.isPending}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEnterEditMode}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 w-full">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6 min-w-0 w-full">
            {/* Personal Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 w-full">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-900 break-words">{profile?.fullName || profile?.name || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900 break-words">{profile?.email || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.phone || profile?.number || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Professional Title</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="jobSeeker.title"
                      value={formData.jobSeeker.title}
                      onChange={handleInputChange}
                      placeholder="e.g. Senior Software Engineer"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.jobSeeker?.title || '-'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 w-full">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Professional Summary</h2>
              {isEditing ? (
                <textarea
                  name="jobSeeker.bio"
                  value={formData.jobSeeker.bio}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Tell recruiters about yourself..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              ) : (
                <p className="text-gray-600 whitespace-pre-wrap break-words">{profile?.jobSeeker?.bio || 'No bio added yet.'}</p>
              )}
            </div>

            {/* Skills */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 w-full">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills</h2>
              {isEditing && (
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                    placeholder="Add a skill..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={addSkill}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Add
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {(isEditing ? formData.jobSeeker.skills : profile?.jobSeeker?.skills || []).map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                  >
                    {skill}
                    {isEditing && (
                      <button
                        onClick={() => removeSkill(skill)}
                        className="ml-1 text-indigo-500 hover:text-indigo-700"
                      >
                        &times;
                      </button>
                    )}
                  </span>
                ))}
                {(!isEditing && (!profile?.jobSeeker?.skills || profile.jobSeeker.skills.length === 0)) && (
                  <p className="text-gray-500">No skills added yet.</p>
                )}
              </div>
            </div>

            {/* Experience & Education */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 w-full">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Experience & Education</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                  {isEditing ? (
                    <textarea
                      name="jobSeeker.experience"
                      value={formData.jobSeeker.experience}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Describe your work experience..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  ) : (
                    <p className="text-gray-600 whitespace-pre-wrap break-words">{profile?.jobSeeker?.experience || 'No experience added.'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                  {isEditing ? (
                    <textarea
                      name="jobSeeker.education"
                      value={formData.jobSeeker.education}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Describe your education..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  ) : (
                    <p className="text-gray-600 whitespace-pre-wrap break-words">{profile?.jobSeeker?.education || 'No education added.'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 min-w-0 w-full">
            {/* Resume */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 w-full">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Resume</h2>
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf"
                onChange={handleResumeUpload}
                className="hidden"
              />
              {profile?.jobSeeker?.resumeUrl ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">Resume uploaded</span>
                  </div>
                  
                  {/* Parse Status Badge */}
                  {parseStatus && (
                    <div className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                      parseStatus.status === 'done' ? 'bg-green-50 text-green-700' :
                      parseStatus.status === 'failed' ? 'bg-red-50 text-red-700' :
                      parseStatus.status === 'processing' ? 'bg-blue-50 text-blue-700' :
                      'bg-yellow-50 text-yellow-700'
                    }`}>
                      {parseStatus.status === 'done' && (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">Parsed ✓</span>
                          {parseStatus.summary && (
                            <span className="text-xs">
                              ({parseStatus.summary.skillsAdded} skills added)
                            </span>
                          )}
                        </>
                      )}
                      {parseStatus.status === 'queued' && (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="font-medium">Queued for parsing...</span>
                        </>
                      )}
                      {parseStatus.status === 'processing' && (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="font-medium">Parsing resume...</span>
                        </>
                      )}
                      {parseStatus.status === 'failed' && (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">Parsing failed</span>
                          {parseStatus.error && (
                            <span className="text-xs">({parseStatus.error})</span>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  
                  <a
                    href={profileData?.signedResumeUrl || getFileUrl(profile.jobSeeker.resumeUrl) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-indigo-600 hover:text-indigo-700 text-sm"
                  >
                    View Resume
                  </a>
                  <button
                    onClick={() => {
                      if (!isEditing) {
                        toast.info('Please click "Edit Profile" to update resume');
                        return;
                      }
                      fileInputRef.current?.click();
                    }}
                    disabled={uploadResumeMutation.isPending || !isEditing}
                    className="w-full px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadResumeMutation.isPending ? 'Uploading...' : 'Update Resume'}
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm mb-4">No resume uploaded</p>
                  <button
                    onClick={() => {
                      if (!isEditing) {
                        toast.info('Please click "Edit Profile" to upload resume');
                        return;
                      }
                      fileInputRef.current?.click();
                    }}
                    disabled={uploadResumeMutation.isPending || !isEditing}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadResumeMutation.isPending ? 'Uploading...' : 'Upload Resume'}
                  </button>
                  <p className="text-xs text-gray-400 mt-2">PDF, max 5MB</p>
                </div>
              )}
            </div>

            {/* Preferences */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 w-full">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Preferences</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="jobSeeker.preferredLocation"
                      value={formData.jobSeeker.preferredLocation}
                      onChange={handleInputChange}
                      placeholder="e.g. Remote, New York"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-600">{profile?.jobSeeker?.preferredLocation || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Salary</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="jobSeeker.expectedSalary"
                      value={formData.jobSeeker.expectedSalary}
                      onChange={handleInputChange}
                      placeholder="e.g. $80,000 - $100,000"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-600">{profile?.jobSeeker?.expectedSalary || '-'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 w-full">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Security</h2>
              <button
                onClick={() => {
                  if (!isEditing) {
                    toast.info('Please click "Edit Profile" to change password');
                    return;
                  }
                  setShowPasswordModal(true);
                }}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowPasswordModal(false)} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-md my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Change Password</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={changePasswordMutation.isPending}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Profile;
