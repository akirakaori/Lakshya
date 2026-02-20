import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout, LoadingSpinner, EmptyState } from '../../components';
import { 
  useRecruiterJobApplications, 
  useUpdateRecruiterApplicationStatus,
  useBulkUpdateApplicationStatus
} from '../../hooks';
import { toast } from 'react-toastify';
import { getFileUrl, getInitials } from '../../utils';
import type { RecruiterApplication } from '../../services';

interface Applicant {
  _id: string;
  name?: string;
  fullName?: string;
  email: string;
  number?: string;
  phone?: string;
  profileImageUrl?: string;
  jobSeeker?: {
    title?: string;
    skills?: string[];
    resumeUrl?: string;
  };
}

const JobApplications: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  
  // State
  const [activeTab, setActiveTab] = useState<'all' | 'applied' | 'shortlisted' | 'interview' | 'rejected'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'match' | 'experience'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  const [viewingNotes, setViewingNotes] = useState<{ id: string; notes: string; applicantName: string } | null>(null);
  const [viewingDetails, setViewingDetails] = useState<RecruiterApplication | null>(null);
  
  // Advanced filters
  const [minScore, setMinScore] = useState<number>(0);
  const [mustHaveSkill, setMustHaveSkill] = useState('');
  const [missingSkill, setMissingSkill] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Debounce search input for better performance
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Queries and mutations
  const { data, isLoading } = useRecruiterJobApplications(jobId || '', {
    status: activeTab,
    sort: sortBy,
    search: debouncedSearch,
    minScore: minScore || undefined,
    mustHave: mustHaveSkill || undefined,
    missing: missingSkill || undefined
  });
  
  const updateStatusMutation = useUpdateRecruiterApplicationStatus();
  const bulkUpdateMutation = useBulkUpdateApplicationStatus(jobId || '');

  const job = data?.data?.job;
  const counts = data?.data?.counts || { applied: 0, shortlisted: 0, interview: 0, rejected: 0, total: 0 };
  const applications = data?.data?.applications || [];

  // Handlers
  const handleSelectAll = () => {
    if (selectedApplications.size === applications.length) {
      setSelectedApplications(new Set());
    } else {
      setSelectedApplications(new Set(applications.map((app: RecruiterApplication) => app._id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedApplications);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedApplications(newSet);
  };

  const handleBulkStatusUpdate = async (status: 'applied' | 'shortlisted' | 'interview' | 'rejected') => {
    if (selectedApplications.size === 0) {
      toast.error('Please select at least one application');
      return;
    }

    try {
      const result = await bulkUpdateMutation.mutateAsync({
        applicationIds: Array.from(selectedApplications),
        status
      });
      toast.success(`${result.data.modifiedCount} application(s) updated to ${result.data.status}`);
      setSelectedApplications(new Set());
    } catch {
      toast.error('Failed to update applications');
    }
  };

  const clearFilters = () => {
    setMinScore(0);
    setMustHaveSkill('');
    setMissingSkill('');
    setSearchQuery('');
  };

  const activeFilterCount = 
    (minScore > 0 ? 1 : 0) + 
    (mustHaveSkill ? 1 : 0) + 
    (missingSkill ? 1 : 0);

  const handleStatusChange = async (applicationId: string, status: 'applied' | 'shortlisted' | 'interview' | 'rejected') => {
    try {
      await updateStatusMutation.mutateAsync({ applicationId, status });
      toast.success('Status updated successfully');
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

  if (isLoading) {
    return (
      <DashboardLayout variant="recruiter" title="Applications">
        <LoadingSpinner text="Loading applications..." />
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout variant="recruiter" title="Applications">
        <EmptyState 
          title="Job not found" 
          description="The job you're looking for doesn't exist or you don't have access to it."
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout variant="recruiter" title="Applications">
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
          <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
          <p className="text-gray-600 mt-1">{job.companyName}</p>
        </div>

        {/* Tabs with Counts */}
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              {[
                { key: 'all', label: 'All', count: counts.total },
                { key: 'applied', label: 'Applied', count: counts.applied },
                { key: 'shortlisted', label: 'Shortlisted', count: counts.shortlisted },
                { key: 'interview', label: 'Interview', count: counts.interview },
                { key: 'rejected', label: 'Rejected', count: counts.rejected },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key as typeof activeTab);
                    setSelectedApplications(new Set());
                  }}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    activeTab === tab.key ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Toolbar */}
          <div className="p-4 space-y-4">
            {/* Primary Controls */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Search and Sort */}
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-md">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 font-medium whitespace-nowrap">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="match">Highest Match Score</option>
                  <option value="experience">Most Experience</option>
                </select>
              </div>
            </div>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`px-4 py-1.5 border rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                  showAdvancedFilters || activeFilterCount > 0
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Match Filters
              {activeFilterCount > 0 && (
                <span className="bg-indigo-600 text-white px-1.5 py-0.5 rounded-full text-xs">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Match Score
                  </label>
                  <select
                    value={minScore}
                    onChange={(e) => setMinScore(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="0">No minimum</option>
                    <option value="50">≥ 50%</option>
                    <option value="60">≥ 60%</option>
                    <option value="70">≥ 70%</option>
                    <option value="80">≥ 80%</option>
                    <option value="90">≥ 90%</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Must Have Skill
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., React, Python"
                    value={mustHaveSkill}
                    onChange={(e) => setMustHaveSkill(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Missing Skill
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Docker, AWS"
                    value={missingSkill}
                    onChange={(e) => setMissingSkill(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              {activeFilterCount > 0 && (
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Bulk Actions */}
          {selectedApplications.size > 0 && (
            <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-lg">
              <span className="text-sm text-indigo-900 font-medium">
                {selectedApplications.size} selected
              </span>
              <div className="h-4 w-px bg-indigo-200" />
              <button
                onClick={() => handleBulkStatusUpdate('shortlisted')}
                disabled={bulkUpdateMutation.isPending}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
              >
                Shortlist
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('interview')}
                disabled={bulkUpdateMutation.isPending}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
              >
                Interview
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('rejected')}
                disabled={bulkUpdateMutation.isPending}
                className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={() => setSelectedApplications(new Set())}
                className="text-sm text-gray-600 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
          )}
        </div>
        </div>

        {/* Applications List */}
        {applications.length === 0 ? (
          <EmptyState
            title={activeTab === 'all' ? "No applications yet" : `No ${activeTab} applications`}
            description={
              activeTab === 'all'
                ? "Candidates will appear here once they apply for this job."
                : `No applications in the ${activeTab} stage yet.`
            }
          />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedApplications.size === applications.length && applications.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Candidate</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Match Score</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Matched Skills</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Missing Skills</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Experience</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Applied</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {applications.map((application: RecruiterApplication) => {
                  const applicant = typeof application.applicant === 'object' 
                    ? (application.applicant as Applicant)
                    : null;
                  
                  const avatarUrl = applicant?.profileImageUrl ? getFileUrl(applicant.profileImageUrl) : null;
                  const initials = applicant ? getInitials(applicant.fullName || applicant.name || 'U') : 'U';
                  const isSelected = selectedApplications.has(application._id);

                  return (
                    <React.Fragment key={application._id}>
                      <tr className={`hover:bg-gray-50 ${isSelected ? 'bg-indigo-50' : ''}`}>
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectOne(application._id)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            {avatarUrl ? (
                              <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                <span className="text-indigo-600 font-medium text-sm">{initials}</span>
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">
                                {applicant?.fullName || applicant?.name || 'Unknown'}
                              </div>
                              <div className="text-sm text-gray-500">{applicant?.email}</div>
                              {applicant?.jobSeeker?.title && (
                                <div className="text-xs text-gray-400">{applicant.jobSeeker.title}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            (application.matchScore || 0) >= 85 
                              ? 'bg-green-100 text-green-700' 
                              : (application.matchScore || 0) >= 70
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {application.matchScore || 0}%
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {application.matchedSkills?.slice(0, 2).map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs"
                              >
                                {skill}
                              </span>
                            ))}
                            {(application.matchedSkills?.length || 0) > 2 && (
                              <span className="text-xs text-green-600 font-medium">
                                +{(application.matchedSkills?.length || 0) - 2}
                              </span>
                            )}
                            {!application.matchedSkills || application.matchedSkills.length === 0 && (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {application.missingSkills?.slice(0, 2).map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs"
                              >
                                {skill}
                              </span>
                            ))}
                            {(application.missingSkills?.length || 0) > 2 && (
                              <span className="text-xs text-red-600 font-medium">
                                +{(application.missingSkills?.length || 0) - 2}
                              </span>
                            )}
                            {!application.missingSkills || application.missingSkills.length === 0 && (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {application.experienceYears || 0} yrs
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {formatDate(application.createdAt)}
                        </td>
                        <td className="px-4 py-4">
                          <select
                            value={application.status}
                            onChange={(e) => handleStatusChange(
                              application._id, 
                              e.target.value as 'applied' | 'shortlisted' | 'interview' | 'rejected'
                            )}
                            disabled={updateStatusMutation.isPending}
                            className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${getStatusColor(application.status)} disabled:opacity-50`}
                          >
                            <option value="applied">Applied</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="interview">Interview</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setViewingDetails(application)}
                              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                            >
                              Details
                            </button>
                            <Link
                              to={`/recruiter/candidate/${applicant?._id}?jobId=${jobId}`}
                              className="text-gray-600 hover:text-gray-700 text-sm font-medium"
                            >
                              Profile
                            </Link>
                            {applicant?.jobSeeker?.resumeUrl && (
                              <a
                                href={getFileUrl(applicant.jobSeeker.resumeUrl) || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 hover:text-gray-700"
                                title="View Resume"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Application Details Drawer */}
        {viewingDetails && (() => {
          const applicant = typeof viewingDetails.applicant === 'object' 
            ? (viewingDetails.applicant as Applicant)
            : null;
          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-indigo-700">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {applicant?.fullName || applicant?.name || 'Candidate'}
                    </h3>
                    <p className="text-sm text-indigo-100">{applicant?.email}</p>
                  </div>
                  <button
                    onClick={() => setViewingDetails(null)}
                    className="text-white hover:text-indigo-100"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-180px)]">
                  {/* Match Score Summary */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
                      <div className="text-sm text-indigo-600 font-medium mb-1">Match Score</div>
                      <div className="text-2xl font-bold text-indigo-900">{viewingDetails.matchScore || 0}%</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                      <div className="text-sm text-green-600 font-medium mb-1">Matched Skills</div>
                      <div className="text-2xl font-bold text-green-900">{viewingDetails.matchedSkills?.length || 0}</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                      <div className="text-sm text-orange-600 font-medium mb-1">Missing Skills</div>
                      <div className="text-2xl font-bold text-orange-900">{viewingDetails.missingSkills?.length || 0}</div>
                    </div>
                  </div>

                  {/* Matched Skills */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Matched Skills
                    </h4>
                    {viewingDetails.matchedSkills && viewingDetails.matchedSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {viewingDetails.matchedSkills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No matched skills recorded</p>
                    )}
                  </div>

                  {/* Missing Skills */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Missing Skills
                    </h4>
                    {viewingDetails.missingSkills && viewingDetails.missingSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {viewingDetails.missingSkills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No missing skills recorded</p>
                    )}
                  </div>

                  {/* Additional Info */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Experience</div>
                      <div className="text-lg font-semibold text-gray-900">{viewingDetails.experienceYears || 0} years</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Applied On</div>
                      <div className="text-lg font-semibold text-gray-900">{formatDate(viewingDetails.createdAt)}</div>
                    </div>
                  </div>

                  {/* Notes */}
                  {viewingDetails.notes && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Recruiter Notes</h4>
                      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {viewingDetails.notes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Status Update */}
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Update Status</h4>
                    <div className="flex gap-2">
                      {['shortlisted', 'interview', 'rejected'].map((status) => (
                        <button
                          key={status}
                          onClick={() => {
                            handleStatusChange(
                              viewingDetails._id, 
                              status as 'shortlisted' | 'interview' | 'rejected'
                            );
                            setViewingDetails(null);
                          }}
                          disabled={viewingDetails.status === status}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            viewingDetails.status === status
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : status === 'rejected'
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-200 flex justify-between bg-gray-50">
                  <Link
                    to={`/recruiter/candidate/${applicant?._id}?jobId=${jobId}`}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                  >
                    View Full Profile
                  </Link>
                  <button
                    onClick={() => setViewingDetails(null)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </DashboardLayout>
  );
};

export default JobApplications;
