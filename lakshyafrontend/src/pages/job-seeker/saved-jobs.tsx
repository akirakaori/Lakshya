import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout, LoadingSpinner, EmptyState, PaginationControls, PageSizeSelect, type PaginationMeta } from '../../components';
import { JobCard } from '../../components/jobs';
import { useSavedJobs, useRemoveSavedJob, useApplyForJob, useMyApplications, useJobMatchScores } from '../../hooks';
import { useAuth } from '../../context/auth-context';
import type { Application, Job } from '../../services';
import { toast } from 'react-toastify';

interface EasyApplyModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (jobId: string) => Promise<void>;
  isSubmitting: boolean;
}

const EasyApplyModal: React.FC<EasyApplyModalProps> = ({
  job,
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
}) => {
  const navigate = useNavigate();

  if (!isOpen || !job) return null;

  const handleAnalyzeFirst = () => {
    navigate(`/jobs/${job._id}?action=analyze`);
    onClose();
  };

  const handleEasyApplyConfirm = async () => {
    try {
      await onConfirm(job._id);
      onClose();
    } catch (error) {
      console.debug('[SavedJobs EasyApply] Confirmation handled error:', error);
    }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Apply Confirmation</h3>

        <p className="text-sm text-gray-700">
          Do you want to apply for this job before confirming your resume analysis?
        </p>
        <p className="mt-3 text-sm text-gray-500">
          You can still apply without analyzing your resume first.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleAnalyzeFirst}
            className="flex-1 px-4 py-2 rounded-lg border border-indigo-600 text-indigo-700 hover:bg-indigo-50 text-sm font-medium"
          >
            Analyze First
          </button>
          <button
            type="button"
            onClick={handleEasyApplyConfirm}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-60 text-sm font-medium"
          >
            {isSubmitting ? 'Applying...' : 'Easy Apply'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const SavedJobs: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const page = useMemo(() => {
    const parsedPage = Number(searchParams.get('page'));
    return Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;
  }, [searchParams]);

  const limit = useMemo(() => {
    const parsedLimit = Number(searchParams.get('limit'));
    return Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.floor(parsedLimit) : 6;
  }, [searchParams]);
  const { user } = useAuth();
  const isAuthenticatedJobSeeker = user?.role === 'job_seeker';

  const { data, isLoading, isFetching, isError } = useSavedJobs({ page, limit });
  const { data: applicationsResponse } = useMyApplications(
    { page: 1, limit: 200 },
    { enabled: isAuthenticatedJobSeeker }
  );
  const applyMutation = useApplyForJob();
  const removeSavedJobMutation = useRemoveSavedJob();
  const navigate = useNavigate();

  const savedJobs = useMemo<Job[]>(() => data?.data ?? [], [data]);
  const pagination = data?.pagination;

  const normalizedPagination = useMemo<PaginationMeta | null>(() => {
    if (!pagination) {
      return null;
    }

    const total = Number.isFinite(pagination.total) ? pagination.total : savedJobs.length;
    const resolvedLimit = Number.isFinite(pagination.limit) && pagination.limit > 0
      ? pagination.limit
      : limit;
    const resolvedPagesFromTotal = Math.max(1, Math.ceil(total / resolvedLimit));
    const resolvedPages = Number.isFinite(pagination.pages) && pagination.pages > 0
      ? pagination.pages
      : resolvedPagesFromTotal;
    const resolvedPage = Number.isFinite(pagination.page) && pagination.page > 0
      ? Math.min(pagination.page, resolvedPages)
      : 1;

    return {
      total,
      page: resolvedPage,
      limit: resolvedLimit,
      pages: resolvedPages,
    };
  }, [pagination, savedJobs.length, limit]);

  // Debug: verify backend pagination payload and current paging inputs.
  console.log('[SavedJobs] Response payload:', data);
  console.log('[SavedJobs] Pagination:', pagination);
  console.log('[SavedJobs] Pagination metrics:', {
    totalSavedJobs: normalizedPagination?.total ?? 0,
    currentPage: normalizedPagination?.page ?? page,
    currentLimit: normalizedPagination?.limit ?? limit,
    totalPages: normalizedPagination?.pages ?? 0,
  });

  useEffect(() => {
    const hasPage = searchParams.has('page');
    const hasLimit = searchParams.has('limit');

    if (hasPage && hasLimit) {
      return;
    }

    const params = new URLSearchParams(searchParams);
    if (!hasPage) {
      params.set('page', '1');
    }
    if (!hasLimit) {
      params.set('limit', '6');
    }
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const applicationLookup = useMemo(() => {
    const lookup = new Map<string, {
      status: Application['status'];
      isWithdrawn: boolean;
      withdrawnAt: string | null;
    }>();
    const applications = applicationsResponse?.data ?? [];

    applications.forEach((application) => {
      if (!application || !application.jobId) {
        return;
      }

      const normalizedJobId =
        typeof application.jobId === 'string'
          ? application.jobId
          : application.jobId?._id;

      if (!normalizedJobId) {
        return;
      }

      lookup.set(normalizedJobId, {
        status: application.status,
        isWithdrawn: application.status === 'withdrawn' || !!application.isWithdrawn,
        withdrawnAt: application.withdrawnAt || null,
      });
    });

    return lookup;
  }, [applicationsResponse]);

  const savedJobIds = useMemo(() => savedJobs.map((job) => job._id), [savedJobs]);

  const { data: matchScoresResponse } = useJobMatchScores(
    isAuthenticatedJobSeeker && savedJobIds.length > 0 ? savedJobIds : undefined
  );
  const matchScores = useMemo(() => matchScoresResponse?.data ?? {}, [matchScoresResponse]);

  const updatePaginationParams = (nextPage: number, nextLimit: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', nextPage.toString());
    params.set('limit', nextLimit.toString());
    setSearchParams(params, { replace: true });
  };

  const handleLimitChange = (nextLimit: number) => {
    updatePaginationParams(1, nextLimit);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemove = async (jobId: string) => {
    try {
      await removeSavedJobMutation.mutateAsync(jobId);

      // If current page had only one item, step back to previous valid page.
      if (savedJobs.length === 1 && page > 1) {
        updatePaginationParams(Math.max(1, page - 1), limit);
      }

      toast.success('Removed from saved jobs');
    } catch {
      toast.error('Failed to remove saved job');
    }
  };

  const handleApplyOrReapply = async (jobId: string, successMessage: string) => {
    const payload = { jobId, data: {} };

    console.log('[SavedJobs Apply/Reapply] Submitting application payload:', payload);

    try {
      await applyMutation.mutateAsync(payload);
      toast.success(successMessage);
    } catch (err: unknown) {
      console.error('[SavedJobs Apply/Reapply] Failed to submit application:', err);

      const errorMessage =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to submit application';

      toast.error(errorMessage);
      throw err;
    }
  };

  return (
    <DashboardLayout variant="job-seeker" title="Saved Jobs">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Saved Jobs</h1>
            <p className="text-sm text-gray-500 mt-1">
              Jobs you have bookmarked to review or apply later.
            </p>
            {!isLoading && !isError && (
              <p className="text-sm text-gray-600 mt-2">
                {normalizedPagination?.total ?? savedJobs.length} Saved Jobs • Showing {normalizedPagination?.limit ?? limit} per page
              </p>
            )}
          </div>
          {!isLoading && !isError && (
            <PageSizeSelect
              value={normalizedPagination?.limit ?? limit}
              onChange={handleLimitChange}
              options={[6, 12, 18]}
              disabled={isFetching}
            />
          )}
        </div>

        {isLoading || isFetching ? (
          <LoadingSpinner text="Loading your saved jobs..." />
        ) : isError ? (
          <EmptyState
            title="Failed to load saved jobs."
            description="Please try again in a moment."
            action={
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Retry
              </button>
            }
          />
        ) : savedJobs.length === 0 ? (
          <EmptyState
            title="You haven't saved any jobs yet."
            description="Browse jobs and click the heart icon to save jobs you are interested in."
            action={
              <Link
                to="/browse-jobs"
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Browse Jobs
              </Link>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
              {savedJobs.map((job) => {
                const applicationMeta = applicationLookup.get(job._id);
                const applicationStatus = applicationMeta?.status;
                const isApplied = !!applicationStatus;
                const isWithdrawn = !!applicationMeta?.isWithdrawn;
                const isJobOpenForApply = !job.isDeleted && job.isActive && job.status === 'open';
                const canReapply = isWithdrawn && isJobOpenForApply;
                const withdrawnDateText = applicationMeta?.withdrawnAt
                  ? new Date(applicationMeta.withdrawnAt).toLocaleDateString()
                  : null;
                const matchData = matchScores[job._id];
                const matchScore = matchData?.matchScore ?? undefined;

                return (
                  <div key={job._id} className="flex flex-col gap-3">
                    <JobCard
                      job={job}
                      showMatchScore
                      matchScore={matchScore}
                      isApplied={isApplied}
                      applicationStatus={applicationStatus}
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/jobs/${job._id}`)}
                        className="px-4 py-2 text-sm rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        View Details
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (isWithdrawn && canReapply) {
                            handleApplyOrReapply(job._id, 'Reapplied successfully');
                            return;
                          }

                          if (isApplied) {
                            navigate('/job-seeker/my-applications');
                            return;
                          }

                          setSelectedJob(job);
                          setShowApplyModal(true);
                        }}
                        disabled={applyMutation.isPending || (isWithdrawn && !canReapply)}
                        className={`px-4 py-2 text-sm rounded-full transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                          isApplied && !isWithdrawn
                            ? 'border border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
                            : isWithdrawn && canReapply
                            ? 'bg-amber-500 text-white hover:bg-amber-600'
                            : isWithdrawn && !canReapply
                            ? 'border border-gray-300 bg-gray-100 text-gray-500'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        {isWithdrawn && canReapply
                          ? 'Reapply'
                          : isWithdrawn && !canReapply
                          ? 'Closed / Unavailable'
                          : isApplied
                          ? 'Track Application'
                          : 'Easy Apply'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(job._id)}
                        className="px-4 py-2 text-sm rounded-full border border-red-400 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                    {isWithdrawn && (
                      <div className="text-sm text-amber-700 px-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 mr-2">
                          Withdrawn
                        </span>
                        {withdrawnDateText ? `Withdrawn on ${withdrawnDateText}` : 'Application was withdrawn'}
                        {!canReapply && (
                          <p className="text-xs text-gray-500 mt-1">This job is no longer open for reapplication.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {normalizedPagination && normalizedPagination.pages > 1 && (
              <div className="mt-8 bg-white border border-gray-200 rounded-xl overflow-hidden">
                <PaginationControls
                  pagination={normalizedPagination}
                  onPageChange={(nextPage) => {
                    updatePaginationParams(nextPage, limit);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  isLoading={isLoading}
                  isFetching={isFetching}
                />
              </div>
            )}
          </>
        )}
      </div>
      <EasyApplyModal
        job={selectedJob}
        isOpen={showApplyModal}
        onConfirm={(jobId) => handleApplyOrReapply(jobId, 'Application submitted successfully')}
        isSubmitting={applyMutation.isPending}
        onClose={() => {
          setShowApplyModal(false);
          setSelectedJob(null);
        }}
      />
    </DashboardLayout>
  );
};

export default SavedJobs;
