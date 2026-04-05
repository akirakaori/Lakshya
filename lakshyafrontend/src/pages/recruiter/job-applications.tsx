import React, { useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
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
import { PaginationControls, PageSizeSelect } from '../../components/pagination';

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

const panelClass = 'rounded-sm border border-slate-300 bg-white';
const inputClass =
  'w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-[#3b4bb8]';
const selectClass =
  'rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-[#3b4bb8]';
const subtleButtonClass =
  'inline-flex items-center justify-center rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50';
const primaryButtonClass =
  'inline-flex items-center justify-center rounded-sm border border-[#3b4bb8] bg-[#3b4bb8] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2e3a94]';

const JobApplications: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();

  const [activeTab, setActiveTab] = useState<'all' | 'applied' | 'shortlisted' | 'interview' | 'rejected' | 'hired' | 'withdrawn'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'match' | 'experience'>('newest');
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  const [viewingDetailsId, setViewingDetailsId] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [minScoreInput, setMinScoreInput] = useState<number>(0);
  const [mustHaveSkillInput, setMustHaveSkillInput] = useState('');
  const [missingSkillInput, setMissingSkillInput] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [analysisStatusInput, setAnalysisStatusInput] = useState<'all' | 'analyzed' | 'not_analyzed'>('all');

  const [appliedSearch, setAppliedSearch] = useState<string | undefined>(undefined);
  const [appliedMinScore, setAppliedMinScore] = useState<number | undefined>(undefined);
  const [appliedMustHave, setAppliedMustHave] = useState<string | undefined>(undefined);
  const [appliedMissing, setAppliedMissing] = useState<string | undefined>(undefined);
  const [appliedAnalysisStatus, setAppliedAnalysisStatus] = useState<'analyzed' | 'not_analyzed' | undefined>(undefined);

  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  const { data, isLoading, isFetching } = useRecruiterJobApplications(jobId || '', {
    status: activeTab,
    sort: sortBy,
    search: appliedSearch,
    minScore: appliedMinScore,
    mustHave: appliedMustHave,
    missing: appliedMissing,
    analysisStatus: appliedAnalysisStatus,
    page,
    limit,
  });

  const { data: drawerData, isLoading: drawerLoading } = useQuery({
    queryKey: ['recruiterApplication', viewingDetailsId],
    queryFn: async () => {
      if (!viewingDetailsId) return null;
      const response = await axiosInstance.get(`/recruiter/applications/${viewingDetailsId}`);
      return response.data;
    },
    enabled: !!viewingDetailsId,
    staleTime: 0,
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

  const handlePageChange = (newPage: number) => {
    setSearchParams(prev => {
      prev.set('page', newPage.toString());
      return prev;
    });
  };

  const handleLimitChange = (newLimit: number) => {
    setSearchParams(prev => {
      prev.set('limit', newLimit.toString());
      prev.set('page', '1');
      return prev;
    });
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

    setAppliedAnalysisStatus(nextAppliedAnalysisStatus);
  };

  const clearFilters = () => {
    setSearchInput('');
    setMinScoreInput(0);
    setMustHaveSkillInput('');
    setMissingSkillInput('');
    setAnalysisStatusInput('all');

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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-slate-100 text-slate-700';
      case 'shortlisted':
        return 'bg-emerald-50 text-emerald-700';
      case 'interview':
        return 'bg-[#f0f1ff] text-[#4654c7]';
      case 'rejected':
        return 'bg-red-50 text-red-700';
      case 'hired':
        return 'bg-emerald-50 text-emerald-700';
      case 'offer':
        return 'bg-teal-50 text-teal-700';
      case 'withdrawn':
        return 'bg-amber-50 text-amber-800';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getAnalysisBadgeClass = (isAnalyzed: boolean) =>
    isAnalyzed
      ? 'bg-emerald-50 text-emerald-700'
      : 'bg-slate-100 text-slate-600';

  const getScoreTextClass = (score: number) => {
    if (score >= 85) return 'text-emerald-700';
    if (score >= 70) return 'text-amber-600';
    return 'text-slate-500';
  };

const matchedSkillClass = 'inline-flex items-center rounded-sm border border-slate-200 px-1.5 py-0.5 text-[11px] font-medium text-slate-700';
const missingSkillClass = 'inline-flex items-center rounded-sm border border-red-100 bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-red-700';

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
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/recruiter/manage-jobs"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Jobs
          </Link>

          <h1 className="text-[32px] font-semibold tracking-tight text-slate-900">{job.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{job.companyName}</p>
        </div>

        {/* Tabs + Toolbar */}
        <div className={`${panelClass} mb-6 overflow-hidden`}>
          <div className="border-b border-slate-200">
            <nav className="relative flex overflow-x-auto">
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
                  className={`relative whitespace-nowrap px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'text-[#3b4bb8]'
                      : 'text-slate-500 hover:text-slate-700'
                  } ${
                    activeTab === tab.key ? 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#3b4bb8]' : ''
                  }`}
                >
                  {tab.label}
                  <span className={`ml-2 text-[11px] font-semibold ${
                      activeTab === tab.key
                        ? 'text-[#4654c7]'
                        : 'text-slate-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4">
            {/* Primary Controls */}
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative max-w-md flex-1">
                  <svg
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
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
                      if (e.key === 'Enter') handleApplyFilters();
                    }}
                    className={`pl-10 ${inputClass}`}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="whitespace-nowrap text-sm font-medium text-slate-600">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className={selectClass}
                  >
                    <option value="newest">Newest First</option>
                    <option value="match">Highest Match Score</option>
                    <option value="experience">Most Experience</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <PageSizeSelect value={limit} onChange={handleLimitChange} />

                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`inline-flex items-center gap-2 rounded-sm border px-4 py-2 text-sm font-medium transition-colors ${
                    showAdvancedFilters || activeFilterCount > 0
                      ? 'border-slate-300 bg-[#3b4bb8]/5 text-slate-900'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  Match Filters
                  {activeFilterCount > 0 && (
                    <span className="inline-flex items-center rounded-sm bg-slate-200 px-1.5 py-0.5 text-[11px] font-semibold text-slate-700">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="mt-4 border-t border-slate-200 pt-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Minimum Match Score
                    </label>
                    <select
                      value={minScoreInput}
                      onChange={(e) => setMinScoreInput(parseInt(e.target.value))}
                      className={selectClass + ' w-full'}
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
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Must Have Skill
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., React, Python"
                      value={mustHaveSkillInput}
                      onChange={(e) => setMustHaveSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleApplyFilters();
                      }}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Missing Skill
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Docker, AWS"
                      value={missingSkillInput}
                      onChange={(e) => setMissingSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleApplyFilters();
                      }}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Analysis Status
                    </label>
                    <select
                      value={analysisStatusInput}
                      onChange={(e) => {
                        const next = e.target.value as 'all' | 'analyzed' | 'not_analyzed';
                        setAnalysisStatusInput(next);
                      }}
                      className={selectClass + ' w-full'}
                    >
                      <option value="all">All</option>
                      <option value="analyzed">Analyzed Only</option>
                      <option value="not_analyzed">Not Analyzed</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-3">
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className={subtleButtonClass}
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={handleApplyFilters}
                    className={primaryButtonClass}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}

            {/* Bulk Actions */}
            {selectedApplications.size > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-200 bg-slate-50 px-4 py-3">
                <span className="text-sm font-medium text-slate-700">
                  {selectedApplications.size} selected
                </span>
                <button
                  onClick={() => handleBulkStatusUpdate('shortlisted')}
                  disabled={bulkUpdateMutation.isPending}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-50"
                >
                  Shortlist
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('interview')}
                  disabled={bulkUpdateMutation.isPending}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-50"
                >
                  Interview
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('hired')}
                  disabled={bulkUpdateMutation.isPending}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-50"
                >
                  Hire
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('offer')}
                  disabled={bulkUpdateMutation.isPending}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-50"
                >
                  Offer
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('rejected')}
                  disabled={bulkUpdateMutation.isPending}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => setSelectedApplications(new Set())}
                  className="text-sm font-medium text-slate-500 hover:text-slate-700"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filtering Indicator */}
        {isFetching && !isLoading && (
          <div className="mb-4 flex items-center gap-2 rounded-sm border border-slate-200 bg-slate-50 px-4 py-2">
            <svg className="h-4 w-4 animate-spin text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-medium text-slate-600">Filtering...</span>
          </div>
        )}

        {/* Applications List */}
        {applications.length === 0 ? (
          <EmptyState
            title={activeTab === 'all' ? 'No applications yet' : `No ${activeTab} applications`}
            description={
              activeTab === 'all'
                ? 'Candidates will appear here once they apply for this job.'
                : `No applications in the ${activeTab} stage yet.`
            }
          />
        ) : (
          <div className={`${panelClass} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedApplications.size ===
                            applications.filter((app: RecruiterApplication) => app.status !== 'withdrawn' && !app.isWithdrawn).length &&
                          applications.some((app: RecruiterApplication) => app.status !== 'withdrawn' && !app.isWithdrawn)
                        }
                        onChange={handleSelectAll}
                        disabled={!applications.some((app: RecruiterApplication) => app.status !== 'withdrawn' && !app.isWithdrawn)}
                        className="rounded-sm border-slate-300 text-[#3b4bb8] focus:ring-[#3b4bb8]"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Candidate</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Match Score</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Analysis Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Matched Skills</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Missing Skills</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Experience</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Applied</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {applications.map((application: RecruiterApplication) => {
                    const applicant = typeof application.applicant === 'object'
                      ? (application.applicant as Applicant)
                      : null;

                    const avatarUrl = applicant?.profileImageUrl ? getFileUrl(applicant.profileImageUrl) : null;
                    const initials = applicant ? getInitials(applicant.fullName || applicant.name || 'U') : 'U';
                    const isSelected = selectedApplications.has(application._id);
                    const isWithdrawn = application.status === 'withdrawn' || application.isWithdrawn;
                    const isAnalyzed = application.analysisStatus === 'analyzed' || application.hasMatchAnalysis === true;
                    const matchScoreValue = typeof application.matchScore === 'number' ? application.matchScore : 0;

                    return (
                      <tr
                        key={application._id}
                        className={`transition-colors hover:bg-slate-50 ${isSelected ? 'bg-[#f7f8ff]' : ''}`}
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectOne(application._id)}
                            disabled={isWithdrawn}
                            className="rounded-sm border-slate-300 text-[#3b4bb8] focus:ring-[#3b4bb8]"
                          />
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            {avatarUrl ? (
                              <img src={avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100">
                                <span className="text-sm font-medium text-slate-700">{initials}</span>
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-medium text-slate-900">
                                {applicant?.fullName || applicant?.name || 'Unknown'}
                              </div>
                              <div className="text-sm text-slate-500">{applicant?.email}</div>
                              {applicant?.jobSeeker?.title && (
                                <div className="text-xs text-slate-400">{applicant.jobSeeker.title}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          {isAnalyzed ? (
                            <span className={`text-sm font-semibold ${getScoreTextClass(matchScoreValue)}`}>
                              {matchScoreValue}%
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Not analyzed</span>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-sm px-2 py-1 text-[11px] font-medium ${getAnalysisBadgeClass(isAnalyzed)}`}>
                            {isAnalyzed ? 'Analyzed' : 'Not analyzed'}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex max-w-xs flex-wrap gap-1.5">
                            {application.matchedSkills?.slice(0, 2).map((skill, idx) => (
                              <span key={idx} className={matchedSkillClass}>
                                {skill}
                              </span>
                            ))}
                            {(application.matchedSkills?.length || 0) > 2 && (
                              <span className="text-[11px] font-medium text-slate-500">
                                +{(application.matchedSkills?.length || 0) - 2}
                              </span>
                            )}
                            {!application.matchedSkills || application.matchedSkills.length === 0 && (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex max-w-xs flex-wrap gap-1.5">
                            {application.missingSkills?.slice(0, 2).map((skill, idx) => (
                              <span key={idx} className={missingSkillClass}>
                                {skill}
                              </span>
                            ))}
                            {(application.missingSkills?.length || 0) > 2 && (
                              <span className="text-[11px] font-medium text-red-600">
                                +{(application.missingSkills?.length || 0) - 2}
                              </span>
                            )}
                            {!application.missingSkills || application.missingSkills.length === 0 && (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-600">
                          {application.experienceYears || 0} yrs
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-600">
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
                            className={`rounded-sm px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.04em] outline-none ${getStatusBadgeClass(application.status)} disabled:opacity-50`}
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
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setViewingDetailsId(application._id)}
                              className="text-sm font-medium text-[#3b4bb8] hover:text-[#2e3a94]"
                            >
                              Details
                            </button>
                            <Link
                              to={`/recruiter/application/${application._id}`}
                              className="text-sm font-medium text-slate-600 hover:text-slate-800"
                            >
                              Profile
                            </Link>
                            {applicant?.jobSeeker?.resumeUrl && (
                              <a
                                href={getFileUrl(applicant.jobSeeker.resumeUrl) || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-500 hover:text-slate-700"
                                title="View Resume"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
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

        {/* Pagination Controls */}
        {data?.pagination && (
          <div className="mt-6 flex justify-center">
            <PaginationControls
              pagination={data.pagination}
              onPageChange={handlePageChange}
              isFetching={isFetching}
            />
          </div>
        )}

        {/* Application Details Drawer */}
        {viewingDetailsId && (() => {
          if (drawerLoading) {
            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
                <div className="rounded-sm border border-slate-300 bg-white p-8 shadow-lg">
                  <LoadingSpinner text="Loading details..." />
                </div>
              </div>
            );
          }

          const viewingDetails = drawerData?.data?.application;
          const applicant = drawerData?.data?.candidate;
          const detailsAnalyzed = viewingDetails?.analysisStatus === 'analyzed' || viewingDetails?.hasMatchAnalysis === true;
          const detailsMatchScore = typeof viewingDetails?.matchScore === 'number' ? viewingDetails.matchScore : 0;

          if (!viewingDetails || !applicant) {
            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
                <div className="rounded-sm border border-slate-300 bg-white p-8 shadow-lg">
                  <p className="text-slate-600">Application not found</p>
                  <button
                    onClick={() => setViewingDetailsId(null)}
                    className="mt-4 rounded-sm border border-[#3b4bb8] bg-[#3b4bb8] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2e3a94]"
                  >
                    Close
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
              <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-sm border border-slate-300 bg-white shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {applicant?.fullName || applicant?.name || 'Candidate'}
                    </h3>
                    <p className="text-sm text-slate-500">{applicant?.email}</p>
                  </div>
                  <button
                    onClick={() => setViewingDetailsId(null)}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="max-h-[calc(90vh-180px)] overflow-y-auto px-6 py-5">
                  {/* Match Score Summary */}
                  <div className="mb-6 grid grid-cols-1 gap-px md:grid-cols-3 bg-slate-100 rounded-sm overflow-hidden">
                    <div className="bg-white p-4">
                      <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Match Score</div>
                      <div className="text-2xl font-semibold text-slate-900">
                        {detailsAnalyzed ? `${detailsMatchScore}%` : 'Not analyzed'}
                      </div>
                    </div>
                    <div className="bg-white p-4">
                      <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Matched Skills</div>
                      <div className="text-2xl font-semibold text-slate-900">{viewingDetails.matchedSkills?.length || 0}</div>
                    </div>
                    <div className="bg-white p-4">
                      <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Missing Skills</div>
                      <div className="text-2xl font-semibold text-slate-900">{viewingDetails.missingSkills?.length || 0}</div>
                    </div>
                  </div>

                  {/* Matched Skills */}
                  <div className="mb-6">
                    <h4 className="mb-3 text-sm font-semibold text-slate-900">Matched Skills</h4>
                    {viewingDetails.matchedSkills && viewingDetails.matchedSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {viewingDetails.matchedSkills.map((skill: string, idx: number) => (
                          <span key={idx} className={matchedSkillClass}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm italic text-slate-500">No matched skills recorded</p>
                    )}
                  </div>

                  {/* Missing Skills */}
                  <div className="mb-6">
                    <h4 className="mb-3 text-sm font-semibold text-slate-900">Missing Skills</h4>
                    {viewingDetails.missingSkills && viewingDetails.missingSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {viewingDetails.missingSkills.map((skill: string, idx: number) => (
                          <span key={idx} className={missingSkillClass}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm italic text-slate-500">No missing skills recorded</p>
                    )}
                  </div>

                  {/* Additional Info */}
                  <div className="mb-6 grid grid-cols-1 gap-px md:grid-cols-2 bg-slate-100 rounded-sm overflow-hidden">
                    <div className="bg-white p-4">
                      <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Experience</div>
                      <div className="text-lg font-semibold text-slate-900">{viewingDetails.experienceYears || 0} years</div>
                    </div>
                    <div className="bg-white p-4">
                      <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Applied On</div>
                      <div className="text-lg font-semibold text-slate-900">{formatDate(viewingDetails.createdAt)}</div>
                    </div>
                  </div>

                  {/* Notes */}
                  {viewingDetails.notes && (
                    <div className="mb-6">
                      <h4 className="mb-2 text-sm font-semibold text-slate-900">Recruiter Notes</h4>
                      <div className="rounded-sm border-l-2 border-amber-300 bg-white p-4 pl-3">
                        <p className="whitespace-pre-wrap text-sm text-slate-700">
                          {viewingDetails.notes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Status Update */}
                  <div className="border-t border-slate-200 pt-4">
                    <h4 className="mb-3 text-sm font-semibold text-slate-900">Update Status</h4>
                    {(viewingDetails.status === 'withdrawn' || viewingDetails.isWithdrawn) ? (
                      <p className="rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                        This candidate withdrew the application. Status updates are disabled.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
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
                            className={`rounded-sm border px-4 py-2 text-sm font-medium transition-colors ${
                              viewingDetails.status === status
                                ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                                : status === 'rejected'
                                  ? 'border-red-600 bg-red-600 text-white hover:bg-red-700'
                                  : 'border-[#3b4bb8] bg-[#3b4bb8] text-white hover:bg-[#2e3a94]'
                            }`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
                  <Link
                    to={`/recruiter/application/${viewingDetails._id}`}
                    className="rounded-sm border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    onClick={() => setViewingDetailsId(null)}
                  >
                    View Full Profile
                  </Link>
                  <button
                    onClick={() => setViewingDetailsId(null)}
                    className="rounded-sm border border-slate-300 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
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