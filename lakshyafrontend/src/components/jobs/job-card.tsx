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
  applied: 'bg-green-100 text-green-700',
  shortlisted: 'bg-blue-100 text-blue-700',
  interview: 'bg-purple-100 text-purple-700',
  rejected: 'bg-red-100 text-red-700',
  offer: 'bg-teal-100 text-teal-700',
  hired: 'bg-emerald-100 text-emerald-700',
  withdrawn: 'bg-amber-100 text-amber-800',
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
    if (score >= 90) return 'bg-green-100 text-green-700';
    if (score >= 75) return 'bg-blue-100 text-blue-700';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  };
  
  const salaryDisplay = formatSalary(job.salary, job.salaryVisible);
  const normalizedStatus = (applicationStatus || 'applied').toLowerCase();
  const hasApplicationHistory = !!applicationStatus || isApplied;
  const isWithdrawnApplication = normalizedStatus === 'withdrawn';
  const hasActiveApplication = hasApplicationHistory && !isWithdrawnApplication;
  const appliedBadgeClass = statusBadgeStyles[normalizedStatus] || 'bg-green-100 text-green-700';
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
    } catch (error) {
      toast.error('Failed to update saved jobs');
    }
  };

  if (variant === 'compact') {
    return (
      <Link
        to={`/job-seeker/jobs/${job._id}`}
        className={`block rounded-lg border p-4 hover:shadow-md transition-all ${
          hasActiveApplication
            ? 'bg-gradient-to-br from-green-50/50 via-white to-white border-green-300 ring-1 ring-green-200'
            : isWithdrawnApplication
            ? 'bg-gradient-to-br from-amber-50/50 via-white to-white border-amber-300 ring-1 ring-amber-200'
            : 'bg-white border-gray-200 hover:border-blue-200'
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 hover:text-indigo-600">{job.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{job.companyName}</p>
          </div>
          {showMatchScore && matchScore !== undefined && (
            <span className={`text-sm px-2 py-1 rounded-full ${getMatchScoreColor(matchScore)}`}>
              {matchScore}%
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-2">{job.location}</p>
        {hasApplicationHistory && (
          <span className={`inline-flex items-center gap-1.5 mt-3 rounded-full px-2.5 py-1 text-xs font-medium ${appliedBadgeClass}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden="true"></span>
            {appliedStatusLabel}
          </span>
        )}
      </Link>
    );
  }

  return (
    <div
      className={`group bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden ${
        hasActiveApplication
          ? 'border-green-300 ring-1 ring-green-200 bg-gradient-to-br from-green-50/40 via-white to-white'
          : isWithdrawnApplication
          ? 'border-amber-300 ring-1 ring-amber-200 bg-gradient-to-br from-amber-50/40 via-white to-white'
          : 'border-slate-200 hover:border-blue-200'
      }`}
    >
      {/* Decorative Top Accent Strip */}
      <div className={`h-1 w-full ${hasActiveApplication ? 'bg-gradient-to-r from-green-500 to-emerald-500' : isWithdrawnApplication ? 'bg-gradient-to-r from-amber-500 to-yellow-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}></div>
      
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center flex-shrink-0 border border-blue-100">
            <span className="text-blue-600 font-bold text-lg">
              {job.companyName?.charAt(0) || 'C'}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-slate-900 font-semibold text-lg leading-6 line-clamp-1 group-hover:text-blue-600 transition">
              {job.title}
            </h3>
            <p className="text-slate-500 text-sm mt-1">{job.companyName}</p>
          </div>

          <button
            type="button"
            onClick={handleToggleSave}
            title={isSaved ? 'Saved' : 'Save Job'}
            className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition shrink-0 ${
              isSaved
                ? 'border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100'
                : 'border-slate-300 text-slate-500 bg-white hover:bg-slate-50'
            }`}
          >
            {!isSaved && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h6a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            )}
            {isSaved && (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 5a2 2 0 012-2h6a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            )}
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>

        {/* Secondary Information */}
        <div className="mt-4 space-y-2.5">
          <div className="flex items-center gap-1.5 text-slate-500 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="line-clamp-1">{job.location}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            {postedTimeAgo && <span>Posted {postedTimeAgo}</span>}
            {job.remoteType && <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-500 px-2 py-0.5">{job.remoteType}</span>}
          </div>
        </div>

        {/* Status and Meta Badges */}
        <div className="mt-4 flex flex-wrap gap-2">
          {hasApplicationHistory && (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${appliedBadgeClass}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden="true"></span>
              {appliedStatusLabel}
            </span>
          )}
          {job.jobType && (
            <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-medium">
              {job.jobType}
            </span>
          )}
          {job.experienceLevel && (
            <span className="inline-flex items-center rounded-full bg-purple-50 text-purple-700 px-3 py-1 text-xs font-medium">
              {job.experienceLevel}
            </span>
          )}
          {salaryDisplay && (
            <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 px-3 py-1 text-xs font-medium">
              {salaryDisplay}
            </span>
          )}
        </div>

        {/* Skills */}
        {skillsToShow.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {skillsToShow.slice(0, 3).map((skill, index) => (
              <span
                key={`${skill}-${index}`}
                className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
              >
                {skill}
              </span>
            ))}
            {skillsToShow.length > 3 && (
              <span className="inline-flex items-center rounded-md bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500">
                +{skillsToShow.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2 mt-4 leading-6">
          {getPreviewText(job.description, 130)}
        </p>

        {/* Bottom Action Area */}
        <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between gap-3">
            {showMatchScore && matchScore !== undefined ? (
              <div className={`text-xs px-3 py-1.5 rounded-full font-semibold ${getMatchScoreColor(matchScore)}`}>
                {matchScore}% Match
              </div>
            ) : (
              <span className="text-xs text-slate-400">No match score yet</span>
            )}

            {job.category && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border ${
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {hasActiveApplication ? (
              <Link
                to="/job-seeker/my-applications"
                className="w-full text-center rounded-xl border border-green-300 bg-green-50 text-green-700 px-4 py-2.5 text-sm font-semibold hover:bg-green-100 transition"
              >
                View Application
              </Link>
            ) : (
              <Link
                to={`/job-seeker/jobs/${job._id}`}
                className="w-full text-center rounded-xl border border-green-500 text-green-700 px-4 py-2.5 text-sm font-semibold hover:bg-green-50 transition"
              >
                {isWithdrawnApplication ? 'Reapply' : 'Apply Now'}
              </Link>
            )}

            <Link
              to={`/job-seeker/jobs/${job._id}`}
              className="w-full text-center rounded-xl bg-blue-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-blue-700 transition"
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
