import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Application } from '../../services';
import type { Job } from '../../services/job-service';
import { getCategoryMeta } from '../../constants/jobCategories';
import { getPreviewText } from '../../utils/richText';
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
  applied: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300',
  shortlisted: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  interview: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  offer: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300',
  hired: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  withdrawn: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
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
  const saveJobMutation = useSaveJob();
  const removeSavedJobMutation = useRemoveSavedJob();

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300';
    if (score >= 75) return 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
  };

  const salaryDisplay = formatSalary(job.salary, job.salaryVisible);
  const normalizedStatus = (applicationStatus || 'applied').toLowerCase();
  const hasApplicationHistory = !!applicationStatus || isApplied;
  const isWithdrawnApplication = normalizedStatus === 'withdrawn';
  const hasActiveApplication = hasApplicationHistory && !isWithdrawnApplication;
  const appliedBadgeClass = statusBadgeStyles[normalizedStatus] || statusBadgeStyles.applied;
  const appliedStatusLabel = statusLabels[normalizedStatus] || 'Applied';
  const skillsToShow = (job.skillsRequired?.length ? job.skillsRequired : job.skills) || [];

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
        to={`/job-seeker/jobs/${job._id}`}
        className={`block rounded-lg border p-4 transition-all hover:shadow-md ${
          hasActiveApplication
            ? 'border-green-300 ring-1 ring-green-200 bg-gradient-to-br from-green-50/50 via-white to-white dark:border-green-500/40 dark:ring-green-500/20 dark:from-green-500/10 dark:via-slate-900 dark:to-slate-900'
            : isWithdrawnApplication
              ? 'border-amber-300 ring-1 ring-amber-200 bg-gradient-to-br from-amber-50/50 via-white to-white dark:border-amber-500/40 dark:ring-amber-500/20 dark:from-amber-500/10 dark:via-slate-900 dark:to-slate-900'
              : 'border-gray-200 bg-white hover:border-blue-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/50'
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-300">{job.title}</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">{job.companyName}</p>
          </div>
          {showMatchScore && matchScore !== undefined && (
            <span className={`rounded-full px-2 py-1 text-sm ${getMatchScoreColor(matchScore)}`}>
              {matchScore}%
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">{job.location}</p>
        {hasApplicationHistory && (
          <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${appliedBadgeClass}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden="true"></span>
            {appliedStatusLabel}
          </span>
        )}
      </Link>
    );
  }

  return (
    <div
      className={`group overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md dark:bg-slate-900 ${
        hasActiveApplication
          ? 'border-green-300 ring-1 ring-green-200 bg-gradient-to-br from-green-50/40 via-white to-white dark:border-green-500/40 dark:ring-green-500/20 dark:from-green-500/10 dark:via-slate-900 dark:to-slate-900'
          : isWithdrawnApplication
            ? 'border-amber-300 ring-1 ring-amber-200 bg-gradient-to-br from-amber-50/40 via-white to-white dark:border-amber-500/40 dark:ring-amber-500/20 dark:from-amber-500/10 dark:via-slate-900 dark:to-slate-900'
            : 'border-slate-200 hover:border-blue-200 dark:border-slate-800 dark:hover:border-blue-500/40'
      }`}
    >
      <div className={`h-1 w-full ${hasActiveApplication ? 'bg-gradient-to-r from-green-500 to-emerald-500' : isWithdrawnApplication ? 'bg-gradient-to-r from-amber-500 to-yellow-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}></div>

      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 dark:border-blue-500/20 dark:from-blue-500/10 dark:to-indigo-500/10">
            <span className="text-lg font-bold text-blue-600 dark:text-blue-300">
              {job.companyName?.charAt(0) || 'C'}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-1 text-lg font-semibold leading-6 text-slate-900 transition group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-300">
              {job.title}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{job.companyName}</p>
          </div>

          <button
            type="button"
            onClick={handleToggleSave}
            title={isSaved ? 'Saved' : 'Save Job'}
            className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              isSaved
                ? 'border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-300 dark:hover:bg-yellow-500/20'
                : 'border-slate-300 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800'
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
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="line-clamp-1">{job.location}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            {postedTimeAgo && <span>Posted {postedTimeAgo}</span>}
            {job.remoteType && <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-slate-500 dark:bg-slate-800 dark:text-slate-300">{job.remoteType}</span>}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {hasApplicationHistory && (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${appliedBadgeClass}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden="true"></span>
              {appliedStatusLabel}
            </span>
          )}
          {job.jobType && (
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
              {job.jobType}
            </span>
          )}
          {job.experienceLevel && (
            <span className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">
              {job.experienceLevel}
            </span>
          )}
          {salaryDisplay && (
            <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
              {salaryDisplay}
            </span>
          )}
        </div>

        {skillsToShow.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {skillsToShow.slice(0, 3).map((skill, index) => (
              <span
                key={`${skill}-${index}`}
                className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-200"
              >
                {skill}
              </span>
            ))}
            {skillsToShow.length > 3 && (
              <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                +{skillsToShow.length - 3} more
              </span>
            )}
          </div>
        )}

        <p className="mt-4 line-clamp-2 text-sm leading-6 text-gray-600 dark:text-slate-300">
          {getPreviewText(job.description, 130)}
        </p>

        <div className="mt-6 space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3">
            {showMatchScore && matchScore !== undefined ? (
              <div className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getMatchScoreColor(matchScore)}`}>
                {matchScore}% Match
              </div>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500">No match score yet</span>
            )}

            {job.category && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                  getCategoryMeta(job.category).bgClass
                } ${
                  getCategoryMeta(job.category).colorClass
                } ${
                  getCategoryMeta(job.category).borderClass
                }`}
              >
                <span>{getCategoryMeta(job.category).icon}</span>
                <span>{job.category}</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {hasActiveApplication ? (
              <Link
                to="/job-seeker/my-applications"
                className="w-full rounded-xl border border-green-300 bg-green-50 px-4 py-2.5 text-center text-sm font-semibold text-green-700 transition hover:bg-green-100 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300 dark:hover:bg-green-500/20"
              >
                View Application
              </Link>
            ) : (
              <Link
                to={`/job-seeker/jobs/${job._id}`}
                className="w-full rounded-xl border border-green-500 px-4 py-2.5 text-center text-sm font-semibold text-green-700 transition hover:bg-green-50 dark:border-green-500/40 dark:text-green-300 dark:hover:bg-green-500/10"
              >
                {isWithdrawnApplication ? 'Reapply' : 'Apply Now'}
              </Link>
            )}

            <Link
              to={`/job-seeker/jobs/${job._id}`}
              className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
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
