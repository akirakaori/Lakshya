import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout, LoadingSpinner, EmptyState } from '../../components';
import { 
  useRecruiterJobApplications, 
  useUpdateRecruiterApplicationStatus,
  useBulkUpdateApplicationStatus
} from '../../hooks';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../services/axios-instance';
import { toast } from 'react-toastify';
import { getFileUrl, getInitials } from '../../Utils';
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
  const [activeTab, setActiveTab] = useState<'all' | 'applied' | 'shortlisted' | 'interview' | 'rejected' | 'hired' | 'withdrawn'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'match' | 'experience'>('newest');
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  const [viewingDetailsId, setViewingDetailsId] = useState<string | null>(null);
  
  // Filters - input state (typing) vs applied state (API filter)
  const [searchInput, setSearchInput] = useState('');
  const [minScoreInput, setMinScoreInput] = useState<number>(0);
  const [mustHaveSkillInput, setMustHaveSkillInput] = useState('');
  const [missingSkillInput, setMissingSkillInput] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [analysisStatusInput, setAnalysisStatusInput] = useState<'all' | 'analyzed' | 'not_analyzed'>('all');
  
  // Applied filters (what triggers API refetch via React Query)
  const [appliedSearch, setAppliedSearch] = useState<string | undefined>(undefined);
  const [appliedMinScore, setAppliedMinScore] = useState<number | undefined>(undefined);
  const [appliedMustHave, setAppliedMustHave] = useState<string | undefined>(undefined);
  const [appliedMissing, setAppliedMissing] = useState<string | undefined>(undefined);
  const [appliedAnalysisStatus, setAppliedAnalysisStatus] = useState<'analyzed' | 'not_analyzed' | undefined>(undefined);
  
  // Queries and mutations
  const { data, isLoading, isFetching } = useRecruiterJobApplications(jobId || '', {
    status: activeTab,
    sort: sortBy,
    search: appliedSearch,
    minScore: appliedMinScore,
    mustHave: appliedMustHave,
    missing: appliedMissing,
    analysisStatus: appliedAnalysisStatus,
  });
  
  // Fetch application details for drawer (real-time query, not stale snapshot)
  const { data: drawerData, isLoading: drawerLoading } = useQuery({
    queryKey: ['recruiterApplication', viewingDetailsId],
    queryFn: async () => {
      if (!viewingDetailsId) return null;
      const response = await axiosInstance.get(`/recruiter/applications/${viewingDetailsId}`);
      return response.data;
    },
    enabled: !!viewingDetailsId,
    staleTime: 0, // Always fresh
  });
  
  const updateStatusMutation = useUpdateRecruiterApplicationStatus();
  const bulkUpdateMutation = useBulkUpdateApplicationStatus(jobId || '');

  const job = data?.data?.job;
  const counts = data?.data?.counts || { 
    applied: 0, 
    shortlisted: 0, 
    interview: 0, 
    rejected: 0, 
    hired: 0, 
    offer: 0, 
    withdrawn: 0,
    total: 0 
  };
  const applications = data?.data?.applications || [];

  // Handlers
  const handleSelectAll = () => {
    const selectableApplications = applications.filter((app: RecruiterApplication) => app.status !== 'withdrawn' && !app.isWithdrawn);

    if (selectedApplications.size === selectableApplications.length) {
      setSelectedApplications(new Set());
    } else {
      setSelectedApplications(new Set(selectableApplications.map((app: RecruiterApplication) => app._id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const target = applications.find((app: RecruiterApplication) => app._id === id);
    if (!target || target.status === 'withdrawn' || target.isWithdrawn) {
      return;
    }

    const newSet = new Set(selectedApplications);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedApplications(newSet);
  };

  const handleBulkStatusUpdate = async (status: 'applied' | 'shortlisted' | 'interview' | 'rejected' | 'hired' | 'offer') => {
    if (selectedApplications.size === 0) {
      toast.error('Please select at least one application');
      return;
    }

    try {
      const actionableIds = Array.from(selectedApplications).filter((id) => {
        const app = applications.find((item: RecruiterApplication) => item._id === id);
        return !!app && app.status !== 'withdrawn' && !app.isWithdrawn;
      });

      if (actionableIds.length === 0) {
        toast.error('Selected applications are withdrawn and cannot be updated');
        return;
      }

      const result = await bulkUpdateMutation.mutateAsync({
        applicationIds: actionableIds,
        status
      });
      toast.success(`${result.data.modifiedCount} application(s) updated to ${result.data.status}`);
      setSelectedApplications(new Set());
    } catch {
      toast.error('Failed to update applications');
    }
  };

  const handleApplyFilters = () => {
    // Normalize and apply all filters at once
    const safeSearch = searchInput.trim().toLowerCase();
    const safeMustHave = mustHaveSkillInput.trim().toLowerCase();
    const safeMissing = missingSkillInput.trim().toLowerCase();
    
    setAppliedSearch(safeSearch.length >= 2 ? safeSearch : undefined);
    setAppliedMinScore(minScoreInput > 0 ? minScoreInput : undefined);
    setAppliedMustHave(safeMustHave.length >= 2 ? safeMustHave : undefined);
    setAppliedMissing(safeMissing.length >= 2 ? safeMissing : undefined);

    let nextAppliedAnalysisStatus: 'analyzed' | 'not_analyzed' | undefined;
    if (analysisStatusInput === 'all') {
      nextAppliedAnalysisStatus = undefined;
    } else if (analysisStatusInput === 'analyzed') {
      nextAppliedAnalysisStatus = 'analyzed';
    } else {
      nextAppliedAnalysisStatus = 'not_analyzed';
    }

    console.log('[ApplyFilters] Applying analysis status:', nextAppliedAnalysisStatus);
    setAppliedAnalysisStatus(nextAppliedAnalysisStatus);
  };

  const clearFilters = () => {
    // Reset input states
    setSearchInput('');
    setMinScoreInput(0);
    setMustHaveSkillInput('');
    setMissingSkillInput('');
    setAnalysisStatusInput('all');
    
    // Reset applied states (triggers API refetch with no filters)
    setAppliedSearch(undefined);
    setAppliedMinScore(undefined);
    setAppliedMustHave(undefined);
    setAppliedMissing(undefined);
    setAppliedAnalysisStatus(undefined);
  };

  const activeFilterCount = 
    (appliedSearch ? 1 : 0) + 
    (appliedMinScore ? 1 : 0) + 
    (appliedMustHave ? 1 : 0) + 
    (appliedMissing ? 1 : 0) +
    (appliedAnalysisStatus ? 1 : 0);

  const handleStatusChange = async (applicationId: string, status: 'applied' | 'shortlisted' | 'interview' | 'rejected' | 'hired' | 'offer') => {
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
      case 'hired':
        return 'bg-emerald-100 text-emerald-700';
      case 'offer':
        return 'bg-teal-100 text-teal-700';
      case 'withdrawn':
        return 'bg-amber-100 text-amber-800';
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
                { key: 'withdrawn', label: 'Withdrawn', count: counts.withdrawn || 0 },
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
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleApplyFilters();
                    }
                  }}
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
                    value={minScoreInput}
                    onChange={(e) => setMinScoreInput(parseInt(e.target.value))}
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
                    value={mustHaveSkillInput}
                    onChange={(e) => setMustHaveSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleApplyFilters();
                      }
                    }}
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
                    value={missingSkillInput}
                    onChange={(e) => setMissingSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleApplyFilters();
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Analysis Status
                  </label>
                  <select
                    value={analysisStatusInput}
                    onChange={(e) => {
                      const next = e.target.value as 'all' | 'analyzed' | 'not_analyzed';
                      console.log('[AnalysisStatusInput] Changed to:', next);
                      setAnalysisStatusInput(next);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">All</option>
                    <option value="analyzed">Analyzed Only</option>
                    <option value="not_analyzed">Not Analyzed</option>
                  </select>
                </div>
              </div>
              <div className="mt-3 flex justify-end gap-3">
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={handleApplyFilters}
                  className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 font-medium rounded-lg shadow-sm"
                >
                  Apply Filters
                </button>
              </div>
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
                onClick={() => handleBulkStatusUpdate('hired')}
                disabled={bulkUpdateMutation.isPending}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50"
              >
                Hire
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('offer')}
                disabled={bulkUpdateMutation.isPending}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium disabled:opacity-50"
              >
                Offer
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

        {/* Filtering Indicator */}
        {isFetching && !isLoading && (
          <div className="mb-4 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center gap-2">
            <svg className="animate-spin h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-indigo-700 font-medium">Filtering...</span>
          </div>
        )}

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
                      checked={selectedApplications.size === applications.filter((app: RecruiterApplication) => app.status !== 'withdrawn' && !app.isWithdrawn).length && applications.some((app: RecruiterApplication) => app.status !== 'withdrawn' && !app.isWithdrawn)}
                      onChange={handleSelectAll}
                      disabled={!applications.some((app: RecruiterApplication) => app.status !== 'withdrawn' && !app.isWithdrawn)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Candidate</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Match Score</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Analysis Status</th>
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
                  const isWithdrawn = application.status === 'withdrawn' || application.isWithdrawn;

                  console.log('[RecruiterTable] Application row:', {
                    id: application._id,
                    analysisStatus: application.analysisStatus,
                    matchScore: application.matchScore,
                    matchedSkillsCount: application.matchedSkills?.length || 0,
                    matchAnalyzedAt: application.matchAnalyzedAt,
                  });

                  return (
                    <React.Fragment key={application._id}>
                      <tr className={`hover:bg-gray-50 ${isSelected ? 'bg-indigo-50' : ''}`}>
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectOne(application._id)}
                            disabled={isWithdrawn}
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
                          {application.analysisStatus === 'analyzed' ? (
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                              AI Analyzed
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              No Analysis
                            </span>
                          )}
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
                              e.target.value as 'applied' | 'shortlisted' | 'interview' | 'rejected' | 'hired' | 'offer'
                            )}
                            disabled={updateStatusMutation.isPending || isWithdrawn}
                            className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${getStatusColor(application.status)} disabled:opacity-50`}
                          >
                            <option value="applied">Applied</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="interview">Interview</option>
                            <option value="rejected">Rejected</option>
                            <option value="hired">Hired</option>
                            {isWithdrawn && <option value="withdrawn">Withdrawn</option>}
                            
                          </select>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setViewingDetailsId(application._id)}
                              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                            >
                              Details
                            </button>
                            <Link
                              to={`/recruiter/application/${application._id}`}
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
        {viewingDetailsId && (() => {
          if (drawerLoading) {
            return (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl p-8">
                  <LoadingSpinner text="Loading details..." />
                </div>
              </div>
            );
          }
          
          const viewingDetails = drawerData?.data?.application;
          const applicant = drawerData?.data?.candidate;
          
          if (!viewingDetails || !applicant) {
            return (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl p-8">
                  <p className="text-gray-600">Application not found</p>
                  <button
                    onClick={() => setViewingDetailsId(null)}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg"
                  >
                    Close
                  </button>
                </div>
              </div>
            );
          }
          
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
                    onClick={() => setViewingDetailsId(null)}
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
                        {viewingDetails.matchedSkills.map((skill: string, idx: number) => (
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
                        {viewingDetails.missingSkills.map((skill: string, idx: number) => (
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
                    {(viewingDetails.status === 'withdrawn' || viewingDetails.isWithdrawn) ? (
                      <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        This candidate withdrew the application. Status updates are disabled.
                      </p>
                    ) : (
                      <div className="flex gap-2">
                        {['shortlisted', 'interview', 'rejected'].map((status) => (
                          <button
                            key={status}
                            onClick={() => {
                              handleStatusChange(
                                viewingDetails._id, 
                                status as 'shortlisted' | 'interview' | 'rejected'
                              );
                              setViewingDetailsId(null);
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
                    )}
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-200 flex justify-between bg-gray-50">
                  <Link
                    to={`/recruiter/application/${viewingDetails._id}`}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                    onClick={() => setViewingDetailsId(null)}
                  >
                    View Full Profile
                  </Link>
                  <button
                    onClick={() => setViewingDetailsId(null)}
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
