import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout, LoadingSpinner, ScheduleInterviewModal } from '../../components';
import { ConfirmModal } from '../../components/ui';
import { useQuery } from '@tanstack/react-query';
import { 
  useShortlistCandidate, 
  useUpdateApplicationNotes,
  useUpdateRecruiterApplicationStatus,
  useUpdateInterviewOutcome
} from '../../hooks';
import axiosInstance from '../../services/axios-instance';
import { toast } from 'react-toastify';
import { getFileUrl, getInitials } from '../../Utils';
import type { Interview } from '../../services';
import { formatInterviewTimeRange, getInterviewDisplayStatusMeta, getInterviewOutcomeMeta, getInterviewOutcomeValue } from '../../utils/interview-status';

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
  jobId: string | { _id: string; title: string; interviewRoundsRequired?: number };
  status: string;
  isWithdrawn?: boolean;
  withdrawnAt?: string;
  notes: string;
  coverLetter?: string;
  createdAt: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  matchAnalyzedAt?: string;
  experienceYears: number;
  interviews?: Interview[];
}

const CandidateProfile: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();

  const [notes, setNotes] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showHireConfirm, setShowHireConfirm] = useState(false);
  const [interviewToEdit, setInterviewToEdit] = useState<Interview | undefined>(undefined);

  // Fetch application with candidate profile and match snapshot
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['recruiterApplication', applicationId],
    queryFn: async () => {
      console.log('ðŸ”„ [QUERY] Fetching application details for:', applicationId);
      const response = await axiosInstance.get(`/recruiter/applications/${applicationId}`);
      console.log('âœ… [QUERY] Fetched application. Notes length:', response.data?.data?.application?.notes?.length || 0);
      return response.data;
    },
    enabled: !!applicationId,
    staleTime: 0, // Always consider data stale - refetch on every access
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when reconnecting
  });

  const shortlistMutation = useShortlistCandidate();
  const updateNotesMutation = useUpdateApplicationNotes();
  const updateStatusMutation = useUpdateRecruiterApplicationStatus();
  const updateInterviewOutcomeMutation = useUpdateInterviewOutcome();

  const candidate: CandidateProfile | null = data?.data?.candidate || null;
  const application: ApplicationSnapshot | null = data?.data?.application || null;
  const signedResumeUrl = data?.signedResumeUrl; // If backend provides signed URLs
  const isWithdrawnApplication = application?.status === 'withdrawn' || application?.isWithdrawn;
  
  // Extract jobId for modal
  const jobId = typeof application?.jobId === 'string' 
    ? application.jobId 
    : application?.jobId?._id || '';
  
  // Normalize interviews array (handle backend field name variations)
  const rawInterviews = application?.interviews;
  const normalizedInterviews = React.useMemo(() => {
    if (!rawInterviews || !Array.isArray(rawInterviews)) {
      return [];
    }

    // Debug log to verify data structure
    console.log('ðŸ” [INTERVIEW DEBUG] Raw interviews from backend:', rawInterviews);

    return rawInterviews.map((interview, idx) => {
      const source = interview as {
        _id?: string | { toString?: () => string };
        id?: string | { toString?: () => string };
        roundNumber?: number;
        date?: string;
        scheduledAt?: string;
        startTime?: string;
        endTime?: string;
        time?: string;
        timezone?: string;
        mode?: 'online' | 'onsite' | 'phone';
        linkOrLocation?: string;
        locationOrLink?: string;
        link?: string;
        messageToCandidate?: string;
        message?: string;
        internalNotes?: string;
        internalNote?: string;
        outcome?: string;
        feedback?: string;
      };

      let normalizedId = '';
      if (source._id != null && typeof source._id === 'object' && typeof source._id.toString === 'function') {
        normalizedId = source._id.toString();
      } else if (source._id != null) {
        normalizedId = String(source._id);
      } else if (source.id != null && typeof source.id === 'object' && typeof source.id.toString === 'function') {
        normalizedId = source.id.toString();
      } else if (source.id != null) {
        normalizedId = String(source.id);
      }
      normalizedId = normalizedId.trim();

      // Normalize field names in case backend uses different keys
      const normalized: Interview = {
        _id: normalizedId || undefined,
        roundNumber: source.roundNumber || idx + 1,
        date: source.date || source.scheduledAt || '',
        startTime: source.startTime || source.time,
        endTime: source.endTime,
        time: source.time,
        timezone: source.timezone,
        mode: source.mode || 'online',
        linkOrLocation: source.linkOrLocation || source.locationOrLink || source.link,
        messageToCandidate: source.messageToCandidate || source.message,
        internalNotes: source.internalNotes || source.internalNote,
        outcome:
          source.outcome === 'pass' || source.outcome === 'passed'
            ? 'pass'
            : source.outcome === 'fail' || source.outcome === 'failed' || source.outcome === 'rejected'
              ? 'fail'
              : 'pending',
        feedback: source.feedback,
      };

      // Extra debug for _id and time fields
      if (!normalized._id) {
        console.warn(`â— [INTERVIEW NORMALIZATION] Missing _id for round ${normalized.roundNumber}:`, source);
      }
      console.log(`ðŸ” [INTERVIEW DEBUG] Round ${normalized.roundNumber}:`, {
        _id: normalized._id,
        date: normalized.date,
        startTime: normalized.startTime,
        endTime: normalized.endTime,
        outcome: normalized.outcome,
        hasInternalNotes: !!normalized.internalNotes,
        internalNotesLength: normalized.internalNotes?.length || 0,
        hasMessage: !!normalized.messageToCandidate
      });

      return normalized;
    });
  }, [rawInterviews]);

  // Compute interview rounds progress
  const interviewProgress = React.useMemo(() => {
    if (!application) return { 
      required: 2, 
      completed: 0, 
      scheduled: 0,
      eligible: false, 
      canScheduleNext: false,
      lastRound: null 
    };
    
    // Get required rounds from job (default to 2)
    const jobData = typeof application.jobId === 'object' ? application.jobId : null;
    const requiredRounds = jobData?.interviewRoundsRequired ?? 2;
    
    // Count scheduled and passed rounds
    const scheduledRounds = normalizedInterviews.length;
    const passedRounds = normalizedInterviews.filter(i => getInterviewOutcomeValue(i) === 'pass').length;
    
    // Get last interview round
    const lastRound = normalizedInterviews.length > 0 
      ? normalizedInterviews[normalizedInterviews.length - 1] 
      : null;
    
    // Eligible for hire if all required rounds are passed
    const eligible = passedRounds >= requiredRounds;
    
    // Can schedule next round ONLY if:
    // 1. Last round outcome is "pass" (strict gating)
    // 2. Not all required rounds are scheduled yet
    const canScheduleNext = 
      (!lastRound || getInterviewOutcomeValue(lastRound) === 'pass') && 
      scheduledRounds < requiredRounds;
    
    console.log('ðŸŽ¯ [INTERVIEW PROGRESS]', {
      requiredRounds,
      scheduledRounds,
      passedRounds,
      eligible,
      canScheduleNext,
      lastRoundOutcome: lastRound?.outcome,
      status: application.status
    });
    
    return { 
      required: requiredRounds, 
      completed: passedRounds,
      scheduled: scheduledRounds,
      eligible, 
      canScheduleNext,
      lastRound 
    };
  }, [application, normalizedInterviews]);

  // Extract avatar URL and initials
  const avatarUrl = candidate?.profileImageUrl ? getFileUrl(candidate.profileImageUrl) : null;
  const initials = candidate ? getInitials(candidate.fullName) : 'U';

  // Sync notes from server when not dirty (prevents overwriting user typing)
  useEffect(() => {
    if (!isDirty && application?.notes !== undefined) {
      console.log('ðŸ“ [SYNC] Syncing notes from server:', application.notes?.substring(0, 50) + (application.notes?.length > 50 ? '...' : ''));
      const timer = setTimeout(() => {
        setNotes(application.notes || '');
      }, 0);
      return () => clearTimeout(timer);
    } else if (isDirty) {
      console.log('âœï¸ [SYNC] Skipping sync - user is editing (dirty=true)');
    }
  }, [application?.notes, isDirty]);

  // Debug: Log when query data changes
  useEffect(() => {
    if (data) {
      console.log('ðŸ” [QUERY] Query data updated. Notes:', data?.data?.application?.notes?.substring(0, 50));
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

  const handleReject = async () => {
    if (!application?._id) {
      toast.error('Application not found');
      return;
    }

    if (!window.confirm('Are you sure you want to reject this candidate?')) {
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({
        applicationId: application._id,
        status: 'rejected',
      });
      toast.success('Candidate rejected');
    } catch {
      toast.error('Failed to reject candidate');
    }
  };

  const handleHire = async () => {
    if (!application?._id) {
      toast.error('Application not found');
      return;
    }

    if (!interviewProgress.eligible) {
      toast.error(`Candidate must pass all ${interviewProgress.required} interview rounds before hiring`);
      return;
    }

    // Open confirmation modal instead of browser confirm
    setShowHireConfirm(true);
  };

  const confirmHire = async () => {
    if (!application?._id) return;

    try {
      await updateStatusMutation.mutateAsync({
        applicationId: application._id,
        status: 'hired',
      });
      toast.success('Candidate marked as hired!');
      setShowHireConfirm(false);
    } catch {
      toast.error('Failed to mark as hired');
      // Keep modal open on error so user can retry
    }
  };

  const handleSaveNotes = async () => {
    if (!application?._id) {
      toast.error('Application not found');
      return;
    }

    try {
      console.log('ðŸ’¾ [SAVE] Attempting to save notes. Length:', notes.length, 'ApplicationId:', application._id);
      console.log('ðŸ’¾ [SAVE] Notes content:', notes.substring(0, 100) + (notes.length > 100 ? '...' : ''));
      
      const result = await updateNotesMutation.mutateAsync({
        applicationId: application._id,
        notes,
      });
      
      console.log('âœ… [SAVE] Save complete. Result:', result);
      setIsDirty(false); // Clear dirty flag after successful save
      toast.success('Notes saved successfully!');
    } catch (error) {
      console.error('âŒ [SAVE] Failed to save notes:', error);
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
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">Candidate not found</h2>
          <p className="app-body-text mb-4">The candidate profile you're looking for doesn't exist.</p>
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
            <div className="app-surface rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-24"></div>
              <div className="px-6 pb-6">
                <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-10">
                  <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-full border-4 border-white shadow-lg overflow-hidden">
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
                    <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">{candidate.fullName}</h1>
                    <p className="app-body-text">{candidate.jobSeeker?.title || 'Job Seeker'}</p>
                    {application && (
                      <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                        application.status === 'shortlisted' 
                          ? 'bg-green-100 text-green-700'
                          : application.status === 'interview'
                          ? 'bg-blue-100 text-blue-700'
                          : application.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : application.status === 'withdrawn'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300'
                      }`}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </span>
                    )}
                    {isWithdrawnApplication && (
                      <p className="text-xs text-amber-700 mt-2">
                        Withdrawn {application?.withdrawnAt ? new Date(application.withdrawnAt).toLocaleDateString() : 'by candidate'}
                      </p>
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
                        className="app-secondary-button text-sm font-medium"
                      >
                        Download Resume
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="app-surface rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Contact Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Email</p>
                    <p className="font-medium text-gray-900 dark:text-slate-100">{candidate.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Phone</p>
                    <p className="font-medium text-gray-900 dark:text-slate-100">{candidate.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Preferred Location</p>
                    <p className="font-medium text-gray-900 dark:text-slate-100">{candidate.jobSeeker?.preferredLocation || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Expected Salary</p>
                    <p className="font-medium text-gray-900 dark:text-slate-100">{candidate.jobSeeker?.expectedSalary || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="app-surface rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">About</h2>
              <p className="text-gray-600 dark:text-slate-300 whitespace-pre-wrap">
                {candidate.jobSeeker?.bio || 'No bio provided.'}
              </p>
            </div>

            {/* Skills */}
            <div className="app-surface rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Skills</h2>
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
                  <p className="text-gray-500 dark:text-slate-400">No skills listed.</p>
                )}
              </div>
            </div>

            {/* Experience */}
            <div className="app-surface rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Experience</h2>
              <p className="text-gray-600 dark:text-slate-300 whitespace-pre-wrap">
                {candidate.jobSeeker?.experience || 'No experience information provided.'}
              </p>
            </div>

            {/* Education */}
            <div className="app-surface rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Education</h2>
              <p className="text-gray-600 dark:text-slate-300 whitespace-pre-wrap">
                {candidate.jobSeeker?.education || 'No education information provided.'}
              </p>
            </div>
          </div>

          {/* Sidebar - AI Analysis */}
          <div className="space-y-6">
            {/* AI Match Score */}
            <div className="app-surface rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">AI Match Analysis</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">Snapshot at time of application</p>
              
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
                    <p className="text-gray-600 dark:text-slate-300 mt-2">Overall Match Score</p>
                    {matchAnalyzedAt && (
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                        Analyzed {new Date(matchAnalyzedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Matched Skills */}
                  {matchedSkills.length > 0 && (
                    <div className="mb-4">
                      <h3 className="app-label mb-2 text-sm font-medium">
                        Matched Skills ({matchedSkills.length})
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {matchedSkills.slice(0, 10).map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium"
                          >
                            âœ“ {skill}
                          </span>
                        ))}
                        {matchedSkills.length > 10 && (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 rounded-full text-xs">
                            +{matchedSkills.length - 10} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Missing Skills */}
                  {missingSkills.length > 0 && (
                    <div>
                      <h3 className="app-label mb-2 text-sm font-medium">
                        Missing Skills ({missingSkills.length})
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {missingSkills.slice(0, 8).map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium"
                          >
                            âœ— {skill}
                          </span>
                        ))}
                        {missingSkills.length > 8 && (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 rounded-full text-xs">
                            +{missingSkills.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-slate-400 text-sm">No analysis snapshot available</p>
                  <p className="text-gray-400 dark:text-slate-500 text-xs mt-1">
                    The candidate applied before match analysis was enabled
                  </p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="app-surface rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Quick Actions</h2>
              {application ? (
                <div className="space-y-3">
                  {isWithdrawnApplication && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800 font-medium">Candidate withdrew this application.</p>
                      <p className="text-xs text-amber-700 mt-1">Recruiter actions are disabled for withdrawn applications.</p>
                    </div>
                  )}

                  {/* Interview Progress Indicator */}
                  {application.status === 'interview' && !isWithdrawnApplication && (
                    <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-indigo-900">Interview Progress</span>
                        <span className="text-xs font-semibold text-indigo-600">
                          {interviewProgress.completed} of {interviewProgress.required} rounds passed
                        </span>
                      </div>
                      <div className="w-full bg-indigo-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(interviewProgress.completed / interviewProgress.required) * 100}%` }}
                        />
                      </div>
                      {interviewProgress.eligible ? (
                        <p className="text-xs text-green-600 font-medium mt-2">
                          âœ“ All rounds completed - Eligible for hire
                        </p>
                      ) : (
                        <p className="app-body-text mt-2 text-xs">
                          {interviewProgress.required - interviewProgress.completed} more round{(interviewProgress.required - interviewProgress.completed) > 1 ? 's' : ''} needed
                        </p>
                      )}
                    </div>
                  )}

                  {/* APPLIED status actions */}
                  {application.status === 'applied' && !isWithdrawnApplication && (
                    <>
                      <button
                        onClick={handleShortlist}
                        disabled={shortlistMutation.isPending}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Shortlist Candidate
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={updateStatusMutation.isPending}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {/* SHORTLISTED status actions */}
                  {application.status === 'shortlisted' && !isWithdrawnApplication && (
                    <>
                      <button
                        onClick={() => {
                          setInterviewToEdit(undefined);
                          setShowScheduleModal(true);
                        }}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Schedule Interview (Round 1 of {interviewProgress.required})
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={updateStatusMutation.isPending}
                        className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {/* INTERVIEW status actions */}
                  {application.status === 'interview' && !isWithdrawnApplication && (
                    <>
                      {/* Interview Progress Indicator */}
                      <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2 text-sm">
                          <span className="font-medium text-indigo-900">Interview Progress</span>
                          <span className="text-indigo-700 font-semibold">
                            {interviewProgress.completed} of {interviewProgress.required} rounds passed
                          </span>
                        </div>
                        <div className="w-full bg-indigo-200 rounded-full h-2 mb-2">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(interviewProgress.completed / interviewProgress.required) * 100}%` }}
                          />
                        </div>
                        {interviewProgress.eligible ? (
                          <p className="text-xs text-green-700 font-medium flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            All rounds completed - Eligible for hire
                          </p>
                        ) : (
                          <p className="app-body-text text-xs">
                            {interviewProgress.required - interviewProgress.completed} more round{interviewProgress.required - interviewProgress.completed > 1 ? 's' : ''} needed
                          </p>
                        )}
                      </div>
                      
                      {/* Show HIRE button if all rounds passed */}
                      {interviewProgress.eligible ? (
                        <button
                          onClick={handleHire}
                          disabled={updateStatusMutation.isPending}
                          className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {updateStatusMutation.isPending ? 'Processing...' : 'Hire Candidate'}
                        </button>
                      ) : interviewProgress.canScheduleNext ? (
                        /* Show SCHEDULE NEXT ROUND only if last round passed AND more rounds needed */
                        <button
                          onClick={() => {
                            setInterviewToEdit(undefined);
                            setShowScheduleModal(true);
                          }}
                          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Schedule Next Round ({interviewProgress.scheduled + 1} of {interviewProgress.required})
                        </button>
                      ) : (
                        /* Show waiting message if last round not yet passed */
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-sm text-amber-800 font-medium flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Waiting for Round {interviewProgress.scheduled} outcome
                          </p>
                          <p className="text-xs text-amber-700 mt-1">
                            Mark the current round as Pass to schedule the next round
                          </p>
                        </div>
                      )}
                      <button
                        onClick={handleReject}
                        disabled={updateStatusMutation.isPending}
                        className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {/* REJECTED/HIRED status (read-only) */}
                  {(application.status === 'rejected' || application.status === 'hired' || application.status === 'withdrawn') && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 dark:text-slate-400">
                        Status: <span className="font-medium capitalize">{application.status}</span>
                      </p>
                      {application.status === 'hired' && (
                        <p className="text-xs text-green-600 font-medium mt-1">
                          âœ“ Candidate successfully hired after {interviewProgress.completed} interview rounds
                        </p>
                      )}
                    </div>
                  )}

                  {/* Common actions */}
                  <a
                    href={`mailto:${candidate?.email}`}
                    className="app-secondary-button block w-full font-medium text-center"
                  >
                    Send Message
                  </a>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-slate-400 text-sm">Application not found. Quick actions are not available.</p>
              )}
            </div>

            {/* Interview Schedule */}
            {normalizedInterviews.length > 0 && (
              <div className="app-surface rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
                  Interview Schedule
                  <span className="ml-2 text-sm text-gray-500 dark:text-slate-400 font-normal">({normalizedInterviews.length} round{normalizedInterviews.length > 1 ? 's' : ''})</span>
                </h2>
                <div className="space-y-3">
                  {(() => {
                    // Find the latest actionable round: highest roundNumber where 
                    // displayStatus === 'completed' && outcome === 'pending'
                    let latestActionableRound: Interview | null = null;
                    let latestRoundNumber = -1;

                    normalizedInterviews.forEach((interview: Interview) => {
                      const displayStatus = getInterviewDisplayStatusMeta(interview);
                      const outcomeMeta = getInterviewOutcomeMeta(interview);
                      
                      if (displayStatus.value === 'completed' && outcomeMeta.value === 'pending') {
                        const roundNum = interview.roundNumber ?? 0;
                        if (roundNum > latestRoundNumber) {
                          latestRoundNumber = roundNum;
                          latestActionableRound = interview;
                        }
                      }
                    });

                    const actionableRound = latestActionableRound as Interview | null;
                    console.log('[INTERVIEW ACTIONABLE ROUND]', {
                      latestActionableRoundNumber: actionableRound?.roundNumber ?? null,
                      latestActionableRoundId: actionableRound?._id ?? null,
                      totalRounds: normalizedInterviews.length
                    });

                    return normalizedInterviews.map((interview: Interview) => {
                      // Raw interview snapshot for debugging
                      console.log('[INTERVIEW RAW]', { roundNumber: interview.roundNumber, raw: interview });

                      const displayStatus = getInterviewDisplayStatusMeta(interview);
                      const outcomeMeta = getInterviewOutcomeMeta(interview);
                      const timeRange = formatInterviewTimeRange(interview);
                      const interviewId = (interview._id ?? '').toString().trim();
                      const canEditOrReschedule =
                        displayStatus.value !== 'completed' && outcomeMeta.value === 'pending';
                      
                      // Decision buttons only for the latest actionable round (safety + UX)
                      const isLatestActionable = latestActionableRound && 
                        interview._id === latestActionableRound._id;
                      const canMarkOutcome = isLatestActionable && !!interview._id;

                      console.log('[INTERVIEW CARD DEBUG]', {
                        roundNumber: interview.roundNumber,
                        interviewId,
                        displayStatusValue: displayStatus.value,
                        displayStatusLabel: displayStatus.label,
                        outcomeValue: outcomeMeta.value,
                        outcomeLabel: outcomeMeta.label,
                        canEditOrReschedule,
                        isLatestActionable,
                        canMarkOutcome,
                      });

                    return (
                    <div key={interview._id || `round-${interview.roundNumber}`} className="border border-gray-200 dark:border-slate-800 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                            Round {interview.roundNumber}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${outcomeMeta.colorClass}`}>
                            {outcomeMeta.label}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${displayStatus.colorClass}`}>
                            {displayStatus.label}
                          </span>
                        </div>
                        <span className="px-2 py-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 rounded text-xs capitalize">
                          {interview.mode}
                        </span>
                      </div>
                      <div className="app-body-text space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>
                            {new Date(interview.date).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                            {timeRange && ` at ${timeRange}`}
                            {interview.timezone && ` (${interview.timezone})`}
                          </span>
                        </div>
                        {interview.linkOrLocation && (
                          <div className="flex items-start gap-2 mt-1">
                            <svg className="w-4 h-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            <span className="break-words">{interview.linkOrLocation}</span>
                          </div>
                        )}
                        {interview.messageToCandidate && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                            <p className="font-medium text-blue-900 mb-1">Message to Candidate:</p>
                            <p className="text-blue-700">{interview.messageToCandidate}</p>
                          </div>
                        )}
                        {interview.internalNotes && (
                          <div className="mt-2 p-2 bg-amber-50 rounded text-xs">
                            <p className="font-medium text-amber-900 mb-1">Internal Notes (Private):</p>
                            <p className="text-amber-700">{interview.internalNotes}</p>
                          </div>
                        )}
                        
                        {/* Action buttons based on interview status */}
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-800">
                          {canEditOrReschedule && interview._id && (
                            <div className="space-y-2">
                              {/* Edit/Reschedule Button - Only for scheduled interviews */}
                              <button
                                onClick={() => {
                                  setInterviewToEdit(interview);
                                  setShowScheduleModal(true);
                                }}
                                className="w-full px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit / Reschedule
                              </button>
                            </div>
                          )}

                          {canMarkOutcome && (
                            <div className="space-y-2">
                              <p className="text-xs text-gray-500 dark:text-slate-400">Interview session completed. Record result to continue workflow.</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={async () => {
                                    if (!applicationId) return;
                                    try {
                                      let idToUse = interviewId;
                                      if (!idToUse) {
                                        console.log('[INTERVIEW ACTION] Missing interviewId - refetching application before action');
                                        const res = await refetch();
                                        idToUse = (res?.data?.data?.application?.interviews || [])
                                          .find((it: any) => it.roundNumber === interview.roundNumber)?._id;
                                      }

                                      if (!idToUse) {
                                        toast.error('Interview identifier not yet available. Please refresh the page.');
                                        return;
                                      }

                                      await updateInterviewOutcomeMutation.mutateAsync({
                                        applicationId,
                                        interviewId: idToUse,
                                        outcome: 'pass'
                                      });
                                      toast.success(`Round ${interview.roundNumber} marked as PASS`);
                                    } catch (error) {
                                      const backendMessage = (error as {
                                        response?: { data?: { message?: string } };
                                        message?: string;
                                      })?.response?.data?.message;
                                      toast.error(backendMessage || 'Failed to update interview outcome');
                                    }
                                  }}
                                  disabled={updateInterviewOutcomeMutation.isPending}
                                  className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Mark as Passed
                                </button>
                                <button
                                  onClick={async () => {
                                    if (!applicationId) return;
                                    try {
                                      let idToUse = interviewId;
                                      if (!idToUse) {
                                        console.log('[INTERVIEW ACTION] Missing interviewId - refetching application before action');
                                        const res = await refetch();
                                        idToUse = (res?.data?.data?.application?.interviews || [])
                                          .find((it: any) => it.roundNumber === interview.roundNumber)?._id;
                                      }

                                      if (!idToUse) {
                                        toast.error('Interview identifier not yet available. Please refresh the page.');
                                        return;
                                      }

                                      await updateInterviewOutcomeMutation.mutateAsync({
                                        applicationId,
                                        interviewId: idToUse,
                                        outcome: 'fail'
                                      });
                                      toast.success(`Round ${interview.roundNumber} marked as FAIL`);
                                    } catch (error) {
                                      const backendMessage = (error as {
                                        response?: { data?: { message?: string } };
                                        message?: string;
                                      })?.response?.data?.message;
                                      toast.error(backendMessage || 'Failed to update interview outcome');
                                    }
                                  }}
                                  disabled={updateInterviewOutcomeMutation.isPending}
                                  className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  Mark as Rejected
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    );
                    });
                  })()}</div>
              </div>
            )}

            {/* Notes */}
            <div className="app-surface rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Recruiter Notes</h2>
              {application ? (
                <>
                  <textarea
                    value={notes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder="Add private notes about this candidate..."
                    rows={4}
                    className="app-input resize-none"
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
                <p className="text-gray-500 dark:text-slate-400 text-sm">Application not found. Notes are not available.</p>
              )}
            </div>
          </div>
        </div>

        {/* Schedule Interview Modal */}
        {showScheduleModal && application && (
          <ScheduleInterviewModal
            applicationId={application._id}
            jobId={jobId}
            currentInterviews={normalizedInterviews}
            candidateName={candidate?.fullName || 'Candidate'}
            onClose={() => {
              setShowScheduleModal(false);
              setInterviewToEdit(undefined);
            }}
            interviewToEdit={interviewToEdit}
            isEditMode={!!interviewToEdit}
          />
        )}

        {/* Hire Confirmation Modal */}
        <ConfirmModal
          isOpen={showHireConfirm}
          onClose={() => setShowHireConfirm(false)}
          onConfirm={confirmHire}
          title="Confirm Hire"
          message={`Are you sure you want to hire ${
            candidate?.fullName ?? 'this candidate'
          }? This will mark the application as successfully completed.`}
          confirmText="Hire Candidate"
          cancelText="Cancel"
          confirmButtonClass="bg-emerald-600 hover:bg-emerald-700 text-white"
          isLoading={updateStatusMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
};

export default CandidateProfile;



