import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout, LoadingSpinner, EmptyState } from '../../components';
import { useJob, useJobApplications, useUpdateApplicationStatus } from '../../hooks';
import { toast } from 'react-toastify';

interface Applicant {
  _id: string;
  name: string;
  fullName?: string;
  email: string;
  number?: string;
  phone?: string;
  resume?: string;
  jobSeeker?: {
    title?: string;
    skills?: string[];
    resumeUrl?: string;
  };
}

const JobApplications: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const { data: jobData, isLoading: jobLoading } = useJob(jobId || '');
  const { data: applicationsData, isLoading: applicationsLoading } = useJobApplications(jobId || '');
  const updateStatusMutation = useUpdateApplicationStatus();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const job = jobData?.data;
  const applications = applicationsData?.data || [];

  // Filter applications
  const filteredApplications = applications.filter(app => {
    const applicant = typeof app.applicant === 'object' ? app.applicant as Applicant : null;
    const matchesSearch = 
      (applicant?.fullName || applicant?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (applicationId: string, status: 'applied' | 'shortlisted' | 'interview' | 'rejected') => {
    try {
      await updateStatusMutation.mutateAsync({ applicationId, status });
      toast.success(`Application status updated to ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-100 text-blue-700';
      case 'shortlisted':
        return 'bg-green-100 text-green-700';
      case 'interview':
        return 'bg-purple-100 text-purple-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate AI match scores (mock)
  const getAIMatchScore = () => Math.floor(Math.random() * 25) + 75;

  if (jobLoading || applicationsLoading) {
    return (
      <DashboardLayout variant="recruiter" title="Job Applications">
        <LoadingSpinner text="Loading applications..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout variant="recruiter" title="Job Applications">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/recruiter/manage-jobs"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-4"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Jobs
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{job?.title || 'Job'} - Applications</h1>
          <p className="text-gray-600 mt-1">
            {job?.companyName} • {job?.location} • {applications.length} applicant{applications.length !== 1 ? 's' : ''}
          </p>
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
                placeholder="Search by name or email..."
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
              <option value="applied">Applied</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview">Interview</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {filteredApplications.length === 0 ? (
          <EmptyState
            title={applications.length === 0 ? "No applications yet" : "No matching applications"}
            description={
              applications.length === 0
                ? "Candidates will appear here once they apply for this job."
                : "Try adjusting your search or filter criteria."
            }
            action={
              applications.length > 0 && (
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
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Candidate</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Skills</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Applied Date</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">AI Match</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredApplications.map((application) => {
                    const applicant = typeof application.applicant === 'object' 
                      ? application.applicant as Applicant 
                      : null;
                    const aiMatch = getAIMatchScore();
                    
                    return (
                      <tr key={application._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                              <span className="text-indigo-600 font-medium">
                                {(applicant?.fullName || applicant?.name || 'U').charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{applicant?.fullName || applicant?.name || 'Unknown'}</div>
                              <div className="text-sm text-gray-500">{applicant?.email || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {applicant?.jobSeeker?.skills?.slice(0, 3).map((skill, index) => (
                              <span
                                key={index}
                                className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                              >
                                {skill}
                              </span>
                            ))}
                            {(applicant?.jobSeeker?.skills?.length || 0) > 3 && (
                              <span className="text-gray-400 text-xs">
                                +{(applicant?.jobSeeker?.skills?.length || 0) - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {formatDate(application.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            aiMatch >= 85 
                              ? 'bg-green-100 text-green-700' 
                              : aiMatch >= 75 
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {aiMatch}%
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={application.status}
                            onChange={(e) => handleStatusChange(application._id, e.target.value as 'applied' | 'shortlisted' | 'rejected')}
                            className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${getStatusColor(application.status)}`}
                          >
                            <option value="applied">Applied</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="interview">Interview</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/recruiter/candidate/${applicant?._id}?jobId=${jobId}`}
                              className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                            >
                              View Profile
                            </Link>
                            {applicant?.jobSeeker?.resumeUrl && (
                              <a
                                href={applicant.jobSeeker.resumeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-500 hover:text-gray-700"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </a>
                            )}
                          </div>
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
              <p className="text-sm text-gray-500">Total Applicants</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {applications.filter(a => a.status === 'applied').length}
              </p>
              <p className="text-sm text-gray-500">Pending Review</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {applications.filter(a => a.status === 'shortlisted').length}
              </p>
              <p className="text-sm text-gray-500">Shortlisted</p>
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

export default JobApplications;
