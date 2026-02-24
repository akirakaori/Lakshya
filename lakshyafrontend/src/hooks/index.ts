// Job hooks
export { 
  useJobs, 
  useJob, 
  useMyJobs, 
  useCreateJob, 
  useUpdateJob, 
  useDeleteJob,
  useSoftDeleteJob,
  useAdminSoftDeleteJob,
  useAdminEditJob,
  useToggleJobStatus,
  jobKeys
} from './use-jobs';

// Application hooks
export { 
  useMyApplications, 
  useJobApplications, 
  useApplication, 
  useApplyForJob, 
  useUpdateApplicationStatus, 
  useWithdrawApplication,
  useHasApplied,
  useApplicationByJobAndCandidate,
  useShortlistCandidate,
  useScheduleInterview,
  useScheduleInterviewRound,
  useUpdateInterviewRound,
  useUpdateApplicationNotes,
  useRecruiterJobApplications,
  useUpdateRecruiterApplicationStatus,
  useBulkUpdateApplicationStatus,
  useUpdateInterviewOutcome,
  applicationKeys 
} from './use-applications';

// Profile hooks
export { 
  useProfile, 
  useUpdateProfile, 
  useUploadResume, 
  useChangePassword,
  useUploadProfileImage,
  useAutofillProfile,
  profileKeys 
} from './use-profile';

// Resume parse status hooks
export {
  useResumeParseStatus,
  useResumeParsePolling,
  type ResumeParseStatus,
  type ResumeParseStatusResponse
} from './use-resume-parse-status';

// Edit mode hook
export { useEditMode } from './use-edit-mode';

// Auth hooks
export { 
  useLogin, 
  useRegister, 
  useForgotPassword, 
  useResetPassword, 
  useLogout 
} from './use-auth';

// Job match hooks
export { useJobMatch, jobMatchKeys } from './use-job-match';
export { useJobMatchScores, jobMatchScoresKeys } from './use-job-match-scores';
export { useAnalyzeJobMatch } from './use-analyze-job-match';
