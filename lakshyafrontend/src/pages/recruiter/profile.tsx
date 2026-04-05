import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout, LoadingSpinner } from '../../components';
import { useProfile, useUpdateProfile, useChangePassword, useUploadProfileImage, useEditMode } from '../../hooks';
import { toast } from 'react-toastify';
import { getFileUrl, getInitials } from '../../Utils';

const RecruiterProfile: React.FC = () => {
  const { data: profileData, isLoading } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  const uploadImageMutation = useUploadProfileImage();

  const { isEditing, enterEditMode, exitEditMode, guardAction } = useEditMode();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profile = profileData?.data;

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    companyName: '',
    location: '',
    recruiter: {
      companyWebsite: '',
      companyDescription: '',
      position: '',
      department: '',
    },
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || profile.name || '',
        phone: profile.phone || profile.number || '',
        companyName: profile.companyName || '',
        location: profile.location || '',
        recruiter: {
          companyWebsite: profile.recruiter?.companyWebsite || '',
          companyDescription: profile.recruiter?.companyDescription || '',
          position: profile.recruiter?.position || '',
          department: profile.recruiter?.department || '',
        },
      });
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('recruiter.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        recruiter: {
          ...prev.recruiter,
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

  const handleSave = async () => {
    if (!guardAction('save')) return;

    try {
      await updateProfileMutation.mutateAsync(formData);
      toast.success('Profile updated successfully!');
      exitEditMode();
    } catch {
      toast.error('Failed to update profile');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!guardAction('upload avatar')) {
      if (e.target) e.target.value = '';
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPG, PNG, or WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      await uploadImageMutation.mutateAsync(file);
      toast.success('Profile photo updated successfully!');
    } catch {
      toast.error('Failed to upload profile photo');
    }
  };

  const handlePasswordChange = async () => {
    if (!guardAction('change password')) return;

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
    } catch {
      toast.error('Failed to change password');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout variant="recruiter" title="Profile">
        <LoadingSpinner text="Loading your profile..." />
      </DashboardLayout>
    );
  }

  const avatarUrl = getFileUrl(profile?.profileImageUrl);
  const displayName = profile?.fullName || profile?.name || 'Recruiter';
  const initials = getInitials(displayName);

  return (
    <DashboardLayout variant="recruiter" title="Profile">
      <div className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
        {!isEditing && (
          <div className="mb-4 flex items-center gap-3 border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <svg className="h-5 w-5 flex-shrink-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>
              <span className="font-medium">Read-only mode.</span> Click &quot;Edit Profile&quot; to make changes.
            </p>
          </div>
        )}

        <div className="mb-6 border border-slate-200 bg-white">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="relative">
                  <div className="h-20 w-20 overflow-hidden border border-slate-300 bg-slate-100">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-200">
                        <span className="text-xl font-semibold text-slate-700">{initials}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (!isEditing) {
                        toast.info('Please click "Edit Profile" to upload photo');
                        return;
                      }
                      fileInputRef.current?.click();
                    }}
                    disabled={!isEditing}
                    className="absolute -bottom-2 -right-2 inline-flex h-8 w-8 items-center justify-center border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    title={isEditing ? 'Upload profile photo' : 'Enable edit mode to upload photo'}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.232-6.232a2.5 2.5 0 113.536 3.536L12.536 16.536a4 4 0 01-1.789 1.05L7 19l1.414-3.747A4 4 0 019 13z" />
                    </svg>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Recruiter Profile
                  </p>
                  <h1 className="mt-1 truncate text-2xl font-semibold text-slate-900">
                    {displayName}
                  </h1>
                  <p className="mt-1 text-sm text-slate-600">
                    {formData.recruiter.position || 'Recruiter'} at {formData.companyName || 'Company'}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                    <span>{profile?.email || '-'}</span>
                    <span>{profile?.phone || profile?.number || '-'}</span>
                    <span>{profile?.location || formData.location || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={exitEditMode}
                      className="inline-flex items-center justify-center border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
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
                    onClick={enterEditMode}
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
            <section className="border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-base font-semibold tracking-tight text-slate-900">Personal Information</h2>
              </div>

              <div className="space-y-5 p-5">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#3b4bb8] focus:ring-2 focus:ring-[#3b4bb8]/10"
                    />
                  ) : (
                    <p className="text-sm text-slate-900">{profile?.fullName || profile?.name || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                  <p className="text-sm text-slate-900 break-words">{profile?.email || '-'}</p>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#3b4bb8] focus:ring-2 focus:ring-[#3b4bb8]/10"
                    />
                  ) : (
                    <p className="text-sm text-slate-900">{profile?.phone || profile?.number || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Position / Title</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="recruiter.position"
                      value={formData.recruiter.position}
                      onChange={handleInputChange}
                      placeholder="e.g., Senior HR Manager"
                      className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#3b4bb8] focus:ring-2 focus:ring-[#3b4bb8]/10"
                    />
                  ) : (
                    <p className="text-sm text-slate-900">{profile?.recruiter?.position || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Department</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="recruiter.department"
                      value={formData.recruiter.department}
                      onChange={handleInputChange}
                      placeholder="e.g., Human Resources"
                      className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#3b4bb8] focus:ring-2 focus:ring-[#3b4bb8]/10"
                    />
                  ) : (
                    <p className="text-sm text-slate-900">{profile?.recruiter?.department || '-'}</p>
                  )}
                </div>
              </div>
            </section>

            <section className="border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-base font-semibold tracking-tight text-slate-900">Company Information</h2>
              </div>

              <div className="space-y-5 p-5">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Company Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="e.g., Tech Corp Inc."
                      className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#3b4bb8] focus:ring-2 focus:ring-[#3b4bb8]/10"
                    />
                  ) : (
                    <p className="text-sm text-slate-900">{profile?.companyName || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g., Kathmandu, Nepal"
                      className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#3b4bb8] focus:ring-2 focus:ring-[#3b4bb8]/10"
                    />
                  ) : (
                    <p className="text-sm text-slate-900">{profile?.location || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Company Website</label>
                  {isEditing ? (
                    <input
                      type="url"
                      name="recruiter.companyWebsite"
                      value={formData.recruiter.companyWebsite}
                      onChange={handleInputChange}
                      placeholder="https://www.company.com"
                      className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#3b4bb8] focus:ring-2 focus:ring-[#3b4bb8]/10"
                    />
                  ) : (
                    <p className="text-sm text-slate-900 break-words">
                      {profile?.recruiter?.companyWebsite ? (
                        <a
                          href={profile.recruiter.companyWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-[#3b4bb8] hover:text-[#2e3a94]"
                        >
                          {profile.recruiter.companyWebsite}
                        </a>
                      ) : '-'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Company Description</label>
                  {isEditing ? (
                    <textarea
                      name="recruiter.companyDescription"
                      value={formData.recruiter.companyDescription}
                      onChange={handleInputChange}
                      rows={5}
                      placeholder="Tell candidates about your company..."
                      className="w-full resize-none border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#3b4bb8] focus:ring-2 focus:ring-[#3b4bb8]/10"
                    />
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {profile?.recruiter?.companyDescription || 'No description added.'}
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6 lg:col-span-4">
            <section className="border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-base font-semibold tracking-tight text-slate-900">Account Overview</h2>
              </div>

              <div className="space-y-4 p-5">
                <div className="flex items-center justify-between border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="text-sm text-slate-600">Member Since</span>
                  <span className="text-sm font-medium text-slate-900">
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short'
                        })
                      : '-'}
                  </span>
                </div>

                <div className="flex items-center justify-between border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="text-sm text-slate-600">Account Status</span>
                  <span className="inline-flex border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                    Active
                  </span>
                </div>

                <div className="flex items-center justify-between border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="text-sm text-slate-600">Recruiter Type</span>
                  <span className="text-sm font-medium text-slate-900">Employer</span>
                </div>
              </div>
            </section>

            <section className="border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-base font-semibold tracking-tight text-slate-900">Security</h2>
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
                  className="w-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Change Password
                </button>
              </div>
            </section>

            <section className="border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-base font-semibold tracking-tight text-slate-900">Need Help?</h2>
              </div>

              <div className="p-5">
                <p className="mb-4 text-sm leading-6 text-slate-600">
                  Contact our support team if you have questions about managing your recruiter account.
                </p>
                <a
                  href="mailto:support@lakshya.com"
                  className="text-sm font-medium text-[#3b4bb8] hover:text-[#2e3a94]"
                >
                  Contact Support
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowPasswordModal(false)} />
          <div className="relative z-10 w-full max-w-md border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Change Password</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#3b4bb8] focus:ring-2 focus:ring-[#3b4bb8]/10"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#3b4bb8] focus:ring-2 focus:ring-[#3b4bb8]/10"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#3b4bb8] focus:ring-2 focus:ring-[#3b4bb8]/10"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
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

export default RecruiterProfile;