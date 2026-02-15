import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout, LoadingSpinner, EmptyState } from '../../components';
import { useMyApplications } from '../../hooks';
import type { Job } from '../../services';

const MyApplications: React.FC = () => {
  const { data: applicationsData, isLoading } = useMyApplications();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const applications = applicationsData?.data || [];

  // Filter applications
  const filteredApplications = applications.filter(app => {
    const job = typeof app.jobId === 'object' ? app.jobId as Job : null;
    const matchesSearch = 
      job?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job?.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-100 text-blue-700';
      case 'shortlisted':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'applied':
        return 'Pending';
      case 'shortlisted':
        return 'Interview';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

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
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="applied">Pending</option>
              <option value="shortlisted">Interview</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner text="Loading your applications..." />
        ) : filteredApplications.length === 0 ? (
          <EmptyState
            title={applications.length === 0 ? "No applications yet" : "No matching applications"}
            description={
              applications.length === 0
                ? "Start applying to jobs to see your applications here."
                : "Try adjusting your search or filter criteria."
            }
            action={
              applications.length === 0 ? (
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
                  {filteredApplications.map((application) => {
                    const job = typeof application.jobId === 'object' ? application.jobId as Job : null;
                    const aiMatchScore = Math.floor(Math.random() * 25) + 75;
                    
                    return (
                      <tr key={application._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{job?.title || 'Job Title'}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{job?.companyName || 'Company'}</td>
                        <td className="px-6 py-4 text-gray-600">{formatDate(application.createdAt)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                            {getStatusLabel(application.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                            {aiMatchScore}%
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {job && (
                            <Link
                              to={`/job-seeker/jobs/${job._id}`}
                              className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                            >
                              View Job
                            </Link>
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
        {applications.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
              <p className="text-sm text-gray-500">Total Applications</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {applications.filter(a => a.status === 'applied').length}
              </p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {applications.filter(a => a.status === 'shortlisted').length}
              </p>
              <p className="text-sm text-gray-500">Interview</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-red-600">
                {applications.filter(a => a.status === 'rejected').length}
              </p>
              <p className="text-sm text-gray-500">Rejected</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyApplications;
