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
import { getFileUrl, getInitials } from '../../Utils';

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

  const { parseStatus, startPolling } = useResumeParsePolling({
    onParseComplete: (summary) => {
      console.log('Resume parsing + autofill completed:', summary);
      toast.success('Resume parsed and profile auto-filled successfully!', {
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

  const [formInitialized, setFormInitialized] = React.useState(false);
  const [isDirty, setIsDirty] = React.useState(false);

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

    console.log('?? formData sync check:');
    console.log('  isEditing:', isEditing, '| isDirty:', isDirty, '| formInitialized:', formInitialized);
    console.log('  Server skills:', latestProfile.jobSeeker?.skills?.length || 0);
    console.log('  Current formData skills:', formData.jobSeeker.skills.length);

    setFormData(prev => {
      if (!isEditing) {
        console.log('  ? Not editing - syncing from server');
        if (!formInitialized) setFormInitialized(true);
        return mapProfileToForm();
      }

      if (!isDirty) {
        console.log('  ? Editing but not dirty - syncing from server');
        return mapProfileToForm();
      }

      const isFormEmpty = !prev.fullName && !prev.phone &&
        prev.jobSeeker.skills.length === 0 &&
        !prev.jobSeeker.title && !prev.jobSeeker.bio &&
        !prev.jobSeeker.experience && !prev.jobSeeker.education;

      if (isFormEmpty) {
        console.log('  ??  FormData is empty - forcing sync from server');
        return mapProfileToForm();
      }

      console.log('  ??  Editing and dirty - merging only missing fields');
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
    setIsDirty(true);

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
      setIsDirty(true);
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
    setIsDirty(true);
    setFormData(prev => ({
      ...prev,
      jobSeeker: {
        ...prev.jobSeeker,
        skills: prev.jobSeeker.skills.filter(skill => skill !== skillToRemove),
      },
    }));
  };

  const handleEnterEditMode = () => {
    console.log('?? Entering edit mode - syncing with latest profile data');

    setIsDirty(false);
    setFormInitialized(false);

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

    enterEditMode();
  };

  const handleCancelEdit = () => {
    console.log('? Canceling edit - resetting to server data');

    setIsDirty(false);

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

    exitEditMode();
  };

  const handleSave = async () => {
    if (!guardAction('save')) return;

    try {
      console.log('Saving profile with data:', formData);
      const response = await updateProfileMutation.mutateAsync(formData);
      console.log('Profile update response:', response);

      updateUser({
        name: formData.fullName,
        fullName: formData.fullName,
      });

      toast.success('Profile updated successfully!');

      setIsDirty(false);
      exitEditMode();

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

        toast.success('Resume uploaded! Parsing in progress...', {
          autoClose: 3000
        });

        console.log('Starting resume parse polling...');
        startPolling();
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to upload resume';
        toast.error(errorMessage);
        console.error('Resume upload error:', err);
        console.error('Error response:', err.response?.data);
      }

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

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Please upload a JPG or PNG image');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    try {
      console.log('Uploading avatar:', file.name, file.size);
      const response = await uploadProfileImageMutation.mutateAsync(file);
      console.log('Avatar upload response:', response);

      toast.success('Profile photo updated successfully!');

      if (response?.data?.profileImageUrl) {
        updateUser({ profileImageUrl: response.data.profileImageUrl });
      }

      setTimeout(() => {
        URL.revokeObjectURL(previewUrl);
        setAvatarPreview(null);
      }, 500);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to upload profile photo';
      toast.error(errorMessage);
      console.error('Avatar upload error:', err);
      console.error('Error response:', err.response?.data);

      URL.revokeObjectURL(previewUrl);
      setAvatarPreview(null);
    }

    if (e.target) {
      e.target.value = '';
    }
  };

  React.useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

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

  console.log('?? Profile Render Debug:');
  console.log('  Server profile skills:', profile?.jobSeeker?.skills?.length || 0);
  console.log('  FormData skills:', formData.jobSeeker.skills.length);
  console.log('  IsEditing:', isEditing);
  console.log('  IsDirty:', isDirty);
  console.log('  Parse status:', parseStatus?.status);
  console.log('  Skills to display:', isEditing ? formData.jobSeeker.skills : (profile?.jobSeeker?.skills || []));

  return (
    <DashboardLayout variant="job-seeker" title="Profile">
      <div className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
        {!isEditing && (
          <div className="mb-4 flex items-center gap-3 border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <svg className="h-5 w-5 flex-shrink-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>
              <span className="font-medium">Read-only mode.</span> Click Edit Profile to make changes.
            </p>
          </div>
        )}

        <div className="mb-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-6 py-5">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="relative">
                  <input
                    type="file"
                    ref={avatarInputRef}
                    accept="image/png,image/jpeg"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />

                  <div className="h-20 w-20 overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                    {avatarPreview || profile?.profileImageUrl ? (
                      <img
                        src={avatarPreview || getFileUrl(profile?.profileImageUrl) || undefined}
                        alt={profile?.fullName || 'Profile'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-200">
                        <span className="text-xl font-semibold text-slate-700 dark:text-slate-300">
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
                    className="absolute -bottom-2 -right-2 inline-flex h-8 w-8 items-center justify-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    title={isEditing ? 'Upload photo' : 'Enable edit mode to upload photo'}
                  >
                    {uploadProfileImageMutation.isPending ? (
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.232-6.232a2.5 2.5 0 113.536 3.536L12.536 16.536a4 4 0 01-1.789 1.05L7 19l1.414-3.747A4 4 0 019 13z" />
                      </svg>
                    )}
                  </button>
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                    Profile
                  </p>
                  <h1 className="mt-1 truncate text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    {profile?.fullName || profile?.name || 'User'}
                  </h1>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {formData.jobSeeker.title || 'Job Seeker'}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{profile?.email || '-'}</span>
                    <span>{profile?.phone || profile?.number || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      className="inline-flex items-center justify-center border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={updateProfileMutation.isPending}
                      className="inline-flex items-center justify-center border border-[#3b4bb8] bg-[#3b4bb8] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2e3a94] disabled:opacity-50"
                    >
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEnterEditMode}
                    className="inline-flex items-center justify-center border border-[#3b4bb8] bg-[#3b4bb8] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2e3a94]"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid w-full gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <section className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="border-b border-slate-200 dark:border-slate-800 px-5 py-4">
                <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">Personal Information</h2>
              </div>

              <div className="space-y-5 p-5">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-[#3b4bb8] focus:ring-2 focus:ring-[#3b4bb8]/10"
                    />
                  ) : (
                    <p className="text-sm text-slate-900 dark:text-slate-100">{profile?.fullName || profile?.name || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                  <p className="text-sm text-slate-900 dark:text-slate-100 break-words">{profile?.email || '-'}</p>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-[#3b4bb8] focus:ring-2 focus:ring-[#3b4bb8]/10"
                    />
                  ) : (
                    <p className="text-sm text-slate-900 dark:text-slate-100">{profile?.phone || profile?.number || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Professional Title</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="jobSeeker.title"
                      value={formData.jobSeeker.title}
                      onChange={handleInputChange}
                      placeholder="e.g. Senior Software Engineer"
                      className="w-full border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-[#3b4bb8] focus:ring-2 focus:ring-[#3b4bb8]/10"
                    />
                  ) : (
                    <p className="text-sm text-slate-900 dark:text-slate-100">{profile?.jobSeeker?.title || '-'}</p>
                  )}
                </div>
              </div>
            </section>

            <section className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="border-b border-slate-200 dark:border-slate-800 px-5 py-4">
                <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">Professional Summary</h2>
              </div>

              <div className="p-5">
                {isEditing ? (
                  <textarea
                    name="jobSeeker.bio"
                    value={formData.jobSeeker.bio}
                    onChange={handleInputChange}
                    rows={5}
                    placeholder="Tell recruiters about yourself..."
                    className="w-full resize-none border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-[#3b4bb8] focus:ring-2 focus:ring-[#3b4bb8]/10"
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
                    {profile?.jobSeeker?.bio || 'No bio added yet.'}
                  </p>
                )}
              </div>
            </section>

            <section className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="border-b border-slate-200 dark:border-slate-800 px-5 py-4">
                <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">Technical Stack</h2>
              </div>

              <div className="p-5">
                {isEditing && (
                  <div className="mb-4 flex gap-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                      placeholder="Add a skill..."
                      className="flex-1 border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-[#3b4bb8] focus:ring-2 focus:ring-[#3b4bb8]/10"
                    />
                    <button
                      onClick={addSkill}
                      className="inline-flex items-center justify-center border border-[#3b4bb8] bg-[#3b4bb8] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2e3a94]"
                    >
                      Add
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {(isEditing ? formData.jobSeeker.skills : profile?.jobSeeker?.skills || []).map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3 py-1 text-sm text-slate-700 dark:text-slate-300"
                    >
                      {skill}
                      {isEditing && (
                        <button
                          onClick={() => removeSkill(skill)}
                          className="ml-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                        >
                          &times;
                        </button>
                      )}
                    </span>
                  ))}
                  {!isEditing && (!profile?.jobSeeker?.skills || profile.jobSeeker.skills.length === 0) && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No skills added yet.</p>
                  )}
                </div>
              </div>
            </section>

            <section className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="border-b border-slate-200 dark:border-slate-800 px-5 py-4">
                <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">Experience</h2>
              </div>

              <div className="p-5">
                {isEditing ? (
                  <textarea
                    name="jobSeeker.experience"
                    value={formData.jobSeeker.experience}
                    onChange={handleInputChange}
                    rows={6}
                    placeholder="Describe your work experience..."
                    className="w-full resize-none border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-[#3b4bb8] focus:ring-2 focus:ring-[#3b4bb8]/10"
                  />
                ) : (
                  <div className="space-y-4">
                    {formData.jobSeeker.experience ? (
                      <div className="relative pl-6 before:absolute before:left-0 before:top-0 before:h-full before:w-[2px] before:bg-slate-200">
                        <div className="absolute -left-[5px] top-1 h-3 w-3 rounded-full border-2 border-[#3b4bb8] bg-white dark:bg-slate-900"></div>
                        <div className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
                          {profile?.jobSeeker?.experience}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400 italic">No experience added yet.</p>
                    )}
                  </div>
                )}
              </div>
            </section>

            <section className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="border-b border-slate-200 dark:border-slate-800 px-5 py-4">
                <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">Education</h2>
              </div>

              <div className="p-5">
                {isEditing ? (
                  <textarea
                    name="jobSeeker.education"
                    value={formData.jobSeeker.education}
                    onChange={handleInputChange}
                    rows={6}
                    placeholder="Describe your education..."
                    className="w-full resize-none border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-[#3b4bb8] focus:ring-2 focus:ring-[#3b4bb8]/10"
                  />
                ) : (
                  <div className="space-y-4">
                    {formData.jobSeeker.education ? (
                      <div className="relative pl-6 before:absolute before:left-0 before:top-0 before:h-full before:w-[2px] before:bg-slate-200">
                        <div className="absolute -left-[5px] top-1 h-3 w-3 rounded-full border-2 border-[#3b4bb8] bg-white dark:bg-slate-900"></div>
                        <div className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
                          {profile?.jobSeeker?.education}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400 italic">No education added yet.</p>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6 lg:col-span-4">
            <section className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="border-b border-slate-200 dark:border-slate-800 px-5 py-4">
                <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">Resume Asset</h2>
              </div>

              <div className="space-y-4 p-5">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf"
                  onChange={handleResumeUpload}
                  className="hidden"
                />

                {profile?.jobSeeker?.resumeUrl ? (
                  <>
                    <div className="flex items-center justify-between border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3 py-3">
                      <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Resume uploaded</span>
                      </div>
                      <span className="text-xs font-medium text-emerald-600">DONE</span>
                    </div>

                    {parseStatus && (
                      <div
                        className={`border px-3 py-3 text-sm ${
                          parseStatus.status === 'done'
                            ? 'border-green-200 bg-green-50 text-green-700'
                            : parseStatus.status === 'failed'
                            ? 'border-red-200 bg-red-50 text-red-700'
                            : parseStatus.status === 'processing'
                            ? 'border-blue-200 bg-blue-50 text-blue-700'
                            : 'border-amber-200 bg-amber-50 text-amber-700'
                        }`}
                      >
                        {parseStatus.status === 'done' && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Parsed</span>
                            {parseStatus.summary && (
                              <span className="text-xs">
                                ({parseStatus.summary.skillsAdded} skills added)
                              </span>
                            )}
                          </div>
                        )}
                        {parseStatus.status === 'queued' && (
                          <div className="flex items-center gap-2">
                            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="font-medium">Queued for parsing...</span>
                          </div>
                        )}
                        {parseStatus.status === 'processing' && (
                          <div className="flex items-center gap-2">
                            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="font-medium">Parsing resume...</span>
                          </div>
                        )}
                        {parseStatus.status === 'failed' && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Parsing failed</span>
                            {parseStatus.error && (
                              <span className="text-xs">({parseStatus.error})</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <a
                      href={profileData?.signedResumeUrl || getFileUrl(profile.jobSeeker.resumeUrl) || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm font-medium text-[#3b4bb8] hover:text-[#2e3a94]"
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
                      className="w-full border border-[#3b4bb8] bg-[#3b4bb8] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2e3a94] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {uploadResumeMutation.isPending ? 'Uploading...' : 'Update Document'}
                    </button>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                      <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">No resume uploaded</p>
                    <button
                      onClick={() => {
                        if (!isEditing) {
                          toast.info('Please click "Edit Profile" to upload resume');
                          return;
                        }
                        fileInputRef.current?.click();
                      }}
                      disabled={uploadResumeMutation.isPending || !isEditing}
                      className="w-full border border-[#3b4bb8] bg-[#3b4bb8] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2e3a94] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {uploadResumeMutation.isPending ? 'Uploading...' : 'Upload Document'}
                    </button>
                    <p className="mt-2 text-xs text-slate-400">PDF, max 5MB</p>
                  </div>
                )}
              </div>
            </section>

            <section className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="border-b border-slate-200 dark:border-slate-800 px-5 py-4">
                <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">Career Preferences</h2>
              </div>

              <div className="space-y-5 p-5">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Preferred Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="jobSeeker.preferredLocation"
                      value={formData.jobSeeker.preferredLocation}
                      onChange={handleInputChange}
                      placeholder="e.g. Remote, New York"
                      className="w-full border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-[#3b4bb8] focus:ring-2 focus:ring-[#3b4bb8]/10"
                    />
                  ) : (
                    <p className="text-sm text-slate-700 dark:text-slate-300">{profile?.jobSeeker?.preferredLocation || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Expected Salary</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="jobSeeker.expectedSalary"
                      value={formData.jobSeeker.expectedSalary}
                      onChange={handleInputChange}
                      placeholder="e.g. $80,000 - $100,000"
                      className="w-full border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-[#3b4bb8] focus:ring-2 focus:ring-[#3b4bb8]/10"
                    />
                  ) : (
                    <p className="text-sm text-slate-700 dark:text-slate-300">{profile?.jobSeeker?.expectedSalary || '-'}</p>
                  )}
                </div>
              </div>
            </section>

            <section className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="border-b border-slate-200 dark:border-slate-800 px-5 py-4">
                <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">Security</h2>
              </div>

              <div className="p-5">
                <button
                  onClick={() => {
                    if (!isEditing) {
                      toast.info('Please click "Edit Profile" to change password');
                      return;
                    }
                    setShowPasswordModal(true);
                  }}
                  disabled={!isEditing}
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Change Password
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowPasswordModal(false)} />
          <div className="relative z-10 my-8 max-h-[90vh] w-full max-w-md overflow-y-auto border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">Change Password</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-[#3b4bb8] focus:ring-2 focus:ring-[#3b4bb8]/10"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-[#3b4bb8] focus:ring-2 focus:ring-[#3b4bb8]/10"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-[#3b4bb8] focus:ring-2 focus:ring-[#3b4bb8]/10"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={changePasswordMutation.isPending}
                className="flex-1 border border-[#3b4bb8] bg-[#3b4bb8] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2e3a94] disabled:opacity-50"
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