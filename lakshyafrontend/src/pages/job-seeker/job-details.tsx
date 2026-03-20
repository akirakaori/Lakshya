import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { DashboardLayout, LoadingSpinner, EmptyState, ErrorBoundary } from '../../components';
import { JobCard } from '../../components/jobs';
import JobMatchPanel from '../../components/jobs/JobMatchPanel';
import { useJob, useJobs, useApplyForJob, useJobMatch, useIsJobSaved, useSaveJob, useRemoveSavedJob, useMyApplications } from '../../hooks';
import { useAuth } from '../../context/auth-context';
import { toast } from 'react-toastify';
import type { Job } from '../../services';
import { getCategoryMeta } from '../../constants/jobCategories';
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
      className="prose prose-sm max-w-none prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5 prose-li:my-1 prose-p:my-2 prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900 prose-a:text-indigo-600"
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
    if (!app?.jobId) {
      return false;
    }

    if (typeof app.jobId === 'string') {
      return app.jobId === safeJobId;
    }

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

  // Handle action query params (apply/analyze)
  useEffect(() => {
    const action = searchParams.get('action');
    if (!action || !job) return;

    // Check if user is logged in
    if (!user) {
      // Not logged in - redirect to login
      const currentPath = `/jobs/${jobId}?action=${action}`;
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`, { replace: true });
      return;
    }

    // Check if user is a job seeker
    if (user.role !== 'job_seeker') {
      toast.error('Only job seekers can apply or analyze jobs.');
      // Remove action param
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

    // Handle the action - use setTimeout to avoid cascading renders
    if (action === 'apply') {
      // Delay to avoid cascading render warning
      setTimeout(() => {
        setShowApplyModal(true);
      }, 0);
      // Remove action param from URL
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    } else if (action === 'analyze') {
      // Scroll to match panel
      if (matchPanelRef.current) {
        matchPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      // Remove action param from URL after a brief delay
      setTimeout(() => {
        searchParams.delete('action');
        setSearchParams(searchParams, { replace: true });
      }, 1000);
    }
  }, [searchParams, job, user, jobId, navigate, setSearchParams, activeApplicationStatus, isWithdrawnApplication]);

  // Guard: Invalid jobId parameter
  if (!jobId) {
    const content = (
      <EmptyState
        title="Invalid Job"
        description="The job link is invalid or incomplete."
        action={
          <Link
            to="/"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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
      <div className="min-h-screen bg-gray-50 p-8">{content}</div>
    );
  }

  const handleApply = async () => {
    if (!jobId) return;
    
    // Check if analysis exists and is up-to-date (optional - backend handles this automatically)
    // We show warnings but still allow apply (backend will compute if needed)
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
      // Not logged in - redirect to login with action param
      const redirectUrl = encodeURIComponent(`/jobs/${jobId}?action=analyze`);
      navigate(`/login?redirect=${redirectUrl}`);
      return;
    }
    
    if (user.role !== 'job_seeker') {
      toast.error('Only job seekers can analyze resume match.');
      return;
    }
    
    // Scroll to analysis panel
    if (matchPanelRef.current) {
      matchPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleApplyClick = () => {
    if (!user) {
      // Not logged in - redirect to login with action param
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
    
    // Open apply modal
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">{loadingContent}</div>
    );
  }

  if (error || !job) {
    const errorContent = (
      <EmptyState
        title="Job not found"
        description="The job you're looking for doesn't exist or has been removed."
        action={
          <Link
            to={user && user.role === 'job_seeker' ? "/job-seeker/browse-jobs" : "/"}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {user && user.role === 'job_seeker' ? "Browse Jobs" : "Back to Home"}
          </Link>
        }
      />
    );
    return user && user.role === 'job_seeker' ? (
      <DashboardLayout variant="job-seeker" title="Job Details">
        {errorContent}
      </DashboardLayout>
    ) : (
      <div className="min-h-screen bg-gray-50 p-8">{errorContent}</div>
    );
  }

  // Check if job is deleted or inactive
  const isJobInactive = job.isDeleted || !job.isActive;
  const isJobOpenForApply = !isJobInactive && job.status === 'open';
  const canReapply = isWithdrawnApplication && isJobOpenForApply;

  // Main content (used in both authenticated and public views)
  const jobDetailsContent = (
    <div className="max-w-7xl mx-auto">
        {/* Inactive Job Warning */}
        {isJobInactive && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="text-yellow-900 font-semibold">This job is no longer active</h3>
                <p className="text-yellow-700 text-sm mt-1">
                  {job.isDeleted 
                    ? "This job post has been removed by the employer and is no longer accepting applications."
                    : "This job is currently inactive and not accepting new applications."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Back Link */}
        <Link
          to={user && user.role === 'job_seeker' ? "/job-seeker/browse-jobs" : "/"}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {user && user.role === 'job_seeker' ? "Back to Jobs" : "Back to Home"}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                  <div className="flex items-center gap-2 mt-2 text-gray-600">
                    <span>{job.companyName}</span>
                    <span>•</span>
                    <span>{job.location}</span>
                    {formatSalary(job.salary) && (
                      <>
                        <span>•</span>
                        <span>{formatSalary(job.salary)}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    job.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {job.status === 'open' ? 'Active' : 'Closed'}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-4">
                {/* Category Badge */}
                {job.category && (
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium border ${
                    getCategoryMeta(job.category).bgClass
                  } ${
                    getCategoryMeta(job.category).colorClass
                  } ${
                    getCategoryMeta(job.category).borderClass
                  }`}>
                    <span>{getCategoryMeta(job.category).icon}</span>
                    <span>{job.category}</span>
                  </span>
                )}
                {/* Job Type Badge */}
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{job.jobType}</span>
                {/* Posted Date */}
                <span className="text-sm text-gray-500">
                  Posted {new Date(job.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Job Description */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h2>
              {renderRichContent(job.description)}
            </div>

            {/* Requirements */}
            {renderRichContent(job.requirements as unknown as string | string[] | undefined) && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h2>
                {renderRichContent(job.requirements as unknown as string | string[] | undefined)}
              </div>
            )}

            {/* Benefits */}
            {renderRichContent(job.benefits as unknown as string | string[] | undefined) && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Benefits</h2>
                {renderRichContent(job.benefits as unknown as string | string[] | undefined)}
              </div>
            )}

            {/* Required Skills */}
            {job.skillsRequired && job.skillsRequired.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skillsRequired.map((skill: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons: Apply & Analyze */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4">Take Action</h3>
              
              {isJobInactive ? (
                <div className="text-center">
                  <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    This job is no longer available
                  </div>
                </div>
              ) : isWithdrawnApplication ? (
                <div className="text-center">
                  <div className="inline-flex items-center px-4 py-2 bg-amber-100 text-amber-800 rounded-lg font-medium">
                    Withdrawn
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {withdrawnDateText
                      ? `You withdrew your application on ${withdrawnDateText}.`
                      : 'You withdrew your application for this job.'}
                  </p>
                  {canReapply ? (
                    <>
                      <p className="text-sm text-emerald-700 mt-1 font-medium">You can reapply because this job is still open.</p>
                      <div className="mt-3 flex justify-center">
                        <button
                          onClick={handleApplyClick}
                          className="px-6 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
                        >
                          Reapply
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">This job is no longer open for reapplication.</p>
                  )}
                </div>
              ) : activeApplicationStatus || applyMutation.isSuccess ? (
                <div className="text-center">
                  <div className={`inline-flex items-center px-4 py-2 rounded-lg ${getStatusBadgeClass(activeApplicationStatus || 'applied')}`}>
                    {getStatusLabel(activeApplicationStatus || 'applied')}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">You already have an active application for this job.</p>
                  <div className="mt-3">
                    <Link
                      to="/job-seeker/my-applications"
                      className="inline-flex items-center px-4 py-2 border border-green-300 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                    >
                      Track Application
                    </Link>
                  </div>
                </div>
              ) : job.status === 'closed' ? (
                <div className="text-center">
                  <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">
                    This position is no longer accepting applications
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleApplyClick}
                    className="flex-1 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium text-lg"
                  >
                    Apply Now
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleSave}
                    className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      isSaved
                        ? 'border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100'
                        : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    {isSaved ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 5a2 2 0 012-2h6a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h6a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    )}
                    {isSaved ? 'Remove Saved Job' : 'Save Job'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About {job.companyName}</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-600 font-bold text-2xl">
                    {job.companyName?.charAt(0)}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{job.companyName}</h4>
                  <p className="text-sm text-gray-500">Software Development</p>
                  <p className="text-sm text-gray-500">50-200 employees</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                A leading company dedicated to developing cutting-edge solutions for global and local clients.
              </p>
            </div>

            {/* AI Match Score — Always show section */}
            <div ref={matchPanelRef}>
              {isJobSeeker && jobId ? (
                <ErrorBoundary
                  fallback={
                    <div className="bg-white rounded-xl border border-yellow-200 p-6">
                      <h3 className="text-lg font-semibold text-yellow-900 mb-2">Match Analysis Unavailable</h3>
                      <p className="text-sm text-yellow-700 mb-4">
                        We encountered an error loading the match analysis. This may be due to missing data or a temporary issue.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => window.location.reload()}
                          className="flex-1 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                        >
                          Retry
                        </button>
                        <button
                          onClick={() => window.history.back()}
                          className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
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
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Resume Match Analysis</h3>
                    <p className="text-sm text-gray-600 max-w-sm mx-auto mb-4">
                      {!user 
                        ? "Login as a Job Seeker to analyze your resume match for this job and see your compatibility score."
                        : "Only job seekers can analyze resume match. This feature helps match your skills and experience with job requirements."}
                    </p>
                    {!user && (
                      <button
                        onClick={handleAnalyzeClick}
                        className="mt-4 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Analyze My Match
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Jobs */}
        {relatedJobs.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Related Jobs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedJobs.map((relatedJob: Job) => (
                <JobCard key={relatedJob._id} job={relatedJob} showMatchScore />
              ))}
            </div>
          </div>
        )}
      </div>
  );

  // Conditionally wrap with DashboardLayout only for authenticated job seekers
  const pageContent = user && user.role === 'job_seeker' ? (
    <DashboardLayout variant="job-seeker" title="Job Details">
      {jobDetailsContent}
    </DashboardLayout>
  ) : (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {/* Public Navbar */}
      <nav className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
        <Link to="/" className="inline-flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-xl">💼</span>
          </div>
          <span className="text-xl font-bold text-gray-800">Lakshya</span>
        </Link>
        <div className="flex gap-3">
          {!user ? (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Login
              </Link>
              <Link
                to="/signup-choice"
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <Link
              to={
                user.role === 'admin' ? '/AdminDashboard' :
                user.role === 'recruiter' ? '/recruiter/dashboard' :
                '/job-seeker/dashboard'
              }
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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
      
      {/* Apply Modal - rendered at top level */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Apply for {job.title}</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Letter (Optional)
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={5}
                placeholder="Write a brief cover letter explaining why you're a great fit for this role..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowApplyModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={applyMutation.isPending}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
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
