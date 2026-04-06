import React, { useState, useEffect, useRef } from 'react';
import { profileService } from '../../services';
import { toast } from 'react-toastify';
import { DashboardLayout, LoadingSpinner } from '../../components';
import { useProfile, useUploadProfileImage } from '../../hooks';
import { getFileUrl, getInitials } from '../../Utils';

const AdminProfile: React.FC = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);

  // Use the shared profile hook so the header/sidebar avatar stays in sync
  const { data: profileData, isLoading } = useProfile();
  const uploadImageMutation = useUploadProfileImage();

  const profile = profileData?.data;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const buildFormFromProfile = React.useCallback((profileData: any) => ({
    name: profileData?.fullName || profileData?.name || '',
    email: profileData?.email || '',
    phone: profileData?.phone || profileData?.number || '',
  }), []);

  const createComparableSnapshot = React.useCallback((data: typeof formData) => ({
    name: data.name.trim(),
    phone: data.phone.trim(),
  }), []);

  const clearAvatarSelection = React.useCallback(() => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
    setPendingAvatarFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [avatarPreview]);

  const profileSnapshot = React.useMemo(() => {
    if (!profile) return null;
    return createComparableSnapshot(buildFormFromProfile(profile));
  }, [profile, buildFormFromProfile, createComparableSnapshot]);

  const formSnapshot = React.useMemo(
    () => createComparableSnapshot(formData),
    [formData, createComparableSnapshot],
  );

  const hasFormChanges = React.useMemo(() => {
    if (!profileSnapshot) return false;
    return JSON.stringify(formSnapshot) !== JSON.stringify(profileSnapshot);
  }, [formSnapshot, profileSnapshot]);

  const hasUnsavedChanges = hasFormChanges || Boolean(pendingAvatarFile);
  const isSavingProfile = isSaving || uploadImageMutation.isPending;

  // Sync form when profile data loads
  useEffect(() => {
    if (profile && !isEditing) {
      setFormData(buildFormFromProfile(profile));
      clearAvatarSelection();
    }
  }, [profile, isEditing, buildFormFromProfile, clearAvatarSelection]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!hasUnsavedChanges) {
      toast.info('No changes to save');
      return;
    }

    setIsSaving(true);
    try {
      if (pendingAvatarFile) {
        await uploadImageMutation.mutateAsync(pendingAvatarFile);
      }
      if (hasFormChanges) {
        await profileService.updateProfile({
          fullName: formData.name,
          phone: formData.phone,
        });
      }
      toast.success('Profile updated successfully!');
      clearAvatarSelection();
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPG, PNG, or WebP)');
      if (e.target) e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      if (e.target) e.target.value = '';
      return;
    }

    const isSameAsPending =
      pendingAvatarFile &&
      pendingAvatarFile.name === file.name &&
      pendingAvatarFile.size === file.size &&
      pendingAvatarFile.lastModified === file.lastModified;
    if (isSameAsPending) {
      toast.info('This image is already selected');
      if (e.target) e.target.value = '';
      return;
    }

    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(URL.createObjectURL(file));
    setPendingAvatarFile(file);
    toast.success('Profile photo selected. Click "Save Changes" to apply.');
    if (e.target) e.target.value = '';
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsSaving(true);
    try {
      await profileService.changePassword({
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  const avatarUrl = avatarPreview || getFileUrl(profile?.profileImageUrl);
  const displayName = formData.name || profile?.fullName || profile?.name || 'Administrator';
  const initials = getInitials(displayName);

  useEffect(() => () => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
  }, [avatarPreview]);

  if (isLoading) {
    return (
      <DashboardLayout variant="admin" title="Admin Profile">
        <LoadingSpinner text="Loading your profile..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout variant="admin" title="Admin Profile">
      <div className="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Read-only banner */}
          {!isEditing && (
            <div className="mb-4 flex items-center gap-3 border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
              <svg className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>
                <span className="font-medium">Read-only mode.</span> Click &quot;Edit Profile&quot; to make changes.
              </p>
            </div>
          )}

          {/* Profile Summary Card */}
          <div className="mb-6 border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-800/60">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  {/* Avatar with upload button */}
                  <div className="relative flex-shrink-0">
                    <div className="h-20 w-20 overflow-hidden border border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-200 dark:bg-slate-700">
                          <span className="text-xl font-semibold text-slate-700 dark:text-slate-300">
                            {initials}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Upload trigger button */}
                    <button
                      onClick={() => {
                        if (!isEditing) {
                          toast.info('Please click "Edit Profile" to upload a photo');
                          return;
                        }
                        fileInputRef.current?.click();
                      }}
                      disabled={uploadImageMutation.isPending || !isEditing}
                      className="absolute -bottom-2 -right-2 inline-flex h-8 w-8 items-center justify-center border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                      title={isEditing ? 'Upload profile photo' : 'Enable edit mode to upload photo'}
                    >
                      {uploadImageMutation.isPending ? (
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border border-slate-300 border-t-slate-600" />
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.232-6.232a2.5 2.5 0 113.536 3.536L12.536 16.536a4 4 0 01-1.789 1.05L7 19l1.414-3.747A4 4 0 019 13z" />
                        </svg>
                      )}
                    </button>

                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Name / role info */}
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                      Administrator
                    </p>
                    <h2 className="mt-1 truncate text-2xl font-semibold text-slate-900 dark:text-slate-100">
                      {displayName}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      Platform administration and account management
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{formData.email || profile?.email || '-'}</span>
                      <span>{formData.phone || '-'}</span>
                      <span className="inline-flex items-center border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                        Administrator
                      </span>
                    </div>
                  </div>
                </div>

                {/* Edit / Save / Cancel buttons */}
                <div className="flex shrink-0 gap-2">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center justify-center border border-[#2563EB] bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setFormData(buildFormFromProfile(profile));
                          clearAvatarSelection();
                          setIsEditing(false);
                        }}
                        disabled={isSavingProfile}
                        className="inline-flex items-center justify-center border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSavingProfile || !hasUnsavedChanges}
                        className="inline-flex items-center justify-center border border-[#2563EB] bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-50"
                      >
                        {isSavingProfile ? 'Saving...' : 'Save Changes'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid w-full gap-6 lg:grid-cols-12">
            {/* Left column — Personal Information */}
            <div className="space-y-6 lg:col-span-8">
              <section className="border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                  <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    Personal Information
                  </h2>
                </div>

                <div className="space-y-5 p-5">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    ) : (
                      <p className="text-sm text-slate-900 dark:text-slate-100">{formData.name || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Email
                    </label>
                    <p className="text-sm break-words text-slate-900 dark:text-slate-100">{formData.email || '-'}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    ) : (
                      <p className="text-sm text-slate-900 dark:text-slate-100">{formData.phone || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Role
                    </label>
                    <p className="text-sm text-slate-900 dark:text-slate-100">Administrator</p>
                  </div>
                </div>
              </section>
            </div>

            {/* Right column — Account Overview + Security */}
            <div className="space-y-6 lg:col-span-4">
              <section className="border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                  <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    Account Overview
                  </h2>
                </div>

                <div className="space-y-4 p-5">
                  <div className="flex items-center justify-between border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Account Type</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Admin</span>
                  </div>

                  <div className="flex items-center justify-between border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Account Status</span>
                    <span className="inline-flex border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300">
                      Active
                    </span>
                  </div>

                  <div className="flex items-center justify-between border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Access Level</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Full Access</span>
                  </div>

                  {profile?.createdAt && (
                    <div className="flex items-center justify-between border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Member Since</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  )}
                </div>
              </section>

              <section className="border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                  <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    Security
                  </h2>
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
                    className="w-full border border-[#2563EB] bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Change Password
                  </button>
                  {!isEditing && (
                    <p className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">
                      Enable edit mode to change password
                    </p>
                  )}
                </div>
              </section>

              <section className="border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                  <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    Admin Notes
                  </h2>
                </div>

                <div className="p-5">
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                    Use this page to maintain your basic profile details and update your account password securely.
                    Profile photo changes take effect immediately across the platform.
                  </p>
                </div>
              </section>
            </div>
          </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowPasswordModal(false)} />
          <div className="relative z-10 w-full max-w-md border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Change Password</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="rounded-sm p-1 text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-200"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  disabled={isSaving}
                  className="flex-1 border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordChange}
                  disabled={isSaving}
                  className="flex-1 border border-[#2563EB] bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-50"
                >
                  {isSaving ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default AdminProfile;
