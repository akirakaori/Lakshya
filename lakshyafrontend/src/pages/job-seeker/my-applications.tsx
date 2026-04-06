import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  DashboardLayout,
  LoadingSpinner,
  EmptyState,
  PaginationControls,
  PageSizeSelect,
  ConfirmModal,
  type PaginationMeta
} from '../../components';
import { useMyApplications, useJobMatchScores, useWithdrawApplication } from '../../hooks';
import type { Application, Job, Interview } from '../../services';
import { getStatusLabel } from '../../utils/applicationStatus';
import { handleError, handleSuccess } from '../../Utils';
import {
  formatInterviewTimeRange,
  getInterviewDisplayStatusMeta,
  getInterviewOutcomeMeta
} from '../../utils/interview-status';

const MyApplications: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'applied' | 'shortlisted' | 'interview' | 'rejected' | 'withdrawn'
  >('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [withdrawTargetId, setWithdrawTargetId] = useState<string | null>(null);

  const page = useMemo(() => {
    const parsedPage = Number(searchParams.get('page'));
    return Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;
  }, [searchParams]);

  const limit = useMemo(() => {
    const parsedLimit = Number(searchParams.get('limit'));
    return Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.floor(parsedLimit) : 10;
  }, [searchParams]);

  const updatePaginationParams = (nextPage: number, nextLimit: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', nextPage.toString());
    params.set('limit', nextLimit.toString());
    setSearchParams(params, { replace: true });
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: response, isLoading } = useMyApplications({
    q: debouncedSearch,
    status: statusFilter,
    page,
    limit
  });

  const applications = useMemo<Application[]>(() => response?.data ?? [], [response?.data]);
  const pagination = response?.pagination;
  const withdrawMutation = useWithdrawApplication();

  const paginationMeta = useMemo<PaginationMeta | null>(() => {
    if (!pagination) return null;

    return {
      total: pagination.total,
      page: pagination.page,
      limit: pagination.limit,
      pages: pagination.pages ?? 1
    };
  }, [pagination]);

  React.useEffect(() => {
    updatePaginationParams(1, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter]);

  const jobIds = useMemo(() => {
    return applications
      .map((app) => {
        const job = typeof app.jobId === 'object' ? (app.jobId as Job) : null;
        return typeof app.jobId === 'string' ? app.jobId : job?._id;
      })
      .filter((id): id is string => !!id);
  }, [applications]);

  const { data: matchScoresResponse } = useJobMatchScores(jobIds.length > 0 ? jobIds : undefined);
  const matchScores = matchScoresResponse?.data || {};

  const stats = useMemo(() => {
    const allApps = applications;
    return {
      total: paginationMeta?.total ?? allApps.length,
      pending: allApps.filter((a) => a.status === 'applied').length,
      shortlisted: allApps.filter((a) => a.status === 'shortlisted').length,
      interview: allApps.filter((a) => a.status === 'interview').length,
      rejected: allApps.filter((a) => a.status === 'rejected').length,
      hired: allApps.filter((a) => a.status === 'hired' || a.status === 'offer').length
    };
  }, [applications, paginationMeta]);

  const hiredApplications = useMemo(() => {
    return applications.filter((app) => app.status === 'hired' || app.status === 'offer');
  }, [applications]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getHumanStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200';
      case 'interview':
        return 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200';
      case 'shortlisted':
        return 'bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200';
      case 'offer':
        return 'bg-teal-100 text-teal-700 border border-teal-200 hover:bg-teal-200';
      case 'hired':
        return 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200';
      case 'withdrawn':
        return 'bg-red-100 text-red-600 border border-red-200 hover:bg-red-200';
      case 'rejected':
        return 'bg-red-100 text-red-600 border border-red-200 hover:bg-red-200';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-200';
    }
  };

  const statCards = [
    { label: 'Total Applications', value: stats.total },
    { label: 'In Review', value: stats.pending },
    { label: 'Interviews', value: stats.interview },
    { label: 'Accepted', value: stats.hired }
  ];

  return (
    <DashboardLayout variant="job-seeker" title="My Applications">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {hiredApplications.length > 0 && (
          <div className="mb-6 border border-emerald-200 bg-emerald-50 px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-emerald-900">Congratulations</h2>
                <p className="mt-1 text-sm text-emerald-800">
                  You have been selected for {hiredApplications.length} position
                  {hiredApplications.length > 1 ? 's' : ''}.
                </p>

                <ul className="mt-2 space-y-1">
                  {hiredApplications.map((app) => {
                    const job = typeof app.jobId === 'object' ? (app.jobId as Job) : null;
                    return (
                      <li key={app._id} className="text-sm text-emerald-900">
                        <span className="font-medium">{job?.title || 'Position'}</span>
                        <span className="text-emerald-700"> at {job?.companyName || 'Company'}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-[34px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              My Applications
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Track and manage your professional trajectory.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <PageSizeSelect
              value={limit}
              onChange={(nextLimit) => {
                updatePaginationParams(1, nextLimit);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              options={[5, 10, 20]}
              disabled={isLoading}
            />
            <Link
              to="/job-seeker/browse-jobs"
              className="inline-flex h-10 items-center justify-center bg-[#3b4bb8] px-4 text-sm font-medium text-white transition-colors hover:bg-[#2e3a94]"
            >
              Browse Jobs
            </Link>
          </div>
        </div>

        {stats.total > 0 && (
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((item) => (
              <div key={item.label} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                  {item.label}
                </p>
                <p className="mt-2 text-4xl font-semibold leading-none tracking-tight text-slate-900 dark:text-slate-100">
                  {String(item.value).padStart(2, '0')}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mb-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>

              <input
                type="text"
                placeholder="Search by job title or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-[#3b4bb8]"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="h-10 min-w-[160px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-700 dark:text-slate-300 outline-none transition focus:border-[#3b4bb8]"
              >
                <option value="all">Status: All</option>
                <option value="applied">Pending</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interview">Interview</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner text="Loading your applications..." />
        ) : applications.length === 0 ? (
          <EmptyState
            title={
              statusFilter === 'all' && !debouncedSearch
                ? 'No applications yet'
                : 'No matching applications'
            }
            description={
              statusFilter === 'all' && !debouncedSearch
                ? 'Start applying to jobs to see your applications here.'
                : 'Try adjusting your search or filter criteria.'
            }
            action={
              statusFilter === 'all' && !debouncedSearch ? (
                <Link
                  to="/job-seeker/browse-jobs"
                  className="inline-flex items-center justify-center bg-[#3b4bb8] px-4 py-2 text-sm font-medium text-white hover:bg-[#2e3a94]"
                >
                  Browse Jobs
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className="inline-flex items-center justify-center bg-[#3b4bb8] px-4 py-2 text-sm font-medium text-white hover:bg-[#2e3a94]"
                >
                  Clear Filters
                </button>
              )
            }
          />
        ) : (
          <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="hidden border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 lg:block">
              <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                <div className="col-span-5">Application</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Interview</div>
                <div className="col-span-1">Match</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800 py-1">
              {applications.map((application) => {
                const job = typeof application.jobId === 'object' ? (application.jobId as Job) : null;
                const jobId = typeof application.jobId === 'string' ? application.jobId : job?._id;

                const matchData = jobId ? matchScores[jobId] : null;
                const hasMatchScore =
                  matchData?.matchScore !== null && matchData?.matchScore !== undefined;

                const isJobInactive = job?.isDeleted || (job && !job.isActive);

                const appWithInterviews = application as Application;
                const interviews = (appWithInterviews.interviews || []) as Interview[];
                const hasInterviews = interviews.length > 0;
                const isExpanded = expandedAppId === application._id;
                const canWithdraw =
                  application.status === 'applied' || application.status === 'shortlisted';

                const isActive = activeCardId === application._id;

                return (
                  <React.Fragment key={application._id}>
                    <div
                      onClick={() =>
                        setActiveCardId(isActive ? null : application._id)
                      }
                      className={`group relative mx-2 my-1 cursor-pointer overflow-hidden rounded-md border transition-all duration-200 ${
                        isActive
                          ? 'z-10 -translate-y-[2px] scale-[1.01] border-amber-200 bg-white dark:bg-slate-900 shadow-md'
                          : 'border-transparent bg-white dark:bg-slate-900 hover:border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:shadow-sm'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-0 h-full w-[3px] rounded-l-md bg-amber-500" />
                      )}
                      <div className="px-5 py-5">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-center">
                          <div className="lg:col-span-5">
                            <div className="flex items-start gap-3">
                              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
                                <svg
                                  className="h-5 w-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.8}
                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-16 0H3m4-14h10M9 9h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1"
                                  />
                                </svg>
                              </div>

                              <div className="min-w-0">
                                <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                                  {job?.title || 'Job Title'}
                                </h3>

                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                                  <span className="font-medium text-slate-700 dark:text-slate-300">
                                    {job?.companyName || 'Company'}
                                  </span>
                                  {job?.location && <span>{job.location}</span>}
                                  <span>Applied {formatDate(application.createdAt)}</span>
                                </div>

                                {isJobInactive && (
                                  <span className="mt-2 inline-flex items-center border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                                    Job Removed
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="lg:col-span-2">
                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 lg:hidden">
                              Status
                            </p>
                            <span
                              className={`inline-flex items-center px-2.5 py-1 text-[11px] font-medium transition-colors ${getHumanStatusBadgeClass(
                                application.status
                              )}`}
                            >
                              {getStatusLabel(application.status)}
                            </span>
                          </div>

                          <div className="lg:col-span-2">
                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 lg:hidden">
                              Interview
                            </p>
                            {hasInterviews ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedAppId(isExpanded ? null : application._id);
                                }}
                                className="inline-flex items-center gap-1 text-sm font-medium text-[#3b4bb8] hover:text-[#2e3a94]"
                              >
                                {interviews.length} Round{interviews.length > 1 ? 's' : ''}
                                <svg
                                  className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </button>
                            ) : (
                              <span className="text-sm text-slate-400">—</span>
                            )}
                          </div>

                          <div className="lg:col-span-1">
                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 lg:hidden">
                              Match
                            </p>
                            {hasMatchScore ? (
                              <span className="inline-flex border border-indigo-100 bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-700">
                                {matchData.matchScore}% Match
                              </span>
                            ) : (
                              <span className="text-sm text-slate-400">—</span>
                            )}
                          </div>

                          <div className="lg:col-span-2">
                            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                              {job && jobId ? (
                                <Link
                                  to={`/job-seeker/jobs/${jobId}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-sm font-medium text-[#3b4bb8] hover:text-[#2e3a94]"
                                >
                                  View Job
                                </Link>
                              ) : (
                                <span className="text-sm text-slate-400">N/A</span>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setWithdrawTargetId(application._id);
                                }}
                                disabled={!canWithdraw || withdrawMutation.isPending}
                                title={
                                  canWithdraw
                                    ? 'Withdraw Application'
                                    : 'Withdrawal is only allowed for applied or shortlisted applications'
                                }
                                className={`inline-flex items-center justify-center border px-3 py-1.5 text-xs font-medium transition-colors ${
                                  canWithdraw
                                    ? 'border-red-300 text-red-600 hover:bg-red-50'
                                    : 'cursor-not-allowed border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-400'
                                }`}
                              >
                                Withdraw
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {isExpanded && hasInterviews && (
                      <div className="mx-2 mb-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-5 py-4">
                        <div className="mb-3">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Interview Schedule</h4>
                        </div>

                        <div className="space-y-3">
                          {interviews.map((interview: Interview, idx: number) => {
                            const interviewStatus = getInterviewDisplayStatusMeta(interview);
                            const interviewOutcome = getInterviewOutcomeMeta(interview);
                            const timeRange = formatInterviewTimeRange(interview);

                            return (
                              <div key={idx} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="inline-flex border border-indigo-100 bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-700">
                                        Round {interview.roundNumber}
                                      </span>
                                      <span className="inline-flex border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-2 py-1 text-[11px] font-medium capitalize text-slate-600 dark:text-slate-400">
                                        {interview.mode}
                                      </span>
                                      <span
                                        className={`inline-flex px-2 py-1 text-[11px] font-medium ${interviewStatus.colorClass}`}
                                      >
                                        {interviewStatus.label}
                                      </span>
                                    </div>

                                    <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs text-slate-500 dark:text-slate-400">Result:</span>
                                        <span
                                          className={`inline-flex px-2 py-1 text-[11px] font-medium ${interviewOutcome.colorClass}`}
                                        >
                                          {interviewOutcome.label}
                                        </span>
                                      </div>

                                      <div>
                                        {new Date(interview.date).toLocaleDateString('en-US', {
                                          weekday: 'long',
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric'
                                        })}
                                      </div>

                                      {timeRange && (
                                        <div className="text-slate-600 dark:text-slate-400">
                                          {timeRange} {interview.timezone && `(${interview.timezone})`}
                                        </div>
                                      )}

                                      {interview.linkOrLocation && (
                                        <div className="text-slate-600 dark:text-slate-400">
                                          {interview.mode === 'online' ? (
                                            <a
                                              href={interview.linkOrLocation}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="break-all text-[#3b4bb8] hover:underline"
                                            >
                                              {interview.linkOrLocation}
                                            </a>
                                          ) : (
                                            <span>{interview.linkOrLocation}</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {interview.messageToCandidate && (
                                  <div className="mt-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                      Message from Recruiter
                                    </p>
                                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                                      {interview.messageToCandidate}
                                    </p>
                                  </div>
                                )}

                                {interviewStatus.value === 'completed' &&
                                  interviewOutcome.value === 'pending' && (
                                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                                      Awaiting recruiter decision
                                    </p>
                                  )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {paginationMeta && paginationMeta.pages > 1 && (
              <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <PaginationControls
                  pagination={paginationMeta}
                  onPageChange={(nextPage) => {
                    updatePaginationParams(nextPage, limit);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  isLoading={isLoading}
                />
              </div>
            )}
          </div>
        )}

        <ConfirmModal
          isOpen={!!withdrawTargetId}
          onClose={() => setWithdrawTargetId(null)}
          onConfirm={async () => {
            if (!withdrawTargetId) return;

            try {
              const result = await withdrawMutation.mutateAsync(withdrawTargetId);
              handleSuccess(result.message || 'Application withdrawn successfully');
              setWithdrawTargetId(null);
            } catch (error: unknown) {
              const errorMessage =
                typeof error === 'object' &&
                error !== null &&
                'response' in error &&
                typeof (error as { response?: { data?: { message?: string } } }).response?.data
                  ?.message === 'string'
                  ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                  : 'Failed to withdraw application';

              handleError(errorMessage ?? 'Failed to withdraw application');
            }
          }}
          title="Withdraw Application"
          message="Are you sure you want to withdraw this application? This action cannot be undone."
          cancelText="Cancel"
          confirmText="Confirm Withdraw"
          confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
          isLoading={withdrawMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
};

export default MyApplications;