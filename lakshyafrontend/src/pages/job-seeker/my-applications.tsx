import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout, LoadingSpinner, EmptyState } from '../../components';
import { useMyApplications, useJobMatchScores } from '../../hooks';
import type { Job, Interview } from '../../services';
import { getStatusLabel, getStatusBadgeClass } from '../../utils/applicationStatus';

const MyApplications: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'applied' | 'shortlisted' | 'interview' | 'rejected'>('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);

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

  // Debug: Log when applications data updates
  React.useEffect(() => {
    console.log('📊 My Applications data updated - Count:', applications.length);
  }, [applications.length]);

  // Extract all job IDs for batch match score fetch
  const jobIds = useMemo(() => {
    return applications
      .map(app => {
        const job = typeof app.jobId === 'object' ? app.jobId as Job : null;
        return typeof app.jobId === 'string' ? app.jobId : job?._id;
      })
      .filter((id): id is string => !!id);
  }, [applications]);

  // Fetch match scores for all jobs in batch
  const { data: matchScoresResponse } = useJobMatchScores(jobIds.length > 0 ? jobIds : undefined);
  const matchScores = matchScoresResponse?.data || {};

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
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Status</th>                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Interview</th>                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">AI Match</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {applications.map((application) => {
                    const job = typeof application.jobId === 'object' ? application.jobId as Job : null;
                    const jobId = typeof application.jobId === 'string' ? application.jobId : job?._id;
                    
                    // Get real match score from cached data
                    const matchData = jobId ? matchScores[jobId] : null;
                    const hasMatchScore = matchData?.matchScore !== null && matchData?.matchScore !== undefined;
                    
                    // Check if job is deleted or inactive
                    const isJobInactive = job?.isDeleted || (job && !job.isActive);

                    // Get interview info (safely cast)
                    const appWithInterviews = application as any;
                    const interviews = (appWithInterviews.interviews || []) as Interview[];
                    const hasInterviews = interviews.length > 0;
                    const isExpanded = expandedAppId === application._id;
                    
                    return (
                      <React.Fragment key={application._id}>
                        <tr className="hover:bg-gray-50">
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
                            {hasInterviews ? (
                              <button
                                onClick={() => setExpandedAppId(isExpanded ? null : application._id)}
                                className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {interviews.length} Round{interviews.length > 1 ? 's' : ''}
                                <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {hasMatchScore ? (
                              <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                                {matchData.matchScore}%
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
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
                        
                        {/* Expandable Interview Details Row */}
                        {isExpanded && hasInterviews && (
                          <tr>
                            <td colSpan={7} className="px-6 py-4 bg-gray-50">
                              <div className="space-y-3">
                                <h4 className="font-semibold text-gray-900 text-sm">Interview Schedule</h4>
                                {interviews.map((interview: Interview, idx: number) => (
                                  <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                                          Round {interview.roundNumber}
                                        </span>
                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs capitalize">
                                          {interview.mode}
                                        </span>
                                      </div>
                                      {interview.outcome && (
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                          interview.outcome === 'pass' ? 'bg-green-100 text-green-700' :
                                          interview.outcome === 'fail' ? 'bg-red-100 text-red-700' :
                                          interview.outcome === 'hold' ? 'bg-yellow-100 text-yellow-700' :
                                          'bg-gray-100 text-gray-600'
                                        }`}>
                                          {interview.outcome === 'pending' ? 'Scheduled' : interview.outcome}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-sm space-y-2">
                                      <div className="flex items-center gap-2 text-gray-700">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="font-medium">
                                          {new Date(interview.date).toLocaleDateString('en-US', { 
                                            weekday: 'long',
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                          })}
                                        </span>
                                      </div>
                                      {interview.time && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          <span>{interview.time} {interview.timezone && `(${interview.timezone})`}</span>
                                        </div>
                                      )}
                                      {interview.linkOrLocation && (
                                        <div className="flex items-start gap-2 text-gray-600">
                                          <svg className="w-4 h-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            {interview.mode === 'online' ? (
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                            ) : (
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            )}
                                          </svg>
                                          <div>
                                            {interview.mode === 'online' ? (
                                              <a href={interview.linkOrLocation} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all">
                                                {interview.linkOrLocation}
                                              </a>
                                            ) : (
                                              <span className="break-words">{interview.linkOrLocation}</span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                      {interview.messageToCandidate && (
                                        <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                          <p className="font-medium text-blue-900 text-xs mb-1">Message from Recruiter:</p>
                                          <p className="text-blue-700 text-sm">{interview.messageToCandidate}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
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
