import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout, LoadingSpinner } from '../../components';
import { useMyJobs, useRecruiterRecentActivity } from '../../hooks';
import type { RecruiterRecentActivityType } from '../../services';

const shellClass =
  'rounded-none border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900';

const mutedLabelClass =
  'text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500';

const tableHeadClass =
  'text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500';

const RecruiterDashboard: React.FC = () => {
  const [activityPage, setActivityPage] = useState(1);

  const { data: jobsData, isLoading } = useMyJobs();
  const { data: activityData, isLoading: isActivityLoading } = useRecruiterRecentActivity(7, activityPage);

  const jobs = jobsData?.data || [];
  const recentActivity = activityData?.data || [];
  const activityPagination = activityData?.pagination;
  const activityTotalPages = activityPagination?.pages || 0;

  const activeJobs = jobs.filter((job) => job.isActive !== false).length;
  const recentJobs = jobs.slice(0, 5);

  const formatActivityTime = (dateString: string) => {
    const parsedDate = new Date(dateString);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Invalid date';
    }

    return parsedDate.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatPostedDate = (dateString: string) => {
    const parsedDate = new Date(dateString);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Invalid date';
    }

    return parsedDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRelativePostedTime = (dateString: string) => {
    const parsedDate = new Date(dateString);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Invalid date';
    }

    const now = new Date();
    const diffMs = now.getTime() - parsedDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;

    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks === 1) return '1 week ago';
    if (diffWeeks < 5) return `${diffWeeks} weeks ago`;

    return formatPostedDate(dateString);
  };

  const getActivityIcon = (type: RecruiterRecentActivityType) => {
    if (type === 'application_received') {
      return {
        wrapperClass:
          'border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300',
        icon: (
          <svg className="h-[15px] w-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.9}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        ),
      };
    }

    if (type === 'shortlisted') {
      return {
        wrapperClass:
          'border border-indigo-100 bg-indigo-50 text-indigo-600 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300',
        icon: (
          <svg className="h-[15px] w-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ),
      };
    }

    if (type === 'interview_scheduled') {
      return {
        wrapperClass:
          'border border-violet-100 bg-violet-50 text-violet-600 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-300',
        icon: (
          <svg className="h-[15px] w-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M8 7V3m8 4V3m-9 8h10" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.9}
              d="M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        ),
      };
    }

    if (type === 'rejected') {
      return {
        wrapperClass:
          'border border-rose-100 bg-rose-50 text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300',
        icon: (
          <svg className="h-[15px] w-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ),
      };
    }

    if (type === 'hired') {
      return {
        wrapperClass:
          'border border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300',
        icon: (
          <svg className="h-[15px] w-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ),
      };
    }

    if (type === 'job_created') {
      return {
        wrapperClass:
          'border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300',
        icon: (
          <svg className="h-[15px] w-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M12 4v16m8-8H4" />
          </svg>
        ),
      };
    }

    if (type === 'job_deactivated') {
      return {
        wrapperClass:
          'border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300',
        icon: (
          <svg className="h-[15px] w-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ),
      };
    }

    return {
      wrapperClass:
        'border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300',
      icon: (
        <svg className="h-[15px] w-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M12 8v4l3 3" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
        </svg>
      ),
    };
  };

  const getJobStatusClass = (isActive?: boolean) => {
    return isActive
      ? 'border border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300'
      : 'border border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400';
  };

  if (isLoading) {
    return (
      <DashboardLayout variant="recruiter" title="Dashboard">
        <LoadingSpinner text="Loading your dashboard..." />
      </DashboardLayout>
    );
  }

  const metricCards = [
    {
      label: 'Active Jobs',
      value: activeJobs,
      helper: `+${activeJobs > 0 ? activeJobs : 0}`,
      helperTone: 'text-emerald-500',
    },
    {
      label: 'New Applications',
      value: recentActivity.filter((item) => item.type === 'application_received').length,
      helper: `${recentActivity.length > 0 ? '+' + Math.min(recentActivity.length * 3, 24) + '%' : '+0%'}`,
      helperTone: 'text-emerald-500',
    },
    {
      label: 'Scheduled Interviews',
      value: recentActivity.filter((item) => item.type === 'interview_scheduled').length,
      helper: 'This week',
      helperTone: 'text-slate-500 dark:text-slate-400',
    },
    {
      label: 'Offers Sent',
      value: recentActivity.filter((item) => item.type === 'hired').length,
      helper: `Pending: ${Math.max(
        0,
        recentActivity.filter((item) => item.type === 'shortlisted').length -
          recentActivity.filter((item) => item.type === 'hired').length
      )}`,
      helperTone: 'text-indigo-500',
    },
  ];

  return (
    <DashboardLayout variant="recruiter" title="Dashboard">
      <div className="mx-auto max-w-7xl px-4 py-1 sm:px-6 lg:px-8">
        <div className="mb-7">
          <h1 className="text-[28px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Recruiter Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Overview of your hiring activity
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((metric) => (
            <div
              key={metric.label}
              className="rounded-none border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900"
            >
              <p className={mutedLabelClass}>{metric.label}</p>

              <div className="mt-3 flex items-end justify-between gap-3">
                <p className="text-[34px] font-semibold leading-none tracking-tight text-slate-900 dark:text-slate-100">
                  {metric.value}
                </p>
                <p className={`text-xs font-semibold ${metric.helperTone}`}>{metric.helper}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.85fr)_300px]">
          <div className="space-y-6">
            <section className={shellClass}>
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
                <h2 className="text-[24px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  Recent Job Posts
                </h2>

                <Link
                  to="/recruiter/manage-jobs"
                  className="text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  View all jobs
                </Link>
              </div>

              {recentJobs.length > 0 ? (
                <div className="overflow-x-auto">
                  <div className="min-w-[720px]">
                    <div className="grid grid-cols-[2.2fr_1fr_1fr_1fr] border-b border-slate-100 bg-slate-50/80 px-6 py-3 dark:border-slate-800 dark:bg-slate-800/50">
                      <div className={tableHeadClass}>Job Title</div>
                      <div className={tableHeadClass}>Applicants</div>
                      <div className={tableHeadClass}>Status</div>
                      <div className={tableHeadClass}>Posted</div>
                    </div>

                    {recentJobs.map((job) => (
                      <div
                        key={job._id}
                        className="grid grid-cols-[2.2fr_1fr_1fr_1fr] items-center border-b border-slate-100 px-6 py-4 last:border-b-0 dark:border-slate-800"
                      >
                        <div className="min-w-0 pr-4">
                          <h3 className="truncate text-[15px] font-semibold text-slate-800 dark:text-slate-100">
                            {job.title}
                          </h3>
                          <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                            {job.location} • {job.type}
                          </p>
                        </div>

                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {'applicantsCount' in job && typeof job.applicantsCount === 'number'
                            ? job.applicantsCount
                            : '—'}
                        </div>

                        <div>
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${getJobStatusClass(
                              job.isActive
                            )}`}
                          >
                            {job.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {getRelativePostedTime(job.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="px-6 py-10 text-center">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">No job posts yet</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Start recruiting by posting your first job.
                  </p>
                  <Link
                    to="/recruiter/post-job"
                    className="mt-4 inline-flex items-center justify-center rounded-none bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                  >
                    Post a Job
                  </Link>
                </div>
              )}
            </section>

            <section className={shellClass}>
              <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
                <h2 className="text-[24px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  Recent Activity
                </h2>
              </div>

              <div className="p-5">
                {isActivityLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="flex items-start gap-3 rounded-none border border-slate-200 p-4 animate-pulse dark:border-slate-800"
                      >
                        <div className="h-10 w-10 rounded-none bg-slate-200 dark:bg-slate-700" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3.5 w-4/5 rounded-none bg-slate-200 dark:bg-slate-700" />
                          <div className="h-3 w-2/5 rounded-none bg-slate-200 dark:bg-slate-700" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentActivity.length === 0 ? (
                  <div className="rounded-none border border-dashed border-slate-300 px-5 py-8 text-center dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">No recent activity</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Activity related to your jobs and candidates will appear here.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {recentActivity.map((activity) => {
                        const meta = getActivityIcon(activity.type);

                        return (
                          <div
                            key={activity.id}
                            className="rounded-none border border-slate-200 bg-white px-4 py-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/70"
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-none ${meta.wrapperClass}`}
                              >
                                {meta.icon}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold leading-5 text-slate-900 dark:text-slate-100">
                                  {activity.title}
                                </p>

                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {formatActivityTime(activity.createdAt)}
                                  </span>

                                  {activity.relatedJobId && (
                                    <Link
                                      to={`/recruiter/jobs/${activity.relatedJobId}/applications`}
                                      className="text-xs font-semibold uppercase tracking-[0.08em] text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                                    >
                                      View
                                    </Link>
                                  )}
                                </div>

                                <p className="mt-2 text-sm leading-5 text-slate-600 dark:text-slate-400">
                                  {activity.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {activityTotalPages > 1 && (
                      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setActivityPage((prev) => Math.max(1, prev - 1))}
                          disabled={activityPage <= 1}
                          className="inline-flex items-center gap-1.5 rounded-none border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
                          </svg>
                          Previous
                        </button>

                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          Page {activityPage} of {activityTotalPages}
                        </span>

                        <button
                          type="button"
                          onClick={() => setActivityPage((prev) => Math.min(activityTotalPages, prev + 1))}
                          disabled={activityPage >= activityTotalPages}
                          className="inline-flex items-center gap-1.5 rounded-none bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Next
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className={shellClass}>
              <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <h2 className={mutedLabelClass}>Quick Actions</h2>
              </div>

              <div className="space-y-3 p-5">
                <Link
                  to="/recruiter/post-job"
                  className="flex items-center justify-between rounded-none border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-none border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </span>
                    Post New Job
                  </span>

                  <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <Link
                  to="/recruiter/manage-jobs"
                  className="flex items-center justify-between rounded-none border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-none border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </span>
                    Manage Jobs
                  </span>

                  <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <div className="rounded-none bg-indigo-700 px-5 py-5 text-white">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-indigo-200">
                    Recruitment Tip
                  </p>
                  <p className="mt-3 text-sm leading-6 text-indigo-50">
                    Shortening your initial screening call by 5 minutes can save time across multiple candidates while keeping the process efficient.
                  </p>
                  <div className="mt-4">
                    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-white/90">
                      Read More
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RecruiterDashboard;