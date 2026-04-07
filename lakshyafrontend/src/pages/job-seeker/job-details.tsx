import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { DashboardLayout, LoadingSpinner, EmptyState, ErrorBoundary } from '../../components';
import { JobCard } from '../../components/jobs';
import JobMatchPanel from '../../components/jobs/JobMatchPanel';
import {
  useJob,
  useJobs,
  useApplyForJob,
  useJobMatch,
  useIsJobSaved,
  useSaveJob,
  useRemoveSavedJob,
  useMyApplications
} from '../../hooks';
import { useAuth } from '../../context/auth-context';
import { toast } from 'react-toastify';
import type { Job } from '../../services';
import { getCategoryMeta } from '../../constants/jobCategories';
import { ThemeToggle } from '../../components/ui';
import lakshyaLogo from '../../assets/lakhsya-logo.svg';
import DOMPurify from 'dompurify';
import { normalizeRichContent } from '../../utils/rich-text';
import { getStatusBadgeClass, getStatusLabel } from '../../utils/applicationStatus';

import type { Config as DOMPurifyConfig } from 'dompurify';

const DOMPURIFY_CONFIG: DOMPurifyConfig = {
  ALLOWED_TAGS: [
    'p', 'b', 'strong', 'i', 'em', 'u', 's',
    'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'br', 'a', 'blockquote', 'span',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
};

function renderRichContent(content: string | string[] | undefined): React.ReactNode {
  const html = normalizeRichContent(content as string | string[] | undefined);
  if (!html || html === '<p><br></p>') return null;
  return (
    <div
      className="prose prose-sm max-w-none prose-headings:mb-3 prose-headings:text-slate-900 prose-p:my-2 prose-p:text-slate-700 prose-ul:my-3 prose-ul:list-disc prose-ul:pl-5 prose-ol:my-3 prose-ol:list-decimal prose-ol:pl-5 prose-li:my-1 prose-li:text-slate-700 prose-strong:text-slate-900 prose-a:text-[#2563EB] dark:prose-headings:text-slate-100 dark:prose-p:text-slate-300 dark:prose-li:text-slate-300 dark:prose-strong:text-slate-100 dark:prose-a:text-blue-300"
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html, DOMPURIFY_CONFIG) }}
    />
  );
}

const formatSalary = (salary: Job['salary']) => {
  if (!salary) return null;
  if (typeof salary === 'string') return salary;
  if (!salary.min && !salary.max) return null;
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: salary.currency || 'USD',
    maximumFractionDigits: 0,
  });
  return `${formatter.format(salary.min)} - ${formatter.format(salary.max)}`;
};

const surfaceClass =
  'border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900';

const sectionTitleClass =
  'text-[15px] font-semibold tracking-tight text-slate-900 dark:text-slate-100';

const JobDetails: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const safeJobId = jobId ?? '';
  const [coverLetter, setCoverLetter] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const matchPanelRef = useRef<HTMLDivElement>(null);

  const { data: jobData, isLoading, error } = useJob(safeJobId);
  const { data: relatedJobsData } = useJobs({ limit: 4 });
  const applyMutation = useApplyForJob();
  const { user } = useAuth();
  const { data: myApplicationsData } = useMyApplications(
    { page: 1, limit: 200 },
    { enabled: !!user && user.role === 'job_seeker' }
  );
  const { data: matchData } = useJobMatch(jobId);
  const isSaved = useIsJobSaved(safeJobId);
  const saveJobMutation = useSaveJob();
  const removeSavedJobMutation = useRemoveSavedJob();

  const job = jobData?.data;
  const relatedJobs = relatedJobsData?.data?.filter((j: Job) => j._id !== safeJobId).slice(0, 4) || [];
  const currentApplication = myApplicationsData?.data?.find((app) => {
    if (!app?.jobId) return false;
    if (typeof app.jobId === 'string') return app.jobId === safeJobId;
    return app.jobId?._id === safeJobId;
  });

  const isWithdrawnApplication = currentApplication?.status === 'withdrawn' || currentApplication?.isWithdrawn;
  const withdrawnDateText = currentApplication?.withdrawnAt
    ? new Date(currentApplication.withdrawnAt).toLocaleDateString()
    : null;
  const activeApplicationStatus = !isWithdrawnApplication ? currentApplication?.status : null;

  const isJobSeeker = user?.role === 'job_seeker';
  const hasAnalysis = !!matchData?.data;
  const isAnalysisOutdated = matchData?.isOutdated || false;

  useEffect(() => {
    const action = searchParams.get('action');
    if (!action || !job) return;

    if (!user) {
      const currentPath = `/jobs/${jobId}?action=${action}`;
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`, { replace: true });
      return;
    }

    if (user.role !== 'job_seeker') {
      toast.error('Only job seekers can apply or analyze jobs.');
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
      return;
    }

    if (action === 'apply') {
      if (activeApplicationStatus) {
        toast.info(`You already have an active ${getStatusLabel(activeApplicationStatus).toLowerCase()} application for this job.`);
        searchParams.delete('action');
        setSearchParams(searchParams, { replace: true });
        return;
      }

      if (isWithdrawnApplication && (job.isDeleted || !job.isActive || job.status !== 'open')) {
        toast.info('This job is no longer open for reapplication.');
        searchParams.delete('action');
        setSearchParams(searchParams, { replace: true });
        return;
      }
    }

    if (action === 'apply') {
      setTimeout(() => {
        setShowApplyModal(true);
      }, 0);
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    } else if (action === 'analyze') {
      if (matchPanelRef.current) {
        matchPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setTimeout(() => {
        searchParams.delete('action');
        setSearchParams(searchParams, { replace: true });
      }, 1000);
    }
  }, [searchParams, job, user, jobId, navigate, setSearchParams, activeApplicationStatus, isWithdrawnApplication]);

  if (!jobId) {
    const content = (
      <EmptyState
        title="Invalid Job"
        description="The job link is invalid or incomplete."
        action={
          <Link
            to="/"
            className="inline-flex items-center justify-center border border-[#2563EB] bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
          >
            Back to Home
          </Link>
        }
      />
    );

    return user && user.role === 'job_seeker' ? (
      <DashboardLayout variant="job-seeker" title="Job Details">
        {content}
      </DashboardLayout>
    ) : (
      <div className="min-h-screen bg-slate-50 p-8 dark:bg-slate-950">{content}</div>
    );
  }

  const handleApply = async () => {
    if (!jobId) return;

    if (!hasAnalysis) {
      const confirmed = window.confirm(
        'You haven\'t analyzed your match for this job yet. We recommend analyzing first to see how well you match. Continue anyway?'
      );
      if (!confirmed) {
        setShowApplyModal(false);
        return;
      }
    } else if (isAnalysisOutdated) {
      const confirmed = window.confirm(
        'Your profile has changed since the last analysis. We recommend re-analyzing to see your updated match score. Continue anyway?'
      );
      if (!confirmed) {
        setShowApplyModal(false);
        return;
      }
    }

    try {
      await applyMutation.mutateAsync({
        jobId,
        data: { coverLetter: coverLetter || undefined }
      });
      toast.success('Application submitted successfully!');
      setShowApplyModal(false);
      setCoverLetter('');
    } catch (err: unknown) {
      const errorMessage =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to submit application';
      toast.error(errorMessage);
    }
  };

  const handleAnalyzeClick = () => {
    if (!user) {
      const redirectUrl = encodeURIComponent(`/jobs/${jobId}?action=analyze`);
      navigate(`/login?redirect=${redirectUrl}`);
      return;
    }

    if (user.role !== 'job_seeker') {
      toast.error('Only job seekers can analyze resume match.');
      return;
    }

    if (matchPanelRef.current) {
      matchPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleApplyClick = () => {
    if (!user) {
      const redirectUrl = encodeURIComponent(`/jobs/${jobId}?action=apply`);
      navigate(`/login?redirect=${redirectUrl}`);
      return;
    }

    if (user.role !== 'job_seeker') {
      toast.error('Only job seekers can apply for jobs.');
      return;
    }

    if (activeApplicationStatus) {
      toast.info(`You already have an active ${getStatusLabel(activeApplicationStatus).toLowerCase()} application for this job.`);
      return;
    }

    if (isWithdrawnApplication && (job?.isDeleted || !job?.isActive || job?.status !== 'open')) {
      toast.info('This job is no longer open for reapplication.');
      return;
    }

    setShowApplyModal(true);
  };

  const handleToggleSave = async () => {
    if (!safeJobId) return;

    if (!user) {
      const redirectUrl = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?redirect=${redirectUrl}`);
      return;
    }

    if (user.role !== 'job_seeker') {
      toast.error('Only job seekers can save jobs.');
      return;
    }

    try {
      if (isSaved) {
        await removeSavedJobMutation.mutateAsync(safeJobId);
        toast.success('Removed from saved jobs');
      } else {
        await saveJobMutation.mutateAsync(safeJobId);
        toast.success('Job saved successfully');
      }
    } catch {
      toast.error('Failed to update saved jobs');
    }
  };

  if (isLoading) {
    const loadingContent = <LoadingSpinner text="Loading job details..." />;
    return user && user.role === 'job_seeker' ? (
      <DashboardLayout variant="job-seeker" title="Job Details">
        {loadingContent}
      </DashboardLayout>
    ) : (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        {loadingContent}
      </div>
    );
  }

  if (error || !job) {
    const errorContent = (
      <EmptyState
        title="Job not found"
        description="The job you're looking for doesn't exist or has been removed."
        action={
          <Link
            to={user && user.role === 'job_seeker' ? '/job-seeker/browse-jobs' : '/'}
            className="inline-flex items-center justify-center border border-[#2563EB] bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
          >
            {user && user.role === 'job_seeker' ? 'Browse Jobs' : 'Back to Home'}
          </Link>
        }
      />
    );
    return user && user.role === 'job_seeker' ? (
      <DashboardLayout variant="job-seeker" title="Job Details">
        {errorContent}
      </DashboardLayout>
    ) : (
      <div className="min-h-screen bg-slate-50 p-8 dark:bg-slate-950">{errorContent}</div>
    );
  }

  const isJobInactive = job.isDeleted || !job.isActive;
  const isJobOpenForApply = !isJobInactive && job.status === 'open';
  const canReapply = isWithdrawnApplication && isJobOpenForApply;

  const jobDetailsContent = (
    <div className="mx-auto max-w-7xl">
      {isJobInactive && (
        <div className="mb-6 border border-amber-200 bg-amber-50 px-4 py-4 dark:border-amber-500/20 dark:bg-amber-500/10">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-300">This job is no longer active</h3>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                {job.isDeleted
                  ? 'This job post has been removed by the employer and is no longer accepting applications.'
                  : 'This job is currently inactive and not accepting new applications.'}
              </p>
            </div>
          </div>
        </div>
      )}

      <Link
        to={user && user.role === 'job_seeker' ? '/job-seeker/browse-jobs' : '/'}
        className="mb-5 inline-flex items-center text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
      >
        <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {user && user.role === 'job_seeker' ? 'Back to Jobs' : 'Back to Home'}
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-8">
          {/* Job Header */}
          <div className={`${surfaceClass} p-6`}>
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <h1 className="text-[28px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  {job.title}
                </h1>

                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{job.companyName}</span>
                  <span>•</span>
                  <span>{job.location}</span>
                  {formatSalary(job.salary) && (
                    <>
                      <span>•</span>
                      <span>{formatSalary(job.salary)}</span>
                    </>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {job.category && (
                    <span
                      className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs font-medium ${
                        getCategoryMeta(job.category).bgClass
                      } ${getCategoryMeta(job.category).colorClass} ${getCategoryMeta(job.category).borderClass}`}
                    >
                      <span>{getCategoryMeta(job.category).icon}</span>
                      <span>{job.category}</span>
                    </span>
                  )}

                  <span className="inline-flex items-center border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {job.jobType}
                  </span>

                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Posted {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                <span
                  className={`inline-flex items-center px-2.5 py-1 text-xs font-medium ${
                    job.status === 'open'
                      ? 'border border-green-200 bg-green-50 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {job.status === 'open' ? 'Active' : 'Closed'}
                </span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Job Type</p>
                <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{job.jobType}</p>
              </div>
              <div className="border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Location</p>
                <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{job.location}</p>
              </div>
              <div className="border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Salary</p>
                <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{formatSalary(job.salary) || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className={surfaceClass}>
            <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <h2 className={sectionTitleClass}>Job Description</h2>
            </div>
            <div className="p-5">{renderRichContent(job.description)}</div>
          </div>

          {/* Requirements */}
          {renderRichContent(job.requirements as unknown as string | string[] | undefined) && (
            <div className={surfaceClass}>
              <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                <h2 className={sectionTitleClass}>Requirements</h2>
              </div>
              <div className="p-5">
                {renderRichContent(job.requirements as unknown as string | string[] | undefined)}
              </div>
            </div>
          )}

          {/* Benefits */}
          {renderRichContent(job.benefits as unknown as string | string[] | undefined) && (
            <div className={surfaceClass}>
              <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                <h2 className={sectionTitleClass}>Benefits</h2>
              </div>
              <div className="p-5">
                {renderRichContent(job.benefits as unknown as string | string[] | undefined)}
              </div>
            </div>
          )}

          {/* Skills */}
          {job.skillsRequired && job.skillsRequired.length > 0 && (
            <div className={surfaceClass}>
              <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                <h2 className={sectionTitleClass}>Required Skills</h2>
              </div>
              <div className="p-5">
                <div className="flex flex-wrap gap-2">
                  {job.skillsRequired.map((skill: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className={surfaceClass}>
            <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                Take Action
              </h3>
            </div>

            <div className="p-5">
              {isJobInactive ? (
                <div className="text-center">
                  <div className="inline-flex items-center border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    This job is no longer available
                  </div>
                </div>
              ) : isWithdrawnApplication ? (
                <div className="text-center">
                  <div className="inline-flex items-center border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                    Withdrawn
                  </div>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {withdrawnDateText
                      ? `You withdrew your application on ${withdrawnDateText}.`
                      : 'You withdrew your application for this job.'}
                  </p>
                  {canReapply ? (
                    <>
                      <p className="mt-1 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        You can reapply because this job is still open.
                      </p>
                      <div className="mt-4 flex justify-center">
                        <button
                          onClick={handleApplyClick}
                          className="inline-flex items-center justify-center border border-[#2563EB] bg-[#2563EB] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
                        >
                          Reapply
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      This job is no longer open for reapplication.
                    </p>
                  )}
                </div>
              ) : activeApplicationStatus || applyMutation.isSuccess ? (
                <div className="text-center">
                  <div className={`inline-flex items-center px-4 py-2 text-sm font-medium ${getStatusBadgeClass(activeApplicationStatus || 'applied')}`}>
                    {getStatusLabel(activeApplicationStatus || 'applied')}
                  </div>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    You already have an active application for this job.
                  </p>
                  <div className="mt-4">
                    <Link
                      to="/job-seeker/my-applications"
                      className="inline-flex items-center justify-center border border-green-300 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-100 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300"
                    >
                      Track Application
                    </Link>
                  </div>
                </div>
              ) : job.status === 'closed' ? (
                <div className="text-center">
                  <div className="inline-flex items-center border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    This position is no longer accepting applications
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    onClick={handleApplyClick}
                    className="inline-flex items-center justify-center border border-[#2563EB] bg-[#2563EB] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
                  >
                    Apply Now
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleSave}
                    className={`inline-flex items-center justify-center gap-2 border px-5 py-3 text-sm font-medium transition-colors ${
                      isSaved
                        ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    {isSaved ? (
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 5a2 2 0 012-2h6a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h6a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    )}
                    {isSaved ? 'Remove Saved Job' : 'Save Job'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5 lg:col-span-4">

          {/* Company info */}
          <div className={surfaceClass}>
            <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <h3 className={sectionTitleClass}>About {job.companyName}</h3>
            </div>

            <div className="p-5">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-14 w-14 items-center justify-center border border-slate-200 bg-slate-100 text-lg font-semibold text-[#2563EB] dark:border-slate-700 dark:bg-slate-800 dark:text-blue-300">
                  {job.companyName?.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{job.companyName}</h4>
                  <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">Software Development</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">50–200 employees</p>
                </div>
              </div>

              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                A leading company dedicated to developing cutting-edge solutions for global and local clients.
              </p>
            </div>
          </div>

          {/* AI Match */}
          <div ref={matchPanelRef}>
            {isJobSeeker && jobId ? (
              <ErrorBoundary
                fallback={
                  <div className="border border-yellow-200 bg-white p-6 shadow-sm dark:border-yellow-500/20 dark:bg-slate-900">
                    <h3 className="mb-2 text-lg font-semibold text-yellow-900 dark:text-yellow-300">Match Analysis Unavailable</h3>
                    <p className="mb-4 text-sm text-yellow-700 dark:text-yellow-400">
                      We encountered an error loading the match analysis. This may be due to missing data or a temporary issue.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.location.reload()}
                        className="flex-1 border border-[#2563EB] bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
                      >
                        Retry
                      </button>
                      <button
                        onClick={() => window.history.back()}
                        className="flex-1 border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Go Back
                      </button>
                    </div>
                  </div>
                }
              >
                <JobMatchPanel jobId={jobId} />
              </ErrorBoundary>
            ) : (
              <div className={surfaceClass}>
                <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                  <h3 className={sectionTitleClass}>AI Match Score</h3>
                </div>

                <div className="p-5">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border border-blue-200 bg-blue-50 text-[#2563EB] dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>

                    <p className="mx-auto max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {!user
                        ? 'Login as a Job Seeker to analyze your resume match for this job and see your compatibility score.'
                        : 'Only job seekers can analyze resume match. This feature helps match your skills and experience with job requirements.'}
                    </p>

                    {!user && (
                      <button
                        onClick={handleAnalyzeClick}
                        className="mt-5 inline-flex items-center justify-center border border-[#2563EB] bg-[#2563EB] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
                      >
                        Analyze My Match
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {relatedJobs.length > 0 && (
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Related Jobs
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {relatedJobs.map((relatedJob: Job) => (
              <JobCard key={relatedJob._id} job={relatedJob} showMatchScore />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const pageContent = user && user.role === 'job_seeker' ? (
    <DashboardLayout variant="job-seeker" title="Job Details">
      {jobDetailsContent}
    </DashboardLayout>
  ) : (
    <div className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950">
      <nav className="mx-auto mb-8 flex max-w-7xl items-center justify-between border-b border-slate-200 px-1 py-3 dark:border-slate-800">
        <Link to="/" className="flex items-center transition-opacity hover:opacity-80">
          <img src={lakshyaLogo} alt="Lakshya Logo" className="h-8 w-auto" />
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {!user ? (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-[#2563EB] transition-colors hover:text-[#1D4ED8]"
              >
                Login
              </Link>
              <Link
                to="/signup-choice"
                className="inline-flex items-center justify-center border border-[#2563EB] bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <Link
              to={
                user.role === 'admin'
                  ? '/AdminDashboard'
                  : user.role === 'recruiter'
                  ? '/recruiter/dashboard'
                  : '/job-seeker/dashboard'
              }
              className="inline-flex items-center justify-center border border-[#2563EB] bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
            >
              Dashboard
            </Link>
          )}
        </div>
      </nav>

      {jobDetailsContent}
    </div>
  );

  return (
    <>
      {pageContent}

      {showApplyModal && (
        <div className="app-modal-overlay">
          <div className="app-modal-panel max-w-lg border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Apply for {job.title}
            </h3>
            <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
              Add a brief note to support your application.
            </p>

            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Cover Letter (Optional)
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={5}
                placeholder="Write a brief cover letter explaining why you're a great fit for this role..."
                className="w-full border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowApplyModal(false)}
                className="flex-1 border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={applyMutation.isPending}
                className="flex-1 border border-[#2563EB] bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-50"
              >
                {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default JobDetails;
