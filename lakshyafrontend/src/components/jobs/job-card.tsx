import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Application } from '../../services';
import type { Job } from '../../services/job-service';
import { getPreviewText } from '../../utils/richText';
import { getFileUrl, getInitials } from '../../utils/image-utils';
import { useAuth } from '../../context/auth-context';
import { useIsJobSaved, useSaveJob, useRemoveSavedJob } from '../../hooks';
import { toast } from 'react-toastify';

interface JobCardProps {
  job: Job;
  variant?: 'default' | 'compact';
  showMatchScore?: boolean;
  matchScore?: number;
  isApplied?: boolean;
  applicationStatus?: Application['status'];
}

const statusBadgeStyles: Record<string, string> = {
  applied: 'border border-[#E5E7EB] bg-[#F9FAFB] text-[#374151] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
  shortlisted: 'border border-[#E5E7EB] bg-[#F9FAFB] text-[#374151] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
  interview: 'border border-[#E5E7EB] bg-[#F9FAFB] text-[#374151] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
  rejected: 'border border-[#E5E7EB] bg-[#FEF2F2] text-[#991B1B] dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300',
  offer: 'border border-[#E5E7EB] bg-[#F9FAFB] text-[#374151] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
  hired: 'border border-[#E5E7EB] bg-[#F9FAFB] text-[#374151] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
  withdrawn: 'border border-[#E5E7EB] bg-[#F9FAFB] text-[#374151] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
};

const statusLabels: Record<string, string> = {
  applied: 'Applied',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  rejected: 'Rejected',
  offer: 'Offer',
  hired: 'Hired',
  withdrawn: 'Withdrawn',
};

const formatSalary = (salary: Job['salary'], salaryVisible?: boolean) => {
  if (!salary) return null;
  if (salaryVisible === false) return 'Negotiable';
  if (typeof salary === 'string') return salary;
  if (!salary.min && !salary.max) return null;
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: salary.currency || 'USD',
    maximumFractionDigits: 0,
  });
  return `${formatter.format(salary.min)} - ${formatter.format(salary.max)}`;
};

const JobCard: React.FC<JobCardProps> = ({
  job,
  variant = 'default',
  showMatchScore = false,
  matchScore,
  isApplied = false,
  applicationStatus,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSaved = useIsJobSaved(job._id);
  const isJobSeeker = user?.role === 'job_seeker';
  const detailsPath = isJobSeeker ? `/job-seeker/jobs/${job._id}` : `/jobs/${job._id}`;
  const applyPath = isJobSeeker ? `/job-seeker/jobs/${job._id}` : `/jobs/${job._id}?action=apply`;
  const saveJobMutation = useSaveJob();
  const removeSavedJobMutation = useRemoveSavedJob();

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'border border-[#E5E7EB] bg-[#EFF6FF] text-[#1D4ED8] dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300';
    return 'border border-[#E5E7EB] bg-[#F9FAFB] text-[#374151] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200';
  };

  const salaryDisplay = formatSalary(job.salary, job.salaryVisible);
  const normalizedStatus = (applicationStatus || 'applied').toLowerCase();
  const hasApplicationHistory = !!applicationStatus || isApplied;
  const isWithdrawnApplication = normalizedStatus === 'withdrawn';
  const hasActiveApplication = hasApplicationHistory && !isWithdrawnApplication;
  const appliedBadgeClass = statusBadgeStyles[normalizedStatus] || statusBadgeStyles.applied;
  const appliedStatusLabel = statusLabels[normalizedStatus] || 'Applied';
  const skillsToShow = (job.skillsRequired?.length ? job.skillsRequired : job.skills) || [];
  const recruiterName = job.recruiter?.name?.trim() || job.createdBy?.name?.trim() || 'Recruiter';
  const recruiterImage = job.recruiter?.profileImageUrl || job.recruiter?.profileImage || job.createdBy?.profileImageUrl || job.createdBy?.profileImage || null;
  const recruiterAvatarUrl = getFileUrl(recruiterImage);
  const [avatarFailed, setAvatarFailed] = React.useState(false);
  const baseTagClass = 'mb-[6px] mr-[6px] inline-flex items-center gap-1.5 border border-[#E5E7EB] bg-[#F9FAFB] px-2 py-1 text-[12px] font-medium text-[#374151] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200';
  const neutralTagClass = baseTagClass;
  const jobTypeTagClass = 'mb-[6px] mr-[6px] inline-flex items-center gap-1.5 border border-[#E5E7EB] bg-[#EFF6FF] px-2 py-1 text-[12px] font-medium text-[#1D4ED8] dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300';
  const salaryTagClass = 'mb-[6px] mr-[6px] inline-flex items-center gap-1.5 border border-[#E5E7EB] bg-[#F0FDF4] px-2 py-1 text-[12px] font-medium text-[#166534] dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300';

  React.useEffect(() => {
    setAvatarFailed(false);
  }, [recruiterImage]);

  const postedTimeAgo = React.useMemo(() => {
    if (!job.createdAt) return null;
    const createdAt = new Date(job.createdAt).getTime();
    if (Number.isNaN(createdAt)) return null;

    const diffMs = Date.now() - createdAt;
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${Math.max(minutes, 1)}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(months / 12);
    return `${years}y ago`;
  }, [job.createdAt]);

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!user) {
      const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`/login?redirect=${redirectUrl}`);
      return;
    }

    if (user.role !== 'job_seeker') {
      toast.error('Only job seekers can save jobs.');
      return;
    }

    try {
      if (isSaved) {
        await removeSavedJobMutation.mutateAsync(job._id);
        toast.success('Removed from saved jobs');
      } else {
        await saveJobMutation.mutateAsync(job._id);
        toast.success('Job saved successfully');
      }
    } catch {
      toast.error('Failed to update saved jobs');
    }
  };

  if (variant === 'compact') {
    return (
      <Link
        to={detailsPath}
        className="block border border-[#E5E7EB] bg-white dark:border-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:bg-slate-900 p-4 transition-colors hover:border-[#D1D5DB] dark:hover:border-slate-700"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-[16px] font-semibold text-[#111827] dark:text-slate-100 hover:text-[#2563EB]">{job.title}</h3>
            <p className="mt-1 text-[13px] font-normal text-[#6B7280] dark:text-slate-400">{job.companyName}</p>
          </div>
          {showMatchScore && matchScore !== undefined && (
            <span className={`mr-[6px] mb-[6px] px-2 py-1 text-[12px] font-medium ${getMatchScoreColor(matchScore)}`}>
              {matchScore}%
            </span>
          )}
        </div>
        <p className="mt-2 text-[13px] font-normal text-[#6B7280] dark:text-slate-400">{job.location}</p>
        {hasApplicationHistory && (
          <span className={`mt-3 inline-flex items-center gap-1.5 px-2 py-1 text-[12px] font-medium ${appliedBadgeClass}`}>
            <span className="h-1.5 w-1.5 bg-current opacity-80" aria-hidden="true"></span>
            {appliedStatusLabel}
          </span>
        )}
      </Link>
    );
  }

  return (
    <div
      className="group rounded-xl border border-[#E5E7EB] bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors hover:border-[#D1D5DB] dark:hover:border-slate-700"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 ring-1 ring-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:ring-slate-700">
            {recruiterAvatarUrl && !avatarFailed ? (
              <img
                src={recruiterAvatarUrl}
                alt={recruiterName}
                className="h-full w-full object-cover"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-200">
                {getInitials(recruiterName)}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="line-clamp-1 text-[16px] font-semibold leading-5 text-[#111827] dark:text-slate-100 transition group-hover:text-[#2563EB]">
              {job.title}
            </h3>
            <p className="line-clamp-1 text-[13px] font-medium text-[#374151] dark:text-slate-200">{job.companyName}</p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[#6B7280] dark:text-slate-400">
              <span className="line-clamp-1">{job.location}</span>
              {postedTimeAgo && <span>• Posted {postedTimeAgo}</span>}
              {job.jobType && <span>• {job.jobType}</span>}
            </div>
            <p className="text-[12px] font-medium text-slate-600 dark:text-slate-300">
              Posted by {recruiterName}
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleSave}
            title={isSaved ? 'Saved' : 'Save Job'}
            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center border transition-colors ${
              isSaved
                ? 'border-[#D1D5DB] bg-[#F9FAFB] text-[#374151] hover:bg-slate-100'
                : 'border-[#D1D5DB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#6B7280] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {!isSaved && (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h6a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            )}
            {isSaved && (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 5a2 2 0 012-2h6a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            )}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-[6px]">
          {hasApplicationHistory && (
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-[12px] font-medium ${appliedBadgeClass}`}>
              <span className="h-1.5 w-1.5 bg-current opacity-80" aria-hidden="true"></span>
              {appliedStatusLabel}
            </span>
          )}
          {job.jobType && (
            <span className={jobTypeTagClass}>
              {job.jobType}
            </span>
          )}
          {job.experienceLevel && (
            <span className={neutralTagClass}>
              {job.experienceLevel}
            </span>
          )}
          {job.remoteType && (
            <span className={neutralTagClass}>{job.remoteType}</span>
          )}
          {salaryDisplay && (
            <span className={salaryTagClass}>
              {salaryDisplay}
            </span>
          )}
        </div>

        {skillsToShow.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-[6px]">
            {skillsToShow.slice(0, 3).map((skill, index) => (
              <span
                key={`${skill}-${index}`}
                className={neutralTagClass}
              >
                {skill}
              </span>
            ))}
            {skillsToShow.length > 3 && (
              <span className={neutralTagClass}>
                +{skillsToShow.length - 3} more
              </span>
            )}
          </div>
        )}

        <p className="mt-3 line-clamp-2 text-[13px] font-normal leading-5 text-[#4B5563] dark:text-slate-300">
          {getPreviewText(job.description, 130)}
        </p>

        <div className="mt-4 space-y-2 border-t border-[#E5E7EB] dark:border-slate-800 pt-3">
          <div className="flex items-center justify-between gap-3">
            {showMatchScore && matchScore !== undefined ? (
              <div className={`px-2 py-1 text-[11px] font-medium ${getMatchScoreColor(matchScore)}`}>
                {matchScore}% Match
              </div>
            ) : (
              <span className="text-[11px] font-normal text-[#6B7280] dark:text-slate-400">No match score yet</span>
            )}

            {job.category && (
              <span className={neutralTagClass}>{job.category}</span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {hasActiveApplication ? (
              <Link
                to="/job-seeker/my-applications"
                className="w-full border border-[#2563EB] bg-white dark:bg-slate-900 px-3 py-2 text-center text-[13px] font-medium text-[#2563EB] dark:text-indigo-300 transition-colors hover:bg-blue-50 dark:hover:bg-indigo-500/10"
              >
                View Application
              </Link>
            ) : (
              <Link
                to={applyPath}
                className="w-full border border-[#2563EB] bg-white dark:bg-slate-900 px-3 py-2 text-center text-[13px] font-medium text-[#2563EB] dark:text-indigo-300 transition-colors hover:bg-blue-50 dark:hover:bg-indigo-500/10"
              >
                {isWithdrawnApplication ? 'Reapply' : 'Apply Now'}
              </Link>
            )}

            <Link
              to={detailsPath}
              className="w-full border border-[#2563EB] bg-[#2563EB] px-3 py-2 text-center text-[13px] font-medium text-white transition-colors hover:bg-blue-700"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
