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
import {
  formatInterviewTimeRange,
  getInterviewDisplayStatusMeta,
  getInterviewOutcomeMeta,
  getInterviewOutcomeValue
} from '../../utils/interview-status';

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
  hasMatchAnalysis?: boolean;
  analysisStatus?: 'analyzed' | 'not_analyzed';
  experienceYears: number;
  interviews?: Interview[];
}

const baseCardClass = 'rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900';
const sectionCardClass = `${baseCardClass} p-6`;
const sectionHeadingClass = 'text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400';
const bodyTextClass = 'text-sm leading-6 text-slate-600 dark:text-slate-400';
const subtleLabelClass = 'text-xs font-medium uppercase tracking-[0.06em] text-slate-400';

const getApplicationStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'shortlisted':
      return 'border border-violet-200 bg-violet-50 text-violet-700';
    case 'interview':
      return 'border border-blue-200 bg-blue-50 text-blue-700';
    case 'rejected':
      return 'border border-red-200 bg-red-50 text-red-700';
    case 'withdrawn':
      return 'border border-amber-200 bg-amber-50 text-amber-800';
    case 'hired':
      return 'border border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'applied':
    default:
      return 'border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300';
  }
};

const getPrimaryButtonClass = (disabled?: boolean) =>
  `inline-flex items-center justify-center rounded-md border border-[#3b4bb8] bg-[#3b4bb8] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2e3a94] ${
    disabled ? 'cursor-not-allowed opacity-50' : ''
  }`;

const getSecondaryButtonClass = (disabled?: boolean) =>
  `inline-flex items-center justify-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
    disabled ? 'cursor-not-allowed opacity-50' : ''
  }`;

const getDangerButtonClass = (disabled?: boolean) =>
  `inline-flex items-center justify-center rounded-md border border-red-200 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 ${
    disabled ? 'cursor-not-allowed opacity-50' : ''
  }`;

const getSuccessButtonClass = (disabled?: boolean) =>
  `inline-flex items-center justify-center rounded-md border border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 ${
    disabled ? 'cursor-not-allowed opacity-50' : ''
  }`;

const CandidateProfile: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();

  const [notes, setNotes] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showHireConfirm, setShowHireConfirm] = useState(false);
  const [interviewToEdit, setInterviewToEdit] = useState<Interview | undefined>(undefined);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['recruiterApplication', applicationId],
    queryFn: async () => {
      console.log('🔄 [QUERY] Fetching application details for:', applicationId);
      const response = await axiosInstance.get(`/recruiter/applications/${applicationId}`);
      console.log('✅ [QUERY] Fetched application. Notes length:', response.data?.data?.application?.notes?.length || 0);
      return response.data;
    },
    enabled: !!applicationId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const shortlistMutation = useShortlistCandidate();
  const updateNotesMutation = useUpdateApplicationNotes();
  const updateStatusMutation = useUpdateRecruiterApplicationStatus();
  const updateInterviewOutcomeMutation = useUpdateInterviewOutcome();

  const candidate: CandidateProfile | null = data?.data?.candidate || null;
  const application: ApplicationSnapshot | null = data?.data?.application || null;
  const signedResumeUrl = data?.signedResumeUrl;
  const isWithdrawnApplication = application?.status === 'withdrawn' || application?.isWithdrawn;

  const jobId =
    typeof application?.jobId === 'string'
      ? application.jobId
      : application?.jobId?._id || '';

  const rawInterviews = application?.interviews;
  const normalizedInterviews = React.useMemo(() => {
    if (!rawInterviews || !Array.isArray(rawInterviews)) {
      return [];
    }

    console.log('🔍 [INTERVIEW DEBUG] Raw interviews from backend:', rawInterviews);

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

      if (!normalized._id) {
        console.warn(`❗ [INTERVIEW NORMALIZATION] Missing _id for round ${normalized.roundNumber}:`, source);
      }

      console.log(`🔍 [INTERVIEW DEBUG] Round ${normalized.roundNumber}:`, {
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

  const interviewProgress = React.useMemo(() => {
    if (!application) {
      return {
        required: 2,
        completed: 0,
        scheduled: 0,
        eligible: false,
        canScheduleNext: false,
        lastRound: null
      };
    }

    const jobData = typeof application.jobId === 'object' ? application.jobId : null;
    const requiredRounds = jobData?.interviewRoundsRequired ?? 2;

    const scheduledRounds = normalizedInterviews.length;
    const passedRounds = normalizedInterviews.filter(i => getInterviewOutcomeValue(i) === 'pass').length;

    const lastRound = normalizedInterviews.length > 0
      ? normalizedInterviews[normalizedInterviews.length - 1]
      : null;

    const eligible = passedRounds >= requiredRounds;

    const canScheduleNext =
      (!lastRound || getInterviewOutcomeValue(lastRound) === 'pass') &&
      scheduledRounds < requiredRounds;

    console.log('🎯 [INTERVIEW PROGRESS]', {
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

  const avatarUrl = candidate?.profileImageUrl ? getFileUrl(candidate.profileImageUrl) : null;
  const initials = candidate ? getInitials(candidate.fullName) : 'U';

  useEffect(() => {
    if (!isDirty && application?.notes !== undefined) {
      console.log('📝 [SYNC] Syncing notes from server:', application.notes?.substring(0, 50) + (application.notes?.length > 50 ? '...' : ''));
      const timer = setTimeout(() => {
        setNotes(application.notes || '');
      }, 0);
      return () => clearTimeout(timer);
    } else if (isDirty) {
      console.log('✏️ [SYNC] Skipping sync - user is editing (dirty=true)');
    }
  }, [application?.notes, isDirty]);

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

    console.log('[HIRE FLOW][UI] Hire button clicked:', {
      applicationId: application._id,
      currentStatus: application.status,
      candidateId: candidate?._id,
      candidateName: candidate?.fullName,
      interviewProgress,
    });

    if (!interviewProgress.eligible) {
      toast.error(`Candidate must pass all ${interviewProgress.required} interview rounds before hiring`);
      return;
    }

    setShowHireConfirm(true);
  };

  const confirmHire = async () => {
    if (!application?._id) return;

    try {
      const payload = {
        applicationId: application._id,
        status: 'hired',
      } as const;

      console.log('[HIRE FLOW][UI] Confirming hire with mutation payload:', payload);

      const result = await updateStatusMutation.mutateAsync(payload);
      console.log('[HIRE FLOW][UI] Hire mutation response:', result);
      toast.success('Candidate marked as hired!');
      setShowHireConfirm(false);
    } catch (error) {
      console.error('[HIRE FLOW][UI] Hire mutation failed:', error);
      toast.error('Failed to mark as hired');
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
      setIsDirty(false);
      toast.success('Notes saved successfully!');
    } catch (error) {
      console.error('❌ [SAVE] Failed to save notes:', error);
      toast.error('Failed to save notes');
    }
  };

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes);
    setIsDirty(true);
  };

  const matchScore = typeof application?.matchScore === 'number' ? application.matchScore : 0;
  const matchedSkills = application?.matchedSkills || [];
  const missingSkills = application?.missingSkills || [];
  const matchAnalyzedAt = application?.matchAnalyzedAt;
  const isAnalyzed = application?.analysisStatus === 'analyzed' || application?.hasMatchAnalysis === true;

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
        <div className="py-12 text-center">
          <h2 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">Candidate not found</h2>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">The candidate profile you're looking for doesn't exist.</p>
          <Link
            to="/recruiter/manage-jobs"
            className="font-medium text-[#3b4bb8] hover:text-[#2e3a94]"
          >
            Back to Jobs
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout variant="recruiter" title="Candidate Profile">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => window.history.back()}
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-[#3b4bb8] hover:text-[#2e3a94]"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.9fr)_320px]">
          <div className="space-y-6">
            <div className={`${baseCardClass} overflow-hidden`}>
              <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-6 py-4">
                <p className={sectionHeadingClass}>Candidate Profile</p>
              </div>

              <div className="px-6 py-6">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={candidate.fullName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-800">
                          <span className="text-xl font-semibold text-slate-700 dark:text-slate-300">{initials}</span>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                        {candidate.fullName}
                      </h1>
                      <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
                        {candidate.jobSeeker?.title || 'Job Seeker'}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        {application && (
                          <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.05em] ${getApplicationStatusBadgeClass(application.status)}`}>
                            {application.status}
                          </span>
                        )}
                        {candidate.jobSeeker?.preferredLocation && (
                          <span>{candidate.jobSeeker.preferredLocation}</span>
                        )}
                      </div>

                      {isWithdrawnApplication && (
                        <p className="mt-2 text-xs font-medium text-amber-700">
                          Withdrawn {application?.withdrawnAt ? new Date(application.withdrawnAt).toLocaleDateString() : 'by candidate'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {candidate.jobSeeker?.resumeUrl && (
                      <a
                        href={signedResumeUrl || getFileUrl(candidate.jobSeeker.resumeUrl) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={getSecondaryButtonClass()}
                      >
                        Download Resume
                      </a>
                    )}
                    <a
                      href={`mailto:${candidate.email}`}
                      className={getPrimaryButtonClass()}
                    >
                      Contact
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className={sectionCardClass}>
              <h2 className={sectionHeadingClass}>Contact Information</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {[
                  {
                    label: 'Email',
                    value: candidate.email,
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    )
                  },
                  {
                    label: 'Phone',
                    value: candidate.phone || 'Not provided',
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    )
                  },
                  {
                    label: 'Preferred Location',
                    value: candidate.jobSeeker?.preferredLocation || 'Not specified',
                    icon: (
                      <>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </>
                    )
                  },
                  {
                    label: 'Expected Salary',
                    value: candidate.jobSeeker?.expectedSalary || 'Not specified',
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    )
                  }
                ].map((item) => (
                  <div key={item.label} className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/60 px-4 py-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {item.icon}
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className={subtleLabelClass}>{item.label}</p>
                        <p className="mt-1 break-words text-sm font-medium text-slate-900 dark:text-slate-100">{item.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={sectionCardClass}>
              <h2 className={sectionHeadingClass}>Professional Summary</h2>
              <p className={`mt-4 whitespace-pre-wrap ${bodyTextClass}`}>
                {candidate.jobSeeker?.bio || 'No bio provided.'}
              </p>
            </div>

            <div className={sectionCardClass}>
              <h2 className={sectionHeadingClass}>Skills</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {candidate.jobSeeker?.skills?.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    {skill}
                  </span>
                ))}
                {(!candidate.jobSeeker?.skills || candidate.jobSeeker.skills.length === 0) && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No skills listed.</p>
                )}
              </div>
            </div>

            <div className={sectionCardClass}>
              <h2 className={sectionHeadingClass}>Experience</h2>
              {candidate.jobSeeker?.experience ? (
                <div className="mt-4 space-y-3">
                  <div className="relative pl-6 before:absolute before:left-0 before:top-0 before:h-full before:w-[2px] before:bg-slate-200">
                    <div className="absolute -left-[5px] top-1 h-3 w-3 rounded-full border-2 border-[#3b4bb8] bg-white dark:bg-slate-900"></div>
                    <p className={`whitespace-pre-wrap ${bodyTextClass}`}>
                      {candidate.jobSeeker.experience}
                    </p>
                  </div>
                </div>
              ) : (
                <p className={`mt-4 italic ${bodyTextClass}`}>No experience information provided.</p>
              )}
            </div>

            <div className={sectionCardClass}>
              <h2 className={sectionHeadingClass}>Education</h2>
              {candidate.jobSeeker?.education ? (
                <div className="mt-4 space-y-3">
                  <div className="relative pl-6 before:absolute before:left-0 before:top-0 before:h-full before:w-[2px] before:bg-slate-200">
                    <div className="absolute -left-[5px] top-1 h-3 w-3 rounded-full border-2 border-[#3b4bb8] bg-white dark:bg-slate-900"></div>
                    <p className={`whitespace-pre-wrap ${bodyTextClass}`}>
                      {candidate.jobSeeker.education}
                    </p>
                  </div>
                </div>
              ) : (
                <p className={`mt-4 italic ${bodyTextClass}`}>No education information provided.</p>
              )}
            </div>

            <div className={sectionCardClass}>
              <h2 className={sectionHeadingClass}>Recruiter Notes</h2>
              {application ? (
                <>
                  <textarea
                    value={notes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder="Add private feedback about the candidate..."
                    rows={5}
                    className="mt-4 w-full resize-none rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 outline-none transition-colors placeholder:text-slate-400 focus:border-[#3b4bb8]"
                  />
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      onClick={handleSaveNotes}
                      disabled={updateNotesMutation.isPending || !isDirty}
                      className={getPrimaryButtonClass(updateNotesMutation.isPending || !isDirty)}
                    >
                      {updateNotesMutation.isPending ? 'Saving...' : 'Save Notes'}
                    </button>
                    {isDirty && (
                      <span className="text-xs font-medium text-amber-600">Unsaved changes</span>
                    )}
                  </div>
                </>
              ) : (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Application not found. Notes are not available.</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className={sectionCardClass}>
              <h2 className={sectionHeadingClass}>AI Match Analysis</h2>
              <p className="mt-2 text-xs text-slate-400">Snapshot at time of application</p>

              {isAnalyzed ? (
                <>
                  <div className="mt-5 text-center">
                    <div className="relative mx-auto h-32 w-32">
                      <svg className="h-32 w-32 -rotate-90 transform">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="#e2e8f0"
                          strokeWidth="8"
                          fill="none"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="#3b4bb8"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${(matchScore / 100) * 352} 352`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-semibold text-slate-900 dark:text-slate-100">{matchScore}%</span>
                      </div>
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">Overall Match Score</p>
                    {matchAnalyzedAt && (
                      <p className="mt-1 text-xs text-slate-400">
                        Analyzed {new Date(matchAnalyzedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {matchedSkills.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Matched Skills ({matchedSkills.length})
                      </h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {matchedSkills.slice(0, 10).map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                          >
                            {skill}
                          </span>
                        ))}
                        {matchedSkills.length > 10 && (
                          <span className="inline-flex items-center rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400">
                            +{matchedSkills.length - 10} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {missingSkills.length > 0 && (
                    <div className="mt-5">
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Missing Skills ({missingSkills.length})
                      </h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {missingSkills.slice(0, 8).map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700"
                          >
                            {skill}
                          </span>
                        ))}
                        {missingSkills.length > 8 && (
                          <span className="inline-flex items-center rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400">
                            +{missingSkills.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">No analysis snapshot available</p>
                  <p className="mt-1 text-xs text-slate-400">
                    The candidate applied before match analysis was enabled
                  </p>
                </div>
              )}
            </div>

            <div className={sectionCardClass}>
              <h2 className={sectionHeadingClass}>Quick Actions</h2>
              {application ? (
                <div className="mt-4 space-y-3">
                  {isWithdrawnApplication && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="text-sm font-medium text-amber-800">Candidate withdrew this application.</p>
                      <p className="mt-1 text-xs text-amber-700">Recruiter actions are disabled for withdrawn applications.</p>
                    </div>
                  )}

                  {application.status === 'interview' && !isWithdrawnApplication && (
                    <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-4">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-blue-900">Interview Progress</span>
                        <span className="font-semibold text-blue-700">
                          {interviewProgress.completed} of {interviewProgress.required} passed
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-blue-100">
                        <div
                          className="h-2 rounded-full bg-[#3b4bb8] transition-all duration-300"
                          style={{ width: `${(interviewProgress.completed / interviewProgress.required) * 100}%` }}
                        />
                      </div>
                      {interviewProgress.eligible ? (
                        <p className="mt-2 text-xs font-medium text-emerald-700">
                          All rounds completed - Eligible for hire
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                          {interviewProgress.required - interviewProgress.completed} more round{interviewProgress.required - interviewProgress.completed > 1 ? 's' : ''} needed
                        </p>
                      )}
                    </div>
                  )}

                  {application.status === 'applied' && !isWithdrawnApplication && (
                    <>
                      <button
                        onClick={handleShortlist}
                        disabled={shortlistMutation.isPending}
                        className={`w-full ${getPrimaryButtonClass(shortlistMutation.isPending)}`}
                      >
                        <span className="mr-2">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        Shortlist Candidate
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={updateStatusMutation.isPending}
                        className={`w-full ${getDangerButtonClass(updateStatusMutation.isPending)}`}
                      >
                        Reject Candidate
                      </button>
                    </>
                  )}

                  {application.status === 'shortlisted' && !isWithdrawnApplication && (
                    <>
                      <button
                        onClick={() => {
                          setInterviewToEdit(undefined);
                          setShowScheduleModal(true);
                        }}
                        className={`w-full ${getPrimaryButtonClass()}`}
                      >
                        <span className="mr-2">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </span>
                        Schedule Interview (Round 1 of {interviewProgress.required})
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={updateStatusMutation.isPending}
                        className={`w-full ${getDangerButtonClass(updateStatusMutation.isPending)}`}
                      >
                        Reject Candidate
                      </button>
                    </>
                  )}

                  {application.status === 'interview' && !isWithdrawnApplication && (
                    <>
                      {interviewProgress.eligible ? (
                        <button
                          onClick={handleHire}
                          disabled={updateStatusMutation.isPending}
                          className={`w-full ${getSuccessButtonClass(updateStatusMutation.isPending)}`}
                        >
                          <span className="mr-2">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </span>
                          {updateStatusMutation.isPending ? 'Processing...' : 'Hire Candidate'}
                        </button>
                      ) : interviewProgress.canScheduleNext ? (
                        <button
                          onClick={() => {
                            setInterviewToEdit(undefined);
                            setShowScheduleModal(true);
                          }}
                          className={`w-full ${getPrimaryButtonClass()}`}
                        >
                          <span className="mr-2">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </span>
                          Schedule Next Round ({interviewProgress.scheduled + 1} of {interviewProgress.required})
                        </button>
                      ) : (
                        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
                          <p className="text-sm font-medium text-amber-800">Waiting for Round {interviewProgress.scheduled} outcome</p>
                          <p className="mt-1 text-xs text-amber-700">
                            Mark the current round as Pass to schedule the next round
                          </p>
                        </div>
                      )}
                      <button
                        onClick={handleReject}
                        disabled={updateStatusMutation.isPending}
                        className={`w-full ${getDangerButtonClass(updateStatusMutation.isPending)}`}
                      >
                        Reject Candidate
                      </button>
                    </>
                  )}

                  {(application.status === 'rejected' || application.status === 'hired' || application.status === 'withdrawn') && (
                    <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-4 py-4 text-center">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Status: <span className="font-medium capitalize text-slate-900 dark:text-slate-100">{application.status}</span>
                      </p>
                      {application.status === 'hired' && (
                        <p className="mt-1 text-xs font-medium text-emerald-700">
                          Candidate successfully hired after {interviewProgress.completed} interview rounds
                        </p>
                      )}
                    </div>
                  )}

                  <a
                    href={`mailto:${candidate?.email}`}
                    className={`block w-full text-center ${getSecondaryButtonClass()}`}
                  >
                    Send Message
                  </a>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Application not found. Quick actions are not available.</p>
              )}
            </div>

            {normalizedInterviews.length > 0 && (
              <div className={sectionCardClass}>
                <div className="flex items-center justify-between">
                  <h2 className={sectionHeadingClass}>Scheduled Interviews</h2>
                  <span className="text-xs text-slate-400">
                    {normalizedInterviews.length} round{normalizedInterviews.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {(() => {
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
                      console.log('[INTERVIEW RAW]', { roundNumber: interview.roundNumber, raw: interview });

                      const displayStatus = getInterviewDisplayStatusMeta(interview);
                      const outcomeMeta = getInterviewOutcomeMeta(interview);
                      const timeRange = formatInterviewTimeRange(interview);
                      const interviewId = (interview._id ?? '').toString().trim();
                      const canEditOrReschedule =
                        displayStatus.value !== 'completed' && outcomeMeta.value === 'pending';

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
                        <div
                          key={interview._id || `round-${interview.roundNumber}`}
                          className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/40 p-4"
                        >
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-700 dark:text-slate-300">
                                Round {interview.roundNumber}
                              </span>
                              <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-medium ${outcomeMeta.colorClass}`}>
                                {outcomeMeta.label}
                              </span>
                              <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-medium ${displayStatus.colorClass}`}>
                                {displayStatus.label}
                              </span>
                            </div>

                            <span className="inline-flex items-center rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-[11px] font-medium capitalize text-slate-600 dark:text-slate-400">
                              {interview.mode}
                            </span>
                          </div>

                          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-2">
                              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                              <div className="flex items-start gap-2">
                                <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                <span className="break-words">{interview.linkOrLocation}</span>
                              </div>
                            )}

                            {interview.messageToCandidate && (
                              <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.05em] text-blue-800">
                                  Message to Candidate
                                </p>
                                <p className="mt-1 text-xs leading-5 text-blue-700">{interview.messageToCandidate}</p>
                              </div>
                            )}

                            {interview.internalNotes && (
                              <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.05em] text-amber-900">
                                  Internal Notes
                                </p>
                                <p className="mt-1 text-xs leading-5 text-amber-700">{interview.internalNotes}</p>
                              </div>
                            )}

                            <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-3">
                              {canEditOrReschedule && interview._id && (
                                <div className="space-y-2">
                                  <button
                                    onClick={() => {
                                      setInterviewToEdit(interview);
                                      setShowScheduleModal(true);
                                    }}
                                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                                  >
                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit / Reschedule
                                  </button>
                                </div>
                              )}

                              {canMarkOutcome && (
                                <div className="space-y-2">
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Interview session completed. Record result to continue workflow.
                                  </p>
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
                                            feedback: { outcome: 'pass' }
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
                                      className="flex-1 rounded-md border border-emerald-600 bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
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
                                            feedback: { outcome: 'fail' }
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
                                      className="flex-1 rounded-md border border-red-200 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
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
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>

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