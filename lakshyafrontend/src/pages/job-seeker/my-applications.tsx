import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout, LoadingSpinner, EmptyState } from '../../components';
import { useMyApplications } from '../../hooks';
import type { Job } from '../../services';
import { getStatusLabel, getStatusBadgeClass } from '../../utils/applicationStatus';

// Helper function to generate deterministic AI match score from jobId
const calculateAIMatch = (jobId: string): number => {
  let hash = 0;
  for (let i = 0; i < jobId.length; i++) {
    const char = jobId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Map hash to 75-99 range
  return 75 + (Math.abs(hash) % 25);
};

const MyApplications: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'applied' | 'shortlisted' | 'interview' | 'rejected'>('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch applications with backend filtering
  const { data: response, isLoading } = useMyApplications({
    q: debouncedSearch,
    status: statusFilter,
    page: 1,
    limit: 100,
  });

  const applications = response?.data || [];

  // Calculate stats
  const stats = useMemo(() => {
    const allApps = applications;
    return {
      total: allApps.length,
      pending: allApps.filter(a => a.status === 'applied').length,
      shortlisted: allApps.filter(a => a.status === 'shortlisted').length,
      interview: allApps.filter(a => a.status === 'interview').length,
      rejected: allApps.filter(a => a.status === 'rejected').length,
    };
  }, [applications]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <DashboardLayout variant="job-seeker" title="My Applications">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
          <p className="text-gray-600 mt-1">Track the status of all your job applications in one place.</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="applied">Pending</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview">Interview</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner text="Loading your applications..." />
        ) : applications.length === 0 ? (
          <EmptyState
            title={statusFilter === 'all' && !debouncedSearch ? "No applications yet" : "No matching applications"}
            description={
              statusFilter === 'all' && !debouncedSearch
                ? "Start applying to jobs to see your applications here."
                : "Try adjusting your search or filter criteria."
            }
            action={
              statusFilter === 'all' && !debouncedSearch ? (
                <Link
                  to="/job-seeker/browse-jobs"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Browse Jobs
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Clear Filters
                </button>
              )
            }
          />
        ) : (
          /* Applications Table */
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Job Title</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Company</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Applied Date</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">AI Match</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {applications.map((application) => {
                    const job = typeof application.jobId === 'object' ? application.jobId as Job : null;
                    const jobId = typeof application.jobId === 'string' ? application.jobId : job?._id;
                    const aiMatchScore = jobId ? calculateAIMatch(jobId) : 80;
                    
                    // Check if job is deleted or inactive
                    const isJobInactive = job?.isDeleted || (job && !job.isActive);
                    
                    return (
                      <tr key={application._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">{job?.title || 'Job Title'}</div>
                            {isJobInactive && (
                              <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Job Removed
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{job?.companyName || 'Company'}</td>
                        <td className="px-6 py-4 text-gray-600">{formatDate(application.createdAt)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(application.status)}`}>
                            {getStatusLabel(application.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                            {aiMatchScore}%
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {job && jobId && (
                            <Link
                              to={`/job-seeker/jobs/${jobId}`}
                              className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                            >
                              View Job
                            </Link>
                          )}
                          {!job && (
                            <span className="text-gray-400 text-sm">N/A</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stats Summary */}
        {stats.total > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Applications</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.interview}</p>
              <p className="text-sm text-gray-500">Interview</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              <p className="text-sm text-gray-500">Rejected</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyApplications;
