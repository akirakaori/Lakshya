import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout, LoadingSpinner } from '../../components';
import { useMyJobs, useRecruiterRecentActivity } from '../../hooks';
import { useAuth } from '../../context/auth-context';
import type { RecruiterRecentActivityType } from '../../services';

const cardClass = 'rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900';
const sectionTitleClass = 'text-[18px] font-semibold tracking-tight text-slate-900 dark:text-slate-100';
const sectionLabelClass = 'text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400';

const RecruiterDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activityPage, setActivityPage] = useState(1);

  const { data: jobsData, isLoading } = useMyJobs();
  const { data: activityData, isLoading: isActivityLoading } = useRecruiterRecentActivity(7, activityPage);

  const jobs = jobsData?.data || [];
  const recentActivity = activityData?.data || [];
  const activityPagination = activityData?.pagination;
  const activityTotalPages = activityPagination?.pages || 0;

  const activeJobs = jobs.filter((job) => job.isActive !== false).length;
  const totalJobs = jobs.length;
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

  const getActivityIcon = (type: RecruiterRecentActivityType) => {
    if (type === 'application_received') {
      return {
        wrapperClass: 'border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300',
        icon: (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
      };
    }

    if (type === 'shortlisted') {
      return {
        wrapperClass: 'border border-[#d9dcff] bg-[#f5f6ff] text-[#4654c7]',
        icon: (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ),
      };
    }

    if (type === 'interview_scheduled') {
      return {
        wrapperClass: 'border border-blue-200 bg-blue-50 text-blue-700',
        icon: (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
      };
    }

    if (type === 'rejected') {
      return {
        wrapperClass: 'border border-red-200 bg-red-50 text-red-700',
        icon: (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ),
      };
    }

    if (type === 'hired') {
      return {
        wrapperClass: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
        icon: (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ),
      };
    }

    if (type === 'job_created') {
      return {
        wrapperClass: 'border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300',
        icon: (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        ),
      };
    }

    if (type === 'job_deactivated') {
      return {
        wrapperClass: 'border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300',
        icon: (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ),
      };
    }

    return {
      wrapperClass: 'border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300',
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
        </svg>
      ),
    };
  };

  const getJobStatusClass = (isActive?: boolean) => {
    return isActive
      ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
  };

  const getMetricAccentClass = () => 'text-slate-900 dark:text-slate-100';

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  if (isLoading) {
    return (
      <DashboardLayout variant="recruiter" title="Dashboard">
        <LoadingSpinner text="Loading your dashboard..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout variant="recruiter" title="Dashboard">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="mb-8 flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              {today}
            </p>
            <h1 className="mt-1.5 text-[26px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {user?.fullName || user?.name
                ? `Good to see you, ${(user?.fullName || user?.name || '').split(' ')[0]}.`
                : 'Recruiter Dashboard'}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Here's an overview of your hiring activity.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/recruiter/manage-jobs"
              className="inline-flex h-9 items-center border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-[13px] font-medium text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Manage Jobs
            </Link>
            <Link
              to="/recruiter/post-job"
              className="inline-flex h-9 items-center gap-1.5 bg-[#3b4bb8] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#2e3a94]"
            >
              Post New Job
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="opacity-80">
                <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </Link>
          </div>
        </div>

        {/* Metric cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Active Jobs',
              value: activeJobs,
              helper: `${totalJobs} total posted`,
            },
            {
              label: 'New Applications',
              value: recentActivity.filter((item) => item.type === 'application_received').length,
              helper: 'From recent activity',
            },
            {
              label: 'Scheduled Interviews',
              value: recentActivity.filter((item) => item.type === 'interview_scheduled').length,
              helper: 'Current page activity',
            },
            {
              label: 'Offers Sent',
              value: recentActivity.filter((item) => item.type === 'hired').length,
              helper: 'Hired outcomes',
            },
          ].map((metric) => (
            <div key={metric.label} className={`${cardClass} px-5 py-5`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                {metric.label}
              </p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <p className={`text-[34px] font-semibold leading-none tracking-tight ${getMetricAccentClass()}`}>
                  {metric.value}
                </p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{metric.helper}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.9fr)_320px]">
          {/* Left column */}
          <div className="space-y-6">
            {/* Recent Job Posts */}
            <section className={cardClass}>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-5">
                <div>
                  <h2 className={sectionTitleClass}>Recent Job Posts</h2>
                </div>
                <Link
                  to="/recruiter/manage-jobs"
                  className="text-sm font-medium text-[#3b4bb8] hover:text-[#2e3a94]"
                >
                  View all jobs
                </Link>
              </div>

              {recentJobs.length > 0 ? (
                <div className="overflow-x-auto">
                  <div className="min-w-[720px]">
                    <div className="grid grid-cols-[2.2fr_1fr_1fr_1fr] border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-6 py-3">
                      <div className={sectionLabelClass}>Job Title</div>
                      <div className={sectionLabelClass}>Applicants</div>
                      <div className={sectionLabelClass}>Status</div>
                      <div className={sectionLabelClass}>Posted</div>
                    </div>

                    {recentJobs.map((job) => (
                      <div
                        key={job._id}
                        className="grid grid-cols-[2.2fr_1fr_1fr_1fr] items-center border-b border-slate-200 dark:border-slate-800 px-6 py-4 last:border-b-0"
                      >
                        <div className="min-w-0 pr-4">
                          <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {job.title}
                          </h3>
                          <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                            {job.location} • {job.type}
                          </p>
                        </div>

                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {'applicantsCount' in job && typeof job.applicantsCount === 'number'
                            ? job.applicantsCount
                            : '—'}
                        </div>

                        <div>
                          <span
                            className={`inline-flex items-center rounded-sm border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] ${getJobStatusClass(
                              job.isActive
                            )}`}
                          >
                            {job.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {formatPostedDate(job.createdAt)}
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
                    className="mt-4 inline-flex items-center justify-center rounded-sm border border-[#3b4bb8] bg-[#3b4bb8] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2e3a94]"
                  >
                    Post a Job
                  </Link>
                </div>
              )}
            </section>

            {/* Recent Activity */}
            <section className={cardClass}>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-5">
                <h2 className={sectionTitleClass}>Recent Activity</h2>
              </div>

              <div className="p-6">
                {isActivityLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="flex items-start gap-3 animate-pulse">
                        <div className="h-10 w-10 rounded-sm bg-slate-200" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-4/5 rounded bg-slate-200" />
                          <div className="h-2.5 w-2/5 rounded bg-slate-200" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentActivity.length === 0 ? (
                  <div className="rounded-sm border border-dashed border-slate-300 dark:border-slate-700 px-5 py-8 text-center">
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
                            className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm ${meta.wrapperClass}`}
                              >
                                {meta.icon}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium leading-5 text-slate-900 dark:text-slate-100">
                                  {activity.title}
                                </p>
                                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                  {activity.description}
                                </p>

                                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                                  <span className="text-slate-500 dark:text-slate-400">
                                    {formatActivityTime(activity.createdAt)}
                                  </span>

                                  {activity.relatedJobId && (
                                    <Link
                                      to={`/recruiter/jobs/${activity.relatedJobId}/applications`}
                                      className="font-medium text-[#3b4bb8] hover:text-[#2e3a94]"
                                    >
                                      View
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {activityTotalPages > 1 && (
                      <div className="mt-5 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4">
                        <button
                          type="button"
                          onClick={() => setActivityPage((prev) => Math.max(1, prev - 1))}
                          disabled={activityPage <= 1}
                          className="inline-flex items-center gap-1.5 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M15 19l-7-7 7-7" />
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
                          className="inline-flex items-center gap-1.5 rounded-sm border border-[#3b4bb8] bg-[#3b4bb8] px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-[#2e3a94] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Next
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
          </div>

          {/* Right column */}
          <aside className="space-y-6">
            {/* Quick Actions */}
            <section className={cardClass}>
              <div className="border-b border-slate-200 dark:border-slate-800 px-5 py-4">
                <h2 className={sectionLabelClass}>Quick Actions</h2>
              </div>

              <div className="space-y-3 p-5">
                <Link
                  to="/recruiter/post-job"
                  className="flex items-center justify-between rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Post New Job
                  </span>
                  <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <Link
                  to="/recruiter/manage-jobs"
                  className="flex items-center justify-between rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Manage Jobs
                  </span>
                  <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <div className="rounded-sm border border-[#2f3e9e] bg-[#2f3e9e] px-4 py-4 text-white">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-indigo-200">
                    Recruiting Tip
                  </p>
                  <p className="mt-2 text-sm leading-6 text-indigo-50">
                    Responding to strong applicants quickly usually improves conversion and reduces drop-off.
                  </p>
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