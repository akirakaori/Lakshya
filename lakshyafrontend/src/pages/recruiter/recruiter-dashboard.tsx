import React from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout, LoadingSpinner, StatsCard, EmptyState } from '../../components';
import { useMyJobs } from '../../hooks';
import { useAuth } from '../../context/auth-context';

const RecruiterDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: jobsData, isLoading } = useMyJobs();
  const jobs = jobsData?.data || [];

  // Calculate stats
  const activeJobs = jobs.filter(job => job.isActive !== false).length;
  const totalJobs = jobs.length;
  
  // Get applications count - this is simplified, ideally we'd fetch aggregate data
  const recentJobs = jobs.slice(0, 5);

  if (isLoading) {
    return (
      <DashboardLayout variant="recruiter" title="Dashboard">
        <LoadingSpinner text="Loading your dashboard..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout variant="recruiter" title="Dashboard">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8 overflow-hidden rounded-[1.75rem] border border-white/70 bg-[linear-gradient(135deg,_rgba(15,118,110,0.95),_rgba(5,150,105,0.92)_52%,_rgba(59,130,246,0.82)_100%)] px-6 py-8 text-white shadow-[0_24px_70px_rgba(16,185,129,0.16)] dark:border-slate-800/80">
          <h1 className="text-2xl font-bold text-white">Welcome back, {user?.fullName || user?.name?.split(' ')[0] || 'Recruiter'}!</h1>
          <p className="mt-2 max-w-2xl text-sm text-emerald-50">Here's an overview of your recruitment activity.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Job Posts"
            value={totalJobs}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
            color="blue"
          />
          <StatsCard
            title="Active Jobs"
            value={activeJobs}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="green"
          />
          <StatsCard
            title="Total Applications"
            value={0}
            trend="+12% vs last week"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            color="purple"
          />
          <StatsCard
            title="Shortlisted"
            value={0}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            }
            color="yellow"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8 rounded-[1.5rem] border border-white/15 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white shadow-[0_18px_60px_rgba(79,70,229,0.24)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">Ready to find your next great hire?</h2>
              <p className="text-indigo-100">Post a new job and reach thousands of qualified candidates.</p>
            </div>
            <Link
              to="/recruiter/post-job"
            className="mt-4 inline-flex items-center rounded-xl bg-white px-6 py-3 font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 md:mt-0 dark:bg-slate-950 dark:text-indigo-300 dark:hover:bg-slate-900"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Post New Job
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Job Posts */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-sm dark:border-slate-800 dark:bg-slate-900/95">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Recent Job Posts</h2>
                <Link
                  to="/recruiter/manage-jobs"
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  View All
                </Link>
              </div>
              {recentJobs.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {recentJobs.map((job) => (
                    <div key={job._id} className="p-6 hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-950">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-slate-100">{job.title}</h3>
                          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
                            {job.location} • {job.type}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          job.isActive 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300'
                        }`}>
                          {job.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-4 text-sm">
                        <span className="text-gray-500 dark:text-slate-400">
                          Posted {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                        <Link
                          to={`/recruiter/jobs/${job._id}/applications`}
                          className="text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          View Applications
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No job posts yet"
                  description="Start recruiting by posting your first job."
                  action={
                    <Link
                      to="/recruiter/post-job"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Post a Job
                    </Link>
                  }
                />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="rounded-2xl border border-white/70 bg-white/95 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/95">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-slate-100">New application received</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Just now</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-slate-100">Job post approved</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-slate-100">Profile viewed</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Yesterday</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="rounded-2xl border border-white/70 bg-white/95 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/95">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Recruiting Tips</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <p className="text-sm text-gray-600 dark:text-slate-300">Write clear, detailed job descriptions</p>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <p className="text-sm text-gray-600 dark:text-slate-300">Respond to applications within 48 hours</p>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <p className="text-sm text-gray-600 dark:text-slate-300">Use AI matching to find the best candidates</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RecruiterDashboard;

