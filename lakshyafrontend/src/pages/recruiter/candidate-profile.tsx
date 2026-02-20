import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout, LoadingSpinner } from '../../components';
import { useQuery } from '@tanstack/react-query';
import { 
  useShortlistCandidate, 
  useScheduleInterview, 
  useUpdateApplicationNotes 
} from '../../hooks';
import axiosInstance from '../../services/axios-instance';
import { toast } from 'react-toastify';
import { getFileUrl, getInitials } from '../../utils';

interface CandidateProfile {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  profileImageUrl?: string;
  jobSeeker?: {
    title?: string;
    bio?: string;
    skills?: string[];
    experience?: string;
    education?: string;
    preferredLocation?: string;
    expectedSalary?: string;
    resumeUrl?: string;
  };
  createdAt: string;
}

interface ApplicationSnapshot {
  _id: string;
  status: string;
  notes: string;
  coverLetter?: string;
  createdAt: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  matchAnalyzedAt?: string;
  experienceYears: number;
}

const CandidateProfile: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();

  const [notes, setNotes] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Fetch application with candidate profile and match snapshot
  const { data, isLoading } = useQuery({
    queryKey: ['recruiterApplication', applicationId],
    queryFn: async () => {
      console.log('🔄 [QUERY] Fetching application details for:', applicationId);
      const response = await axiosInstance.get(`/recruiter/applications/${applicationId}`);
      console.log('✅ [QUERY] Fetched application. Notes length:', response.data?.data?.application?.notes?.length || 0);
      return response.data;
    },
    enabled: !!applicationId,
    staleTime: 0, // Always consider data stale - refetch on every access
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when reconnecting
  });

  const shortlistMutation = useShortlistCandidate();
  const interviewMutation = useScheduleInterview();
  const updateNotesMutation = useUpdateApplicationNotes();

  const candidate: CandidateProfile | null = data?.data?.candidate || null;
  const application: ApplicationSnapshot | null = data?.data?.application || null;
  const signedResumeUrl = data?.signedResumeUrl; // If backend provides signed URLs

  // Extract avatar URL and initials
  const avatarUrl = candidate?.profileImageUrl ? getFileUrl(candidate.profileImageUrl) : null;
  const initials = candidate ? getInitials(candidate.fullName) : 'U';

  // Sync notes from server when not dirty (prevents overwriting user typing)
  useEffect(() => {
    if (!isDirty && application?.notes !== undefined) {
      console.log('📝 [SYNC] Syncing notes from server:', application.notes?.substring(0, 50) + (application.notes?.length > 50 ? '...' : ''));
      setNotes(application.notes || '');
    } else if (isDirty) {
      console.log('✏️ [SYNC] Skipping sync - user is editing (dirty=true)');
    }
  }, [application?.notes, isDirty]);

  // Debug: Log when query data changes
  useEffect(() => {
    if (data) {
      console.log('🔍 [QUERY] Query data updated. Notes:', data?.data?.application?.notes?.substring(0, 50));
    }
  }, [data]);

  const handleShortlist = async () => {
    if (!application?._id) {
      toast.error('Application not found');
      return;
    }

    try {
      await shortlistMutation.mutateAsync(application._id);
      toast.success('Candidate shortlisted successfully!');
    } catch {
      toast.error('Failed to shortlist candidate');
    }
  };

  const handleScheduleInterview = async () => {
    if (!application?._id) {
      toast.error('Application not found');
      return;
    }

    try {
      await interviewMutation.mutateAsync({
        applicationId: application._id,
        interviewData: { mode: 'virtual' },
      });
      toast.success('Interview scheduled successfully!');
    } catch {
      toast.error('Failed to schedule interview');
    }
  };

  const handleSaveNotes = async () => {
    if (!application?._id) {
      toast.error('Application not found');
      return;
    }

    try {
      console.log('💾 [SAVE] Attempting to save notes. Length:', notes.length, 'ApplicationId:', application._id);
      console.log('💾 [SAVE] Notes content:', notes.substring(0, 100) + (notes.length > 100 ? '...' : ''));
      
      const result = await updateNotesMutation.mutateAsync({
        applicationId: application._id,
        notes,
      });
      
      console.log('✅ [SAVE] Save complete. Result:', result);
      setIsDirty(false); // Clear dirty flag after successful save
      toast.success('Notes saved successfully!');
    } catch (error) {
      console.error('❌ [SAVE] Failed to save notes:', error);
      toast.error('Failed to save notes');
    }
  };

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes);
    setIsDirty(true); // Mark as dirty when user types
  };

  // Use REAL match snapshot data (frozen at apply time)
  const matchScore = application?.matchScore || 0;
  const matchedSkills = application?.matchedSkills || [];
  const missingSkills = application?.missingSkills || [];
  const matchAnalyzedAt = application?.matchAnalyzedAt;

  if (isLoading) {
    return (
      <DashboardLayout variant="recruiter" title="Candidate Profile">
        <LoadingSpinner text="Loading candidate profile..." />
      </DashboardLayout>
    );
  }

  if (!candidate) {
    return (
      <DashboardLayout variant="recruiter" title="Candidate Profile">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Candidate not found</h2>
          <p className="text-gray-600 mb-4">The candidate profile you're looking for doesn't exist.</p>
          <Link
            to="/recruiter/manage-jobs"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Back to Jobs
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout variant="recruiter" title="Candidate Profile">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-6"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Profile */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-24"></div>
              <div className="px-6 pb-6">
                <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-10">
                  <div className="w-20 h-20 bg-white rounded-full border-4 border-white shadow-lg overflow-hidden">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={candidate.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-2xl font-bold text-indigo-600">
                          {initials}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h1 className="text-xl font-bold text-gray-900">{candidate.fullName}</h1>
                    <p className="text-gray-600">{candidate.jobSeeker?.title || 'Job Seeker'}</p>
                    {application && (
                      <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                        application.status === 'shortlisted' 
                          ? 'bg-green-100 text-green-700'
                          : application.status === 'interview'
                          ? 'bg-blue-100 text-blue-700'
                          : application.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`mailto:${candidate.email}`}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                    >
                      Contact
                    </a>
                    {candidate.jobSeeker?.resumeUrl && (
                      <a
                        href={signedResumeUrl || getFileUrl(candidate.jobSeeker.resumeUrl) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
                      >
                        Download Resume
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{candidate.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">{candidate.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Preferred Location</p>
                    <p className="font-medium text-gray-900">{candidate.jobSeeker?.preferredLocation || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Expected Salary</p>
                    <p className="font-medium text-gray-900">{candidate.jobSeeker?.expectedSalary || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
              <p className="text-gray-600 whitespace-pre-wrap">
                {candidate.jobSeeker?.bio || 'No bio provided.'}
              </p>
            </div>

            {/* Skills */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {candidate.jobSeeker?.skills?.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
                {(!candidate.jobSeeker?.skills || candidate.jobSeeker.skills.length === 0) && (
                  <p className="text-gray-500">No skills listed.</p>
                )}
              </div>
            </div>

            {/* Experience */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Experience</h2>
              <p className="text-gray-600 whitespace-pre-wrap">
                {candidate.jobSeeker?.experience || 'No experience information provided.'}
              </p>
            </div>

            {/* Education */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Education</h2>
              <p className="text-gray-600 whitespace-pre-wrap">
                {candidate.jobSeeker?.education || 'No education information provided.'}
              </p>
            </div>
          </div>

          {/* Sidebar - AI Analysis */}
          <div className="space-y-6">
            {/* AI Match Score */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">AI Match Analysis</h2>
              <p className="text-xs text-gray-500 mb-4">Snapshot at time of application</p>
              
              {matchScore > 0 ? (
                <>
                  <div className="text-center mb-6">
                    <div className="relative w-32 h-32 mx-auto">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="#e5e7eb"
                          strokeWidth="8"
                          fill="none"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="#4f46e5"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${(matchScore / 100) * 352} 352`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold text-indigo-600">{matchScore}%</span>
                      </div>
                    </div>
                    <p className="text-gray-600 mt-2">Overall Match Score</p>
                    {matchAnalyzedAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        Analyzed {new Date(matchAnalyzedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Matched Skills */}
                  {matchedSkills.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        Matched Skills ({matchedSkills.length})
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {matchedSkills.slice(0, 10).map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium"
                          >
                            ✓ {skill}
                          </span>
                        ))}
                        {matchedSkills.length > 10 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                            +{matchedSkills.length - 10} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Missing Skills */}
                  {missingSkills.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        Missing Skills ({missingSkills.length})
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {missingSkills.slice(0, 8).map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium"
                          >
                            ✗ {skill}
                          </span>
                        ))}
                        {missingSkills.length > 8 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                            +{missingSkills.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">No analysis snapshot available</p>
                  <p className="text-gray-400 text-xs mt-1">
                    The candidate applied before match analysis was enabled
                  </p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              {application ? (
                <div className="space-y-3">
                  <button
                    onClick={handleShortlist}
                    disabled={shortlistMutation.isPending || application.status === 'shortlisted'}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {application.status === 'shortlisted' ? 'Already Shortlisted' : 'Shortlist Candidate'}
                  </button>
                  <button
                    onClick={handleScheduleInterview}
                    disabled={interviewMutation.isPending || application.status === 'interview'}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {application.status === 'interview' ? 'Interview Scheduled' : 'Schedule Interview'}
                  </button>
                  <a
                    href={`mailto:${candidate.email}`}
                    className="block w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-center"
                  >
                    Send Message
                  </a>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Application not found. Quick actions are not available.</p>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recruiter Notes</h2>
              {application ? (
                <>
                  <textarea
                    value={notes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder="Add private notes about this candidate..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={handleSaveNotes}
                      disabled={updateNotesMutation.isPending || !isDirty}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updateNotesMutation.isPending ? 'Saving...' : 'Save Notes'}
                    </button>
                    {isDirty && (
                      <span className="text-xs text-orange-600 font-medium">Unsaved changes</span>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-sm">Application not found. Notes are not available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CandidateProfile;
