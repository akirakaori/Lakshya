import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout, LoadingSpinner } from '../../components';
import { useAuth } from '../../context/auth-context';
import { useMyApplications, useSavedJobs } from '../../hooks';
import { getStatusLabel } from '../../utils/applicationStatus';
import { getInterviewDisplayStatus } from '../../utils/interview-status';
import type { Application, Interview, Job } from '../../services';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};


const getDashboardStatusClass = (status: string) => {
  switch (status) {
    case 'applied':
      return 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100';
    case 'shortlisted':
      return 'border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100';
    case 'interview':
      return 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100';
    case 'offer':
      return 'border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100';
    case 'hired':
      return 'border border-green-200 bg-green-50 text-green-700 hover:bg-green-100';
    case 'withdrawn':
    case 'rejected':
      return 'border border-red-200 bg-red-50 text-red-600 hover:bg-red-100';
    default:
      return 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100';
  }
};

const JobSeekerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeRecentId, setActiveRecentId] = useState<string | null>(null);

  const { data: recentApplicationsResponse, isLoading: recentApplicationsLoading } = useMyApplications({
    page: 1,
    limit: 5,
  });

  const { data: totalApplicationsResponse, isLoading: totalApplicationsLoading } = useMyApplications({
    page: 1,
    limit: 1,
  });

  const { data: savedJobsResponse, isLoading: savedJobsLoading } = useSavedJobs({
    page: 1,
    limit: 1,
  });

  const { data: interviewApplicationsResponse, isLoading: interviewApplicationsLoading } = useMyApplications({
    page: 1,
    limit: 200,
    status: 'interview',
  });

  const { data: appliedStatusResponse, isLoading: appliedStatusLoading } = useMyApplications({
    page: 1,
    limit: 1,
    status: 'applied',
  });

  const { data: shortlistedStatusResponse, isLoading: shortlistedStatusLoading } = useMyApplications({
    page: 1,
    limit: 1,
    status: 'shortlisted',
  });

  const { data: interviewStatusResponse, isLoading: interviewStatusLoading } = useMyApplications({
    page: 1,
    limit: 1,
    status: 'interview',
  });

  const { data: rejectedStatusResponse, isLoading: rejectedStatusLoading } = useMyApplications({
    page: 1,
    limit: 1,
    status: 'rejected',
  });

  const { data: hiredStatusResponse, isLoading: hiredStatusLoading } = useMyApplications({
    page: 1,
    limit: 1,
    status: 'hired',
  });

  const recentApplications = useMemo<Application[]>(
    () => recentApplicationsResponse?.data ?? [],
    [recentApplicationsResponse?.data]
  );
  const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

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
    { label: 'Applied', count: appliedStatusResponse?.pagination?.total ?? 0 },
    { label: 'Shortlisted', count: shortlistedStatusResponse?.pagination?.total ?? 0 },
    { label: 'Interview', count: interviewStatusResponse?.pagination?.total ?? 0 },
    { label: 'Rejected', count: rejectedStatusResponse?.pagination?.total ?? 0 },
    { label: 'Hired', count: hiredStatusResponse?.pagination?.total ?? 0 },
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
    },
    {
      title: 'Interviews',
      value: upcomingInterviews,
      helper: upcomingInterviews === 0 ? 'No upcoming interviews scheduled' : 'Scheduled or in-progress rounds',
    },
    {
      title: 'Saved Jobs',
      value: savedJobsCount,
      helper: savedJobsCount === 0 ? 'No saved jobs yet' : 'Jobs bookmarked for later',
    },
    {
      title: 'Hired',
      value: hiredStatusResponse?.pagination?.total ?? 0,
      helper:
        (hiredStatusResponse?.pagination?.total ?? 0) === 0
          ? 'No hired applications yet'
          : 'Successful applications',
    },
  ];

  return (
    <DashboardLayout variant="job-seeker" title="Dashboard">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
  <div>
    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
      {today}
    </p>
    <h1 className="mt-1.5 text-[26px] font-semibold tracking-tight text-slate-900">
      {user?.name ? `Good to see you, ${user.name.split(' ')[0]}.` : 'My Dashboard'}
    </h1>
    <p className="mt-1 text-sm text-slate-500">
      Here's an overview of your job search activity.
    </p>
  </div>

  <Link
    to="/job-seeker/browse-jobs"
    className="inline-flex h-10 items-center gap-1.5 border border-[#3b4bb8] bg-[#3b4bb8] px-4 text-sm font-medium text-white transition-colors hover:bg-[#2e3a94]"
  >
    Browse Jobs
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-75">
      <path d="M2.5 6.5H10.5M10.5 6.5L7.5 3.5M10.5 6.5L7.5 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </Link>
</div>

        {isLoading ? (
          <LoadingSpinner text="Loading your dashboard..." />
        ) : (
          <>
            <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map((card) => (
                <div
                  key={card.title}
                  className="border border-slate-200 bg-white px-5 py-4 transition-colors hover:bg-slate-50"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    {card.title}
                  </p>
                  <p className="mt-2 text-4xl font-semibold leading-none tracking-tight text-[#3b4bb8]">
                    {String(card.value).padStart(2, '0')}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">{card.helper}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <section className="lg:col-span-8 border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                    Recent Applications
                  </h2>
                  <Link
                    to="/job-seeker/my-applications"
                    className="text-sm font-medium text-[#3b4bb8] hover:text-[#2e3a94]"
                  >
                    View All
                  </Link>
                </div>

                {recentApplications.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <p className="text-sm text-slate-500">No applications yet</p>
                    <Link
                      to="/job-seeker/browse-jobs"
                      className="mt-3 inline-flex text-sm font-medium text-[#3b4bb8] hover:text-[#2e3a94]"
                    >
                      Browse Jobs
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200 overflow-visible py-2">
                    {recentApplications.map((application) => {
                      const job = typeof application.jobId === 'object' ? (application.jobId as Job) : null;
                      const isActive = activeRecentId === application._id;

                      return (
                        <div
                          key={application._id}
                          onClick={() => setActiveRecentId(isActive ? null : application._id)}
                          className={`group relative mx-2 cursor-pointer overflow-visible rounded-md border transition-all duration-200 ease-out ${
                            isActive
                              ? '-translate-y-[1px] border-blue-200 bg-white shadow-sm ring-1 ring-blue-100 z-10'
                              : 'border-transparent bg-white hover:bg-slate-50 hover:border-slate-200'
                          }`}
                        >
                          {isActive && (
                            <span className="absolute left-0 top-0 h-full w-[3px] rounded-l-md bg-[#3b4bb8]" />
                          )}

                          <div className="px-5 py-4">
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.8fr_auto_auto] md:items-center">
                              <div className="min-w-0">
                                <h3 className="truncate text-[15px] font-semibold text-slate-900">
                                  {job?.title || 'Job Title'}
                                </h3>
                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                                  <span>{job?.companyName || 'Company'}</span>
                                  {job?.location && <span>{job.location}</span>}
                                </div>
                              </div>

                              <div className="text-sm text-slate-500">
                                Applied {formatDate(application.createdAt)}
                              </div>

                              <div>
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 text-[11px] font-medium transition-colors ${getDashboardStatusClass(
                                    application.status
                                  )}`}
                                >
                                  {getStatusLabel(application.status)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <aside className="lg:col-span-4 space-y-6">
                <section className="border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                      Pipeline Status
                    </h2>
                  </div>

                  <div className="space-y-3 p-4">
                    {statusSummary.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between border border-slate-200 bg-white px-4 py-3 transition-colors hover:bg-slate-50"
                      >
                        <span className="text-sm font-medium text-slate-700">{item.label}</span>
                        <span className="inline-flex min-w-[36px] items-center justify-center border border-slate-200 bg-slate-50 px-2 py-1 text-sm font-semibold text-slate-700">
                          {String(item.count).padStart(2, '0')}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                      Quick Actions
                    </h2>
                  </div>

                  <div className="space-y-3 p-4">
                    <Link
                      to="/job-seeker/browse-jobs"
                      className="flex items-center justify-between border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <span>Browse Jobs</span>
                    </Link>

                    <Link
                      to="/job-seeker/my-applications"
                      className="flex items-center justify-between border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <span>My Applications</span>
                    </Link>

                    <Link
                      to="/job-seeker/saved-jobs"
                      className="flex items-center justify-between border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <span>Saved Jobs</span>
                    </Link>

                    <Link
                      to="/job-seeker/profile"
                      className="flex items-center justify-between border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <span>Update Profile</span>
                    </Link>
                  </div>
                </section>

                <section className="border border-slate-200 bg-[#3b4bb8] px-5 py-5 text-white">
                  <h3 className="text-base font-semibold">Improve Your Resume</h3>
                  <p className="mt-2 text-sm text-indigo-100">
                    See how your profile aligns with roles and improve your application quality.
                  </p>
                  <Link
                    to="/job-seeker/my-applications"
                    className="mt-4 inline-flex border border-white/20 bg-white px-4 py-2 text-sm font-medium text-[#3b4bb8] hover:bg-slate-100"
                  >
                    Go to Applications
                  </Link>
                </section>
              </aside>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default JobSeekerDashboard;