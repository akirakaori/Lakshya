import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout, LoadingSpinner } from '../../components';
import { useAuth } from '../../context/auth-context';
import { useMyApplications, useSavedJobs } from '../../hooks';
import { getStatusBadgeClass, getStatusLabel } from '../../utils/applicationStatus';
import { getInterviewDisplayStatus } from '../../utils/interview-status';
import type { Application, Interview, Job } from '../../services';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const JobSeekerDashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: recentApplicationsResponse, isLoading: recentApplicationsLoading } = useMyApplications({ page: 1, limit: 5 });
  const { data: totalApplicationsResponse, isLoading: totalApplicationsLoading } = useMyApplications({ page: 1, limit: 1 });
  const { data: savedJobsResponse, isLoading: savedJobsLoading } = useSavedJobs({ page: 1, limit: 1 });

  const { data: interviewApplicationsResponse, isLoading: interviewApplicationsLoading } = useMyApplications({
    page: 1,
    limit: 200,
    status: 'interview',
  });

  const { data: appliedStatusResponse, isLoading: appliedStatusLoading } = useMyApplications({ page: 1, limit: 1, status: 'applied' });
  const { data: shortlistedStatusResponse, isLoading: shortlistedStatusLoading } = useMyApplications({ page: 1, limit: 1, status: 'shortlisted' });
  const { data: interviewStatusResponse, isLoading: interviewStatusLoading } = useMyApplications({ page: 1, limit: 1, status: 'interview' });
  const { data: rejectedStatusResponse, isLoading: rejectedStatusLoading } = useMyApplications({ page: 1, limit: 1, status: 'rejected' });
  const { data: hiredStatusResponse, isLoading: hiredStatusLoading } = useMyApplications({ page: 1, limit: 1, status: 'hired' });

  const recentApplications = useMemo<Application[]>(() => recentApplicationsResponse?.data ?? [], [recentApplicationsResponse?.data]);

  const totalApplications = totalApplicationsResponse?.pagination?.total ?? 0;
  const savedJobsCount = savedJobsResponse?.pagination?.total ?? 0;

  const upcomingInterviews = useMemo(() => {
    const applications = interviewApplicationsResponse?.data ?? [];

    return applications.reduce((count, application) => {
      const interviews = (application.interviews || []) as Interview[];

      const upcomingInApplication = interviews.filter((interview) => {
        const status = getInterviewDisplayStatus(interview);
        return status === 'scheduled' || status === 'in_progress';
      }).length;

      return count + upcomingInApplication;
    }, 0);
  }, [interviewApplicationsResponse?.data]);

  const statusSummary = [
    { label: 'Applied', count: appliedStatusResponse?.pagination?.total ?? 0, tone: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300' },
    { label: 'Shortlisted', count: shortlistedStatusResponse?.pagination?.total ?? 0, tone: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
    { label: 'Interview', count: interviewStatusResponse?.pagination?.total ?? 0, tone: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300' },
    { label: 'Rejected', count: rejectedStatusResponse?.pagination?.total ?? 0, tone: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' },
    { label: 'Hired', count: hiredStatusResponse?.pagination?.total ?? 0, tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
  ];

  const isLoading =
    recentApplicationsLoading ||
    totalApplicationsLoading ||
    savedJobsLoading ||
    interviewApplicationsLoading ||
    appliedStatusLoading ||
    shortlistedStatusLoading ||
    interviewStatusLoading ||
    rejectedStatusLoading ||
    hiredStatusLoading;

  const statCards = [
    {
      title: 'Applied Jobs',
      value: totalApplications,
      helper: totalApplications === 0 ? 'Start applying to track progress' : 'Total applications submitted',
      iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      iconStyle: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
    },
    {
      title: 'Saved Jobs',
      value: savedJobsCount,
      helper: savedJobsCount === 0 ? 'No saved jobs yet' : 'Jobs bookmarked for later',
      iconPath: 'M5 5v16l7-4 7 4V5a2 2 0 00-2-2H7a2 2 0 00-2 2z',
      iconStyle: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300',
    },
    {
      title: 'Upcoming Interviews',
      value: upcomingInterviews,
      helper: upcomingInterviews === 0 ? 'No upcoming interviews scheduled' : 'Scheduled or in-progress rounds',
      iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      iconStyle: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    },
  ];

  return (
    <DashboardLayout variant="job-seeker" title="Dashboard">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 overflow-hidden rounded-[1.75rem] border border-white/70 bg-[linear-gradient(135deg,_rgba(37,99,235,0.95),_rgba(79,70,229,0.92)_52%,_rgba(14,165,233,0.85)_100%)] px-6 py-8 text-white shadow-[0_24px_70px_rgba(37,99,235,0.2)] dark:border-slate-800/80">
          <h1 className="text-2xl font-bold text-white">
            Hello {user?.name?.split(' ')[0]}, ready to find your target?
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-blue-50">
            Here is your live job search overview powered by your actual profile activity.
          </p>
        </div>

        {isLoading ? (
          <LoadingSpinner text="Loading your dashboard..." />
        ) : (
          <>
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              {statCards.map((card) => (
                <div key={card.title} className="rounded-2xl border border-white/70 bg-white/95 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/95">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{card.title}</p>
                      <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-slate-100">{card.value}</p>
                      <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">{card.helper}</p>
                    </div>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${card.iconStyle}`}>
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.iconPath} />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/70 bg-white/95 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/95">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-slate-100">Recent Applications</h3>

                {recentApplications.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-gray-500 dark:text-slate-400">No applications yet</p>
                    <Link to="/job-seeker/browse-jobs" className="mt-2 inline-block font-medium text-indigo-600 hover:text-indigo-700">
                      Browse Jobs ?
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentApplications.map((application) => {
                      const job = typeof application.jobId === 'object' ? (application.jobId as Job) : null;

                      return (
                        <div key={application._id} className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0 dark:border-slate-800">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-slate-100">{job?.title || 'Job'}</h4>
                            <p className="text-sm text-gray-500 dark:text-slate-400">{job?.companyName || 'Company'}</p>
                            <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">Applied on {formatDate(application.createdAt)}</p>
                          </div>
                          <span className={`rounded px-2 py-1 text-xs font-medium ${getStatusBadgeClass(application.status)}`}>
                            {getStatusLabel(application.status)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <Link to="/job-seeker/my-applications" className="mt-4 block text-center font-medium text-indigo-600 hover:text-indigo-700">
                  View All Applications
                </Link>
              </div>

              <div className="rounded-2xl border border-white/70 bg-white/95 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/95">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-slate-100">Application Status Summary</h3>

                <div className="grid grid-cols-2 gap-3">
                  {statusSummary.map((item) => (
                    <div key={item.label} className="rounded-xl border border-gray-100 bg-slate-50/70 px-3 py-3 dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-xs text-gray-500 dark:text-slate-400">{item.label}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-xl font-bold text-gray-900 dark:text-slate-100">{item.count}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${item.tone}`}>{item.label}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <h3 className="mt-6 text-lg font-semibold text-gray-900 dark:text-slate-100">Quick Actions</h3>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Link to="/job-seeker/browse-jobs" className="rounded-lg border border-indigo-200 px-4 py-3 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-50 dark:border-indigo-500/30 dark:text-indigo-300 dark:hover:bg-indigo-500/10">
                    Browse Jobs
                  </Link>
                  <Link to="/job-seeker/my-applications" className="rounded-lg border border-indigo-200 px-4 py-3 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-50 dark:border-indigo-500/30 dark:text-indigo-300 dark:hover:bg-indigo-500/10">
                    My Applications
                  </Link>
                  <Link to="/job-seeker/saved-jobs" className="rounded-lg border border-indigo-200 px-4 py-3 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-50 dark:border-indigo-500/30 dark:text-indigo-300 dark:hover:bg-indigo-500/10">
                    Saved Jobs
                  </Link>
                  <Link to="/job-seeker/profile" className="rounded-lg border border-indigo-200 px-4 py-3 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-50 dark:border-indigo-500/30 dark:text-indigo-300 dark:hover:bg-indigo-500/10">
                    Update Profile
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default JobSeekerDashboard;
