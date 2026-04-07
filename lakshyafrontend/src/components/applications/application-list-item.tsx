import React from 'react';
import { Link } from 'react-router-dom';
import type { Application, Interview, Job } from '../../services';
import { getStatusLabel } from '../../utils/applicationStatus';
import { getFileUrl, getInitials } from '../../utils/image-utils';

interface ApplicationListItemProps {
  application: Application;
  job: Job | null;
  jobId?: string;
  isActive: boolean;
  isExpanded: boolean;
  hasInterviews: boolean;
  interviews: Interview[];
  canWithdraw: boolean;
  isJobInactive: boolean;
  hasMatchScore: boolean;
  matchScore?: number | null;
  statusClassName: string;
  appliedDateText: string;
  withdrawPending: boolean;
  onToggleActive: () => void;
  onToggleInterviews: () => void;
  onWithdraw: () => void;
  interviewDetails?: React.ReactNode;
}

const ApplicationListItem: React.FC<ApplicationListItemProps> = ({
  application,
  job,
  jobId,
  isActive,
  isExpanded,
  hasInterviews,
  interviews,
  canWithdraw,
  isJobInactive,
  hasMatchScore,
  matchScore,
  statusClassName,
  appliedDateText,
  withdrawPending,
  onToggleActive,
  onToggleInterviews,
  onWithdraw,
  interviewDetails,
}) => {
  const recruiter = job?.recruiter || {
    name: job?.createdBy?.name,
    profileImage: job?.createdBy?.profileImage,
    profileImageUrl: job?.createdBy?.profileImageUrl,
    title: job?.createdBy?.recruiter?.position || job?.createdBy?.jobSeeker?.title,
  };

  const recruiterName = recruiter?.name?.trim() || 'Recruiter';
  const recruiterImage = recruiter?.profileImageUrl || recruiter?.profileImage || null;
  const recruiterAvatarUrl = getFileUrl(recruiterImage);
  const [avatarFailed, setAvatarFailed] = React.useState(false);

  React.useEffect(() => {
    setAvatarFailed(false);
  }, [recruiterImage]);

  return (
    <div className="space-y-2">
      <div
        onClick={onToggleActive}
        className={`group relative cursor-pointer rounded-xl border px-4 py-3 transition-all duration-200 ${
          isActive
            ? 'border-indigo-200 bg-white shadow-sm ring-1 ring-indigo-100 dark:border-indigo-500/40 dark:bg-slate-900 dark:ring-indigo-500/20'
            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 ring-1 ring-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:ring-slate-700">
            {recruiterAvatarUrl && !avatarFailed ? (
              <img
                src={recruiterAvatarUrl}
                alt={recruiterName}
                className="h-full w-full object-cover"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-200">
                {getInitials(recruiterName)}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="line-clamp-1 text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                  {job?.title || 'Job Title'}
                </h3>
                <p className="mt-0.5 line-clamp-1 text-[13px] font-medium text-slate-700 dark:text-slate-300">
                  {job?.companyName || 'Company'}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-slate-500 dark:text-slate-400">
                  {job?.location && <span>{job.location}</span>}
                  <span>Applied {appliedDateText}</span>
                  <span>Posted by {recruiterName}</span>
                </p>
              </div>

              <span
                className={`inline-flex items-center px-2.5 py-1 text-[11px] font-medium ${statusClassName}`}
              >
                {getStatusLabel(application.status)}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {hasInterviews ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleInterviews();
                  }}
                  className="inline-flex items-center gap-1 border border-indigo-100 bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300"
                >
                  {interviews.length} Round{interviews.length > 1 ? 's' : ''}
                  <svg
                    className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              ) : (
                <span className="text-[11px] text-slate-400">No interviews</span>
              )}

              {hasMatchScore ? (
                <span className="inline-flex items-center border border-emerald-100 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300">
                  {matchScore}% Match
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">No match score</span>
              )}

              {isJobInactive && (
                <span className="inline-flex items-center border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700">
                  Job Removed
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            {job && jobId ? (
              <Link
                to={`/job-seeker/jobs/${jobId}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex h-8 items-center justify-center border border-slate-300 px-3 text-[12px] font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                View Job
              </Link>
            ) : (
              <span className="text-[11px] text-slate-400">N/A</span>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onWithdraw();
              }}
              disabled={!canWithdraw || withdrawPending}
              title={
                canWithdraw
                  ? 'Withdraw Application'
                  : 'Withdrawal is only allowed for applied or shortlisted applications'
              }
              className={`inline-flex h-8 items-center justify-center border px-3 text-[12px] font-medium transition-colors ${
                canWithdraw
                  ? 'border-red-300 text-red-600 hover:bg-red-50'
                  : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500'
              }`}
            >
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {isExpanded && hasInterviews && interviewDetails}
    </div>
  );
};

export default ApplicationListItem;
